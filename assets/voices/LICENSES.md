# Thorsten-Voice clips

The six `thorsten-*.mp3` files are compact shipping copies of German angry,
amused, disgusted, and sleepy recordings from **Thorsten-Voice Dataset 2021.06
emotional** version 2.0, recorded by Thorsten Müller and optimized by Dominik
Kreutz.

- Source: https://doi.org/10.5281/zenodo.5525023
- Dataset mirror/API: https://huggingface.co/datasets/Thorsten-Voice/TV-44kHz-Full
- License: CC0 1.0 Universal
- Conversion: encoded locally as mono MP3 at 64 kbit/s and 22.05 kHz. The
  three angry clips and amused clip came from the 44.1 kHz
  `TV-2021.06-Emotional` subset; the
  two additional files came from the project's official WAV sample folder.

| Shipped file | Dataset recording ID | Spoken text | SHA-256 |
| --- | --- | --- | --- |
| `thorsten-angry-nicht-weg.mp3` | `070560e5-3046-2e53-8963-68e9cf0be001---bb9f85586a2700cad15c61ac262035a8` | Nein, ich gehe hier nicht weg! | `04D6A11D4ED2774860D7AA7F8385B7A9E5114F1461AECF4BF728A9148182DA63` |
| `thorsten-angry-duemmer.mp3` | `070560e5-3046-2e53-8963-68e9cf0be001---1910c7ff4e2def4080401802af5b6575` | Dümmer geht's nicht mehr. | `59938ACEAC1C292C84D37BDF7103A58DF6BF576C01B67C1C2626AF59D7F05D2C` |
| `thorsten-angry-klappt-nicht.mp3` | `070560e5-3046-2e53-8963-68e9cf0be001---b85796d30b6476b19dd0e5240593c366` | Das klappt einfach nicht! | `ADB4C996A33907E32D715AFED1A786DBA2E5CA228BCA01A6FB4BE53AC2082EAC` |
| `thorsten-amused-nachschub.mp3` | `680eb50a-d8a5-4fc7-b127-e8ec640a58e7---31952592964b2a3e715f1bea81bdc3cf` | Endlich wieder Nachschub! | `C6C9C1E926BEA49698458CF804ED64AF8D79991B08C081B3D010E6E89563691F` |

The two additional recordings are the repository's official emotional sample
files. Both speak “Mist, wieder nichts geschafft.” and were encoded with the
same mono MP3 settings described above. The sleepy take is an ambient pedestrian
remark; the disgusted take is the player's Germanness-loss reaction.

