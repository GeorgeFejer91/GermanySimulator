"""Bake one source-bound street speaker using the resident motion implementation."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import math
import re
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes((json.dumps(value, indent=2) + '\n').encode('utf8'))


def world_geometry(spec, person):
    world_height = person.get('figureWorldHeight')
    if (isinstance(world_height, bool) or not isinstance(world_height, (int, float))
            or not math.isfinite(world_height) or world_height <= 0):
        raise ValueError('A positive authored figure world height is required')
    return {'figureHeight': spec['figureHeight'], 'figureWorldHeight': world_height,
            'billboardWorldHeight': spec['cell'][1] / spec['figureHeight'] * world_height}


def configure(spec_path):
    spec_path = Path(spec_path).resolve()
    config_hash = digest(spec_path)
    spec = json.loads(spec_path.read_text(encoding='utf8'))
    if (len(spec['cell']) != 2 or len(spec['pivot']) != 2
            or min(*spec['cell'], spec['figureHeight'], spec['working']['figureHeight']) <= 0
            or not all(math.isfinite(v) for v in [*spec['cell'], *spec['pivot'],
                spec['figureHeight'], *spec['working'].values()])):
        raise ValueError('Invalid family cell/figure configuration')
    for person in spec['characters'].values():
        world_geometry(spec, person)
        for direction, view in person['views'].items():
            if 'plantedFloor' in view and (type(view['plantedFloor']) is not bool
                    or direction not in ('down', 'up')):
                raise ValueError('Planted floor requires a vertical walking view')
            if view.get('plantedTransition') not in (None, 'fade-to-source', 'recenter-contact'):
                raise ValueError('Unknown planted transition recipe')
            if view.get('plantedTransition') == 'recenter-contact':
                if direction not in ('right', 'left') or len(view['landmarks'].get('foot_centres', [])) != 2:
                    raise ValueError('Recentered contact requires measured profile foot centres')
    definition = importlib.util.spec_from_file_location('resident_family', ROOT / 'tools/build-resident-motion.py')
    builder = importlib.util.module_from_spec(definition)
    definition.loader.exec_module(builder)
    builder.SPEC = spec_path
    builder.DEST = ROOT / 'assets/characters/street-speakers'
    builder.QA = ROOT / 'output/street-speaker-motion'
    builder.CELL = tuple(spec['cell'])
    builder.PIVOT = tuple(spec['pivot'])
    builder.HEIGHT = spec['working']['figureHeight']
    builder.BASELINE = spec['working']['baseline']
    builder.json_write = write_json
    original_neutral = builder.neutral
    original_motion = builder.motion
    original_bridge = builder.bridge_frames
    original_bindings = builder.source_bindings

    def motion(person, direction, count=builder.COUNT, strength=1, phases=None,
               step_width=None, limb_pose=None):
        fitted_pose = limb_pose
        if person['views'][direction].get('plantedFloor'):
            def fitted_pose(side, nodes, dx, dy):
                if limb_pose is not None:
                    dx, dy = limb_pose(side, nodes, dx, dy)
                # Upright billboards have no ground-plane depth for a shoe
                # below the root. Keep its loaded contact on the floor while
                # retaining the authored swing lift and connected leg field.
                descent = max(0, dy[-1])
                hip, ankle = nodes[2], nodes[-2]
                dy = [value-descent*max(0, min(1, (y-hip)/(ankle-hip)))
                      for y, value in zip(nodes, dy)]
                return dx, dy
        return original_motion(person, direction, count=count, strength=strength,
                               phases=phases, step_width=step_width, limb_pose=fitted_pose)

    def contact_pose(person, direction, strength, phase):
        # Retain the contact painting's foot re-centering while easing only
        # the gait displacement. Returning strength itself to zero would put
        # the feet back into the much wider authored contact source.
        _, landmarks, _ = builder.registered(person, direction)
        if strength == 0:
            phase = math.pi/4  # the existing upper-body bob is zero here

        def ease_limb(side, nodes, dx, dy):
            base = (landmarks['mid']-landmarks['foot_centres'][side])*person['views'][direction].get('gait_strength', 1)
            rest = [0, 0, 0, base*.6*.35, base*.6, base, base]
            return ([fixed+(moving-fixed)*strength for fixed, moving in zip(rest, dx)],
                    [moving*strength for moving in dy])

        return builder.motion(person, direction, count=4, strength=1,
                              phases=[phase], limb_pose=ease_limb)[0][0]

    def neutral(person, direction):
        if person['views'][direction].get('plantedTransition') == 'recenter-contact':
            return contact_pose(person, direction, 0, 0)
        if person['views'][direction].get('plantedTransition') == 'fade-to-source':
            return builder.motion(person, direction, count=4, strength=0, phases=[0])[0][0]
        return original_neutral(person, direction)

    def bridge_frames(person, direction):
        if person['views'][direction].get('plantedTransition') == 'recenter-contact':
            return [contact_pose(person, direction, strength, phase)
                    for strength, phase in [(.75, 15/16*math.tau), (.4, 15/16*math.tau),
                                            (0, 0), (.4, 0), (.75, 0)]]
        if person['views'][direction].get('plantedTransition') != 'fade-to-source':
            return original_bridge(person, direction)
        return [builder.motion(person, direction, count=4, strength=strength, phases=[phase])[0][0]
                for strength, phase in [(.75, 15 / 16 * math.tau), (.4, 15 / 16 * math.tau),
                                        (0, 0), (.4, 0), (.75, 0)]]

    def source_bindings(person):
        if digest(spec_path) != config_hash:
            raise ValueError('Family configuration changed during build/check')
        bindings = original_bindings(person)
        bindings['familyBuilder'] = {'path': 'tools/build-street-speaker-family.py',
                                     'sha256': digest(Path(__file__))}
        bindings['familyConfiguration'] = {'path': spec_path.relative_to(ROOT).as_posix()
            if spec_path.is_relative_to(ROOT) else str(spec_path), 'sha256': config_hash}
        return bindings

    def settle_frame(person, direction, strength, phase):
        if person['views'][direction].get('plantedTransition') == 'recenter-contact':
            return contact_pose(person, direction, strength, phase)
        return builder.motion(person, direction, count=4, strength=strength, phases=[phase])[0][0]

    builder.motion = motion
    builder.neutral = neutral
    builder.bridge_frames = bridge_frames
    builder.source_bindings = source_bindings
    builder.family_settle_frame = settle_frame
    return builder, spec


def apply_family_metadata(manifest, spec, person):
    manifest.update(world_geometry(spec, person))
    for state in manifest['interactions']['states'].values():
        state['visualStatus'] = 'candidate limited body diagnostic; not authored greeting/work/answer-review'
    if manifest['interactions']['states']:
        manifest['limitations'].append('Generic idle/look/success/failure diagnostics do not supply own greeting, work or answer-review gesture art.')
    return manifest


def native_layout():
    directions = ('down','right','up','left')
    walks = {d:{'row':i,'frames':16,'frame_ms':60,'loop':True} for i,d in enumerate(directions)}
    bridges = {d:{'row':i,'stop_cols':[16,17,18],'start_cols':[19,20],'frame_ms':70}
               for i,d in enumerate(directions)}
    turns = {'pose_count':8,'rows':[4],'anchors':{d:i*2 for i,d in enumerate(directions)},'frame_ms':85}
    cursor = 4*21+8
    settles = {}
    for direction in directions:
        phases = {}
        for phase in range(16):
            frames = []
            for _ in range(4):
                row,col = divmod(cursor,21)
                frames.append({'row':row,'col':col,'ms':60})
                cursor += 1
            frames.append({'row':bridges[direction]['row'],'col':18,'ms':70})
            phases[str(phase)] = {'frames':frames}
        settles[direction] = phases
    return {'cols':21,'rows':math.ceil(cursor/21),'walks':walks,'bridges':bridges,'turns':turns,
            'settles':settles,'interactions':{'neutral':{'row':0,'col':18},'states':{}}}


def settle_frames(builder, person, direction, phase):
    angle = phase/16*math.tau
    return [builder.family_settle_frame(person,direction,strength,angle)
            for strength in (.8,.6,.4,.2)] + [builder.neutral(person,direction)]


def write_native(builder, manifest, spec, person, key):
    # Retain the shipped 21x17 logical format and native desktop/mobile cell
    # sizes. Stops occupy spare row columns instead of increasing GPU budgets.
    if spec['cell'] != [128,160] or len(person.get('turn_sources',[])) != 8:
        raise ValueError('Native street export requires 128x160 cells and eight painted turn anchors')
    layout = native_layout()
    columns,rows = layout['cols'],layout['rows']
    frames = [None]*(columns*rows)
    neutral = {d:builder.neutral(person,d) for d in builder.DIRECTIONS}
    for direction in builder.DIRECTIONS:
        walk = layout['walks'][direction]
        samples,_ = builder.motion(person,direction)
        for col,frame in enumerate(samples):frames[walk['row']*columns+col] = frame
        bridge = layout['bridges'][direction]
        for col,frame in zip([16,17,18,19,20],builder.bridge_frames(person,direction)):
            frames[bridge['row']*columns+col] = frame
        for phase in range(16):
            for cell,frame in zip(layout['settles'][direction][str(phase)]['frames'][:-1],
                                  settle_frames(builder,person,direction,phase)[:-1]):
                frames[cell['row']*columns+cell['col']] = frame
    for index,entry in enumerate(person['turn_sources']):
        if 'neutral' in entry:
            frame = neutral[entry['neutral']]
        else:
            path = builder.ROOT/entry['source']
            if builder.paint.digest(path) != entry['sourceSha256']:raise ValueError('Turn source changed')
            frame,_ = builder.street.register_source(Image.open(path).convert('RGBA'),entry,entry['scale'],builder.BASELINE)
        frames[4*columns+index] = frame
    turn_cells = [{'row':4,'col':i} for i in range(8)]
    layout['transitions'] = {a+'-to-'+b:{'frames':builder.paint.plan_transition(a,b,layout['walks'],layout['bridges'],
        turn_cells,layout['turns']['anchors'],turn_ms=85),'visualStatus':'native-painted-turn-awaits-ordered-review'}
        for a in builder.DIRECTIONS for b in builder.DIRECTIONS if a!=b}
    frames = [frame if frame is not None else Image.new('RGBA',(512,512)) for frame in frames]
    directory = builder.QA/key
    variants = {}
    for variant,cell in [('desktop',[96,120]),('mobile',[88,110])]:
        factor = cell[0]/spec['cell'][0]
        export_spec = {**spec,'cell':cell,'pivot':[v*factor for v in spec['pivot']],
                       'figureHeight':spec['figureHeight']*factor}
        cells = [builder.street.export_cell(frame,export_spec) for frame in frames]
        atlas = Image.new('RGBA',(columns*cell[0],rows*cell[1]))
        for index,frame in enumerate(cells):atlas.paste(frame,((index%columns)*cell[0],(index//columns)*cell[1]))
        path = builder.DEST/key/f'character-{variant}.webp'
        path.write_bytes(builder.street.encoded(atlas,'WEBP',lossless=True,method=4,exact=True))
        with Image.open(path) as encoded:
            encoded = encoded.convert('RGBA')
        cells = [encoded.crop(((i%columns)*cell[0],(i//columns)*cell[1],(i%columns+1)*cell[0],(i//columns+1)*cell[1]))
                 for i in range(len(frames))]
        boxes = [frame.getbbox() for frame in cells if frame.getbbox()]
        gutter = min(min(b[0],b[1],cell[0]-b[2],cell[1]-b[3]) for b in boxes)
        variants[variant] = {'image':path.name,'sha256':digest(path),'bytes':path.stat().st_size,
            'frame_size':cell,'pivot':export_spec['pivot'],'image_size':list(encoded.size),
            'decodedRGBABytes':encoded.width*encoded.height*4,'minimumGutter':gutter}
        for direction in builder.DIRECTIONS:
            start = layout['walks'][direction]['row']*columns
            exact = cells[start:start+16]
            for theme,color in [('light','#eee8db'),('dark','#25272b')]:
                builder.street.opaque_board(exact,8,color).save(directory/f'{direction}-{variant}-{theme}.png')
                turn = cells[4*columns:4*columns+8]
                builder.street.opaque_board(turn,8,color,2).save(directory/f'turns-{variant}-{theme}.png')
                for first in range(0,16,4):
                    poses = [cells[p['row']*columns+p['col']] for phase in range(first,first+4)
                             for p in layout['settles'][direction][str(phase)]['frames']]
                    builder.street.opaque_board(poses,5,color).save(directory/f'settles-{direction}-{first:02}-{variant}-{theme}.png')
            clip = [builder.street.opaque_board([frame],1,'#dedace') for frame in exact]
            clip[0].save(directory/f'{direction}-{variant}-motion.gif',save_all=True,append_images=clip[1:],duration=60,loop=0)
        for name,transition in layout['transitions'].items():
            ordered = [cells[p['row']*columns+p['col']] for p in transition['frames']]
            builder.street.opaque_board(ordered,len(ordered),'#eee8db',2).save(directory/f'{name}-{variant}-transition.png')
    manifest.update(layout)
    manifest.update(variants=variants,delivery=variants['desktop'],image=variants['desktop']['image'],
                    sha256=variants['desktop']['sha256'],image_size=variants['desktop']['image_size'])
    return manifest


def check_geometry(manifest, spec, person):
    for field, expected in world_geometry(spec, person).items():
        if not math.isclose(manifest.get(field, -1), expected, rel_tol=0, abs_tol=1e-12):
            raise ValueError('Export family geometry mismatch: ' + field)


def write_standing(builder, manifest, key, spec=None, person=None):
    directory = builder.DEST/key
    width, height = manifest['frame_size']
    neutral = manifest['interactions']['neutral']
    x, y = neutral['col']*width, neutral['row']*height
    if spec and spec.get('nativeExport'):
        source = builder.street.export_cell(builder.neutral(person,'down'),spec)
    else:
        with Image.open(directory/manifest['variants']['desktop']['image']) as atlas:
            source = atlas.convert('RGBA').crop((x,y,x+width,y+height))
    path = directory/'standing.webp'
    path.write_bytes(builder.street.encoded(source, 'WEBP', lossless=True, method=4, exact=True))
    return {'image':path.name, 'sha256':digest(path), 'bytes':path.stat().st_size,
            'image_size':[width,height]}


def check_standing(builder, manifest, key, spec=None, person=None):
    directory = builder.DEST/key
    receipt = manifest['standing']
    path = directory/receipt['image']
    if digest(path) != receipt['sha256']:
        raise ValueError('Standing fallback bytes changed')
    width, height = manifest['frame_size']
    neutral = manifest['interactions']['neutral']
    x, y = neutral['col']*width, neutral['row']*height
    with Image.open(path) as standing:
        if spec and spec.get('nativeExport'):
            expected = builder.street.export_cell(builder.neutral(person,'down'),spec)
        else:
            with Image.open(directory/manifest['variants']['desktop']['image']) as atlas:
                expected = atlas.convert('RGBA').crop((x,y,x+width,y+height))
        if (standing.size != (width,height) or list(standing.size) != receipt['image_size']
                or standing.convert('RGBA').tobytes() != expected.tobytes()):
            raise ValueError('Standing fallback does not match encoded neutral')


def run(spec_path, key, check=False, probe=False):
    builder, spec = configure(spec_path)
    person = spec['characters'][key]
    if probe:
        builder.probe(key)
        return True
    if check:
        builder.check(key)
        manifest = json.loads((builder.DEST / key / 'manifest.json').read_text())
        check_geometry(manifest, spec, person)
        check_standing(builder, manifest, key, spec, person)
        return True
    if not builder.build(key):
        return False
    path = builder.DEST / key / 'manifest.json'
    manifest = json.loads(path.read_text())
    if spec.get('nativeExport'):
        manifest = write_native(builder,manifest,spec,person,key)
    manifest = apply_family_metadata(manifest, spec, person)
    manifest['standing'] = write_standing(builder, manifest, key, spec, person)
    builder.json_write(path, manifest)
    builder.json_write(builder.QA / key / 'build-report.json', {'status': manifest['status'],
        'variants': manifest['variants'], 'uniqueWalkSamplesPerDirection': builder.COUNT,
        **world_geometry(spec, person), 'sourceBindings': manifest['sourceBindings'],
        'limitations': manifest['limitations']})
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--family', required=True)
    parser.add_argument('--character', required=True)
    actions = parser.add_mutually_exclusive_group()
    actions.add_argument('--check', action='store_true')
    actions.add_argument('--probe', action='store_true')
    args = parser.parse_args()
    if not re.fullmatch(r'[a-z0-9-]+', args.family):
        parser.error('family must name a source folder')
    spec_path = ROOT / 'assets/sprite-sources/street-speaker-motion' / args.family / 'motion-spec.json'
    return 0 if run(spec_path, args.character, check=args.check, probe=args.probe) else 1


if __name__ == '__main__':
    raise SystemExit(main())
