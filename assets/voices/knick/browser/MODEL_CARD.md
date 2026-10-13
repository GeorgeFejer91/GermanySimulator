# Appointment intercom derivative

This Piper/VITS model is used only for personal counter announcements. The user listened to Erika Mustermann and George Fejer on 2026-10-13 and accepted it as an intercom voice while explicitly saying it does not resemble Frau Knick. Her recorded character dialogue retains the selected production voice.

The manifest owns exact profile/reference, base checkpoint, training, export and delivery hashes. Training used 167 verified dry Chatterbox takes from the selected Knick profile. The final clean-base trial freezes pronunciation and latent-flow layers and adapts the posterior encoder, decoder and training discriminator for 4,000 global steps. Training artifacts remain in the private Music authoring library.

The delivered graph is about 16.03 MB compressed / 18.85 MB encoded ONNX. Per-channel INT8 stored weights expand to floating-point inference; this does not establish INT8 compute or a particular peak-memory footprint. ONNX Runtime Web uses one WASM SIMD thread in a background worker. The shipped German phonemizer matches the training inputs.

Sentence priors and flow preserve pronunciation context. Only the name and sixteen additional context frames pass through the vocoder; the context is removed from the final waveform. Four prerecorded counter tails total 277,168 bytes. One name pass produces four complete WAV variants. Native retained-prefix comparisons include short, long and comma-containing names; their maximum sample difference from full decoding is 1.85e-6.

Some held-out proper names are misread by independent ASR. Listening acceptance for two examples does not establish universal pronunciation or voice resemblance. A missing named lease with voices enabled selects the existing recorded “Nächste bitte!” at the allocated counter, with matching text. Muting retains the personalized caption. Desktop and Android browser emulation establish neither physical-phone performance nor a guarantee for every client.

Model bytes and generated speech remain in page/worker buffers and bounded Blob caches. Speech uses no app-owned Cache Storage, IndexedDB, filesystem or download/save action. Exit, replay and pagehide release retained speech buffers.

The German pretrained source is [Thorsten medium](https://huggingface.co/rhasspy/piper-voices/blob/main/de/de_DE/thorsten/medium/MODEL_CARD), based on CC0 speech. See the manifest for its pinned source revision/checkpoint hash and [the project voice ledger](../../LICENSES.md) for the character-reference and renderer provenance. Runtime and phonemizer licenses are bundled under the existing vendor directories; the private Piper training implementation is GPL-3.0-or-later.
