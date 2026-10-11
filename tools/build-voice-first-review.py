"""Select one verified listening candidate per speaking voice profile.

The shortlist prioritizes human review; it never records approval or changes
game playback. A 100% Whisper diagnostic is only a word-check signal.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
QUEUE = "VOICE-CANDIDATE-REVIEW-QUEUE.csv"
NORMALIZED = "GermanySimulator normalized voice review 2026-10-09"
OUTPUT = "VOICE-FIRST-REVIEW-53.csv"
REPORT = "VOICE-FIRST-REVIEW-53.json"
HUMAN_FIELDS = ("heardWords", "speakerIdentityFits", "demeanorFits",
                "intonationFits", "artifactsAbsent", "sourceRightsCleared",
                "approveForGame")
POLICE_GRASS = "polizei-heinrich-wachtmeister-02"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def encode_csv(rows: list[dict]) -> bytes:
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=list(rows[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue().encode("utf-8")


def save_or_check(path: Path, contents: bytes, check: bool) -> None:
    if check:
        if not path.is_file() or path.read_bytes() != contents:
            raise ValueError(f"First-review shortlist is stale: {path}")
    else:
        temporary = path.with_name(path.name + ".part")
        temporary.write_bytes(contents)
        os.replace(temporary, path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", required=True, type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    music = args.music_root.resolve(strict=True)
    queue_path = music / QUEUE
    cast_path = ROOT / "For-AI/VOICE-CAST.json"
    candidate_path = ROOT / "assets/voices/candidate-dialogue/manifest.json"
    normalized_path = music / NORMALIZED / "manifest.json"
    with queue_path.open("r", encoding="utf-8-sig", newline="") as stream:
        queued = list(csv.DictReader(stream))
    cast = json.loads(cast_path.read_text(encoding="utf-8"))
    candidate = json.loads(candidate_path.read_text(encoding="utf-8"))
    normalized = json.loads(normalized_path.read_text(encoding="utf-8"))
    people = {item["voiceId"]: item for item in cast["characters"] + cast["roleProfiles"]}
    clips = {clip["clipId"]: clip for clip in candidate["clips"]}
    copies = {clip["clipId"]: clip for clip in normalized["copies"]}
    if (len(queued) != candidate["lineCount"] or len(clips) != candidate["lineCount"] or
            len(copies) != candidate["lineCount"] or
            normalized["sourceManifestSha256"] != digest(candidate_path)):
        raise ValueError("Candidate, normalized and human-review sets differ")
    by_voice = defaultdict(list)
    for row in queued:
        clip = clips.get(row["clipId"])
        copy = copies.get(row["clipId"])
        person = people.get(row["voiceId"])
        if not clip or not copy or not person:
            raise ValueError(f"Missing candidate owner or copy: {row['clipId']}")
        profile_id = (person.get("secretTunnel") or {}).get("profileId") or person.get("secretTunnelProfileId")
        if (row["profileId"] != profile_id or clip["profileId"] != profile_id or
                clip["voiceId"] != row["voiceId"] or clip["text"] != row["script"] or
                clip["sha256"] != row["mp3Sha256"] or
                copy["outputSha256"] != row["normalizedSha256"] or
                copy["script"] != row["script"]):
            raise ValueError(f"Candidate provenance mismatch: {row['clipId']}")
        by_voice[row["voiceId"]].append(row)
    if len(by_voice) != 53:
        raise ValueError(f"Expected 53 speaking profiles, found {len(by_voice)}")

    selected = []
    for voice_id, options in sorted(by_voice.items()):
        eligible = [row for row in options if row["normalizedWordPercent"] == "100"]
        if not eligible:
            raise ValueError(f"No diagnostic word-exact listening copy for {voice_id}")

        def rank(row: dict):
            clip = clips[row["clipId"]]
            return (0 if row["clipId"] == POLICE_GRASS else 1,
                    row["asrRegressionAfterNormalization"].lower() == "true",
                    row["normalizedProcessingMethod"].startswith("dynamic_"),
                    not clip["asrWordExact"],
                    len(row["script"].split()), row["clipId"])

        choice = min(eligible, key=rank)
        copy = copies[choice["clipId"]]
        listening = (music / NORMALIZED / copy["copyFile"]).resolve(strict=True)
        if (not listening.is_relative_to(music / NORMALIZED) or
                digest(listening) != choice["normalizedSha256"]):
            raise ValueError(f"Listening MP3 changed: {choice['clipId']}")
        person = people[voice_id]
        selected.append({
            "reviewOrder": len(selected) + 1, "voiceId": voice_id,
            "speakerName": person["fullName"], "profileId": choice["profileId"],
            "gender": person["gender"], "demeanor": person["generalDemeanor"],
            "targetValence": person["targetValence"],
            "targetArousal": person["targetArousal"],
            "clipId": choice["clipId"], "script": choice["script"],
            "normalizedReviewFile": choice["normalizedReviewFile"],
            "normalizedSha256": choice["normalizedSha256"],
            "originalMp3Sha256": choice["mp3Sha256"],
            "normalizedWordPercent": choice["normalizedWordPercent"],
            "originalAsrWordExact": choice["asrWordExact"],
            "technicalReviewFlags": choice["technicalReviewFlags"],
            "selectionNote": ("Police grass warning requested for this character"
                              if choice["clipId"] == POLICE_GRASS else
                              "Shortest eligible 100% word-diagnostic take after provenance and processing checks"),
            "humanReviewStatus": "decisions_in_main_review_queue",
        })
    if {row["voiceId"] for row in selected} != set(by_voice):
        raise ValueError("Shortlist does not cover each speaking profile once")
    csv_data = encode_csv(selected)
    provenance = [{key: row[key] for key in ("clipId", "voiceId", "profileId", "script",
                                               "mp3Sha256", "normalizedSha256")}
                  for row in queued]
    report = {"schemaVersion": 1, "status": "human_listening_shortlist_only",
              "note": "One clip per speaking profile. The 100% word diagnostic does not approve audible words, voice identity, demeanor, intonation, artifacts, rights or release.",
              "candidateCount": len(queued), "selectedProfileCount": len(selected),
              "unselectedProfilesWithoutCandidate": sorted(set(people) - set(by_voice)),
              "queueProvenanceSha256": hashlib.sha256(
                  json.dumps(provenance, ensure_ascii=False, sort_keys=True).encode("utf-8")
              ).hexdigest(),
              "castSha256": digest(cast_path),
              "candidateManifestSha256": digest(candidate_path),
              "normalizedManifestSha256": digest(normalized_path),
              "shortlistSha256": hashlib.sha256(csv_data).hexdigest(),
              "allHumanDecisionsRemainIn": QUEUE}
    save_or_check(music / OUTPUT, csv_data, args.check)
    save_or_check(music / REPORT,
                  (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode("utf-8"),
                  args.check)
    print(json.dumps({"check": args.check, "selectedProfiles": len(selected),
                      "profilesWithoutCandidate": len(report["unselectedProfilesWithoutCandidate"]),
                      "policeGrassClip": next(row["clipId"] for row in selected
                                              if row["voiceId"] == "polizei-heinrich-wachtmeister")}))


if __name__ == "__main__":
    main()
