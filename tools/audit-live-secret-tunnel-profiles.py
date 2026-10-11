"""Verify selected production profiles against the installed Secret Tunnel.

Historical primary UUIDs may be archived. VOICE-CAST.json productionVoices owns
the active bindings; native listing and both source/reference files must agree.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess

GAME = Path(__file__).resolve().parents[1]
REPORT = "GERMANY-SIMULATOR-LIVE-SECRET-TUNNEL-PROFILES.json"
digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()


def voice_request(exe, resources, operation):
    environment = os.environ.copy()
    environment.pop("VOICE_CLONER_DATA", None)
    environment["SECRET_TUNNEL_VOICE_RESOURCE_DIR"] = str(resources)
    result = subprocess.run([str(exe), "--voice-cli"],
                            input=json.dumps({"operation": operation, "input": {}}),
                            capture_output=True, text=True, encoding="utf-8",
                            env=environment, timeout=60)
    response = json.loads(result.stdout)
    if result.returncode or not response.get("ok"):
        raise RuntimeError(f"Secret Tunnel {operation} failed")
    return response["result"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", required=True, type=Path)
    parser.add_argument("--secret-tunnel-exe", required=True, type=Path)
    parser.add_argument("--voice-resources", required=True, type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    music, exe, resources = (p.resolve(strict=True) for p in
                             (args.music_root, args.secret_tunnel_exe, args.voice_resources))
    shared = (music / "Secret Tunnel shared voice data").resolve(strict=True)
    configured = Path((exe.parent / "voice-data-root.txt").read_text(encoding="utf-8-sig").strip()).resolve(strict=True)
    if configured != shared:
        raise RuntimeError("Installed app uses a different voice data root")
    result = subprocess.run(["node", str(GAME / "tools/curate-voice-library.mjs"),
                             "--check", "--voice-exe", str(exe), "--profile-data", str(shared)],
                            capture_output=True, text=True, encoding="utf-8", timeout=120)
    if result.returncode:
        raise RuntimeError(result.stderr)
    cast_path = GAME / "For-AI/VOICE-CAST.json"
    cast = json.loads(cast_path.read_text(encoding="utf-8"))
    profiles = voice_request(exe, resources, "list")["profiles"]
    retired = {p["profileId"] for p in cast["retiredProfiles"]}
    if any(p["id"] in retired for p in profiles):
        raise RuntimeError("A curated retired profile remains active")
    bindings = [{"voiceId": key, **value} for key, value in cast["productionVoices"].items()]
    report = {"schemaVersion": 2, "status": "live_production_profile_verification",
              "note": "Selected UUID, name and both source/reference hashes checked. Historical source profiles may be archived. No listening approval is inferred.",
              "gameCastSha256": digest(cast_path), "installedExecutableSha256": digest(exe),
              "sharedVoiceDataRoot": str(shared), "productionCharacters": len(bindings),
              "matchedProfiles": len(bindings), "sceneExceptions": cast["productionExceptions"],
              "retiredProfiles": len(retired), "liveProfileCount": len(profiles), "profiles": bindings}
    contents = (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    output = music / REPORT
    if args.check:
        if not output.is_file() or output.read_bytes() != contents:
            raise RuntimeError("Saved live profile audit is stale")
    else:
        temporary = output.with_suffix(".part")
        temporary.write_bytes(contents)
        os.replace(temporary, output)
    print(json.dumps({"check": args.check, "matched": len(bindings), "retired": len(retired)}))


if __name__ == "__main__":
    main()
