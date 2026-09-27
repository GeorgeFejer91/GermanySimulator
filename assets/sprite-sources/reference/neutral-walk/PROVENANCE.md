# Shared neutral walking guide

Motion reference only, **not character artwork**. This one editable rig serves
the whole sprite cast. No Merkel hair, face, costume, body fitting, source
painting or character-specific texture is used to build it.

`tools/build-neutral-walk-guide.py` uses uniformly scaled anatomical landmarks
from the pinned CC0 MakeHuman inputs in `../makehuman-walk/`. Their authors,
source commit, hashes and dedication remain in that directory's `PROVENANCE.md`
and `LICENSE-CC0.txt`. The displayed mannequin is original plain grey primitive
geometry, not the source human surface. Pelvis/chest control bones subdivide the
torso; limb and head landmarks keep the source proportions. Shoes have a flat
sole and roll rigidly; the toe bone is recorded, but there is no toe mesh flex.

The builder reuses the existing offline contact solver and capture utilities
from `tools/build-merkel-3d-pilot.py`, **not its character fitting or model**.
Legs use analytic, constant-length IK and a planted-contact trajectory. CMU
69/01 supplies filtered arm swing and cycle timing, not full-body mocap.
The source and non-resale restriction are recorded in
`../cmu-walk-69-01/PROVENANCE.md`.

> The data used in this project was obtained from mocap.cs.cmu.edu. The database
> was created with funding from NSF EIA-0196217.

## Reuse contract

- Share the 18 semantic bones, left/right phase, contact schedule and travel
  direction. Keep heel and toe contacts available alongside ankle positions.
- A character adapter must use that character's own fixed rest lengths, head,
  clothes, shoes and props. Retarget joint directions/contact constraints; do
  not stretch its artwork to this mannequin's outline or project its face onto
  the guide head. Recompute grounded IK for the target lengths.
- Keep identity-bearing artwork and its registration fixed through the cycle.
  Resolve crossing limbs with pose depth, not image crossfades. Generate missing
  appearance keys only after the current single-character test is accepted.
- This is a reusable *walking* guide, not a claim that every avatar has already
  been retargeted. Running, prop carrying and special actions need their own
  constrained motion/adaptation checks.

## Artifacts and checks

Four fixed orthographic views render the same complete left-forward →
right-forward → left-forward cycle: 32 distinct playback poses and a separately
rendered closure pose. `pose-audit.json` records actual evaluated joints, shoe
soles and view projections. `guide-bones.png` overlays those joints and heels/toes;
`guide-closure.png` exposes the duplicate endpoint for inspection only.
`neutral-walk.blend` retains the armature, animation and neutral geometry.
`manifest.json` binds source and output hashes.

```powershell
python tools/build-neutral-walk-guide.py
python tools/verify-merkel-3d-pilot.py --neutral
node --test tests/neutral-walk-guide.test.mjs tests/sprite-preview.test.mjs
```

Uses installed Blender 5.2, Python, NumPy and Pillow, with draft renders in
ignored `output/neutral-walk/`. The shared verifier independently reconstructs
the anatomical source landmarks and checks the actual rig, contacts, alpha,
cyclic bounds and pixel closure. Passing it is not visual approval.

`sprite-preview.html?source=neutral` loads only PNGs and lightweight metadata.
Its separate Merkel appearance comparison contains **stills**, not another
finished walk. The game continues to use its unchanged stable sprite archive.
