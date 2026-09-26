# Kurt Georg Kiesinger — Blender statue and portrait fit

Authored in Blender 5.2.1 LTS through `tools/sculpt-kiesinger.py`,
2026-09-26. The body, civilian suit, standing pose, bent arm, folded dossier,
ears, hair, and rear cranium are project-authored geometry. The face uses
estimated landmarks from the credited archival photographs and reused
MediaPipe canonical face connectivity. This is a stylized portrait
interpretation, not a scan or an exact reconstruction. No photograph pixels,
texture maps, insignia, or animation are included.

## Files and runtime contract

- `kiesinger-statue.blend`: editable sculpt collection, optimized export
  collection, and studio inspection camera/lights. To edit the full sculpt,
  unhide **Kiesinger — editable original sculpture** and hide **GAME EXPORT**.
  The studio plinth and lighting are excluded from the GLB.
- `kiesinger-statue.glb`: glTF 2.0, four shared bronze materials/four draw
  calls, no textures, no skeleton or animation, no decoder extension or
  external file requirement. 83,645 triangles, 1,518,052 bytes.
- `portrait-landmarks.json`: offline authoring data containing the 468 fitted
  face vertices, reused canonical polygon indices, source-photo hashes,
  MediaPipe version, and canonical source hash. The browser never loads it.
- `LICENSE-MEDIAPIPE.txt`: full upstream MediaPipe license and bundled notice,
  retained alongside the derived geometry.
- The exported figure is six units high, Y-up, facing +Z, with the origin at
  shoe level. The existing pedestal owns placement and collision. Both game
  entry points use this one asset, with the procedural figure as fallback.
- Desktop and mobile use the same bounded mesh. The `.blend` is an authoring
  deliverable and is never fetched by the browser.

## Geometry sources and modifications

`tools/fit-kiesinger-portrait.py` runs MediaPipe Face Landmarker offline and
uses the first 468 landmarks. Rigid alignment removes estimated camera pose;
normalization and partial depth symmetry reduce photographic pose noise.
The base fit blends the KAS portrait at 75% with the Anefo cabinet view at
25%. Below Blender z=5.54 it instead uses 95% KAS and 5% cabinet to retain a
neutral lower-face expression. Depth blends 80% of that result with 20% of
the Anefo 919-8423 crop; the crop has zero weight in the base position blend.
Blender closes and subdivides the fitted facial surface, adds sculpted age
lines and eyes, constructs the rest of the head/body, and simplifies the
export. These are estimated proportions rather than measured anatomy.

### Photographs used in the landmark fit

