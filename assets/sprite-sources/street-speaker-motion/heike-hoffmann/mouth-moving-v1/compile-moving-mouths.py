"""Compile Heike's own source lips through captured original-upper warp fields.

This writes a held registration fragment only. It does not render or enable mouths.
"""
from pathlib import Path
import argparse
import copy
import hashlib
import importlib.util
import json
import math

import numpy as np
from PIL import Image, ImageDraw
from scipy.interpolate import PchipInterpolator

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
OWN = HERE.parent
ID = 'quiz-heike-hoffmann'
PROFILE = OWN/'mouth-source-v1/source-mouth-profiles-v1.json'
SPEC = OWN/'motion-spec.json'
STANDING = ROOT/'assets/characters/street/quiz-heike-hoffmann/mouths-standing-v1.json'
STANDING_IMAGE = ROOT/'assets/characters/street/quiz-heike-hoffmann-standing.webp'
DEFAULT_WALK = ROOT/'output/ambient-city-animation/heike-walk-source-v2'
DEFAULT_STOP = ROOT/'output/ambient-city-animation/heike-phase-stop-source-v2'
DEFAULT_GESTURE = ROOT/'output/ambient-city-animation/heike-key-gesture-full16-v1'
DEFAULT_OUT = HERE/'mouth-moving-v1.json'
DIRECTIONS = ('down','right','up','left')
TURNS = ('down','front-right','right','rear-right','up','rear-left','left','front-left')
VISIBLE = ('down','front-right','right','left','front-left')
SCALE = 136 / 400


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def reference(path):
    path = Path(path).resolve()
    return {'file': path.relative_to(ROOT).as_posix(), 'sha256': digest(path)}


def checked(path, expected):
    if digest(path) != expected:
        raise ValueError('Changed bound input: '+str(path))


def load(name, path):
    module_spec = importlib.util.spec_from_file_location(name,path)
    module = importlib.util.module_from_spec(module_spec)
    module_spec.loader.exec_module(module)
    return module


def logical(point):
    return np.array([64 + (point[0]-256)*SCALE, 150 + (point[1]-472)*SCALE])


def upper_source_hash(person, direction):
    """Check captured RGBA identity against the exact own cut upper painting."""
    view = person['views'][direction]
    overlay = view['originalUpper']
    if person['scale'] != 1 or overlay.get('featherWorkingPixels',0):
        raise ValueError('Unsupported original-upper registration or feather')
    bounds = overlay['component_bounds']
    pivot = overlay['source_pivot']
    if bounds[2]-bounds[0] != 512 or bounds[3]-bounds[1] != 512 or pivot != [bounds[0]+256,472]:
        raise ValueError('Original-upper crop no longer occupies the exact working canvas')
    source = ROOT/person['source']
    checked(source,person['sourceSha256'])
    with Image.open(source) as image:
        pixels = np.array(image.convert('RGBA').crop(tuple(bounds)))
    cut = overlay['cutSourceY']
    if type(cut) is not int or not 0 <= cut < 512:
        raise ValueError('Changed original-upper cut')
    keep = Image.new('L',(512,512))
    draw = ImageDraw.Draw(keep)
    draw.rectangle((0,0,511,cut),fill=255)
    for polygon in overlay['protected_polygons']:
        draw.polygon([(x-bounds[0],y-bounds[1]) for x,y in polygon],fill=255)
    pixels[:,:,3] = np.rint(pixels[:,:,3].astype(float)*np.asarray(keep)/255).astype('uint8')
    pixels[pixels[:,:,3] == 0] = 0
    return hashlib.sha256(pixels.tobytes()).hexdigest()


