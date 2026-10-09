"""Refresh the Music voice handoff's cast projection without losing corpus evidence."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


GAME = Path(__file__).resolve().parents[1]
INDEX = "GERMANY-SIMULATOR-CAST-INDEX.json"
PATRONS = {
    "amt-konrad-wohnungszettel", "amt-mechthild-elternbogen",
    "amt-wolfram-rentenbescheid",
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", required=True, type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    game_cast_path = GAME / "For-AI/VOICE-CAST.json"
    cast = json.loads(game_cast_path.read_text(encoding="utf-8"))
    people = {person["voiceId"]: person for person in cast["characters"] + cast["roleProfiles"]}
    path = args.music_root.resolve(strict=True) / INDEX
    index = json.loads(path.read_text(encoding="utf-8"))
    if len(people) != index["profileCount"] or len(index["profiles"]) != len(people):
        raise RuntimeError("Game and Music cast profile counts differ")
    seen = set()
    for row in index["profiles"]:
        voice_id = row["voiceId"]
        if voice_id in seen or voice_id not in people:
            raise RuntimeError(f"Music cast contains an unknown or duplicate voice ID: {voice_id}")
        seen.add(voice_id)
        person = people[voice_id]
        profile_id = person.get("secretTunnel", {}).get("profileId") or person.get("secretTunnelProfileId")
        reference = person["reference"]
        if (row["profileId"] != profile_id or row["fullName"] != person["fullName"] or
                row["characterGender"] != person["gender"] or
                row["referenceSha256"] != reference["workingReferenceSha256"] or
                row["sourceEmotionLabel"] != reference["emotionLabel"]):
            raise RuntimeError(f"Music profile identity or source changed: {voice_id}")
        row["generalDemeanor"] = person["generalDemeanor"]
        row["targetValence"] = person["targetValence"]
        row["targetArousal"] = person["targetArousal"]
        if voice_id in PATRONS:
            row["runtimeStatus"] = person["status"]
    index["castSourceSha256"] = hashlib.sha256(game_cast_path.read_bytes()).hexdigest()
    rendered = json.dumps(index, ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if path.read_text(encoding="utf-8") != rendered:
            raise RuntimeError("Music cast index differs from the game cast")
        print(f"Verified {len(seen)} Music cast profiles")
    else:
        path.write_text(rendered, encoding="utf-8")
        print(f"Updated {len(seen)} Music cast profiles")


if __name__ == "__main__":
    main()
