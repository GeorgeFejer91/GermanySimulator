# Original Klein-Korinthen assets

Created for the user-requested experimental Grand Theft Amt level, 2026-10-28.

- `cast.webp`: original built-in ImageGen character sheet, 1536 × 1024 RGBA, four equal columns. 389,836 bytes; decoded RGBA 6,291,456 bytes. One shared GPU texture, no mipmaps. Each adult is grounded to the same plane and painted with mature proportions. The world uses source-registered, small upper-body breathing and mouth deformation; these are stationary performances, not walking animations.
- `share.png`: unique original ImageGen satirical cover, exported to 1200 × 630. Social metadata only; not requested by the game.
- `voices.json` and `voices/*.mp3`: 22 original exact German lines, paired English captions, four newly registered native profiles, independent final-MP3 German ASR, normalized 24 kHz mono / 64 kbps MP3, measured 40 Hz mouth energy, hashes and private-source receipts. The six v0.2 lines reuse the same four voice identities. `For-AI/VOICE-CAST.json.productionVoices` remains the sole profile-selection authority. The manifest records each take's actual binding independently.

The four reference speakers come from the existing private EmoDB CC0 collection: speaker 15 neutral (Dietmar), speaker 13 neutral (Gisela), speaker 3 positive (Ronny), speaker 8 restrained (Ute). Sources, profile UUIDs and exact original/reference hashes are in the cast and native profile source notes. Original references, models, rejected takes, and full authoring receipts stay in the private voice library, outside shipped assets. The native OmniVoice Rust renderer and Whisper verifier are installed authoring tools, not game dependencies. No voice is presented as a real public figure or authentic quotation. User-requested use and automated signal/word verification are distinct from perceptual listening, which was NOT RUN.

Rebuild voice assets with `node tools/build-klein-korinthen-voices.mjs`; the helper reuses accepted takes and frozen private sources. A new seed preserves rejected takes. It never plays audio. Finite ASR normalization covers punctuation/case, spoken German numbers, ß/ss, compound spaces, cm/Zentimeter and the ASR spelling Vereinsatzung/Vereinssatzung; it never drops words or negation.

Building, car, tree, garden, street, map, ruler and effects assets are original procedural Three.js/Web Audio code in the level. Existing Three.js, Pretext and font licenses remain under `assets/vendor/` and `assets/fonts/`.

v0.2 architecture adds the original renderer-independent `building-kit.mjs`: reusable houses, permit machines, an archive of giant ring binders, ruler cathedral, inspection arch, stamp cabinet and inspecting garden gnomes. These use existing shared primitive geometry and the established muted palette; no new texture, model, framework or runtime voice model is loaded. The unique share illustration remains valid for this same level and is excluded from gameplay preload.

## Image prompts

Character sheet: four original full-body adult characters on transparent background, equal columns and ground baseline, mature 6.5-head proportions and long connected limbs; angular expressionist dry-brush Disco Elysium meets Brandenburg, petrol/ochre/burgundy. Dietmar: retired engineer, silver mustache, olive vest, burgundy jumper, beige trousers, ruler and clipboard. Gisela: auburn hair, teal raincoat, mustard scarf, wine trousers, folder and stamp. Ronny: stubble, mullet, blue mechanic overalls, orange shirt and enamel mug. Ute: gray bob, glasses, wax jacket, red shirt, closed garden shears. Front three-quarter resting views, no labels, no cute/glossy treatment.

Cover: wide painted autumn Brandenburg village; Dietmar solemnly measures a curb gap while Gisela brandishes a stamp; his own SUV is badly parked. Mature expressive angular faces, dry brush, dirty ochre/petrol/burnt sienna. Exact title “KLEIN-KORINTHEN”, subtitle “FÜNF MELDUNGEN. KEINE FREUNDE.”, credit “GRAND THEFT AMT”. Built-in image generation, then deterministic delivery sizing/encoding; originals retained in the Codex generated-images directory.
