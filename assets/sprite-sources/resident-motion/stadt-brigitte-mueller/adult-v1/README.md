# Brigitte Müller adult source

Own identity: `stadt-brigitte-mueller` / `city-brigitte-mueller`, distinct from crowd/quiz Brigitte. Mature brown bob with grey front streak, round wire glasses, olive scarf, brick jacket, charcoal knee skirt, grey stockings and black flat **strap** shoes. One cream envelope belongs to her anatomical LEFT arm; RIGHT hand stays empty. Source is the user's mature painterly Berlin direction with adult stature comparable to Söder and the Sandales.

`pre-admission-person.json` freezes her original standing-only registry entry. `pre-admission-family.json` freezes her existing complete legacy16×13 family: four16-phase walks, eight whole-body headings and four16-sample actions. The redesign preserves original idle/look/success/failure durations:1280/960/960/960ms. Production maps legacy `idle` to painted `wait`, so `wait` aliases the exact same original idle row and timings. This supplies no greeting, work or review claim.

The three immutable built-in ImageGen PNGs in `raw/` retain original bytes and alpha. Exact request prompts, reference hashes and original output paths are adjacent. Cardinal source22b094d4… supplies four independent front/right/rear/left bodies. Quarter source1ec16b98… supplies rear-right/rear-left/front-left. Its too-frontal first quarter is held, and singleton41bf1857… supplies a genuine full-body front-right turn. No cardinal is reflected. The prior standing-v3 receipt is retained as identity history; held historical direction trials are not selected.

Registration uses whole-source density846/842/1472 pixels to one400-pixel working figure on512×512, sole472. This normalizes source resolutions, never individual body parts or atlas cells. Both planted shoe supports locate each body's horizontal root. Native exports use96×120 desktop and64×80 mobile with the same logical128×160 cell/pivot64,150 and2.33-world-unit figure. Source masters remain authoring material; production must request only selective movement/reaction banks.

Side motion follows a connected y-shaped source seam around her own overlapping stockings/strap flats, with constant opposing stance travel and a continuous swing. Own source RGBA sole points are checked in `audit-source-contacts.py`: right[83,74,67,252] travels270→260→250, left[68,65,61,252] travels250→260→270 at phases4/8/12. This is a near-shoe source observation; it does not independently mark a hidden far shoe or prove runtime planting. The existing native source-foot fit sets the final distance per cycle from the alpha-weighted centroids of an inspected own source RGB sole patch transported through the exact same continuous sampling field. It does not fit rounded predicted points or metadata displacements. Vertical walks use the existing effective `painted_walk.animate(limb_pose=…)` planted-floor callback through the connected hip-to-ankle field. A flag alone does not activate that callback. Her right hand is protected as an actual own-source polygon.

The logical21×20 source has412 selected cells: four16-phase walks,20bridges, eight headings,256phase-specific settle cells and64original action samples. Existing `planted_action` supplies the same original bounded body/nod/success-lift semantics and durations. The current source fields and all lips retain body/media ownership; no new loader, runtime timer, service or engine is added. Five visible source mouths are measured against Brigitte's own closed crease; rear and both rear quarters are deliberately null. Both lip axes follow exact body fields, including the original action sampler. Her two original German MP3s, voice profile, text and40Hz media cues remain unchanged.

Rebuild from the repository root with existing Pillow/NumPy/SciPy, one thread. Full bakes and browser work must use the integrator's exclusive resource lease on this16GB host.

```powershell
$actor = 'assets/sprite-sources/resident-motion/stadt-brigitte-mueller/adult-v1'
$work = 'output/street-redesign/brigitte-mueller-end-to-end'
$env:OMP_NUM_THREADS = '1'
$env:OPENBLAS_NUM_THREADS = '1'
python -B "$actor/prepare-neutrals.py"
python -B "$actor/audit-source-contacts.py"
python -B "$actor/fit-adult-mouths.py"
python -B "$actor/build-family-source.py"
python -B "$actor/prepare-family-mouths.py"
python -B "$actor/audit-native.py"
python -B "$actor/audit-native-mouths.py"
python -B "$actor/measure-sole-cadence.py"
# Native own-RGB centroid fit11.8298432451; selected distance11.83 per full cycle.
python -B "$actor/build-candidate.py" --outdir "$work/candidate-v1" --stride-distance 11.83
# Already admitted/public checkout: verify the fresh candidate against the selected actor.
@'
from pathlib import Path
import hashlib,json
candidate=Path('output/street-redesign/brigitte-mueller-end-to-end/candidate-v1')
p=json.loads(Path('assets/characters/street/manifest.json').read_text())['characters']['stadt-brigitte-mueller']
assert json.loads((candidate/'person.json').read_text())=={k:v for k,v in p.items() if k!='motionDelivery'}
for meta in [p['standing'],*p['variants'].values(),p['mouthPaint']]:
    assert hashlib.sha256((candidate/Path(meta['file']).name).read_bytes()).hexdigest()==meta['sha256']
print('PASS fresh candidate assets and selected person')
'@ | python -
python -B tools/build-street-motion-delivery.py --manifest assets/characters/street/manifest.json --character stadt-brigitte-mueller --outdir assets/characters/residents/stadt-brigitte-mueller/delivery-v2/delivery --check
node --test tests/brigitte-mueller-adult.test.mjs
# New nonexistent ignored mirror required; requires its own exclusive CPU lease.
python -B "$actor/clean-rebuild.py" --name bm-clean-v1
```

