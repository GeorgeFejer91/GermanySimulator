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

## Bürgeramt first-person reply voice (2026-10-12)

The user selected Thorsten Müller's shipped “Endlich wieder Nachschub!” voice
for Hans-Peter Mustermann's first-person replies. The separate saved player
profile uses that exact CC0 recording first, followed by the same speaker's
shipped “Nein, ich gehe hier nicht weg!” clip solely to meet the installed
profile tool's three-second minimum. The source MP3 hashes are respectively
`ae493487da4390e2f0d850f4bcaa30cb9887e5052eebce0bffcf24bf5c225452` and
`61a7d884aef5d3029384f0bff3d0b78ae75464cdbdd9e848ac9020d48e94ebbf`.
The 3.570-second private reference reads “Endlich wieder Nachschub! Nein, ich
gehe hier nicht weg!” No other speaker, dataset or Knick undertone is used.

`For-AI/VOICE-CAST.json` pins saved UUID
`b027d18a4fc748cabb133fbb14077500`, source/normalized hashes and the existing
MIT Chatterbox Multilingual V2 0.1.7 revision. All 107 exact authored reply labels now have eligible recordings. Their receipts
belong to `player-replies/spieler-hans-peter-mustermann-manifest.json`. The original
and normalized reference WAVs remain in the private Music library and are not
shipped. Independent ASR/level checks are separate from listening review.

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
recordings. On 2026-10-12, the shipped numbered files were shortened to their
spoken citation and heading for §-power. The long originals, their full German
and English catalog text, and the complete spoken paragraphs remain recoverable
from Git commit `3242218`. The following hashes identify those originals;
the short assets below retain the same numbered clip IDs and Thorsten source.

| Full original at `3242218` | Duration | SHA-256 |
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

The short exports were made with FFmpeg 8.0.1 from those exact original Git
blobs using `tools/shorten-law-power-clips.py`. Whisper-small word timestamps
and FFmpeg silence detection identified the end of each heading; the script
records each cut point, applies a 100 ms fade, and levels each resulting MP3 to
-18 LUFS ±0.3 with a peak no higher than -1.5 dBTP. Number 13 stops after the
Food Irradiation Ordinance citation because its full heading is unusually long.
The current `For-AI/AUDIO-TEXT-LIBRARY.js` source and English subtitle end at
the same words. Encoded-file Whisper-small transcription found no paragraph
body in any short export. Listening review has not been run.

| Shipped short file | Duration | SHA-256 |
| --- | ---: | --- |
| `laws/thorsten-negative-law-01.mp3` | 6.750 s | `962A9B3087A088F1E4A75DC91A6AADBC5A64A07E40960B3A864BB7B0995888FC` |
| `laws/thorsten-negative-law-02.mp3` | 4.182 s | `82EFA5BACCDAFE48AEE18BC16C3605012F7AC4D0CD50EDB1BDA46CBA6FEBC170` |
| `laws/thorsten-negative-law-03.mp3` | 9.950 s | `DB4697D1A60CE3A2E2E519034B7954836CEC15CFB18F61710B8516E65B4CD27E` |
| `laws/thorsten-negative-law-04.mp3` | 5.780 s | `D2AD7FEC3C61410FC4363B9DA2559672DD230F459CC836AA52BC97B875D99C48` |
| `laws/thorsten-negative-law-05.mp3` | 3.420 s | `119EED7314F1C7CE6FE7AA84F744FDCC93DBB73E170A2C807AF4D1A3C6C3BA0C` |
| `laws/thorsten-negative-law-06.mp3` | 7.270 s | `93A3E213CA7B0F55B27E969F6FAC0CAAE598DE8F5175A6964451C5EA62545188` |
| `laws/thorsten-negative-law-07.mp3` | 5.080 s | `1A17A67092C78F220234793F49C4DD68B7C7D3C79217EC7E990DE6FC0904AE4F` |
| `laws/thorsten-negative-law-08.mp3` | 4.720 s | `2F4FE30624BF199939D422729F401A25936F4E5FD84A0918A185642D8BA085FF` |
| `laws/thorsten-negative-law-09.mp3` | 4.960 s | `72F28CB393324904E1419CDA854564D1C9FACF8AA3A00C11EBB1A91CC87836A1` |
| `laws/thorsten-negative-law-10.mp3` | 6.150 s | `22C21BFEBB2AD0E10A927F7D8798B276E87A5ECA18547C343913EDA49144E4C4` |
| `laws/thorsten-negative-law-11.mp3` | 5.932 s | `E7731CC24135ECAA5C42F09EF5D64E42B05EA70C1E6EF978519D84165EAB55FB` |
| `laws/thorsten-negative-law-12.mp3` | 5.320 s | `84660214CFD4E40C524B52865DBE5DE1352F3F2FEC15B5198E9958C5ECD6DD1C` |
| `laws/thorsten-negative-law-13.mp3` | 3.840 s | `326EEDA0019EC94C5418ADF99F299BE0C6D2FEC24AB27E5D3EC336EB3F2097F0` |

