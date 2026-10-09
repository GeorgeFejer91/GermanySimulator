"""Local listening queue for the 236 GermanySimulator candidate MP3s.

Run: python tools/voice-review-server.py --music-root "<German emotional voice databases>"
The printed loopback URL has a per-run token. Nothing is approved automatically.
"""

import argparse
import csv
import hashlib
import hmac
import io
import json
import os
from pathlib import Path
import re
import secrets
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from urllib.parse import parse_qs, urlsplit


GAME = Path(__file__).resolve().parents[1]
QUEUE_NAME = "VOICE-CANDIDATE-REVIEW-QUEUE.csv"
FIRST_REVIEW_NAME = "VOICE-FIRST-REVIEW-53.csv"
MANIFEST = GAME / "assets/voices/candidate-dialogue/manifest.json"
DECISIONS = (
    "heardWords", "speakerIdentityFits", "demeanorFits", "intonationFits",
    "artifactsAbsent", "sourceRightsCleared", "approveForGame",
)
REQUIRED = {"clipId", "voiceId", "profileId", "script", "normalizedReviewFile",
            "normalizedSha256", "gameFile", "mp3Sha256", *DECISIONS, "reviewNotes"}
MP3_ID = re.compile(r"^/audio/([a-z0-9-]+)/(normalized|original)$")
VENDOR = (GAME / "assets/vendor/pretext/dist").resolve()
FONT = (GAME / "assets/fonts/roboto-condensed/RobotoCondensed.ttf").resolve()
PAGE = (GAME / "tools/voice-review.html").resolve()


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def under(base, relative):
    path = (base / relative).resolve()
    if not path.is_relative_to(base):
        raise ValueError("Review path leaves its data root")
    return path


def load_queue(path):
    raw = path.read_bytes()
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline=""))
    fields = reader.fieldnames or []
    if not REQUIRED.issubset(fields):
        raise ValueError("Review queue has missing columns")
    rows = list(reader)
    clips = json.loads(MANIFEST.read_text(encoding="utf-8"))["clips"]
    index = {clip["clipId"]: clip for clip in clips}
    if len(index) != len(clips) or len(rows) != len(clips) or len({row["clipId"] for row in rows}) != len(rows):
        raise ValueError("Review queue or candidate manifest is incomplete or duplicated")
    for row in rows:
        clip = index.get(row["clipId"])
        if not clip or any((row[queue_key] != clip[manifest_key]) for queue_key, manifest_key in
                           (("voiceId", "voiceId"), ("profileId", "profileId"),
                            ("script", "text"), ("mp3Sha256", "sha256"))):
            raise ValueError(f"Review queue provenance changed: {row['clipId']}")
    return raw, fields, rows


def first_review_ids(music, rows):
    path = music / FIRST_REVIEW_NAME
    if not path.is_file():
        return set()
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        selected = list(csv.DictReader(stream))
    current = {row["clipId"]: row for row in rows}
    if len(selected) != 53 or len({row["clipId"] for row in selected}) != 53 or \
            len({row["voiceId"] for row in selected}) != 53:
        raise ValueError("First-review shortlist must contain 53 distinct speakers and clips")
    for row in selected:
        saved = current.get(row["clipId"])
        if not saved or any(row[key] != saved[other] for key, other in (
                ("voiceId", "voiceId"), ("profileId", "profileId"),
                ("script", "script"), ("normalizedSha256", "normalizedSha256"),
                ("originalMp3Sha256", "mp3Sha256"))):
            raise ValueError(f"First-review shortlist is stale: {row['clipId']}")
    return {row["clipId"] for row in selected}


def row_version(row):
    return sha256(json.dumps(row, sort_keys=True, ensure_ascii=False).encode())


