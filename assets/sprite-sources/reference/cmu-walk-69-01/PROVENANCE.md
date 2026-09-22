# CMU walking reference provenance

This folder is an external, reference-only movement authority. It is not loaded
by the game runtime.

- Database: Carnegie Mellon University Graphics Lab Motion Capture Database
- Subject/trial: 69/01, “walk forward”
- Official database: https://mocap.cs.cmu.edu/
- Official trial listing: https://mocap.cs.cmu.edu/search.php?subjectnumber=69
- BVH conversion: https://github.com/una-dinosauria/cmu-mocap
- Pinned conversion commit: `09a07f54f3bbb58797325f009282d0b2048a2871`
- Local BVH SHA-256: `064de16c17a154c88b73eadecd4614e59d04ef3f8460d58785e20ceb9f4b807b`

The converter documents that it inserted one T-pose as frame zero while
retaining the original captured motion frames. The extractor therefore excludes
frame zero. CMU also notes that hand and toe data can be noisy. Fingers remain
excluded. Toe-base positions are used only after the same periodic low-pass fit
as the major joints, and only to define the ankle-to-toe foot axis; no raw toe
sample is allowed to drive a rendered frame directly.

The database permits use of the data in research and commercial projects but
does not permit resale of the data itself. Requested acknowledgment:

> The data used in this project was obtained from mocap.cs.cmu.edu. The database
> was created with funding from NSF EIA-0196217.

`tools/build-cmu-walk-reference.py` reconstructs the BVH joints, detects a
complete same-foot gait interval, projects the capture into a travel/up side
plane, fits each path to a three-harmonic periodic curve, and averages paired
limbs at a half-cycle offset. It emits the complete left-forward → right-forward
→ left-forward cycle as 20 playable poses, then appends point zero as exact
inspection point 21. `walk-cycle-21.json` is the machine-readable authority and
`walk-cycle-21.png` is its human-review contact sheet.
