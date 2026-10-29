# Direct level URLs and share previews

## Experimental, unlisted playground

Klein-Korinthen is isolated on `codex/experimental-klein-korinthen`; it is not linked from the main game or sitemap. The entry has `noindex,nofollow,noarchive`. Unlisted does not mean authenticated/private. Its same-origin mounting adapter is documented in [the integration contract](../levels/klein-korinthen/For-AI/INTEGRATION.md).

| Level | Permanent experimental release URL | Unique preview | Verification |
| --- | --- | --- | --- |
| Klein-Korinthen · Verein zur Wahrung des rechten Winkels | [Experimental v0.1.0](https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/experimental-klein-korinthen-v0.1.0/labor/vereinigung-7f3c9d/index.html) | [1200 × 630 PNG](https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/experimental-klein-korinthen-v0.1.0/assets/klein-korinthen/share.png) | Verified 2026-10-28: full natural mission, layout matrix, live desktop/Android-emulated entry and 26 HTTPS asset hashes PASS. First visit: select the preview host’s “Open the page”. Physical Android and perceptual listening NOT RUN. |

This is the maintained catalogue of public level and named-area links. George requires a permanent direct URL and a unique comical share-preview image for every new level. Update this catalogue in the same change as level creation, renaming, routing, hosting or preview changes. Existing links are compatibility contracts: retain old paths as aliases when names change.

The existing `/3d.html` link is a compatibility entry to the maintained `index.html` city game. It preserves query and hash and replaces the compatibility history entry, including for relative `file://` entry. Its raw HTML retains the city share metadata and existing root preview; it is not a new level or an independent renderer/controller. Historical HTTP and browser checks below retain their original revisions and do not prove this routing change.

The frozen raw records in `building-catalogue.js` are the shared building data
owner. The root requests mutable offset copies; route generation imports the raw
records through `tools/build-level-pages.mjs`. Do not reconstruct geometry or
route copy by parsing JavaScript source text. The compatibility entry remains a
redirect and consumes no second building catalogue.

## Current public checks

Production HTTP, static social metadata, aliases and PNG dimensions checked 2026-10-14T17:32:34.753Z. Browser evidence and its device limits are recorded below. Platform caches may retain an earlier preview.

Rechecked 2026-10-15 using HTTP, initial HTML and PNG metadata: all 31 catalogue entries and two aliases pass (67 bare/slash/encoded route cases; 31 distinct 1200 × 630 PNGs). Every route resolves the same 29 external scripts as the public root. This fresh audit covers packaging only; the browser results below retain their stated revisions and device limits, and no new gameplay, natural-flow, physical-device, comical-image or platform-preview acceptance is inferred. Root `/` and the legacy query return HTTP 200 with their existing preview metadata but lack a canonical link; the generated direct pages have correct canonicals.

