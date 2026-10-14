"""Bake connected mini-neighbor walks from registered fictional direction paint."""
from pathlib import Path
import hashlib
import json
import math
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/sprite-sources/neighbors/directions.png'
DEST = ROOT / 'assets/characters/neighbors'
QA = ROOT / 'output/neighbors'
CELL = (128, 192)
COUNT = 16
BASELINE = 180
NAMES = ('heiko', 'inga', 'schwabingen')
MOUTHS = {
    'heiko': {'corners': [57, 79], 'crease': [73.2, 72.8, 72.5, 72.8, 73.1], 'aperture': 1.9},
    'inga': {'corners': [60, 81], 'crease': [71.2, 71, 70.6, 70, 69.6], 'aperture': 1.8},
    'schwabingen': {'corners': [60, 83], 'crease': [55.5, 54.8, 54.4, 54.6, 55], 'aperture': 1.6},
}


def body_matte(image):
    rgba = np.array(image)
    mask = rgba[:, :, 3] >= 12
    height, width = mask.shape
    visited = np.zeros_like(mask)
    largest = []
    for y, x in zip(*np.where(mask)):
        if visited[y, x]:
            continue
        stack, component = [(int(y), int(x))], []
        visited[y, x] = True
        while stack:
            cy, cx = stack.pop()
            component.append((cy, cx))
            for ny, nx in ((cy-1, cx), (cy+1, cx), (cy, cx-1), (cy, cx+1)):
                if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not visited[ny, nx]:
                    visited[ny, nx] = True
                    stack.append((ny, nx))
        if len(component) > len(largest):
            largest = component
    keep = np.zeros_like(mask)
    if largest:
        py, px = np.asarray(largest).T
        keep[py, px] = True
    rgba[~keep] = 0
    return Image.fromarray(rgba)


def premul(image):
    pixels = np.asarray(image, dtype=np.float32) / 255
    pixels[:, :, :3] *= pixels[:, :, 3:4]
    return pixels


def sample(pixels, x, y):
    height, width = pixels.shape[:2]
    ix, iy = np.floor(x).astype(int), np.floor(y).astype(int)
    fx, fy = x - ix, y - iy
    result = np.zeros((*x.shape, 4), dtype=np.float32)
    for dx, dy, weight in ((0, 0, (1-fx)*(1-fy)), (1, 0, fx*(1-fy)),
                           (0, 1, (1-fx)*fy), (1, 1, fx*fy)):
        valid = (ix+dx >= 0) & (ix+dx < width) & (iy+dy >= 0) & (iy+dy < height)
        result[valid] += pixels[(iy+dy)[valid], (ix+dx)[valid]] * weight[valid, None]
    alpha = result[:, :, 3:4]
    result[:, :, :3] = np.divide(result[:, :, :3], alpha,
                                out=np.zeros_like(result[:, :, :3]), where=alpha > .001)
    rgba = np.uint8(np.clip(result * 255, 0, 255))
    rgba[rgba[:, :, 3] < 12] = 0
    return Image.fromarray(rgba)


def continuous_walks(source, direction, skirt=False):
    # The profile shoes overlap the centre line. Cutting two layers there
    # sliced their toes and detached ankles at opposite contacts. Evaluate one
    # connected source-pixel field; modest motion preserves the locked paint.
    yy, xx = np.mgrid[:CELL[1], :CELL[0]].astype(np.float32)
    lateral = direction in ('left', 'right')
    leg = np.clip((yy-105)/(63 if skirt else 58), 0, 1)
    leg = leg*leg*(3-2*leg)
    torso = np.clip((130-yy)/115, 0, 1)
    side = np.tanh((xx-64)/(17 if lateral else 5))
    paint = premul(source)
    frames = []
    for index in range(COUNT):
        phase = index*math.tau/COUNT
        stride = math.sin(phase)
        dx = .65*stride*torso+leg*side*stride*(3.2 if lateral else .8)
        dy = -.45*math.sin(2*phase)*torso+leg*(side*stride*1.6-.8*(1-math.cos(phase)))
        frames.append(sample(paint, xx-dx, yy-dy))
    return frames


