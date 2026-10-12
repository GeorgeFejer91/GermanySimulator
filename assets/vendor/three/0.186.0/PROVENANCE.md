# Three.js r186 startup dependencies

Pinned Three.js 0.186.0, MIT, copyright the Three.js authors. See `LICENSE`.
The canonical root and `3d.html` use one local import-map identity for renderer,
GLTF loader, utilities and the existing optional Spark integration.

Sources retrieved on 2026-10-12:

- `build/three.module.min.js`: jsDelivr's Terser 5.48.0 minification of
  `https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js`.
- `build/three.core.js`: jsDelivr's Terser minification delivered at
  `https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.core.min.js`, saved as
  `three.core.js` to preserve the module's relative import without editing it.
- `examples/jsm/loaders/GLTFLoader.js`, `utils/BufferGeometryUtils.js`,
  `postprocessing/Pass.js` (used by the existing optional Spark renderer) and
  `LICENSE`: unmodified files from the pinned npm `three-0.186.0.tgz` package.
- `examples/jsm/utils/SkeletonUtils.js`: unmodified pinned jsDelivr source.

`manifest.json` records local sizes and SHA-256 for these exact shipped files.
No source maps, authoring files, other renderers or unused addons are shipped.
The minified modules retain the upstream license header. Version/API/scene
behavior are unchanged; hosting these dependencies with the game removes
external engine/CDN availability from startup. Preview-only pages keep their
existing independent import maps.
