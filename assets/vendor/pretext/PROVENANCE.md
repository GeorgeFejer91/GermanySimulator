# Preview text measurement

Unmodified JavaScript runtime files from `@chenglou/pretext` **0.0.9** (MIT).
Only `sprite-preview.html` imports this package. No game runtime dependency.

- Upstream: https://github.com/chenglou/pretext
- Archive: https://registry.npmjs.org/@chenglou/pretext/-/pretext-0.0.9.tgz
- Archive SHA-256: `6111c6d7742d39af50237dbe9affc88d2a7f0149c250c3638e60b337c7f873a6`
- Exact package version and license are retained in `package.json` and `LICENSE`.
- Acquired/verified 2026-09-27. Only the `layout.js` dependency closure is shipped;
  the optional rich-inline entry point, demos, TypeScript and source maps are omitted.

Font measurements wait for the bundled Roboto Condensed face, reuse prepared text
by typography/content, and recheck on resize/content changes. Long labels reflow;
native selects reveal a full selected value when it cannot fit. Native control
painting and accessibility overrides still require rendered browser checks.
