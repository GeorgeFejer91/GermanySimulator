# Original city kit

Created for Germany Simulator in Blender 5.2.1 LTS with the deterministic source
[`tools/build-city-assets.py`](../../../tools/build-city-assets.py). Every vertex
and material is project-authored. No downloaded geometry, reference photographs,
brand artwork, texture pack, or AI-generated image is embedded in these models.
The existing project licensing governs these originals; this document does not
grant rights to unrelated assets in the repository.

`city-kit.blend` is the editable source: one named collection and mesh per asset,
plus a catalog camera, captions, lights, and display ground. The catalog objects
are laid out for inspection; exported models are centered individually before
that arrangement is applied. When exporting manually, reset the selected catalog
object's location first. The script handles that step automatically.

The GLBs use metres as authoring units, Y-up, +Z-front, origin at the center of
their ground bounds, opaque texture-free PBR materials, and one material-batched
mesh per asset. Windows use dark panes and projecting reveals; foliage uses solid
leaf sprays and explicit branches, without alpha textures. Runtime collision and
interaction positions remain owned by `game.js`; these are visual models only.

Four original building types provide concrete municipal offices, a Berlin-style
masonry block, a brick utility/post hall, and a neighborhood storefront. They are
game-scale architectural designs, not surveyed reconstructions of particular
offices. The separate Bundestag asset owns the historical landmark treatment.

## Inventory, easiest first

| Effort | Models | Construction and visible improvement |
| --- | --- | --- |
| Easy | bollard, streetlamp, litter-bin, bicycle-rack | Metal shafts, reflector band, lamp housing, rim/slats, bent rack tubing |
| Easy | bench, pfand-bottle | Timber seat/back slats and supports; bottle shoulder, narrow neck, cap and label band |
| Easy–medium | pfand-machine, coffee-machine, fax-kiosk | Circular intake and receipt tray; screen, cup recess, buttons; roofed public fax terminal |
| Medium | garden-shed, neighborhood-shop | Timber siding and door; glazed storefront and centered public entrance |
| Medium | municipal-office, berlin-block, brick-utility | Repeated window reveals/mullions, plinths, cornices, roof equipment, dormers, brick piers |
| Medium | garden-gnome | Face, eyes, nose, layered beard, bent cap, coat, arms, boots |
| Medium | deciduous-tree | Tapered trunk, roots, forked branches and irregular layered foliage |

Exact per-file dimensions, primitive/triangle counts, bytes, and SHA-256 hashes
are in [`manifest.json`](manifest.json). The final 16 GLBs total **1,350,740 bytes**
(about 1.29 MiB), with no texture transfer and no geometry decoder requirement.
The `.blend` and preview PNGs are authoring/review files, never game downloads.

## Rebuild and verification

From the repository root:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --threads 4 --python tools/build-city-assets.py
```

After authoring, the shipped GLBs were losslessly deduplicated and pruned with
glTF Transform 4.5.0 (`dedup`, then `prune`). Reapply those two transforms after a
rebuild and refresh manifest byte counts and SHA-256 hashes. No decimation,
Draco, Meshopt, external buffer, texture, or runtime tooling was introduced.

All 16 final GLBs passed Khronos glTF Validator with **zero errors and zero
warnings**. The authoring script checks finite coordinates and ground placement.
The exported GLB files retain their exact individual ground-centered bounds.
[`city-kit-preview.png`](city-kit-preview.png) records the Blender catalog view;
[`city-props-preview.png`](city-props-preview.png) enlarges the small props for
shape inspection (prop sizes are normalized only in that preview).

Live desktop/mobile rendering, asset-request checks, missing-model fallback,
and preservation of existing interactions are the runtime integration gates.