For the initial isolated admission into the immutable prior-person worktree, run `install-candidate.py`, then the existing delivery builder without `--check`, then `bind-delivery.py` before the candidate verification commands. An already admitted/public checkout skips those three mutation commands. The empty-mirror command runs directly from tracked own raw inputs, recipes, motion-spec and prior-person bootstrap; no existing private working artifacts or current full registry are required. Its22-output comparison reads the tracked validation-only baseline after generation. The candidate output and `bm-clean-v1` directories must initially be absent; retain prior attempts under separate names.

Installation is first admission only and refuses a changed prior actor or existing destination. It writes only this actor's object. The full412-cell source,824native body cells and648visible native mouth cells pass their mechanical checks and representative visual inspection. The selective packs reproduce exactly; the20encoded source sole cells match the source exports, and all320original mapped action plans finish/resume in the focused test. Original action durations and both German recording identities remain exact. The empty-input clean replay in `output/bm-clean-v1` reproduced22exact outputs and the complete selected-person object from39raw/recipe/spec/helper inputs, with10hidden one-thread BelowNormal child processes. No registered, compiled, selected or full-cast registry inputs were copied. Actual production stress and independent Physics/Camera acceptance are recorded separately in the final actor handoff and specialist receipts; verify those gates before publication. This authoring README does not claim their result. The inspected contact pilot is source evidence only. Browser evidence must distinguish staging from natural routes, Android emulation from hardware and silent media checks from listening. Only the integrator accepts and publishes.


## Final encoded-frame analysis

The actor-owned `prepare-final-frame-analysis.py` adapts Hartmut's existing artifact scaffold and never rebakes body/mouth fields or changes shipped assets. After the native source boards and selected source atlases exist, run it to extract all 412 exact selected cells for desktop and all 412 for mobile. It verifies all 100 existing native light/dark boards pixel-for-pixel against the encoded exports and prepares 16 explicit encoded bridge boards and per-cell source comparisons.

```powershell
python -B "$actor/prepare-final-frame-analysis.py"
# Personally inspect both complete native encoded atlases, all 116 ordered
# light/dark boards and the registered direction references. Record the actual
# reviewed image hashes/observations in final-frame-analysis/inspected-boards.json.
# Acceptance requires that real review; filenames alone do not approve artwork.
python -B "$actor/prepare-final-frame-analysis.py" --accept-reviewed
foreach ($variant in @('desktop','mobile')) {
    python -B .agents/skills/animate-2d-characters/scripts/audit_final_frame_analysis.py "$work/final-frame-analysis/$variant-manifest.json" --review "$work/final-frame-analysis/$variant-review.json" --report "$work/final-frame-analysis/$variant-audit.json"
}
```

The completed actor handoff contains both formal audit reports: 412 frames each, all eight categories, no errors. Its source/native/light/dark/ordered images and actual observations are hash-bound. Source/body/mouth/voice/generation pixels and runtime remained byte-exact while this artifact-only gate ran. The earlier explicit NOT RUN report and packet remain in the handoff history. The earlier 39-input/22-output clean replay predates only authoring metadata and this uninvoked audit helper; final delta receipts identify those changes and reconfirm all 22 generated outputs and the selected person. New clean mirrors copy the extra review helper as an unused file; the generation commands are unchanged. Current integrated specialist review and publication remain the integrator's separate gates.


## Integrator portability correction

The tracked `motion-spec.json` supplies the same source-fitted11.83 stride to the unchanged raw generation commands. `rebuild-baseline.json` stores22 expected hashes and the exact selected person for comparison only after generation. The empty mirror no longer reads the current full registry or ignored root working files. The prior raw-only replay remains the generation proof; the integrator separately runs the exact repaired validation block in a fresh root with all original expected paths absent, using the prior replay outputs as validation data. This is a bounded portability preflight, not a second raw generation replay. Artwork, native exports, voices, runtime and every generated output remain unchanged.
