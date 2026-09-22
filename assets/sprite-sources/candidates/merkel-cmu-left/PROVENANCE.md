# Merkel CMU left-walk pilot

Status: preview-only, unapproved candidate. Scope: Merkel, left-facing walk only.

This pilot retargets the 2D side projection in
`assets/sprite-sources/reference/cmu-walk-69-01/walk-cycle-21.json` onto the
existing identity-matched Merkel side-view parts. Periodically fitted captured
directions control shoulder–elbow–wrist, hip–knee–ankle, and ankle–toe chains.
The painted foot follows the captured pitch phase inside a bounded ±22° range;
its heel is derived from the same foot axis. Merkel's authored bone lengths,
head, hair, face, jacket, compact caricature proportions, and body root remain
fixed, so the gait cannot recenter or shake the complete sprite.

The preview atlas has 20 playable cells plus cell 21 as an exact copy of cell
one for seam inspection. The sequence explicitly runs left-foot-forward,
right-foot-forward, then back to left-foot-forward. It is deliberately not a complete directional atlas,
is marked `candidate-unapproved`, and must not replace or redirect the stable
game sprite. Build and validate with:

```powershell
python tools/build-cmu-walk-reference.py
python tools/build-merkel-cmu-left-pilot.py
python tools/verify-merkel-cmu-left-pilot.py
```
