"""Offline checks for the optional runner; never call a model or touch game sources."""

import hashlib
import importlib.util
from contextlib import redirect_stdout
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import runpy
import yaml

ROOT = Path(__file__).resolve().parents[1]


def load(name, relative):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


game_tools = load("game_tools", "For-AI/chatdev/functions/game_tools.py")
runner = load("chatdev_runner", "tools/run-chatdev.py")


class ScopedTools(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="germany-chatdev-check-")
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.root_patch = patch.object(game_tools, "ROOT", self.root)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)
        subprocess.run(["git", "init", "--initial-branch=codex/check", str(self.root)],
                       check=True, capture_output=True)
        self.target = self.root / "buergeramt-story.js"
        self.target.write_bytes("Für Frau Knick\r\n".encode())

    def test_pagination_preserves_complete_large_utf8_file_and_hash(self):
        raw = ("Grüße 🗃\r\n" * 40_000).encode()
        self.target.write_bytes(raw)
        content, offset = [], 0
        while offset is not None:
            page = json.loads(game_tools.read_game_file(self.target.name, offset, 50_000))
            self.assertEqual(page["sha256"], hashlib.sha256(raw).hexdigest())
            content.append(page["content"])
            offset = page["next_offset"]
        self.assertEqual("".join(content).encode(), raw)
        for offset, limit in ((-1, 20), (0, 50_001), (0, 0), (len(raw), 10)):
            with self.assertRaises(ValueError):
                game_tools.read_game_file(self.target.name, offset, limit)

    def test_owned_save_uses_read_hash_and_rejects_stale_write(self):
        page = json.loads(game_tools.read_game_file(self.target.name))
        game_tools.save_story_file("Neue Zeile\n", page["sha256"])
        self.assertEqual(self.target.read_bytes(), b"Neue Zeile\n")
        with self.assertRaisesRegex(ValueError, "changed since reading"):
            game_tools.save_story_file("Would overwrite newer work", page["sha256"])
        self.assertEqual(self.target.read_bytes(), b"Neue Zeile\n")

    def test_branch_path_and_size_boundaries_remain_enforced(self):
        digest = json.loads(game_tools.read_game_file(self.target.name))["sha256"]
        with self.assertRaises(ValueError):
            game_tools.save_phone_file(self.target.name, "wrong owner", digest)
        with self.assertRaises(ValueError):
            game_tools.read_game_file("../private.txt")
        with self.assertRaises(ValueError):
            game_tools._path("../private.txt", {"../private.txt"})
        with self.assertRaises(ValueError):
            game_tools.save_story_file("x" * 200_001, digest)
        with self.assertRaises(ValueError):
            game_tools.save_story_file("x", "not-a-hash")
        subprocess.run(["git", "symbolic-ref", "HEAD", "refs/heads/main"],
                       cwd=self.root, check=True, capture_output=True)
        with self.assertRaisesRegex(ValueError, "codex/"):
            game_tools.save_story_file("wrong branch", digest)
        self.assertEqual(self.target.read_text(encoding="utf-8"), "Für Frau Knick\n")


