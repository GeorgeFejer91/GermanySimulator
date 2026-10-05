"""Launch the external pinned ChatDev checkout against this game's YAML."""

import argparse
import os
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
chatdev = root.parent / "ChatDev"
parser = argparse.ArgumentParser()
parser.add_argument("prompt")
args = parser.parse_args()
if not chatdev.is_dir():
    raise SystemExit(f"ChatDev checkout missing: {chatdev}")
if not os.getenv("API_KEY"):
    raise SystemExit("Set API_KEY or OPENAI_API_KEY locally before running ChatDev.")
os.environ["MAC_FUNCTIONS_DIR"] = str(root / "For-AI" / "chatdev" / "functions")
os.environ.setdefault("BASE_URL", "https://api.openai.com/v1")
sys.path.insert(0, str(chatdev))
os.chdir(chatdev)
from runtime.sdk import run_workflow  # noqa: E402

result = run_workflow(
    root / "For-AI" / "chatdev" / "workflow.yaml",
    task_prompt=args.prompt,
    session_name="germany-buergeramt",
)
print(result.final_message)
print(f"ChatDev output: {result.meta_info.output_dir}")
