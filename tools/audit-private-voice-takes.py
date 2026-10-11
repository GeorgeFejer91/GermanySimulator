"""Verify Secret Tunnel take receipts against the current game cast and queues.

This is a read-only intake check for private generated audio. It does not mark
clips approved, copy them into the game, or infer commercial-use permission.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
from collections import Counter
from pathlib import Path


RESULTS = "GermanySimulator Whisper-scored private candidates 2026-10-08"
CAST_INDEX = "GERMANY-SIMULATOR-CAST-INDEX.json"
QUEUE_BASELINE = "VOICE-DIALOGUE-INVENTORY-QUEUE-BASELINE.json"
QUEUE_BASELINE_SHA256 = "5c8373587b0c5b686eb2e99e122b3bc2c4e2f00afac3543a62bf2ee2bff4130a"


def digest(path: Path) -> str:
    result = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def valid_inventory_hashes(game: Path) -> set[str]:
    """Preserve exact old requests when only the three static patrons were added."""
    directory = game / "For-AI"
    current_path = directory / "VOICE-DIALOGUE-INVENTORY.json"
    baseline_path = directory / QUEUE_BASELINE
    if digest(baseline_path) != QUEUE_BASELINE_SHA256:
        raise ValueError("Archived source inventory bytes changed")
    current = json.loads(current_path.read_text(encoding="utf-8"))
    baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
    old_pools = baseline["pools"]
    new_pools = current["pools"]
    if ({key: value for key, value in new_pools.items() if key != "buergeramtPatrons"} != old_pools or
            set(new_pools["buergeramtPatrons"]) != {
                "amt-konrad-wohnungszettel", "amt-mechthild-elternbogen",
                "amt-wolfram-rentenbescheid"}):
        raise ValueError("Existing quiz/crowd source pools changed; old queues need reauthoring")
    old_dynamic = {item["voiceId"]: item["sourcePools"] for item in baseline["dynamicIdentityVoiceIds"]}
    new_dynamic = {item["voiceId"]: item["sourcePools"] for item in current["dynamicIdentityVoiceIds"]}
    expected_dynamic = dict(old_dynamic)
    for voice_id in new_pools["buergeramtPatrons"]:
        expected_dynamic[voice_id] = [f"buergeramt-story.js patrons.{voice_id}.lines[0]"]
    if new_dynamic != expected_dynamic:
        raise ValueError("Inventory speaker sources changed outside the three new patrons")
    for key in baseline.keys() | current.keys():
        if key not in {"pools", "dynamicIdentityVoiceIds"} and current.get(key) != baseline.get(key):
            raise ValueError(f"Inventory metadata changed outside the patron addition: {key}")
    return {digest(current_path), QUEUE_BASELINE_SHA256}


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
                   queues: dict, inventory_hashes: set[str]) -> dict:
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
            source_row["sourceInventorySha256"] not in inventory_hashes):
        raise ValueError("Queue inventory lacks a validated current or archived source")

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
    inventory_hashes = valid_inventory_hashes(game)
    verified, errors = [], []
    for receipt in receipts:
        try:
            verified.append(verify_receipt(receipt, music, profiles, queues, inventory_hashes))
        except (KeyError, ValueError, OSError, json.JSONDecodeError, TypeError) as error:
            errors.append({"receipt": str(receipt.relative_to(music)), "error": str(error)})
    return {"schemaVersion": 1, "gameCastSha256": digest(cast_path),
            "gameInventorySha256": inventory_sha, "receiptCount": len(receipts),
            "acceptedSourceInventorySha256": sorted(inventory_hashes),
            "verifiedCount": len(verified), "errorCount": len(errors),
            "byVoice": dict(sorted(Counter(row["voiceId"] for row in verified).items())),
            "verified": verified, "errors": errors,
            "notice": "Private candidates only; Whisper words are feedback, not audible or rights approval."}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", required=True, type=Path)
    parser.add_argument("--game-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--write-report", action="store_true",
                        help="Atomically refresh the Music library's private audit JSON")
    args = parser.parse_args()
    music = args.music_root.resolve(strict=True)
    result = audit(music, args.game_root.resolve(strict=True))
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.write_report:
        if result["errorCount"]:
            raise RuntimeError("Cannot save an audit report with invalid private receipts")
        path = music / "GERMANY-SIMULATOR-PRIVATE-TAKE-AUDIT.json"
        temporary = path.with_name(path.name + ".part")
        temporary.write_text(rendered, encoding="utf-8")
        os.replace(temporary, path)
    print(rendered, end="")
    return 1 if result["errorCount"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
