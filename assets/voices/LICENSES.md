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

## Einbürgerungstest wrong-answer sting

`quiz-wrong-answer.mp3` was supplied by the user from their local
`D:\Downloads\sound.mp3` for this integration. It is used only for the
citizenship-quiz wrong-answer reaction.

- Duration: 4.415 seconds
- SHA-256: `103EF0A41C1C3E3EAC4CFADAAB471616EC625E54E2B7EC3AA2573EBB7BF742D0`

Its external redistribution provenance and license should be confirmed before
publishing it outside the user's project. It is not relicensed under the
repository's other asset licenses.
