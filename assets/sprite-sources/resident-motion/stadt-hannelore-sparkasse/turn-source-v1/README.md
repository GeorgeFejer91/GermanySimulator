# Own eight painted turn anchors

SOURCE candidate only; independent acceptance and native turn playback remain pending. No interpolation, mouth fitting, runtime or standing update is included.

Clockwise indices: DOWN0, front-right1, RIGHT2, rear-right3, UP4, rear-left5, LEFT6, front-left7. Six paintings are exact original registered PNG bytes. RIGHT/LEFT are exact `SideFields.render(direction,0,strength=0)` revised-neutral PNGs. `recipe.json` binds every portable anchor and actual producer/input hash. Original sources and standing remain unchanged.

Working512×512, centre256, baseline472, registered figure400. Common own paint137 exports once to96×120 (paint102.75,pivot48,112.5) or64×80 (paint68.5,pivot32,75). Canonical128×160/pivot64,150/nominal136/world1.6 is unchanged.

Reproduce using the installed Python with Pillow/NumPy/SciPy:

```powershell
& 'C:/Users/cogpsy-vrlab/AppData/Local/Programs/Python/Python312/python.exe' assets/sprite-sources/resident-motion/stadt-hannelore-sparkasse/turn-source-v1/build-turns.py --outdir output/ambient-city-animation/hannelore-sparkasse-turn-source-v1/new-replay
```

The output directory must be absent or empty. `--copy-assets` was used only for initial authoring; omit it for review so these source files are not rewritten. The bundled document Python lacked SciPy; no dependencies were installed.

Full author observations, exact ordered A→B→A pairs, actual direct96/64 light/dark cells, replay comparison and final pins live under `output/ambient-city-animation/hannelore-sparkasse-turn-source-v1/`. Rear-quarter faces retain the original over-shoulder orientation; source keys do not prove fluent timed turns. No fabricated intermediate, crossfade or source recolouring is used.