### Archived anonymous `REGEL DES AUGENBLICKS` readings

The 11 `thorsten-negative-rule-*` files were archived outside the game on 2026-10-11 when rules became nearby character interactions. Their historical hashes below remain provenance, and they have no runtime lookup. They used the same model, negative-delivery
references, output format, and validation workflow. Each file maps to the same
one-based entry in the fixed `rules` deck and reads the complete displayed rule
body. The fictional shorthand identifier remains visual because tokens such as
`QuerO` and `Bln/DE` are not stable speech-model input. The current street-adviser family below preserves the identical displayed bodies with each selected character voice or captions.

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

## Alice Weidel satire recordings

The five files under `alice-weidel/` are normalized copies of the user-supplied
local files `D:\Downloads\alice\1.mp3` through `4.mp3` and
`D:\Downloads\alicespeech.mp3`. They were transcribed
locally with Whisper `small` in German, and each exact transcript is the visible
in-game fallback for its matching recording. The character and playback are
labeled **FIKTIONALE SATIRE**. These user-supplied recordings are not presented
as verified Alice Weidel quotations or factual statements.

| Local source | Source SHA-256 | Shipped file | Exact displayed/spoken text | Shipped duration / bytes | Shipped SHA-256 |
| --- | --- | --- | --- | ---: | --- |
| `1.mp3` | `5D138CBB56A136E6185F9D0D3ECEA40B97640C164477C715873021B7935EB2CB` | `alice-weidel/deutschland-schweiz.mp3` | Ich liebe Deutschland. Besonders aus der Schweiz. | 3.109 s / 50,198 | `5D32BC26A4FDD9419690A1A496AC2263CBEA1CF34FB8429C33D8B3B8334800EF` |
| `2.mp3` | `11F559735A9B6C03B529DD15CF1D7998B4C410B95B70CFE6EA13691473335DA4` | `alice-weidel/hitler-ddr-leberkaese.mp3` | Adolf Hitler war ein Linker. Die DDR hieß schließlich auch Demokratische Republik. Und Deutsche Leberkäse besteht selbstverständlich aus Leber und Käse. | 12.304 s / 197,319 | `630C34D0F2F94871AD47BB404F479435055B012A9245F2E5848F9F33883AFB7E` |
| `3.mp3` | `1E4BF6A2EE0D452B4E8ECA72B52A29FE78539DBAB39AE6A87DC7F7C169B63A16` | `alice-weidel/nationalsozialisten-sozialisten.mp3` | Die Nationalsozialisten waren Sozialisten, sonst hätte man sie ja Nationalirgendwas genannt. | 5.982 s / 96,173 | `ABFF66A12A995645B25FE8FE48CB61F644BB2006DDD0702FC56113FF3C690345` |
| `4.mp3` | `B54C40B1E58C466FD3434CBF237C7327B8E4E8427EFF4D8B17D62843C0785EE7` | `alice-weidel/traditionelle-familie.mp3` | Wir müssen zurück zur traditionellen Familie. Wie genau die aussieht, klären wir dann außerhalb meines Privatlebens. | 6.374 s / 102,443 | `F9891EABA1CC5BAD71DBCA8ACD79A10769BC721FD9C711CE00EE2196715F8F22` |
| `D:\Downloads\alicespeech.mp3` | `4222CEE31A035F532E9BEDECDDDCE303B28724D6AD32CFEA4E99006046B44E4E` | `alice-weidel/eliten-sind-das-problem.mp3` | Eliten sind das Problem. Aber zum Glück habe ich Wirtschaft studiert, bei Goldman Sachs gearbeitet und wohne in der Schweiz. | 7.471 s / 136,184 | `4222CEE31A035F532E9BEDECDDDCE303B28724D6AD32CFEA4E99006046B44E4E` |

