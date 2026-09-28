# Character voice production

`AUDIO-TEXT-LIBRARY.js` owns stable voice IDs, local Voice Cloner profile bindings, clip IDs, exact spoken text, English subtitle annotations, asset paths, and trigger families. `game.js` owns trigger timing. The existing stimulus broker owns playback, textbox, and subtitle timing. The static game never loads a synthesis model.

## Saved profiles

Read `voices` and `speechFamilies` in the catalog before making a new profile. Ten different, project-named Qwen profiles are saved in the local Voice Cloner: `player-inner`, `narrator`, `passerby-a`, `passerby-b`, `police-officer`, `quiz-officer`, `merz-character`, `merkel-character`, `soeder-character`, and `weidel-character`. The first six use distinct [CC0 Kyutai voice donations](https://huggingface.co/kyutai/tts-voices); the four named political characters use distinct [VCTK references](https://huggingface.co/kyutai/tts-voices) under CC BY 4.0. Every profile has a stable game voice ID, a local `profileId`, a source URL, and an original SHA-256 in the catalog. Short German smoke renders succeeded for all ten on 2026-09-28. These profiles are ready for asset generation; no new game clip from them has been shipped.

Existing Thorsten, quiz-sting, train, Söder/Bayern, Alice, and Merkel recordings retain their own voice IDs and provenance. Legacy clips carry `targetVoiceId` where a new character profile should eventually take over. This field is an editorial assignment only; changing it does not change the audio. For the four political character families, `speechFamilies.profileVoiceId` names the saved profile for future lines while `voiceId` describes current delivery. Merz currently uses browser speech. The unrelated, preexisting `Friedrich Merz - Satire (Stadtbild)` profile in Voice Cloner is not bound to the game catalog. Do not use a recognizable public figure's recording as a new cloning reference; use a separately sourced character voice for future lines. Preserve recorded-asset limits in `assets/voices/LICENSES.md` and `assets/audio/trains/PROVENANCE.md`.

## Create one reusable character voice

1. Assign a short, stable `voiceId` to the character or role. Reuse one profile for that character's lines. Keep the player's inner voice separate from passersby and officers.
2. Select clean, single-speaker reference audio owned by the user or licensed for this use. Voice Cloner keeps the original and normalized copy privately. Record the exact source URL, license, intended use, and original SHA-256 in `voices`; do not commit another WAV just to duplicate its private copy.
3. From `C:\Users\gfeje\Documents\GitHub\voice-cloner`, run `Voice.cmd doctor`, then create and save the profile. Use `--engine qwen` for the current game workflow. Qwen's model is Apache 2.0; OmniVoice weights are CC-BY-NC and need a separate use decision before shipped game assets.

   ```powershell
   .\Voice.cmd voices create --name 'GS new-character' --file 'C:\Audio\reference.wav' --source-note 'Creator, source URL, license, intended game use' --engine qwen --defer
   ```

   Save the returned `reference_id` as `profileId`. `--defer` imports without loading the model. On another PC, recreate from the source and update the local binding. Read Voice Cloner's `AI-GUIDE.md` and `agent-contract.json` before automating a batch.
4. Render one short German smoke line and inspect the whole output. A distinct reference establishes a distinct source identity; it does not prove that the generated German voice sounds right. Listen for accent, pronunciation, character fit, and echoed reference words. Duration or automatic transcription alone is not a listening pass.

   ```powershell
   .\Voice.cmd generate --voice '<profileId>' --text 'Guten Tag. Ihr Formular fehlt.' --language de --engine qwen --output 'C:\Audio\smoke.mp3'
   ```

## Add a line and connect its trigger

1. Decide speaker owner, trigger family, region, and broker priority first. Berlin character speech follows the Denglisch rule; across the Brandmauer characters speak German regardless of interface language. The visible textbox and spoken source must match exactly. Never cross-select another character's pool.
2. Add one stable clip ID in `AUDIO-TEXT-LIBRARY.js` with `id`, `voiceId` (the voice in the actual file), `trigger`, `source` (exact spoken German or authored Denglisch), `english` (subtitle), and file path. Long recordings need timed `cues` and, where available, `sourceCues`. Use `targetVoiceId` only for a legacy clip awaiting replacement. The derived `clips` index exposes the entry by ID. Do not publish a catalog entry pointing at a missing file.
3. Generate the catalog's exact `source` using its `profileId`. Keep the Voice Cloner worker warm across batches; repeated text is cached by reference, language, and engine. If a job times out, resume via `jobs wait` rather than resubmitting. Export to a temporary path first. Qwen's local reference-echo check covers only the beginning: review the whole clip.
4. Normalize approved MP3s with `tools/normalize-audio.ps1 -Apply`, then verify `-18 LUFS ±0.3 LU` and no peak above `-1.5 dBTP` without `-Apply`. Check duration and a German transcript against `source`. Put approved clips under `assets/voices/`. Set `voiceId` to the generating profile and remove `targetVoiceId` when replacing a legacy file. Record model, engine, date, reference source/hash, duration/hash, and license in `assets/voices/LICENSES.md`. Keep private originals, caches, scratch WAVs, and smoke renders out of Git.
5. In `game.js`, resolve by stable ID with `speechClip("clip-id")`, then pass its `text` and `recording` through `speakRecorded` or `showWorldBark`. Use the existing broker's family, priority, eligibility, and textbox callbacks. On load failure, browser speech reads the same `text`; English subtitles begin with playback and clear on completion or cancellation.
6. Verify the actual trigger in a silent background browser: voice off, subtitles on/off, regional variants, missing-file fallback, textbox lockstep, and owner-specific selection. Run catalog and affected game tests before pushing.

## Boundary

The catalog covers every shipped foreground speech file. Browser speech source lines remain in `game.js`, with English translations and family-to-voice mappings in the catalog; move a line into the clip catalog when it becomes a recorded asset. Background music, songs, sirens, fax sounds, and other nonverbal effects are outside this inventory.
