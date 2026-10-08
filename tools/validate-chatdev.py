"""Static validation for the pinned ChatDev Bürgeramt workflow."""

from pathlib import Path
import ast
import hashlib
import json
import runpy
import yaml

root = Path(__file__).resolve().parents[1]
lane = root / "For-AI" / "chatdev"
main = yaml.safe_load((lane / "workflow.yaml").read_text(encoding="utf-8"))
assert main["version"] == "0.4.0"
graph = main["graph"]
nodes = graph["nodes"]
expected = ["Story", "Storyboard", "Character", "ColorMood", "Animation", "Gameplay",
            "Soundscape", "Mix", "Phone", "Voice", "Physics", "Camera", "Review", "QA"]
assert [node["id"] for node in nodes] == expected
assert graph["start"] == ["Story"]
assert [(e["from"], e["to"]) for e in graph["edges"]] == list(zip(expected, expected[1:]))
module = ast.parse((lane / "functions" / "game_tools.py").read_text(encoding="utf-8"))
functions = {node.name for node in module.body if isinstance(node, ast.FunctionDef)}
stages = runpy.run_path(str(root / "tools" / "run-chatdev.py"))["stage_paths"](root)
assert list(stages) == expected
game_tools = runpy.run_path(str(lane / "functions" / "game_tools.py"))
for required in ("AGENTS.md", "For-AI/AGENT-START.md", "For-AI/SKILLS.md", "For-AI/DECISIONS.md",
                 "For-AI/MUSIC-SOUND-DESIGN.md",
                 "For-AI/OBJECT-CONSISTENCY.md", "game.js", "world3d.js", "3d.html",
                 "assets/models/bundestag/model-info.json", "assets/models/city-kit/manifest.json",
                 "assets/models/vehicles/manifest.json", "assets/models/german-props/manifest.json",
                 "tourist-animation.js", "character-interactions.js", "goerlitzer-park.js",
                 "For-AI/chatdev/README.md", "buergeramt-time.js", "tests/amt-harness.mjs",
                 ".agents/skills/chatdev-game-workflows/SKILL.md"):
    assert required in game_tools["READABLE"] and (root / required).is_file(), required
audio_protocol = "For-AI/MUSIC-SOUND-DESIGN.md"
audio_read = json.loads(game_tools["read_game_file"](audio_protocol, limit=50_000))
audio_bytes = (root / audio_protocol).read_bytes()
assert audio_read["path"] == audio_protocol
assert audio_read["content"] == audio_bytes.decode("utf-8")
assert audio_read["sha256"] == hashlib.sha256(audio_bytes).hexdigest()
assert audio_read["next_offset"] is None
assert audio_protocol not in game_tools["WRITABLE"]
try:
    game_tools["_path"](audio_protocol, game_tools["WRITABLE"])
except ValueError:
    pass
else:
    raise AssertionError("Audio protocol unexpectedly writable by ChatDev")
object_protocol = "For-AI/OBJECT-CONSISTENCY.md"
object_read = json.loads(game_tools["read_game_file"](object_protocol, limit=50_000))
assert "Required reviewers and acceptance" in object_read["content"]
for readonly in (object_protocol, "game.js", "world3d.js", "3d.html",
                 "tourist-animation.js", "character-interactions.js", "goerlitzer-park.js"):
    assert readonly not in game_tools["WRITABLE"], readonly
for function in (node for node in module.body if isinstance(node, ast.FunctionDef) and node.name.startswith("save_")):
    assert "expected_sha256" in [arg.arg for arg in function.args.args], function.name
for node in nodes:
    config = node["config"]
    assert node["type"] == "subgraph" and config["type"] == "file"
    path = (lane / config["config"]["path"]).resolve()
    assert stages[node["id"]] == path
    assert path.is_relative_to(lane.resolve()) and path.is_file()
    sub = yaml.safe_load(path.read_text(encoding="utf-8"))
    assert sub["version"] == "0.4.0"
    agents = sub["graph"]["nodes"]
    assert len(agents) == 1 and agents[0]["type"] == "agent"
    assert sub["graph"]["start"] == [agents[0]["id"]]
    tooling = agents[0]["config"]["tooling"]
    assert all(item["type"] == "function" for item in tooling), node["id"]
    tools = [tool for item in tooling for tool in item["config"]["tools"]]
    assert all(tool["name"] in functions for tool in tools)
    if node["id"] in {"Storyboard", "Character", "ColorMood", "Animation", "Soundscape", "Mix", "Physics", "Camera", "Review", "QA"}:
        assert not any(tool["name"].startswith("save_") for tool in tools)
    if node["id"] in {"Physics", "Camera"}:
        reviewer = agents[0]
        assert reviewer["id"] == f"{node['id']}Reviewer", "Separate consistency reviewers required"
        assert len(tooling) == 1 and sorted(tool["name"] for tool in tools) == ["read_game_file", "write_workflow_report"], node["id"]
        role = reviewer["config"]["role"]
        for instruction in (object_protocol, "independent", "candidate revision", "Never edit sources",
                            "NOT RUN", "no browser", "acceptance outstanding"):
            assert instruction in role, (node["id"], instruction)
    if node["id"] in {"Review", "QA"}:
        role = agents[0]["config"]["role"]
        assert object_protocol in role and "Physics" in role and "Camera" in role, node["id"]
    print(f"{node['id']}: {path.name} ({len(tools)} scoped tools)")
print("ChatDev graph, launcher paths, independent consistency reviewers, protocol access and tool scopes: PASS (static validation only)")
