# Spark 2.3.1

Unmodified browser distribution downloaded from
https://sparkjs.dev/releases/spark/2.3.1/spark.module.js on 2026-10-08.
Source: https://github.com/sparkjsdev/spark/tree/v2.3.1 (MIT; see LICENSE).

SHA-256: `2de375d5e489692f976abe3199c8435ecc00f97fabaf35e489eb7d368e1f6f60`.
Size: 2,816,188 bytes. The module embeds its WASM and sorting worker.
It shares the game's pinned Three.js r186 through the entry-point import maps.
Only the Bürgeramt omen imports it. No generation service or remote splat asset
is used. The dedicated sort worker is disposed with the effect; offline assets
are decoded in bounded main-thread chunks without Spark's shared loader pool.
