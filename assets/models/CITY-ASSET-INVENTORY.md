# City asset inventory

This inventory describes the canonical root game in `game.js`, with visual construction in `world3d.js`. Counts are placed instances, not unique model files. The replacement column records the city-art integration map; it is not a claim that browser or performance checks have passed. Gameplay coordinates, building entrances, collision footprints, pickups and interactions remain owned by the existing simulation.

The original Blender kit lives in [`city-kit/`](./city-kit/). The Reichstag landmark has its own source and provenance under [`bundestag/`](./bundestag/). Editable Blender files and authoring scripts are production sources; the browser loads only the local GLBs. These are original architectural interpretations, not scans or exact surveyed replicas.

## Easiest useful assets

| Priority / effort | Asset | Canonical count before replacement | Previous appearance | Replacement approach |
| --- | --- | ---: | --- | --- |
| 1 / very easy | Pfand bottles | 15 | Featureless green cylinders | `pfand-bottle.glb`: shaped body, shoulder, neck and cap; keep pickup behavior. |
| 1 / easy | Pfand machines | 2 | Boxes with labels | `pfand-machine.glb`: cabinet, intake, display and receipt area. |
| 1 / easy | Street lamps | 19 | Bare poles and short crossbars | `streetlamp.glb`: recognizable pole, arm and luminaire. Correct city-to-world placement when integrating. |
| 1 / easy | Garden sheds | 10 | Boxes with four-sided cone roofs | `garden-shed.glb`: pitched roof, framed openings and timber detail; four sheds in the western garden and six in the police garden. |
| 1 / easy | Garden gnomes | 9 | Cones and a sphere | `garden-gnome.glb`: boots, clothing, beard, face and hat. |
| 1 / easy | Deciduous trees | 24 original street trees; 4 separately added park trees | Cylinder trunks and single faceted crowns | `deciduous-tree.glb`: branching trunk and grouped foliage. Keep the canonical trunk centers and road clearance. |
| 2 / easy | Coffee machine | 1 | Labeled box | `coffee-machine.glb`: recognizable vending cabinet and dispensing bay. |
| 2 / easy | Public fax kiosks | 2 | Labeled boxes | `fax-kiosk.glb`: kiosk enclosure and fax details. |
| 2 / easy | Bin and street furniture | 1 norming bin; no existing benches, bollards or bicycle racks | Basic bin; other furniture absent | `litter-bin.glb`, `bench.glb`, `bollard.glb`, `bicycle-rack.glb`; add furniture on selected entrance aprons. Preserve the norming bin's distinct mission feedback if its mesh changes. |
| 2 / moderate | Ordinary buildings | 24, excluding the Reichstag and power plants | Six Kenney models and eighteen procedural box buildings | Four original building families, mapped below, with recessed openings, roof detail and more credible facades. |
| 3 / more involved | Reichstag / Bundestag | 1 | Compact original geometric landmark | Replace with an original Blender landmark emphasizing the historic wings, four corner towers, entrance portico, pediment, steps and steel-and-glass dome. |

Repeated discrete objects give the best return: one authored bottle, tree or gnome improves many placements. Building families give the next largest improvement without requiring a different mesh for every fictional office.

## Building map

The canonical game contains **27 buildings: 24 ordinary institutions and shops, one Reichstag landmark, and two power-plant sites**. Before this replacement, seven non-plant buildings loaded GLBs: six Kenney commercial models plus the original Bundestag. The other eighteen used procedural boxes.

| Model | Instances | Building IDs |
| --- | ---: | --- |
| `city-kit/municipal-office.glb` | 13 | `buergeramt`, `auslaender`, `finanzamt`, `krankenkasse`, `polizei`, `faxamt`, `sparkasse`, `ordnungsamt`, `formulararchiv`, `terminamt`, `querungsamt`, `fundbuero`, `laermamt` |
| `city-kit/berlin-block.glb` | 4 | `hausverwaltung`, `mietpruefung`, `rathaus`, `stadtbild` |
| `city-kit/brick-utility.glb` | 5 | `post`, `tuev`, `baumarkt`, `faxlager`, `reinigung` |
| `city-kit/neighborhood-shop.glb` | 2 | `spaeti`, `imbiss` |
| `bundestag/bundestag.glb` | 1 | `bundestag` |
| Existing power-plant assets | 2 sites | `akw`, `kohlewerk` |

The office names and satirical signs remain game-rendered. The shared families represent believable building types; only the Reichstag is intended to resemble a particular real building. Preserve its southeast parcel and entrance rather than importing a new map layout.

## Streets, grounds and small props

