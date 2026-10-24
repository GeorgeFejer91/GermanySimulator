"""Build original, seamless PBR surface maps; no photographic input."""
from pathlib import Path
import hashlib
import json
import math
import random
from PIL import Image,ImageDraw,ImageFilter

ROOT = Path(__file__).resolve().parents[1] / 'assets/models/berghain'
SIZE = 512
FAMILIES = {'mineral': (11, .0008), 'stone': (37, .0015),
            'metal': (71, .00015), 'aggregate': (109, .003), 'fabric': (151, .00045),
            'leather': (181, .00007), 'amber': (211, .0014), 'aged': (239, .0014)}


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
    tile = .08 if name in ('fabric', 'amber') else .04 if name == 'leather' else 2.4 if name == 'aged' else 2
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
    elif name == 'amber':
        height = [.02 * d + .01 * g for d, g in zip(detail, grain)]
        for _ in range(360):
            cx, cy, radius = rng.uniform(0, SIZE), rng.uniform(0, SIZE), rng.uniform(1.2, 6.5)
            extent = math.ceil(radius * 2.4)
            for dy in range(-extent, extent+1):
                for dx in range(-extent, extent+1):
                    distance = math.hypot(dx, dy) / radius
                    if distance > 2.4: continue
                    x, y = (round(cx)+dx) % SIZE, (round(cy)+dy) % SIZE
                    height[y*SIZE+x] += -.36 * math.exp(-distance*distance*3) + .10 * math.exp(-((distance-.95)/.25)**2)
    elif name == 'aged':
        crust=noise(14,14,seed+5)
        height=[.12*d+.03*g+.5*max(0,min(1,(c-.48)*12)) for d,g,c in zip(detail,grain,crust)]
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
        elif name == 'amber':
            shade = .995 + .005 * max(-1, min(1, height[i]))
        elif name == 'aged':
            shade = .48+.30*b+.08*d-.19*max(0,s-.45)-.07*max(0,.25-g)/.25
        else:
            shade = .78 + .12 * d + .1 * g
        colour.append(tuple(round(shade*tint*255) for tint in (1,.93,.82)) if name=='aged' else round(shade*255))
        rough = .65 + .35 * d if name == 'metal' else .82 + .18 * g
        if name == 'leather':
            rough = .65 + .25 * d
        elif name == 'amber':
            rough = .72 + .25 * min(1, abs(height[i]) * 3)
        elif name == 'aged':
            rough = .88+.10*g
        roughness.append((255, round(rough * 255), 255))
        x, y = i % SIZE, i // SIZE
        dx = (height[y * SIZE + (x + 1) % SIZE] - height[y * SIZE + (x - 1) % SIZE]) * relief * SIZE / (tile * 2)
        dy = (height[((y + 1) % SIZE) * SIZE + x] - height[((y - 1) % SIZE) * SIZE + x]) * relief * SIZE / (tile * 2)
        length = math.sqrt(dx * dx + dy * dy + 1)
        normals.append(tuple(round((v / length * .5 + .5) * 255) for v in (-dx, -dy, 1)))
    output = {}
    for kind, mode, pixels in [('baseColor', 'RGB' if name=='aged' else 'L', colour), ('roughness', 'RGB', roughness), ('normal', 'RGB', normals)]:
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
    lighting=Image.new('RGB',(512,256),(29,25,22));draw=ImageDraw.Draw(lighting)
    draw.rectangle((0,128,511,255),fill=(67,52,35))
    for x in (36,166,302,443):
        draw.rounded_rectangle((x,65,x+37,101),radius=5,fill=(255,243,219))
    draw.rectangle((0,124,511,130),fill=(128,91,45))
    lighting=lighting.filter(ImageFilter.GaussianBlur(2));lighting.save(ROOT/'textures/amber-lighting.png',optimize=True)
    lighting_bytes=(ROOT/'textures/amber-lighting.png').read_bytes()
    manifest = {'generator': 'berghain/build-materials.py', 'origin': 'Original seeded procedural maps; no image inputs',
                'limits': 'Approximate appearance and microrelief, not scanned site materials',
                'size': [SIZE, SIZE], 'families': families,
                'amberLighting':{'file':'textures/amber-lighting.png','size':[512,256],
                  'bytes':len(lighting_bytes),'sha256':hashlib.sha256(lighting_bytes).hexdigest(),
                  'origin':'Original procedural reflection panels, not a surveyed room light probe'}}
    (ROOT / 'textures/manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    runtime = {name: {'metresPerTile': entry['metresPerTile'],
                      **{kind: record['file'] for kind, record in entry['maps'].items()}}
               for name, entry in families.items()}
    (ROOT / 'surface-data.mjs').write_text('export const surfaceFamilies = ' + json.dumps(runtime, indent=2) + ';\n', encoding='utf-8')
    print(json.dumps({'families': len(families), 'maps': len(families) * 3, 'bytes': sum(m['bytes'] for f in families.values() for m in f['maps'].values())}))


if __name__ == '__main__':
    main()
