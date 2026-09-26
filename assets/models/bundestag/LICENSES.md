# Bundestag landmark model

`bundestag.glb` is an original, texture-free project asset authored in Blender by `tools/build-bundestag-model.py`. The editable `bundestag.blend` retains separate architectural assemblies. It does not incorporate a third-party mesh, scan, photograph, logo, or texture. Reference photographs were inspected only; their pixels are not incorporated or redistributed.

The game interpretation follows the modern Reichstagsgebäude's broad historic body, six-column west portico and triangular pediment, staircase, four corner towers, layered sandstone cornices, arched windows, recessed glazing, balustrades, roof courts, and modern glass dome. The dome has 24 radial ribs, 17 belt rings, an open crown, an inner light cone, and two spiral ramps. These proportions and details distinguish it from a generic classical parliament building. This is an approximate exterior game asset, not a measured architectural replica. Window counts, roof layout and simplified abstract sculptural figures are original approximations; the actual historic reliefs and heraldry are not reproduced.

Architectural reference material opened on 2026-09-26:

- Deutscher Bundestag, *Architektur des Reichstagsgebäudes*: https://www.bundestag.de/besuche/architektur/reichstag/architektur
- Deutscher Bundestag, *Die Kuppel*: https://www.bundestag.de/besuche/architektur/reichstag/kuppel
- Deutscher Bundestag, *Die Skulpturen und Reliefs des Reichstagsgebäudes*: https://www.bundestag.de/dokumente/textarchiv/2024/kw33-rtg-beschreibung-383518
- Matthew Field (Mfield), edited by Waugsberg, *Berlin reichstag west panorama 2.jpg*, 2009, Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Berlin_reichstag_west_panorama_2.jpg — façade photograph visually inspected; no photo data shipped.

- Generated: 2026-09-26, Blender 5.2.1 LTS
- Runtime format: glTF 2.0 binary (`.glb`)
- Textures: none
- Seven meshes/material batches: stone, sandstone trim, masonry shadow, window glass, roof, metal, transparent `Bundestag_DomeGlass`.
- Triangles: 63,692; bytes: 1,842,480. Machine-readable counts, source bounds and checksum: `model-info.json`.
- Source bounds: 139 × 47.63 × 101.475; ground-centered Y-up, west portico facing +Z. Runtime fits uniformly into its existing parcel and uses the existing gameplay collision authority.
- Optimized with glTF Transform 4.2.1 deduplication, welding, pruning and `KHR_mesh_quantization`. No Draco/Meshopt decoder, texture, animation, camera or light is required at runtime. Geometry simplification is disabled.
- SHA-256: `4a3e9c23aa3ce67b380252e2c1ffa35150b561b264167f47fc2ebb3a0bbddfef`

Rebuild with installed Blender and the glTF Transform 4.2.1 CLI entry point:

```text
blender --background --threads 3 --python-exit-code 1 --python tools/build-bundestag-model.py -- --render --gltf-transform /path/to/node_modules/@gltf-transform/cli/bin/cli.js
```

The script uses Blender's bundled Python and Node only for the optional final optimization. Omit `--render` to skip the two local review PNGs. The Blender source, script, manifest and review images are authoring artifacts; the game requests only the GLB. Assertions check centering, ground pivot, proportions, material count, texture absence and triangle budget during every build.
