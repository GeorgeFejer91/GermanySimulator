# German street details

Ten original, texture-free Blender models made for Germany Simulator. The editable
source is `german-props.blend`; `tools/build-german-props.py` builds that source and
the grounded, Y-up/+Z-front GLBs. `manifest.json` records exact sizes and SHA-256
hashes. The 10 shipped GLBs total 469,956 bytes (0.45 MiB). No external geometry,
textures, logos, or photo scans were imported.

The source review considered [Kenney's CC0 City Kit (Commercial)](https://kenney.nl/assets/city-kit-commercial)
and [CC0 Modular Buildings](https://kenney.nl/assets/modular-buildings). Their
generic storefronts would need rebuilt display merchandise and facades to carry
the sandal/sock pairing, so the shipped models are original instead. Kenney files
already retained elsewhere in this repository are governed by their own licenses.

The paired storefronts occupy one new small retail block. Blue and red loungers
have broad towels across their backs; two additional gnomes carry a watering can
or blank placard. The crate, wheelbarrow, containers, and picnic table reuse the
city kit's restrained stone, wood, and painted-metal palette. Brand markings and
readable retail text remain runtime scene labels, not baked textures.

Rebuild from the repository root with Blender 4.1 or newer:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 4.1/blender.exe' --background --threads 4 --python tools/build-german-props.py
```

The source collections are grouped by material at export, keeping repeated
instances to a few draw calls. Collision circles and shop footprints belong to
`game.js`; missing GLBs retain the renderer's procedural building or prop shape.
