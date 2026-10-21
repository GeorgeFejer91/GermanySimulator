# Explicit dialect clause review

`tools/neighbor-dialect-coverage.mjs` validates the mechanical bindings around
an explicit trusted integrator text review. It does not infer German semantics,
authorize synthesis, read private files, admit audio, change transcripts or set
`asrWordExact` to true. Existing ordinary Schwabingen advisory recordings and
strict Inga checks are outside its scope.

Only `punishment-schwabingen-01` through `-08` and their numbered `-part-1`
through `-part-20` leaves are accepted, with `jwd-frau-schwabingen` and selected
profile `e556ceff3dbb4091989d0f32da52d811`. This implements the current
[dialect-advisory policy](../../For-AI/VOICE-SYNTH-PROTOCOL.md#implemented-neighborhood-speech-2026-10-14)
without treating advisory ASR as permission to omit authored content.

## Interface

```js
import {buildDialectClauseReview,validateDialectClauseReview}
  from './tools/neighbor-dialect-coverage.mjs';

const review=buildDialectClauseReview({
  parent, part, reviewer:'/root',
  completeSemanticCoverage:true,
  notes:'Explicit actual source/transcript review and the concrete dialect differences.',
  clauses:[{
    sourceStart:0,sourceEnd:part.text.length,
    wordStart:0,wordEnd:part.asrAlternativeVerification.words.length,
    status:'complete',completeSemanticCoverage:true,
    sourceMeaning:'Integrator interpretation of the complete source clause.',
    recognizedMeaning:'Integrator interpretation of the complete recognized clause.',
    notes:'Concrete spelling or morphology differences checked by the integrator.'
  }]
});
validateDialectClauseReview({parent,part},review); // true, or throws
```

`parent` supplies exact `clipId`, `text`, `voiceId`, `profileId`, and final
`sha256` for full-parent reviews. `part` supplies those identity fields,
`sourceStart`/`sourceEnd` relative to the parent source, exact source `text`,
`nativeAudioSha256`, `encodedSha256`, `asr`, truthful `asrWordExact:false`,
`asrScriptPrompt:null`, `asrLanguageId:'de'`, `asrModelSha256`,
`asrReceiptSha256` for the prior q4 receipt and `asrAlternativeVerification`.
The alternative receipt is the actual `transcribe-neighbor-encoded.py` result
with its prior transcript and prior/CPU receipt/helper hashes preserved.

The CPU recognizer must be the recorded independent faster-whisper renderer,
CPU/int8/one thread, beam 5, German, no script prompt and
`conditionOnPreviousText:false`. Every actual recognizer word and finite,
ordered, nonoverlapping timestamp is retained. Its words must represent the
complete actual CPU transcript. The module hashes both raw transcripts, all
word timestamps, recognizer policy and model/helper/receipt identities; it does
not normalize away lexical differences.

Clause source ranges are half-open character offsets relative to `part.text`;
word ranges are half-open indexes into the actual CPU `words` array. Ordered
rows must cover every source character and every recognizer word without gaps,
overlap, empty rows or uncovered tails. Each row requires an explicit complete
semantic assertion, both interpretations and factual notes. A part is limited
to 25 source words. A final parent is limited to 65 source words, with each
declared clause still limited to 25. Count sanity (0.6–1.7 recognized/source
words per clause) and equal whole-word negation counts reject obvious omissions or polarity additions;
they establish no semantic equivalence on their own.

For pre-join leaf reviews, the receipt always binds `parentEncodedSha256:null`
and the complete parent source hash, exact leaf spans, native bytes and encoded
leaf bytes. Later parent encoding does not invalidate that leaf review. For
final-parent review pass `part.clipId===parent.clipId`, span `0..parent.text.length`
and `part.encodedSha256===parent.sha256`; the resulting
`integrator-verified-complete-dialect-parent` receipt binds the final MP3 and its
separate actual full-parent ASR. Leaf status is
`integrator-verified-complete-dialect-clause`.

## Remaining authority and evidence

The only accepted reviewer string is `/root`, the final integrator. It constrains
the schema; a function cannot authenticate its caller. ROOT must inspect the
concrete source, actual delivery/recognition receipts and timestamps, verify
the private native/encoded/recognizer bytes against those hashes, and seal the
review receipt before the integrator uses it in admission. Merely calling the
builder is not that review. `listening:'NOT RUN'` is required; text review must
never be reported as human listening. Native completion, finite call accounting,
levels, processing, full ordered sample joins and mouth measurements retain
their separate gates.

Sixteen deterministic tests passed with `node --test
tests/neighbor-dialect-coverage.test.mjs`. Tests cover the complete dialect
opening versus the missing opening recognized only as “Ach so”, ownership and
source drift, every recognizer binding, prompt/timestamp corruption, omitted
clauses, negation loss/addition, truthful zero-duration recognizer word timestamps,
unchanged truthful ASR and separate parent/part identity.
No model, ASR process, audio generation, admission, runtime change, commit or
publication was performed by this preparation task.

## Final08 dual-ASR negation corroboration

The second, unchanged-source `punishment-schwabingen-08` take preserves the
speaker's “I watched it for years” in both readings. Its q4 final clause is
“Ich gewöhn mich nicht in meinem Alter an ihr Bastelprojekt.” The independent
CPU reading spells the homophonic Swabian `net` as `nett`. ROOT independently
read both actual receipts and all six source clauses. This is semantic advisory
coverage; the actual transcripts stay unchanged, both literal/word-exact flags
stay false, and listening is NOT RUN.

The supporting negation check accepts this evidence only for source hash
`d91d67087ebd4b0810c3e230d6a7386dad302f61bd87fadfe23c39cd3bb3661e`,
final MP3 hash
`1140006e51eb9684d1c09396b842de2a957646063e97e5871f69890ffac8a2d3`,
q4 receipt
`58d2cc014b2995f0ef098fe564b6a74dfe108400207a67178ed6aca9150b6cdd`
and CPU receipt
`8a6fe985c1fcbb4a6a751296e40311bc62b810f51584436ef2e6ff4b5a4a8905`.
The final source range is `[258,314)`, CPU words `[44,54)`, with `nett` only at
word47. The q4 receipt must contain the exact negative clause above. A ROOT
review must explicitly include `negationCorroboration`, matching the exported
`schwab08NegationCorroboration` fields, reviewer `/root`, and factual notes.
Other source clauses retain the exact negation-count check. Another source,
take, receipt, slot, lost q4 negative, additional `nett`, or another lost
negation cannot use this corroboration. There is no global spelling substitution
or normalization of `nett` to a negative word.
