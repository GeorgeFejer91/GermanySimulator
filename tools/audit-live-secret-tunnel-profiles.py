"""Check all GermanySimulator cast profiles against the installed Secret Tunnel."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path


GAME = Path(__file__).resolve().parents[1]
CAST_INDEX = "GERMANY-SIMULATOR-CAST-INDEX.json"
REPORT = "GERMANY-SIMULATOR-LIVE-SECRET-TUNNEL-PROFILES.json"


def digest(path: Path) -> str:
    result = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def voice_request(exe: Path, resources: Path, operation: str) -> dict:
    environment = os.environ.copy()
    environment.pop("VOICE_CLONER_DATA", None)
    environment["SECRET_TUNNEL_VOICE_RESOURCE_DIR"] = str(resources)
    result = subprocess.run(
        [str(exe), "--voice-cli"],
        input=json.dumps({"operation": operation, "input": {}}),
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        env=environment, timeout=60, check=False,
    )
    if result.returncode or not result.stdout:
        raise RuntimeError(f"Secret Tunnel {operation} failed: {result.stderr[-400:]}")
    response = json.loads(result.stdout)
    if not response.get("ok"):
        raise RuntimeError(f"Secret Tunnel {operation} rejected the request")
    return response["result"]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", required=True, type=Path)
    parser.add_argument("--secret-tunnel-exe", required=True, type=Path)
    parser.add_argument("--voice-resources", required=True, type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    music = args.music_root.resolve(strict=True)
    exe = args.secret_tunnel_exe.resolve(strict=True)
    resources = args.voice_resources.resolve(strict=True)
    shared = (music / "Secret Tunnel shared voice data").resolve(strict=True)
    configured = (exe.parent / "voice-data-root.txt").read_text(encoding="utf-8-sig").strip()
    if Path(configured).resolve(strict=True) != shared:
        raise RuntimeError("Installed Secret Tunnel points at a different voice data root")
    index_path = music / CAST_INDEX
    index = json.loads(index_path.read_text(encoding="utf-8"))
    if (index["castSourceSha256"] != digest(GAME / "For-AI/VOICE-CAST.json") or
            index["profileCount"] != 56 or len(index["profiles"]) != 56):
        raise RuntimeError("Music cast index differs from the current 56-profile game cast")
    status = voice_request(exe, resources, "status")
    if not status.get("runtimeReady") or not status.get("asrReady"):
        raise RuntimeError("Installed voice runtime or Whisper verifier is unavailable")
    listed = voice_request(exe, resources, "list")["profiles"]
    by_id = {item["id"]: item for item in listed}
    if len(by_id) != len(listed):
        raise RuntimeError("Secret Tunnel returned duplicate profile UUIDs")
    rows = []
    for person in index["profiles"]:
        profile_id = person["profileId"]
        if not re.fullmatch(r"[0-9a-f]{32}", profile_id):
            raise RuntimeError(f"Invalid audited profile UUID: {profile_id}")
        directory = (shared / "profiles" / profile_id).resolve(strict=True)
        if directory.parent != (shared / "profiles").resolve():
            raise RuntimeError("Profile path left the shared data root")
        saved = json.loads((directory / "profile.json").read_text(encoding="utf-8"))
        live = by_id.get(profile_id)
        if live is None:
            raise RuntimeError(f"Secret Tunnel lacks {person['voiceId']}")
        for record in (saved, live):
            if any(record.get(key) != value for key, value in (
                    ("id", profile_id), ("name", person["profileName"]),
                    ("original_sha256", person["originalUploadedAudioSha256"]),
                    ("reference_sha256", person["profileReferenceSha256"]),
                    ("saved", True))):
                raise RuntimeError(f"Secret Tunnel identity/reference drift: {person['voiceId']}")
        if (digest(directory / "original.wav") != person["originalUploadedAudioSha256"] or
                digest(directory / "reference.wav") != person["profileReferenceSha256"]):
            raise RuntimeError(f"Secret Tunnel profile audio changed: {person['voiceId']}")
        rows.append({"voiceId": person["voiceId"], "fullName": person["fullName"],
                     "profileId": profile_id, "profileName": person["profileName"],
                     "originalUploadedAudioSha256": person["originalUploadedAudioSha256"],
                     "profileReferenceSha256": person["profileReferenceSha256"],
                     "status": "live_and_on_disk_hash_match"})
    report = {"schemaVersion": 1, "status": "live_installed_profile_verification",
              "note": "Read-only verification of cast UUID/name and both reference WAV hashes. It does not approve generated speech or change user profiles.",
              "gameCastSha256": digest(GAME / "For-AI/VOICE-CAST.json"),
              "musicCastIndexSha256": digest(index_path),
              "installedExecutableSha256": digest(exe),
              "installedVoiceResources": str(resources),
              "sharedVoiceDataRoot": str(shared),
              "runtimeReady": True, "asrReady": True,
              "expectedProfiles": 56, "matchedProfiles": len(rows),
              "otherSecretTunnelProfileCount": len(listed) - len(rows),
              "profiles": rows}
    output = music / REPORT
    contents = (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    if args.check:
        if not output.is_file() or output.read_bytes() != contents:
            raise RuntimeError("Saved live profile audit is stale")
    else:
        temporary = output.with_name(output.name + ".part")
        temporary.write_bytes(contents)
        os.replace(temporary, output)
    print(json.dumps({"check": args.check, "expected": 56,
                      "matched": len(rows), "otherProfiles": len(listed) - len(rows)}))


if __name__ == "__main__":
    main()