- [KAS-Kiesinger, Kurt Georg-Bild-4166-1, 1967](https://commons.wikimedia.org/wiki/File:KAS-Kiesinger,_Kurt_Georg-Bild-4166-1.jpg):
  author listed as CDU; Konrad-Adenauer-Stiftung, Archiv für
  Christlich-Demokratische Politik, ACDP 10-004 : 302;
  [CC BY-SA 3.0 DE](https://creativecommons.org/licenses/by-sa/3.0/de/).
  Local input `kiesinger-1967-kas.jpg`. Used for face landmarks; printed
  poster text is excluded.
- [Kiesinger, Höcherl, Wehner and Brandt, 1 December 1966](https://commons.wikimedia.org/wiki/File:V.l.n.r._Kurt_Georg_Kiesinger,_Hochler_(CSU)_Wehner_en_Willy_Brandt,_Bestanddeelnr_919-8404.jpg):
  unknown photographer / Anefo; Nationaal Archief, item 919-8404, Bonn;
  [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
  Local input `kiesinger-cabinet-1966.jpg`, cropped to pixel rectangle
  `(775, 525, 1330, 1225)` before landmark estimation.
- [Kurt Georg Kiesinger crop, 1 December 1966](https://commons.wikimedia.org/wiki/File:Kurt_Georg_Kiesinger.jpg):
  unknown photographer / Anefo; Nationaal Archief, item 919-8423, Bonn;
  Commons crop uploaded by ThePhotoEnhancer;
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
  Local input `kiesinger-1966-front.jpg` is actually a three-quarter view,
  used for the depth contribution only. The
  [underlying full photograph](https://commons.wikimedia.org/wiki/File:Willy_Brandt_en_Kurt_Georg_Kiesinger,_Bestanddeelnr_919-8423.jpg)
  is CC0; this build used the credited CC BY-SA crop.

### MediaPipe canonical face

Source: Google/MediaPipe contributors,
[`canonical_face_model.obj`](https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/modules/face_geometry/data/canonical_face_model.obj),
under [Apache 2.0](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE).
The original connectivity is reused; canonical coordinates provide the pose
alignment and mirrored-vertex pairing reference. The exported facial
positions are replaced by the photo fit and modified further in Blender.
This paragraph is the modification notice for the derived face data and
model; they are not an unmodified MediaPipe mesh.

Canonical file SHA-256:
`8bac80443397e113f41a8b565ea72c59390bc031d9defab289dba7bc0c54e618`.
The full license copy is `LICENSE-MEDIAPIPE.txt`.

### Visual inspection only

These photographs were used to compare appearance, not for landmark fitting,
averaged facial positions, or texture maps:

- [Official portrait, Bonn, 23 February 1967](https://www.hdg.de/lemo/bestand/objekt/foto-kurt-georg-kiesinger.html):
  Renate Patzek; REGIERUNGonline / B 145 Bild-00003787. The page states no
  reuse license. No pixels or fitted shape from this image are included.
- [Ludwigshafen profile, 11 April 1969](https://commons.wikimedia.org/wiki/File:Bundesarchiv_B_145_Bild-F028914-0011,_Ludwigshafen,_CDU-Kongress,_Kurt_Georg_Kiesinger.jpg):
  Bundesarchiv, B 145 Bild-F028914-0011 / Detlef Gräfingholt;
  [CC BY-SA 3.0 DE](https://creativecommons.org/licenses/by-sa/3.0/de/).
- [Oberhausen speech, 11 February 1967](https://commons.wikimedia.org/wiki/File:Bundesarchiv_B_145_Bild-F024017-0001,_Oberhausen,_CDU-Parteitag_Rheinland,_Kiesinger.jpg):
  Bundesarchiv, B 145 Bild-F024017-0001 / Jens Gathmann;
  [CC BY-SA 3.0 DE](https://creativecommons.org/licenses/by-sa/3.0/de/).
- [Cabinet standing photograph, 1 December 1966](https://commons.wikimedia.org/wiki/File:Het_nieuwe_kabinet._Op_de_voorste_rij_in_het_midden_Heinrich_L%C3%BCbke,_links_van_he,_Bestanddeelnr_919-8406.jpg):
  unknown photographer / Anefo, Nationaal Archief 919-8406, CC0.
  Used to compare adult proportions and the fall of the civilian suit.
- [Inspecting the guard of honour, 1 December 1966](https://commons.wikimedia.org/wiki/File:Bondskanselier_Kurt_Georg_Kiesinger_inspecteert_de_erewacht,_Bestanddeelnr_919-8413.jpg):
  unknown photographer / Anefo, Nationaal Archief 919-8413, CC0.
  Used to compare body silhouette, jacket length, trousers, and shoes.

Reference downloads and detector overlays remain in ignored
`output/kiesinger-references/`, outside the shipped asset tree. Its
`REFERENCES.md` records additional clothing/body inspection photographs.

## Model license

The project's authored adaptation in `kiesinger-statue.blend`,
`kiesinger-statue.glb`, and `portrait-landmarks.json` is distributed under
[CC BY-SA 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).
The photo-derived geometry is treated as an adaptation with attribution and
ShareAlike preserved. The source photographs retain their stated original
licenses and notices. This asset license does not relicense the game's code
or other independently licensed assets.

The KAS source's
[CC BY-SA 3.0 DE §4b](https://creativecommons.org/licenses/by-sa/3.0/de/legalcode)
permits adaptations under later versions with the same license elements;
the [Creative Commons FAQ](https://creativecommons.org/faq/)
explains the later-version adapter license and continued source-license
obligations. The reused MediaPipe material remains available under Apache
2.0, with its full upstream license and notices retained.
[Apache 2.0 §4](https://www.apache.org/licenses/LICENSE-2.0.html)
permits different terms for an adapted work as a whole while requiring the
upstream license, notices, and change indications. Apache is not being
claimed as a CC-designated BY-SA compatible license. The archives,
photographers, CDU, and MediaPipe contributors do not endorse this game.

## Rebuild and inspect

The verified Windows authoring environment is Python 3.14.7 with
`mediapipe==1.0.1`, `numpy==2.5.3`, `scipy==1.18.1`, and `Pillow==12.3.0`,
at `output/kiesinger-landmark-env/Scripts/python.exe`. The detector is an
offline authoring tool; no Python, MediaPipe package, or ML model ships in
the browser runtime.

Place the three credited image inputs, `canonical_face_model.obj`, and
`face_landmarker.task` under `output/kiesinger-references/`. Use the linked
canonical source above and Google's
[Face Landmarker model](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task).
The `latest` download is mutable: this build's task file SHA-256 is
`64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`.
Photo hashes and the canonical hash are also recorded in the landmark JSON.
To recreate the authoring environment, use Python 3.14.7 to create that venv
and install the pinned packages:

```text
python -m venv output/kiesinger-landmark-env
output/kiesinger-landmark-env/Scripts/python.exe -m pip install mediapipe==1.0.1 numpy==2.5.3 scipy==1.18.1 Pillow==12.3.0
```

From the repository root, fit the face, then use the installed Blender
executable and the pinned glTF optimization CLI:

```text
output/kiesinger-landmark-env/Scripts/python.exe tools/fit-kiesinger-portrait.py
blender --background --python-exit-code 1 --python tools/sculpt-kiesinger.py
npx --yes --package @gltf-transform/cli@4.5.0 gltf-transform dedup assets/models/kiesinger/kiesinger-statue.glb output/kiesinger-sculpt/kiesinger-dedup.glb
npx --yes --package @gltf-transform/cli@4.5.0 gltf-transform prune output/kiesinger-sculpt/kiesinger-dedup.glb assets/models/kiesinger/kiesinger-statue.glb
node tests/kiesinger-model.test.mjs
```

The Blender script creates studio renders under ignored
`output/kiesinger-sculpt/`. Update these hashes after an intentional rebuild;
the asset test checks actual vertex bounds, indices, runtime budgets, and the
GLB hash. Review the front, three-quarter, and profile portraits, the complete
body render, and the real desktop/mobile game views.

SHA-256:

- GLB: `0c5f989f75dc62c0d8a5673eb93359059588d52fffd6407b2a51ab3dfa8c2036`
- Blender: `1a6d618c7e0f8f492b4363c1a6ecd5938235b4ba3a4adecb821fbe9f57c61158`
