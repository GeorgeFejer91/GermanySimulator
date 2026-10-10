"""Put existing authored audition clips into the opt-in review catalogue.

This imports metadata for already-present MP3s only. It never approves a take.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets/voices/candidate-dialogue/manifest.json"
SOURCES = (ROOT / "assets/voices/profile-auditions/manifest.json",
           ROOT / "assets/voices/quiz-segments/manifest.json")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def authored_texts(node):
    if isinstance(node, str):
        yield node
    elif isinstance(node, list):
        for item in node:
            yield from authored_texts(item)
    elif isinstance(node, dict):
        for item in node.values():
            yield from authored_texts(item)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    manifest = json.loads(DEST.read_text(encoding="utf-8"))
    cast = json.loads((ROOT / "For-AI/VOICE-CAST.json").read_text(encoding="utf-8"))
    cast_by_voice = {person["voiceId"]: person for person in
                     cast["characters"] + cast["roleProfiles"]}
    inventory = json.loads((ROOT / "For-AI/VOICE-DIALOGUE-INVENTORY.json").read_text(encoding="utf-8"))
    scripts = set(authored_texts(inventory["pools"]))
    existing_ids = {clip["clipId"] for clip in manifest["clips"]}
    existing_keys = {(clip["voiceId"], clip["text"]): clip for clip in manifest["clips"]}
    if len(existing_ids) != len(manifest["clips"]) or len(existing_keys) != len(manifest["clips"]):
        raise RuntimeError("Candidate manifest has duplicate clip IDs or voice/text pairs")
    additions = []
    seen = {}
    for source_path in SOURCES:
        source = json.loads(source_path.read_text(encoding="utf-8"))
        for clip in source["clips"]:
            key = (clip["voiceId"], clip["text"])
            if key in seen:
                if any(seen[key][field] != clip[field] for field in
                       ("profileId", "referenceSha256", "sha256", "path")):
                    raise RuntimeError(f"Conflicting source versions of {clip['clipId']}")
                continue
            seen[key] = clip
            person = cast_by_voice.get(clip["voiceId"])
            if person is None:
                raise RuntimeError(f"No cast entry for {clip['voiceId']}")
            profile_id = (person.get("secretTunnel") or {}).get("profileId") or person.get("secretTunnelProfileId")
            if (clip["profileId"] != profile_id or
                    clip["referenceSha256"] != person["reference"]["workingReferenceSha256"] or
                    clip["text"] not in scripts):
                raise RuntimeError(f"Cast/reference/authored script mismatch: {clip['clipId']}")
            audio = (ROOT / clip["path"]).resolve(strict=True)
            if not audio.is_relative_to(ROOT) or digest(audio) != clip["sha256"]:
                raise RuntimeError(f"Audition MP3 hash/path mismatch: {clip['clipId']}")
            row = {field: clip[field] for field in
                   ("clipId", "voiceId", "profileId", "text", "referenceSha256",
                    "renderer", "modelRevision", "modelLicense", "durationSeconds",
                    "asr", "asrWordExact", "path", "sha256")}
            row["sourcePool"] = clip["sourcePool"]
            row["provenanceManifest"] = str(source_path.relative_to(ROOT)).replace("\\", "/")
            old = existing_keys.get(key)
            if old:
                if any(old.get(field) != value for field, value in row.items()):
                    raise RuntimeError(f"Candidate conflicts with audition: {clip['clipId']}")
                continue
            if row["clipId"] in existing_ids:
                raise RuntimeError(f"Candidate clip ID already used: {clip['clipId']}")
            additions.append(row)
            existing_ids.add(row["clipId"])
            existing_keys[key] = row
    if args.check:
        if additions:
            raise RuntimeError(f"{len(additions)} authored auditions are missing from candidates")
        print(f"Verified {len(seen)} authored audition candidates")
        return
    manifest["clips"].extend(additions)
    manifest["lineCount"] = len(manifest["clips"])
    contents = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").replace("\n", "\r\n")
    DEST.write_bytes(contents.encode("utf-8"))
    print(f"Added {len(additions)} authored auditions; {manifest['lineCount']} candidate clips")


if __name__ == "__main__":
    main()
