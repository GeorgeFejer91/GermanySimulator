# Dr. Dietmar Schulz adult street source

Dietmar is a weathered, dark-suited street examiner with a stopwatch in his right hand and papers in his left. The four original ImageGen sources provide eight directional views, a complete far leg for each profile and hidden near instep paint for both profiles.

The source uses one isotropic 400/468 density on a 512 × 512 canvas with pivot `[256, 472]`. The four corrected quarter turns keep their original sole rows. The source build uses a 2.33 m height and 13.98-unit stride. The selected game sprite uses the existing height fitter to reach 2.77 m and a 16.62-unit stride.

The selected family includes 412 logical slots and 324 visible mouth registrations. Dietmar's own glance serves the quiz work and review states. The idle row serves waiting. Success and failure use their respective painted reactions.

## Rebuild the source views

From the repository root, run these stages in a fresh output directory with Python, Pillow, NumPy and SciPy. The builder uses the tracked street exporter and the shared independent material sampler recorded in `source-provenance-v1.json`.

```powershell
$driver = 'assets/sprite-sources/resident-motion/quiz-dietmar-schulz/adult-v1/rebuild-family-v1.py'
python -B $driver --out output/dietmar-source-rebuild --stage register
python -B $driver --out output/dietmar-source-rebuild --stage neutral
python -B $driver --out output/dietmar-source-rebuild --stage quarters
```

The registration, neutral and quarter stages reproduce the exact 33 files recorded in the source provenance. The authored delivery receipt binds the separate complete raw replay, including the moving poses, native atlases and mouth registrations. The selected runtime hashes are in the actor's delivery metadata.
