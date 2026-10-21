"""Small, family-local source probe using the existing resident motion builder.

No atlas, manifest, runtime, or shared source spec is written. Output is QA only.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[4]
CONFIG = Path(__file__).with_name("source-fit-v1.json")
OUT = ROOT / "output/ambient-city-animation/irmgard-aktenstapel-motion-v1"
BUILDER = ROOT / "tools/build-resident-motion.py"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(image: Image.Image, name: str, files: dict) -> None:
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    files[name] = sha(path)


def main() -> None:
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    if config["status"] != "candidate-unapproved":
        raise ValueError("Only an unapproved source probe is permitted")
    source_spec = ROOT / config["sourceSpecPath"]
    if sha(source_spec) != config["sourceSpecSha256"]:
        raise ValueError("Shared source spec changed since local snapshot")
    standing = config["standing"]
    if sha(ROOT / standing["path"]) != standing["sha256"]:
        raise ValueError("Published standing changed")
    if sha(ROOT / standing["manifestPath"]) != standing["manifestSha256"]:
        raise ValueError("Published standing manifest changed")

    module_spec = importlib.util.spec_from_file_location("resident_builder", BUILDER)
    builder = importlib.util.module_from_spec(module_spec)
    module_spec.loader.exec_module(builder)
    person = config["person"]
    bindings = builder.source_bindings(person)
    phases = [math.tau * index / config["probe"]["phaseCount"]
              for index in config["probe"]["phaseIndices"]]
    files: dict[str, str] = {}
    observations = []
    export_specs = {
        f"{entry['cell'][0]}x{entry['cell'][1]}": {
            "working": {"figureHeight": 400, "baseline": 472},
            "cell": entry["cell"],
            "figureHeight": entry["figureHeight"],
            "pivot": entry["pivot"],
        }
        for entry in config["probe"]["directExports"]
    }

    for direction in config["probe"]["directions"]:
        registered, _, _ = builder.registered(person, direction)
        save(registered, f"registered/{direction}-512.png", files)
        try:
            frames, records = builder.motion(person, direction, count=16, phases=phases)
        except ValueError as error:
            if hasattr(error, "frame"):
                save(error.frame, f"fail/{direction}-phase-{error.phase}-512.png", files)
            (OUT / "failure.json").write_text(json.dumps({
                "direction": direction, "error": str(error),
                "sourceFitSha256": sha(CONFIG), "builderSha256": sha(BUILDER),
                "files": files,
            }, indent=2) + "\n", encoding="utf-8")
            raise
        sizes = {"512": frames}
        for label, export_spec in export_specs.items():
            sizes[label] = [builder.street.export_cell(frame, export_spec)
                            for frame in frames]
        for label, images in sizes.items():
            for i, image in enumerate(images):
                save(image, f"{direction}/{label}/phase-{config['probe']['phaseIndices'][i]:02d}.png", files)
                observations.append({
                    "direction": direction, "size": label,
                    "phase": config["probe"]["phaseIndices"][i],
                    "bbox": image.getbbox(),
                    "alphaPixels": sum(1 for alpha in image.getchannel("A").getdata() if alpha >= 128),
                })
            for background, suffix in (("#eee8db", "light"), ("#25272b", "dark")):
                save(builder.street.opaque_board(images, 4, background),
                     f"boards/{direction}-{label}-{suffix}.png", files)
        observations.append({"direction": direction, "motionRecords": records})

    turns = []
    for index, entry in enumerate(person["turn_sources"]):
        if "neutral" in entry:
            frame = builder.neutral(person, entry["neutral"])
        else:
            path = ROOT / entry["source"]
            if sha(path) != entry["sourceSha256"]:
                raise ValueError(f"Changed own turn source: {index}")
            frame, _ = builder.street.register_source(
                Image.open(path).convert("RGBA"), entry, entry["scale"], 472)
        turns.append(frame)
    if len(turns) != 8:
        raise ValueError("Expected eight own turn headings")
    for label, images in {
        "512": turns,
        **{label: [builder.street.export_cell(frame, export_spec) for frame in turns]
           for label, export_spec in export_specs.items()},
    }.items():
        for index, image in enumerate(images):
            save(image, f"turns/{label}/heading-{index}.png", files)
        for background, suffix in (("#eee8db", "light"), ("#25272b", "dark")):
            save(builder.street.opaque_board(images, 4, background),
                 f"boards/turns-{label}-{suffix}.png", files)

    (OUT / "receipt.json").write_text(json.dumps({
        "status": "candidate-unapproved",
        "sourceFitSha256": sha(CONFIG),
        "builderSha256": sha(BUILDER),
        "standingSha256": standing["sha256"],
        "sourceBindings": bindings,
        "phaseIndices": config["probe"]["phaseIndices"],
        "turnCount": len(turns),
        "directExports": config["probe"]["directExports"],
        "observations": observations,
        "files": files,
        "limits": ["Source-only still probes; no full atlas or runtime admission",
                   "No independent contact, encoded WebP, physical-device or listening gate"],
    }, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(files)} source probe images to {OUT}")


if __name__ == "__main__":
    main()
