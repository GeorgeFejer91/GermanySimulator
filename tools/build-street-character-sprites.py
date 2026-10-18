"""Bake candidate street paint with fixed family registration, never approve it."""
from pathlib import Path
import argparse
import hashlib
import io
import json
import math
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label, find_objects, gaussian_filter

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / '.agents/skills/animate-2d-characters/scripts'
sys.path.insert(0, str(SKILL))
import painted_walk as paint

SPEC = ROOT / 'assets/sprite-sources/street-quiz/animation-spec.json'
DEST = ROOT / 'assets/characters/street'
QA = ROOT / 'output/street-cast/animation'
CLIPS = [('down', 16, .8), ('right', 16, .8), ('up', 16, .8), ('left', 16, .8),
         ('idle', 8, 2), ('greet', 16, 1), ('wait', 8, 2), ('work', 16, 1.6),
         ('review', 16, 1.1), ('success', 16, .9), ('failure', 16, 1), ('look', 8, .8)]
TRAVEL = {'down': (0, 1), 'right': (1, 0), 'up': (0, -1), 'left': (-1, 0)}


def planned_clips(person):
    return CLIPS + ([('talk', 7, 1)] if person['mouth'].get('registration') else [])


def digest_bytes(content):
    return hashlib.sha256(content).hexdigest()


def encoded(image, format='PNG', **options):
    result = io.BytesIO()
    image.save(result, format=format, **options)
    return result.getvalue()


def source_components(source):
    labels, _ = label(np.asarray(source)[:, :, 3] >= 20)
    components = []
    for index, region in enumerate(find_objects(labels), 1):
        if region is None or np.count_nonzero(labels[region] == index) < 1000:
            continue
        components.append([region[1].start, region[0].start, region[1].stop, region[0].stop])
    return components


def register_source(source, view, scale, baseline):
    bounds = view['component_bounds']
    crop = source.crop((bounds[0]-2, bounds[1]-2, bounds[2]+2, bounds[3]+2))
    pivot = np.asarray(view['source_pivot'], dtype=float)
    origin = np.asarray([256, baseline]) - pivot * scale
    yy, xx = np.mgrid[:512, :512]
    sx = (xx-origin[0])/scale - bounds[0]+2
    sy = (yy-origin[1])/scale - bounds[1]+2
    return paint.unpack(paint.sample(paint.premul(crop), sx, sy)), origin


def registered_landmarks(view, scale, origin):
    result = dict(view['landmarks'])
    for key in ['waist', 'hip']:
        result[key] = result[key]*scale + origin[1]
    result['mid'] = result['mid']*scale + origin[0]
    for key in ['hem', 'knee', 'sock', 'ankle']:
        result[key] = [value*scale+origin[1] for value in result[key]]
    for key in ['centres', 'foot_centres']:
        result[key] = [value*scale+origin[0] for value in result[key]]
    result['split_path_xy'] = [[x*scale+origin[0], y*scale+origin[1]] for x, y in result['split_path_xy']]
    return result


def planted_action(source, name, count, landmarks):
    yy, xx = np.mgrid[:512, :512].astype(float)
    neck, hip = landmarks['neck_y'], landmarks['hip_y']
    torso = np.clip((hip-yy)/(hip-neck), 0, 1)
    torso = torso*torso*(3-2*torso)
    head = np.clip((neck-yy)/32, 0, 1)
    pixels = paint.premul(source)
    arm = landmarks.get('arm')
    arm_weight = np.zeros((512, 512))
    if arm:
        mask = Image.new('L', (512, 512))
        ImageDraw.Draw(mask).polygon([tuple(point) for point in arm['polygon']], fill=255)
        arm_weight = gaussian_filter(np.asarray(mask, dtype=float)/255, sigma=arm['feather_pixels'])
    frames = []
    for index in range(count):
        phase = index/count if name in ('idle', 'wait') else index/(count-1)
        if name in ('idle', 'wait'):
            wave = math.sin(math.tau*phase)
        else:
            attack = min(1, phase/landmarks.get('attack_fraction', .32))
            release = min(1, (1-phase)/landmarks.get('recovery_fraction', .32))
            wave = math.sin(math.pi/2*attack)**2*math.sin(math.pi/2*release)**2
        dx = torso*wave*landmarks['sway_pixels']
        dy = head*wave*landmarks['nod_pixels']
        if landmarks.get('head_radians'):
            px, py = landmarks['head_pivot']
            angle = landmarks['head_radians']*wave
            sx = math.cos(angle)*(xx-px)+math.sin(angle)*(yy-py)+px
            sy = -math.sin(angle)*(xx-px)+math.cos(angle)*(yy-py)+py
            neck_blend = np.clip((neck+8-yy)/32, 0, 1)
            neck_blend = neck_blend*neck_blend*(3-2*neck_blend)
            dx += (xx-sx)*neck_blend
            dy += (yy-sy)*neck_blend
        if arm:
            angle = arm['radians']*wave
            px, py = arm['pivot']
            sx = math.cos(angle)*(xx-px)+math.sin(angle)*(yy-py)+px
            sy = -math.sin(angle)*(xx-px)+math.cos(angle)*(yy-py)+py
            dx += (xx-sx)*arm_weight
            dy += (yy-sy)*arm_weight
            reach = np.clip(np.hypot(xx-px, yy-py)/arm.get('lift_blend_pixels', 35), 0, 1)
            dy -= arm.get('lift_pixels', 0)*wave*arm_weight*reach
        if name == 'success':
            flight = np.clip((phase-.18)/.62, 0, 1)
            dy = dy-landmarks['lift_pixels']*math.sin(math.pi*flight)**2
            if phase < .18:
                dy += torso*3*math.sin(math.pi*phase/.18)
        if index == 0 or name not in ('idle', 'wait') and index == count-1:
            frame = source.copy()
        else:
            frame = paint.unpack(paint.sample(pixels, xx-dx, yy-dy))
        frames.append(frame)
    return frames