def walks(source, direction, skirt=False):
    pixels = np.array(source)
    yy, xx = np.mgrid[:CELL[1], :CELL[0]].astype(np.float32)
    lateral = direction in ('left', 'right')
    hip, ankle = (146, 158) if skirt else (140, 160)
    lower = (yy >= hip) & (pixels[:, :, 3] > 24)
    # The compact sources show a genuine transparent gap between complete
    # shoes. Older overlapping profile shoes require the intact-field fallback.
    seam = np.full(CELL[1], 64, dtype=np.float32)
    for y in range(hip, CELL[1]):
        painted = np.flatnonzero(pixels[y, :, 3] > 24)
        if len(painted) < 2:
            continue
        gaps = np.flatnonzero(pixels[y, :, 3] < 12)
        gaps = gaps[(gaps > painted[0]+3) & (gaps < painted[-1]-3) & (gaps > 43) & (gaps < 85)]
        if len(gaps):
            seam[y] = gaps[np.argmin(abs(gaps-64))]
    if lateral and not np.any((seam[168:180] != 64) | (pixels[168:180, 64, 3] < 12)):
        return continuous_walks(source, direction, skirt)
    layers = []
    centres = []
    for side in (0, 1):
        mask = (yy >= hip) & ((xx < seam[:, None]) if side == 0 else (xx >= seam[:, None]))
        part = pixels.copy()
        part[~mask] = 0
        layers.append(premul(Image.fromarray(part)))
        shoes = (yy >= ankle) & mask & (pixels[:, :, 3] > 24)
        centres.append(float(np.mean(xx[shoes])))
    upper = pixels.copy()
    upper[yy >= hip+4] = 0
    body = Image.fromarray(upper)
    leg = np.clip((yy-hip)/(ankle-hip), 0, 1)
    leg = leg*leg*(3-2*leg)
    amplitude = 4 if skirt else 9
    frames = []
    for index in range(COUNT):
        phase = index*math.tau/COUNT
        canvas = Image.new('RGBA', CELL)
        for side in ((1, 0) if direction == 'left' else (0, 1)):
            step = phase+side*math.pi
            fraction = (step/math.tau) % 1
            if .25 <= fraction <= .75:
                stride, lift = 2-4*fraction, 0
            else:
                swing = ((fraction-.75) % 1)*2
                stride = -1-2*swing+12*swing*swing-8*swing*swing*swing
                lift = 3*math.sin(math.pi*swing)
            recenter = (58 if side == 0 else 70)-centres[side] if lateral else 0
            facing = -1 if direction == 'left' else 1
            dx = leg*(recenter+facing*amplitude*stride) if lateral else leg*.7*stride
            dy = -leg*lift if lateral else leg*(-lift+1.4*math.sin(step))
            canvas.alpha_composite(sample(layers[side], xx-dx, yy-dy))
        canvas.alpha_composite(body)
        frames.append(canvas)
    return frames


def planted(source):
    yy, xx = np.mgrid[:CELL[1], :CELL[0]].astype(np.float32)
    upper = np.clip((120-yy)/100, 0, 1)
    frames = []
    for index in range(COUNT):
        phase = index*math.tau/COUNT
        mx = xx-.65*math.sin(phase)*upper
        my = yy-.4*(1-math.cos(phase))*upper
        frames.append(sample(premul(source), mx, my))
    return frames


def speech_frames(source, name):
    profile = MOUTHS[name]
    yy, xx = np.mgrid[:CELL[1], :CELL[0]].astype(np.float32)
    left, right = profile['corners']
    fraction = np.clip((xx-left)/(right-left), 0, 1)
    crease = np.interp(fraction, np.linspace(0, 1, 5), profile['crease'])
    joined = np.sin(math.pi*fraction)**2
    guard = np.exp(-((yy-crease)/4)**4)
    paint = premul(source)
    original = np.array(source)
    mouth_region = (xx >= left-2) & (xx <= right+2) & (abs(yy-crease) < 8)
    frames = [source.copy()]
    for level in range(1, 6):
        for shape in range(3):
            aperture = profile['aperture']*level/5
            contour = joined**(1.8 if shape == 1 else .8 if shape == 2 else 1)
            upper, lower = crease-.25*aperture*contour, crease+.75*aperture*contour
            sy = np.where(yy < upper, yy+(crease-upper)*guard,
                          np.where(yy > lower, yy-(lower-crease)*guard, crease))
            spread = (-.05 if shape == 1 else .04 if shape == 2 else 0)*level/5
            sx = xx-(xx-(left+right)/2)*spread*joined*guard
            pixels = np.array(sample(paint, sx, sy))
            pixels[~mouth_region] = original[~mouth_region]
            pixels[:, :, 3] = original[:, :, 3]
            frames.append(Image.fromarray(pixels))
    return frames


def performance(source, name, kind):
    yy, xx = np.mgrid[:CELL[1], :CELL[0]].astype(np.float32)
    neck = {'heiko': 88, 'inga': 86, 'schwabingen': 70}[name]
    head = np.clip((neck-yy)/20, 0, 1)
    torso = np.clip((140-yy)/60, 0, 1)
    paint = premul(source)
    frames = []
    for index in range(COUNT):
        phase = index/(COUNT-1) if kind == 'greet' else index/COUNT
        wave = math.sin(math.pi*phase) if kind == 'greet' else math.sin(math.tau*phase)
        dx = head*wave*(.75 if kind == 'look' else .25)+torso*.15*math.sin(math.tau*phase)
        dy = head*wave*(1 if kind == 'greet' else .35)
        frames.append(sample(paint, xx-dx, yy-dy))
    return frames


