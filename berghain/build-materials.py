"""Build original, seamless PBR surface maps; no photographic input."""
from pathlib import Path
import hashlib
import json
import math
import random
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'assets/models/berghain'
SIZE = 512
FAMILIES = {'mineral': (11, .0008), 'stone': (37, .0015),
            'metal': (71, .00015), 'aggregate': (109, .003), 'fabric': (151, .00045),
            'leather': (181, .00007)}


def noise(columns, rows, seed):
    rng = random.Random(seed)
    lattice = [[rng.random() for _ in range(columns)] for _ in range(rows)]
    pixels = []
    for y in range(SIZE):
        gy = y * rows / SIZE
        iy = int(gy)
        fy = gy - iy
        fy = fy * fy * (3 - 2 * fy)
        lower, upper = lattice[iy], lattice[(iy + 1) % rows]
        for x in range(SIZE):
            gx = x * columns / SIZE
            ix = int(gx)
            fx = gx - ix
            fx = fx * fx * (3 - 2 * fx)
            a = lower[ix] * (1 - fx) + lower[(ix + 1) % columns] * fx
            b = upper[ix] * (1 - fx) + upper[(ix + 1) % columns] * fx
            pixels.append(a * (1 - fy) + b * fy)
    return pixels


def build_family(name, seed, relief):
    tile = .08 if name == 'fabric' else .04 if name == 'leather' else 2
    broad, detail = noise(4, 4, seed), noise(64, 64, seed + 1)
    streak = noise(32, 2, seed + 2)
    rng = random.Random(seed + 3)
    grain = [rng.random() for _ in broad]
    height = [.55 * d + .45 * g for d, g in zip(detail, grain)]
    if name == 'fabric':
        # Original twill weave at textile scale; periodic at both image edges.
        height = [(.50 + .22 * math.sin(2 * math.pi * (i % SIZE) / 8)
                   * math.cos(2 * math.pi * (i // SIZE) / 8)
                   + .15 * math.sin(2 * math.pi * ((i % SIZE) + (i // SIZE)) / 16)
                   + .06 * grain[i]) for i in range(SIZE * SIZE)]
    elif name == 'leather':
        height = [.72 * d + .16 * b + .12 * min(g, .55) for b, d, g in zip(broad, detail, grain)]
    colour, roughness, normals = [], [], []
    for i, (b, d, s, g) in enumerate(zip(broad, detail, streak, grain)):
        shade = .94 + .015 * b + .025 * d + .02 * g
        if name == 'mineral':
            shade -= .03 * max(0, s - .45)
        elif name == 'stone':
            shade = .91 + .02 * b + .04 * d + .03 * g - .035 * max(0, .2 - g) / .2
        elif name == 'metal':
            shade = .97 + .01 * b + .02 * g
        elif name == 'fabric':
            shade = .63 + .31 * height[i] + .04 * g
        elif name == 'leather':
            shade = .93 + .065 * d + .005 * g
        else:
            shade = .78 + .12 * d + .1 * g
        colour.append(round(shade * 255))
        rough = .65 + .35 * d if name == 'metal' else .82 + .18 * g
        if name == 'leather':
            rough = .65 + .25 * d
        roughness.append((255, round(rough * 255), 255))
        x, y = i % SIZE, i // SIZE
        dx = (height[y * SIZE + (x + 1) % SIZE] - height[y * SIZE + (x - 1) % SIZE]) * relief * SIZE / (tile * 2)
        dy = (height[((y + 1) % SIZE) * SIZE + x] - height[((y - 1) % SIZE) * SIZE + x]) * relief * SIZE / (tile * 2)
        length = math.sqrt(dx * dx + dy * dy + 1)
        normals.append(tuple(round((v / length * .5 + .5) * 255) for v in (-dx, -dy, 1)))
    output = {}
    for kind, mode, pixels in [('baseColor', 'L', colour), ('roughness', 'RGB', roughness), ('normal', 'RGB', normals)]:
        filename = f'textures/{name}-{kind}.png'
        image = Image.new(mode, (SIZE, SIZE))
        image.putdata(pixels)
        image.save(ROOT / filename, optimize=True)
        content = (ROOT / filename).read_bytes()
        output[kind] = {'file': filename, 'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()}
    return {'metresPerTile': tile, 'maps': output, 'estimatedReliefMetres': relief}


def main():
    (ROOT / 'textures').mkdir(exist_ok=True)
    families = {name: build_family(name, *parameters) for name, parameters in FAMILIES.items()}
    manifest = {'generator': 'berghain/build-materials.py', 'origin': 'Original seeded procedural maps; no image inputs',
                'limits': 'Approximate appearance and microrelief, not scanned site materials',
                'size': [SIZE, SIZE], 'families': families}
    (ROOT / 'textures/manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    runtime = {name: {'metresPerTile': entry['metresPerTile'],
                      **{kind: record['file'] for kind, record in entry['maps'].items()}}
               for name, entry in families.items()}
    (ROOT / 'surface-data.mjs').write_text('export const surfaceFamilies = ' + json.dumps(runtime, indent=2) + ';\n', encoding='utf-8')
    print(json.dumps({'families': len(families), 'maps': len(families) * 3, 'bytes': sum(m['bytes'] for f in families.values() for m in f['maps'].values())}))


if __name__ == '__main__':
    main()
