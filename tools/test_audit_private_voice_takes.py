"""Exercise private take integrity checks without changing the live Music library."""

from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import tempfile
from pathlib import Path


SCRIPT = Path(__file__).with_name("audit-private-voice-takes.py")
spec = importlib.util.spec_from_file_location("voice_take_audit", SCRIPT)
audit_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit_module)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", required=True, type=Path)
    parser.add_argument("--game-root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    source_music = args.music_root.resolve(strict=True)
    source_game = args.game_root.resolve(strict=True)
    receipts = sorted((source_music / audit_module.RESULTS).rglob("take.json"))
    if not receipts:
        raise RuntimeError("No real receipt available for the isolated test")
    original = receipts[0]
    take = json.loads(original.read_text(encoding="utf-8"))
    with tempfile.TemporaryDirectory(prefix="gs-take-audit-") as temp:
        root = Path(temp)
        music = root / "music"
        game = root / "game"
        target = music / audit_module.RESULTS / take["voiceId"] / take["requestSha256"][:16]
        target.mkdir(parents=True)
        for name in ("take.json", take["audioFile"], take["speechMetadataFile"]):
            shutil.copy2(original.parent / name, target / name)
        shutil.copy2(source_music / audit_module.CAST_INDEX, music / audit_module.CAST_INDEX)
        shutil.copy2(source_music / take["queue"], music / take["queue"])
        (game / "For-AI").mkdir(parents=True)
        for name in ("VOICE-CAST.json", "VOICE-DIALOGUE-INVENTORY.json"):
            shutil.copy2(source_game / "For-AI" / name, game / "For-AI" / name)
        clean = audit_module.audit(music, game)
        assert (clean["receiptCount"], clean["verifiedCount"], clean["errorCount"]) == (1, 1, 0), clean
        audio = target / take["audioFile"]
        original_bytes = audio.read_bytes()
        audio.write_bytes(original_bytes + b"changed")
        changed = audit_module.audit(music, game)
        assert changed["verifiedCount"] == 0 and "MP3 bytes or hash" in changed["errors"][0]["error"], changed
        audio.write_bytes(original_bytes)
        # Changing this receipt's saved source row must break queue provenance.
        tampered = json.loads((target / "take.json").read_text(encoding="utf-8"))
        tampered["sourceRow"]["profileId"] = "wrong-profile"
        (target / "take.json").write_text(json.dumps(tampered), encoding="utf-8")
        changed = audit_module.audit(music, game)
        assert changed["verifiedCount"] == 0 and "Source request row changed" in changed["errors"][0]["error"], changed
    print(json.dumps({"cleanReceipt": "verified", "tamperedMp3": "rejected",
                      "tamperedRequestRow": "rejected"}))


if __name__ == "__main__":
    main()
