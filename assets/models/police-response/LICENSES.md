# Police-response model provenance

Downloaded 2026-09-20. Both source pages identify their models as Public Domain / CC0 1.0. CC0 permits copying, modification, and redistribution without attribution; this record is retained for provenance. Inclusion does not imply endorsement by the creators or by any real police authority.

## `police-car.glb`

- Work: **Police Car**
- Creator: Quaternius
- Source: https://poly.pizza/m/BwwnUrWGmV
- Upstream origin/license corroboration: https://quaternius.com/packs/cars.html
- License: CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/
- Runtime treatment: the previously material-only body was UV-unwrapped with xatlas, then its exact UV template was used as an OpenAI ImageGen edit target for a fictional German-style silver/blue livery. The selected texture was reduced to a 512×512, 64-color local PNG, embedded in the GLB, and the geometry was quantized with glTF Transform 4.2.1. The model has no manufacturer badge, coat of arms, or real police insignia. `police-car-livery.png` is retained beside the GLB as the editable texture authority; `tools/police_car_texture.py` reproduces the unwrap/embed steps.
- Model SHA-256: `E3659CCA0B41F55D65526C5495BC5C8D23CE1C382DD401234371390B579F80E5`
- Livery texture SHA-256: `54B6C2235F23EA071425DC35691150997E4695A06B6FEAE5514EF10CBF8C8C11`

## `black-helicopter.glb`

- Work: **Helicopter**
- Creator: kazuma
- Source: https://poly.pizza/m/EQJ2MECUbx
- License: CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/
- Runtime treatment: optimized losslessly with glTF Transform 4.2.1 (`dedup`, then `prune`), recolored black, and supplemented with procedural rotor/searchlight geometry.
- SHA-256: `FC2285DE51397B639C3C974318FDD4ECF8EC295275BB216FEBC6BBC4788E0832`

Total shipped model-binary size: 248,684 bytes; including the 40,820-byte editable livery source, the response asset family is 289,504 bytes. Canvas and model-load failures keep procedural police-car and helicopter fallbacks.
