"""One safe HTTP/write smoke test; uses a temporary CSV, never the review queue."""

import argparse
import importlib.util
import json
import os
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
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--music-root", type=Path, required=True)
music = parser.parse_args().music_root.resolve(strict=True)
source = music / review.QUEUE_NAME
raw, _, rows = review.load_queue(source)
with tempfile.TemporaryDirectory(prefix="voice-review-no-shortlist-") as empty_music:
    assert review.first_review_ids(Path(empty_music), rows) == set()
fd, temporary = tempfile.mkstemp(prefix=".voice-review-test-", suffix=".csv", dir=ROOT / "tools")
assert Path(temporary).resolve().parent == (ROOT / "tools").resolve()
try:
    with os.fdopen(fd, "wb") as stream:
        stream.write(raw)
    token = "local-test-token"
    server = ThreadingHTTPServer(("127.0.0.1", 0), review.make_handler(music, token, Path(temporary)))
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

    try:
        status, body = request("/api/rows")
        served = json.loads(body)["rows"]
        assert status == 200 and len(served) == len(rows)
        first_pass = [row for row in served if row["firstReview"]]
        assert len(first_pass) == 53 and len({row["voiceId"] for row in first_pass}) == 53
        assert any(row["clipId"] == "polizei-heinrich-wachtmeister-02" for row in first_pass)
        first = rows[0]
        status, audio = request(f"/audio/{first['clipId']}/normalized")
        assert status == 200 and review.sha256(audio) == first["normalizedSha256"]
        range_query = Request(base + f"/audio/{first['clipId']}/normalized",
                              headers={"X-Review-Token": token, "Range": "bytes=0-31"})
        with urlopen(range_query, timeout=10) as response:
            assert response.status == 206 and response.read() == audio[:32]
        decisions = {name: "yes" for name in review.DECISIONS}
        payload = {"clipId": first["clipId"], "mp3Sha256": first["mp3Sha256"],
                   "reviewVersion": review.row_version(first), "decisions": decisions,
                   "reviewNotes": "Isolated test; no real decision."}
        status, _ = request("/api/save", payload, origin=False)
        assert status == 403
        status, _ = request("/api/save", payload)
        assert status == 200
        _, _, updated = review.load_queue(Path(temporary))
        assert updated[0]["approveForGame"] == "yes" and updated[0]["reviewNotes"] == payload["reviewNotes"]
        status, _ = request("/api/save", payload)
        assert status == 409
        payload["reviewVersion"] = review.row_version(updated[0])
        payload["decisions"]["heardWords"] = "no"
        status, _ = request("/api/save", payload)
        assert status == 400
        assert source.read_bytes() == raw, "Real review queue changed"
        print(json.dumps({"rows": len(rows), "firstPassSpeakers": len(first_pass),
                          "audioHashAndRange": "verified", "localSave": "verified",
                          "csrf": "rejected", "staleSave": "rejected", "invalidApproval": "rejected"}))
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
finally:
    os.unlink(temporary)
