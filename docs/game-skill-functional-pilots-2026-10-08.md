# Functional pilots for installed game skills

Date: 8 October 2026. Frozen game revision: `14000b8d96cca25faa281f514d5b860cb36a9470`. Concurrent omen/rendering work stayed outside the measurements. These pilots used the installed skills, existing Node/Playwright harnesses and the same accepted static game architecture. They changed diagnostic tools/tests and routing records, not shipped game behavior.

**Recommendation:** retain focused gameplay evaluation and generated protocol properties. Use the Three.js worksheet for interpretation and repeatability when a profiling question warrants it; the existing project harness already provides much of its tooling. Keep all three conditional. The pilots establish useful procedures and executable coverage, not causal time/token savings. A blinded baseline/assisted comparison was not performed, and this agent had already read the skills.

The [committed results](game-skill-pilot-results-2026-10-08.json) record source/runner hashes, scenario summaries, eighteen complete profiling samples, CPU sample counts and limits. Full local JSON, CPU profiles and captures remain in `output/skill-pilots/`. The original broad recommendations are in [the source audit](game-development-skill-audit-2026-10-08.md).

## 1. Gameplay evaluation: useful production-rule counterexample

Question: can repeated crossing actions farm Germanness without completing a traversal? The existing crossing test checked red-wait/green rewards and red-entry rejection. The new [focused evaluator](../tools/evaluate-crossing-rewards.mjs) executes the production `addGermanness` and `updateGermannessEvents` functions, including the production cap/unlock constants. UI/audio side effects are stubs. Geometry comes from the existing test fixture; movement is scripted at 110 fixture units/second, with 25 ms steps for 60 seconds and 64 deterministic signal phases per policy.

The minimal trace sets the signal clock to 6.1 and moves `x = -1 → 1 → -1`, with `y = 20`. The production functions apply **one point after retreating to the same bank**. The crossing event remembers valid geometry and entry signal, but does not require an opposite-side exit. This is a concrete rule-level gap against the existing test's “completed crossing” wording. It is not a fresh real-input or whole-world exploit demonstration.

| Scripted policy | Scenarios | Unlocks within 60 seconds | Median unlock time among unlocked scenarios | Scripted full traversals |
| --- | ---: | ---: | ---: | --- |
| Repeated full crossings while green | 64 | 64 | 34.075 s | 24–25 |
| Wait at red, then traverse | 64 | 58 | 54.575 s | 4–5 |
| Enter and retreat to the same bank | 64 | 64 | 33.175 s | 0 |

The wait-red median is conditional on its 58 unlocked scenarios; the six censored scenarios are not silently counted as fast successes. Requested reward totals and actually applied capped points have separate fields. This model omits collisions, traffic, energy, quizzes, missions, dialogue and human behavior. Its phases are deterministic scenarios, not a sampled player population. No balance target was invented and no gameplay retuning was performed.

**Added value:** the skill's model-coverage and alternative-policy discipline led to a reproducible omitted case instead of a broad unsupported “balanced” verdict. Keep this route for concrete pacing/exploit questions. The gameplay owner should decide whether to require opposite-side completion, then validate any eventual runtime fix through the existing world/physics/camera gates. That fix is outside this skills pilot.

## 2. Property testing: stronger sequences, modest incremental novelty

The baseline had 22 protocol example tests, including roles, replay, malformed payloads, reconnect, UTF-8 limits and failed sends. The [extended existing test file](../tests/buergeramt-link.test.mjs) adds two tests without a new runner or dependency.

- 32 seeds × two receiving roles × 16 steps produce **1,024 accepted valid transactions** and **9,216 rejected malformed/replay attempts**.
- Accepted deliveries must arrive once with unchanged payloads. Malformed high sequence numbers must not consume the next valid sequence. Invalid messages enter the receiving channel directly, bypassing outbound validation.
- Coverage assertions require all eight selected message families, register lengths 2/80, pong/police clocks 0/1/999999988000, and pong durations 0/1/12000. There is no discard filter.
- Two deliberate guard removals make the properties fail: replay ordering and exact payload fields. Production source is never modified by these sensitivity probes.

The independent reviewer found that the first generator's low-bit modulo choices correlated with its draw order, missing intended boundaries. Scaling the full random word fixed that, and explicit coverage assertions now protect it. Fresh review and execution passed all **24 tests** afterward.

**Added value:** bounded combinations and sequences expand the existing examples and are demonstrably sensitive to failures. No new production protocol defect was found. Sender/receiver share the production validator, so roundtrip agreement alone is not an independent schema oracle; the separate malformed injections and existing schema examples remain necessary. Coverage is a selected subset, without automatic shrinking, real WebRTC or physical-device runs. Retain this small addition, and use PBT only for a meaningful invariant rather than rewriting the whole suite.

## 3. Three.js profiling: diagnostic value, no accepted optimization