class RunnerValidation(unittest.TestCase):
    def test_all_declared_stages_resolve_including_color_mood(self):
        paths = runner.stage_paths()
        self.assertEqual(len(paths), 14)
        self.assertEqual(paths["ColorMood"].name, "color-mood.yaml")
        self.assertTrue(all(path.is_file() for path in paths.values()))

    def test_consistency_reviewers_are_distinct_read_only_agents_before_acceptance(self):
        paths = runner.stage_paths()
        order = list(paths)
        self.assertEqual(order[order.index("Voice"):], ["Voice", "Physics", "Camera", "Review", "QA"])
        for stage in ("Physics", "Camera"):
            graph = yaml.safe_load(paths[stage].read_text(encoding="utf-8"))["graph"]
            self.assertEqual(graph["start"], [f"{stage}Reviewer"])
            self.assertEqual(len(graph["nodes"]), 1)
            agent = graph["nodes"][0]
            self.assertEqual(agent["id"], f"{stage}Reviewer")
            names = {tool["name"] for item in agent["config"]["tooling"]
                     for tool in item["config"]["tools"]}
            self.assertEqual(names, {"read_game_file", "write_workflow_report"})
            for instruction in ("For-AI/OBJECT-CONSISTENCY.md", "candidate revision",
                                "Never edit sources", "no browser", "NOT RUN"):
                self.assertIn(instruction, agent["config"]["role"])

    def test_consistency_protocol_and_root_world_sources_are_readable_but_not_writable(self):
        for path in ("For-AI/OBJECT-CONSISTENCY.md", "game.js", "world3d.js", "3d.html",
                     "tourist-animation.js", "character-interactions.js", "goerlitzer-park.js",
                     "assets/models/bundestag/model-info.json", "assets/models/city-kit/manifest.json",
                     "assets/models/vehicles/manifest.json", "assets/models/german-props/manifest.json"):
            read = json.loads(game_tools.read_game_file(path))
            self.assertEqual(read["path"], path)
            self.assertEqual(read["sha256"], hashlib.sha256((ROOT / path).read_bytes()).hexdigest())
            with self.assertRaises(ValueError):
                game_tools._path(path, game_tools.WRITABLE)

    def test_validator_rejects_extra_reviewer_source_write_tools(self):
        parse = yaml.safe_load

        def inject_write(source):
            document = parse(source)
            if document.get("graph", {}).get("id") == "amt_physics_consistency":
                document["graph"]["nodes"][0]["config"]["tooling"].append({
                    "type": "function", "config": {"tools": [{"name": "save_mechanics_file"}]}})
            return document

        with patch("yaml.safe_load", side_effect=inject_write), redirect_stdout(io.StringIO()):
            with self.assertRaises(AssertionError):
                runpy.run_path(str(ROOT / "tools/validate-chatdev.py"))

    def test_required_protocols_skills_and_timing_are_readable(self):
        for path in ("AGENTS.md", "For-AI/AGENT-START.md", "For-AI/SKILLS.md",
                     "For-AI/chatdev/README.md", "For-AI/DECISIONS.md", "buergeramt-time.js",
                     "For-AI/OBJECT-CONSISTENCY.md",
                     "tests/amt-harness.mjs", ".agents/skills/chatdev-game-workflows/SKILL.md"):
            self.assertTrue(json.loads(game_tools.read_game_file(path))["content"], path)

    def test_stage_path_cannot_escape_the_workflow(self):
        with tempfile.TemporaryDirectory(prefix="germany-stage-check-") as directory:
            root = Path(directory)
            lane = root / "For-AI" / "chatdev"
            lane.mkdir(parents=True)
            (root / "outside.yaml").write_text("{}")
            (lane / "workflow.yaml").write_text(
                "graph:\n  nodes:\n    - id: Escape\n      config:\n"
                "        config: {path: ../../outside.yaml}\n")
            with self.assertRaises(ValueError):
                runner.stage_paths(root)

    def test_validation_needs_no_external_checkout_or_credentials(self):
        shell = shutil.which("pwsh") or shutil.which("powershell")
        if not shell:
            self.skipTest("PowerShell wrapper is Windows-specific")
        environment = {key: value for key, value in os.environ.items()
                       if key not in {"API_KEY", "OPENAI_API_KEY"}}
        with tempfile.TemporaryDirectory(prefix="germany-no-runner-") as directory:
            environment["CHATDEV_HOME"] = str(Path(directory) / "absent")
            result = subprocess.run([shell, "-NoProfile", "-File", str(ROOT / "tools/chatdev.ps1"),
                                     "-ValidateOnly"], cwd=ROOT, env=environment,
                                    capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("static validation only", result.stdout)


if __name__ == "__main__":
    unittest.main()
