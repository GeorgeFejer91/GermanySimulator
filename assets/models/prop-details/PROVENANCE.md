# Prop detail studies

Status: **candidate-unapproved**. Four original, texture-free models derived from
an audit of the game's existing prop roles, not imported meshes. No original GLB,
character artwork, gameplay placement, collision rule or interaction is replaced
by default. The source is `models.js`; the offline exporter is
`../../../tools/export-prop-details.mjs`. These are code-authored studies, not
Blender rebuilds of the accepted source files.

## Scope and appearance

| Candidate | Existing source retained | Study change |
| --- | --- | --- |
| Fax kiosk | `../city-kit/fax-kiosk.glb`; `tools/build-city-assets.py` | Bevelled casing, pronounced handset/keypad, open canopy, folded paper feed. |
| Bottle crate | `../german-props/beer-crate.glb`; `tools/build-german-props.py` | Ribbed walls, open handles, six shouldered bottles with necks, labels and caps. |
| Wheelbarrow | `../german-props/allotment-wheelbarrow.glb`; same builder | Hollow tapered tray, visible wall thickness, frame, grip ends, separate tyre/hub and soil mound. |
| Recycling containers | `../german-props/recycling-containers.glb`; same builder | Tapered bodies, bevelled lids, wheels, rear grab handles and raised sorting pictograms. |

The palette is restrained paper/painted metal/earth, with exaggerated readable
edges rather than photographic textures. This is an art-direction proposal, not
an assertion of accepted equivalence to the bitmap characters.

## Runtime contract

Append `?propDetails=1` to the locally served root game (or `&propDetails=1` when
another query is present). Remove that parameter to use the original models.
`world3d.js` imports `loader.js` only in this mode. Exactly four complete source
paths are eligible; other assets still use the existing loader. The model source
constructs GLB bytes in memory and passes them to the existing GLTFLoader. The
renderer retains its URL promise cache, geometry-sharing clones, uniform fit,
labels and placement. A candidate parse failure loads the original GLB; failure
there retains the original procedural stand-in. A module import failure also
keeps original loading. The normal game requests neither new module.

Each model is Y-up, +Z-front, ground-centred and uniformly bounded within its
original manifest's size envelope. Each model has one mesh with material-batched
primitives, finite positions and normals, no images or external buffer URI, and
no compression-extension dependency. Grounding and size checks are geometric
checks, not proof of in-game occlusion or interaction quality.

## Rebuild and checks

From the repository root with Node.js available:

```sh
node tools/export-prop-details.mjs
node --test tests/prop-details.test.mjs
```

Export deliberately writes only this directory's four generated GLBs and its
checksum manifest. It does not overwrite accepted source assets. Neither that
export command nor an external agent is started automatically by the tunnel.
The optional runtime mode does not need those generated files on disk.

Measured standalone exports from the source used in this edit:

| Model | Triangles | Material primitives | GLB bytes |
| --- | ---: | ---: | ---: |
| Fax kiosk | 1,800 | 6 | 133,836 |
| Bottle crate | 3,636 | 5 | 265,388 |
| Wheelbarrow | 812 | 6 | 62,752 |
| Recycling containers | 1,800 | 7 | 134,592 |
| Total | 8,048 | 24 | 596,568 |

The four accepted GLBs total 70,528 bytes. These deliberately more detailed,
non-indexed candidate exports are larger, not a transfer-size optimization.
In the optional mode the browser transfers the JavaScript source and constructs
these buffers once per cached source URL; GPU and frame-time impact are unmeasured.

Fourteen focused CPU tests passed on byte-identical source copies: finite bounds,
grounding, normal lengths, envelope limits, deterministic GLB layout, exact ID
scoping and simulated parse-failure fallback. All four exported GLBs opened in an
independent trimesh reader. Front and back views of the exported triangles were
inspected using an offline software rasterizer, not Three.js. No Khronos Validator
or real-game WebGL acceptance is claimed. Browser WebGL was unavailable in the
isolated test environment; desktop/mobile rendering, console/network behavior,
interaction preservation and performance must still be reviewed before default
promotion. The tunnel execution companion returned HTTP 502, so live repository
commands, Git status, commit and publication were not verified by this edit.

## 2026-09-30 consolidation check

The current recipes export deterministic GLBs, but none of their four hashes
matched the values first embedded in the later satire-kit byte-identity test.
The fax recipe, for example, exports a 133,836-byte GLB with SHA-256
`471ed731764adc95f3e893e0a5afa1a8f1d86014b5ad51d0005f254d88052d2c`,
while that test first expected `96840b52bc06b5cc2ca5e7e25036cf3b2c3dc5d8e303d445f2174daa41434dc1`.
The source read at the start of this task already had the same recipe, and no
earlier recipe or exported GLB with any of those expected digests exists in
this checkout. The four expected digests were therefore corrected to the
verified outputs of the unchanged source. The regression still pins all four
exact output bytes so future changes remain detectable.

No external artwork, textures, fonts, trademark graphics or new dependencies are
included. Existing asset attributions remain with their original files.
