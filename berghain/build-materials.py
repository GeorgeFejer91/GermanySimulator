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
            'leather': (181, .00007), 'amber': (211, .0014), 'aged': (239, .0014),
            'plaster': (263, .004), 'pier': (283, .016)}


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
    if name in ('plaster', 'pier'):
        return build_mineral_treatment(name, seed, relief)
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
    return write_family(name, tile, relief, colour, roughness, normals,
                        'RGB' if name == 'aged' else 'L')


def write_family(name, tile, relief, colour, roughness, normals, colour_mode):
    output = {}
    for kind, mode, pixels in [('baseColor', colour_mode, colour), ('roughness', 'RGB', roughness), ('normal', 'RGB', normals)]:
        filename = f'textures/{name}-{kind}.png'
        image = Image.new(mode, (SIZE, SIZE))
        image.putdata(pixels)
        image.save(ROOT / filename, optimize=True)
        content = (ROOT / filename).read_bytes()
        output[kind] = {'file': filename, 'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()}
    return {'metresPerTile': tile, 'maps': output, 'estimatedReliefMetres': relief}


def build_mineral_treatment(name, seed, relief):
    """Original material studies from I23/I24 observations, without image inputs.

    Macro patches, directional wear and uneven casting seams replace the same
    generic mottling in two visibly different rooms. Their location, frequency
    and depth are authored estimates, not a scan or a registered damage map.
    """
    tile = 6.4 if name == 'plaster' else 3.2
    broad = noise(5, 7, seed)
    broken = noise(23, 29, seed + 1)
    streak = noise(41, 4, seed + 2)
    aggregate = noise(109, 103, seed + 3)
    rng = random.Random(seed + 4)
    grain = [rng.random() for _ in broad]
    smooth = lambda a, b, v: max(0, min(1, (v - a) / (b - a))) ** 2 * (3 - 2 * max(0, min(1, (v - a) / (b - a))))
    heights, colour, roughness = [], [], []
    for i, (b, d, s, a, g) in enumerate(zip(broad, broken, streak, aggregate, grain)):
        x, y = i % SIZE, i // SIZE
        damage = smooth(.54, .70, .43*b + .25*d + .32*a)
        worn = smooth(.55, .81, s) * smooth(.31, .69, .55*b+.45*d)
        if name == 'plaster':
            # Mostly continuous plaster with a few original localized scars.
            # A whole-face erosion field would incorrectly mottle the reliefs.
            mask = 0
            for cx, cy, rx, ry in ((.12,.22,.014,.07),(.62,.65,.03,.04),(.75,.43,.016,.08),(.33,.87,.035,.025)):
                dx, dy = abs(x/SIZE-cx), abs(y/SIZE-cy)
                radius = math.hypot(min(dx,1-dx)/rx,min(dy,1-dy)/ry)
                mask = max(mask, max(0,1-radius)**.7)
            loss = smooth(.24,.68,mask+.20*(d-.5)+.14*(a-.5))
            shade = .88 + .025*b + .012*g - .20*loss - .055*worn
            tint = (1, .985 - .015*loss, .965 - .025*loss)
            height = .018*d + .018*g - .68*loss - .018*worn
            rough = .86 + .10*loss + .02*g
        else:
            # Cast concrete with irregular aggregate loss and shallow form seams.
            seam = 0
            for row in (.16, .36, .57, .77, .94):
                centre = row*SIZE + 1.1*math.sin(x*math.tau/SIZE*3 + row*9)
                seam = max(seam, math.exp(-((y-centre)/.75)**2))
            pit = smooth(.52,.67,.55*a+.30*d+.15*g) * (.20+.80*damage)
            shade = .77 + .08*b + .018*g - .09*damage - .12*pit - .07*worn - .09*seam
            tint = (1, .99, .955)
            height = .10*a + .07*g - .62*pit - .16*damage - .09*seam
            rough = .88 + .075*pit + .025*g
        colour.append(tuple(round(max(0, min(1, shade*t))*255) for t in tint))
        roughness.append((255, round(min(1, rough)*255), 255))
        heights.append(height)
    normals = []
    for i in range(SIZE*SIZE):
        x, y = i % SIZE, i // SIZE
        dx = (heights[y*SIZE+(x+1)%SIZE]-heights[y*SIZE+(x-1)%SIZE])*relief*SIZE/(tile*2)
        dy = (heights[((y+1)%SIZE)*SIZE+x]-heights[((y-1)%SIZE)*SIZE+x])*relief*SIZE/(tile*2)
        length = math.sqrt(dx*dx + dy*dy + 1)
        normals.append(tuple(round((v/length*.5+.5)*255) for v in (-dx, -dy, 1)))
    result = write_family(name, tile, relief, colour, roughness, normals, 'RGB')
    result['references'] = ['I23 views12–16'] if name == 'plaster' else ['A15 views00–03', 'I24 detail']
    result['limits'] = 'Original inferred surface treatment; tile scale, patch positions and relief are not measured. No silhouette or collision displacement.'
    return result


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
