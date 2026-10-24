"""Register Brigitte's own eight paintings at one scale; no acceptance claim."""
from pathlib import Path
import hashlib
import importlib.util
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label, find_objects, distance_transform_edt

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
RAW = HERE / 'raw-directions-v2.png'
OUT = ROOT / 'output/street-redesign/bueroklammer-end-to-end/source-registration'
ORDER = ('down', 'front-right', 'right', 'rear-right', 'up', 'rear-left', 'left', 'front-left')
SHA = 'dfef207b68b974ebd10c75d06ea3fc542b7ef32959108e809736e3a3b6450f42'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    assert sha(RAW) == SHA
    spec = importlib.util.spec_from_file_location('brigitte_existing_registration', ROOT / 'tools/build-street-character-sprites.py')
    street = importlib.util.module_from_spec(spec); spec.loader.exec_module(street)
    with Image.open(RAW) as image:
        raw = image.convert('RGBA')
    assert raw.size == (1536, 1024)
    registered_folder = HERE / 'registered'; registered_folder.mkdir(exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    receipt = {'identity': 'crowd-brigitte-bueroklammer', 'raw': RAW.relative_to(ROOT).as_posix(),
               'rawSha256': SHA, 'working': {'cell': [512, 512], 'centerX': 256, 'baselineY': 472},
               'status': 'SOURCE REGISTRATION ONLY; actual source anatomy/hand/alpha inspection pending',
               'views': {}}
    scale = None
    boards = {theme: Image.new('RGB', (2048, 1024), background)
              for theme, background in [('light', '#eee8db'), ('dark', '#25272b')]}
    for n, heading in enumerate(ORDER):
        origin_x, origin_y = (n % 4) * 384, (n // 4) * 512
        cell = raw.crop((origin_x, origin_y, origin_x + 384, origin_y + 512))
        rgba = np.asarray(cell).copy()
        groups, count = label(rgba[:, :, 3] >= 20)
        sizes = np.bincount(groups.ravel()); sizes[0] = 0
        largest = int(sizes.argmax()); assert sizes[largest] > 10000
        substantial = [{'label': int(i), 'pixels': int(sizes[i])}
                       for i in range(1, count + 1) if sizes[i] >= 15]
        assert len(substantial) == 1, {'heading': heading, 'substantialComponents': substantial}
        region = find_objects(groups)[largest - 1]
        bounds = [region[1].start, region[0].start, region[1].stop, region[0].stop]
        if scale is None:
            scale = 400 / (bounds[3] - bounds[1])
            receipt['oneScalePerRawSheet'] = scale
        distance, nearest = distance_transform_edt(groups == 0, return_indices=True)
        owned = (groups == largest) | ((rgba[:, :, 3] < 20) & (distance <= 2) & (groups[tuple(nearest)] == largest))
        rgba[~owned] = 0
        rgba[rgba[:, :, 3] == 0] = 0
        left, top, right, bottom = bounds
        yy, xx = np.nonzero(rgba[max(top, bottom - 50):bottom, left:right, 3] >= 20)
        assert len(xx) > 100
        pivot = [float((xx.min() + xx.max()) / 2 + left), bottom]
        frame, working_origin = street.register_source(Image.fromarray(rgba), {'component_bounds': bounds, 'source_pivot': pivot}, scale, 472)
        # Registration retains source alpha. Hidden RGB is zeroed by the existing
        # premultiplied resampler; no chroma-key or matte painting is introduced.
        pixels = np.asarray(frame)
        assert not np.any(pixels[pixels[:, :, 3] == 0, :3])
        path = registered_folder / (heading + '.png'); frame.save(path)
        receipt['views'][heading] = {
            'sourceCellXYXY': [origin_x, origin_y, origin_x + 384, origin_y + 512],
            'sourceBoundsAlpha20': [left + origin_x, top + origin_y, right + origin_x, bottom + origin_y],
            'sourcePivot': [pivot[0] + origin_x, pivot[1] + origin_y],
            'substantialComponents': substantial, 'workingOrigin': working_origin.tolist(),
            'workingBoundsRGBA': frame.getchannel('A').getbbox(),
            'registered': path.relative_to(ROOT).as_posix(), 'registeredSha256': sha(path)}
        for theme, background in [('light', '#eee8db'), ('dark', '#25272b')]:
            flat = Image.alpha_composite(Image.new('RGBA', frame.size, background), frame).convert('RGB')
            boards[theme].paste(flat, ((n % 4) * 512, (n // 4) * 512))
            ImageDraw.Draw(boards[theme]).text(((n % 4) * 512 + 8, (n // 4) * 512 + 8), heading, fill='#111' if theme == 'light' else '#eee')
        print('registered ' + heading, flush=True)
        cell.close(); frame.close()
    raw.close()
    for theme, board in boards.items():
        board.save(OUT / ('registered-' + theme + '.png')); board.close()
    (HERE / 'registration.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'views': len(receipt['views']), 'scale': scale,
                      'bounds': {key: view['workingBoundsRGBA'] for key, view in receipt['views'].items()}}))

if __name__ == '__main__':
    main()
