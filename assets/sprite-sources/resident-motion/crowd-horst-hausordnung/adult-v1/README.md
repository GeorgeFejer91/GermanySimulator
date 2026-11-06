# Horst Hausordnung adult street source

Own source for `street-horst-hausordnung` / `crowd-horst-hausordnung`. This is the mature street adviser, not Bürgeramt Horst Stempelmann. Preserve the bald/grey-haired moustached face, rectangular glasses, cream sleeves, rust waistcoat, long taupe trousers and whole brown lace boots. Clipboard is anatomical LEFT, belt keys anatomical RIGHT, RIGHT hand empty. Voice and the original adviser/controller remain unchanged.

Four unmodified built-in ImageGen raw paintings supply the eight views, the two complete profile FAR legs, genuinely hidden RIGHT NEAR trouser backing, and the complete UP-RIGHT FAR leg. Original generation receipts/prompts/reference hashes are retained. `near-cloth-backing-v1/references-portable-v1.json` maps the three historical reference names to exact archived reference bytes; historical v5 source drafts are not runtime or generation dependencies. Generation does not use other actors' pixels, controls or lip fits.

One common `400/473` registration maps the own real sole/pivot to `[256,472]`. Genuine quarter posture heights are retained. Profile FAR density is `195/687`; UP-RIGHT uses its separately source-fitted complete part and curved ownership boundary. Complete cuff/boot plateaus move rigidly. RIGHT hidden cloth supplies exactly 1,008 originally occluded NEAR pixels and does not replace original supported paint. Fixed hands/keys/clipboard and whole boots retain their accepted paint.

The authored family is **2.33 height / 13.6305 stride**, calibrated from its own profile stance displacement `46.8/400×2.33/.02`. Integrator-selected 2.77 implies proportional stride **16.2045**. Source projection differs by heading; there is no separate per-view runtime clock or scale. The canonical topology is 412 semantic slots / 348 source file references: four cardinal walks, their phase stops/bridges, eight neutral turn anchors and four quiet actions. There are no quarter walk clips.

## Reconstruct in an initially absent working mirror

Use Pillow, NumPy and SciPy with the existing repository mechanics. Start the generation mirror with exactly the following **24 own files**, relative to this source directory:

```text
raw/raw-eight-views-v1.png
far-legs-v1/raw-complete-far-legs-v1.png
near-cloth-backing-v1/raw-right-near-cloth-v1.png
quarter-far-v1/raw-up-right-far-leg-v1.png
register-views-v1.py
prepare-profile-layers-v6.py
profile-leg-controls-v6.json
profile-motion-v2.py
profile-motion-controls-v2.json
cardinal-reaction-motion-v2.py
cardinal-reaction-controls-v1.json
prepare-quarter-far-v2.py
quarter-far-v2/registration-trial-v2.json
family-body-v1.py
build-family-source-v1.py
prepare-mouth-source-fits-v3.py
mouth-source-fits-v3.json
mouth-source-fits-v2.json
prepare-family-mouths-v1.py
build-family-mouths-v3.py
compile-family-v2.py
build-private-delivery-v1.py
pre-admission-person-v1.json
capability-plan-v1.json
```

Add these **three existing shared mechanics** at their repository-relative paths:

```text
.agents/skills/animate-2d-characters/scripts/painted_walk.py
.agents/skills/animate-2d-characters/scripts/harmonize_material.py
tools/build-street-motion-delivery.py
```

The **28th input** is the official `tools/build-street-mouths.py` with the exact adopted SHA below. These generation inputs are listed here and require no ignored allowlist, compiler seed or proof folder. Provenance receipts/reference archives document the paintings; they are not required generation seeds. Keep registered views, extracted parts, source cells, compiled mouth metadata, packets and `validation-baseline-v1.json` absent until generated or separately compared. Run one bounded source section at a time with the project's 384 MiB/thread1/BelowNormal/60-second and RAM/disk guards.