| Shipped file | Dataset style | Upstream sample and Git blob | SHA-256 |
| --- | --- | --- | --- |
| `thorsten-disgusted-nichts-geschafft.mp3` | `disgusted \| angewidert` | [`samples/thorsten-21.06-emotional/disgusted.wav`](https://github.com/thorstenMueller/Thorsten-Voice/blob/master/samples/thorsten-21.06-emotional/disgusted.wav), `37ea523dc505d8cc85c01c0d94305de123a1d4ac` | `737BF3FB0A77014A817677190A6DA16A1B222B50A4B63F506840B08029C36FED` |
| `thorsten-sleepy-nichts-geschafft.mp3` | `sleepy \| schläfrig` | [`samples/thorsten-21.06-emotional/sleepy.wav`](https://github.com/thorstenMueller/Thorsten-Voice/blob/master/samples/thorsten-21.06-emotional/sleepy.wav), `d9c7dabe89f6472a9b980fae6c3b3e4c85076eb6` | `ACD0FCE97229A40D14C617F6F7EB2172BABCD00980FAA3026CE1F1B75A3EC6A2` |

Attribution is not required by CC0, but the source and recording IDs are kept
here for durable provenance and reproducible replacement.

## Generated §-power law readings

The 13 files under `laws/` are AI-generated readings created locally on
2026-09-20 with Coqui TTS 0.25.3 and the `XTTS-v2` model. The model was
conditioned only on these negative-delivery CC0 references listed above:
`thorsten-angry-nicht-weg.mp3`, `thorsten-angry-duemmer.mp3`,
`thorsten-angry-klappt-nicht.mp3`, and
`thorsten-disgusted-nichts-geschafft.mp3`. The amused and sleepy takes were not
used. The synthesis model is an offline production tool and is not shipped.

- Model source: https://huggingface.co/coqui/XTTS-v2
- Model license: Coqui Public Model License 1.0
- Output: mono MP3 at 64 kbit/s and 22.05 kHz
- Validation: every clip was decoded with FFmpeg and transcribed locally with
  Whisper `small` in German. A timestamp review removed post-sentence model
  leakage; the final pass contained every intended sentence ending and no
  trailing invented speech.

These are synthesized derivatives, not original Thorsten-Voice dataset
recordings. Each numbered file maps directly to the same one-based entry in
`game.js`'s fixed `lawPowerLines` deck and uses that complete displayed string
as synthesis input. The exact displayed string is also the browser-speech
fallback.

| Shipped file | Duration | SHA-256 |
| --- | ---: | --- |
| `laws/thorsten-negative-law-01.mp3` | 26.645 s | `BDADB8349E15CAB81F413AA997FA9F6B49CC85A212E1857459B3B0B1F9ADE544` |
| `laws/thorsten-negative-law-02.mp3` | 15.935 s | `C82FEAF6F4EA397BE5DF4DD426990060296BBD5AB41275F9483DFA78AA7EA752` |
| `laws/thorsten-negative-law-03.mp3` | 31.713 s | `37FE5ADCE8816247DB148B77B42ED9D233BC866DB887B160D2A9743313DC64AF` |
| `laws/thorsten-negative-law-04.mp3` | 29.074 s | `FAF9ABA99FD86279AE44D455E894EFE0B9EAC1937B4152515FC7B6B7398942E2` |
| `laws/thorsten-negative-law-05.mp3` | 6.922 s | `22919939AD9589179571E7101C7FB44301F290C5ED27D7C1750376EE68EE7A9D` |
| `laws/thorsten-negative-law-06.mp3` | 14.550 s | `FFBBBD6DB54904FECD46BB302F8997E2543E4902EB62D71BC53876E92898FD9E` |
| `laws/thorsten-negative-law-07.mp3` | 15.569 s | `5774691C5575D4434517612C32679C39BE0FFA6B1BEAAAAF686F778C4E95F05C` |
| `laws/thorsten-negative-law-08.mp3` | 16.771 s | `4F9BA8B9E4CF94EA8F725A442A138D7253D2B4620D2F8881A2821E1B15653D20` |
| `laws/thorsten-negative-law-09.mp3` | 15.099 s | `13DBD600206ED87C16EFB991F1B3CDCA100116DBDB1F6671B8C645B1B01492DF` |
| `laws/thorsten-negative-law-10.mp3` | 29.623 s | `83F425B324894404F4CB939B36383BD73A5822A63C9A3CC59AC9795A55572AA6` |
| `laws/thorsten-negative-law-11.mp3` | 23.667 s | `CCB4D1D64CA7EFE6C6806A4D7F4048861C2A1D057C7C0DA72437B5315CC30827` |
| `laws/thorsten-negative-law-12.mp3` | 24.268 s | `9C45825C4F9D8C0D3F75A51FFFF37B6B1DDB1AC684661D8CFE4777769940E030` |
| `laws/thorsten-negative-law-13.mp3` | 23.327 s | `458D9941D53485E7532B26EF6C8EA5261B4D72783CA568B6A4827F3CD37CB235` |

## Einbürgerungstest wrong-answer sting

`quiz-wrong-answer.mp3` was supplied by the user from their local
`D:\Downloads\sound.mp3` for this integration. It is used only for the
citizenship-quiz wrong-answer reaction.

- Duration: 4.415 seconds
- SHA-256: `103EF0A41C1C3E3EAC4CFADAAB471616EC625E54E2B7EC3AA2573EBB7BF742D0`

Its external redistribution provenance and license should be confirmed before
publishing it outside the user's project. It is not relicensed under the
repository's other asset licenses.

## Bayern character excerpts

The eight files under `bayern/` are coherent excerpts from the user-supplied
local recording `D:\Downloads\Bayern_.mp3` (111.386 seconds; source SHA-256
`203D7E56F8474F142CBBBD57A6E16BEF3A53C5722F64E093D250A7A2E4FE28EB`).
The recording was transcribed locally with Whisper `small` using German word
timestamps. Ambiguous passages were excluded. Selected sentence boundaries
were cut with FFmpeg, loudness-normalized, and encoded as mono 22.05 kHz MP3
at 64 kbit/s with short boundary fades.

| Shipped file | Exact displayed/spoken text | Source interval | SHA-256 |
| --- | --- | --- | --- |
| `bayern/baden-wuerttemberg-not-bayern.mp3` | Und als letzten Punkt: Baden-Württemberg. Ah, nicht Bayern. | 35.46–40.92 s | `2D1F5EF4D9697CE478EBBC6F2049989B0EBABC2F08B99529E4F14E932A552645` |
| `bayern/wie-schoen-bayern-ist.mp3` | Wie schön Bayern ist. Geh nach Bayern. In Bayern gibt's Bayern. Nur in Bayern gibt's Bayern. | 45.86–51.42 s | `5EE93E5BF97CE133BFD450192C6B67854EA305927C1960C388DAE86DAC992521` |
| `bayern/stichwort-bayern.mp3` | Für Bayern ist das wichtig. Stichwort Bayern. | 52.78–55.38 s | `1E768D99F9B0B4A0AFB25A7559C9313E6C610CA11251415AC309FD76985F7C06` |
| `bayern/bayern-leben.mp3` | Oh ja, man muss Bayern nicht mögen, man muss Bayern leben. | 61.80–65.70 s | `D2CA421BED776A8876006E332352227EB2AE2843AB4A7EF59ABDE89FB7A8D913` |
| `bayern/warum-weil-bayern.mp3` | Warum? Weil Bayern. | 65.84–67.54 s | `C2FF0D54FCBC21311FCB727ABDDAA7919CB829CD6581E5AA5618CB526200D598` |
| `bayern/ich-will-nur-eins-sagen.mp3` | Ich will nur eins sagen: Bayern, Bayern, Bayern, Bayern. | 73.10–75.74 s | `6726EB32BA913E2CFC6B093A6A97566437C0F3BB60EA0A447B9BF80A497A3969` |
| `bayern/rettung-bayerns.mp3` | Ein Bayern kam aus Bayern. Das war die Rettung Bayerns. | 84.16–87.16 s | `FCC82B8EDEA932E64BC034ACEB5C637A4E2051720732A68C268773421552A7F3` |
| `bayern/gott-schuetze-bayern.mp3` | Gott schütze Bayern. | 101.74–102.92 s | `7298BEA5CBA5C3338C5876DEFA2B2864DDF5CEB9FC7690BC31F87F4CA0EBD204` |

These clips are used only for the fictional Bayern-Beauftragter. Their exact
text is shown for the entire playback and is also the missing-file browser
speech fallback. The source recording's external redistribution provenance and
license should be confirmed before publishing outside the user's project; it is
not relicensed under the repository's other asset licenses.
