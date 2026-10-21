"""Pilot a modest own-source elbow/key emphasis with the existing mesh sampler."""
from pathlib import Path
import hashlib
import importlib.util
import json
import math
import sys

import numpy as np
from PIL import Image
from scipy.spatial import Delaunay
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[5]
FOLDER = Path(__file__).resolve().parent
OUT = ROOT/'output/ambient-city-animation/heike-key-gesture-v3'
sys.path.insert(0, str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import morph_frames
import painted_walk
definition = importlib.util.spec_from_file_location('street', ROOT/'tools/build-street-character-sprites.py')
street = importlib.util.module_from_spec(definition)
definition.loader.exec_module(street)
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()


def rotation(degrees):
    a = math.radians(degrees)
    return np.array([[math.cos(a), -math.sin(a)], [math.sin(a), math.cos(a)]])


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    source_path = FOLDER.parent/'registered-cardinals-v3-candidate.png'
    if sha(source_path) != 'bfe0660b663a96ac545dfa3da55e37851b16a64a95cb60d9eff66855915badfc':
        raise ValueError('Changed own neutral source')
    neutral = Image.open(source_path).convert('RGBA').crop((0, 0, 512, 512))
    shoulder = np.array([175., 270.])
    elbow = np.array([145., 340.])
    moved_elbow = shoulder + rotation(10) @ (elbow-shoulder)
    # The hand, complete keyring and grip use one rigid transform. The original
    # connected sleeve moves from its fixed shoulder to the displaced elbow.
    hand_points = [(180,282),(198,282),(215,291),(226,310),(214,320),
                   (226,334),(226,354),(215,374),(195,382),(176,373),
                   (165,350),(156,335),(156,316),(168,298),(192,310),(201,343)]
    arm_points = [(148,287),(135,306),(124,327),(127,346),(148,358),(165,357)]
    fixed = [(0,0),(511,0),(511,511),(0,511)]
    fixed += [(x,y) for y in [50,150,245,270] for x in [95,140,230,320,415]]
    fixed += [(240,y) for y in [290,325,365,395]]
    fixed += [(x,y) for y in [400,480] for x in [95,170,230,320,415]]
    fixed += [(x,270) for x in range(0,512,8)] + [(175,270),(511,270)]
    fixed = list(dict.fromkeys(fixed))
    fixed += [(230,y) for y in range(278,399,8)]
    fixed = list(dict.fromkeys(fixed))
    fixed += [(95,280),(80,325),(85,380),(175,390),(230,390),(300,290),(400,380)]
    pairs = [(point, point) for point in fixed]
    pairs += [(point, (moved_elbow+rotation(-5) @ (np.array(point)-elbow)).tolist()) for point in hand_points]
    pairs += [(point, (shoulder+rotation(10) @ (np.array(point)-shoulder)).tolist()) for point in arm_points]
    points = np.array(pairs, dtype=float)
    triangles = Delaunay(points.mean(axis=1)).simplices
    morph_frames.validate_mesh(points[:,0], points[:,1], triangles)
    controls = dict(status='held source-pixel gesture pilot; visual review required',
        action='modest outward elbow and key emphasis; not an overhead wave',
        source=dict(file=source_path.relative_to(ROOT).as_posix(), sha256=sha(source_path), crop=[0,0,512,512]),
        pointsSource=points[:,0].tolist(), pointsTarget=points[:,1].tolist(), triangles=triangles.tolist(),
        shoulderFixed=shoulder.tolist(), elbowSource=elbow.tolist(), elbowTarget=moved_elbow.tolist(),
        upperArmDegrees=10, forearmHandKeyDegrees=-5,
        fieldOwner='.agents/skills/animate-2d-characters/scripts/morph_frames.py',
        fieldOwnerSha256=sha(ROOT/'.agents/skills/animate-2d-characters/scripts/morph_frames.py'),
        samplerSha256=sha(ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py'),
        limitations=['Small connected deformation only; no hidden-arm reconstruction or large new pose.',
                     'Head and mouth stay in exact original source pose; dynamic runtime ownership not integrated.'])
    (FOLDER/'controls.json').write_text(json.dumps(controls,indent=2)+'\n')
    times = [0,.30,.65,1,.65,.30,0]
    frames = []
    cache = {0:neutral}
    checks = []
    source = morph_frames.premultiplied(neutral)
    original = np.asarray(neutral)
    for index, t in enumerate(times):
        if t not in cache:
            coordinates, _ = morph_frames.coordinate_maps(points[:,0],points[:,1],triangles,t,neutral.size)
            cache[t] = painted_walk.unpack(morph_frames.sample(source,coordinates))
        frame = cache[t]
        pixels = np.asarray(frame)
        if not np.array_equal(pixels[:270], original[:270]):
            raise ValueError('Stationary own head/mouth changed')
        if not np.array_equal(pixels[400:], original[400:]):
            raise ValueError('Planted source feet changed')
        if not np.array_equal(pixels[280:390,300:400], original[280:390,300:400]):
            raise ValueError('Stationary card/left-hand changed')
        groups, _ = label(pixels[:,:,3]>=128)
        sizes=np.bincount(groups.ravel());sizes[0]=0
        checks.append(dict(index=index,t=t,headMouthExact=True,feetExact=True,cardsExact=True,
                           largestOpaqueFraction=float(sizes.max()/sizes.sum())))
        if sizes.max()/sizes.sum() < .995:
            raise ValueError('Detached substantial painted source region')
        frame.save(OUT/('working-'+str(index).zfill(2)+'.png'))
        frames.append(frame)
        print('Key emphasis source sample '+str(index),flush=True)
    for width,height,figure,pivot in [(96,120,102,[48,112.5]),(64,80,68,[32,75])]:
        spec=dict(cell=[width,height],figureHeight=figure,pivot=pivot,
                  working=dict(figureHeight=400,baseline=472))
        exported=[street.export_cell(frame,spec) for frame in frames]
        atlas=Image.new('RGBA',(width*len(frames),height))
        for index,frame in enumerate(exported):atlas.alpha_composite(frame,(width*index,0))
        path=OUT/('pilot-'+str(width)+'.webp');atlas.save(path,lossless=True,exact=True,method=6)
        if Image.open(path).convert('RGBA').tobytes()!=atlas.tobytes():raise ValueError('Encoded pilot changed pixels')
        for theme,color in [('light','#eee8db'),('dark','#25272b')]:
            board=Image.new('RGBA',atlas.size,color);board.alpha_composite(atlas)
            board.resize((atlas.width*3,atlas.height*3),Image.Resampling.NEAREST).convert('RGB').save(OUT/(str(width)+'-'+theme+'-3x.png'))
        animation=[]
        for frame in exported:
            board=Image.new('RGBA',frame.size,'#eee8db');board.alpha_composite(frame)
            animation.append(board.resize((width*3,height*3),Image.Resampling.NEAREST).convert('RGB'))
        animation[0].save(OUT/('pilot-'+str(width)+'.gif'),save_all=True,append_images=animation[1:],duration=140,loop=0,disposal=2)
    receipt=dict(status='structural checks only; own source/native visual review outstanding',
                 driverSha256=sha(Path(__file__)),controlsSha256=sha(FOLDER/'controls.json'),samples=checks,
                 distinctSamples=len(cache),endpointsExact=frames[0].tobytes()==frames[-1].tobytes(),runtimeEdited=False)
    (OUT/'structural-checks.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'samples':len(frames),'distinct':len(cache),'output':str(OUT)}),flush=True)


if __name__ == '__main__':
    build()