The official `tools/build-street-mouths.py` must contain the integrator-reviewed open-lower validation predicate, SHA256 `7d3ca1c34a6b2164f01e35bdc635f6ad03c75ec7e041878192afef21b670fc1e`. Pass its path and SHA explicitly. No compiler seed from ignored evidence is required after that official adoption; do not silently cap a profile or fall back to another compiler. The matched JavaScript validator is integrator-owned. GLSL and mouth packing formulas are unchanged.

From the mirror's repository root, use these stages in order (each row is independently bounded):

| Stage | Command or arguments |
| --- | --- |
| Raw registration | `python -B assets/sprite-sources/resident-motion/crowd-horst-hausordnung/adult-v1/register-views-v1.py` |
| Profile parts | `python -B assets/sprite-sources/resident-motion/crowd-horst-hausordnung/adult-v1/prepare-profile-layers-v6.py` |
| Body | `build-family-source-v1.py --section <section> --output output/horst-height/full-family-v1/source01`, separately for `cardinal-down`, `cardinal-right`, `cardinal-up`, `cardinal-left`, `turn-actions`, then `finalize` |
| Mouth metadata | `build-family-mouths-v3.py --body output/horst-height/full-family-v1/source01/body-index.json --output output/horst-height/full-family-v1/source01/family-mouths-v3 --section <section> --compiler tools/build-street-mouths.py --compiler-sha 7d3ca1c34a6b2164f01e35bdc635f6ad03c75ec7e041878192afef21b670fc1e`, separately for `cardinal-down`, `cardinal-right`, `cardinal-left`, `turn-actions`, then `finalize` |
| Native/metadata | `compile-family-v2.py --source output/horst-height/full-family-v1/source01 --output output/horst-height/full-family-v1/compiled02 --stage <stage>`, separately for `desktop`, `mobile`, `standing`, `metadata` |
| Private packet | `build-private-delivery-v1.py --stage <stage>`, separately for `init`, `build`, `bind`, `check` |

Python helpers in the last four rows live beside this README; invoke them with `python -B` and their complete repository-relative path. Generated assets/parts are intermediate outputs, not copied input seeds. The source compiler retains every alpha1 byte and diagnoses it; alpha21 support must have at least two texels of gutter and the outer two texels must stay at alpha20 or lower. The actual premultiplied RGBa/BICUBIC exporter and runtime alphaTest `.08` are unchanged.

## Comparison and evidence scope

`validation-baseline-v1.json` was recorded only after the full authored private candidate completed. Read it only in a separate comparison after reconstruction. It records the authored person, nine runtime assets and typed-F64 definition digest. Compare all 348 source RGBA arrays and 412 semantic/source-field records, both complete native atlases (824 body cells), all 324 visible mouth entries at both densities, rear/padding nulls, person and packet. Preserve signed-zero/float64 associations. Expected artifacts are never generation inputs.

The historical raw-only check used an explicitly supplied content-identical compiler at `_inputs/horst-mouth-compiler.py`; its physical path never entered portable metadata. An official-path replay records the official-admission boolean truthfully; this provenance distinction does not change physical profiles, source fields or runtime assets.

The owner actually inspected 36 ordered native body pages/strips and 56 pages containing all 648 closed/open CPU mouth pairs. Both canonical 412-frame/eight-category body audits passed. Raw-only reconstruction reproduced every source/native/runtime byte and registration. These establish source/native reproducibility, not final game acceptance. All 86 RIGHT mobile native-grid cases retain their no-supported-witness result; actual production GLSL is a separate reviewed material authority. Restrained landscape opening/bite readability remains for actual game/media review. No further aperture, density, gain or AA search is implied.

The original raw-generation statuses in provenance files are historical. Final source design, profile/cardinal/pose-mouth proofs and raw replay supersede their pending-stage wording only within their declared scope. Independent world/height/physics/camera, natural media ownership and publication remain integrator-owned.
