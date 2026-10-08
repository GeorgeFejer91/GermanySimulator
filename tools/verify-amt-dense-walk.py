"""Decode the two dense office pilots; collect diagnostics and visual-review evidence.

This never assigns a visual pass. Reviewers inspect the exact cells and write the
skill's review.json beside each manifest before running its provenance gate.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import math
import subprocess
import io
import argparse
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/amt-smoothing/review-final'
spec = importlib.util.spec_from_file_location('amt_motion', ROOT / 'tools/amt-character-motion.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def record(path):
    return {'file': str(path.resolve()), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def board(images, size, background, labels=None, columns=4):
    w, h = size
    canvas = Image.new('RGB', (w * columns, (h + 24) * math.ceil(len(images) / columns)), background)
    draw = ImageDraw.Draw(canvas)
    for i, image in enumerate(images):
        x, y = i % columns * w, i // columns * (h + 24)
        image = image.resize(size, Image.Resampling.LANCZOS)
        canvas.paste(image, (x, y), image)
        draw.text((x + 4, y + h + 3), labels[i] if labels else str(i), fill='#777777')
    return canvas


def delta(images):
    def visible(im):
        a = np.asarray(im, dtype=np.float32) / 255
        a[:, :, :3] *= a[:, :, 3:4]
        return a
    p = [visible(im) for im in images]
    values = [float(np.abs(p[(i + 1) % len(p)] - a).mean()) for i, a in enumerate(p)]
    return {'mean': float(np.mean(values)), 'max': max(values), 'seam': values[-1]}


def evidence(name, suffix, cell_size, columns, states, source_images):
    asset = ROOT / f'assets/buergeramt/characters/{name}-{suffix}.webp'
    atlas = Image.open(asset).convert('RGBA')
    assert max(atlas.size) <= 4096, (asset, atlas.size)
    dest = OUT / name / suffix
    dest.mkdir(parents=True, exist_ok=True)
    prior_path = dest / 'manifest.json'
    prior = json.loads(prior_path.read_text(encoding='utf-8')) if prior_path.exists() else {}
    prior_refs = {r['id']: r['sha256'] for r in prior.get('references', [])}
    w, h = cell_size
    refs = [{'id': state, **record(ROOT / f'assets/sprite-sources/buergeramt/{name}/{state}.png')}
            for state, _ in states]
    manifest = {'export': record(asset), 'cell_size_xy': [w, h], 'references': refs,
                'movement_rows': [], 'frames': []}
    group_evidence = {}
    index = 0
    diagnostics = []
    for state, count in states:
        frames = []
        changed = prior_refs.get(state) != next(r['sha256'] for r in refs if r['id'] == state)
        for phase in range(count):
            row, col = divmod(index, columns)
            cell = atlas.crop((col * w, row * h, (col + 1) * w, (row + 1) * h))
            box = cell.getbbox()
            assert box and min(box[0], box[1], w - box[2], h - box[3]) >= 2, (asset, state, phase, box)
            path = dest / f'{state}-{phase:02d}.png'
            if not path.exists() or Image.open(path).convert('RGBA').tobytes() != cell.tobytes():
                changed = True
            cell.save(path)
            manifest['frames'].append({'id': f'{state}-{phase:02d}', **record(path),
                                       'row': row, 'col': col, 'reference_ids': [state]})
            frames.append(cell)
            index += 1
        assert len({im.tobytes() for im in frames}) == count, (asset, state, 'held duplicate')
        ref = source_images[state]
        labels = ['registered source'] + [f'{state} {i}/{count}' for i in range(count)]
        comparison = dest / f'{state}-comparison.jpg'
        native = dest / f'{state}-native.jpg'
        light, dark = dest / f'{state}-light.jpg', dest / f'{state}-dark.jpg'
        # Reuse already reviewed boards only when every decoded pixel and its
        # reference is identical. A local source repair need not re-encode 2x
        # contact sheets for all unchanged states; the final gate checks hashes.
        if changed or not all(p.exists() for p in (comparison, native, light, dark)):
            board([ref, *frames], (w, h), '#e9e6de', labels).save(comparison, quality=94)
            board(frames, (w, h), '#e9e6de').save(native, quality=94)
            board(frames, (w * 2, h * 2), '#f4f0e7').save(light, quality=94)
            board(frames, (w * 2, h * 2), '#1f2330').save(dark, quality=94)
        group_evidence[state] = [
            {'role': 'source_comparison', **record(comparison), 'reference_ids': [state]},
            {'role': 'native', **record(native)}, {'role': 'enlarged_light', **record(light)},
            {'role': 'enlarged_dark', **record(dark)}, {'role': 'ordered_motion', **record(native)}]
        if count == 16:
            sparse, dense = delta(frames[::2]), delta(frames)
            assert dense['max'] < sparse['max'], (asset, state, sparse, dense)
            assert dense['seam'] < sparse['seam'], (asset, state, sparse, dense)
            diagnostics.append({'state': state, 'eight_samples': sparse, 'sixteen_samples': dense})
            # Same 1.28-second illustrative cycle; game playback remains distance-driven.
            motion = [board([frames[i // 2 * 2], frames[i]], (320, 416), '#e9e6de',
                            ['8 samples', '16 samples'], columns=2) for i in range(16)]
            motion[0].save(dest / f'{state}-comparison.gif', save_all=True, append_images=motion[1:],
                           duration=80, loop=0, disposal=2)
    assert index * w * h == atlas.width * atlas.height
    manifest['movement_rows'] = [{'row': i, 'count': columns} for i in range(atlas.height // h)]
    (dest / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    (dest / 'evidence.json').write_text(json.dumps(group_evidence, indent=2), encoding='utf-8')
    return {'asset': record(asset), 'dimensions': list(atlas.size), 'bytes': asset.stat().st_size,
            'frames': index, 'diagnostics': diagnostics}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--name', choices=builder.DENSE_NAMES)
    suffixes = ['motion', 'motion-mobile'] + [f'walk-{d}-detail{m}' for d in builder.ROWS[:4] for m in ('', '-mobile')]
    parser.add_argument('--suffix', action='append', choices=suffixes,
                        help='Review only these changed export suffixes; repeat for multiple atlases')
    args = parser.parse_args()
    summary = []
    for name in (args.name,) if args.name else builder.DENSE_NAMES:
        print(name, flush=True)
        refs = {state: builder.frame(Image.open(ROOT / f'assets/sprite-sources/buergeramt/{name}/{state}.png'))
                for state in builder.ROWS}
        states = [(state, 16 if i < 4 else 8) for i, state in enumerate(builder.ROWS)]
        for suffix, size in [('motion', (320, 416)), ('motion-mobile', (160, 208))]:
            if args.suffix and suffix not in args.suffix: continue
            summary.append(evidence(name, suffix, size, 12, states, refs))
        for direction in builder.ROWS[:4]:
            for mobile in (False, True):
                suffix = f'walk-{direction}-detail' + ('-mobile' if mobile else '')
                if args.suffix and suffix not in args.suffix: continue
                summary.append(evidence(name, suffix, (320, 416) if mobile else (640, 832),
                                        4, [(direction, 16)], refs))
        # Record the intentional field and source-matte repair relative to the old
        # export; unlike pure resampling, this repair does change old key pixels.
        old_bytes = subprocess.check_output(['git', 'show', f'20fbbec:assets/buergeramt/characters/{name}-motion.webp'], cwd=ROOT)
        old = Image.open(io.BytesIO(old_bytes)).convert('RGBA')
        new = Image.open(ROOT / f'assets/buergeramt/characters/{name}-motion.webp').convert('RGBA')
        errors = []
        alpha_changed = 0
        for state in range(8):
            for i in range(8):
                old_cell = old.crop((i * 320, state * 416, (i + 1) * 320, (state + 1) * 416))
                j = state * 16 + i * 2 if state < 4 else 64 + (state - 4) * 8 + i
                row, col = divmod(j, 12)
                new_cell = new.crop((col * 320, row * 416, (col + 1) * 320, (row + 1) * 416))
                alpha_changed += int(not np.array_equal(np.asarray(old_cell)[:, :, 3], np.asarray(new_cell)[:, :, 3]))
                errors.append(delta([old_cell, new_cell])['mean'])
        summary.append({'name': name, 'changed_old_anchor_alpha_cells': alpha_changed,
                        'old_to_repaired_mean_delta': float(np.mean(errors)), 'old_to_repaired_max_delta': max(errors),
                        'reason': 'Fixed all-direction strength .2 and cleaned source masters; old faulty key pixels intentionally not retained.'})
    label = (args.name + '-') if args.name else ''
    (OUT / (label + ('partial-' if args.suffix else '') + 'diagnostics.json')).write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print(json.dumps({'exports': sum('asset' in x for x in summary), 'frames': sum(x.get('frames', 0) for x in summary),
                      'visual_review': 'pending; numeric checks do not certify anatomy'}))


if __name__ == '__main__':
    main()
