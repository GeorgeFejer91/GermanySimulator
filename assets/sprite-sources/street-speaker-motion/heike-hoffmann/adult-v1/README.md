# Heike Hoffmann adult sprite family

This directory is Heike's reproducible authoring packet. `person-baseline.json` is her **complete original runtime record** from repository commit `89c89d4` (`assets/characters/street/manifest.json`, actor `quiz-heike-hoffmann`; original whole-manifest SHA-256 `9b44e0842813d2fbafb14f277372c58d3d7de4fdb276d1d6bbe3c66a60d64b8b`). Its own SHA-256 is `5779236c20e8dc33ec9b80e84433c8f7cc3e3767f79195f270e52cec131c10de`. The assembler verifies this hash and builds a new actor record from it. It removes the superseded original mouth/delivery fields; the own mouth fitter and existing delivery packer supply new hashes at install. It never reads the mutable shared manifest for the old actor contract. The installer reads the current shared manifest only to replace Heike's existing entry and preserve every other entry.

All source paint, actual full prompts/reference hashes, source masks, geometry, code and this baseline are tracked. Generated candidates under `output/` are diagnostics, not source authority. The 21×18 logical family retains four 16-frame walks, eight turns, 64 phase-specific stops per direction, seven original action names, and fitted mouth metadata. Selected figure height is 2.33 world units; 100 working pixels of planted shoe travel yield the 29.125 game-unit two-step cycle.

From the repository root in PowerShell, a clean one-actor rebuild is:

```powershell
$env:OMP_NUM_THREADS = '1'
$env:OPENBLAS_NUM_THREADS = '1'
$actor = 'assets/sprite-sources/street-speaker-motion/heike-hoffmann/adult-v1'
$run = Join-Path (Get-Location) 'output/street-redesign/heike-end-to-end/clean-rebuild'
python "$actor/build-adult-body.py" --outdir "$run/body"
python "$actor/build-adult-stops.py" --walkdir "$run/body" --outdir "$run/stops"
python "$actor/build-adult-action.py" --output "$run/action"
python "$actor/build-adult-assembly.py" --walk "$run/body" --stop "$run/stops" --action "$run/action" --output "$run/assembly"
python "$actor/build-adult-mouths.py" --assembly "$run/assembly" --output "$run/mouth"
python "$actor/install-adult-candidate.py" --assembly "$run/assembly" --mouth "$run/mouth"
```

Run the final installer only in an isolated integration checkout after reviewing the candidate. It copies Heike's selected standing/body/mouth files, builds the existing motion-delivery packs, updates only Heike's manifest entry, and unions her immutable source records into shared provenance by ID. It does not commit or publish. Do not substitute the held generated key-pose attempts for the selected connected source-pixel action.

Expected selected SHA-256 after rebuilding: desktop body atlas `1ce46b5cfdbdcbd6fa586008919e23bfe6fd2c08a93d1291aa58161f659f3fa8`, mobile `5a8d5c38a45569a57d2e33368dfe867b763d84f2a433524bb9fee08c000c110b`, mouth JSON `277cddf4b46463a0a8ce1919d8acf56596f04aa352a789254379d7adacb84427`.

The front/rear source fields enable the existing actor-local `plantedFloor` callback. It removes positive ankle descent while retaining the swing and torso motion, so opaque contact shoes stay above the fixed upright sprite ground. The selected decoded down/up phase4/12 regression is `tests/test_heike_contact_ground.py`. Original sinking-shoe review and pre-correction delivery remain held in local acceptance evidence; they are not the selected source. No shared animation helper, runtime ground pivot or simulation speed is changed.
