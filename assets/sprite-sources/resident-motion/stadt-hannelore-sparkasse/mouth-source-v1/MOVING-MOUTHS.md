# Own moving-mouth preparation

`prepare-moving-mouths-v1.py` prepares a partial SOURCE/CPU candidate from the
independently reviewed front/rear sixteen-frame walks and sixteen-cell gesture.
It does not enable runtime motion or speech. The separate original-standing
registration remains unchanged. Static fits passed independent source review in
`output/ambient-city-animation/hannelore-sparkasse-neutral-mouth-source-review-v1/`;
the earlier README's pending-review status is historical.

`transport-fields-v1.py` carries the actual source center, both column-ordered
physical axes and every contour through the displayed PCHIP upper field. The
gesture uses its proven protected-head identity field. Canonical export uses
own paint137/400 and pivot256,472 →64,150, distinct from nominal136/world1.6.
No other character's lip coordinates, profile or raster scale is borrowed.

The preparer checks each displayed mouth-support pixel against the actual
painted upper warp and verifies direct96/64 body exports exactly. It records
48 slots:16 front walking,16 rear-null and16 gesture. All32 visible slots have
working/direct96/direct64 scalar-zero exact RGBA and max-open unchanged alpha.
The actual source head field, anchors, residual and all input hashes accompany
each registration. The current maximum affine approximation error over the
33×33 shader support is .004264 working px, below the unchanged .1px guard.

Reproduce from this worktree with the installed Python dependencies, selecting
a new initially absent output folder:

```powershell
python assets/sprite-sources/resident-motion/stadt-hannelore-sparkasse/mouth-source-v1/prepare-moving-mouths-v1.py --outdir output/ambient-city-animation/hannelore-sparkasse-moving-mouths-v1/partial-v1
```

Current raw receipt is `3e6c7c0c632bfa2add54d9d8ca569040e2656238551fc90ef74d80ea62968088`.
The initial packet contains96 opened PNGs and24 ordered light/dark face boards;
zero images are verified against the actual inputs rather than redundantly
saved. The author inspected all24 boards, including every front-walk/gesture
mouth at both physical fallback resolutions. Openings remain attached to the
own lip corners; no detached cavity or source crease doubling was seen. Small
64px openings remain subtle. These are enlarged pixel strips, not live timing
or native game-camera evidence.

An ignored analytic check independently verifies identity, translation, shear,
scale/pivot and column-axis order, and rejects folded, nonfinite and materially
nonaffine lip fields. It supplements actual body/API/pixel correspondence.

Pending: independent moving-mouth review, side/stop/start/turn coverage, round/
bite cues, packed atlas/shader parity, media ownership/EOS/cancel/pause, native
walking encounters and world/physical-device/listening gates. Existing exact
recordings remain the only authorized voice sources for this increment.