The shipping copies remain mono 44.1 kHz, approximately 128 kbit/s MP3 and
pass the foreground target (`−18 LUFS`, maximum `−1.5 dBTP`). No external
source URL or redistribution license was provided. They are not relicensed
under the repository's other asset licenses; separate permission is required
before reuse outside this project.

All shipped voice files in this record are two-pass normalized to the
foreground role (`−18 LUFS`, maximum `−1.5 dBTP`) while preserving their sample
rate, channel layout, approximate bitrate, and duration. The hashes above refer
to those normalized shipping copies.

## Retired Merkel quotation excerpt

`merkel/neuland-0-3s.mp3` is the user-supplied local file
`D:\Downloads\neuland-0-3s.mp3`, mapped only to the displayed/spoken line “Das
Internet ist für uns alle Neuland.” It is 3.030 seconds, 73,394 bytes, mono
44.1 kHz at approximately 192 kbps, and has normalized shipping SHA-256
`6E6DF76D99DB89E462335AE6A8FB6D7909C0611015B58A98FD9C8A3E0A8CB336`.
No external source URL or redistribution license was supplied; it is not
relicensed under the repository's other asset licenses.

The excerpt and the earlier root-level “Wir schaffen das” recording are retired from runtime delivery following the user's request to resynthesize every Merkel line with the newly saved `GS Merkel` profile.

## User-selected GS Merkel speech

All nine authored German lines, including “Sie stehen hinter mir,” use saved profile `25916e5981064e09a2c42350d5fe5f04` (`GS Merkel`), selected by the user for replacement on 2026-10-11. Its source is `https://www.youtube.com/watch?v=kDQki0MMFh4`; original SHA-256 is `683260d6d6eaef951a8bc5778efce547a45d6c55172e2c90a504280f8e82ba92`, and the preserved 24.636375-second mono 24 kHz reference has SHA-256 `9a43f754972aa8a5dfa491d4c97f0eac417b0725731aaa417617d82bc43b3f6c`. Private references remain outside the game assets.

Secret Tunnel 6's installed OmniVoice Rust runtime rendered the exact authored text with `k2-fsa/OmniVoice`, model revision `c5fdb5ccb189668d56333f77ba2629f4cd7535f4`. Its noncommercial model terms and Boson/Meta tokenizer terms apply; this entry does not grant a new license to the user-selected source recording. The selected clip IDs, renderer hashes, generated and encoded transcripts, durations, byte sizes, decoded costs and final SHA-256 hashes are in `merkel/manifest.json`. Delivery uses the existing foreground target of −18 LUFS ±0.3 LU and at most −1.5 dBTP. Whole-clip Whisper feedback checks the spoken words; listening review is unperformed. The user's explicit replacement request sets these clips as default speech, with exact-text browser fallback and no startup preload.

## Civilian traffic-driver shouts

The four former synthesized traffic recordings were removed on 2026-10-11 at the user’s request. Their exact files, hashes, reference and model credits remain in the private voice archive. The game retains the four authored German shouts, English translations and existing browser-speech fallback. The synthetic horn is code-generated. The CC0 Thorsten source clips above still supply the selected Dieter Hupfer reference.

On 2026-10-15, three new exact-text Dieter Hupfer recordings were admitted under
the whole-game fixed-voice cloning request. The current reference is CC0-1.0;
Chatterbox Multilingual V2 0.1.7 uses MIT. The
[traffic gap manifest](traffic-dialogue/verkehr-dieter-hupfer-gap-manifest.json)
owns the exact reference, model revision, source components and four shipping
hashes. On 2026-10-16, the fourth retained take was admitted with a finite
compound-timing proof, without new synthesis or ASR. The original literal-false
receipt and empty raw cues remain unchanged. The manifest also preserves the
failed original render and unknown-license raw receipt beside the verified CC0
processing recovery. CC0 requires no attribution credit. Listening remains unperformed.

## Additional Heinrich Wachtmeister police recordings

