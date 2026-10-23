# Gisela Becker adult painted family

This directory is Gisela's durable source authority. `pre-admission-person.json` is the exact Gisela record before adult selection (canonical sorted-content SHA-256 `a56c09705fde7a441804fe73119650c6084d1a6f7edb9037bf8a73db00f48018`). The installer reads that immutable one-person baseline, replaces only Gisela's adult art/motion fields, then merges the result into the current street manifest. It does not derive her person from another actor, the current mutable Gisela entry, or an ignored `output/` artifact. It checks that the other 42 records remain JSON-equivalent.

All source inputs used for her body are in `registered/` and the adjacent owned source PNGs. `registered/source-receipt.json` and the other registration receipts record the exact input hashes. Mouth inputs are in `mouth/`, including the front and profile source fits. Full generation requests and raw output receipts are retained alongside the owned PNGs. Do not copy another actor's limbs, clothing, props, or mouth registrations into this family.

From repository root, with the existing Python/Pillow environment:

```powershell
python assets/sprite-sources/street-speaker-motion/gisela-becker/adult-v1/build-adult.py
python assets/sprite-sources/street-speaker-motion/gisela-becker/adult-v1/build-mouth-candidate.py
python assets/sprite-sources/street-speaker-motion/gisela-becker/adult-v1/install-adult.py
python -m unittest discover -s tests -p test_gisela_integration_candidate.py
```

The first script emits exact selected standing and full source atlases plus `assembly-receipt.json`; its `output/` boards are visual diagnostics only. The second binds lips to those exact selected body hashes. The third uses the existing `tools/build-street-motion-delivery.py` packer, checks its output, and writes only Gisela's selected record into the current root manifest. Source/runtime code remains the existing pipeline. Integrating this family into a newer release branch requires unioning the Gisela record by ID and refreshing release cache tokens there; do not replace that branch's whole manifest with this worktree's copy.
