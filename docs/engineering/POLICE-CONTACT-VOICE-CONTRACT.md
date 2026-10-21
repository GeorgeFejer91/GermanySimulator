# Police contact voice preparation

The two exact `policeContact` warning/fine sources have their own immutable
`police-contact-two-v1` scope and `assets/voices/police-contact` destination.
They reuse Heinrich's selected cast binding. Existing `police12` requests,
sealed authorities, recordings, helper bindings and admission remain unchanged.
The voice integrator owns final admission; ROOT owns native execution and phase
retirement. This preparation changes no runtime, cast, catalog or shipped audio.

Authoring authority is [the voice protocol](../../For-AI/VOICE-SYNTH-PROTOCOL.md#fixed-voices-and-the-agent-workflow-2026-10-11).
Source/English identity remains with `tools/police-contact-voice-source.mjs` and
the cast's `police.encounterDialogue`. Freeze the source request only after the
integrator stabilizes the current cast and runtime source files.

## Callable interfaces

`tools/build-police-contact-voices.py` imports the unchanged
`tools/build-knick-voice.py` with `importlib`; its actual `render`, `process`,
conditioning, native EOS observation, encoding and independent final-audio ASR
functions remain shared. The adapter supplies the exact two jobs and selected
binding instead of extending the historical producer's enumerated families.
The original producer continues to reject `family: police-contact` directly.

The adapter exposes `--plan`, `--render`, `--process`, and `--proposal`.
`--retake-failed` is accepted only together with `--render`. No manifest,
publication, source-following, source-reconciliation, sentence rescue, EOS
modification, hook benchmark, engine/reference change or unbounded CLI exists.
The two ordinary whole-line attempts are shared-producer behavior. A second
render requires explicit `--retake-failed`; interrupted calls consume budget
and cannot silently repeat. The shared producer may decline a normalized-only
ASR failure as a retake when its broad word comparator already passes. The
strict proposal still holds that clip as captions; this adapter does not alter
the shared retake decision or invent literal-word evidence.

Private files live only under:

```text
<music root>/GermanySimulator police contact review 2026-10-21/polizei-heinrich-wachtmeister/
  requests.json
  native-call-ledger.json
  asr-call-ledger.json
  raw/<clipId>.wav, <clipId>.json, <clipId>-eos-trace.json
  encoded/<clipId>.mp3, <clipId>.json, <clipId>-processed.wav
  rejected/<clipId>/attempt-1/...
  retake-attempts.json
```

`requests.json` binds the source request bytes, all three source hashes, both
shared-helper and adapter hashes, exact ordered jobs and separate authority hash.
It cannot be replaced by a subsequent `--plan`. `police-contact-phase.lock`
prevents overlapping phases; ROOT must inspect and retire a crashed owner before
manually removing a stale lock. The adapter never reclaims another owner.

Call ledgers charge immediately before real native `generate` / `transcribe`
calls, then retain returned/failed state. An interrupted started call still uses
its allocation. ASR charges bind the final encoded hash, actual model.bin hash,
beam and unprompted transcript; generator iteration completes before a returned
ASR receipt. There is no ASR download. Total limits are four native calls,
two per exact line, and eight ASR readings, four per line across both attempts.

Python `private_proposal(request, private, authority)` and CLI `--proposal`
return `PRIVATE_INTEGRITY_PROPOSAL_NOT_ADMISSION`, with `clips`, `heldPrivate`,
raw/encoded/trace proof hashes and frozen/ledger/helper hashes. Missing, failed
or nonliteral recordings remain captions. The proposer verifies source/profile
lineage, receipt/media hashes, complete native EOS traces and summaries,
conditioning/recipe, final encoded literal words, levels and source word cues.
It preserves actual failed readings. It does not copy files or grant use.
Fixture receipt tests establish validator behavior, not native audio quality.

## Separate finite ROOT grant

After reviewing stable source and adapter bytes, ROOT seals a new JSON authority.
`RECIPE` in the adapter is the exact required recipe; it is a validation constant,
not a grant. Required fields are:

| Field | Required value |
| --- | --- |
| `status`, `executor` | `ROOT_SEALED_FINITE_POLICE_CONTACT2`, `ROOT_ONLY` |
| `grantId`, `authorityTemplateOnly` | New ROOT grant identity, `false` |
| `sourceScope`, `voiceId`, `profileId` | `police-contact-two-v1`, `polizei-heinrich-wachtmeister`, `24b741bbe55d4f3a843aa481c3459a96` |
| `requestSha256`, `sourcePins` | Actual source-request file hash and its complete `sourceSha256` map |
| `adapterSha256`, `sharedHelperSha256` | Independently hashed current adapter and unchanged shared producer bytes |
| `referenceSha256`, `referenceOriginalSha256` | Exact selected cast reference/original hashes |
| `profileMetadataSha256`, `asrModelSha256` | Actual private `profile.json` and installed ASR `model.bin` hashes |
| `modelRevision`, `processing` | `5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18`, `null` |
| `musicRoot`, `privateReviewFamily`, `publicAssetFamily` | Exact Music root and source-request family fields |
| `maximumNativeCalls`, `maximumCallsPerClip`, `maximumAsrReadings` | `4`, `2`, `8` |
| `automaticRetries`, `publicationAuthorized` | `0`, `false` |
| `rendererDevice`, `rendererPrecision`, `rendererCpuThreads` | `cuda`, `fp16`, `2` |
| `referenceConditioningPrecision`, `observeEos` | `float32`, `true` |
| `asrDevice`, `asrComputeType`, `asrThreads`, `asrLanguage` | `cpu`, `int8`, `1`, `de` |
| `asrScriptPrompt`, `asrBeamSizes` | `null`, `[1,5]` |

Read-only local checks on 21 October found:

- Shared producer SHA-256: `d6065aa3aab61edccef5a10521218bdad840e8954fbac90b6fabeb8093c7c827`.
- Private profile metadata SHA-256: `d707598529a3bbd1774ee2364dde64d25dc3281555f03181b18d750bd4bef2cf`.
- Installed large-v3 `model.bin` SHA-256: `69f74147e3334731bc3a76048724833325d2ec74642fb52620eda87352e3d4f1`.
- Original and reference WAV hashes match the assigned cast binding. No playback
  or inference was used for these file-hash checks.

## ROOT-only commands

These commands are execution instructions for ROOT after it supplies its sealed
authority and owns the GPU window. They were not executed during preparation.
The explicit `--ffmpeg` resolves the installed WinGet FFmpeg; retain its matching
`ffprobe.exe` beside it. The Chatterbox and faster-whisper environments are
separate; use the shown interpreter for each stage.

```powershell
$taskMusic = 'C:/Users/cogpsy-vrlab/Music/German emotional voice databases'
$taskRequest = Join-Path $taskMusic 'GermanySimulator police contact request 2026-10-21.json'
$taskAuthority = Join-Path $taskMusic 'GermanySimulator police contact ROOT authority 2026-10-21.json'
$taskRendererPython = 'C:/Users/cogpsy-vrlab/.codex/envs/germany-chatterbox-0.1.7/Scripts/python.exe'
$taskAsrPython = 'C:/Users/cogpsy-vrlab/.codex/envs/faster-whisper/Scripts/python.exe'
$taskModel = 'C:/Users/cogpsy-vrlab/.cache/huggingface/hub/models--ResembleAI--chatterbox/snapshots/5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18'
$taskAsrModel = 'C:/Users/cogpsy-vrlab/.codex/models/faster-whisper/models--Systran--faster-whisper-large-v3/snapshots/edaa852ec7e145841d8ffdb056a99866b5f0a478'
$taskFfmpeg = 'C:/Users/cogpsy-vrlab/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffmpeg.exe'
node tools/police-contact-voice-source.mjs | Set-Content -LiteralPath $taskRequest -Encoding utf8
# ROOT reviews those exact bytes and seals $taskAuthority before continuing.
$taskCommon = @('tools/build-police-contact-voices.py', '--music-root', $taskMusic,
  '--request-file', $taskRequest, '--authority', $taskAuthority,
  '--model-dir', $taskModel, '--asr-model', $taskAsrModel, '--ffmpeg', $taskFfmpeg)
& $taskRendererPython @taskCommon --plan
& $taskRendererPython @taskCommon --render
& $taskAsrPython @taskCommon --process
# Only if ROOT elects the final bounded retake after reviewing first-take failures:
& $taskRendererPython @taskCommon --render --retake-failed
& $taskAsrPython @taskCommon --process
& $taskRendererPython @taskCommon --proposal
```

ROOT must retire and hash each actual phase separately, including a retake phase
if used. The adapter cannot attest its own process retirement. Supervisor proofs
must retain command/source/helper/authority pins, exit status, complete logs,
timeout/cleanup outcomes and absence of surviving owned children. Preserve every
failed or interrupted terminal honestly. Public admission needs ROOT's independent
clip/hash selection and final encoded mouth-energy measurement with the existing
recipe, followed by the scoped curator collector/admission and catalog checks.
The proposer explicitly lists those gates as outstanding. Neither this proposal
nor generated audio proves perceptual listening, browser timing or device quality.

## Preparation evidence and boundaries

Executed checks: 11 Python source/authority/ledger/EOS/receipt tests and two Node
source tests passed. The Python tests use deliberately fake fixture media bytes
to exercise integrity rejection; no native model or audio tool is called.
No plan, grant, render, process, admission, commit or publication was performed.
No world, renderer, camera or movement changed, so world-specialist reviews are
outside this preparation scope. ROOT's existing task owner retains completion
and publication state; this contract does not create another task ledger.

```powershell
& C:/Users/cogpsy-vrlab/.codex/envs/germany-chatterbox-0.1.7/Scripts/python.exe -m unittest discover -s tests -p test_police_contact_voice_adapter.py -v
node --test tests/police-contact-voice-source.test.mjs
```