def field_map(field, expected_hash):
    if set(field) != {'sourceRgbaSha256','sourceSize','nodes_y','dx','dy'}:
        raise ValueError('Missing or unknown captured original-upper field')
    if field['sourceRgbaSha256'] != expected_hash or field['sourceSize'] != [512,512]:
        raise ValueError('Captured upper field belongs to different paint')
    ys = np.asarray(field['nodes_y'],float)
    dx = np.asarray(field['dx'],float)
    dy = np.asarray(field['dy'],float)
    if (len(ys) != 4 or len(dx) != 4 or len(dy) != 4 or not np.all(np.isfinite([*ys,*dx,*dy]))
            or not np.all(np.diff(ys) > 0) or not np.allclose(ys[[0,1,-1]],[0,280,511],atol=0,rtol=0)):
        raise ValueError('Changed or invalid captured original-upper nodes')
    if abs(dx[0]-dx[1]) > 1e-12 or abs(dy[0]-dy[1]) > 1e-12:
        raise ValueError('Mouth-bearing upper is not a uniform head translation')
    x_field = PchipInterpolator(ys,dx)
    y_field = PchipInterpolator(ys,dy)
    def mapped(points):
        points = np.asarray(points,float)
        return points + np.stack([x_field(points[:,1]),y_field(points[:,1])],axis=1)
    return mapped


def points_for(entry):
    offset = np.asarray(entry['cellOriginPx'],float)
    center = np.asarray(entry['centerPx'],float)-offset
    axes = np.asarray(entry['axesPx'],float).reshape(2,2).T
    contours = [np.asarray(curve,float)-offset for curve in entry['contoursPx'].values()]
    support = np.concatenate([center[None,:],(center[:,None]+axes).T,*contours])
    if np.min(support[:,1]) < 0 or np.max(support[:,1]) >= 280:
        raise ValueError('Own lip support leaves uniform original head field')
    return center,axes,contours


def compile_cell(entry, source_cell, mapped):
    center,axes,contours = points_for(entry)
    locations = np.vstack([center,center+axes[:,0],center+axes[:,1]])
    moved = mapped(locations)
    moved_contours = [mapped(curve) for curve in contours]
    if not all(np.all(np.isfinite(curve)) for curve in moved_contours):
        raise ValueError('Mouth contour transport diverged')
    center_logical = logical(moved[0])
    tangent = (moved[1]-moved[0])*SCALE
    normal = (moved[2]-moved[0])*SCALE
    if np.linalg.det(np.stack([tangent,normal],axis=1)) <= 0:
        raise ValueError('Mouth-bearing field folded the connected lips')
    result = {'rect':[float(center_logical[0]/128),float(1-center_logical[1]/160),
                      float(np.linalg.norm(tangent)/128),float(np.linalg.norm(normal)/160)],
              'axes':[float(tangent[0]),float(tangent[1]),float(normal[0]),float(normal[1])],
              'profile':copy.deepcopy(source_cell['profile'])}
    if not all(math.isfinite(v) for v in [*result['rect'],*result['axes']]):
        raise ValueError('Invalid logical mouth registration')
    return result



def transport_proof(entry, field, expected_hash, compiled_cell):
    center,axes,_ = points_for(entry)
    origin = np.asarray(entry['cellOriginPx'],float)
    corners = np.asarray([entry['contoursPx']['crease'][0],entry['contoursPx']['crease'][-1]],float)-origin
    source_points = np.vstack([center,corners,center+axes[:,0],center+axes[:,1]])
    working_points = field_map(field,expected_hash)(source_points)
    logical_points = np.asarray([logical(point) for point in working_points])
    expected_axes = np.stack([logical_points[3]-logical_points[0],logical_points[4]-logical_points[0]],axis=1)
    assert np.allclose(expected_axes.T.flatten(),np.asarray(compiled_cell['axes']),atol=1e-10)
    return {'sourceWorking':source_points.tolist(),'warpedWorking':working_points.tolist(),
        'logical':logical_points.tolist(),'centerDeltaWorking':(working_points[0]-center).tolist(),
        'axesLogical':expected_axes.T.tolist(),'field':field}


