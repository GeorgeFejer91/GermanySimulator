"""Refresh the Music voice handoff's cast projection without losing corpus evidence."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


GAME = Path(__file__).resolve().parents[1]
INDEX = "GERMANY-SIMULATOR-CAST-INDEX.json"
HISTORICAL_PROFILES = {
    "amt-erna-frist": ("88c9f2638a954f59b33a74dc6ec48f10", "Erna Frist"),
    "amt-ottilie-durchschlag": ("1ec70124423e4b9c985866dc0b978a28", "Ottilie Durchschlag"),
    "amt-hedwig-zustaendig": ("5dfbf1a66def407fa5ec2a700c1fd311", "Hedwig Zuständig"),
}
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
    rows = index["profiles"]
    if index["profileCount"] != len(rows):
        raise RuntimeError("Music cast profileCount differs from its rows")
    if len(people) != len(cast["characters"]) + len(cast["roleProfiles"]):
        raise RuntimeError("Game cast contains duplicate voice IDs")
    archived_ids = set(cast["preservedProfileIds"]) | {row["profileId"] for row in cast["retiredProfiles"]}
    seen = set()
    for row in index["profiles"]:
        voice_id = row["voiceId"]
        if voice_id in seen:
            raise RuntimeError(f"Music cast contains a duplicate voice ID: {voice_id}")
        seen.add(voice_id)
        if voice_id not in people:
            historical = HISTORICAL_PROFILES.get(voice_id)
            if (historical != (row["profileId"], row["fullName"]) or
                    row["profileId"] not in archived_ids or voice_id in cast["productionVoices"]):
                raise RuntimeError(f"Music cast contains an unverified historical voice ID: {voice_id}")
            continue
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
        candidates = person.get("secretTunnel", {}).get("candidateProfiles")
        if candidates:
            row["candidateProfiles"] = candidates
        if voice_id in PATRONS:
            row["runtimeStatus"] = person["status"]
    if not people.keys() <= seen:
        raise RuntimeError("Music cast is missing a current game voice ID")
    index["castSourceSha256"] = hashlib.sha256(game_cast_path.read_bytes()).hexdigest()
    # The existing corpus rows retain historical evidence; generation uses the
    # current, hash-bound production projection rather than those primary UUIDs.
    index["profilesStatus"] = "historical primary references; use productionVoices for generation"
    index["productionVoices"] = cast["productionVoices"]
    index["productionExceptions"] = cast["productionExceptions"]
    index["preservedProfileIds"] = cast["preservedProfileIds"]
    index["retiredProfileIds"] = [row["profileId"] for row in cast["retiredProfiles"]]
    rendered = json.dumps(index, ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if path.read_text(encoding="utf-8") != rendered:
            raise RuntimeError("Music cast index differs from the game cast")
        print(f"Verified {len(people)} current / {len(seen) - len(people)} historical Music cast profiles")
    else:
        path.write_text(rendered, encoding="utf-8")
        print(f"Updated {len(people)} current / {len(seen) - len(people)} historical Music cast profiles")


if __name__ == "__main__":
    main()
