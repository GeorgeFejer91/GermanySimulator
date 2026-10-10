"""Exercise real voice promotion in an isolated copy; never edits the live queue/game."""

import argparse
import csv
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile


GAME = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--music-root", type=Path, required=True)
music = parser.parse_args().music_root.resolve(strict=True)
scratch = Path(tempfile.mkdtemp(prefix=".voice-promotion-test-", dir=GAME / "tools")).resolve()
assert scratch.is_relative_to((GAME / "tools").resolve()) and scratch.name.startswith(".voice-promotion-test-")


def copy(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def run(*arguments, success=True):
    result = subprocess.run(["node", str(test_game / "tools/promote-reviewed-voice-dialogue.mjs"),
                             "--music-root", str(test_music), *arguments], capture_output=True, text=True)
    if success and result.returncode:
        raise AssertionError(result.stderr or result.stdout)
    if not success and not result.returncode:
        raise AssertionError("Incomplete approval was accepted")
    return result


try:
    test_game, test_music = scratch / "game", scratch / "music"
    candidate_path = Path("assets/voices/candidate-dialogue/manifest.json")
    normalized_manifest = Path("GermanySimulator normalized voice review 2026-10-09/manifest.json")
    for relative in (candidate_path, Path("For-AI/VOICE-CAST.json"),
                     Path("For-AI/AUDIO-TEXT-LIBRARY.js"),
                     Path("assets/voices/approved-dialogue/manifest.json"),
                     Path("tools/promote-reviewed-voice-dialogue.mjs")):
        copy(GAME / relative, test_game / relative)
    copy(music / normalized_manifest, test_music / normalized_manifest)
    with (music / "VOICE-CANDIDATE-REVIEW-QUEUE.csv").open(newline="", encoding="utf-8-sig") as stream:
        reader = csv.DictReader(stream)
        fields, rows = reader.fieldnames, list(reader)
    row = next(row for row in rows if row["normalizedWordPercent"] == "100")
    candidates = {clip["clipId"]: clip for clip in json.loads((GAME / candidate_path).read_text(encoding="utf-8"))["clips"]}
    clip = candidates[row["clipId"]]
    copy(GAME / clip["path"], test_game / clip["path"])
    copy(music / row["normalizedReviewFile"], test_music / row["normalizedReviewFile"])
    queue_path = test_music / "VOICE-CANDIDATE-REVIEW-QUEUE.csv"
    approval_fields = ("heardWords", "speakerIdentityFits", "demeanorFits", "intonationFits",
                       "artifactsAbsent", "sourceRightsCleared", "approveForGame")

    def write_queue():
        with queue_path.open("w", newline="", encoding="utf-8") as stream:
            writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(rows)

    for key in approval_fields:
        row[key] = "yes"
    row["heardWords"] = "no"
    write_queue()
    denied = run("--dry-run", success=False)
    assert "Incomplete human gate" in denied.stderr
    row["heardWords"] = "yes"
    write_queue()
    dry = run("--dry-run")
    assert json.loads(dry.stdout)["approved"] == 1
    approved_path = test_game / "assets/voices/approved-dialogue" / (clip["clipId"] + ".mp3")
    assert not approved_path.exists(), "Dry-run wrote audio"

    published = run()
    assert json.loads(published.stdout)["approved"] == 1
    manifest = json.loads((test_game / "assets/voices/approved-dialogue/manifest.json").read_text(encoding="utf-8"))
    assert len(manifest["clips"]) == 1 and manifest["clips"][0]["clipId"] == clip["clipId"]
    assert hashlib.sha256(approved_path.read_bytes()).hexdigest() == row["normalizedSha256"]
    catalog = (test_game / "For-AI/AUDIO-TEXT-LIBRARY.js").read_text(encoding="utf-8")
    assert clip["voiceId"] in catalog and clip["text"] in catalog and manifest["clips"][0]["path"] in catalog
    script = ("const fs=require('fs'),vm=require('vm');"
              "const [file,voice,text,expected]=process.argv.slice(1),scope={window:{},location:{search:''},URLSearchParams};"
              "vm.runInNewContext(fs.readFileSync(file,'utf8'),scope);"
              "if(scope.window.GermanySimulatorAudioText.candidateClip(voice,text)!==expected)process.exit(1)")
    lookup = subprocess.run(["node", "-e", script, str(test_game / "For-AI/AUDIO-TEXT-LIBRARY.js"),
                             clip["voiceId"], clip["text"], manifest["clips"][0]["path"]],
                            capture_output=True, text=True)
    assert lookup.returncode == 0, lookup.stderr or "Approved default lookup failed"
    run("--check")
    prior_manifest = (test_game / "assets/voices/approved-dialogue/manifest.json").read_bytes()
    run()
    assert (test_game / "assets/voices/approved-dialogue/manifest.json").read_bytes() == prior_manifest
    row["approveForGame"] = ""
    write_queue()
    revoked = run("--dry-run", success=False)
    assert "Previously promoted clip was revoked or changed" in revoked.stderr
    print(json.dumps({"clipId": clip["clipId"], "incompleteApproval": "rejected",
                      "dryRun": "no-write", "publishedHash": "verified", "catalog": "default lookup verified",
                      "idempotent": True, "revocation": "blocked", "check": "passed"}))
finally:
    assert scratch.is_relative_to((GAME / "tools").resolve()) and scratch.name.startswith(".voice-promotion-test-")
    shutil.rmtree(scratch)
