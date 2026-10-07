"""Bounded Germany Simulator tools for the external ChatDev checkout."""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CHATDEV = Path(os.environ.get("CHATDEV_HOME") or ROOT.parent / "ChatDev").expanduser().resolve()
VOICE = CHATDEV.parent / "voice-cloner" / "Voice.cmd"
VOICE_PORT = os.environ.get("VOICE_CLONER_PORT", "18765")
if not VOICE_PORT.isdecimal() or not 1 <= int(VOICE_PORT) <= 65535:
    raise ValueError("VOICE_CLONER_PORT must be a TCP port number")
VOICE_CLI = [str(VOICE), "--port", VOICE_PORT]
READABLE = {
    "game.js", "world3d.js", "index.html", "styles.css", "buergeramt.js",
    "buergeramt-story.js", "buergeramt-phone.js", "buergeramt-phone.html",
    "buergeramt-link.js", "buergeramt.css", "CREDITS.md",
    "For-AI/README.md", "For-AI/GAMEPLAY.md", "For-AI/BUERGERAMT.md", "For-AI/ASSET-POLICY.md",
    "For-AI/VOICE-SYNTH-PROTOCOL.md", "For-AI/AUDIO-TEXT-LIBRARY.md",
    "For-AI/AUDIO-TEXT-LIBRARY.js", "assets/voices/LICENSES.md",
    "For-AI/SPRITE-GENERATION-PROTOCOL.md",
    "assets/sprite-sources/buergeramt/PROVENANCE.md",
    "assets/buergeramt/characters/build-report.json",
    "output/amt-character-motion/interaction-build-report.json",
    "For-AI/chatdev/WEBGPT-COORDINATION.md",
    "For-AI/chatdev/WEBGPT-HANDOFF.md",
    "AGENTS.md", "For-AI/AGENT-START.md", "For-AI/SKILLS.md", "For-AI/DECISIONS.md",
    "For-AI/chatdev/README.md", "For-AI/PHONE-CALL-TIMING-RESEARCH.md",
    "For-AI/PHONE-CALL-UI-RESEARCH.md", "buergeramt-time.js", "buergeramt-fit.js",
    "subtitle-layout.js", "subtitle-protocol.js",
}
READABLE.update(path.relative_to(ROOT).as_posix() for directory, pattern in (
    (ROOT / "tests", "*.mjs"), (ROOT / ".agents" / "skills", "**/*.md"),
    (ROOT / ".agents" / "references", "**/*.md"),
) for path in directory.glob(pattern) if path.is_file())
WRITABLE = {
    "buergeramt.js", "buergeramt-story.js", "buergeramt-phone.js",
    "buergeramt-phone.html", "buergeramt-link.js", "buergeramt.css",
}


def _path(relative: str, allowed: set[str]) -> Path:
    if relative not in allowed:
        raise ValueError(f"File is outside the ChatDev scope: {relative}")
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT.resolve()):
        raise ValueError("Resolved file escaped the game checkout")
    return path


def read_game_file(path: str, offset: int = 0, limit: int = 20_000) -> str:
    """Read JSON containing content, byte sha256 and next_offset (character offsets).

    Continue until next_offset is null; if sha256 changes, restart the read.
    Pass the complete file's sha256 as expected_sha256 when saving.
    """
    if type(offset) is not int or offset < 0 or type(limit) is not int or not 1 <= limit <= 50_000:
        raise ValueError("Use a nonnegative character offset and a limit of 1–50000")
    raw = _path(path, READABLE).read_bytes()
    content = raw.decode("utf-8")
    if offset > len(content):
        raise ValueError("Offset exceeds the file length")
    end = min(offset + limit, len(content))
    return json.dumps({"path": path, "sha256": hashlib.sha256(raw).hexdigest(),
                       "offset": offset, "total_chars": len(content),
                       "next_offset": end if end < len(content) else None,
                       "content": content[offset:end]}, ensure_ascii=False)


