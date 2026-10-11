"""HTTP/write checks use temporary queues; the human history is never edited."""

import argparse
import csv
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import threading
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("voice_review_server", ROOT / "tools/voice-review-server.py")
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


def smoke(music, source):
    raw, _, rows = review.load_queue(source)
    eligible = review.active_rows(rows)
    first_ids = review.first_review_ids(music, rows)
    with tempfile.TemporaryDirectory(prefix="voice-review-test-") as temporary:
        queue = Path(temporary) / "queue.csv"
        queue.write_bytes(raw)
        token = "local-test-token"
        server = ThreadingHTTPServer(("127.0.0.1", 0), review.make_handler(music, token, queue))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f"http://127.0.0.1:{server.server_port}"

        def request(path, data=None, origin=True):
            headers = {"X-Review-Token": token}
            if data is not None:
                headers["Content-Type"] = "application/json"
                if origin:
                    headers["Origin"] = base
            query = Request(base + path, data=json.dumps(data).encode() if data is not None else None,
                            headers=headers)
            try:
                with urlopen(query, timeout=10) as response:
                    return response.status, response.read()
            except HTTPError as error:
                return error.code, error.read()

        def payload(row):
            return {"clipId": row["clipId"], "mp3Sha256": row["mp3Sha256"],
                    "reviewVersion": review.row_version(row),
                    "decisions": {name: "yes" for name in review.DECISIONS},
                    "reviewNotes": "Isolated test; no real decision."}

        try:
            status, body = request("/api/rows")
            assert status == 200, body
            served = json.loads(body)["rows"]
            assert {row["clipId"] for row in served} == {row["clipId"] for row in eligible}
            first_pass = [row for row in served if row["firstReview"]]
            assert {row["clipId"] for row in first_pass} == first_ids
            assert len({row["voiceId"] for row in first_pass}) == len(first_pass)
            inactive = [row for row in rows if row["clipId"] not in {item["clipId"] for item in eligible}]
            for row in inactive[:4]:
                status, body = request("/api/save", payload(row))
                assert status == 400 and "not eligible" in json.loads(body)["error"]
                assert queue.read_bytes() == raw
                assert request(f"/audio/{row['clipId']}/normalized")[0] == 404
            first = eligible[0]
            status, audio = request(f"/audio/{first['clipId']}/normalized")
            assert status == 200 and review.sha256(audio) == first["normalizedSha256"], audio
            range_query = Request(base + f"/audio/{first['clipId']}/normalized",
                                  headers={"X-Review-Token": token, "Range": "bytes=0-31"})
            with urlopen(range_query, timeout=10) as response:
                assert response.status == 206 and response.read() == audio[:32]
            incoming = payload(first)
            assert request("/api/save", incoming, origin=False)[0] == 403
            assert request("/api/save", incoming)[0] == 200
            _, _, updated = review.load_queue(queue)
            saved = next(row for row in updated if row["clipId"] == first["clipId"])
            assert saved["approveForGame"] == "yes" and saved["reviewNotes"] == incoming["reviewNotes"]
            for original, current in zip(rows, updated):
                if original["clipId"] != first["clipId"]:
                    assert original == current, "Another history row changed"
            assert request("/api/save", incoming)[0] == 409
            incoming["reviewVersion"] = review.row_version(saved)
            incoming["decisions"]["heardWords"] = "no"
            assert request("/api/save", incoming)[0] == 400
            assert source.read_bytes() == raw, "Source review queue changed"
            return {"historyRows": len(rows), "activeRows": len(served),
                    "firstPassSpeakers": len(first_pass), "inactiveApprovalsRejected": min(4, len(inactive)),
                    "audioHashAndRange": "verified", "temporarySave": "verified",
                    "csrf": "rejected", "staleSave": "rejected", "invalidApproval": "rejected"}
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)


def fixtures():
    original_manifest, original_cast = review.MANIFEST, review.CAST
    try:
        with tempfile.TemporaryDirectory(prefix="voice-review-fixtures-") as temporary:
            music = Path(temporary).resolve()
            review.MANIFEST, review.CAST = music / "manifest.json", music / "cast.json"
            profile = "1" * 32
            receipt = {"profileId": profile, "renderer": "test", "modelRevision": "test-revision",
                       "referenceSha256": "a" * 64, "processing": "test-processing"}
            binding = dict(receipt, originalSha256="b" * 64)
            person = {"voiceId": "speaker", "fullName": "Test speaker"}
            review.CAST.write_text(json.dumps({"productionVoices": {"speaker": binding},
                                              "characters": [person]}), encoding="utf-8")
            audio = b"isolated review audio " * 4
            clips, rows = [], []
            for clip_id in ("active", "retired", "wrong-profile", "previous-take", "renderer-drift"):
                clip = dict(receipt, clipId=clip_id, voiceId="speaker",
                            text=clip_id, sha256=review.sha256(audio),
                            path=f"assets/voices/{clip_id}.mp3", modelLicense="test")
                if clip_id == "active":
                    clip.update(referenceHashKind="uploaded-original", referenceSha256=binding["originalSha256"])
                if clip_id == "retired":
                    clip["retiredReason"] = "Archived test take"
                if clip_id == "wrong-profile":
                    clip["profileId"] = "2" * 32
                if clip_id == "renderer-drift":
                    clip["renderer"] = "different-engine-with-same-UUID"
                if clip_id == "previous-take":
                    old = dict(clip, text="Historical source text", path="assets/voices/previous.mp3")
                    clip["previousCandidate"] = old
                    queued_clip = old
                else:
                    queued_clip = clip
                row = {name: "" for name in sorted(review.REQUIRED)}
                row.update(clipId=clip_id, voiceId="speaker", profileId=queued_clip["profileId"],
                           script=queued_clip["text"], gameFile=queued_clip["path"],
                           mp3Sha256=queued_clip["sha256"], normalizedSha256=review.sha256(audio),
                           normalizedReviewFile=f"{clip_id}.mp3")
                (music / row["normalizedReviewFile"]).write_bytes(audio)
                clips.append(clip)
                rows.append(row)
            review.MANIFEST.write_text(json.dumps({"clips": clips}), encoding="utf-8")
            output = io.StringIO(newline="")
            writer = csv.DictWriter(output, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)
            queue = music / review.QUEUE_NAME
            queue.write_text(output.getvalue(), encoding="utf-8")
            assert review.first_review_ids(music, rows) == set()
            result = smoke(music, queue)
            assert result["activeRows"] == 1 and result["inactiveApprovalsRejected"] == 4
            return result
    finally:
        review.MANIFEST, review.CAST = original_manifest, original_cast


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", type=Path)
    music = parser.parse_args().music_root
    results = {"fixtures": fixtures()}
    if music:
        music = music.resolve(strict=True)
        results["currentLibrary"] = smoke(music, music / review.QUEUE_NAME)
    print(json.dumps(results))


if __name__ == "__main__":
    main()
