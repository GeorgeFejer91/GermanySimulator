"""Retain German and English name pronunciation in the pinned Piper WASM data."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil

KEEP = {"de_dict", "en_dict", "intonations", "phondata", "phondata-manifest",
        "phonindex", "phontab", "lang/gmw/de", "lang/gmw/en", "lang/gmw/en-US"}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(source, target):
    script = (source / "piper_phonemize.js").read_text(encoding="utf-8")
    match = re.search(r"loadPackage\((\{.*?\})\)", script)
    assert match, "Pinned Emscripten data index missing"
    metadata = json.loads(match.group(1))
    original = (source / "piper_phonemize.data").read_bytes()
    assert len(original) == metadata["remote_package_size"]
    chunks, files, offset = [], [], 0
    for row in metadata["files"]:
        if row["filename"].removeprefix("/espeak-ng-data/") not in KEEP:
            continue
        chunk = original[row["start"]:row["end"]]
        files.append({**row, "start": offset, "end": offset + len(chunk)})
        chunks.append(chunk)
        offset += len(chunk)
    assert len(files) == len(KEEP)
    metadata.update(files=files, remote_package_size=offset)
    script = script[:match.start(1)] + json.dumps(metadata, separators=(",", ":")) + script[match.end(1):]
    target.mkdir(parents=True, exist_ok=True)
    (target / "piper_phonemize.js").write_text(script, encoding="utf-8", newline="\n")
    (target / "piper_phonemize.data").write_bytes(b"".join(chunks))
    shutil.copyfile(source / "piper_phonemize.wasm", target / "piper_phonemize.wasm")
    receipt = {"source": "https://www.npmjs.com/package/@diffusionstudio/piper-wasm/v/1.0.0",
               "version": "1.0.0", "languages": ["de", "en"],
               "original": {name: sha(source / name) for name in
                            ["piper_phonemize.js", "piper_phonemize.data", "piper_phonemize.wasm"]},
               "delivery": {name: {"sha256": sha(target / name), "bytes": (target / name).stat().st_size}
                            for name in ["piper_phonemize.js", "piper_phonemize.data", "piper_phonemize.wasm"]}}
    (target / "delivery.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    print(json.dumps({"originalDataBytes": len(original), "dataBytes": offset}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    args = parser.parse_args()
    build(args.source, args.target)
