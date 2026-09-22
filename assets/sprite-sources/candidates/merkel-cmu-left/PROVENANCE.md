# Merkel CMU left-walk pilot

Status: preview-only, unapproved candidate. Scope: Merkel, left-facing walk only.

This pilot retargets the 2D side projection in
`assets/sprite-sources/reference/cmu-walk-69-01/walk-cycle-21.json` onto the
existing identity-matched Merkel side-view parts. Captured directions control
shoulder–elbow–wrist and hip–knee–ankle chains. Merkel's authored bone lengths,
head, hair, face, jacket, and compact caricature proportions remain fixed.

The preview atlas has 20 playable cells plus cell 21 as an exact copy of cell
one for seam inspection. It is deliberately not a complete directional atlas,
is marked `candidate-unapproved`, and must not replace or redirect the stable
game sprite. Build and validate with:

```powershell
python tools/build-cmu-walk-reference.py
python tools/build-merkel-cmu-left-pilot.py
python tools/verify-merkel-cmu-left-pilot.py
```