Three additional recordings use Heinrich's existing selected CC0-1.0 reference
and the same MIT Chatterbox renderer. The
[police gap manifest](police-dialogue/polizei-heinrich-wachtmeister-gap-manifest.json)
records exact source/model hashes, historical take-one lineage and the bounded
take-two continuation. Two takes were admitted on 2026-10-15; a third retained
take followed on 2026-10-16 through a finite compound-timing proof, without new
synthesis or ASR. Its original literal-false receipt and empty raw cues remain
unchanged. Three of eight generated takes are admitted, five held privately.
These supplement the four earlier defaults without replacing their
receipts. CC0 requires no attribution credit. Listening remains unperformed.

## Horst Stempelmann · official omen audio, candidate 2

`horst-stempelmann/omen-candidate-02.mp3` is the user-approved default recording
for “Wer die Finsternis sieht, hat sie selbst gewählt!” The user approved the
audition and explicitly directed its official game use on 2026-10-09. Horst's
first profile is retained; his second official candidate is Secret Tunnel UUID
`09b19a96ec8848138ab0a0910af09ece`.

The user selected [this reference](https://www.youtube.com/watch?v=MtGyTnkvNKk).
Voice Cloner imported its first 30 seconds. Original M4A SHA-256:
`7de4a343ef08a06189c6d1cecdbab6c134a2192bd98425875e4c440a8685c317`;
normalized reference WAV SHA-256:
`177545215cfeccbbe758ab24e62011dcfc37c43aaca1c0ae15c75b24824b53ff`.
The reference's license has not been independently verified; project-use
authorization is the user's instruction, not a CC0 or general redistribution
license. The source reference remains private.

The unchanged approved take was generated by Chatterbox Multilingual V2 0.1.7,
model revision `5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18` (MIT), from that
verified reference. Independent German ASR matched every authored word.
Its word onsets are ASR estimates; the media playhead owns runtime cue timing.
The final mono 24 kHz, 128 kbit/s MP3 is 4.760 seconds / 77,612 bytes,
-18.19 LUFS / -2.34 dBTP. Shipping SHA-256:
`da75a78e3d721f478f44e02327961f3d2933595dcc1bbdc8c73510af0ccf5df4`.
The other two same-profile auditions remain private and are not default dialogue.

## Opt-in fictional character voice candidates

The 223 MP3s under `candidate-dialogue/`, eleven samples under `profile-auditions/`, and two additional MP3s under `quiz-segments/` are generated review candidates. The `candidate-dialogue/manifest.json` opt-in catalog now indexes all 236 unique clips by their existing paths; Brigitte Neumann's audition supplies the first of her three quiz segments. Only a complete exact-text, same-speaker quiz sequence can play as a recorded prompt. The source voice references are hash-verified clips from the Berlin Database of Emotional Speech (EmoDB) under CC0 1.0; exact source files, actor IDs, emotion labels, and hashes are in `For-AI/VOICE-CAST.json`. The alternate renderer is ResembleAI Chatterbox Multilingual V2 0.1.7 under MIT. The three adjacent manifests record each output's exact text, source reference hash, model revision, profile UUID, output hash, and independent ASR check. Default gameplay does not select these unapproved clips; their words, character identity, emotional fit, and production quality require listening review before release.

Separately stored Music-library Secret Tunnel takes were rendered with the pinned OmniVoice pre-trained model. Its [model card](https://huggingface.co/k2-fsa/OmniVoice/blob/c5fdb5ccb189668d56333f77ba2629f4cd7535f4/README.md) states CC BY-NC for the weights, and the [maintainer confirms noncommercial use](https://huggingface.co/k2-fsa/OmniVoice/discussions/37). Their `commercialUseStatus: not_cleared` is a release gate, even where the EmoDB source is CC0 and Whisper matches every word. Do not copy a private OmniVoice take into a commercial game build without separately documented rights; use the actual model provenance of any replacement take. The [pinned Chatterbox model repository](https://huggingface.co/ResembleAI/chatterbox/tree/5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18) is marked MIT, but source rights and full listening review remain required for its preview candidates too.

## Bürgeramt fever listening alternatives

The 2026-10-11 curation retains 35 current recordings; five rewritten Knick takes
are hash-verified in the private Music archive and no longer ship. The selected
production profiles in `For-AI/VOICE-CAST.json` now own generation identity.

`amt-fever/manifest.json` records the separate user-approved family for twelve saved
alternate profiles: 40 MP3s / 4,107,104 bytes. These use transformed references from the original EmoDB
CC0-1.0 release, preserving each reference hash, and the cached Chatterbox
Multilingual V2 0.1.7 model, MIT revision
`5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18`. No OmniVoice weights were used for
these files. Each eligible encoded MP3 records its exact current authored text,
speaker/profile, raw/output hash, seed, processing and independent ASR.
They retain clean speech with a quiet fixed pitch-shifted undertone, and are
measured at -18 LUFS ±0.3 / at most -1.5 dBTP, mono 48 kHz, 128 kbit/s.

The user's 2026-10-10 instruction “I approve, just implement it” authorizes
default dialogue use; the exact approval is retained in the manifest/catalogue.
Perceptual listening and the seven-field review queue remain unverified. Semantic
ASR failures remain private; the Bon/Bohn spelling flag needs listening.
The original user-approved Horst omen file and its provenance above are
unchanged. Private references and normalized review queue remain in Music.

## Approved fictional character dialogue

`knick/manifest.json` records the subsequent
same-profile Knick batch requested on 2026-10-11. Its selected UUID is
`b080c7d95ecd418fb428282461d7fbe7`, using the transformed CC0 EmoDB reference
and pinned MIT Chatterbox model above. Its receipts preserve original and
normalized reference hashes, model revision, synthesis precision/settings,
raw and encoded hashes, fixed undertone, measured levels, independent German
ASR and estimated word cues. Only eligible exact-text takes ship. The user
requested implementation with this voice; this use authorization does not
establish listening acceptance. Rejected takes and all source/model files stay
in Music. The final 2026-10-12 main request has 167 eligible recordings and one
held unused historical A38 slot; one already-approved same-profile fever refusal
completes all 168 current Knick strings. The ambient supplement retains three
eligible recordings. Every new shipped take has explicit native EOS evidence.
Three unchanged joined MP3s use reviewed complete-file contiguous recognition
with all earlier whole-line conflicts retained; named delivery edits preserve
complete original native-EOS takes and sample-exact quiet-boundary proofs.
No listening acceptance is claimed.
Seventeen superseded first-pass public files retain exact old hashes and
manifest provenance in the private archive, including the two now held
lines. Earlier Knick and unused profile candidates are archived.

`street-wisdom/` contains six exact-text rule recordings across the three
existing selected profiles: Waltraud Wartemarke (two), Horst Hausordnung
(three) and Dietmar DIN-Norm (one). Their manifests bind each stable rule ID
to its original German body, English subtitle, dedicated actor, UUID, both
reference hashes, successful native EOS, independent encoded-file ASR and
measured levels. The references are the same hash-verified CC0-1.0 original
EmoDB sources already itemized in `For-AI/VOICE-CAST.json`; generation uses
the pinned MIT Chatterbox revision above, with dry speech and no Knick
undertone. Five rejected rules retain exact captions. The user's request
authorizes these interactions; perceptual listening remains pending. The
eleven former anonymous Thorsten rule MP3s and their provenance are archived
privately, with no active fallback lookup.

`approved-dialogue/manifest.json` is the per-file provenance ledger for bulk Chatterbox clips promoted to normal gameplay. Each entry records the speaking voice ID and Secret Tunnel profile UUID, exact script, shipping and source hashes, reference hash/dataset/license, renderer revision/license, and the reviewed Music queue hash. `tools/promote-reviewed-voice-dialogue.mjs` verifies the seven human review fields, original and normalized hashes, and delivery levels before copying a clip. That manifest is currently empty: none of the 236 bulk candidates has passed that gate. The individually user-approved Aktenkurier omen above is a separate direct catalogue recording with its actual approval instruction. Approved clips play by exact voice ID and text; remaining bulk candidates retain their opt-in preview status.




## User-selected Kriminalpolizei phone voice (2026-10-10)

The user selected saved Secret Tunnel profile `GS Kriminalpolizei` (`f700170f840543bca7413d3ccf6ac028`) for the Bürgeramt call. Its source note is https://www.youtube.com/watch?v=egBl1QgsdXQ, original hash `0a1f98a15137640d3913ac3e0bc28811d5304dd16119ffab5aa8ad6653df0acf`, and normalized reference hash `ef452114430b47167239cdb065b1e01d502c0148f1492ac1b66098a03c0ea82e`. This metadata does not establish a CC0 license. Source recordings and models are private authoring inputs and do not ship. The four authored phone recordings use Secret Tunnel 6’s bundled OmniVoice Rust runtime, revision `4c7b088294fd6f3a5fb9e3b1dfd3a77bc12f105b`, and model revision `c5fdb5ccb189668d56333f77ba2629f4cd7535f4`. Model weights have noncommercial terms with Boson and Meta tokenizer conditions.

The opening and shouted final phone reply use direct seeded retakes from that same saved profile because the first native takes changed words. Seed, rejected native feedback, exact source/encoded hashes and bundled Whisper large-v3-turbo q4_0 transcripts are in `kriminalpolizei/manifest.json`. All four final encoded phone clips matched the complete script after case and punctuation normalization. Final MP3s are mono 24 kHz, 64 kbit/s, measured within 0.3 LU of −18 LUFS and at or below −1.5 dBTP. The user’s explicit voice selection authorizes default playback for this phone family. Full listening review has not been performed; silent timing checks do not establish voice quality. Each clip loads after Answer at its own turn, with exact-text browser speech on load failure.

| File | Duration | SHA-256 |
| --- | ---: | --- |
| `kriminalpolizei/kriminalpolizei-phone-01.mp3` | 10.480 s | `2ac486e5b558dc909d96f6afce7767def77a891f81076b0b6f5e33274da20e24` |
| `kriminalpolizei/kriminalpolizei-phone-02.mp3` | 7.240 s | `0905883e183ae8993363a45ba6b8444264d39a4c0c2e0d725aa7e9c98110eb5f` |
| `kriminalpolizei/kriminalpolizei-phone-03.mp3` | 6.840 s | `5f6f9f1be2c78798d9250ff696eaba0ecc611803524cbaa277e250c79ad0cfc9` |
| `kriminalpolizei/kriminalpolizei-phone-04.mp3` | 7.680 s | `5e93de3c3d87f132ba45857be3508e77704376152def6c1a3853bcf01a4eb7c5` |

The five earlier Frau Knick escalation clips (`candidate-dialogue/amt-brunhilde-knick-17-escalation.mp3` through `-21-escalation.mp3`) used her retired primary profile `1a28fb7903d344518617d755a7f5cbb0`. They and the four former Heinrich phone candidates now live in the private Music archive and have no active preview lookup. The CC0 EmoDB original input hash was `903884eae81731486a3d4e8f04c69bf86f69a35002d7674f1d709225b7d2934f`; normalized native input hash `7844b1c83d829fa08c2fe1d5474697d81868bec0334dadf4642fae7591125cbf` remains separately recorded. The manifest preserves the previous candidates and their provenance. Historical retakes corrected “Grashalm” and “annulliert”; numeric/compound-only transcript equivalence is marked separately from literal agreement. These archived outputs passed the loudness checks; no complete listening acceptance is claimed.

## Bürgeramt background cast (2026-10-12)

`office-ambient/` contains exact short background remarks synthesized with the
existing selected character profiles in `For-AI/VOICE-CAST.json`, using the
pinned ResembleAI Chatterbox Multilingual V2 0.1.7 revision. No new voice profile
or source recording was created. Each per-voice manifest retains the CC0 EmoDB
reference provenance, original/reference hashes, exact German and English text,
native completion receipt, independent final-MP3 transcription, encoded hash,
duration and delivery levels. User authorization covers background use of these
voices; perceptual listening remains unperformed. Full private generation and
failed-take receipts remain in the Music library. Runtime selection never
substitutes browser speech for a missing ambient recording.

## User-selected GS Merz speech (2026-10-10, extended 2026-10-11)

The user requested all authored Friedrich Merz lines and nine short source-verified controversial quotations with the saved `GS Merz` profile (`cb7f3cee85f648c186355329316c6b3b`). Its source note is https://www.youtube.com/watch?v=TtO9A8t3AaA, original SHA-256 `b5579f4d31d4f138353232cd0708fc9ad62b8a4683dc35f6830d5557d9b87d8e`, and normalized reference SHA-256 `9c28278551a4a68180ca410306ebf322f94bb8034b7a1c2222d635ee014a178e`. This is a user-selected reference, without an established CC0 license; the private source and reference recording are not shipped. All eleven game lines use Secret Tunnel 6's bundled OmniVoice Rust runtime and model revision `c5fdb5ccb189668d56333f77ba2629f4cd7535f4`, under the model's noncommercial, Boson and Meta tokenizer terms. No synthesis model ships. Previous source MP3s were preserved privately in the Music voice library's `GermanySimulator GS Merz resynthesis 2026-10-10/` folder.

The first native take passed the bundled word check. The first Großvater take was rejected after Whisper recognized “Großhoffater”; a direct seed-42 render from the same verified saved reference replaced it. The two original game scripts and nine added quotations were normalized, encoded, decoded and independently transcribed again with bundled Whisper large-v3-turbo q4_0 and matched all authored words after case and punctuation normalization. The manifest records profile ownership, selected/rejected takes, hashes, duration, loudness and peak levels. Full listening review was not performed. The user's explicit selection supplies default Merz speech for proximity and direct interaction; the exact German script remains the masculine browser-voice fallback on load failure.

| File | Duration | SHA-256 |
| --- | ---: | --- |
| `merz/merz-rotes-rathaus.mp3` | 2.880 s | `45d44cc182250d11cb3f7d29ea85e9b1623253a22c22d55f3cd509b09d1a4f92` |
| `merz/merz-grossvater.mp3` | 6.730 s | `ecf8a7c8ac685dbbf4cf1698807103c2cd1046d9e3fb33236b737a9ba918d707` |
| `merz/merz-links-vorbei.mp3` | 1.710 s | `1d29d2509928a78b2c92735bdbdeeeebaeb7744011b160d1ed0eadca769ca08c` |
| `merz/merz-keine-linke-politik.mp3` | 4.000 s | `6456961335ffb6c720c02ae8ab1149e31cd602bc6200b9b2595f52995246567b` |
| `merz/merz-gruene-linke-spinner.mp3` | 3.840 s | `f1f7808a60a5169dc26f87f07b5b564e389f5ef9b8c9c9a86baea6d64e087503` |
| `merz/merz-zahnarzt.mp3` | 6.180 s | `02cb8c3aa32ca21f402b328773f39433dde14d1eb753d4ceda8394ac98c9f900` |
| `merz/merz-fragen-toechter.mp3` | 3.480 s | `126e23a1ceced38535365865b1eb9bb7290f4ffba32f3f6fed6af009a3e87d19` |
| `merz/merz-antisemitismus.mp3` | 3.800 s | `0c371a1665f3c51e9af7e480ec6f1656d69514c2f9885950b7c4a274b10a312d` |
| `merz/merz-stadtbild.mp3` | 3.600 s | `58cdc0758d5480c9e3cbbb8574f37e94f4d2adb5ec6ab4e74e0ee5eaee1c10e5` |
| `merz/merz-unterstreiche.mp3` | 3.520 s | `c9f2eba286426f5c9c1c6ff963587241ad4f1f3f259b33c214c0ee3b75263846` |
| `merz/merz-nichts-zurueckzunehmen.mp3` | 2.120 s | `46d528683e4cac9d8e70a756d1e89d9404904bef199e72404daf86d52e8c6077` |

The added quote texts are documented in `merz/manifest.json` with dates, publication sources, original-video links, and context. The “Spinner” line retains only the original closing clause and marks the omitted lead-in with an ellipsis. These MP3s are synthetic game renditions, not historical recordings. No listening review or popularity ranking is claimed.

## Browser-local personal names (2026-10-13)

Two scoped Piper/VITS name derivatives reuse the existing German Thorsten pretrained source and selected production reference allocations. Appointment calls use the user-accepted intercom derivative; it is explicitly not accepted as Frau Knick resemblance. Kripo caller names use the compact derivative distilled from pinned OpenVoice V2 tone conversion, and the user accepted the actual browser greeting. Exact model, original/reference, teacher/checkpoint and fixed-part hashes and limitations belong to their owning [intercom model card](knick/browser/MODEL_CARD.md) and [Kripo model card](kriminalpolizei/browser/MODEL_CARD.md). Fixed character dialogue and selected phone-body files retain their existing source/licensing notices. The OpenVoice upstream MIT notice is bundled with the caller model. Training data, conversion weights and large checkpoints stay private; browser clients load neither authoring pipeline nor teacher model.
