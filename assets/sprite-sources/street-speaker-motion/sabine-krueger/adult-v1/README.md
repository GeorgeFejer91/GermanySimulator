# Sabine Krüger adult street family

Actor-only painterly redesign of `quiz-sabine-krueger`, the middle-aged self-appointed language teacher. Her round glasses, asymmetrical dark-brown bob, mustard vest, off-white rolled blouse, charcoal knee skirt and worn brown lace-up shoes remain hers. Anatomical LEFT hand owns one burgundy book; RIGHT stays empty. Her existing German recording and its measured40Hz media cues are unchanged.

The immutable `pre-admission-person.json` is the exact original public actor record from base `b5744458817a39ddbd2a6c731eb3041daddfccf0`, SHA-256 `97d162ce7ca6f7798b2f02d4468dd218dcf8d28813c7442457bebf55067e754c`. The compiler reads this actor-only baseline rather than a mutable shared registry. The first-install helper replaces only this actor and checks every other record. Root integration must merge her entry by ID into the current live registry, preserving later police/other-character releases.

Own source authority is the mature cardinal raw `quiz-sabine-krueger-expressionist-directions-v1.png` (`0724dde4…`), the three useful rear-right/rear-left/front-left paintings from `…diagonals-v1.png` (`d7d840e1…`), and the corrected whole-body front-right `…front-right-v1.png` (`c5f87b80…`). The first quarter sheet's incorrect front-right head/facing is held and never selected. Exact built-in image-generation requests, full reference paths/hashes, unmodified originals and original output paths are preserved in the two `*-generation-request.json` / `*-generation-receipt.json` pairs and corresponding prompt files. Generated source paint is registered at one400px working stature and472px sole pivot; the higher-raster-resolution singleton has one fixed1211-to400 resolution conversion. No view is mirrored and no final cell is fitted independently.

The existing source-pixel pipeline supplies four16-phase walks, eight whole-body heading anchors, all64 phase-stop entries, twelve stop/turn/start transitions and seven existing action names in the21×18 logical layout. A modest left-book/forearm emphasis serves greet/work/review; look/wait/success/failure retain neutral semantics and existing durations. Head, original lip paint, opposite hand and feet are protected during that action. This is connected source-pixel motion, not a new articulated skeleton or independently generated frames. The two side feet use independent half-cycle-offset planted clocks; LEFT has the opposite stance displacement sign. A measured, changing own shoe-occlusion seam and60px monotone blend supersede the held narrow field that folded. Front/up use the actual planted-floor limb callback, retaining lift while removing positive loaded-foot descent.

Selected world figure height is2.33, with original128×160 logical cell / (64,150) pivot /136 figure registration. Exact96×120 desktop and64×80 mobile cells preserve364 selected poses and14 deliberate blanks. All728 exported alpha21 floor checks are within0.5px of the native pivot; gutters are7/5px, hiddenRGB is zero, and no substantive component splits. The exact known near-sole measurements give11.5357843 game units/cycle (rounded selected11.54), with a9.5941–13.7059 single-pixel-quantized range; source analytic40px travel gives11.65. This does not independently certify the partly occluded opposite sole or actual city cadence; those need the production P5 review.

Six own visible source lip fits transport through the exact head field and vertical bob to277 selected cells. Inactive paint and alpha remain exact; all277 change native RGB at both client sizes. The right profile is fitted to its actual encoded lip pixel without enlarging the head/cavity. True rear has no face. Rear-left's tiny far-side lip joins the native64px alpha edge and deliberately retains source paint without articulation; its explicit no-mouth reason is in the fitter. Speech and body ownership continue normally in these unsupported headings.

From repository root, with installed Pillow/NumPy/SciPy:

```powershell
$env:OMP_NUM_THREADS = '1'
$env:OPENBLAS_NUM_THREADS = '1'
$actor = 'assets/sprite-sources/street-speaker-motion/sabine-krueger/adult-v1'
$work = 'output/street-redesign/sabine-end-to-end'
python -B "$actor/prepare-neutrals.py"
python -B "$actor/build-family-source.py"
python -B "$actor/fit-adult-mouths.py"
python -B "$actor/prepare-family-mouths.py"
python -B "$actor/test-family-source.py"
python -B "$actor/test-provenance.py"
python -B "$actor/audit-source-field.py"
python -B "$actor/audit-floor.py"
python -B "$actor/audit-native.py"
python -B "$actor/audit-native-mouths.py"
python -B "$actor/measure-sole-cadence.py"
python -B "$actor/build-candidate.py" --outdir "$work/candidate-rebuild" --stride-distance 11.54
python -B "$actor/verify-selected.py" "$work/candidate-rebuild"
```

Use a fresh candidate output folder. The final verification compares all five rebuilt files with the selected source assets and actor record, excluding only the separately built delivery pointer. On first admission in an isolated pre-admission checkout only, pack to `candidate-v1`, run `install-candidate.py`, then use the existing `tools/build-street-motion-delivery.py --manifest assets/characters/street/manifest.json --character quiz-sabine-krueger --outdir assets/characters/street-speakers/quiz-sabine-krueger/delivery-v2/delivery`, run `bind-delivery.py`, and rerun the delivery builder with `--check`. The movement pack keeps348 slots and16,220,160 /7,208,960 decoded bytes; reactions keep17 slots and1,474,560 /655,360 bytes. No loader, framework, timer, queue or speech owner is added.

Exact selected source hashes: standing `5083ace8f5e495fc8b6bc24692ec8e40fda9db0a5b82ca847eeae8cabea9f710`, desktop `50ddf4ef064d388da0f1caff53eb090561bdfde7d834796e87789f13db3ff53e`, mobile `c2d156e6862d847d2ccdba3d8de36a6cbf85e459e2f283101237f84ea82a8d0f`, mouths `47a67eb3b9a0a3c0c6c55c77fae02c12c562caa5ff18736803bb60256a70f295`, delivery definition `1868ad8087e0e733c97c62218ce7e62dbff0d13440e2676723cd549dfe4b1397`.

Native source checks are not game acceptance. Root owns independent Physics/Camera review, integration and sequential release. Production browser, natural traversal/E, physical Android and perceptual listening coverage must be reported separately with their actual evidence.
