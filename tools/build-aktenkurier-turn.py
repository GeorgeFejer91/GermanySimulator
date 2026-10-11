"""Pack the courier's painted turn keys; never interpolate or flip a view."""
from pathlib import Path
from io import BytesIO
import argparse
import hashlib
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/sprite-sources/buergeramt'
DEST = ROOT / 'assets/buergeramt/characters'
QA = ROOT / 'output/aktenkurier-turn/frames'
KEYS = ['down', 'front-quarter', 'front-diagonal', 'front-profile', 'right',
        'rear-profile', 'rear-diagonal', 'rear-quarter', 'up']

def sha(data):
    return hashlib.sha256(data).hexdigest()

def clean(image):
    pixels = np.array(image.convert('RGBA'))
    pixels[pixels[:, :, 3] < 8] = 0
    return Image.fromarray(pixels)

def build(check=False):
    sources = [SOURCE / ('aktenkurier' if key in ('down', 'right', 'up') else 'aktenkurier-turn') / (key + '.png') for key in KEYS]
    images = [clean(Image.open(path)) for path in sources]
    # One scale for the six generated keys, matched to the existing registered
    # family; no independent fitting of each frame's head, body or shoes.
    generated_height = max(im.getbbox()[3] - im.getbbox()[1] for key, im in zip(KEYS, images) if '-' in key)
    manifest = {'character': 'aktenkurier', 'frames': 9, 'grid': [3, 3],
                'durationSeconds': 1.8, 'loop': False, 'pivot': [.5, 400 / 416],
                'method': 'six-painted-bridges-between-existing-front-profile-rear',
                'sources': {str(path.relative_to(ROOT)).replace('\\', '/'): sha(path.read_bytes()) for path in sources}, 'variants': {}}
    for variant, cell in [('desktop', (480, 624)), ('mobile', (240, 312))]:
        atlas = Image.new('RGBA', (cell[0] * 3, cell[1] * 3))
        for index, (key, im) in enumerate(zip(KEYS, images)):
            box = im.getbbox()
            scale = (cell[1] / 416) * (384 / (432 if '-' not in key else generated_height))
            scaled = clean(im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS))
            x = round(cell[0] / 2 - (box[0] + box[2]) * scale / 2)
            y = round(cell[1] * 400 / 416 - box[3] * scale)
            frame = Image.new('RGBA', cell)
            frame.alpha_composite(scaled, (x, y))
            bounds = frame.getbbox()
            assert min(bounds[0], bounds[1], cell[0] - bounds[2], cell[1] - bounds[3]) >= 8, (key, bounds)
            atlas.alpha_composite(frame, (index % 3 * cell[0], index // 3 * cell[1]))
        buffer = BytesIO()
        atlas.save(buffer, 'WEBP', quality=94, method=5)
        data = buffer.getvalue()
        filename = 'aktenkurier-turn' + ('-mobile' if variant == 'mobile' else '') + '.webp'
        target = DEST / filename
        if check:
            assert target.read_bytes() == data, f'Asset drift: {target}'
        else:
            target.write_bytes(data)
        encoded = Image.open(BytesIO(data)).convert('RGBA')
        assert max(encoded.size) <= 2048 and encoded.width * encoded.height * 4 <= 16 * 1024 * 1024
        QA.mkdir(parents=True, exist_ok=True)
        frames = []
        for i in range(9):
            x, y = i % 3 * cell[0], i // 3 * cell[1]
            frame = encoded.crop((x, y, x + cell[0], y + cell[1]))
            bounds = frame.getbbox()
            assert min(bounds[0], bounds[1], cell[0] - bounds[2], cell[1] - bounds[3]) >= 8, (variant, i, bounds)
            frame.save(QA / f'{variant}-{i}.png')
            frames.append(frame)
        assert len({sha(frame.tobytes()) for frame in frames}) == 9
        for color, label in [('#e4e0d6', 'light'), ('#151b20', 'dark')]:
            board = Image.new('RGB', encoded.size, color)
            board.paste(encoded, mask=encoded.getchannel('A'))
            board.save(QA / f'{variant}-{label}.png')
            movie = []
            for frame in frames:
                background = Image.new('RGB', cell, color)
                background.paste(frame, mask=frame.getchannel('A'))
                movie.append(background)
            movie[0].save(QA / f'{variant}-{label}.gif', save_all=True, append_images=movie[1:], duration=200, loop=0)
        manifest['variants'][variant] = {'file': filename, 'cell': list(cell), 'size': list(encoded.size),
            'bytes': len(data), 'decodedRGBABytes': encoded.width * encoded.height * 4, 'sha256': sha(data)}
    text = json.dumps(manifest, indent=2) + '\n'
    path = DEST / 'aktenkurier-turn.json'
    if check:
        assert path.read_text(encoding='utf-8') == text, 'Turn manifest drift'
    else:
        path.write_text(text, encoding='utf-8')
    print(json.dumps(manifest['variants'], indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    build(parser.parse_args().check)