The existing browser harness already provided silent sessions, source hashes, counters, startup/resource records, input probes, screenshots and CPU profiles. The pilot added validated optional `BENCH_DPR` and `BENCH_SEED`, recorded those settings, rejected nonpositive/noninteger run counts, and preserved partial results on failures. Cleanup still runs if report writing fails. Defaults retain existing behavior.

The first gated attempt failed when an emulated-mobile opening sample produced **17 sync calls**, above its existing **16-call** check. The original harness discarded its partial report; the terminal result and partial CPU profiles supplied that observation. Later diagnostic runs do not erase the failure. No runtime cause or budget-policy change was accepted here.

Three complete sets followed: six unseeded diagnostic samples and twelve seeded resolution samples. Each set uses three desktop and three mobile-emulation samples. Seeded runs use initial seeds 41–43, the same frozen runtime, prescribed keyboard probes and roughly three seconds of profiled gameplay. Requested DPR 2 is capped by this renderer to effective DPR 1; requested DPR 0.5 produces half-width/height drawing buffers.

| Profile | Samples per scale | Actual full → lower drawing buffer | Median gameplay p50 across runs, full → lower | Median gameplay p95 across runs, full → lower |
| --- | ---: | --- | --- | --- |
| Desktop | 3 + 3 | 1280×800 → 640×400 | 26.7 → 17.9 ms | 31.5 → 28.4 ms |
| Mobile emulation | 3 + 3 | 390×844 → 195×422 | 15.3 → 16.3 ms | 21.7 → 21.6 ms |

Desktop full-scale p50 varied 20.6–27.6 ms, and lower-scale p50 16.9–28.2 ms. One paired desktop sample became slower. The mobile full-scale p95 included a 98.6 ms outlier. Three samples, overlapping variation, fixed experiment order and uncontrolled scheduling do not establish a robust quality/performance tradeoff. Lowering global browser DPR also changes the separate 2D canvas; this is not an isolated shader or GPU experiment. No lower-quality setting was shipped.

Repeated CPU sample-count leaders include Three.js matrix traversal/projection/frustum work and production `nearestRailLocation`, `responderBlocked`, `groundStaticMotionBlocked` and vehicle contacts. These identify investigation targets, not a proven sole bottleneck. Weighted profiling intervals contained startup/sampling gaps; a roughly 201 ms gap in one flame sample must not be described as sustained flame execution cost. The committed record uses sample counts rather than treating weighted gaps as exact function duration.

Conditions: headless Chromium 148.0.7778.96 on Intel Iris Xe/D3D11, local uncompressed HTTP, no CPU throttle, isolated cold contexts in a reused browser process. Mobile emulation uses that same desktop CPU/GPU; keyboard input is measured, not Android touch input. Samples measure sync-start intervals and state-observed response, not GPU time, displayed frames, field INP or physical Android performance. Seeded initialization does not freeze camera endpoints, moving actors or async completion. Start/dialogue shortcuts do not prove the natural mission chain. Audio was muted within the isolated sessions; no listening review occurred.

**Added value:** modest. The worksheet improved experimental records, identified a resolution confound, and kept partial evidence honest. Most instrumentation was already present. Keep the skill for targeted investigation, and require comparable rendered/device evidence before accepting an actual optimization. Resource-lifetime/office-cycle questions remain untested by this city-view pilot.

## Reproduction and scope

Use an isolated checkout of the frozen revision for the model/browser results and the new diagnostic tool revisions from this change. Run `node tools/evaluate-crossing-rewards.mjs` from that checkout. `node --test tests/buergeramt-link.test.mjs` reruns the protocol properties; future production changes may change the measured reward result without breaking the evaluator.

For profiling, use the existing `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` configuration. Set `BENCH_GPU=hardware`, `BENCH_PROFILE=1`, `BENCH_RUNS=3`, `BENCH_SEED=41`, and separate `BENCH_OUTPUT` paths. Run `node tools/benchmark-browser.mjs` with `BENCH_DPR=2`, then `0.5`. Use a real isolated checkout for frozen assets; `BENCH_REF` overrides only the tool's listed source files. Benchmark with `BENCH_CHECK=1` when claiming acceptance, and preserve any failure. No new CLI install, service, scheduled task or default CI gate was added.

Independent read-only reviewers checked the evaluator/model limits, properties/generator coverage and profiling interpretation. No shipped runtime/world change belongs to this candidate; world specialist acceptance reviewers were therefore out of scope. Other installed skills were not behaviorally evaluated. Controlled productivity, newcomer observation, natural mission completion, physical Android, real paired-device and listening evidence remain **NOT RUN**.

Final CLI checks passed for zero DPR, fractional seed, zero/fractional run count, browser-launch failure with an incomplete report, and report-write failure with cleanup. Protocol tests, syntax checks and the installed-skill integrity validator passed. These helper checks do not promote the earlier frozen-game browser-budget failure to PASS.

The [implementation follow-up](game-skill-implementation-followup-2026-10-08.md) fixes the crossing defect and adds elapsed-window benchmark checks against the later game. The frozen results above remain the historical pilot; the follow-up does not retrospectively certify its failed browser sample.
