# Piper phonemizer WASM source and license

This is the pinned `@diffusionstudio/piper-wasm@1.0.0` compiled phonemizer, with only its packaged language data reduced. `delivery.json` records the exact original and delivered file hashes. `tools/build-knick-phonemizer.py` is the complete local repackaging change: retain German/English dictionaries, language definitions and shared phonetic tables; rewrite Emscripten data offsets. The compiled WASM is unchanged.

The upstream [Piper WASM build](https://github.com/diffusion-studio/piper-wasm) documents the [wide-video WASM build sources](https://github.com/wide-video/piper-wasm), [Piper phonemize sources](https://github.com/wide-video/piper-phonemize), [eSpeak-ng sources](https://github.com/rhasspy/espeak-ng) and Emscripten 3.1.47 build. Original release: [npm 1.0.0](https://www.npmjs.com/package/@diffusionstudio/piper-wasm/v/1.0.0).

Piper phonemize code is MIT: see `LICENSE-piper-phonemize`. eSpeak-ng and its compiled contribution are GPL-3.0-or-later: see `COPYING-espeak-ng`. The npm wrapper's MIT declaration does not relicense eSpeak-ng. Retain both notices and corresponding-source links when redistributing this runtime. German and English remain because German phonemization uses English for language switches; other languages are omitted from delivery.
