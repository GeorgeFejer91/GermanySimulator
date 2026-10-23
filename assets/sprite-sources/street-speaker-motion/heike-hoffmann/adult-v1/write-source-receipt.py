"""Record Heike's immutable adult source attempts and their reference roles."""

from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
BERLIN = Path("assets/sprite-sources/berlin-street-20261022")
STANDING = BERLIN / "quiz-heike-hoffmann-expressionist-standing-v1.png"
DIRECTIONS = BERLIN / "quiz-heike-hoffmann-expressionist-directions-v1.png"
CONTACTS = BERLIN / "quiz-heike-hoffmann-expressionist-side-contacts-v1.png"
OLD_KEYS = Path("assets/sprite-sources/street-quiz/heike-hoffmann-keys.png")
OUTPUTS = [
    ("turns-v1", BERLIN / "quiz-heike-hoffmann-expressionist-turns-v1.png", "turns-v1-exact-prompt.txt", [
        (STANDING, "binding adult front identity, anatomy, clothes, props, paint"),
        (DIRECTIONS, "binding cardinal costume, rear/profile continuity, anatomical prop hands"),
        (CONTACTS, "adult oblique proportions and held objects"),
    ]),
    ("keys-gesture-v1", BERLIN / "quiz-heike-hoffmann-expressionist-keys-gesture-v1.png", "keys-gesture-v1-exact-prompt.txt", [
        (STANDING, "binding adult identity, full-body anatomy and painterly finish"),
        (OLD_KEYS, "key/elbow action semantics only; old body proportion excluded"),
        (DIRECTIONS, "adult costume and anatomical prop hand ownership"),
    ]),
    ("keys-intermediate-v1", BERLIN / "quiz-heike-hoffmann-expressionist-keys-intermediate-v1.png", "keys-intermediate-v1-exact-prompt.txt", [
        (STANDING, "binding adult front identity, anatomy, costume, paint and planted soles"),
        (BERLIN / "quiz-heike-hoffmann-expressionist-keys-gesture-v1.png", "binding chest-height key-gesture endpoint and left card ownership"),
        (DIRECTIONS, "adult costume and view continuity"),
    ]),
]


def digest(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def image_metrics(path):
    with Image.open(ROOT / path) as source:
        im = source.convert("RGBA")
    data = np.asarray(im)
    alpha = data[:, :, 3]
    mask = alpha >= 128
    groups, count = label(mask, np.ones((3, 3), dtype=int))
    components = []
    for index in range(1, count + 1):
        ys, xs = np.nonzero(groups == index)
        components.append({"alpha128Pixels": int(len(xs)),
                           "boundsXYXY": [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]})
    components.sort(key=lambda part: part["alpha128Pixels"], reverse=True)
    return {"dimensions": list(im.size), "mode": "RGBA", "alphaZeroPixels": int((alpha == 0).sum()),
            "alpha128Components": components,
            "borderAlphaMax": int(max(alpha[0].max(), alpha[-1].max(), alpha[:, 0].max(), alpha[:, -1].max())),
            "hiddenRGBAtAlphaZero": int(np.count_nonzero(np.any(data[:, :, :3][alpha == 0], axis=1)))}


def main():
    jobs = []
    for name, path, request, references in OUTPUTS:
        jobs.append({
            "name": name,
            "generator": "built-in image_gen; one job per source, no automated retry",
            "trackedRawCopy": path.as_posix(),
            "rawCopySha256": digest(path),
            "savedRequest": {"file": (Path(__file__).parent.relative_to(ROOT) / request).as_posix(),
                             "sha256": digest(Path(__file__).parent.relative_to(ROOT) / request),
                             "precision": ("exact submitted imagegen prompt saved before invocation" if name == "keys-intermediate-v1" else
                                           "exact submitted imagegen template-literal prompt recovered read-only from this worker's own Codex session JSONL")},
            "sessionCallRow": {"turns-v1": 6122, "keys-gesture-v1": 6617}.get(name),
            "generatedOriginalPath": ("C:/Users/cogpsy-vrlab/.codex/generated_images/01a165e9-4b7f-71c2-b31c-2a6ca2a8d0f8/exec-493b1dc5-4451-4e12-9b53-8c13b9c12e3b.png"
                                      if name == "keys-intermediate-v1" else None),
            "references": [{"file": ref.as_posix(), "sha256": digest(ref), "role": role}
                           for ref, role in references],
            "image": image_metrics(path),
            "review": "source-only provisional; native family, action interpolation, runtime and mobile gates pending",
        })
    record = {"schemaVersion": 1, "actorId": "quiz-heike-hoffmann",
              "scope": "adult source attempts generated in isolated Heike worktree",
              "jobs": jobs,
              "limitations": ["The copied PNGs are the preserved raw RGBA attempts.",
                              "Earlier generated temporary paths for turns and raised gesture have not yet been recovered; their exact submitted prompts are stored beside this receipt. The distinct preflight request drafts are also retained."]}
    (HERE / "source-generation-receipt.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
