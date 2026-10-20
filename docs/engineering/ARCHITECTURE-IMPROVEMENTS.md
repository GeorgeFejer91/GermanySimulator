# Architecture improvements

**Goal:** Implement the six architecture audit improvements. Load only assets needed by the current scene and keep broad device compatibility the priority. Public asset visibility is acceptable.

**State:** Local implementation, independent review and final local acceptance complete; publication pending. One integrator owns `codex/architecture-improvements`, based on published main `614d21d9488ddff25025be0112b23252abe1b773`. The primary checkout's unrelated game/assets work remains preserved. Current published features and the `3d.html` compatibility redirect are retained.

## Implemented scope

- [x] **Demand loading:** office preparation requires Start and proximity to its actual entrance, or explicit entry. The phone-link SDK starts on demand. Existing procedural fallbacks remain usable. No asset was hidden merely because it is public.
- [x] **Bounded asset jobs:** one directly testable two-slot queue retains foreground/normal/background priority, hidden-page admission, 30-second execution and 120-second admission deadlines. Actual fetch signals, per-owner cancellation, shared-reference release, late-result disposal and guarded scene installation cover affected model, texture, sprite, audio and Gaussian consumers. Native import/decoding may finish internally; cancellation prevents stale installation.
- [x] **Browser deployment gate:** the existing silent runner checks built startup, failure fallback, input, lifecycle and both normal keyboard questionnaire locales across desktop and Android portrait/landscape emulation before Pages deployment. Playwright is locked under development tools; failed evidence has bounded retention.
- [x] **Explicit state advancement:** root update advances building transitions once per frame; render projects state and defers drawing failures to update. Jobcenter update owns movement, media fallback, rumble and pause handling. Touched consumers receive narrow input commands. Completion/cancellation remain exactly once.
- [x] **Shared building data:** one frozen catalogue owns all 37 records. Runtime mutable copies preserve offsets; direct-level generation and affected tests import structured data. Every original field/order and all 31 generated direct routes/aliases are preserved.
- [x] **Keyboard/modal access:** visible semantic Sign/Clear share validity with pointer signatures. Modal entry, Tab containment, inert background, restoration and gameplay-input ownership are explicit. Actual locale/font Pretext measurements, wrapping and 44-pixel touch targets remain. Office actions reserve measured caption clearance in coarse layouts.
- [ ] **Release:** finish final budgets, commit the scoped candidate, deploy and verify the public root, compatibility redirect and direct routes.

The existing static JavaScript/Three.js runtime and single asset authority remain. No state-management framework or second game was introduced. Lasting rules live in [asset policy](../../For-AI/ASSET-POLICY.md), [transitions](../../For-AI/LEVEL-TRANSITIONS.md), [level URLs](../../For-AI/LEVEL-URLS.md) and [gameplay](../../For-AI/GAMEPLAY.md).

## Acceptance evidence

Evidence is retained under the integration checkout's ignored `output/architecture-improvements/`. Early primary-candidate receipts are historical and do not certify the release candidate. Frozen release candidate 5 binds 54 runtime/tool/test owners to the release base; its runtime matches the built `release-candidate-site-3` snapshot.

| Check | Result and scope |
| --- | --- |
| Clean release Node baseline | 2161/2161 PASS. |
| Final complete Node suite | 2183/2183 PASS, no skipped checks; final CSS/probe selection adds 18/18 PASS. |
| Actual built browser selection | 17/17 PASS: startup/failure, input, lifecycle and complete DE/EN normal keyboard questionnaires across desktop and two Android-emulated orientations. |
| Final office readability | 4/4 PASS: desktop, portrait, actual landscape and reduced motion. Fresh image review confirms readable controls; mobile caption clearance is 22–23 pixels. |
| Final lifecycle | Desktop and both Android orientations PASS. Reduced-motion successor PASS, including two warmed exits disposing 15/15 actual room resources each. |
| Reduced-motion keyboard | 2/2 PASS, complete normal DE/EN two-sheet questionnaires and measured layout/focus checks. |
| Cold-load budgets | Final six runs PASS: desktop 16,021,144 bytes each; Android emulation 15,634,726 / 15,634,836 / 15,634,726 bytes. Every run accepts nine inputs and has zero page errors; 18 MB transfer, 4 Hz title and 1.6 MP buffer gates pass. Comparable baseline desktop range 14,392,401–15,868,075; Android range 15,481,145–15,820,668. No universal transfer reduction or speedup is established. |
| Independent review | Physics, Camera/Scale and technical reviewers verified the same frozen owners. Source findings closed; Camera inspected fresh portrait/landscape frames. Final tool-only disposal instrumentation independently accepted. |

## Observed failures and repairs

Regressions retained with their failing receipts include global pause bypassing Jobcenter media suspension and a pre-aborted shared lease rejecting before observation. Both received production fixes and passing regressions. The keyboard runner's second-sheet wait incorrectly matched the total-page count; it now matches the second-sheet prefix while retaining complete normal form interaction and original deadlines.

Camera review found ordinary-office controls painted beneath subtitles when the touch dock was hidden. The CSS now reserves the larger of measured dock or subtitle height; actual desktop/mobile/reduced captures pass.

The reduced-motion lifecycle's old global renderer no-growth assertion was confounded by city streaming: geometries increased while unrelated city work was active, and future demand remained possible after temporary idle. The replacement instruments the production room release before door removal, requires a unique anchor and nonempty resource capture, observes actual disposal events, and requires exactly one complete receipt per exit. Global counters remain diagnostics. This proves room disposal, not GPU/GC quiescence; transition lifetimes retain their separate checks. Original failed reports are preserved.

## Causal and coverage limits

Start/proximity guards mediate office preparation; queue signals/deadlines mediate transport and installation; update mediates transition completion; semantic Sign and pointer drawing mediate the same required signature validity. Form fields, authored page/stamp order and mission callbacks remain authoritative. The browser covers these boundaries, including an explicitly injected HUD pause during actual Jobcenter speech. That injected pause is not represented as a native player-accessible case-file action inside Jobcenter.

Browser evidence uses isolated silent Chromium, Android emulation and staged scene placement/forced exits. It does not prove a natural mission playthrough, physical Android performance, perceptual listening, continuous-motion camera quality or the full unchanged crowd/driving/occlusion matrix. SwiftShader lab frame times remain poor; meeting transfer/input/buffer budgets does not establish smooth performance on all devices. Deferred pose work remains outside this goal.

## Publication

Pending final local acceptance. Publish only the scoped integration commit through the existing Pages workflow, preserving the primary dirty tree. Record the commit, workflow and public URL verification here when available.
