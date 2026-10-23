# Hannelore adult source rebuild

This actor-specific authoring source uses the existing street character exporter and motion delivery builder. The immutable raw inputs are the selected Hannelore front (`a8a7ed6d…`), four-cardinal sheet (`e2367534…`), diagonal sheet (`98d95a26…`), and her own older `delivery-v1/mouths-v1.json` solely for normalized lip-opening contour. The exact diagonal request and reference roles are in `diagonal-generation-request.json`. `pre-admission-person.json` is only Hannelore's old public record from `7e6b069`; it allows a later rebuild after the live manifest contains the new 2.33 figure. It is not a second runtime registry.

Run these from the repository root with Pillow, NumPy and SciPy available. Each generated output directory must be absent before its first run; choose a new diagnostic directory for a repeat. The steps write intermediate working paint under ignored `output/street-redesign/hannelore-end-to-end/`, while the eight registered neutral PNGs and `registration.json` are durable actor sources.

```powershell
$actor = 'assets/sprite-sources/resident-motion/stadt-hannelore-sparkasse/adult-v1'
$work = 'output/street-redesign/hannelore-end-to-end'
python -B "$actor/prepare-neutrals.py"
python -B "$actor/build-family-source.py"
python -B "$actor/fit-adult-mouths.py"
python -B "$actor/prepare-family-mouths.py"
$body = (Get-FileHash "$work/full-working/body-index.json" -Algorithm SHA256).Hash.ToLower()
$mouths = (Get-FileHash "$work/family-mouths/mouths-working.json" -Algorithm SHA256).Hash.ToLower()
python -B "$actor/build-candidate.py" --body-index "$work/full-working/body-index.json" --body-index-sha $body --mouths "$work/family-mouths/mouths-working.json" --mouths-sha $mouths --outdir "$work/candidate-v2" --stride-distance 5.825
```

For **first admission only**, `install-candidate.py` requires the existing old 1.6 Hannelore entry and an absent `delivery-v2/` folder. It copies the four selected files and changes only Hannelore's manifest entry. The sole integrator then packs the existing delivery and adds its hash-bound pointer:

```powershell
python -B "$actor/install-candidate.py"
python -B tools/build-street-motion-delivery.py --manifest assets/characters/street/manifest.json --character stadt-hannelore-sparkasse --outdir assets/characters/residents/stadt-hannelore-sparkasse/delivery-v2/delivery
python -c 'import json,hashlib,pathlib; p=pathlib.Path("assets/characters/street/manifest.json"); d=json.loads(p.read_text()); q=pathlib.Path("assets/characters/residents/stadt-hannelore-sparkasse/delivery-v2/delivery/motion-delivery.json"); d["characters"]["stadt-hannelore-sparkasse"]["motionDelivery"]={"file":"./"+q.as_posix(),"sha256":hashlib.sha256(q.read_bytes()).hexdigest()}; p.write_text(json.dumps(d,separators=(",",":"),ensure_ascii=False)+chr(10))'
python -B tools/build-street-motion-delivery.py --manifest assets/characters/street/manifest.json --character stadt-hannelore-sparkasse --outdir assets/characters/residents/stadt-hannelore-sparkasse/delivery-v2/delivery --check
```

After admission, rerun the first block with a fresh ignored output directory name, e.g. `candidate-rebuild`, and compare its `standing.webp`, both source WebPs, `mouths-v1.json`, and `person.json` byte-for-byte to the selected files and prior candidate. Do not rerun `install-candidate.py` against the selected manifest. The pre-admission actor pin means `build-candidate.py` no longer depends on the mutable full cast manifest. The successor test rebuild in `candidate-v3/` reproduced all four selected file hashes exactly: standing `3de56a9d…`, desktop `c7a2bac1…`, mobile `d16a7b42…`, mouths `2e63e25…`; its `person.json` is also byte-identical.

The integration Physics review found that the original LEFT field used the RIGHT x sign. The selected successor reverses LEFT x transport while keeping lift, source neutral, body registration and capabilities intact. `tests/test_hannelore_gait_direction.py` covers both near/far planted intervals in both headings and exact neutral preservation. The first incorrect source/assets and review are preserved privately under `output/hannelore-release/before-left-fix/` and `review-physics/`; `candidate-left-v1/` is the corrected rebuild. Its selected standing remains `3de56a9d…`; desktop/mobile are `7ad747cc…` / `af7114db…`, with mouth packet `5465325d…`. The earlier hashes above document the historical reproducibility check, not the corrected gait.

The family is a mild, source-supported shuffle with full existing clip/stop/turn/action registration. Native rear-right lip is explicitly null because the adult painting has no shader-visible opening at the 80×100 client export. Natural interaction, physical Android and audible listening require separate evidence.
