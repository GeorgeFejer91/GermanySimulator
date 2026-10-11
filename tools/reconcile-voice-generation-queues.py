"""Derive outstanding quiz/crowd requests from verified private take receipts.

The source CSVs stay unchanged. Saved audio remains private and unapproved.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
AUDIT = HERE / "audit-private-voice-takes.py"
OUTPUT = "GERMANY-SIMULATOR-REMAINING-VOICE-REQUESTS"
QUIZ = "GERMANY-SIMULATOR-QUIZ-FULL-QUEUE"
CROWD = ("GERMANY-SIMULATOR-CROWD-MISSING-GERMANY-216.csv",
         "GERMANY-SIMULATOR-CROWD-MISSING-BERLIN-216.csv")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def as_csv(fields: list[str], rows: list[dict]) -> bytes:
    result = io.StringIO(newline="")
    writer = csv.DictWriter(result, fieldnames=fields, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return result.getvalue().encode("utf-8")


def read_csv(path: Path) -> tuple[list[str], list[dict]]:
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        return list(reader.fieldnames or []), list(reader)


def request_hash(row: dict) -> str:
    if not row.get("profileId") or not row.get("script"):
        raise ValueError("Request lacks a profile UUID or exact script")
    return hashlib.sha256(
        f"{row['profileId']}\0German\0{row['script']}".encode("utf-8")
    ).hexdigest()


def write_or_check(path: Path, data: bytes, check: bool) -> None:
    if check:
        if not path.is_file() or path.read_bytes() != data:
            raise ValueError(f"Derived request file is missing or stale: {path}")
    else:
        temporary = path.with_name(path.name + ".part")
        temporary.write_bytes(data)
        os.replace(temporary, path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", required=True, type=Path)
    parser.add_argument("--game-root", type=Path, default=HERE.parent)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    music = args.music_root.resolve(strict=True)
    game = args.game_root.resolve(strict=True)
    spec = importlib.util.spec_from_file_location("private_voice_take_audit", AUDIT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    verified = module.audit(music, game)
    if verified["errorCount"]:
        raise ValueError(f"Private take audit found {verified['errorCount']} invalid receipts")
    by_hash = {row["requestSha256"]: row for row in verified["verified"]}
    if len(by_hash) != verified["verifiedCount"]:
        raise ValueError("Duplicate private take receipts share a request hash")
    cast = json.loads((music / module.CAST_INDEX).read_text(encoding="utf-8"))
    profiles = {person["voiceId"]: person for person in cast["profiles"]}

    quiz_root = music / QUIZ
    index_fields, index_rows = read_csv(quiz_root / "INDEX.csv")
    if len(index_rows) != 18 or len({row["file"] for row in index_rows}) != 18:
        raise ValueError("Expected 18 distinct current quiz queue files")
    sources = []
    for indexed in index_rows:
        if Path(indexed["file"]).name != indexed["file"] or not indexed["file"].endswith(".csv"):
            raise ValueError("Unsafe quiz queue filename in source index")
        path = quiz_root / indexed["file"]
        if digest(path) != indexed["sha256"]:
            raise ValueError(f"Quiz source queue differs from INDEX.csv: {path.name}")
        sources.append(("quiz", path, int(indexed["requests"])))
    for name in CROWD:
        sources.append(("crowd", music / name, 216))

    output = music / OUTPUT
    if not args.check:
        output.mkdir(exist_ok=True)
    if not output.is_dir():
        raise ValueError(f"Derived output directory is missing: {output}")
    inventory_sha = digest(game / "For-AI/VOICE-DIALOGUE-INVENTORY.json")
    valid_inventory_hashes = module.valid_inventory_hashes(game)
    count = {"quiz": {"source": 0, "saved": 0, "remaining": 0},
             "crowd": {"source": 0, "saved": 0, "remaining": 0}}
    index = []
    matched = []
    expected = {"INDEX.csv", "STATUS.json", "README.md"}
    seen_requests = set()
    for family, source, expected_count in sources:
        fields, rows = read_csv(source)
        if len(rows) != expected_count:
            raise ValueError(f"Source queue count changed: {source.name}")
        remaining = []
        saved = []
        for row in rows:
            if row.get("sourceInventorySha256") not in valid_inventory_hashes:
                raise ValueError(f"Queue inventory has no validated source: {source.name}")
            person = profiles.get(row.get("voiceId"))
            if (not person or row.get("profileId") != person["profileId"] or
                    row.get("referenceSha256") not in
                    {person["originalUploadedAudioSha256"], person["profileReferenceSha256"]}):
                raise ValueError(f"Queue profile/reference differs from cast: {source.name}")
            identity = row.get("requestId") or (source.name, row["voiceId"], row["script"])
            if identity in seen_requests:
                raise ValueError(f"Duplicate source request: {identity}")
            seen_requests.add(identity)
            key = request_hash(row)
            receipt = by_hash.get(key)
            if receipt:
                if receipt["voiceId"] != row["voiceId"]:
                    raise ValueError(f"Saved take has a different speaker: {source.name}")
                saved.append(row)
                matched.append({"family": family, "requestId": row.get("requestId", ""),
                                "voiceId": row["voiceId"], "region": row.get("region", ""),
                                "script": row["script"], "sourceQueue": source.name,
                                "receiptQueue": receipt["queue"],
                                "requestSha256": key, "audioSha256": receipt["audioSha256"],
                                "wordFidelityPercent": receipt["wordFidelityPercent"],
                                "status": "saved_private_take_pending_listening_and_rights"})
            else:
                remaining.append(row)
        count[family]["source"] += len(rows)
        count[family]["saved"] += len(saved)
        count[family]["remaining"] += len(remaining)
        expected.add(source.name)
        data = as_csv(fields, remaining)
        write_or_check(output / source.name, data, args.check)
        index.append({"family": family, "sourceFile": source.name,
                      "sourceSha256": digest(source), "sourceRequests": len(rows),
                      "savedPrivateTakes": len(saved), "remainingRequests": len(remaining),
                      "remainingFile": source.name,
                      "remainingSha256": hashlib.sha256(data).hexdigest()})
    index_fields = ["family", "sourceFile", "sourceSha256", "sourceRequests",
                    "savedPrivateTakes", "remainingRequests", "remainingFile",
                    "remainingSha256"]
    write_or_check(output / "INDEX.csv", as_csv(index_fields, index), args.check)
    report = {"schemaVersion": 1, "status": "generated_request_reconciliation_only",
              "note": "Saved private takes are excluded from remaining CSVs, but still need listening, model/source rights review and game catalog integration. No automatic regeneration or approval.",
              "gameInventorySha256": inventory_sha,
              "acceptedSourceInventorySha256": sorted(valid_inventory_hashes),
              "castSha256": verified["gameCastSha256"],
              "quizSourceIndexSha256": digest(quiz_root / "INDEX.csv"),
              "privateReceiptCount": verified["receiptCount"],
              "verifiedPrivateReceiptCount": verified["verifiedCount"],
              "counts": count, "sourceFiles": index,
              "matchedTakes": matched,
              "otherVerifiedTakes": verified["verifiedCount"] - len({item["requestSha256"] for item in matched})}
    report_data = (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    write_or_check(output / "STATUS.json", report_data, args.check)
    readme = (
        "# Remaining GermanySimulator voice requests\n\n"
        f"Current game dialogue inventory SHA-256: `{inventory_sha}`. The source queues "
        f"retain archived baseline SHA-256 `{module.QUEUE_BASELINE_SHA256}`. The audit verifies that "
        "only three static-patron dialogue entries were added; the quiz and crowd pools are "
        "identical in the two parsed inventories. This directory is a derived handoff.\n\n"
        f"The 18 quiz CSVs contain {count['quiz']['remaining']} remaining exact segments "
        f"from {count['quiz']['source']} requests; {count['quiz']['saved']} already have "
        "hash-verified private Secret Tunnel takes. The two crowd CSVs contain "
        f"{count['crowd']['remaining']} remaining lines. Read `INDEX.csv` to choose "
        "one speaker/region file and verify its hash.\n\n"
        "Render each row's exact `script` with its `profileId` and retain the "
        "`voiceId`, reference hash, source inventory hash, region, renderer/model "
        "license, encoded MP3 hash, and Whisper transcript/word score. Keep "
        "one profile per named character. A score is feedback, not approval or "
        "an instruction to regenerate automatically. The saved takes remain "
        "private because listening and model/source-rights review are pending. "
        "Secret Tunnel receipts can be rechecked with "
        "`tools/audit-private-voice-takes.py`; other renderers must preserve "
        "their own truthful provenance. Run "
        "`tools/reconcile-voice-generation-queues.py --music-root <Music root> --check` "
        "from the current game checkout before using these derived queues.\n"
    )
    write_or_check(output / "README.md", readme.encode("utf-8"), args.check)
    extras = {p.name for p in output.iterdir() if p.is_file()} - expected
    if extras:
        raise ValueError(f"Unexpected stale derived files: {sorted(extras)}")
    print(json.dumps({"check": args.check, "counts": count,
                      "privateReceipts": verified["verifiedCount"],
                      "matchedRequestRows": len(matched),
                      "otherVerifiedTakes": report["otherVerifiedTakes"]}))


if __name__ == "__main__":
    main()
