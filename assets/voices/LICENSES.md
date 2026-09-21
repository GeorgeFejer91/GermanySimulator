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
| `thorsten-angry-nicht-weg.mp3` | `070560e5-3046-2e53-8963-68e9cf0be001---bb9f85586a2700cad15c61ac262035a8` | Nein, ich gehe hier nicht weg! | `61A7D884AEF5D3029384F0BFF3D0B78AE75464CDBDD9E848AC9020D48E94EBBF` |
| `thorsten-angry-duemmer.mp3` | `070560e5-3046-2e53-8963-68e9cf0be001---1910c7ff4e2def4080401802af5b6575` | Dümmer geht's nicht mehr. | `66D2613EE3F5E9F6DE1C6B41E16DC27B9776B26520A772235977074DB1E88141` |
| `thorsten-angry-klappt-nicht.mp3` | `070560e5-3046-2e53-8963-68e9cf0be001---b85796d30b6476b19dd0e5240593c366` | Das klappt einfach nicht! | `853E5BD8F21336589461AB264EB3508BE4A38C8DC75C7185AAA41C77BC3042F7` |
| `thorsten-amused-nachschub.mp3` | `680eb50a-d8a5-4fc7-b127-e8ec640a58e7---31952592964b2a3e715f1bea81bdc3cf` | Endlich wieder Nachschub! | `AE493487DA4390E2F0D850F4BCAA30CB9887E5052EEBCE0BFFCF24BF5C225452` |

The two additional recordings are the repository's official emotional sample
files. Both speak “Mist, wieder nichts geschafft.” and were encoded with the
same mono MP3 settings described above. The sleepy take is an ambient pedestrian
remark; the disgusted take is the player's Germanness-loss reaction.