| Category | Canonical inventory | Treatment |
| --- | --- | --- |
| Roads | 9 rectangles: 3 horizontal, 6 vertical | Keep code-native semantic surfaces. Asphalt detail, pavement seams, kerbs and drains improve the streets without exporting an entire road network from Blender. |
| Zebra crossings | 39 | Keep existing crossing footprints and four-stripe layout. |
| Pedestrian signals | 78, with 39 attached crossing signs | Retain existing signal meshes and live red/green state. These small meshes are separate from the authored replacement kit. |
| Garden fence | One police-garden perimeter, originally approximately 40 isolated posts | Code-native perimeter geometry; distinct from authored sheds and gnomes. |
| Norming objects | One bin, a pair of chairs, one hedge | Preserve the three mission objects and their fixed/unfixed feedback. |
| Existing bicycles | 2 | Retain procedural bicycle meshes. A new bicycle rack is separate street furniture, not a replacement bicycle. |
| General signs | 8: lawn 2, refuse 1, train display 1, construction 2, police garden 2 | Retain small signage and labels. The `muell` prop is currently a sign; it is not the mission bin. |
| Desktop/mobile fax billboards | 4 | Retain the accepted artwork, generated mobile representation and labels. |
| Public fax devices | 2 | Use the detailed fax kiosk at a smaller scale while retaining the existing `faxgeraet` interactions. |
| Queue-ticket dispenser and binder | 1 each | Retain the existing small props. |
| Food pickups | 11 ordinary food pickups, plus 9 sausage-collection pickups | Retain their established appearances and behavior; separate from the 15 Pfand bottles. |
| New civic furniture | 14 objects in four paved side forecourts | Four benches, four litter bins, four bollards and two bicycle racks are additions. Their placements keep entrances and walkways clear. |

The original `props` array contained **32 objects**: nine gnomes, two lawn signs, one refuse sign, one ticket dispenser, one binder, one train display, two construction signs, two bicycles, one coffee machine, two Pfand machines, four billboards, two fax machines, two fax kiosks and two police-garden signs. The fourteen new furniture objects bring that array to **46**. Trees, lamps, sheds, pickups and norming objects are counted separately.

### Added furniture placements

These are raw city coordinates; the existing `offsetWorldPoint` mapping adds the 560-unit rail gutter once. The furniture has no interaction IDs or new rules. It uses the existing generic prop collision radius.

| Prop key | Count | Raw city positions `(x, y)` | Declared width / height |
| --- | ---: | --- | --- |
| `bench` | 4 | `(3500, 540)`, `(3490, 1500)`, `(3575, 2550)`, `(8855, 3650)` | 90 / 55 |
| `litterbin` | 4 | `(3600, 540)`, `(3600, 1500)`, `(3575, 2440)`, `(8875, 3530)` | 30 / 48 |
| `bollard` | 4 | `(3395, 540)`, `(3395, 1500)`, `(3575, 2680)`, `(8810, 3770)` | 18 / 44 |
| `bicyclerack` | 2 | `(3500, 360)`, `(3500, 1330)` | 85 / 45 |

The first three groups occupy the gaps between Bundesfaxamt/TÜV, Sparkasse/Post and Rathaus/Baumarkt. The fourth occupies the paved ground east of the Bundestag. A geometry check against the canonical arrays used the larger of each object's generic collision radius and half its declared width. Minimum remaining edge clearances were 35 world units to buildings, 28 to the outside of the 72-unit sidewalk strips, 335.5 to entrance walkways, 111.8 to grass, 129.5 to existing props, 89 to tree collision circles, and 40 between new furniture. All new objects stayed at least 167.5 units from the featured-character route centerlines after subtracting their own conservative radius. These checks establish placement clearance; rendered model fit still requires browser inspection.

## Existing assets retained

- The two power plants already combine five local model sources with procedural halls, gates, smoke and conveyor animation. Preserve those established landmark behaviors.
- The twelve perimeter trains contain 84 rendered cars and already use local rolling-stock GLBs. They are outside this static city-prop replacement.
- Civilian traffic and police response keep their existing vehicle assets and procedural fallbacks. The canonical civilian population contains 24 cars; police response counts depend on wanted state.
- The four fax billboards keep their established desktop/mobile art policy.
- The Kiesinger sculpture and its pedestal retain their separate authoring, provenance and gameplay contracts. Concurrent sculpture edits are not part of this inventory's city-kit scope.
- Character sprites, food art, audio and UI artwork are outside this static environment replacement.

## Placement and verification notes

- Canonical city coordinates gain the 560-unit rail gutter exactly once in `game.js`. `world3d.js` uses 0.02 rendered units per world unit. The original renderer-local lamp list lacked that gutter offset.
- Trees are solid canonical world objects with a 38-unit trunk collision radius and at least 48 units of clearance from roads. Preserve the original 24 street-tree centers plus the four separately defined Görlitzer Park trees, and inspect the new crown widths.
- Model geometry must have finite bounds, a grounded pivot, Y-up orientation and a predictable front. Keep procedural representations when an individual GLB fails to load.
- Building materials participate in camera occlusion fading. Preserve authored glass opacity while applying that fade; a transparent dome must not become opaque when the building is unfaded.
- `3d.html` is a diagnostic subset, not the inventory authority: at audit it contained 18 buildings, three billboard props and a slightly different tree entry. Both pages use the same renderer and root assets. The canonical `game.js` counts above should guide asset coverage.
- Check local GLB requests, desktop and mobile screenshots, missing-model fallback, entrance access and console output before claiming acceptance. Run the existing building, tree and crossing checks together with JavaScript syntax checks. This inventory records scope and counts, not test results.
