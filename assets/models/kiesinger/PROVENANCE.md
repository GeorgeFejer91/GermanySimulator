# Kurt Georg Kiesinger — original Blender statue

Original project geometry authored in Blender 5.2.1 LTS through
`tools/sculpt-kiesinger.py`, 2026-09-26. The statue is a stylized portrait
interpretation informed by archival photographs, not a scan or an exact
reconstruction. The standing pose, bent arm, and folded dossier are original.
No third-party mesh, photo pixels, texture, insignia, or animation is included.

## Files and runtime contract

- `kiesinger-statue.blend`: editable sculpt collection, optimized export
  collection, and studio inspection camera/lights. To edit the full sculpt,
  unhide **Kiesinger — editable original sculpture** and hide **GAME EXPORT**.
  The studio plinth and lighting are excluded from the GLB.
- `kiesinger-statue.glb`: glTF 2.0, 81,414 triangles, four shared bronze
  materials/four draw calls, no textures, no skeleton or animation, no decoder
  extension or external file requirement. 1,476,820 bytes.
- The exported figure is six units high, Y-up, facing +Z, with the origin at
  shoe level. The existing pedestal owns placement and collision. Both game
  entry points use this one asset, with the procedural figure as fallback.
- Desktop and mobile use the same bounded mesh. The `.blend` is an authoring
  deliverable and is never fetched by the browser.

## Reference photographs

These images were inspected for the long face, swept silver hair, sloping
brows, nose, chin, suit, lapels, collar, tie, and pocket square. Reference
downloads remain outside the shipped asset tree; no image is embedded.

- [KAS/ACDP portrait, 1967](https://commons.wikimedia.org/wiki/File:KAS-Kiesinger,_Kurt_Georg-Bild-4166-1.jpg):
  CDU; Konrad-Adenauer-Stiftung, ACDP 10-004 : 302;
  [CC BY-SA 3.0 DE](https://creativecommons.org/licenses/by-sa/3.0/de/).
- [Anefo portrait, 1 December 1966](https://commons.wikimedia.org/wiki/File:Kurt_Georg_Kiesinger.jpg):
  Nationaal Archief, item 919-8423, photographer unknown. The crop page lists
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/);
  the [full archival photograph](https://commons.wikimedia.org/wiki/File:Willy_Brandt_en_Kurt_Georg_Kiesinger,_Bestanddeelnr_919-8423.jpg)
  is listed as CC0.
- [Oberhausen speech, 11 February 1967](https://commons.wikimedia.org/wiki/File:Bundesarchiv_B_145_Bild-F024017-0001,_Oberhausen,_CDU-Parteitag_Rheinland,_Kiesinger.jpg):
  Bundesarchiv, B 145 Bild-F024017-0001 / Gathmann, Jens;
  [CC BY-SA 3.0 DE](https://creativecommons.org/licenses/by-sa/3.0/de/).

## Rebuild and inspect

From the repository root, use the installed Blender executable:

```text
blender --background --python-exit-code 1 --python tools/sculpt-kiesinger.py
npx --yes --package @gltf-transform/cli@4.5.0 gltf-transform dedup assets/models/kiesinger/kiesinger-statue.glb output/kiesinger-sculpt/kiesinger-dedup.glb
npx --yes --package @gltf-transform/cli@4.5.0 gltf-transform prune output/kiesinger-sculpt/kiesinger-dedup.glb assets/models/kiesinger/kiesinger-statue.glb
node tests/kiesinger-model.test.mjs
```

The Blender script creates studio renders under ignored
`output/kiesinger-sculpt/`. Update these hashes after an intentional rebuild;
the asset test checks actual vertex bounds, indices, runtime budgets, and the
GLB hash. Review the front/three-quarter portrait and the real game views.

SHA-256:

- GLB: `A5AC3518A64B0463697B2F9454D032007ED013D612B2D620BA9E8969C707305B`
- Blender: `FF1BB30D1456852834FAA48AC162A9BF764F2735A9C2AA81D9AA02E0B8A41E7F`
