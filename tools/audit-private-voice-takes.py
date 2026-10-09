"""Verify Secret Tunnel take receipts against the current game cast and queues.

This is a read-only intake check for private generated audio. It does not mark
clips approved, copy them into the game, or infer commercial-use permission.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path


RESULTS = "GermanySimulator Whisper-scored private candidates 2026-10-08"
CAST_INDEX = "GERMANY-SIMULATOR-CAST-INDEX.json"


def digest(path: Path) -> str:
    result = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def child_file(parent: Path, name: str, suffix: str) -> Path:
    if not isinstance(name, str) or Path(name).name != name or not name.endswith(suffix):
        raise ValueError(f"Unsafe receipt filename: {name!r}")
    path = (parent / name).resolve(strict=True)
    if path.parent != parent.resolve() or not path.is_file():
        raise ValueError(f"Receipt file leaves its take directory: {name!r}")
    return path


def queue_rows(music: Path, names: set[str]) -> dict[str, list[dict]]:
    queues = {}
    for name in names:
        if Path(name).name != name or not name.endswith(".csv"):
            raise ValueError(f"Unsafe request queue name: {name!r}")
        options = [music / name, music / "GERMANY-SIMULATOR-QUIZ-FULL-QUEUE" / name]
        matches = [path for path in options if path.is_file()]
        if len(matches) != 1:
            raise ValueError(f"Request queue missing or ambiguous: {name}")
        path = matches[0]
        with path.open("r", encoding="utf-8-sig", newline="") as stream:
            queues[name] = list(csv.DictReader(stream))
    return queues


def verify_receipt(receipt: Path, music: Path, profiles: dict,
                   queues: dict, inventory_sha: str) -> dict:
    take = json.loads(receipt.read_text(encoding="utf-8"))
    voice_id = take["voiceId"]
    profile = profiles.get(voice_id)
    if profile is None:
        raise ValueError("Voice ID is absent from the audited cast")
    if (receipt.parent.parent.name != voice_id or
            receipt.parent.name != take["requestSha256"][:16]):
        raise ValueError("Receipt directory does not match voice/request identity")
    if (take.get("schemaVersion") != 1 or
            take.get("status") != "private_candidate_pending_listening" or
            take.get("commercialUseStatus") != "not_cleared" or
            take.get("listeningStatus") != "pending" or
            take.get("gameCatalogueStatus") != "not_integrated"):
        raise ValueError("Take status changed; a separate review is required")
    if any(take.get(key) != profile[expected] for key, expected in (
            ("profileId", "profileId"), ("profileName", "profileName"),
            ("originalUploadedAudioSha256", "originalUploadedAudioSha256"),
            ("profileReferenceSha256", "profileReferenceSha256"))):
        raise ValueError("Take profile or reference differs from current cast")
    source_text = take["sourceText"]
    request_sha = hashlib.sha256(
        f"{profile['profileId']}\0German\0{source_text}".encode("utf-8")
    ).hexdigest()
    if take["requestSha256"] != request_sha:
        raise ValueError("Request hash differs from exact text/profile")
    rows = queues.get(take["queue"])
    line = take.get("queueLine")
    if rows is None or not isinstance(line, int) or not 2 <= line <= len(rows) + 1:
        raise ValueError("Source queue or row no longer exists")
    source_row = rows[line - 2]
    if take["sourceRow"] != source_row:
        raise ValueError("Source request row changed; regenerate/reconcile the queue")
    if any(source_row.get(key) != value for key, value in (
            ("voiceId", voice_id), ("profileId", profile["profileId"]),
            ("referenceSha256", profile["originalUploadedAudioSha256"]))):
        raise ValueError("Queue identity or source reference differs from cast")
    if (source_row.get("script") or source_row.get("sourceText")) != source_text:
        raise ValueError("Queue script differs from generated text")
    if (source_row.get("sourceInventorySha256") and
            source_row["sourceInventorySha256"] != inventory_sha):
        raise ValueError("Queue was made from an older game dialogue inventory")

    audio = child_file(receipt.parent, take["audioFile"], ".mp3")
    metadata = child_file(receipt.parent, take["speechMetadataFile"], ".json")
    if digest(audio) != take["audioSha256"] or audio.stat().st_size != take["audioBytes"]:
        raise ValueError("MP3 bytes or hash differ from receipt")
    if digest(metadata) != take["speechMetadataSha256"]:
        raise ValueError("Speech metadata hash differs from receipt")
    speech = json.loads(metadata.read_text(encoding="utf-8"))
    if any(speech.get(key) != value for key, value in (
            ("voice_id", profile["profileId"]), ("voice_name", profile["profileName"]),
            ("reference_sha256", profile["profileReferenceSha256"]),
            ("text", source_text), ("language", "German"),
            ("clip_id", take["originalClipId"]), ("engine", take["renderer"]),
            ("model", take["rendererModel"]), ("duration_s", take["durationSeconds"]))):
        raise ValueError("Original speech metadata contradicts receipt")
    score = take.get("wordFidelity")
    if not isinstance(score, dict) or speech.get("word_fidelity") != score:
        raise ValueError("Whisper feedback differs from original speech metadata")
    if score.get("status") == "scored":
        percent = score.get("percent")
        if not isinstance(percent, int) or not 0 <= percent <= 100 or not score.get("transcript"):
            raise ValueError("Invalid scored Whisper result")
        suffix = f"wf{percent}"
    elif score.get("status") == "unavailable":
        percent = None
        suffix = "wf-unavailable"
    else:
        raise ValueError("Unknown Whisper feedback status")
    if not audio.name.endswith(f"__{suffix}.mp3"):
        raise ValueError("MP3 filename does not encode its Whisper feedback")
    return {"voiceId": voice_id, "queue": take["queue"],
            "requestSha256": request_sha, "audioSha256": take["audioSha256"],
            "wordFidelityPercent": percent, "status": "verified_private_candidate"}


def audit(music: Path, game: Path) -> dict:
    music = music.resolve(strict=True)
    game = game.resolve(strict=True)
    cast_path = game / "For-AI/VOICE-CAST.json"
    inventory_path = game / "For-AI/VOICE-DIALOGUE-INVENTORY.json"
    cast_index = json.loads((music / CAST_INDEX).read_text(encoding="utf-8"))
    if cast_index["castSourceSha256"] != digest(cast_path):
        raise ValueError("Music cast index differs from current game cast")
    profiles = {row["voiceId"]: row for row in cast_index["profiles"]}
    if len(profiles) != cast_index["profileCount"]:
        raise ValueError("Cast index has duplicate or missing profiles")
    receipts_root = (music / RESULTS).resolve(strict=True)
    receipts = sorted(receipts_root.rglob("take.json"))
    names = {json.loads(path.read_text(encoding="utf-8"))["queue"] for path in receipts}
    queues = queue_rows(music, names)
    inventory_sha = digest(inventory_path)
    verified, errors = [], []
    for receipt in receipts:
        try:
            verified.append(verify_receipt(receipt, music, profiles, queues, inventory_sha))
        except (KeyError, ValueError, OSError, json.JSONDecodeError, TypeError) as error:
            errors.append({"receipt": str(receipt.relative_to(music)), "error": str(error)})
    return {"schemaVersion": 1, "gameCastSha256": digest(cast_path),
            "gameInventorySha256": inventory_sha, "receiptCount": len(receipts),
            "verifiedCount": len(verified), "errorCount": len(errors),
            "byVoice": dict(sorted(Counter(row["voiceId"] for row in verified).items())),
            "verified": verified, "errors": errors,
            "notice": "Private candidates only; Whisper words are feedback, not audible or rights approval."}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", required=True, type=Path)
    parser.add_argument("--game-root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    result = audit(args.music_root.resolve(strict=True), args.game_root.resolve(strict=True))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 1 if result["errorCount"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
