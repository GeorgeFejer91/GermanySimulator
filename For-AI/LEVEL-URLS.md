# Direct level URLs and share previews

This is the maintained catalogue of public level and named-area links. George requires a permanent direct URL and a unique comical share-preview image for every new level. Update this catalogue in the same change as level creation, renaming, routing, hosting or preview changes. Existing links are compatibility contracts: retain old paths as aliases when names change.

## Current public checks

Checked 2026-10-14 against the production custom domain with HTTP requests. HTTP success alone does not establish playable entry or a correct social preview. Do not call a route live and working until all release checks below pass.

| Level / area | Requested permanent URL | Production status | Available entry today | Share-preview status |
| --- | --- | --- | --- | --- |
| City / Grand Theft Amt | [germanysimulator.de](https://germanysimulator.de/) | HTTP 200; gameplay not rechecked in this catalogue update | Same URL; normal game start | Root HTML declares `assets/social-preview.png`; image retrieval and platform rendering not rechecked |
| Bürgeramt | [germanysimulator.de/bürgeramt](https://germanysimulator.de/b%C3%BCrgeramt) | HTTP 404; not live | [Existing direct office entry](https://germanysimulator.de/?geheim=buergeramt), HTTP 200; source implements direct episode entry | Unique level preview still required; query entry currently uses the root preview |
| JWD neighbors | [germanysimulator.de/neighbors](https://germanysimulator.de/neighbors) | HTTP 404; not live | [Existing neighborhood checkpoint](https://germanysimulator.de/?geheim=nachbarn), HTTP 200; supplies chapter prerequisites with all three introductions pending; waits for the adult sprites before play | Unique level preview still required; query entry currently uses the root preview |
| Jobcenter | [germanysimulator.de/jobcenter](https://germanysimulator.de/jobcenter) | HTTP 404; not live | [Existing direct Jobcenter entry](https://germanysimulator.de/?geheim=jobcenter), HTTP 200; source implements direct episode entry | Unique level preview still required; query entry currently uses the root preview |

JWD neighbors are a named city area, but still require their own shareable entry URL. The scope index does not need another runtime or level directory for this link. Provide `/buergeramt` as an ASCII alias of `/bürgeramt`; check the literal Unicode and percent-encoded URL. Those aliases are requirements, not currently verified live routes.

The 2026-10-14 tour release extends the existing neighborhood checkpoint and
keeps its entry contract. Its gameplay, shared interior and release evidence is
recorded in [`SESSION.md`](../docs/engineering/SESSION.md). The readable paths and
individual share previews above remain a separate routing/preview requirement;
this release does not claim that the query checkpoints satisfy those requirements.

## Required release checks for every level

1. Add a stable, readable path on `https://germanysimulator.de/` and record it here with its owning level/area, aliases, entry behavior, preview asset and last verification date. Cover every playable level, including indoor building levels introduced through the shared transition protocol. Do not silently invent new scopes for mission steps.
2. Opening or refreshing the URL in a fresh browser goes straight to that level or area's playable start without navigating through the city, completing earlier missions or clicking through the whole game. A browser-required gesture to enable audio/fullscreen is acceptable. Use the canonical runtime and explicit prerequisite setup; preserve normal city entry, mission rewards, exit/return and visit cleanup. Do not use a browser-only diagnostic override as the public route.
3. Serve a successful HTML response at the exact public path, with redirects/aliases resolving correctly. GitHub Pages has no application rewrite server: implement routable static output within the existing deployment, with correct root-relative asset resolution. A 404 fallback, fragment or JavaScript-only metadata update does not satisfy the share-preview requirement.
4. Give each level its own comical, recognizable illustration of that level, consistent with Grand Theft Amt. Ship the image under `assets/` (prefer `assets/social/<level-id>.png`, 1200 × 630). Record the real asset path here once it exists; do not reuse the generic root image for all levels. Keep preview images out of gameplay preload unless gameplay actually uses them.
5. Include level-specific title, description, canonical URL, `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, image dimensions/type/alt text and Twitter large-image card metadata in the initial server-delivered HTML. Use absolute HTTPS public image URLs. Share crawlers must obtain the correct metadata without running JavaScript or following a client-side redirect.
6. Verify production HTTP status, final URL, raw HTML metadata and image HTTP status/content type/dimensions after deployment. Exercise direct entry, refresh, controls and exit/re-entry in silent Chromium desktop and Android coverage under the existing acceptance policy. Record emulation and physical-device gaps accurately. Verify an actual link-preview renderer when available; metadata checks alone do not prove every sharing platform's cached presentation.
7. Run routing/metadata regression checks during deployment, covering every catalogue entry and alias. Recheck existing links whenever hosting, entry HTML, runtime prerequisites or deployment output changes. If a link breaks, mark it broken here and fix it before calling the release complete. A new level is incomplete until its direct URL and individual share image pass these checks.

Maintenance belongs to the integrator of each affected release. This requirement does not establish a scheduled monitor; ongoing maintenance means updating and verifying the catalogue as part of every relevant change. World/mission changes still use their existing review gates. This documentation-only catalogue update changes no world behavior and therefore does not require Physics or Camera reviewers.
