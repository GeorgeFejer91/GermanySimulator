# Mission sausage

`sausage.glb` adapts **Saucisse** by **__Maros__(oooFFFFEDDMODELS)**
([pierre.marcos.19](https://sketchfab.com/pierre.marcos.19)), published 2020-04-19.

- Original model: https://sketchfab.com/3d-models/saucisse-2583fa564f0f46da8be70958fdf057dd
- License: **Creative Commons Attribution-NonCommercial 4.0 International** — https://creativecommons.org/licenses/by-nc/4.0/
- Downloaded from the licensed [Objaverse distribution](https://huggingface.co/datasets/allenai/objaverse): `glbs/000-052/2583fa564f0f46da8be70958fdf057dd.glb`.
- Source SHA-256: `b0927613b574e17533ca185de510bdd5f427e94f0f96133702e0fb6ee5d35f54`.
- Runtime SHA-256: `1bccb83c57028e917119feda9f534a2d6a85b358e68d1fb4961d8c49396de469`.
- Changes: removed import hierarchy/transforms, centered and uniformly scaled the original curve to 1.75 world units along +Z; reduced the three PBR maps to 512 × 512 JPEG; disabled unnecessary double-sided rendering. The mustard arrowhead is original runtime geometry.
- Runtime cost: 274,344 bytes; 3,640 triangles; one material; three 512 × 512 textures (3 MiB decoded RGBA, about 4 MiB including mipmaps). One shared desktop/mobile model, prepared through the existing two-job queue before Start. One retained source and instance for the city renderer's lifetime; no separate animation loop or cache.

Use only in noncommercial distributions; preserve this attribution and license
notice with any modified version. Replace the model before a commercial release.
The source represents a cooked sausage; the game uses it as its Bratwurst compass.

Rebuild with the existing Pillow environment:
`python tools/build-mission-sausage.py <original.glb>`.
