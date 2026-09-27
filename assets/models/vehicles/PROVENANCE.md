# Original vehicle fleet

These three models are original Germany Simulator artwork, authored in Blender
5.2.1 with `tools/build-vehicle-assets.py`. No downloaded mesh, image texture,
manufacturer logo, official police crest or scanned geometry is included. The complete
body, glazing, running gear, trim, lamps and livery belong to each GLB.

- `beetle.glb`: late-1960s Volkswagen Type 1 silhouette, rounded wings and bonnet,
  curved fitted glazing with quarterlight divisions, running boards, chrome
  bumpers, pressed steel wheels, domed hubcaps and rear cooling slots.
- `trabant.glb`: Trabant 601 saloon proportions, two-tone roof, round headlamps,
  narrow rounded horizontal grille, open wheel arches and simple chrome trim.
- `police-estate.glb`: a German police estate based on the 2016 BMW 318d Touring's
  proportions and silver/blue/yellow treatment. It has shaped glazing, alloy
  wheels, roof rails, one transverse low-profile blue lightbar, and independent
  left/right LED materials. The blue/yellow vinyl wraps the bonnet, both flanks
  and rear, with segmented reflective strips, large `POLIZEI` lettering,
  `NOTRUF 110` markings, original department-08 stars and a roof identifier.
  All lettering and vinyl are fitted mesh geometry, including the rear
  diagonal visibility pattern.

All three cars have front and rear German-format plates, with a black holder,
white face, black registration, EU band, twelve stars, `D` and plain seals.
Registrations are game-authored. Letters use the existing SIL OFL Roboto
Condensed font in `assets/fonts/roboto-condensed/`, converted to geometry.

The models are game interpretations of these vehicles, not measured replicas.
The photographs below were viewed as shape/detail references only; their pixels
are not distributed in the GLBs, source blend or runtime.

References checked 27 September 2026:

- [Volkswagen's Type 1 1500 vehicle data](https://www.volkswagen-newsroom.com/en/vehicle-data-beetle-kaefer-1500-profile-19600)
  and [1967 Beetle photographic walkaround](https://www.oldbug.com/rogerlneil.htm).
- [August Horch Museum's Trabant exhibition](https://www.horch-museum.de/trabant-museum.php)
  and [Autopaedia's 1968 Trabant 601 front view](https://www.autopaedia.com/en/galleries/Trabant/Trabant_601/Trabant_601_1964-1990_%281968_limousine_2d%29_%2801%29_-AA1-.php).
- [BMW's 318d Touring police photograph, June 2016](https://www.press.bmwgroup.com/deutschland/photo/detail/P90221964/bmw-318d-touring-polizei-06/2016?language=de)
  and [BMW's GPEC 2016 description](https://www.press.bmwgroup.com/austria/article/attachment/T0260801DE/360797),
  including the roof signal unit and blue livery with fluorescent yellow strips.

## Runtime contract

`manifest.json` owns final byte sizes, rendered triangle counts and SHA-256 hashes.
Each GLB is under 600 KB / 32,000 triangles; the complete fleet is about 1.2 MB.
All use Y-up, +Z-front, ground-level roots and uniform runtime fitting. Four
named empty wheel pivots carry `wheel` and `radius` extras; the front two also
have steering parents with `steer` extras. Rolling rotates local X, steering
rotates local Y. Do not merge either LED material or flatten the wheel hierarchy.

Only `BodyPaint` changes to the established traffic palette. Glass, chrome,
rubber, roof paint and police markings retain authored materials. Brake and
LED materials are private to each runtime car; geometry stays shared. Wheels
follow actual displacement, stop during queues/modals, reverse correctly and
ignore lane wraps/respawn jumps. The existing simulation, collisions, pursuit,
vortex behavior and sound remain authoritative.

## Rebuilding

1. Run `blender --background --threads 4 --python tools/build-vehicle-assets.py`.
   Add `-- --no-render` to skip the two studio review renders. It writes the
   editable `vehicles.blend`, raw GLBs and initial manifest. Studio images go
   into ignored `output/vehicle-review/`.
2. Run `node tools/optimize-vehicle-assets.mjs <offline-tools-node_modules>` with
   glTF Transform core/extensions/functions 4.5.0, meshoptimizer 0.24.0 and
   gltf-validator available in that directory. This welds, simplifies within a
   bounded error, locks lettering/plate borders so small glyphs survive,
   preserves distinct material names, prunes and quantizes.
   `KHR_mesh_quantization` requires no downloaded decoder. The script validates
   every GLB and updates the manifest. These packages are authoring tools only.
3. Run `node --test tests/vehicle-models.test.mjs tests/ambient-traffic.test.mjs tests/police-escalation.test.mjs`,
   then check desktop/mobile traffic, pursuit, stationary wheels and missing
   model fallbacks in the real game.

The old Sutherland body scan and Quaternius police asset retain their own
license records in `../traffic/` and `../police-response/`; the renderer no
longer requests those car files. The separately licensed helicopter is unchanged.
