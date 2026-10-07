"""Launch the optional pinned ChatDev checkout against this game's YAML."""

import argparse
import os
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
PIN = "3c72d860d2553f05129b7dff0fd4efdde5b01d2f"


def stage_paths(root: Path = ROOT) -> dict[str, Path]:
    """Use the workflow's actual stage paths, including hyphenated filenames."""
    lane = root / "For-AI" / "chatdev"
    workflow = yaml.safe_load((lane / "workflow.yaml").read_text(encoding="utf-8"))
    paths = {}
    for node in workflow["graph"]["nodes"]:
        path = (lane / node["config"]["config"]["path"]).resolve()
        if node["id"] in paths or not path.is_relative_to(lane.resolve()) or not path.is_file():
            raise ValueError(f"Invalid or duplicate stage: {node['id']}")
        paths[node["id"]] = path
    return paths


def main():
    stages = stage_paths()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("prompt")
    parser.add_argument("--stage", choices=stages)
    args = parser.parse_args()
    chatdev = Path(os.environ.get("CHATDEV_HOME") or ROOT.parent / "ChatDev").expanduser().resolve()
    if not chatdev.is_dir():
        raise SystemExit(f"Pinned ChatDev checkout missing: {chatdev}; set CHATDEV_HOME for worktrees")
    revision = subprocess.check_output(["git", "-C", str(chatdev), "rev-parse", "HEAD"], text=True).strip()
    if revision != PIN:
        raise SystemExit(f"Unexpected ChatDev revision: {revision}")
    if not os.getenv("API_KEY"):
        os.environ["API_KEY"] = os.getenv("OPENAI_API_KEY", "")
    if not os.getenv("API_KEY"):
        raise SystemExit("Set API_KEY or OPENAI_API_KEY locally before running ChatDev.")
    os.environ["CHATDEV_HOME"] = str(chatdev)
    os.environ["MAC_FUNCTIONS_DIR"] = str(ROOT / "For-AI" / "chatdev" / "functions")
    os.environ.setdefault("BASE_URL", "https://api.openai.com/v1")
    sys.path.insert(0, str(chatdev))
    os.chdir(chatdev)
    from runtime.sdk import run_workflow

    graph = stages[args.stage] if args.stage else ROOT / "For-AI" / "chatdev" / "workflow.yaml"
    result = run_workflow(
        graph, task_prompt=args.prompt,
        session_name=f"germany-buergeramt-{args.stage.lower() if args.stage else 'full'}",
    )
    print(result.final_message)
    print(f"ChatDev output: {result.meta_info.output_dir}")


if __name__ == "__main__":
    main()
