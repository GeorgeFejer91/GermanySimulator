"""Check exact packed neighbor exports and assess marked planted sole tracks.

Pixel-change and stance reports diagnose the bake; they do not approve artwork.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets/characters/neighbors'
QA = ROOT / 'output/neighbors'
spec = importlib.util.spec_from_file_location('walk_speed', ROOT / '.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py')
speed = importlib.util.module_from_spec(spec)
spec.loader.exec_module(speed)
manifest = json.loads((DEST / 'manifest.json').read_text())
report = {'exports': [], 'soleAssessments': []}
for name, entry in manifest.items():
    for suffix, divisor in (('', 1), ('-mobile', 2)):
        path = DEST / f'{name}{suffix}.webp'
        image = Image.open(path).convert('RGBA')
        pixels = np.array(image)
        width, height = (v//divisor for v in entry['cell'])
        assert image.size == (16*width, 16*height)
        assert max(image.size) <= 4096
        if not suffix:
            assert hashlib.sha256(path.read_bytes()).hexdigest() == entry['sha256']
        clips = []
        for clip, layout in entry['clips'].items():
            frames = []
            for index in range(layout['count']):
                slot = layout['offset']+index
                frame = pixels[(slot//16)*height:(slot//16+1)*height, (slot%16)*width:(slot%16+1)*width]
                assert not any(np.any(edge) for edge in (frame[0,:,3], frame[-1,:,3], frame[:,0,3], frame[:,-1,3]))
                assert np.max(frame[:,:,3]) > 128
                assert not np.any(frame[:,:,:3][frame[:,:,3] == 0]), 'hidden RGB must be clear'
                p = frame.astype(float)/255
                p[:,:,:3] *= p[:,:,3:4]
                frames.append(p)
            distinct = len({hashlib.sha256(frame.tobytes()).hexdigest() for frame in frames})
            if clip in ('down', 'right', 'up', 'left'):
                assert distinct == 32
            changes = {}
            for stride in ([4, 2, 1] if layout['count'] == 32 else [1]):
                samples = frames[::stride]
                delta = [float(np.abs(samples[(i+1)%len(samples)]-f).mean()) for i, f in enumerate(samples)]
                changes[len(samples)] = {'max': max(delta), 'mean': float(np.mean(delta)), 'seam': delta[-1]}
            clips.append({'clip': clip, 'distinct': distinct, 'changes': changes})
        report['exports'].append({'name': name+suffix, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                                  'bytes': path.stat().st_size, 'decodedRgbaBytes': pixels.nbytes, 'clips': clips})
    path = DEST / f'{name}.webp'
    pixels = np.array(Image.open(path))
    for view, sequences in [('right', [('foreground', range(24, 33, 2), 'max'), ('rear', range(16, 25, 2), 'min')]),
                            ('left', [('foreground', range(8, 17, 2), 'min'), ('rear', range(0, 9, 2), 'max')])]:
        contacts = []
        for foot, indices, edge in sequences:
            samples = []
            for index in indices:
                slot = entry['clips'][view]['offset']+index%32
                sole = pixels[(slot//16)*192+176:(slot//16)*192+180, (slot%16)*128:(slot%16+1)*128, 3]
                xs = np.where(sole > 128)[1]
                x = int(max(xs) if edge == 'max' else min(xs))
                samples.append({'frame': index, 'along_pixels': x if view == 'right' else -x})
            contacts.append({'foot': foot, 'samples': samples})
        marks = {'character': name, 'view': view, 'atlas_file': str(path),
                 'atlas_sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'frames_per_cycle': 32,
                 'game_units_per_pixel': entry['figureWorldHeight']/170/.02,
                 'current_cycle_distance': entry['distancePerCycle'], 'shoe_length_pixels': 30 if name == 'schwabingen' else 35,
                 'contacts': contacts}
        (QA / f'{name}-{view}-sole-marks.json').write_text(json.dumps(marks, indent=2)+'\n')
        result = speed.assess(marks)
        (QA / f'{name}-{view}-sole-report.json').write_text(json.dumps(result, indent=2)+'\n')
        report['soleAssessments'].append(result)
(QA / 'packed-verification.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({'exports': len(report['exports']), 'soleFits': [
    {'name': a['character'], 'view': a['view'], 'fit': round(a['fitted_cycle_distance'], 3),
     'current': round(a['current_cycle_distance'], 3), 'maxSlideInShoeLengths': round(a['current_slip']['max_shoe_lengths'], 4)}
    for a in report['soleAssessments']]}, indent=2))
