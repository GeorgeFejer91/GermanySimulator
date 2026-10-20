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
COUNT = 32
BASELINE = 180
NAMES = ('heiko', 'inga', 'schwabingen', 'theodore')
CLIPS = [('down', 32), ('right', 32), ('up', 32), ('left', 32),
         ('idle', 8), ('talk', 16), ('listen', 8), ('greet', 16),
         ('look', 8), ('point', 24), ('call', 24), ('work', 24)]
GRID = (16, 16)
MOUTHS = {
    'heiko': {'corners': [57, 79], 'crease': [73.2, 72.8, 72.5, 72.8, 73.1], 'aperture': 1.9},
    'inga': {'corners': [60, 81], 'crease': [71.2, 71, 70.6, 70, 69.6], 'aperture': 1.8},
    'schwabingen': {'corners': [60, 83], 'crease': [55.5, 54.8, 54.4, 54.6, 55], 'aperture': 1.6},
    'theodore': {'corners': [55, 70], 'crease': [61.5, 62, 62.2, 62, 61.5], 'aperture': 1.4},
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


def planted(source, count=8):
    yy, xx = np.mgrid[:CELL[1], :CELL[0]].astype(np.float32)
    upper = np.clip((120-yy)/100, 0, 1)
    frames = []
    for index in range(count):
        phase = index*math.tau/count
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


def performance(source, name, kind, count=16):
    yy, xx = np.mgrid[:CELL[1], :CELL[0]].astype(np.float32)
    neck = {'heiko': 88, 'inga': 86, 'schwabingen': 70, 'theodore': 80}[name]
    head = np.clip((neck-yy)/20, 0, 1)
    torso = np.clip((140-yy)/60, 0, 1)
    paint = premul(source)
    frames = []
    for index in range(count):
        phase = index/(count-1) if kind == 'greet' else index/count
        wave = math.sin(math.pi*phase) if kind == 'greet' else math.sin(math.tau*phase)
        dx = head*wave*(.75 if kind == 'look' else .25)+torso*.15*math.sin(math.tau*phase)
        dy = head*wave*(1 if kind == 'greet' else .35)
        frames.append(sample(paint, xx-dx, yy-dy))
    return frames


def action_arc(source, name, kind, count=24):
    """A shoulder-pinned source-pixel arm, with anticipation, hold and recovery.

    The opaque torso and head never crossfade. The arm is cut along the existing
    sleeve seam, with a small shoulder overlap; its painted hand travels rigidly.
    """
    yy, xx = np.mgrid[:CELL[1], :CELL[0]].astype(np.float32)
    pivot = {'heiko': (99, 105), 'inga': (98, 107),
             'schwabingen': (104, 91), 'theodore': (95, 106)}[name]
    px, py = pivot
    original = np.array(source)
    # This seam lies outside the torso, through the upper sleeve. Retain its
    # shoulder cap so the moving sleeve stays connected throughout the arc.
    # A round, fully painted sleeve cap is the hinge. A rectangular cut left
    # an angular flap beyond Inga's shoulder when the arm crossed her chest.
    cap = (xx-px)**2+(yy-py)**2 <= 10**2
    # Lower cut follows this painting's complete hand, never the garment below
    # it. Schwabingen's apron reaches farther sideways than her hand.
    hand_bottom = {'heiko': 145, 'inga': 145, 'schwabingen': 126, 'theodore': 135}[name]
    mask = ((xx >= px-6) & (yy >= py) | cap) & (yy < hand_bottom)
    if name == 'schwabingen':
        seam = np.interp(yy, [82, 96, 103, 109, 116, 124, 126], [97, 97, 101, 104, 106, 110, 111])
        cap = (xx-px)**2+(yy-py)**2 <= 8**2
        mask = ((xx >= seam) & (yy >= py) | cap) & (yy < hand_bottom)
    # Below the cuff, follow the actual hand silhouette instead of a vertical
    # cut: trousers/apron can extend past the wrist's inner edge. Including
    # that garment strip created a dark spur beside the raised hand.
    rgb = original[:, :, :3].astype(float)
    skin = (xx >= px-7) & (yy >= py+8) & (yy < hand_bottom) & (original[:, :, 3] > 80)
    skin &= (rgb[:, :, 0] > 150) & (rgb[:, :, 1] > 80) & (rgb[:, :, 0] > rgb[:, :, 1]*1.18)
    sy = np.where(skin)[0]
    if not len(sy):
        raise ValueError(f'No registered hand silhouette: {name}')
    if name != 'schwabingen':
        seam = np.full(CELL[1], px-6, dtype=float)
        last = px-6
        for y in range(int(sy.min()), hand_bottom):
            candidates = np.flatnonzero(skin[y])
            if len(candidates):
                x = int(candidates.min())
                while x > px-8 and original[y, x-1, 3] >= 12:
                    x -= 1
                if x > px-8:
                    last = x
            seam[y] = last
        below_cuff = yy >= int(sy.min())
        mask = np.where(below_cuff, (xx >= seam[:, None]) & (yy < hand_bottom), mask)
    # Reconstruct the torso hidden by the resting arm independently from the
    # arm cut. Its hem must remain complete when the hand crosses the chest.
    bounds = {
        'heiko': ([91, 105, 120, 134, 145], [102, 99, 97, 97, 95]),
        'inga': ([99, 107, 120, 134, 145], [102, 98, 96, 96, 95]),
        'schwabingen': ([78, 91, 100, 110, 126], [105, 102, 100, 104, 111]),
        'theodore': ([92, 106, 114, 121, 135], [94, 90, 86, 85, 87]),
    }[name]
    torso_edge = np.interp(yy, *bounds)
    rx, ry = (19, 15) if name == 'theodore' else (28, 20) if name == 'schwabingen' else (26, 20)
    oval = (px-10)+rx*np.sqrt(np.maximum(0, 1-((yy-(py-4))/ry)**2))
    edge = np.maximum(torso_edge, oval)
    erase = mask | ((yy >= bounds[0][0]) & (yy < int(sy.min())) & (xx > edge))
    layer = original.copy()
    layer[~mask] = 0
    base = original.copy()
    base[erase] = 0
    # Adjacent garment paint fills the concealed torso; the upper sleeve keeps
    # its own paint within a rounded joint outline. This avoids both a square
    # shoulder notch and apron/hair pixels migrating onto the moving arm.
    backing = erase & (xx <= edge) & (original[:, :, 3] > 0)
    if name == 'theodore':
        backing &= yy < 121
    mirror_x = np.clip(np.rint(2*(px-9)-xx).astype(int), 0, CELL[0]-1)
    patch = original[yy.astype(int), mirror_x].copy()
    patch[yy < py-6] = original[yy < py-6]
    upper = (xx > torso_edge) & (yy < int(sy.min()))
    patch[upper] = original[upper]
    base[backing] = patch[backing]
    paint = premul(Image.fromarray(layer))
    frames = []
    for index in range(count):
        p = index/(count-1)
        smooth = lambda t: np.clip(t, 0, 1)**2*(3-2*np.clip(t, 0, 1))
        if p < .13:
            amount = (-.02 if name == 'schwabingen' else -.05)*math.sin(math.pi*p/.13)
        elif p < .42:
            amount = float(smooth((p-.13)/.29))
        elif p < .68:
            amount = 1
        else:
            amount = 1-float(smooth((p-.68)/.32))
        if index in (0, count-1):
            frames.append(source.copy())
            continue
        angle = amount*math.radians(132 if kind == 'call' else 64)
        co, si = math.cos(angle), math.sin(angle)
        sx = px+co*(xx-px)+si*(yy-py)
        sy = py-si*(xx-px)+co*(yy-py)
        arm = sample(paint, sx, sy)
        frame = Image.fromarray(base.copy())
        frame.alpha_composite(arm)
        frames.append(body_matte(frame))
    return frames


def chore(source, name, count=24):
    """Keep planted soles, one prop, and continuous connected working paint."""
    yy, xx = np.mgrid[:CELL[1], :CELL[0]].astype(np.float32)
    paint = premul(source)
    frames = []
    for index in range(count):
        phase = index*math.tau/count
        if name == 'heiko':
            # The registered profile's sponge, gripping hand and forearm share
            # a circular wipe. The shoulder is stationary, the sleeve bends.
            arm = np.clip((xx-53)/34, 0, 1)*np.exp(-((yy-106)/27)**6)
            dx = arm*2.4*math.sin(phase)
            dy = arm*3.3*(1-math.cos(phase))
        elif name == 'schwabingen':
            # Move the staff and both grips together around its ground contact.
            line = 69+(yy-88)*.34
            shaft = np.exp(-((xx-line)/15)**4)*np.clip((yy-75)/12, 0, 1)
            dx = shaft*(180-yy)*.038*math.sin(phase)
            dy = shaft*.3*(1-math.cos(phase))
        else:
            arm = np.clip((xx-77)/21, 0, 1)*np.exp(-((yy-111)/26)**6)
            dx = arm*1.8*math.sin(phase)
            dy = arm*.8*(1-math.cos(phase))
        frames.append(sample(paint, xx-dx, yy-dy))
    return frames


def source_views(name, row):
    path = SOURCE if name != 'theodore' else SOURCE.with_name('theodore-directions.png')
    sheet = Image.open(path).convert('RGBA')
    source_rows = 1 if name == 'theodore' else 3
    source_row = 0 if name == 'theodore' else row
    poses = []
    for column in range(3):
        panel = sheet.crop((column*sheet.width//3, source_row*sheet.height//source_rows,
                            (column+1)*sheet.width//3, (source_row+1)*sheet.height//source_rows))
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
    return path, registered


def work_source(name, row, front):
    if name == 'theodore':
        return front.copy()
    sheet = Image.open(SOURCE.with_name('chore-poses.png')).convert('RGBA')
    panel = body_matte(sheet.crop((row*sheet.width//3, 0, (row+1)*sheet.width//3, sheet.height)))
    panel = panel.crop(panel.getbbox())
    scale = min(170/panel.height, 112/panel.width)
    resized = panel.resize((round(panel.width*scale), round(panel.height*scale)), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', CELL)
    canvas.alpha_composite(resized, ((CELL[0]-resized.width)//2, BASELINE-resized.height))
    return canvas


def build(names=NAMES):
    DEST.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    manifest_path = DEST / 'manifest.json'
    records = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    for row, name in enumerate(NAMES):
        if name not in names:
            continue
        source_path, registered = source_views(name, row)
        front, right, back = registered
        left = ImageOps.mirror(right)
        for d, pose in zip(('down', 'right', 'up', 'left'), (front, right, back, left)):
            pose.save(QA / f'{name}-{d}-source.png')
        directions = (front, right, back, left)
        rows = [walks(p, d, row == 2) for p, d in zip(directions, ('down', 'right', 'up', 'left'))]
        work = work_source(name, row, front)
        work.save(QA / f'{name}-work-source.png')
        rows += [planted(front), speech_frames(front, name), performance(front, name, 'listen', 8),
                 performance(front, name, 'greet'), performance(front, name, 'look', 8),
                 action_arc(front, name, 'point'), action_arc(front, name, 'call'), chore(work, name)]
        atlas = Image.new('RGBA', (CELL[0]*GRID[0], CELL[1]*GRID[1]))
        offsets = []
        offset = 0
        for r, frames in enumerate(rows):
            assert len(frames) == CLIPS[r][1]
            offsets.append(offset)
            for c, frame in enumerate(frames):
                slot = offset+c
                atlas.alpha_composite(frame, ((slot%GRID[0])*CELL[0], (slot//GRID[0])*CELL[1]))
            offset += len(frames)
        assert offset == GRID[0]*GRID[1]
        cleaned = np.array(atlas)
        cleaned[cleaned[:, :, 3] < 12] = 0
        atlas = Image.fromarray(cleaned)
        target = DEST / f'{name}.webp'
        atlas.save(target, lossless=True, exact=True, method=6)
        mobile = np.array(atlas.resize((atlas.width//2, atlas.height//2), Image.Resampling.LANCZOS))
        mobile[mobile[:, :, 3] < 12] = 0
        Image.fromarray(mobile).save(DEST / f'{name}-mobile.webp', lossless=True, exact=True, method=6)
        frame_checks = []
        for variant, factor in (('', 1), ('-mobile', 2)):
            encoded_path = DEST / f'{name}{variant}.webp'
            encoded = Image.open(encoded_path).convert('RGBA')
            cw, ch = CELL[0]//factor, CELL[1]//factor
            frames_dir = QA / f'{name}{variant}-frames'
            frames_dir.mkdir(exist_ok=True)
            for r, (_, count) in enumerate(CLIPS):
                ordered = Image.new('RGBA', (cw*8, ch*math.ceil(count/8)), (231, 232, 227, 255))
                dark = Image.new('RGBA', ordered.size, (30, 33, 36, 255))
                hashes, decoded, motion = set(), [], []
                for c in range(count):
                    slot = offsets[r]+c
                    x, y = (slot%GRID[0])*cw, (slot//GRID[0])*ch
                    frame = encoded.crop((x, y, x+cw, y+ch))
                    hashes.add(hashlib.sha256(frame.tobytes()).hexdigest())
                    box = frame.getbbox()
                    if not box or box[0] < 1 or box[1] < 1 or box[2] > cw-1 or box[3] > ch-1:
                        raise ValueError(f'{name}{variant} row {r} frame {c} lacks alpha gutter')
                    position = ((c%8)*cw, (c//8)*ch)
                    ordered.alpha_composite(frame, position)
                    dark.alpha_composite(frame, position)
                    frame.save(frames_dir / f'{r:02}-{c:02}.png')
                    decoded.append(premul(frame))
                    background = Image.new('RGBA', (cw, ch), (231, 232, 227, 255))
                    background.alpha_composite(frame)
                    motion.append(background.convert('RGB'))
                ordered.save(QA / f'{name}{variant}-row-{r}-ordered.png')
                dark.save(QA / f'{name}{variant}-row-{r}-dark.png')
                motion[0].save(QA / f'{name}{variant}-row-{r}-motion.gif', save_all=True,
                               append_images=motion[1:], duration=25 if r < 4 else 60, loop=0)
                changes = [float(np.abs(decoded[(i+1)%count]-decoded[i]).mean()) for i in range(count)]
                frame_checks.append({'variant': variant or 'desktop', 'row': r,
                                     'distinctDecodedFrames': len(hashes), 'maxChange': max(changes),
                                     'seamChange': changes[-1]})
        board = Image.new('RGBA', (CELL[0]*4, CELL[1]*len(rows)), (231, 232, 227, 255))
        for r, frames in enumerate(rows):
            for c, index in enumerate((0, len(frames)//4, len(frames)//2, len(frames)*3//4)):
                board.alpha_composite(frames[index], (c*CELL[0], r*CELL[1]))
        board.save(QA / f'{name}-contacts.png')
        motion = []
        for frame in rows[3]:
            background = Image.new('RGBA', CELL, (231, 232, 227, 255))
            background.alpha_composite(frame)
            motion.append(background.convert('RGB'))
        motion[0].save(QA / f'{name}-walk.gif', save_all=True, append_images=motion[1:], duration=25, loop=0)
        records[name] = {'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                         'rows': [clip[0] for clip in CLIPS], 'frames': COUNT, 'grid': GRID,
                         'clips': {clip[0]: {'offset': offsets[i], 'count': clip[1]} for i, clip in enumerate(CLIPS)},
                         'mouthProfile': dict(MOUTHS[name], sourceSha256=hashlib.sha256(source_path.read_bytes()).hexdigest(),
                                              facing='front', modes=['open', 'round', 'spread'], closedFrame=0),
                         'cell': CELL, 'pivot': [64, BASELINE],
                         'figureWorldHeight': 1.6*(.68 if name == 'theodore' else 1),
                         'distancePerCycle': 4*(4 if row == 2 else 9)*1.6*(.68 if name == 'theodore' else 1)/170/.02,
                         'groundSpeedCalibration': 'rig stance; encoded sole assessment in output/neighbors',
                         'bytes': target.stat().st_size,
                         'mobileBytes': (DEST / f'{name}-mobile.webp').stat().st_size,
                         'decodedRgbaBytes': atlas.width*atlas.height*4,
                         'mobileDecodedRgbaBytes': atlas.width*atlas.height,
                         'encodedFrameChecks': frame_checks}
    (DEST / 'manifest.json').write_text(json.dumps(records, indent=2)+'\n')
    if 'heiko' in names and (ROOT / 'assets/sprite-sources/neighbors/heiko-notebook-keys.png').exists():
        import runpy
        runpy.run_path(str(ROOT / 'tools/build-neighbor-notebook.py'))['build']()
        records = json.loads(manifest_path.read_text())
    print(json.dumps({name: {k: value for k, value in record.items() if k in
                     ('bytes', 'mobileBytes', 'decodedRgbaBytes', 'distancePerCycle')}
                     for name, record in records.items()}, indent=2))


if __name__ == '__main__':
    import sys
    build(sys.argv[1:] or NAMES)
