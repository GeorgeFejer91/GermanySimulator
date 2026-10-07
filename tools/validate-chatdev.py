"""Static validation for the pinned ChatDev Bürgeramt workflow."""

from pathlib import Path
import ast
import runpy
import yaml

root = Path(__file__).resolve().parents[1]
lane = root / "For-AI" / "chatdev"
main = yaml.safe_load((lane / "workflow.yaml").read_text(encoding="utf-8"))
assert main["version"] == "0.4.0"
graph = main["graph"]
nodes = graph["nodes"]
expected = ["Story", "Storyboard", "Character", "ColorMood", "Animation", "Gameplay",
            "Soundscape", "Mix", "Phone", "Voice", "Review", "QA"]
assert [node["id"] for node in nodes] == expected
assert graph["start"] == ["Story"]
assert [(e["from"], e["to"]) for e in graph["edges"]] == list(zip(expected, expected[1:]))
module = ast.parse((lane / "functions" / "game_tools.py").read_text(encoding="utf-8"))
functions = {node.name for node in module.body if isinstance(node, ast.FunctionDef)}
stages = runpy.run_path(str(root / "tools" / "run-chatdev.py"))["stage_paths"](root)
assert list(stages) == expected
game_tools = runpy.run_path(str(lane / "functions" / "game_tools.py"))
for required in ("AGENTS.md", "For-AI/AGENT-START.md", "For-AI/SKILLS.md", "For-AI/DECISIONS.md",
                 "For-AI/chatdev/README.md", "buergeramt-time.js", "tests/amt-harness.mjs",
                 ".agents/skills/chatdev-game-workflows/SKILL.md"):
    assert required in game_tools["READABLE"] and (root / required).is_file(), required
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
    tools = agents[0]["config"]["tooling"][0]["config"]["tools"]
    assert all(tool["name"] in functions for tool in tools)
    if node["id"] in {"Storyboard", "Character", "ColorMood", "Animation", "Soundscape", "Mix", "Review", "QA"}:
        assert not any(tool["name"].startswith("save_") for tool in tools)
    print(f"{node['id']}: {path.name} ({len(tools)} scoped tools)")
print("ChatDev graph, launcher paths, protocol access and tool scopes: PASS (static validation only)")
