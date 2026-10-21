# Sandale mouth source candidates

These registrations reference the exact accepted PNG masters under
`assets/tourists/{towelMan,towelWoman}/`; their lossless delivery pixels remain
unchanged. This folder does not activate mouths or replace their accepted bodies,
walking controllers, turns, gestures or cycle distances.

`*-native-pilot-v1.registration.json` contains three individually measured native
cells: front, right and left. Crease/corner points use positive-down native atlas
pixels. The man's maximum opening keeps the upper seam fixed beneath his own
moustache. The first front crease was corrected upward after inspecting the actual
lip seam; the earlier fit is preserved in ignored task evidence.

`*-walk-v1.registration.json` contains24 visible gait cells each. The own native
seeds were fitted directly to each final cell with bounded affine paint alignment;
both mouth axes and all five contour points use that fitted matrix. These are final
pixel fits, not a replay of the original animation's deformation fields. Worst RGB
patch residual is about21/255, so residual alone cannot establish anatomical fit.
Root inspected all48 paired source/open crops. The shared compiler is
`tools/build-street-mouths.py` (`compile_registration` and `preview`).

`*-bridges-v1.registration.json` adds15 front/right/left stop/start cells each.
Root inspected all30 bridge crop pairs. The bounded diagnostic fitter is
`tools/fit-sandale-mouth-cells.py`; it writes ignored candidates and cannot activate
art. Six bridge solves per figure reached their iteration bound; that status and
all fit matrices/residuals remain explicit. Direct pixel review, not solver status,
is the source-only gate. Independent correspondence/GPU acceptance remains open.

`*-remaining-v1.registration.json` completes the remaining turns, reactions and
look poses:67 visible registrations for the man and66 for the woman. Together
with the39 gait/bridge fits each, every152-slot atlas is inventoried:106/105 visible
mouths and46/47 rear/occluded/unused nulls. The woman's turn5:3 shows no lip and
stays null. Steep look openings retain their naturally weak appearance.

Root inspected every source/zero/open cell in desktop-size light/dark review
boards. All133 new zero closures are exact; alpha and67 protected moustache
checks pass. This is direct final-pixel source acceptance, not original-field
replay, continuous gait, GPU or native-audio acceptance. The compiler
`tools/build-sandale-mouths.py` emits ignored integration metadata. An inline
manifest/native-atlas adapter candidate is now under separate independent review;
its presence is not a release or full-cast completion claim.

Review crops, fit matrices/residuals, exact source checks and handback hashes are
under ignored `output/ambient-city-animation/sandale-mouth-inventory/`. The active
task and acceptance owner remain in `docs/engineering/GAME-COMPLETION.md`.
