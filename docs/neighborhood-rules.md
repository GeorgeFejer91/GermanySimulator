# JWD neighborhood dialogue: rules and sources

Checked against the official sources below on **2026-10-14**. These notes support
the authored German/Denglisch and paired English lines in
[`neighbor-story.js`](../neighbor-story.js). The residential layout is invented;
no real street-register classification or private agreement is assigned to it.

The jokes concern the residents converting limited responsibilities into social
control. Statutory facts and their own wishes remain distinguishable in their
speech: Schwabingen calls her rota private, Heiko admits aesthetic displeasure
does not establish a cutting right, and Inga admits her preferred blind height
and volunteer list are personal expectations. Source notes stay out of the
in-world caption stream.

## Verified factual core

| Topic and dialogue IDs | Applicable rule | Official source |
| --- | --- | --- |
| Street cleaning: `schwabingen-street-jurisdiction` | Berlin assigns ordinary cleaning of A/B streets to the BSR; on C streets adjoining owners clean their frontage to the road midpoint. This does not make every resident subject to a universal weekly sweeping rota. | [Berlin Senate: Straßenreinigung](https://www.berlin.de/sen/uvk/umwelt/sauberes-berlin/strassenreinigung/); [Berlin StrReinG § 4](https://gesetze.berlin.de/bsbe/?docId=jlr-NNLBE000047E3NN00000000026&query=JURISLINK%3A%22StrReinG+BE+%C2%A7+4%22) |
| Winter service: `heiko-winter-hours`, `heiko-winter-grit`, `heiko-audit-weather` | The Berlin sidewalk duty generally belongs to adjoining owners and specified holders of property rights. Snow is cleared promptly after snowfall ends and repeatedly during continuing snowfall; ice is addressed promptly. Snowfall continuing past 20:00, or snow/ice arising afterwards, triggers completion by 07:00 next day, 09:00 on Sundays/public holidays. Clearing width depends on foot traffic: minimum 1 m, with larger specified categories. Sidewalk deicers are prohibited; abrasive grit is used. Delegating execution does not remove the owner's duty to check it. | [Service Berlin: Winterdienst auf Gehwegen](https://service.berlin.de/dienstleistung/326714/); [Charlottenburg-Wilmersdorf: Straßenreinigungs- und Winterdienstpflicht](https://www.berlin.de/ba-charlottenburg-wilmersdorf/verwaltung/aemter/ordnung/ordnung/artikel.1374070.php) |
| Branches over the boundary: `heiko-overhang-rule`, `heiko-review-branch` | Federal BGB § 910 permits an affected owner to remove encroaching branches only where they impair use of the property, after a reasonable deadline for removal has passed without action. Roots also require impaired use; the provision does not give roots the same express deadline condition. Nature conservation and local tree protection are separate constraints, not erased by a civil self-help right. No universal deadline, hedge height, or permission to enter the neighbor's land is asserted. | [BGB § 910](https://www.gesetze-im-internet.de/bgb/__910.html) (verified in the [official complete BGB text, § 910](https://www.gesetze-im-internet.de/bgb/BJNR001950896.html)); [BGH: overhang judgment, nature-conservation reservation](https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Art=pm&Blank=1&Datum=2021-6&Gericht=bgh&file=dokument.pdf&linked=urt&nr=119869); [Berlin: Baumschutz auf privaten Grundstücken](https://www.berlin.de/umwelt/themen/natur-pflanzen-artenschutz/artikel.163584.php) |
| Weeds on paving: `schwabingen-weeds-law`, `schwabingen-weeds-method` | Federal PflSchG § 12(2) prohibits plant protection products on paved outdoor areas and other outdoor areas without agricultural, forestry, or horticultural use. An authority may grant limited exemptions. A product's garden authorization is not a pavement exemption. The character uses a manual joint scraper; no vinegar/salt recipe or blanket garden-eradication duty is offered. | [PflSchG § 12](https://www.gesetze-im-internet.de/pflschg_2012/__12.html) |
| Hedge cutting and birds: `schwabingen-hedge-season`, `schwabingen-bird-listen` | Federal BNatSchG § 39(5) generally prohibits drastic cutting/removal of hedges from 1 March through 30 September; gentle shaping/maintenance remains possible. Statutory exceptions and other protections still apply. Protected nests/resting sites are not free to destroy on 1 October; § 44 applies independently of that seasonal hedge restriction. The story speaks specifically about hedges rather than incorrectly extending the same seasonal rule to every garden tree. | [BNatSchG § 39](https://www.gesetze-im-internet.de/bnatschg_2009/__39.html); [BNatSchG § 44](https://www.gesetze-im-internet.de/bnatschg_2009/__44.html); [Berlin Pankow: Freilandartenschutz](https://www.berlin.de/ba-pankow/politik-und-verwaltung/aemter/umwelt-und-naturschutzamt/naturschutz/artikel.1693829.php) |
| Car care: `inga-electric-water`, `heiko-paint-follow` | Berlin's water authority explains that vehicle wash water containing cleaning agents must not reach surface water or groundwater, directly or through a drain. Whether a washing location is lawful depends on drainage and circumstances; the story does not invent a Germany-wide ban on touching or washing a car. Their displayed cloth-polishing action has no runoff or hose. | [Berlin water authority: Autowaschen in Berlin](https://www.berlin.de/umwelt/themen/wasser/artikel.157532.php) |

The winter lines describe the ordinary sidewalk rule. They do not infer a
permanent permission from temporary weather-related orders. They also avoid
assigning an actual Berlin street category to the game's compressed lane.
Schwabingen's manual work and examination of her hedge are distinct from a
mandated destructive cut; wildlife protection remains part of her own speech.

Inga's privacy questions, cake allocation, and invented consent are character
behavior, not legal obligations. Her family remarks do not create a mechanic
requiring a child to meet parental productivity targets. Theodore has his own
agenda: lead the adults to the paving stones and play lava islands with the
fallen gnome as referee.

## Script and staging contract

`window.JwdStory.tours` contains `swabian`, `parent`, and `watcher`. Index zero is
each adult's required introduction; the remaining three entries are two-stop
repeat tours. Every tour, stop, and speech line has a stable ID. Every utterance
has exact `de` and `en` fields and either `speaker: 'guide'` or `speaker: 'child'`.
Speech remains the source German/Denglisch; English is the matching subtitle.
`walkLines` carries at most one short utterance for a travel leg. It must not
overlap the arrival conversation or transfer speech ownership to the leader.

| Introduction | Stop sequence and relevant movement |
| --- | --- |
| Frau Schwabingen | Sweep `(780,4640)` → street responsibility `(850,4540)` → inspect paved joint `(780,4590)` → inspect hedge from paving `(780,4708)`. |
| Heiko Maaslos | Cloth polish `(1380,4660)` → winter sidewalk `(1350,4540)` → point toward the player's east hedge `(1090,4670)` → call at Maaslos door `(1400,4490)` → follow Theodore to play `(1090,4710)`. |
| Inga Maaslos | Cloth care by EV `(1552,4620)` → point at player's shutters `(1090,4490)` → allocate voluntary chores by garden `(1090,4610)` → discuss family at Maaslos approach `(1400,4525)`. |

`point` is the actor's ground destination. `lookAt` is the subject of a gesture,
not another destination. The paths and props in `jwd-gardens.js` remain the
geometry authority. Routes cross between paved spines through `y=4540`; actors
on the same spine can travel directly. Stops are inset by at least the adult
13-unit body radius and avoid other residents' work stations. These authored
positions do not establish successful live collision routing or camera framing;
the integrated production scene must verify both.

At `heiko-theodore-door`, the father's call cues Theodore's emergence through
the real Maaslos doorway. The child must arrive before his reply. At the next
stop, `leader: 'child'` transfers route leadership to Theodore while retaining
each line's own speaker. Heiko's final credit depends on the child's arrival,
owned lines, and completed child-led leg. The child's smaller sprite is not a
fourth adult introduction. Heiko's third repeat tour recalls the child and
replays a different two-stop game exchange.

The runtime must wait for the player to follow rather than complete stops at a
distance. Guide travel, arrival/turning, the authored gesture, audible or readable
speech completion, and final acknowledgement are separate events. Interrupted
or stale completion cannot grant introduction credit. Only `game.js` owns
mission progress; the story and renderer do not award it.