def save_row(queue_path, lock, incoming):
    if not isinstance(incoming, dict):
        raise ValueError("Invalid review payload")
    clip_id = incoming.get("clipId")
    choices = incoming.get("decisions")
    notes = incoming.get("reviewNotes")
    if not isinstance(clip_id, str) or not isinstance(choices, dict) or set(choices) != set(DECISIONS):
        raise ValueError("Invalid review decision")
    if not all(choice in ("", "yes", "no") for choice in choices.values()):
        raise ValueError("Review choices must be pending, yes, or no")
    if not isinstance(notes, str) or len(notes) > 1200:
        raise ValueError("Review note is too long")
    if choices["approveForGame"] == "yes" and any(choices[key] != "yes" for key in DECISIONS[:-1]):
        raise ValueError("All six checks must be yes before game approval")
    with lock:
        raw, fields, rows = load_queue(queue_path)
        matches = [row for row in rows if row["clipId"] == clip_id]
        if len(matches) != 1:
            raise ValueError("Unknown clip ID")
        row = matches[0]
        if incoming.get("reviewVersion") != row_version(row) or incoming.get("mp3Sha256") != row["mp3Sha256"]:
            raise RuntimeError("This review row changed; reload it before saving")
        row.update(choices)
        row["reviewNotes"] = notes.strip()
        output = io.StringIO(newline="")
        writer = csv.DictWriter(output, fieldnames=fields, lineterminator="\r\n")
        writer.writeheader()
        writer.writerows(rows)
        data = output.getvalue().encode("utf-8")
        fd, temp = tempfile.mkstemp(prefix=".voice-review-", suffix=".csv", dir=queue_path.parent)
        try:
            with os.fdopen(fd, "wb") as stream:
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
            if sha256(queue_path.read_bytes()) != sha256(raw):
                raise RuntimeError("The review queue changed during save; reload it")
            os.replace(temp, queue_path)
        finally:
            if os.path.exists(temp):
                os.unlink(temp)
        return {"clipId": clip_id, "reviewVersion": row_version(row), "queueSha256": sha256(data)}