def save_game_file(path: str, content: str, expected_sha256: str) -> str:
    """Save an owned source file on a codex/ branch only if its read hash still matches."""
    target = _path(path, WRITABLE)
    branch = subprocess.run(
        ["git", "branch", "--show-current"], cwd=ROOT, text=True,
        capture_output=True, check=True, timeout=10,
    ).stdout.strip()
    if not branch.startswith("codex/"):
        raise ValueError("ChatDev writes require a codex/ work branch")
    if len(content) > 200_000:
        raise ValueError("Source file exceeds the bounded tool limit")
    if not re.fullmatch(r"[a-f0-9]{64}", expected_sha256):
        raise ValueError("Pass the sha256 returned by read_game_file")
    if hashlib.sha256(target.read_bytes()).hexdigest() != expected_sha256:
        raise ValueError("File changed since reading; reread and reconcile before saving")
    target.write_text(content, encoding="utf-8", newline="")
    return f"Saved {path} ({len(content)} characters) on {branch}"


def save_story_file(content: str, expected_sha256: str) -> str:
    """Story stage may change only the authored Bürgeramt dialogue catalog."""
    return save_game_file("buergeramt-story.js", content, expected_sha256)


def save_mechanics_file(content: str, expected_sha256: str) -> str:
    """Gameplay stage may change only the Bürgeramt state controller."""
    return save_game_file("buergeramt.js", content, expected_sha256)


def save_phone_file(path: str, content: str, expected_sha256: str) -> str:
    """Phone stage may change only the companion and its own styling."""
    if path not in {"buergeramt-link.js", "buergeramt-phone.js",
                    "buergeramt-phone.html", "buergeramt.css"}:
        raise ValueError(f"Phone stage cannot write {path}")
    return save_game_file(path, content, expected_sha256)


def write_workflow_report(name: str, content: str, _context: dict | None = None) -> str:
    """Write a named stage report to ChatDev's external session directory."""
    if not re.fullmatch(r"[a-z0-9_-]{1,40}", name):
        raise ValueError("Report name must be a short lowercase slug")
    if len(content) > 100_000:
        raise ValueError("Report is too large")
    directory = Path((_context or {}).get("graph_directory") or CHATDEV / "WareHouse" / "germany-manual")
    directory = directory.resolve() / "germany-reports"
    if directory.is_relative_to(ROOT.resolve()):
        raise ValueError("ChatDev session output must stay outside the game checkout")
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{name}.md"
    path.write_text(content, encoding="utf-8")
    return str(path)


def run_game_checks() -> str:
    """Run fixed JavaScript syntax checks and the existing Node test suite."""
    results = []
    for name in ("game.js", "world3d.js", "buergeramt.js", "buergeramt-link.js", "buergeramt-phone.js", "buergeramt-story.js", "buergeramt-time.js", "buergeramt-fit.js"):
        run = subprocess.run(["node", "--check", name], cwd=ROOT, text=True, capture_output=True, timeout=30)
        results.append(f"{name}: {'PASS' if run.returncode == 0 else run.stderr[:1000]}")
    tests = sorted((ROOT / "tests").glob("*.test.mjs"))
    if tests:
        run = subprocess.run(["node", "--test", *map(str, tests)], cwd=ROOT, text=True, capture_output=True, timeout=300)
        results.append(f"Node tests: {'PASS' if run.returncode == 0 else 'FAIL'}\n{(run.stdout + run.stderr)[-5000:]}")
    results.append("Browser, real-device and perceptual audio/visual checks: NOT RUN by this tool")
    return "\n".join(results)


def voice_cloner_status() -> str:
    """Check whether the local Voice Cloner CLI and runtime are ready."""
    if not VOICE.exists():
        return f"Voice Cloner CLI missing: {VOICE}"
    runtime = VOICE.parent / ".venv" / "Scripts" / "python.exe"
    alternate = VOICE.parent / "runtime.path"
    if not runtime.exists() and not alternate.exists():
        return "Voice Cloner CLI exists, but its runtime is missing. Run Setup.ps1 after space is available."
    run = subprocess.run([*VOICE_CLI, "doctor"], cwd=VOICE.parent, text=True, capture_output=True, timeout=120)
    return f"exit={run.returncode} {run.stdout[:4000]} {run.stderr[:1000]}"