| Shipped file | Dataset style | Upstream sample and Git blob | SHA-256 |
| --- | --- | --- | --- |
| `thorsten-disgusted-nichts-geschafft.mp3` | `disgusted \| angewidert` | [`samples/thorsten-21.06-emotional/disgusted.wav`](https://github.com/thorstenMueller/Thorsten-Voice/blob/master/samples/thorsten-21.06-emotional/disgusted.wav), `37ea523dc505d8cc85c01c0d94305de123a1d4ac` | `152920F2AC48BDC208D221D19822CEE7AB2599A639F40819147A79B11704F81E` |
| `thorsten-sleepy-nichts-geschafft.mp3` | `sleepy \| schläfrig` | [`samples/thorsten-21.06-emotional/sleepy.wav`](https://github.com/thorstenMueller/Thorsten-Voice/blob/master/samples/thorsten-21.06-emotional/sleepy.wav), `d9c7dabe89f6472a9b980fae6c3b3e4c85076eb6` | `739C3E7A73188783F33DA4DBD0849C7E539BD5C1AC76EEA4D2F33ADBC80D60E5` |

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
| `laws/thorsten-negative-law-01.mp3` | 26.645 s | `08AFF8383CADD581EE443B050D6FFA820EBBD4CDC46D6201070E76CCF09A7A4E` |
| `laws/thorsten-negative-law-02.mp3` | 15.935 s | `9E7D12D72A67B8FFEA87334BE48CE3EC81CD44355AE1E9BB849A25C61DC69A66` |
| `laws/thorsten-negative-law-03.mp3` | 31.713 s | `4E4C90FF0890F61AA8877FF2184B8588F4B5CA681741A7BDDB8CBF272F338A56` |
| `laws/thorsten-negative-law-04.mp3` | 29.074 s | `301D0F116856D69F598DA57EFF5423553393CDC2CE3CDE9A30B70AB0621A7F87` |
| `laws/thorsten-negative-law-05.mp3` | 6.922 s | `D50BFC268FE9FCC86B142331879F0C75362BB3525A871B73302128C88E02A52E` |
| `laws/thorsten-negative-law-06.mp3` | 14.550 s | `742ECD54D0AC89867B3EB577F7EF09D183B869E5141A4418AAE00ADDF75D5413` |
| `laws/thorsten-negative-law-07.mp3` | 15.569 s | `4312977418E56913320BC7FB8AC353587DFB0DCD1D1313AB2BA4014A7C49D6E0` |
| `laws/thorsten-negative-law-08.mp3` | 16.771 s | `FE7B08B303470852FC19CBBCF09FF67E7F188E45D7B467A9261332810A2170BE` |
| `laws/thorsten-negative-law-09.mp3` | 15.099 s | `96FAC706C5E29A60F775985E4B51224709D144A39B79F22E7FE94FB3B0DAB27A` |
| `laws/thorsten-negative-law-10.mp3` | 29.623 s | `B05F72B097E02A86AE7AC8EFE31CF7950E89CD150E8A2A184DBD8E893219CBF2` |
| `laws/thorsten-negative-law-11.mp3` | 23.667 s | `E463BFE83DA6972341B49404087C3AAEB5BD690D71302D62F3A92CE008AF7B50` |
| `laws/thorsten-negative-law-12.mp3` | 24.268 s | `06FDD1B46A266CBEAEE5EAB0261E19FE3CEEC712BE1F48923FC8E8F63BF07A1B` |
| `laws/thorsten-negative-law-13.mp3` | 23.327 s | `1529047B596C19F946F565755B9707C3032937B5BA11F71CD2997D162B2AE9E5` |

### Rotating `REGEL DES AUGENBLICKS` readings

The 11 `thorsten-negative-rule-*` files use the same model, negative-delivery
references, output format, and validation workflow. Each file maps to the same
one-based entry in the fixed `rules` deck and reads the complete displayed rule
body. The fictional shorthand identifier remains visual because tokens such as
`QuerO` and `Bln/DE` are not stable speech-model input. Runtime fallback sends
the identical displayed body to the browser's German voice.

| Shipped file | Duration | SHA-256 |
| --- | ---: | --- |
| `laws/thorsten-negative-rule-01.mp3` | 11.546 s | `5731990DD2B3471B6049E6B09272E8E9A586865BFF85B4151FFD11BB13D946F1` |
| `laws/thorsten-negative-rule-02.mp3` | 6.243 s | `0F044075B719823E54C4F49F8EDCD67249CB25781ABD3010372C64DC02B5FBF4` |
| `laws/thorsten-negative-rule-03.mp3` | 7.053 s | `E13F33FE10FD51C67279D7B0A14D69237BF5572292AF61F2C5E3BFD80C006AFC` |
| `laws/thorsten-negative-rule-04.mp3` | 5.042 s | `5405A4831CD5F8B58519BF220EC91A9D9DB307F198009A8AC7F870C3EF8BDE34` |
| `laws/thorsten-negative-rule-05.mp3` | 5.799 s | `9475DCC6D3A55EB77831591E6702D948DB71592DA5354AD2C79B5F90F67DD86F` |
| `laws/thorsten-negative-rule-06.mp3` | 5.564 s | `CF8AF79BD2C1048394565D792FAE71A9AA4211D0C15197CA49F5A7504FEA3EC4` |
| `laws/thorsten-negative-rule-07.mp3` | 7.523 s | `EC795370D21BE7D01492C0ABAB78020E0F6DA5E58CE6E3FCB0E574DCB4624D16` |
| `laws/thorsten-negative-rule-08.mp3` | 7.027 s | `3D4B14EA1BD3AA74D5302FDECD86DFB4E40DA8ADCC51118B6E2FD51E2B0062DC` |
| `laws/thorsten-negative-rule-09.mp3` | 7.732 s | `650E4D4FBEA63CB639CEA4953A2D6CCB76FDC6EFD607B4E0F2F4EAC5A4C6EA01` |
| `laws/thorsten-negative-rule-10.mp3` | 6.034 s | `E756A6D111EA4D5FA5CB90E38926BDA99D935B5806DC1EBA27E5B466C6848D68` |
| `laws/thorsten-negative-rule-11.mp3` | 11.572 s | `942945849804D61B5B535BE095EB4908AA220661A9C3068E51B8CB79533FE4D8` |

## Einbürgerungstest wrong-answer sting

`quiz-wrong-answer.mp3` was supplied by the user from their local
`D:\Downloads\sound.mp3` for this integration. It is used only for the
citizenship-quiz wrong-answer reaction.

- Duration: 4.415 seconds
- SHA-256: `376E13DCD4BA9C270618A5ED5CD1CFDB9D5ECDC84C9C3DB2061C7CDF4BF02005`

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
| `bayern/baden-wuerttemberg-not-bayern.mp3` | Und als letzten Punkt: Baden-Württemberg. Ah, nicht Bayern. | 35.46–40.92 s | `D1801A3382B02506EFD0474168B6920259DFABF60352DC445CE934EF81E31305` |
| `bayern/wie-schoen-bayern-ist.mp3` | Wie schön Bayern ist. Geh nach Bayern. In Bayern gibt's Bayern. Nur in Bayern gibt's Bayern. | 45.86–51.42 s | `85A8784BA0425D1262C4A1FDDD5DC6357528C0DB5557C44641C8EE4838EDA427` |
| `bayern/stichwort-bayern.mp3` | Für Bayern ist das wichtig. Stichwort Bayern. | 52.78–55.38 s | `AD36DB45FC80A16A099BD18AC8701E3C9FED7E1C6B9794499BB47359F0D1DCDF` |
| `bayern/bayern-leben.mp3` | Oh ja, man muss Bayern nicht mögen, man muss Bayern leben. | 61.80–65.70 s | `361BACDFAEEC323AC9DE966A25439A8BB8FBBEB50DD32CF680FA6AF126600FF9` |
| `bayern/warum-weil-bayern.mp3` | Warum? Weil Bayern. | 65.84–67.54 s | `D7C5063ED395D9BC43F064B0B63F1A54D6C3D4DEAFEADBDFBC79CF728D748A23` |
| `bayern/ich-will-nur-eins-sagen.mp3` | Ich will nur eins sagen: Bayern, Bayern, Bayern, Bayern. | 73.10–75.74 s | `DB9DD8630E638D4A40072307F73914BDDAA38F952BA38C0029790DA58DF16D59` |
| `bayern/rettung-bayerns.mp3` | Ein Bayern kam aus Bayern. Das war die Rettung Bayerns. | 84.16–87.16 s | `12C1E103C49A7CD5C150F68EF170407BA3591CFDFC8278554BA619EF020E5A36` |
| `bayern/gott-schuetze-bayern.mp3` | Gott schütze Bayern. | 101.74–102.92 s | `D7E7A802C937D7D7F25ECFB0028D90B01E24C1C75F7CCD981EC8B281BB8156B5` |

These clips are used only for the fictional Bayern-Beauftragter. Their exact
text is shown for the entire playback and is also the missing-file browser
speech fallback. The source recording's external redistribution provenance and
license should be confirmed before publishing outside the user's project; it is
not relicensed under the repository's other asset licenses.

All shipped voice files in this record are two-pass normalized to the
foreground role (`−18 LUFS`, maximum `−1.5 dBTP`) while preserving their sample
rate, channel layout, approximate bitrate, and duration. The hashes above refer
to those normalized shipping copies.

## Merkel quotation excerpt

`merkel/neuland-0-3s.mp3` is the user-supplied local file
`D:\Downloads\neuland-0-3s.mp3`, mapped only to the displayed/spoken line “Das
Internet ist für uns alle Neuland.” It is 3.030 seconds, 73,394 bytes, mono
44.1 kHz at approximately 192 kbps, and has normalized shipping SHA-256
`6E6DF76D99DB89E462335AE6A8FB6D7909C0611015B58A98FD9C8A3E0A8CB336`.
No external source URL or redistribution license was supplied; it is not
relicensed under the repository's other asset licenses.