def make_handler(music, token, queue_path):
    lock = Lock()

    class Handler(BaseHTTPRequestHandler):
        def _send(self, status, payload, content_type="application/json; charset=utf-8", extra=None):
            data = payload if isinstance(payload, bytes) else json.dumps(payload, ensure_ascii=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("X-Content-Type-Options", "nosniff")
            for name, value in (extra or {}).items():
                self.send_header(name, value)
            self.end_headers()
            self.wfile.write(data)

        def _host_ok(self):
            return self.headers.get("Host") == f"127.0.0.1:{self.server.server_port}"

        def _token_ok(self, query):
            supplied = self.headers.get("X-Review-Token") or parse_qs(query).get("token", [""])[0]
            return hmac.compare_digest(supplied, token)

        def do_GET(self):
            parts = urlsplit(self.path)
            if not self._host_ok():
                self._send(403, {"error": "Loopback host required"})
                return
            if parts.path == "/" and self._token_ok(parts.query):
                self._send(200, PAGE.read_bytes(), "text/html; charset=utf-8")
                return
            if parts.path.startswith("/assets/vendor/pretext/dist/"):
                relative = parts.path.removeprefix("/assets/vendor/pretext/dist/")
                try:
                    path = under(VENDOR, relative)
                    if path.suffix != ".js":
                        raise ValueError("Unsupported vendor asset")
                    self._send(200, path.read_bytes(), "text/javascript; charset=utf-8")
                except (ValueError, OSError):
                    self._send(404, {"error": "Missing vendor module"})
                return
            if parts.path == "/assets/fonts/roboto-condensed/RobotoCondensed.ttf":
                self._send(200, FONT.read_bytes(), "font/ttf")
                return
            if not self._token_ok(parts.query):
                self._send(403, {"error": "Review token required"})
                return
            if parts.path == "/api/rows":
                try:
                    _, _, rows = load_queue(queue_path)
                    first_review = first_review_ids(music, rows)
                    clips = {clip["clipId"]: clip for clip in json.loads(MANIFEST.read_text(encoding="utf-8"))["clips"]}
                    cast = json.loads((GAME / "For-AI/VOICE-CAST.json").read_text(encoding="utf-8"))
                    people = {person["voiceId"]: person for group in ("characters", "roleProfiles", "existingAssetProfiles")
                              for person in cast[group]}
                    enriched = []
                    for row in rows:
                        clip = clips[row["clipId"]]
                        person = people[row["voiceId"]]
                        enriched.append(dict(row, reviewVersion=row_version(row), firstReview=row["clipId"] in first_review,
                                             renderer=clip["renderer"],
                                             modelLicense=clip["modelLicense"],
                                             referenceDataset=person.get("reference", {}).get("dataset", "Saved source clips"),
                                             referenceLicense=person.get("reference", {}).get("releaseLicense", person.get("sourceLicense", "unknown"))))
                    self._send(200, {"rows": enriched})
                except (ValueError, OSError) as error:
                    self._send(500, {"error": str(error)})
                return
            match = MP3_ID.fullmatch(parts.path)
            if match:
                try:
                    _, _, rows = load_queue(queue_path)
                    row = next(row for row in rows if row["clipId"] == match[1])
                    normalized = match[2] == "normalized"
                    path = under(music if normalized else GAME,
                                 row["normalizedReviewFile"] if normalized else row["gameFile"])
                    expected = row["normalizedSha256"] if normalized else row["mp3Sha256"]
                    data = path.read_bytes()
                    if sha256(data) != expected:
                        raise ValueError("Audio hash changed since review queue creation")
                    range_header = self.headers.get("Range", "")
                    byte_range = re.fullmatch(r"bytes=(\d+)-(\d*)", range_header)
                    if byte_range:
                        start = int(byte_range[1])
                        end = min(len(data) - 1, int(byte_range[2]) if byte_range[2] else len(data) - 1)
                        if start > end:
                            self._send(416, b"", "audio/mpeg", {"Content-Range": f"bytes */{len(data)}"})
                            return
                        self._send(206, data[start:end + 1], "audio/mpeg",
                                   {"Accept-Ranges": "bytes", "Content-Range": f"bytes {start}-{end}/{len(data)}"})
                    else:
                        self._send(200, data, "audio/mpeg", {"Accept-Ranges": "bytes"})
                except (StopIteration, ValueError, OSError) as error:
                    self._send(404, {"error": str(error)})
                return
            self._send(404, {"error": "Unknown route"})

        def do_POST(self):
            parts = urlsplit(self.path)
            origin = f"http://127.0.0.1:{self.server.server_port}"
            if not self._host_ok() or self.headers.get("Origin") != origin or not self._token_ok(parts.query):
                self._send(403, {"error": "Local review origin and token required"})
                return
            if parts.path != "/api/save":
                self._send(404, {"error": "Unknown route"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                self._send(400, {"error": "Invalid content length"})
                return
            if length < 1 or length > 8192:
                self._send(413, {"error": "Review payload too large"})
                return
            try:
                incoming = json.loads(self.rfile.read(length))
                self._send(200, save_row(queue_path, lock, incoming))
            except (ValueError, TypeError) as error:
                self._send(400, {"error": str(error)})
            except RuntimeError as error:
                self._send(409, {"error": str(error)})
            except OSError as error:
                self._send(500, {"error": f"Review queue could not be saved: {error}"})

        def log_message(self, format, *args):
            pass

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", type=Path, required=True)
    args = parser.parse_args()
    music = args.music_root.resolve(strict=True)
    queue_path = music / QUEUE_NAME
    load_queue(queue_path)
    token = secrets.token_urlsafe(24)
    with ThreadingHTTPServer(("127.0.0.1", 0), make_handler(music, token, queue_path)) as server:
        print(f"Voice review: http://127.0.0.1:{server.server_port}/?token={token}", flush=True)
        print("Only a human reviewing the audio should mark approval. Ctrl+C stops the server.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