def voice_cloner_create_profile(name: str, youtube_url: str, start_seconds: int, duration_seconds: int, source_note: str) -> str:
    """Create one deferred Qwen profile from a verified YouTube voice reference."""
    if not name.startswith("GS ") or len(name) > 65:
        raise ValueError("Use a short GS-prefixed profile name")
    if not re.fullmatch(r"https://(?:www\.)?youtube\.com/watch\?v=[A-Za-z0-9_-]{11}", youtube_url):
        raise ValueError("Use a canonical YouTube watch URL")
    if not 0 <= start_seconds <= 36000 or not 10 <= duration_seconds <= 30:
        raise ValueError("Choose a clean 10–30 second segment")
    if len(source_note) < 30 or len(source_note) > 500:
        raise ValueError("Record speaker, source, license, and intended use")
    if "runtime is missing" in voice_cloner_status():
        raise RuntimeError("Voice Cloner runtime is missing")
    run = subprocess.run([*VOICE_CLI, "voices", "create", "--name", name, "--youtube", youtube_url,
                          "--start", str(start_seconds), "--duration", str(duration_seconds),
                          "--source-note", source_note, "--engine", "qwen", "--defer"],
                         cwd=VOICE.parent, text=True, capture_output=True, timeout=900)
    if run.returncode:
        raise RuntimeError((run.stdout + run.stderr)[-2500:])
    return run.stdout[:4000]


def voice_cloner_create_profile_file(name: str, reference_path: str, source_note: str) -> str:
    """Create a deferred Qwen profile from a licensed local reference outside game assets."""
    reference = Path(reference_path).expanduser().resolve()
    if not name.startswith("GS ") or len(name) > 65:
        raise ValueError("Use a short GS-prefixed profile name")
    if reference.is_relative_to(ROOT.resolve()) or not reference.is_file():
        raise ValueError("Reference must be an existing file outside the game checkout")
    if reference.suffix.lower() not in {".wav", ".mp3", ".flac", ".m4a"}:
        raise ValueError("Use a supported audio reference")
    if len(source_note) < 30 or len(source_note) > 500:
        raise ValueError("Record speaker, source, license, and intended use")
    if "runtime is missing" in voice_cloner_status():
        raise RuntimeError("Voice Cloner runtime is missing")
    run = subprocess.run([*VOICE_CLI, "voices", "create", "--name", name,
                          "--file", str(reference), "--source-note", source_note,
                          "--engine", "qwen", "--defer"],
                         cwd=VOICE.parent, text=True, capture_output=True, timeout=900)
    if run.returncode:
        raise RuntimeError((run.stdout + run.stderr)[-2500:])
    return run.stdout[:4000]


def voice_cloner_render_line(profile_id: str, clip_id: str, text: str, _context: dict | None = None) -> str:
    """Render one exact German line to ChatDev's external scratch directory."""
    if not re.fullmatch(r"[a-f0-9]{32}", profile_id):
        raise ValueError("Use the saved Voice Cloner profile ID")
    if not re.fullmatch(r"[a-z0-9-]{1,50}", clip_id) or not 1 <= len(text) <= 350:
        raise ValueError("Invalid clip ID or text length")
    if "runtime is missing" in voice_cloner_status():
        raise RuntimeError("Voice Cloner runtime is missing")
    directory = Path((_context or {}).get("graph_directory") or CHATDEV / "WareHouse" / "germany-manual").resolve() / "germany-voice-scratch"
    if directory.is_relative_to(ROOT.resolve()):
        raise ValueError("Voice scratch must stay outside the game checkout")
    directory.mkdir(parents=True, exist_ok=True)
    output = directory / f"{clip_id}.mp3"
    run = subprocess.run([*VOICE_CLI, "generate", "--voice", profile_id, "--text", text,
                          "--language", "de", "--engine", "qwen", "--output", str(output)],
                         cwd=VOICE.parent, text=True, capture_output=True, timeout=900)
    if run.returncode:
        raise RuntimeError((run.stdout + run.stderr)[-2500:])
    return run.stdout[:4000]