def export_cell(source, spec, compact=False):
    width, height = [n//2 for n in spec['cell']] if compact else spec['cell']
    ratio = .5 if compact else 1
    scale = spec['figureHeight']/spec['working']['figureHeight']*ratio
    yy, xx = np.mgrid[:height, :width]
    sx = (xx-spec['pivot'][0]*ratio)/scale+256
    sy = (yy-spec['pivot'][1]*ratio)/scale+spec['working']['baseline']
    return paint.unpack(paint.sample(paint.premul(source), sx, sy))


def speech_candidate(source, profile, opening, shape='open'):
    if opening == 0:
        return source.copy()
    yy, xx = np.mgrid[:512, :512].astype(float)
    points = profile['crease_xy']
    left, right = points[0][0], points[-1][0]
    fraction = np.clip((xx-left)/(right-left), 0, 1)
    crease = np.interp(xx, [p[0] for p in points], [p[1] for p in points])
    joined = np.sin(math.pi*fraction)**(2.5 if shape == 'round' else 2)
    guard = np.exp(-((yy-crease)/5)**4)
    aperture = profile['max_opening_pixels']*opening*joined
    upper, lower = crease-.25*aperture, crease+.75*aperture
    sy = np.where(yy < upper, yy+(crease-upper)*guard,
                  np.where(yy > lower, yy-(lower-crease)*guard, crease))
    spread = -.04 if shape == 'round' else .025 if shape == 'spread' else 0
    sx = xx-(xx-(left+right)/2)*spread*opening*joined*guard
    region = (xx > left) & (xx < right) & (abs(yy-crease)<9)
    original = np.asarray(source).copy()
    moved = np.asarray(paint.unpack(paint.sample(paint.premul(source), sx, sy)))
    original[region] = moved[region]
    original[:, :, 3] = np.asarray(source)[:, :, 3]
    return Image.fromarray(original)


def write_speech_preview(neutral, spec, person, directory):
    profile = person['mouth'].get('candidateProfile')
    if not profile:
        return
    directory = directory / 'speech-candidates'
    directory.mkdir(parents=True, exist_ok=True)
    frames = []
    for name, opening, shape in [('inactive', 0, 'open'), ('owned-closed', 0, 'open'), ('open', 1, 'open'), ('round', 1, 'round'), ('spread', 1, 'spread')]:
        frame = speech_candidate(neutral, profile, opening, shape)
        frame.save(directory / f'{name}-native.png')
        crop = frame.crop((225,212,310,250))
        crop.resize((680,304), Image.Resampling.NEAREST).save(directory / f'{name}-mouth-8x.png')
        final = export_cell(frame, spec)
        final.save(directory / f'{name}-game.png')
        frames.append(final)
    opaque_board(frames, 5, '#eee8db', 3).save(directory / 'speech-game-extremes.png')
    (directory / 'profile.json').write_text(json.dumps({'status':'candidate-not-approved', 'registration':profile,
        'sourceSha256':person['sourceSha256'], 'neutralSha256':digest_bytes(encoded(neutral)),
        'finding':'Original asymmetric crease only; no generated teeth/cavity. Awaiting exact native and city render review.'}, indent=2)+'\n', encoding='utf8')


def opaque_board(frames, columns, background, enlarged=1):
    width, height = frames[0].size
    rows = math.ceil(len(frames)/columns)
    board = Image.new('RGB', (columns*width, rows*(height+14)), background)
    draw = ImageDraw.Draw(board)
    for index, frame in enumerate(frames):
        x, y = index % columns*width, index//columns*(height+14)
        board.paste(frame, (x, y), frame)
        draw.text((x+3, y+height), str(index), fill='#e5dfd0' if background == '#292b2e' else '#252525')
    if enlarged != 1:
        board = board.resize((board.width*enlarged, board.height*enlarged), Image.Resampling.NEAREST)
    return board


def verify_cell(frame, name, index):
    alpha = np.asarray(frame)[:, :, 3]
    if alpha.max() == 0:
        raise ValueError(f'{name}/{index}: empty encoded frame')
    if np.any(alpha[:2]) or np.any(alpha[-2:]) or np.any(alpha[:, :2]) or np.any(alpha[:, -2:]):
        raise ValueError(f'{name}/{index}: no two-pixel transparent cell gutter')
    labels, _ = label(alpha >= 128)
    component_sizes = np.bincount(labels.ravel())[1:]
    return {'visibleBounds': list(frame.getbbox()), 'alphaComponents': sorted(component_sizes.tolist(), reverse=True)[:5]}


def qa_export(directory, encoded_atlas, spec, character, clips, source_refs, compact):
    atlas = Image.open(io.BytesIO(encoded_atlas)).convert('RGBA')
    variant = 'mobile' if compact else 'desktop'
    cell = [n//2 for n in spec['cell']] if compact else spec['cell']
    columns = 16
    records, diagnostics, distinct = [], {}, {}
    directory = directory / variant
    directory.mkdir(parents=True, exist_ok=True)
    for name, metadata in clips.items():
        frames, motion_durations = [], []
        reference_name = name if name in TRAVEL else 'down'
        source_ref = source_refs[reference_name]
        reference = Image.open(source_ref).convert('RGBA')
        neutral = export_cell(reference, spec, compact)
        for index in range(metadata['count']):
            slot = metadata['offset']+index
            x, y = slot % columns*cell[0], slot//columns*cell[1]
            frame = atlas.crop((x, y, x+cell[0], y+cell[1]))
            frame_path = directory / f'{name}-{index:02}.png'
            frame.save(frame_path)
            observation = verify_cell(frame, name, index)
            diagnostics[f'{name}-{index:02}'] = observation
            comparison = Image.new('RGBA', (cell[0]*2, cell[1]))
            comparison.alpha_composite(neutral)
            comparison.alpha_composite(frame, (cell[0], 0))
            comparison_path = directory / f'{name}-{index:02}-source-comparison.png'
            opaque_board([comparison], 1, '#eee8db').save(comparison_path)
            records.append({'id': f'{name}-{index:02}', 'file': str(frame_path.relative_to(ROOT)).replace('\\', '/'),
                            'sha256': paint.digest(frame_path), 'row': slot//columns, 'col': slot % columns,
                            'reference_ids': [reference_name],
                            'comparison': str(comparison_path.relative_to(ROOT)).replace('\\', '/')})
            frames.append(frame)
            motion_durations.append(round(metadata['seconds']*1000/metadata['count']/10)*10)
        opaque_board(frames, 8, '#eee8db').save(directory / f'{name}-native-light.png')
        distinct[name] = len({frame.tobytes() for frame in frames})
        opaque_board(frames, 8, '#292b2e', 3).save(directory / f'{name}-enlarged-dark.png')
        opaque_board(frames, 8, '#eee8db', 3).save(directory / f'{name}-enlarged-light.png')
        motion = [opaque_board([frame], 1, '#eee8db') for frame in frames]
        if name not in TRAVEL and name not in ('idle', 'wait'):
            motion.extend([motion[-1]]*4)
            motion_durations.extend([100]*4)
        motion[0].save(directory / f'{name}-motion.gif', save_all=True, append_images=motion[1:], duration=motion_durations, loop=0, disposal=2)
    manifest = {'export': {'file': str((DEST / f'{character}-candidate{"-mobile" if compact else ""}.webp').relative_to(ROOT)).replace('\\', '/'), 'sha256': digest_bytes(encoded_atlas)},
                'cell_size_xy': cell,
                'movement_rows': [{'row': row, 'count': min(16, len(records)-row*16)} for row in range(math.ceil(len(records)/16))],
                'references': [{'id': name, 'file': str(path.relative_to(ROOT)).replace('\\', '/'), 'sha256': paint.digest(path)} for name, path in source_refs.items()],
                'frames': records, 'diagnostics': diagnostics, 'reviewStatus': 'NOT REVIEWED'}
    (directory / 'final-frame-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf8')
    return distinct


def build(character, check=False):
    spec = json.loads(SPEC.read_text(encoding='utf8'))
    if character not in spec['characters']:
        raise ValueError(f'No fitted source spec for {character}; complete pilot review before expanding')
    person = spec['characters'][character]
    source_path = ROOT / person['source']
    if paint.digest(source_path) != person['sourceSha256']:
        raise ValueError('Source bytes changed; refit and review its measured spec before rebuilding')
    source = Image.open(source_path).convert('RGBA')
    components = source_components(source)
    expected = [view['component_bounds'] for view in person['views'].values()]
    if sorted(components) != sorted(expected):
        raise ValueError('Complete source component bounds differ from fitted twelve-pose spec')
    scale = spec['working']['figureHeight']/person['sourceFigureHeight']
    registered, origins = {}, {}
    for name, view in person['views'].items():
        registered[name], origins[name] = register_source(source, view, scale, spec['working']['baseline'])
    frames, clips, rig_records = [], {}, {}
    directory = QA / character
    source_refs = {}
    if not check:
        directory.mkdir(parents=True, exist_ok=True)
        for name, reference in registered.items():
            path = directory / f'{name}-registered-source.png'
            reference.save(path)
            source_refs[name] = path
        registered['down'].crop((105,55,411,484)).save(directory / 'neutral-native-crop.png')
        write_speech_preview(registered['down'], spec, person, directory)
    for name, count, seconds in planned_clips(person):
        anchor = name if name in TRAVEL else 'down'
        if name in TRAVEL:
            view = person['views'][name]
            landmarks = registered_landmarks(view, scale, origins[name])
            try:
                sequence, rig_records[name] = paint.animate(registered[name], landmarks, TRAVEL[name], count=count, foreground=view['foreground'], strength=view['strength'])
            except ValueError as error:
                if hasattr(error, 'frame') and not check:
                    directory.mkdir(parents=True, exist_ok=True)
                    error.frame.save(directory / f'{name}-rejected-phase-{error.phase}.png')
                raise
        elif name == 'talk':
            sequence = [speech_candidate(registered['down'], person['mouth']['registration'], level/6) for level in range(7)]
        else:
            sequence = planted_action(registered[anchor], name, count, person['actions'][name])
        clips[name] = {'offset': len(frames), 'count': count, 'seconds': seconds}
        frames.extend(sequence)
    if len(frames)>192:
        raise ValueError('Candidate exceeds the compact 192-cell allocation')
    grid = [16, math.ceil(len(frames)/16)]
    variants, generated, distinct = {}, {}, {}
    standing_bytes = encoded(export_cell(registered['down'], spec), 'WEBP', lossless=True, quality=100, method=6, exact=True)
    standing_file = f'{character}-standing.webp'
    generated[DEST / standing_file] = standing_bytes
    for compact in (False, True):
        cell = [n//2 for n in spec['cell']] if compact else spec['cell']
        atlas = Image.new('RGBA', (cell[0]*grid[0], cell[1]*grid[1]))
        for index, frame in enumerate(frames):
            atlas.alpha_composite(export_cell(frame, spec, compact), (index % grid[0]*cell[0], index//grid[0]*cell[1]))
        if max(atlas.size)>2048 or atlas.width*atlas.height*4>16*1024*1024:
            raise ValueError('Candidate exceeds atlas dimension or decoded memory bound')
        content = encoded(atlas, 'WEBP', lossless=True, quality=100, method=6, exact=True)
        variant = 'mobile' if compact else 'desktop'
        file = f'{character}-candidate{"-mobile" if compact else ""}.webp'
        generated[DEST / file] = content
        variants[variant] = {'file': f'./assets/characters/street/{file}', 'sha256': digest_bytes(content),
                             'width': atlas.width, 'height': atlas.height, 'bytes': len(content), 'decodedBytes': atlas.width*atlas.height*4}
        if not check:
            distinct[variant] = qa_export(directory, content, spec, character, clips, source_refs, compact)
    manifest = {'schemaVersion': 1, 'status': 'candidate-unapproved', 'characters': {person['voiceId']: {
        'id': character, 'name': person['name'], 'cell': spec['cell'], 'pivot': spec['pivot'],
        'figureHeight': spec['figureHeight'], 'figureWorldHeight': spec['figureWorldHeight'], 'grid': grid,
        'clips': clips, 'variants': variants, 'sourceSha256': person['sourceSha256'], 'specSha256': paint.digest(SPEC),
        'review': person['review'], 'mouthStatus': person['mouth']['status']}}}
    if 'talk' in clips:
        manifest['characters'][person['voiceId']]['speech'] = {
            'clips': {'talk': {'offset': clips['talk']['offset'], 'count': clips['talk']['count']}},
            'method': 'media-energy-amplitude', 'profile': person['mouth']['registration'],
            'unregisteredViews': ['right', 'up', 'left'], 'phonemeAlignment': 'NOT RUN',
            'inactiveAndOwnedClosed': 'exact-down-neutral-source-paint'}
    if person.get('strideDistance'):
        manifest['characters'][person['voiceId']]['strideDistance'] = person['strideDistance']
    manifest['characters'][person['voiceId']]['standing'] = {
        'file': f'./assets/characters/street/{standing_file}', 'sha256': digest_bytes(standing_bytes),
        'width': spec['cell'][0], 'height': spec['cell'][1], 'bytes': len(standing_bytes),
        'sourceClip': 'idle', 'sourceFrame': 0}
    manifest_path = DEST / 'candidate-manifest.json'
    if manifest_path.exists():
        previous = json.loads(manifest_path.read_text(encoding='utf8'))
        previous['characters'].update(manifest['characters'])
        manifest = previous
    generated[manifest_path] = (json.dumps(manifest, indent=2)+'\n').encode('utf8')
    if check:
        stale = [str(path.relative_to(ROOT)) for path, content in generated.items() if not path.exists() or path.read_bytes()!=content]
        if stale:
            raise ValueError('Missing or stale candidate bytes: '+', '.join(stale))
    else:
        DEST.mkdir(parents=True, exist_ok=True)
        for path, content in generated.items():
            path.write_bytes(content)
        (directory / 'walk-rig-records.json').write_text(json.dumps(rig_records, indent=2)+'\n', encoding='utf8')
        (directory / 'build-report.json').write_text(json.dumps({'character': character, 'sourceSha256': person['sourceSha256'],
            'variants': variants, 'distinctCellCounts': distinct,
            'unresolved': ['Every encoded frame requires final visual review', 'Small source-bound gestures require native motion review', 'Exact sole speed calibration and runtime shoe-slide review missing',
                           'Phoneme alignment NOT RUN; only registered neutral talk uses media-energy amplitude',
                           'No integrated browser, physical device or listening evidence']}, indent=2)+'\n', encoding='utf8')
    print(json.dumps({'character': character, 'check': check, 'frames': len(frames), 'variants': variants}))


def build_parts(character, check=False):
    """Optional Hartmut experiment; existing atlas outputs are never replaced."""
    if character != 'hartmut-keller':
        raise ValueError('Only the fitted Hartmut painted-parts pilot is supported')
    spec = json.loads(SPEC.read_text(encoding='utf8'))
    person = spec['characters'][character]
    source = Image.open(ROOT/person['source']).convert('RGBA')
    if paint.digest(ROOT/person['source']) != person['sourceSha256']:
        raise ValueError('Source changed since fitting')
    directory = QA/character/'painted-parts-pilot-v4'
    native = []
    references = {}
    world_scale = spec['figureWorldHeight']/person['sourceFigureHeight']
    camera_forward = np.asarray([0., -10.5, -16.7]); camera_forward /= np.linalg.norm(camera_forward)
    camera_up = np.asarray([0., -camera_forward[2], camera_forward[1]])
    camera_position = np.asarray([0., 11.5, 14.])
    a, b = camera_up@(-camera_position), camera_forward@(-camera_position)

    def physical_y(source_y, sole=462):
        ratio = (a+(sole-source_y)*world_scale)/b
        return float((ratio*b-a)/(camera_up[1]-ratio*camera_forward[1]))

    heights = [physical_y(y) for y in [345, 395, 416]]
    body_scale = world_scale*float(camera_forward@(np.asarray([0., heights[0], 0.])-camera_position))/b
    skeleton = {'pelvisY': heights[0], 'legs': []}
    for centre in [101, 201]:
        rest = [np.asarray([(centre-150)*world_scale*float(camera_forward@(np.asarray([0., y, 0.])-camera_position))/b, y, 0.]) for y in heights]
        sole_x = (centre-150)*world_scale
        skeleton['legs'].append({'hip': rest[0].tolist(), 'soleX': sole_x,
            'ankleOffset': (rest[2]-np.asarray([sole_x, 0., 0.])).tolist(),
            'upperLength': float(np.linalg.norm(rest[1]-rest[0])), 'lowerLength': float(np.linalg.norm(rest[2]-rest[1]))})
    definition = {'schemaVersion': 1, 'format': 'gs-painted-parts', 'id': character,
        'sourceSha256': person['sourceSha256'], 'figureWorldHeight': spec['figureWorldHeight'],
        'reference': {'cell': spec['cell'], 'pivot': spec['pivot'], 'sourceScaleWorld': world_scale,
            'camera': {'position': camera_position.tolist(), 'right': [1, 0, 0], 'up': camera_up.tolist(), 'forward': camera_forward.tolist()}},
        'skeleton': skeleton, 'gait': {'excursionWorld': 35*world_scale, 'liftWorld': 8*world_scale,
            'baseHipDrop': .5*world_scale, 'maxHipDrop': 20*world_scale, 'strideDistance': 4*35*world_scale/.02},
        'views': {}, 'holds': ['All native four-view source joins and actions require visual review',
            'Production WebGL/Canvas/device/elevation/performance NOT RUN', 'Whole-body three-quarter turn paint missing',
            'Front neutral mouth only; no phoneme alignment', 'Action entry from phase-specific terminal requires review']}

    def add_texture(name, image, bounds, mask):
        pixels = np.asarray(image).copy()
        pixels[:, :, 3] = np.where(mask, pixels[:, :, 3], 0)
        pixels[pixels[:, :, 3] == 0] = 0
        cropped = Image.fromarray(pixels).crop(bounds)
        if not cropped.getbbox():
            raise ValueError('Empty native painted part: '+name)
        index = len(native)
        native.append((name, cropped))
        references[name] = {'sourceCrop': list(bounds), 'nativeSha256': digest_bytes(encoded(cropped))}
        return index

    def mesh(name, kind, vertices, uv_pixels, texture, triangles, **fields):
        return {'id': name, 'type': kind, 'vertices': vertices, 'uvs': uv_pixels,
                'triangles': triangles, '_texture': texture, **fields}

    def rectangle(bounds, map_vertex):
        left, top, right, bottom = bounds
        return [map_vertex(x, y) for y in [top, bottom] for x in [left, right]], [[0, 1, 2], [1, 3, 2]]

    yy, xx = np.mgrid[:source.height, :source.width]
    far_file = ROOT/'assets/sprite-sources/street-quiz/hartmut-keller-far-leg-layer-candidate.png'
    far = Image.open(far_file).convert('RGBA')
    definition['partSourceSha256'] = paint.digest(far_file)
    caps = {
        'down': ([30,55,85,115,140,150,160,185,215,245,277], [374,380,387,390,390,388,390,390,387,380,374]),
        'right': ([345,360,378,390,405,420,435,450,462,480,505,540], [379,379,393,400,404,404,400,394,391,391,388,379]),
        'up': ([640,660,690,720,738,760,790,820,842], [377,383,390,393,394,393,390,383,377]),
        'left': ([925,960,975,990,1005,1020,1035,1050,1065,1085,1118], [379,386,391,390,393,400,404,403,399,391,379])}
    boot_polygons = {
        'right': [(385,405),(439,405),(445,418),(457,426),(465,438),(466,449),(459,459),(446,462),(382,462),(370,455),(367,443),(373,432),(383,425)],
        'left': [(1020,405),(1082,405),(1086,424),(1096,435),(1097,454),(1080,463),(1010,463),(1002,458),(998,453),(998,447),(999,441),(1000,437),(1004,431),(1010,426),(1016,423)]}
    for direction in TRAVEL:
        view = person['views'][direction]
        left, top, right, sole = view['component_bounds']
        mid = view['source_pivot'][0]
        view_mask = (xx >= left)&(xx < right)&(yy >= top)&(yy < sole)
        cap = np.interp(xx, *caps[direction])
        upper_mask = view_mask&(yy <= cap)
        upper_bounds = [left-4, top-4, right+4, int(max(caps[direction][1]))+5]
        upper_index = add_texture(direction+'-upper', source, upper_bounds, upper_mask)
        upper_vertices, triangles = rectangle(upper_bounds, lambda x, y: [(x-mid)*body_scale, (345-y)*body_scale])
        upper_uv, _ = rectangle(upper_bounds, lambda x, y: [x-upper_bounds[0], y-upper_bounds[1]])
        parts = [mesh('upper', 'billboard', upper_vertices, upper_uv, upper_index, triangles)]
        definition['views'][direction] = {'sourceComponent': view['component_bounds'], 'sourcePivot': view['source_pivot'],
            'sourceScale': 1., 'parts': parts, 'propOwnership': 'All own source hands/radio/notebook remain in single upper/pelvis paint',
            'upperClips': {}, 'mouth': 'registered-neutral-front-only' if direction == 'down' else 'unregistered-closed'}
        if direction in ('down','up'):
            definition['views'][direction]['physicalLegToSourceSide'] = ['left','right'] if direction == 'down' else ['right','left']
        if direction in ('right', 'left'):
            cloth_centre = 430 if direction == 'right' else 1025
            shift = -40 if direction == 'right' else 555
            cloth = paint.unpack(paint.sample(paint.premul(far), (xx-shift-372.5)/(90/560), (yy-294.64285714285717)/(90/560)))
            definition['views'][direction]['clothReuse'] = {'source': str(far_file.relative_to(ROOT)).replace('\\','/'),
                'fixedScale': 90/560, 'sourceOrigin': [372.5,294.64285714285717], 'hostTranslationX': shift,
                'note': 'Complete garment part, original own-facing upper and whole boot; no reflection'}
            mask_image = Image.new('L', source.size)
            ImageDraw.Draw(mask_image).polygon(boot_polygons[direction], fill=255)
            boot_mask = (np.asarray(mask_image)>0)&view_mask
            boot_centre = 414 if direction == 'right' else 1050
            # The complete calf and its cuff share one painted garment. Bind
            # that same cuff rigidly to the boot instead of switching widths
            # to the narrower cuff from the neutral standing photograph.
            bare_boot = np.asarray(source).copy()
            bare_boot[:,:,3] = np.where(boot_mask&(yy>=418),bare_boot[:,:,3],0)
            cuff = np.asarray(cloth).copy()
            cuff[:,:,3] = np.where((yy>=405)&(yy<419),cuff[:,:,3],0)
            cuff_shift = int(boot_centre-cloth_centre)
            cuff = np.roll(cuff,cuff_shift,axis=1)
            boot_paint = Image.alpha_composite(Image.fromarray(bare_boot),Image.fromarray(cuff))
            boot_mask = np.asarray(boot_paint)[:,:,3]>0
            definition['views'][direction]['bootCuffBinding'] = {
                'source':str(far_file.relative_to(ROOT)).replace('\\','/'),
                'sourceBandY':[405,419],'translationToBootX':cuff_shift,
                'originalBootBandY':[418,sole],
                'note':'Same complete garment calf/cuff; one rigid own-facing boot/cuff part, no per-pose fitting'}
        for leg in range(2):
            if direction in ('down','up'):
                source_leg = leg if direction == 'down' else 1-leg
                centre = [101,201][source_leg] if direction == 'down' else [688,788][source_leg]
                own = xx < mid if source_leg == 0 else xx >= mid
                cloth = source
                # Original vest/black hem ends above y380 in these two views.
                # Move only the connected trousers below it; the upper source
                # retains the pelvis and the overlapping trouser root.
                cloth_mask = view_mask&own&(yy>=380)&(yy<411)
                boot_mask = view_mask&own&(yy>=405)
                boot_centre = centre
                boot_paint = source
            else:
                centre = cloth_centre
                cloth_mask = (yy>=345)&(yy<411)
            for name, sy, ey, region in [('thigh',345,395,cloth_mask&(yy<=401)), ('shin',395,416,cloth_mask&(yy>=389))]:
                masked = np.asarray(cloth).copy(); masked[:, :, 3] = np.where(region, masked[:, :, 3], 0)
                bounds = Image.fromarray(masked).getbbox()
                bounds = [bounds[0]-2,bounds[1]-2,bounds[2]+2,bounds[3]+2]
                texture = add_texture(f'{direction}-{leg}-{name}', cloth, bounds, region)
                vertices, triangles = rectangle(bounds, lambda x,y: [(y-sy)/(ey-sy), (x-centre)*world_scale*float(camera_forward@(np.asarray([0.,physical_y(y),0.])-camera_position))/b])
                uv, _ = rectangle(bounds, lambda x,y: [x-bounds[0],y-bounds[1]])
                parts.append(mesh(f'{leg}-{name}', 'bone-ribbon', vertices, uv, texture, triangles, leg=leg, bone='upper' if name=='thigh' else 'lower'))
            masked = np.asarray(boot_paint).copy();masked[:, :, 3] = np.where(boot_mask,masked[:, :, 3],0)
            bounds = Image.fromarray(masked).getbbox();bounds=[bounds[0]-2,bounds[1]-2,bounds[2]+2,sole]
            texture = add_texture(f'{direction}-{leg}-boot',boot_paint,bounds,boot_mask)
            rows = sorted(set([max(405,bounds[1]),416,sole]))
            vertices, uv = [], []
            for y in rows:
                wy = physical_y(y,sole)
                depth = float(camera_forward@(np.asarray([0.,wy,0.])-camera_position))/b
                for x in [bounds[0],bounds[2]]:
                    vertices.append([(x-boot_centre)*world_scale*depth,wy])
                    uv.append([x-bounds[0],y-bounds[1]])
            boot_triangles = []
            for row in range(len(rows)-1):
                start = row*2
                boot_triangles.extend([[start,start+1,start+2],[start+1,start+3,start+2]])
            parts.append(mesh(f'{leg}-boot','sole-upright',vertices,uv,texture,boot_triangles,leg=leg))
        if direction == 'down':
            scale = spec['working']['figureHeight']/person['sourceFigureHeight']
            neutral, origin = register_source(source,view,scale,spec['working']['baseline'])
            y,x=np.mgrid[upper_bounds[1]:upper_bounds[3],upper_bounds[0]:upper_bounds[2]]
            mask = upper_mask[upper_bounds[1]:upper_bounds[3],upper_bounds[0]:upper_bounds[2]]
            for name,count,seconds in planned_clips(person):
                if name in TRAVEL:
                    continue
                if name == 'talk':
                    sequence = [speech_candidate(neutral,person['mouth']['registration'],level/6) for level in range(7)]
                else:
                    settings = dict(person['actions'][name])
                    if name == 'success': settings['lift_pixels']=0
                    sequence = planted_action(neutral,name,count,settings)
                frames=[]
                for index,frame in enumerate(sequence):
                    own = paint.unpack(paint.sample(paint.premul(frame),x*scale+origin[0],y*scale+origin[1]))
                    pixels=np.asarray(own).copy();pixels[:,:,3]=np.where(mask,pixels[:,:,3],0);pixels[pixels[:,:,3]==0]=0
                    texture=len(native);native.append((f'{name}-{index:02}',Image.fromarray(pixels)))
                    phase=index/(count-1) if count>1 else 0
                    jump = person['actions']['success']['lift_pixels']*world_scale/scale*math.sin(math.pi*np.clip((phase-.18)/.62,0,1))**2 if name=='success' else 0
                    frames.append({'uvs':upper_uv,'_texture':texture,'jumpWorld':float(jump)})
                definition['views']['down']['upperClips'][name]={'seconds':seconds,'frames':frames}

    # One density and fixed source binding for every part; shelf packing does not refit poses.
    density=.5;atlas_width=2048;cursor_x=cursor_y=4;row_height=0;placements=[]
    packed=[]
    for name,image in native:
        width,height=[max(1,round(n*density)) for n in image.size]
        if cursor_x+width+4>atlas_width:
            cursor_x=4;cursor_y+=row_height+8;row_height=0
        placements.append((cursor_x,cursor_y,width,height));row_height=max(row_height,height);cursor_x+=width+8
        y,x=np.mgrid[:height,:width]
        resized=paint.unpack(paint.sample(paint.premul(image),x/(width/image.width),y/(height/image.height)))
        packed.append(resized)
    atlas_height=math.ceil((cursor_y+row_height+4)/2)*2
    if atlas_height>2048: raise ValueError('Packed source parts exceed single atlas budget')
    atlas=Image.new('RGBA',(atlas_width,atlas_height))
    for image,rect in zip(packed,placements):atlas.alpha_composite(image,rect[:2])
    for view in definition['views'].values():
        for part in view['parts']:
            index=part.pop('_texture');rect=placements[index];im=native[index][1]
            part['uvs']=[[(rect[0]+u*rect[2]/im.width)/atlas_width,(rect[1]+v*rect[3]/im.height)/atlas_height] for u,v in part['uvs']]
        for clip in view['upperClips'].values():
            for frame in clip['frames']:
                index=frame.pop('_texture');rect=placements[index];im=native[index][1]
                frame['uvs']=[[(rect[0]+u*rect[2]/im.width)/atlas_width,(rect[1]+v*rect[3]/im.height)/atlas_height] for u,v in frame['uvs']]
    variants={};generated={}
    for mobile in [False,True]:
        image=atlas
        if mobile:
            y,x=np.mgrid[:atlas.height//2,:atlas.width//2];image=paint.unpack(paint.sample(paint.premul(atlas),x*2,y*2))
        name=f'{character}-parts{"-mobile" if mobile else ""}.webp';content=encoded(image,'WEBP',lossless=True,quality=100,method=6,exact=True)
        generated[directory/name]=content
        variants['mobile' if mobile else 'desktop']={'file':f'./assets/characters/street/{name}','sha256':digest_bytes(content),'width':image.width,'height':image.height,'bytes':len(content),'decodedBytes':image.width*image.height*4}
    definition['variants']=variants
    rig_bytes=(json.dumps(definition,separators=(',',':'))+'\n').encode()
    if len(rig_bytes)>64*1024:raise ValueError('Rig JSON exceeds 64 KiB lazy definition cap')
    rig_file=f'{character}-rig.json';generated[directory/rig_file]=rig_bytes
    standing_file=f'{character}-standing.webp';standing=DEST/standing_file
    if not standing.exists():raise ValueError('Existing exact neutral standing paint required')
    generated[directory/standing_file]=standing.read_bytes()
    clock_clips = {}
    offset = 0
    for name, count, seconds in planned_clips(person):
        clock_clips[name] = {'offset':offset,'count':count,'seconds':seconds}
        offset += count
    person_manifest={'id':character,'name':person['name'],'cell':spec['cell'],'pivot':spec['pivot'],
        'grid':[16,12],'clips':clock_clips,'clipLayout':'simulation-only-virtual-slots',
        'figureHeight':spec['figureHeight'],'figureWorldHeight':spec['figureWorldHeight'], 'strideDistance':definition['gait']['strideDistance'],
        'standing':{'file':f'./assets/characters/street/{standing_file}','sha256':paint.digest(standing),'width':128,'height':160},
        'motionRig':{'file':f'./assets/characters/street/{rig_file}','sha256':digest_bytes(rig_bytes),'variants':variants}}
    if 'talk' in clock_clips:
        person_manifest['speech'] = {'clips':{'talk':dict(clock_clips['talk'])}}
    generated[directory/'candidate-manifest.json']=(json.dumps({'schemaVersion':1,'status':'candidate-parts-unapproved','characters':{person['voiceId']:person_manifest}},indent=2)+'\n').encode()
    report={'status':'Candidate only; source, runtime, device and turn gates remain open','sourceSha256':person['sourceSha256'],
        'partSourceSha256':paint.digest(far_file),'rigSha256':digest_bytes(rig_bytes),'rigBytes':len(rig_bytes),'variants':variants,
        'partBindings':references,'packedParts':[{'id':name,'rect':list(rect)} for (name,_),rect in zip(native,placements)],'holds':definition['holds']}
    generated[directory/'build-report.json']=(json.dumps(report,indent=2)+'\n').encode()
    if check:
        stale=[str(path.relative_to(ROOT)) for path,content in generated.items() if not path.exists() or path.read_bytes()!=content]
        if stale:raise ValueError('Missing or stale painted parts bytes: '+', '.join(stale))
    else:
        directory.mkdir(parents=True,exist_ok=True)
        for path,content in generated.items():path.write_bytes(content)
        for name,image in native[:28]:image.save(directory/(name+'-source.png'))
    print(json.dumps({'character':character,'representation':'parts','check':check,'rigBytes':len(rig_bytes),'variants':variants}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--character', required=True)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--representation', choices=['atlas','parts'], default='atlas')
    arguments = parser.parse_args()
    (build_parts if arguments.representation == 'parts' else build)(arguments.character, arguments.check)