def build(names=NAMES):
    DEST.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SOURCE).convert('RGBA')
    manifest_path = DEST / 'manifest.json'
    records = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    for row, name in enumerate(NAMES):
        if name not in names:
            continue
        poses = []
        for column in range(3):
            panel = sheet.crop((column*sheet.width//3, row*sheet.height//3,
                                (column+1)*sheet.width//3, (row+1)*sheet.height//3))
            panel = body_matte(panel)
            box = panel.getbbox()
            if box is None:
                raise ValueError('Empty source view')
            poses.append(panel.crop(box))
        scale = 170/max(p.height for p in poses)
        registered = []
        for pose in poses:
            resized = pose.resize((round(pose.width*scale), round(pose.height*scale)), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', CELL)
            canvas.alpha_composite(resized, ((CELL[0]-resized.width)//2, BASELINE-resized.height))
            registered.append(canvas)
        front, right, back = registered
        left = ImageOps.mirror(right)
        for d, pose in zip(('down', 'right', 'up', 'left'), (front, right, back, left)):
            pose.save(QA / f'{name}-{d}-source.png')
        directions = (front, right, back, left)
        rows = [walks(p, d, row == 2) for p, d in zip(directions, ('down', 'right', 'up', 'left'))]
        rows += [planted(front), speech_frames(front, name), performance(front, name, 'listen'),
                 performance(front, name, 'greet'), performance(front, name, 'look')]
        atlas = Image.new('RGBA', (CELL[0]*COUNT, CELL[1]*len(rows)))
        for r, frames in enumerate(rows):
            for c, frame in enumerate(frames):
                atlas.alpha_composite(frame, (c*CELL[0], r*CELL[1]))
        target = DEST / f'{name}.webp'
        atlas.save(target, lossless=True, method=6)
        mobile = np.array(atlas.resize((atlas.width//2, atlas.height//2), Image.Resampling.LANCZOS))
        mobile[mobile[:, :, 3] < 12] = 0
        Image.fromarray(mobile).save(DEST / f'{name}-mobile.webp', lossless=True, method=6)
        encoded = Image.open(target).convert('RGBA')
        frame_checks = []
        for r in range(len(rows)):
            ordered = Image.new('RGBA', (CELL[0]*4, CELL[1]*4), (231, 232, 227, 255))
            dark = Image.new('RGBA', ordered.size, (30, 33, 36, 255))
            hashes = set()
            for c in range(COUNT):
                frame = encoded.crop((c*CELL[0], r*CELL[1], (c+1)*CELL[0], (r+1)*CELL[1]))
                hashes.add(hashlib.sha256(frame.tobytes()).hexdigest())
                box = frame.getbbox()
                if not box or box[0] < 2 or box[1] < 2 or box[2] > CELL[0]-2 or box[3] > CELL[1]-2:
                    raise ValueError(f'{name} row {r} frame {c} lacks alpha gutter')
                position = ((c%4)*CELL[0], (c//4)*CELL[1])
                ordered.alpha_composite(frame, position)
                dark.alpha_composite(frame, position)
            ordered.save(QA / f'{name}-row-{r}-ordered.png')
            dark.save(QA / f'{name}-row-{r}-dark.png')
            frame_checks.append({'row': r, 'distinctDecodedFrames': len(hashes)})
        board = Image.new('RGBA', (CELL[0]*4, CELL[1]*len(rows)), (231, 232, 227, 255))
        for r, frames in enumerate(rows):
            for c, index in enumerate((0, 4, 8, 12)):
                board.alpha_composite(frames[index], (c*CELL[0], r*CELL[1]))
        board.save(QA / f'{name}-contacts.png')
        motion = []
        for frame in rows[3]:
            background = Image.new('RGBA', CELL, (231, 232, 227, 255))
            background.alpha_composite(frame)
            motion.append(background.convert('RGB'))
        motion[0].save(QA / f'{name}-walk.gif', save_all=True, append_images=motion[1:], duration=50, loop=0)
        records[name] = {'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                         'rows': ['down', 'right', 'up', 'left', 'idle', 'talk', 'listen', 'greet', 'look'], 'frames': COUNT,
                         'mouthProfile': dict(MOUTHS[name], sourceSha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                                              facing='front', modes=['open', 'round', 'spread'], closedFrame=0),
                         'cell': CELL, 'pivot': [64, BASELINE],
                         'distancePerCycle': 4*(4 if row == 2 else 9)*1.6/170/.02,
                         'groundSpeedCalibration': 'rig stance; encoded sole assessment in output/neighbors',
                         'bytes': target.stat().st_size, 'encodedFrameChecks': frame_checks}
    (DEST / 'manifest.json').write_text(json.dumps(records, indent=2)+'\n')
    print(json.dumps(records))


if __name__ == '__main__':
    build()
