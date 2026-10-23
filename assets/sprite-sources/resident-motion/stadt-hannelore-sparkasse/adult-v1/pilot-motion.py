"""Bounded adult-source four-contact diagnostic; never selects artwork."""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
OUT = ROOT / "output/street-redesign/hannelore-end-to-end/pilot-motion"
SKILL = ROOT / ".agents/skills/animate-2d-characters/scripts/painted_walk.py"


def load(path):
    sys.path.insert(0, str(path.parent))
    spec = importlib.util.spec_from_file_location("hannelore_adult_painted_walk", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


LANDMARKS = {
    "down": dict(waist=236, hip=276, mid=257, centres=[231, 283], hem=[369, 369],
                 knee=[408, 408], ankle=[437, 437], foot_centres=[225, 285],
                 step_width=18, depth_amplitude=8, root_overlap=2, stride_curve="planted"),
    "right": dict(waist=235, hip=277, mid=258, centres=[246, 277], hem=[368, 368],
                  knee=[407, 407], ankle=[438, 438], foot_centres=[244, 278],
                  step_width=25, depth_amplitude=0, root_overlap=2, stride_curve="planted"),
    "up": dict(waist=237, hip=278, mid=255, centres=[228, 281], hem=[373, 373],
               knee=[408, 408], ankle=[440, 440], foot_centres=[226, 282],
               step_width=18, depth_amplitude=8, root_overlap=2, stride_curve="planted"),
    "left": dict(waist=235, hip=278, mid=262, centres=[242, 279], hem=[370, 370],
                 knee=[408, 408], ankle=[439, 439], foot_centres=[242, 281],
                 step_width=25, depth_amplitude=0, root_overlap=2, stride_curve="planted"),
}
TRAVEL = {"down": (0, 1), "right": (1, 0), "up": (0, -1), "left": (-1, 0)}
FOREGROUND = {"down": 1, "right": 1, "up": 0, "left": 0}


def run():
    paint = load(SKILL)
    side_source = load(HERE / "side-source-fields.py")
    OUT.mkdir(parents=True, exist_ok=True)
    board = Image.new("RGB", (512 * 4, 512 * 4), "#eee8db")
    summary = {}
    for row, heading in enumerate(TRAVEL):
        source = Image.open(HERE / "registered" / f"{heading}.png").convert("RGBA")
        phases=[0, .5*3.141592653589793, 3.141592653589793, 1.5*3.141592653589793]
        if heading in ("right", "left"):
            actor = side_source.SideSource(heading)
            results = [actor.render(phase) for phase in phases]
            frames, records = [x[0] for x in results], [x[1] for x in results]
        else:
            try:
                frames, records = paint.animate(source, LANDMARKS[heading], travel=TRAVEL[heading], count=16,
                      foreground=FOREGROUND[heading], phases=phases)
            except ValueError as error:
                if hasattr(error, "frame"):
                    error.frame.save(OUT / f"{heading}-failure-phase{error.phase}.png")
                    print(f"{heading} failed at sample {error.phase}: {error}")
                raise
        summary[heading] = {"samples": len(frames), "limbRecords": records}
        for col, frame in enumerate(frames):
            frame.save(OUT / f"{heading}-phase{col*4:02}.png")
            flat = Image.alpha_composite(Image.new("RGBA", frame.size, "#eee8db"), frame).convert("RGB")
            x, y = col * 512, row * 512
            board.paste(flat, (x, y))
            ImageDraw.Draw(board).text((x+8, y+8), f"{heading} phase {col*4}", fill="#111111")
    board.save(OUT / "four-directions-light.png")
    (OUT / "receipt.json").write_text(json.dumps({"status": "PILOT_SOURCE_ONLY", "landmarks": LANDMARKS,
                                                    "summary": summary}, indent=2) + "\n")
    print("four directions x four samples prepared")


if __name__ == "__main__":
    run()