| Level / area | Permanent direct URL | Aliases | Share image | Live checks |
| --- | --- | --- | --- | --- |
| Grand Theft Amt | [/city/](https://germanysimulator.de/city/) | — | [PNG](https://germanysimulator.de/assets/social-preview.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| JWD · Die Nachbarn | [/neighbors/](https://germanysimulator.de/neighbors/) | [/nachbarn/](https://germanysimulator.de/nachbarn/) | [PNG](https://germanysimulator.de/assets/social/neighbors.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| JOBCENTER BERLIN MITTE | [/jobcenter/](https://germanysimulator.de/jobcenter/) | — | [PNG](https://germanysimulator.de/assets/social/jobcenter.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| BÜRGERAMT | [/bürgeramt/](https://germanysimulator.de/b%C3%BCrgeramt/) | [/buergeramt/](https://germanysimulator.de/buergeramt/) | [PNG](https://germanysimulator.de/assets/social/buergeramt.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| HAUSVERWALTUNG | [/hausverwaltung/](https://germanysimulator.de/hausverwaltung/) | — | [PNG](https://germanysimulator.de/assets/social/hausverwaltung.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| AMT FÜR STADTBILD | [/stadtbild/](https://germanysimulator.de/stadtbild/) | — | [PNG](https://germanysimulator.de/assets/social/stadtbild.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| AUSLÄNDERBEHÖRDE | [/auslaender/](https://germanysimulator.de/auslaender/) | — | [PNG](https://germanysimulator.de/assets/social/auslaender.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| FINANZAMT | [/finanzamt/](https://germanysimulator.de/finanzamt/) | — | [PNG](https://germanysimulator.de/assets/social/finanzamt.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| KRANKENKASSE | [/krankenkasse/](https://germanysimulator.de/krankenkasse/) | — | [PNG](https://germanysimulator.de/assets/social/krankenkasse.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| POLIZEI | [/polizei/](https://germanysimulator.de/polizei/) | — | [PNG](https://germanysimulator.de/assets/social/polizei.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| SPÄTI | [/spaeti/](https://germanysimulator.de/spaeti/) | — | [PNG](https://germanysimulator.de/assets/social/spaeti.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| KRÜGERS KUGELLAGER | [/krugers-kugellager/](https://germanysimulator.de/krugers-kugellager/) | — | [PNG](https://germanysimulator.de/assets/social/krugers-kugellager.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| WURST-INSEL | [/imbiss/](https://germanysimulator.de/imbiss/) | — | [PNG](https://germanysimulator.de/assets/social/imbiss.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| BUNDESFAXAMT | [/faxamt/](https://germanysimulator.de/faxamt/) | — | [PNG](https://germanysimulator.de/assets/social/faxamt.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| TÜV-ZENTRUM | [/tuev/](https://germanysimulator.de/tuev/) | — | [PNG](https://germanysimulator.de/assets/social/tuev.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| SPARKASSE | [/sparkasse/](https://germanysimulator.de/sparkasse/) | — | [PNG](https://germanysimulator.de/assets/social/sparkasse.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| DEUTSCHE POST | [/post/](https://germanysimulator.de/post/) | — | [PNG](https://germanysimulator.de/assets/social/post.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| RATHAUS | [/rathaus/](https://germanysimulator.de/rathaus/) | — | [PNG](https://germanysimulator.de/assets/social/rathaus.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| DIN-BAUMARKT | [/baumarkt/](https://germanysimulator.de/baumarkt/) | — | [PNG](https://germanysimulator.de/assets/social/baumarkt.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| ORDNUNGSAMT | [/ordnungsamt/](https://germanysimulator.de/ordnungsamt/) | — | [PNG](https://germanysimulator.de/assets/social/ordnungsamt.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| BUNDESFORMULARARCHIV | [/formulararchiv/](https://germanysimulator.de/formulararchiv/) | — | [PNG](https://germanysimulator.de/assets/social/formulararchiv.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| TERMINVERGABESTELLE | [/terminamt/](https://germanysimulator.de/terminamt/) | — | [PNG](https://germanysimulator.de/assets/social/terminamt.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| MIETPRÜFSTELLE | [/mietpruefung/](https://germanysimulator.de/mietpruefung/) | — | [PNG](https://germanysimulator.de/assets/social/mietpruefung.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| STRASSENQUERUNGSAMT | [/querungsamt/](https://germanysimulator.de/querungsamt/) | — | [PNG](https://germanysimulator.de/assets/social/querungsamt.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| FUNDBÜRO | [/fundbuero/](https://germanysimulator.de/fundbuero/) | — | [PNG](https://germanysimulator.de/assets/social/fundbuero.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| AMT FÜR ZIMMERLAUTSTÄRKE | [/laermamt/](https://germanysimulator.de/laermamt/) | — | [PNG](https://germanysimulator.de/assets/social/laermamt.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| BEZIRKSFAXLAGER | [/faxlager/](https://germanysimulator.de/faxlager/) | — | [PNG](https://germanysimulator.de/assets/social/faxlager.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| STADTREINIGUNG | [/reinigung/](https://germanysimulator.de/reinigung/) | — | [PNG](https://germanysimulator.de/assets/social/reinigung.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| SANDALENHAUS | [/sandalenladen/](https://germanysimulator.de/sandalenladen/) | — | [PNG](https://germanysimulator.de/assets/social/sandalenladen.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| SOCKENFACHGESCHÄFT | [/sockenladen/](https://germanysimulator.de/sockenladen/) | — | [PNG](https://germanysimulator.de/assets/social/sockenladen.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |
| DEUTSCHER BUNDESTAG | [/bundestag/](https://germanysimulator.de/bundestag/) | — | [PNG](https://germanysimulator.de/assets/social/bundestag.png) | HTTP, static metadata and PNG PASS · 2026-10-14 |

## Implementation and verification

`tools/build-level-pages.mjs` derives all ordinary indoor destinations from the canonical building catalogue in `game.js`, adds the city and JWD neighbors, and emits static level pages plus `level-links.json` under `output/site/`. The Pages workflow deploys that build. `/bürgeramt/` and `/buergeramt/` share the same office; `/neighbors/` and `/nachbarn/` share the city neighborhood. Each page retains the canonical scripts, uses a parent asset base, and declares its direct destination through `data-direct-level`. Thirty distinct 1200 × 630 PNGs are prepared under `assets/social/`; the city retains its root preview.

The published implementation covers city, neighbors, Jobcenter, Bürgeramt, Hausverwaltung, Stadtbildamt, Ausländerbehörde, Finanzamt, Krankenkasse, Polizei, Späti, Krügers Kugellager, Imbiss, Bundesfaxamt, TÜV, Sparkasse, Post, Rathaus, Baumarkt, Ordnungsamt, Formulararchiv, Terminamt, Mietprüfstelle, Querungsamt, Fundbüro, Zimmerlautstärkeamt, Faxlager, Stadtreinigung, Sandalenladen, Sockenladen and Bundestag. Residential facades and power-plant outdoor interactions are not additional indoor levels.

Direct ordinary-office routes select their first applicable mission without playing earlier missions. Bürgeramt, Jobcenter and neighbors reuse their existing direct chapter/checkpoint paths. The neighbor checkpoint seeds its temporary registration badge, Germanness and home prerequisites exactly as its existing query shortcut does; it does not write earned registration to storage. All routes retain existing dialogue, form, exit and visit cleanup handlers. The canonical mission chain remains the ordinary root entry.

Local evidence: `node --test tests/level-pages.test.mjs` passes; `node tools/build-level-pages.mjs` creates 31 destination pages and aliases. `tools/playtest-level-links.mjs` exercises built or production pages with silent Chromium and Android emulation. Production statuses above come from completed live verification, independently of the local browser evidence below.

Local acceptance passed all 31 destinations on desktop and all 31 on Android portrait emulation, including direct entry, refresh, held-input cleanup and applicable exit/re-entry. Bürgeramt additionally passed landscape (844 × 390), narrow portrait (320 × 568) and desktop 200% zoom; its public exit stayed visible, measured and usable. Desktop evidence began on `09f797c`; the final Android and office-edge runs use `76b985c`, which incorporates published portrait release `1350c55` without replacing its controllers or paint sources. Quiet browser-lease interruptions retained completed cases and resumed only the remaining IDs on the same frozen source. The checked aggregate is `output/level-links-acceptance.json`.

Six cold root benchmark runs passed startup transfer, title cadence, drawing-buffer, input, deferred-resource and error guards. Conditions: Chromium 155.0.8059.41, Intel Iris Xe hardware rendering, desktop/Android portrait emulation, DPR 2, seed base 4782, local uncompressed HTTP and no CPU throttling; maximum startup transfer 17,999,134 bytes. Evidence: `output/level-links-root-benchmark/report.json`. Independent Physics and Camera reviews cover the direct-route placement, camera handover and public exit geometry. Physical Android, a new natural mission-chain playthrough and audio listening are NOT RUN; these results do not establish a universal performance improvement or every sharing platform's cached rendering.

`tools/check-level-links.mjs` verifies every live route/alias, exact generated HTML, static share metadata, PNG type/dimensions/pixel-file hash and affected runtime files. Text comparisons normalize Windows/Linux line endings. Run it after deployment; `--update-catalogue` replaces the public table only after all checks succeed. Browser coverage remains separately reported. A new indoor building without a preview fails the page build.

Publication `0e105e4` incorporates shared release `1350c55`, preserving its final neighborhood movement/HUD, shared transitions, phone overlap and portrait paint behavior. The link layer changes direct-route admission, nested asset/phone URL resolution, static share output and the public office exit control; it does not replace the accepted character or interior controllers. The visible office exit is measured by the existing Pretext path, remains available during scene sequences, and retains the canonical immediate-return handler.

GitHub Pages run `38606482822` succeeded. Production checks passed all 31 destinations, 33 primary/alias paths, 31 PNGs and ten affected runtime/entry files; `output/level-links-live/report.json` records the checks and hashes. Both the custom-domain and GitHub Pages short root and `3d.html` return HTTP 200 with the deployed entry cache tag; GitHub Pages redirects correctly to the custom domain. Entry-health evidence is `output/level-links-live/root-entry-health.json`.

Production browser smoke passed 10/10 cases: city, neighbors, Jobcenter, Bürgeramt and Finanzamt on desktop and Android portrait emulation, including refresh and applicable exit/re-entry/input clearing, with no page or HTTP failures. Report: `output/level-links-production-browser/report.json`. All 31 destinations have complete local desktop/Android flow coverage and byte-matched production HTML/runtime; the live browser smoke samples these five distinct entry paths. Physical Android and sharing-platform cache presentation remain NOT RUN.

## Unlisted Berghain walkthrough

`/geheim/` is an unlisted architectural walkthrough owned by `berghain/`,
generated from its existing viewer by `geheimPage()` in the same static builder.
Fresh entry/refresh places a controllable 1.80 m human outside. WASD/arrows or
touch move the visitor; dragging turns the camera; E/the entrance button opens
the shared hinged door and walks continuously through it, with the same action
for exiting. It has no city mission prerequisites or mission rewards.

Permanent URL: [Geheim](https://germanysimulator.de/geheim/). Unique original
1200 × 630 preview: [geheim.png](../assets/social/geheim.png), authored as
`berghain/share-preview.svg`. Initial HTML carries noindex/nofollow, canonical,
Open Graph and Twitter metadata. It stays out of ordinary game navigation and
the ordinary mission-level catalogue. The separate architectural viewer remains
at `/berghain/model.html`; both use the same building/runtime resources.

2026-10-23 local checks: direct entry/refresh, actual desktop keys and Android
portrait/landscape CDP touch, entry/exit, duplicate/cancel handling, 320 px and
200% text, idle rendering and context recovery pass. Evidence:
`output/berghain-geheim-release-browser/report.json` (4/4), plus original
share-preview rendering in `output/berghain-geheim-acceptance/report.json`.
Canonical deployment verified on 2026-10-23: Pages 39988132964 succeeded;
37/37 Berghain files match the published runtime 7517a17, both Geheim path forms
and all 33 ordinary routes pass, with canonical desktop/Android-portrait flow 2/2.
Publication/live checks are recorded in `berghain/For-AI/VALIDATION.md`; no physical Android or social
platform cache verification is implied. Interior reconstruction remains partial.

## Release checklist

1. Add a stable, readable path on `https://germanysimulator.de/` and record it here with its owning level/area, aliases, entry behavior, preview asset and last verification date. Cover every playable level, including indoor building levels introduced through the shared transition protocol. Do not silently invent new scopes for mission steps.
2. Opening or refreshing the URL in a fresh browser goes straight to that level or area's playable start without navigating through the city, completing earlier missions or clicking through the whole game. A browser-required gesture to enable audio/fullscreen is acceptable. Use the canonical runtime and explicit prerequisite setup; preserve normal city entry, mission rewards, exit/return and visit cleanup. Do not use a browser-only diagnostic override as the public route.
3. Serve a successful HTML response at the exact public path, with redirects/aliases resolving correctly. GitHub Pages has no application rewrite server: implement routable static output within the existing deployment, with correct root-relative asset resolution. A 404 fallback, fragment or JavaScript-only metadata update does not satisfy the share-preview requirement.
4. Give each level its own comical, recognizable illustration of that level, consistent with Grand Theft Amt. Ship the image under `assets/` (prefer `assets/social/<level-id>.png`, 1200 × 630). Record the real asset path here once it exists; do not reuse the generic root image for all levels. Keep preview images out of gameplay preload unless gameplay actually uses them.
5. Include level-specific title, description, canonical URL, `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, image dimensions/type/alt text and Twitter large-image card metadata in the initial server-delivered HTML. Use absolute HTTPS public image URLs. Share crawlers must obtain the correct metadata without running JavaScript or following a client-side redirect.
6. Verify production HTTP status, final URL, raw HTML metadata and image HTTP status/content type/dimensions after deployment. Exercise direct entry, refresh, controls and exit/re-entry in silent Chromium desktop and Android coverage under the existing acceptance policy. Record emulation and physical-device gaps accurately. Verify an actual link-preview renderer when available; metadata checks alone do not prove every sharing platform's cached presentation.
7. Run routing/metadata regression checks during deployment, covering every catalogue entry and alias. Recheck existing links whenever hosting, entry HTML, runtime prerequisites or deployment output changes. If a link breaks, mark it broken here and fix it before calling the release complete. A new level is incomplete until its direct URL and individual share image pass these checks.

Maintenance belongs to the integrator of each affected release. This requirement does not establish a scheduled monitor; ongoing maintenance means updating and verifying the catalogue as part of every relevant change. Runtime entry/return and world changes use the existing Physics and Camera reviews; documentation-only catalogue updates may omit those reviews with their scope reason.

### Klein-Korinthen v0.2 — bureaucratic nightmare

Experimental tag `experimental-klein-korinthen-v0.2.0`: [unlisted playable level](https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/experimental-klein-korinthen-v0.2.0/labor/vereinigung-7f3c9d/index.html). Same isolated path and unique `assets/klein-korinthen/share.png` illustration; canonical/OG metadata uses the versioned URL. A0 application authorization, E31 ruler oath and C5 final audit join the five-report mission. v0.1 stays available at its original tag. No main-game link or main deployment is changed. Browser evidence and physical-device limits are owned by `levels/klein-korinthen/For-AI/README.md`.

Verified 2026-10-29: 33/33 runtime/media HTTPS hashes, live desktop and Android-emulated entry/start/map PASS. Main root and 3d.html both HTTP 200. Full natural mission, 72 UI states, 40,000 seeded actions, 15 lifecycle stress visits and independent Physics/Camera reviews PASS. Physical Android and perceptual listening NOT RUN. First visit may require the preview host’s “Open the page”.
