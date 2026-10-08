# Gameplay HUD redundancy and readability audit

Request: remove the pale controls strip and reduce persistent text boxes, using a fax-paper treatment and occasional mission reveals.

## Findings and repairs

| Element / moment | Finding | Repair | Evidence status |
| --- | --- | --- | --- |
| Bottom controls footer, ordinary desktop play | The reported white line was a full-width permanent help/settings strip. | Removed the footer; controls, music, voice and subtitle settings are in Akte → Bedienung. | Rendered and interacted with. |
| Mission, ordinary play on desktop and phone | Both title and instruction used ellipses; the independent reader could not read the requested action completely. | Wrapped full objective in the file and temporary incoming fax. M/tap reopens it. | Rendered at 320–1280 CSS px; long English and enlarged text exercised. |
| Logo, resource row, vertical meter/pass, rule, footer and subtitle toggle | Seven persistent desktop surfaces competed with the world. Several served occasional decisions. | One persistent file/day tab; police and low-energy warnings are conditional. Status, collection and settings have separate file pages. Touch movement remains directly available. | Quiet desktop and phone captures inspected. |
| Current rule + spoken announcement | Same rule simultaneously appeared in two boxes; the announcement occupied the player/path area. | Rule history lives in the file; the original speech textbox uses a compact edge column. | Baseline isolated-reader finding; repaired frames inspected. |
| Germanness threshold and badge cells | Threshold marker looked like a partly filled meter at 0/15. Phone omitted badge cells. The second reader pass also found the dark empty track ambiguous. | Explicit 9/15 threshold text, pale empty track and no misleading marker; collection page includes nine larger cells on phone. | File/status/collection captures inspected; 0/15 versus 9/15 rendered separately. |
| Mission + simultaneous toast, bark and violation | Independent fixed boxes could cover each other and obscure play. | Mission defers; warnings and speech flow in one edge column. Critical violation comes first. Short landscape/zoom views can pan the column above the measured touch-control boundary. | Forced coincidence, with nonoverlap and rendered inspection. |
| Open file + speech | A native modal could hide an existing spoken-text notice. | Move the same notice node into the file while open, then restore it. Audio ownership/text/timing stays with the existing broker. | Source review and silent UI checks; no listening claim. |
| Narrow screen, resize, enlarged text | Unbounded labels and stale minimum heights can clip text or consume the page. | Pinned Pretext measurements, wrap/reflow states, reversible button sizing, paged content and vertical document fallback. | Default and 200% text at 320px; narrow-to-wide sizing assertion; CSS zoom and text-spacing captures. |

The identity/title screen, mission chain, world geometry, camera, actors and office HUD are unchanged by this patch. Physics/camera specialist reviews were omitted for this DOM-only scope; opening the file uses a simulation pause guard and clears held input.

## Behavior and implementation

Mission faxes appear on objective changes and may return after 90 seconds. They wait for a quiet city moment and retract if a higher-priority message starts. Reading time is 12–30 seconds, extended while hovered/focused. Dismiss and full-file controls remain available. Hidden pages stop the HUD timers; visibility and history restoration schedule the current state again.

The paper uses a short CSS blur/fade reveal/departure and perforated edge. This is **not 3D Gaussian splatting**. There is no reason to load Spark, a splat asset, another canvas or a frame loop for flat mission copy. Reduced motion disables the transition.

`game-hud.js` and `game-hud.css` add approximately 18.5 kB of uncompressed source and reuse the shipped Pretext 0.0.9 module. No new raster assets or dependencies. Prepared text cache is capped at 96 entries. Measurements are coalesced after content/font/bounds changes, not simulation frames. Timers belong to the current fax/reminder, stop when hidden, and restart on history restoration.

## Verification

Local evidence is retained under ignored `output/hud-audit/` in the attached `fax-hud` worktree. `check.mjs` serves an instrumented copy of the current game solely to set staged UI states; no test seam ships in the runtime. The opening uses the existing S shortcut and Next controls, not the natural mission chain. Ordinary quiet/file frames, forced mission changes, and forced coincidences are distinguished in that script.

- Chromium desktop 1280×800; Android touch emulation 390×844, 320×568 and 844×390. Text enlarged to 200% at 640×800 and 320×568; separate CSS zoom proxy and increased text-spacing captures. Physical Android was unavailable.
- Open/close by mouse/tap and M/Escape, focus restoration, held-input release, paused movement and deadline, working audio settings, objective-change reveal, notice nonoverlap, current-text Pretext measurements and reverse resize were exercised.
- The 90-second reminder and expiry use Playwright virtual time. History restoration uses synthetic persisted page lifecycle events; this tests the event handlers, not a real browser cache eligibility/navigation cycle. Reveal first/mid/last captures seek the actual CSS animation. Reduced-motion style is asserted.
- An isolated reader reviewed before/after screenshots without source. A separate read-only technical reviewer identified lifecycle and fitting issues; those were repaired and re-reviewed. The screen-manifest checker was not used: geometry assertions and image inspection are reported separately, with no contrast-measurement or human-device claim.
- Browser budget, smoothness, responsiveness, asset admission, tourist animation, intro music, subtitle and touch-control Node checks passed. The six atlas delivery exports remain byte-identical to their decoded originals.

### Comparable browser budget runs

Baseline is `23af451`, using the same current world assets and styles as the candidate. Three cold runs per condition; separate contexts; local uncompressed HTTP; DPR 2; headless Chromium with Intel Iris Xe via hardware ANGLE; no CPU/network throttling. Audio media, Web Audio and speech were muted before navigation without muting the computer. The two benchmark batches ran serially. These small lab samples include host noise and do not establish an optimization or physical-device performance.

| Metric, median (range) | Before desktop | After desktop | Before Android emulation | After Android emulation |
| --- | --- | --- | --- | --- |
| Readiness, ms | 3569 (2888–4270) | 3698 (2973–3830) | 2815 (2443–3125) | 2159 (2076–2394) |
| Warm frame p50, ms | 17.4 (17.3–32.0) | 19.0 (17.4–19.7) | 16.3 (15.7–16.3) | 15.2 (14.9–16.0) |
| Warm frame p95, ms | 23.0 (21.3–53.2) | 26.6 (21.7–29.0) | 22.6 (20.9–24.0) | 22.8 (22.4–23.0) |
| Input-to-state p95, ms | 43.9 (34.1–52.7) | 38.3 (27.2–55.5) | 34.7 (31.0–39.9) | 27.3 (24.4–34.7) |

All 12 benchmark runs passed the existing resource/input gates: startup transfer below 18 MB, title render at 4 Hz, drawing buffer at most 1.6 MP, accepted movement and no page errors. Candidate startup transfer ranged 14.80–16.36 MB on desktop and 15.29–16.04 MB in Android emulation. Detailed requests, long tasks, draw calls, triangles, textures/geometries and source hashes remain in `before-integrated/report.json` and `after-benchmark/report.json`.

Remaining scope: physical Android, assistive-technology user testing, perceived audio quality, and natural full-mission-chain play were not tested. At extreme text sizes or a forced three-notice coincidence in short landscape, the document/notice column must be scrolled; copy stays available and the touch controls stay unobstructed. Source/render checks do not establish newcomer understanding of the whole game.
