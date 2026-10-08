# Ponytail audit of installed game skills

Date: 8 October 2026. Scope: the eleven newly installed skills, their reachable reference procedures, executable checker, installation validator and For-AI integration. Read-only research reviewers applied Ponytail's complexity review; the integrator implemented the approved cuts and handled correctness separately. No game runtime/world behavior changed in this task, so the world-specific Physics and Camera acceptance roles were out of scope.

All eleven capabilities remain installed. The bundles are **280 lines and 2,335 words smaller** than the initial adapted installation, counting their Markdown/helper files and updated notices. These are size reductions, not measured time/token savings. No new package dependency, service, scheduler or runtime framework was introduced. Upstream revisions, original/installed hashes, licenses and modifications remain in [the source manifest](../.agents/skill-sources.json).

## Ranked complexity findings and applied changes

1. **shrink:** replaced the 279-line PBT history/evaluation README with a short local reference index. Its absent paid Claude/Bash evaluators and removed effort override no longer read like installed requirements. The five task references, attribution and CC BY-SA license remain.
2. **reuse:** all eleven entry points now link to the shared project contract instead of repeating the global stack/permission paragraph. Each retains its skill-specific applicability and modification notice. The evidence taxonomy has one owner in the shared review format.
3. **reuse:** removed duplicate LCP recipes and discovery metadata from the supporting web-vitals reference. Detailed LCP guidance remains available through its local reference. Native dynamic import replaces the React-only loading examples.
4. **yagni:** a focused HUD edit now inspects affected elements and reachable coincidences. It uses existing captures/DOM measurements; renderer instrumentation requires a demonstrated need. Whole-display enumeration remains available for a requested release audit.
5. **reuse:** level changes use existing geometry and the affected path; blockout is for new/uncertain geometry. Existing domain owners replace irrelevant engine/genre handoffs.
6. **reuse:** gameplay validation uses the existing evidence record. A focused check needs one row; the chain × mode matrix is for end-to-end/multiple-mode claims. Irrelevant gear/difficulty fields are N/A.
7. **yagni:** input checks exercise supported APIs and affected lifecycle events. An absent gamepad/Pointer Lock feature is N/A. Evaluation reuses approved questions/targets and asks for new target decisions only when needed.
8. **stdlib:** both checkers use Node's assertion library; the installation validator uses a direct fence regex. Boundary, hash, path-case, license, icon and coverage checks remain.

## Per-skill implementation and procedure review

| Installed skill | Decision |
| --- | --- |
| eval-driven-game-development | Keep sampling/model-limit procedures and conditional harness references; reuse accepted targets and existing Node runner. |
| threejs-performance | Already lean: entry plus one worksheet, no helper/dependency payload. |
| threejs-debugging | Already lean: entry plus one diagnostic reference; preserve current renderer. |
| property-based-testing | Keep the five selectively read references; shorten historical README and preserve user effort. |
| game-design-reality-check | Already selects the lightest useful mode and omits irrelevant report sections. |
| gameplay-validation | Reuse shared evidence rows; retain natural-chain, driver and shortcut limits. |
| game-localization | Keep supported-locale/ID/fallback checks and existing text/state owners. |
| browser-input | Keep lifecycle checks; scope unsupported APIs out explicitly. |
| level-design | Reuse the canonical world; prototype only uncertain geometry and preserve specialist reviews. |
| auditing-game-screen-readability | Narrow enumeration/instrumentation; retain six defect checks and fix incomplete-input semantics below. |
| web-performance | Keep loading/DOM measurement, optional supporting references and local lab evidence; remove duplicate/framework-specific recipes. |

The machine-readable manifest and per-bundle SOURCE/license notices serve different consumers and were retained. The one-time installer/adaptation drivers and case fixtures remain in ignored task output rather than becoming another project toolchain.

## Separate correctness finding: false checker success

The upstream readability checker could report no findings and exit 0 for empty frames, no readable elements or malformed numeric rectangles. Reviewers reproduced those cases. Its local applicability note already required real coverage, but the executable did not enforce that boundary.

The existing checker now rejects empty relevant coverage and invalid required dimensions/measurements. It records missing optional measurements and unresolved draw order as INCOMPLETE. Brief-duration checks need both duration and character count. The CLI exits 0 for complete supplied measurements without findings, 1 for findings/invalid input, and 2 for incomplete evidence. This does not prove that the caller captured every required game state; pixel thresholds remain provisional and visual review remains necessary.

The existing self-test now checks empty/malformed rejection and incomplete reviews alongside all six defect classes and z-order behavior. A CSS example was also given the correct code-fence language.

## Verification and limits

- Installation validator: **PASS**, eleven bundles, 64 hashed files, 47 local inline references/metadata icons. It rejected an intentionally stale content hash before the authorized hash refresh.
- Official Codex quick validation: **PASS** for all eleven installed entry points after the procedure edits.
- Readability checker self-test: **PASS**, including defect classes, draw-order cases, empty coverage and malformed rectangles.
- Eight CLI cases: **PASS** for complete input, empty frames, no readable elements, invalid rectangle, invalid scale, missing measurement, unresolved order and a real size defect.
- Licenses/notices and all requested capabilities remain present; modified-source notices and installed hashes were refreshed.
- Fresh independent final code review: **PASS**, no required corrections. The reviewer reran the validator/self-test and direct complete/incomplete/invalid-input cases; inspected CLI semantics match the eight supplied CLI results. Two wording corrections were applied afterward and integrity checks refreshed.

The installation validator checks integrity and basic discovery fields; its inline-link scanner is intentionally not a complete CommonMark parser or a behavioral benchmark. No new browser/device playtest, listening review or paired productivity trial was performed. Skill effectiveness remains **NOT RUN** until a representative development task demonstrates it.
