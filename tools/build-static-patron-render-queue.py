"""Prepare three missing Bürgeramt voices for a rights-cleared renderer handoff.

This creates requests, not playable audio or approval decisions. Each request
uses the existing character's saved Secret Tunnel reference and audition text.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
from pathlib import Path


GAME_ROOT = Path(__file__).resolve().parents[1]
REQUESTS = {
    "amt-konrad-wohnungszettel": "Ich habe alle Unterlagen dabei. Hoffentlich reicht das.",
    "amt-mechthild-elternbogen": "Ich warte auf die Bestätigung für mein Kind.",
    "amt-wolfram-rentenbescheid": "Mein Bescheid ist seit drei Wochen unterwegs.",
}
FIELDS = [
    "voiceId", "fullName", "gameRole", "gender", "generalDemeanor",
    "targetValence", "targetArousal", "sourceEmotion", "sourceLicense",
    "profileId", "referencePath", "referenceSha256", "script", "requestStatus",
    "gameCastSha256", "gameInventorySha256",
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", required=True, type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    music = args.music_root.resolve(strict=True)
    cast_path = GAME_ROOT / "For-AI/VOICE-CAST.json"
    cast = json.loads(cast_path.read_text(encoding="utf-8"))
    inventory_path = GAME_ROOT / "For-AI/VOICE-DIALOGUE-INVENTORY.json"
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    authored = inventory["pools"]["buergeramtPatrons"]
    roles = {person["voiceId"]: person for person in cast["roleProfiles"]}
    konrad_manifest = json.loads((music / "GermanySimulator additional visual cast references 2026-10-08/AUDITIONS-MANIFEST.json").read_text(encoding="utf-8"))
    audition_text = {item["character_id"]: item["source_text"] for item in konrad_manifest["clips"]}
    with (music / "GERMANY-SIMULATOR-STATIC-PATRON-AUDITIONS-2.csv").open(encoding="utf-8", newline="") as stream:
        audition_text.update({item["voiceId"]: item["sourceText"] for item in csv.DictReader(stream)})
    if set(audition_text) != set(REQUESTS):
        raise RuntimeError("The static-patron audition source set changed")

    rows = []
    for voice_id, script in REQUESTS.items():
        person = roles[voice_id]
        line = authored[voice_id]
        if (audition_text[voice_id] != script or line["voiceId"] != voice_id or
                line["fullName"] != person["fullName"] or
                [item["line"] for item in line["lines"]] != [script]):
            raise RuntimeError(f"Audition or authored game text changed for {voice_id}")
        profile_id = person["secretTunnelProfileId"]
        reference_rel = f"Secret Tunnel shared voice data/profiles/{profile_id}/reference.wav"
        reference_path = music / reference_rel
        reference_hash = person["reference"]["workingReferenceSha256"]
        if sha256(reference_path) != reference_hash:
            raise RuntimeError(f"Saved reference differs from cast for {voice_id}")
        rows.append({
            "voiceId": voice_id,
            "fullName": person["fullName"],
            "gameRole": person["gameRole"],
            "gender": person["gender"],
            "generalDemeanor": person["generalDemeanor"],
            "targetValence": person["targetValence"],
            "targetArousal": person["targetArousal"],
            "sourceEmotion": person["reference"]["emotionLabel"],
            "sourceLicense": person["reference"]["license"],
            "profileId": profile_id,
            "referencePath": reference_rel,
            "referenceSha256": reference_hash,
            "script": script,
            "requestStatus": "new_rights_cleared_render_needed",
            "gameCastSha256": sha256(cast_path),
            "gameInventorySha256": sha256(inventory_path),
        })

    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(buffer, FIELDS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    destination = music / "GERMANY-SIMULATOR-STATIC-PATRON-RENDER-QUEUE.csv"
    rendered = buffer.getvalue()
    if args.check:
        if destination.read_text(encoding="utf-8") != rendered:
            raise RuntimeError("Static-patron render queue differs from current cast and audition sources")
        print(f"Verified {len(rows)} static-patron requests")
    else:
        destination.write_text(rendered, encoding="utf-8")
        print(f"Wrote {destination}: {len(rows)} static-patron requests")


if __name__ == "__main__":
    main()