def build(walk_source=DEFAULT_WALK,stop_source=DEFAULT_STOP,gesture_source=DEFAULT_GESTURE,outdir=DEFAULT_OUT):
    walk_source = Path(walk_source).resolve()
    stop_source = Path(stop_source).resolve()
    gesture_source = Path(gesture_source).resolve()
    outdir = Path(outdir).resolve()
    if outdir.suffix == '.json':
        destination = outdir
        proof_path = ROOT/'output/ambient-city-animation/heike-moving-mouths-v1/proof.json'
    else:
        destination = outdir/'mouth-moving-v1.json'
        proof_path = outdir/'proof.json'
    source_files = [PROFILE,SPEC,STANDING,STANDING_IMAGE,walk_source/'walk-source.json',
                    stop_source/'stop-source.json',gesture_source/'key16.json']
    original_hashes = {path:digest(path) for path in source_files}
    profiles = json.loads(PROFILE.read_text())
    if profiles['schemaVersion'] != 1 or profiles['status'].startswith('approved'):
        raise ValueError('Unexpected own mouth source profile')
    for name,expected in profiles['inputHashes'].items():
        path = ROOT/name
        checked(path,expected)
        source_files.append(path)
    if set(profiles['compiledSourceCells']) != set(TURNS) or set(profiles['registrations']) != set(TURNS):
        raise ValueError('Own source mouth headings changed')
    if any((profiles['compiledSourceCells'][name] is None) != (name not in VISIBLE) for name in TURNS):
        raise ValueError('Rear mouth visibility changed')
    helper = load('connected_lip_validator',ROOT/'tools/build-street-mouths.py')
    for name in VISIBLE:
        helper.validate(profiles['compiledSourceCells'][name]['profile'])
    standing_doc = json.loads(STANDING.read_text())
    if standing_doc['id'] != ID or standing_doc['sources']['standing'] != digest(STANDING_IMAGE):
        raise ValueError('Published own standing mouth identity changed')
    helper.validate(standing_doc['standing']['profile'])
    walk = json.loads((walk_source/'walk-source.json').read_text())
    stop = json.loads((stop_source/'stop-source.json').read_text())
    gesture = json.loads((gesture_source/'key16.json').read_text())
    if walk['id'] != ID or walk['cell'] != [128,160] or walk['pivot'] != [64,150] or walk['figureHeight'] != 136:
        raise ValueError('Published logical walk geometry changed')
    if walk['grid'] != [16,9] or walk['selectedCells'] != 92:
        raise ValueError('Changed walk source selection')
    if stop['sourceBindings'] != walk['sourceBindings'] or stop['stopCount'] != 256:
        raise ValueError('Stop fields do not belong to this own walk source')
    if stop['walkReceiptSha256'] != digest(walk_source/'walk-source.json'):
        raise ValueError('Stops belong to a different walk receipt')
    if walk['sourceBindings']['familyConfiguration']['sha256'] != digest(SPEC):
        raise ValueError('Captured walk fields belong to a different motion spec')
    if gesture['controlsSource']['sha256'] != profiles['inputHashes'][str((OWN/'registered-cardinals-v3-candidate.png').relative_to(ROOT)).replace('\\','/')]:
        raise ValueError('Gesture front paint differs from the own mouth source')
    if not gesture['endExact'] or len(gesture['samples']) != 16 or any(
            sample['index'] != i or not sample['headMouthExact'] for i,sample in enumerate(gesture['samples'])):
        raise ValueError('Gesture head or frame order changed')
    person = json.loads(SPEC.read_text())['characters'][ID]
    if person['source'] != gesture['controlsSource']['file']:
        raise ValueError('Walk and gesture front source paint differ')
    upper_hashes = {direction:upper_source_hash(person,direction) for direction in DIRECTIONS}
    for label,driver,expected in [('walk',OWN/'build-walk-source.py',walk['driverSha256']),
                                  ('stop',OWN/'build-phase-stop-source.py',stop['driverSha256']),
                                  ('gesture',OWN/'key-gesture-v3/build-full16.py',gesture['driverSha256'])]:
        checked(driver,expected)
        source_files.append(driver)
    for data,folder in [(walk,walk_source),(stop,stop_source),(gesture,gesture_source)]:
        for variant in data['variants'].values():
            path = folder/variant['file']
            checked(path,variant['sha256'])
            source_files.append(path)
    sources = profiles['registrations']
    compiled = profiles['compiledSourceCells']
    def identity(points):return np.asarray(points,float)
    def cell(name,field=None):
        if name not in VISIBLE:
            if field is not None:field_map(field,upper_hashes[name])
            return None
        entry = sources[name]
        checked(ROOT/entry['input']['file'],entry['input']['sha256'])
        if field is None:
            if name in DIRECTIONS:raise ValueError('Moving cardinal lacks an actual upper field')
            mapped = identity
        else:
            mapped = field_map(field,upper_hashes[name])
        result = compile_cell(entry,compiled[name],mapped)
        if result['profile'] != compiled[name]['profile']:
            raise ValueError('Own connected lip profile changed numerically')
        return result
    moves = {}
    bridges = {}
    for row,direction in enumerate(DIRECTIONS):
        w = walk['walks'][direction]
        if w['row'] != row or w['frames'] != 16 or len(walk['fields'][direction]) != 16:
            raise ValueError('Walk field order changed')
        moves[direction] = []
        for phase,record in enumerate(walk['fields'][direction]):
            if record['phase'] != phase:moves[direction].append(None);raise ValueError('Walk phase order changed')
            moves[direction].append(cell(direction,record['actualUpperWarp']))
        bridge = walk['bridges'][direction]
        if bridge['row'] != row+4 or len(bridge['records']) != 5:
            raise ValueError('Bridge field order changed')
        bridges[direction] = []
        for col,record in enumerate(bridge['records']):
            if record['col'] != col:raise ValueError('Bridge column order changed')
            bridges[direction].append(cell(direction,record['actualUpperWarp']))
    turns = []
    for col,name in enumerate(TURNS):
        if name in DIRECTIONS:
            neutral = walk['neutrals'][name]
            if (neutral['row'],neutral['col']) != (8,col):raise ValueError('Neutral turn anchor changed')
            turn = cell(name,neutral['actualUpperWarp'])
            if turn != bridges[name][2]:raise ValueError('Neutral bridge mouth differs from turn anchor')
        else:turn = cell(name)
        turns.append(turn)
    stops = []
    if len(stop['records']) != 64:raise ValueError('Stop phase records changed')
    for index,record in enumerate(stop['records']):
        direction = DIRECTIONS[index//16]
        phase = index%16
        if record['direction'] != direction or record['phase'] != phase or len(record['frames']) != 4:
            raise ValueError('Stop direction/phase order changed')
        for stage,frame in enumerate(record['frames']):
            if frame['stage'] != stage:raise ValueError('Stop stage order changed')
            stops.append(cell(direction,frame['actualUpperWarp']))
    front = turns[0]
    source_image = ROOT/person['source']
    with Image.open(source_image) as image:
        source_head = image.convert('RGBA').crop((0,0,512,270)).tobytes()
    gesture_cells = []
    gesture_working = []
    for index in range(16):
        path = gesture_source/f'working-{index:02}.png'
        with Image.open(path) as image:
            frame = image.convert('RGBA')
            if frame.size != (512,512) or frame.crop((0,0,512,270)).tobytes() != source_head:
                raise ValueError('Gesture frame changed the own front mouth/head')
        gesture_working.append(reference(path))
        gesture_cells.append(copy.deepcopy(front))
    # Decode each own key atlas and require every packed cell to equal the
    # existing source sampler's result from the head-checked working frame.
    street = load('street_key_decode_check',ROOT/'tools/build-street-character-sprites.py')
    for name,figure,pivot in [('desktop',102,[48,112.5]),('mobile',68,[32,75])]:
        variant = gesture['variants'][name]
        width,height = variant['cell']
        with Image.open(gesture_source/variant['file']) as image:
            atlas = image.convert('RGBA')
        if list(atlas.size) != variant['image_size'] or atlas.size != (width*16,height):
            raise ValueError('Encoded own key atlas geometry changed')
        spec = {'cell':variant['cell'],'figureHeight':figure,'pivot':pivot,
                'working':{'figureHeight':400,'baseline':472}}
        for index in range(16):
            with Image.open(gesture_source/f'working-{index:02}.png') as image:
                frame = image.convert('RGBA')
            expected = street.export_cell(frame,spec)
            actual = atlas.crop((index*width,0,(index+1)*width,height))
            if actual.tobytes() != expected.tobytes():
                raise ValueError('Encoded own key frame differs from working head: '+name+'/'+str(index))
    for name,col in [('down',0),('right',2),('left',6)]:
        baseline = compile_cell(sources[name],compiled[name],identity)
        if turns[col] != baseline:
            raise ValueError('Neutral upper field changed own baseline lips: '+name)
    if len(moves)*16 + sum(len(v) for v in bridges.values()) + len(turns)+len(stops)+len(gesture_cells) != 364:
        raise ValueError('Selected cell count changed')
    selected = [*sum(moves.values(),[]),*sum(bridges.values(),[]),*turns,*stops,*gesture_cells]
    if sum(item is None for item in selected) != 88:
        raise ValueError('Rear null mouth count changed')
    inputs = {reference(path)['file']:digest(path) for path in sorted(set(source_files))}
    inputs.update({item['file']:item['sha256'] for item in gesture_working})
    if any(digest(path) != prior for path,prior in original_hashes.items()):
        raise ValueError('Authored source or receipt changed during compilation')
    fragment = {'schemaVersion':1,'id':ID,'cell':[128,160],
        'status':'held own-source moving mouth registrations; CPU field transport only',
        'walks':moves,'bridges':bridges,'turns':turns,'stops':stops,'gesture':gesture_cells,
        'standing':copy.deepcopy(standing_doc['standing']),
        'inputFiles':inputs,'driverSha256':digest(Path(__file__)),
        'selection':{'selectedCells':364,'visible':276,'null':88},
        'limitations':['No moving-mouth shader, browser, GPU, or native approval from this registration fragment.']}
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(json.dumps(fragment,indent=2,allow_nan=False)+'\n',encoding='utf8')
    proof = {'fragment':reference(destination),'upperSourceRgbaSha256':upper_hashes,
        'profileSha256':digest(PROFILE),'standingFileSha256':digest(STANDING),
        'walkReceiptSha256':digest(walk_source/'walk-source.json'),
        'stopReceiptSha256':digest(stop_source/'stop-source.json'),
        'gestureReceiptSha256':digest(gesture_source/'key16.json'),
        'gestureHeadExactFrames':16,'visible':276,'null':88,
        'transportExamples':{
            'rightWalk0':transport_proof(sources['right'],walk['fields']['right'][0]['actualUpperWarp'],
                upper_hashes['right'],moves['right'][0]),
            'leftWalk8':transport_proof(sources['left'],walk['fields']['left'][8]['actualUpperWarp'],
                upper_hashes['left'],moves['left'][8]),
            'rightStopPhase0Stage0':transport_proof(sources['right'],stop['records'][16]['frames'][0]['actualUpperWarp'],
                upper_hashes['right'],stops[64]),
            'leftStopPhase8Stage0':transport_proof(sources['left'],stop['records'][56]['frames'][0]['actualUpperWarp'],
                upper_hashes['left'],stops[224]),
            'downNeutralBaseline':transport_proof(sources['down'],walk['neutrals']['down']['actualUpperWarp'],
                upper_hashes['down'],turns[0])},
        'limits':'CPU source-field and alpha identity only; shader/native review pending'}
    proof_path.parent.mkdir(parents=True,exist_ok=True)
    proof_path.write_text(json.dumps(proof,indent=2,allow_nan=False)+'\n',encoding='utf8')
    print(json.dumps({'fragment':str(destination),'sha256':digest(destination),
                      'selected':364,'visible':276,'null':88},indent=2))


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--walk-source',type=Path,default=DEFAULT_WALK)
    parser.add_argument('--stop-source',type=Path,default=DEFAULT_STOP)
    parser.add_argument('--gesture-source',type=Path,default=DEFAULT_GESTURE)
    parser.add_argument('--outdir',type=Path,default=DEFAULT_OUT)
    args=parser.parse_args()
    build(args.walk_source,args.stop_source,args.gesture_source,args.outdir)


