# Open L-Gauge n-Wagen passenger coach

`n-wagen-coach.glb` is a modified conversion of **[6w] DB n-Wagen**, a
six-stud-wide brick model of the German n-Wagen / "Silberling" passenger
coach designed by **DennisAkaTECHNO** and published by Open L-Gauge.

- Source page: https://open-l-gauge.eu/6wdb-n-wagen/
- Original download: `n-Wagen-rot-upload-fixed.io`
- Original creator: DennisAkaTECHNO
- Model license: Creative Commons Attribution-NonCommercial-ShareAlike 4.0
  International (CC BY-NC-SA 4.0)
- License: https://creativecommons.org/licenses/by-nc-sa/4.0/
- Original download SHA-256:
  `d61ebed848704dc66519b48196371313eb0ed3a0b8d595202ba235e75245eb13`
- Shipped GLB SHA-256:
  `526c0309070924816879cb8a8a4367eab337e79db9cf18a451e3afa208afb8bb`

The shipped GLB is distributed under the same CC BY-NC-SA 4.0 license. This
license permits sharing and adaptation with attribution, but not commercial
use, and requires adaptations to remain under the same license. It applies to
this coach asset, not to unrelated code or assets in Germany Simulator.

## LDraw geometry attribution

The source Studio file references official LDraw parts. The converted part
geometry used here is licensed under CC BY 4.0; older dual-licensed headers
also offer CC BY 2.0, and this derivative elects the 4.0 grant.

- Official library: https://library.ldraw.org/
- Parts-library policy: https://library.ldraw.org/documentation/policies-and-procedures/parts-library-policies-and-faq
- CC BY 4.0: https://creativecommons.org/licenses/by/4.0/

The 277 resolved official part and primitive files identify these primary
authors:

`[PTadmin]`; Alex Taylor `[anathema]`; Chris Dee `[cwdee]`; Damien Roux
`[Darats]`; Donald Sutter `[technog]`; Gerald Lasser `[GeraldLasser]`; Guy
Vivan `[guyvivan]`; J.C. Tchang `[tchang]`; James Jessiman; Magnus Forsberg
`[MagFors]`; Mark Kennedy `[mkennedy]`; Massimo Maso `[Sirio]`; Max Martin
Richter `[MMR1988]`; Michael Heidemann `[mikeheide]`; Niels Karsdorp
`[nielsk]`; Orion Pobursky `[OrionP]`; Owen Burgoyne `[C3POwen]`; Paul Easter
`[pneaster]`; Philippe Hurbain `[Philo]`; Rene Rechthaler `[Blechtaler]`;
Santeri Piippo `[arezey]`; Steffen `[Steffen]`; Stephan Meisinger `[smr]`;
Steve Bliss `[sbliss]`; Takeshi Takahashi `[RainbowDolphin]`; Tim Gould
`[timgould]`; Tore Eriksson `[Tore_Eriksson]`; Vincent Messenet `[Cheenzo]`;
and Willy Tschager `[Holly-Wood]`.

Their part headers also record edits by: bbroich; Blechtaler; Brickaneer;
BrickCaster; cavehop; Cheenzo; cwdee; Darats; fwcain; GeraldLasser; gregteft;
guyvivan; hafhead; Holly-Wood; izanette; jriley; MagFors; mikeheide;
mkennedy; MMR1988; nielsk; OrionP; Philo; pneaster; PTadmin; RainbowDolphin;
roland; sbliss; Sirio; Steffen; tchang; tcobbs; technog; timgould; and
westrate.

## Modifications

Prepared for this noncommercial game on 2026-09-20:

- extracted the packed Studio model and normalized two Studio-only
  `29085c01-bl.dat` references to the corresponding official
  `29085c01.dat` part;
- converted the packed LDraw model to glTF with `mpd2glb` at commit
  `46992b273144b958cebd29d42706514ac91927b1`;
- removed LDraw edge and conditional-line primitives, retaining triangle
  surfaces;
- flattened and joined the scene, combined solid colors into a tiny embedded
  palette, welded vertices, pruned unused data, and quantized geometry with
  glTF-Transform 4.5.0;
- retained the source's red, white, gray, black, and transparent materials;
  no Deutsche Bahn logo, wordmark, or texture was added; and
- fitted the model at runtime to Germany Simulator's stylized loading gauge.

The conversion tool is not shipped with the game. `mpd2glb` is MIT-licensed:
https://github.com/anteloc/mpd2glb
