"""Crowd-only entry point for the shared source-bound resident motion builder."""
from pathlib import Path
import argparse
import importlib.util
import json

ROOT = Path(__file__).resolve().parents[1]
loader = importlib.util.spec_from_file_location('resident_motion', ROOT/'tools/build-resident-motion.py')
resident = importlib.util.module_from_spec(loader)
loader.loader.exec_module(resident)
resident.SPEC = ROOT/'assets/sprite-sources/resident-motion/crowd-motion-spec.json'
resident.QA = ROOT/'output/resident-motion/crowd'

def initialize():
    if resident.SPEC.exists():
        raise ValueError('Refusing to overwrite crowd source fittings')
    spec = json.loads((ROOT/'assets/sprite-sources/street-residents/motion-spec.json').read_text())
    spec['characters'] = {k:v for k,v in spec['characters'].items() if k.startswith('crowd-')}
    resident.json_write(resident.SPEC, spec)

def sampled_probe(key):
    """Inspect quarter-cycle weight maxima as well as contact extremes."""
    person=json.loads(resident.SPEC.read_text())['characters'][key]
    directory=resident.QA/key
    directory.mkdir(parents=True,exist_ok=True)
    for direction in resident.DIRECTIONS:
        frames,_=resident.motion(person,direction,count=8)
        for i,frame in enumerate(frames):frame.save(directory/f'{direction}-sampled-{i}.png')
        for color,name in [('#eee8db','light'),('#25272b','dark')]:
            resident.street.opaque_board(frames,4,color).save(directory/f'{direction}-sampled-{name}.png')
    print('Eight-phase probe written: '+key,flush=True)

def turn_probe(key):
    person=json.loads(resident.SPEC.read_text())['characters'][key]
    directory=resident.QA/key
    directory.mkdir(parents=True,exist_ok=True)
    frames=[]
    for i,entry in enumerate(person['turn_sources']):
        if 'neutral' in entry:frame=resident.neutral(person,entry['neutral'])
        else:
            path=ROOT/entry['source']
            if resident.paint.digest(path)!=entry['sourceSha256']:raise ValueError('Turn source changed')
            frame,_=resident.street.register_source(resident.Image.open(path).convert('RGBA'),entry,entry['scale'],resident.BASELINE)
        frame.save(directory/f'turn-source-{i}.png')
        frames.append(frame)
    for color,name in [('#eee8db','light'),('#25272b','dark')]:
        resident.street.opaque_board(frames,4,color).save(directory/f'turn-source-{name}.png')
    print('Turn source probe written: '+key,flush=True)


def export_probe(key):
    """Decode delivered cells for review, without asserting visual approval."""
    directory=resident.DEST/key
    manifest=json.loads((directory/'manifest.json').read_text())
    output=resident.QA/key
    evidence={'status':'candidate-unapproved','reviewed':False,'variants':{}}
    for name,variant in manifest['variants'].items():
        path=directory/variant['image']
        atlas=resident.Image.open(path).convert('RGBA')
        width,height=variant['frame_size']
        groups={'walk':[(row,col) for row in range(4) for col in range(16)],
                'bridge':[(row,col) for row in range(4,8) for col in range(5)],
                'turn':[(8,col) for col in range(8)],
                'reaction':[(row,col) for row in range(9,13) for col in range(16)]}
        files={}
        for group,cells in groups.items():
            frames=[atlas.crop((col*width,row*height,(col+1)*width,(row+1)*height)) for row,col in cells]
            files[group]={'cells':cells,'boards':{}}
            for color,background in [('#eee8db','light'),('#25272b','dark')]:
                target=output/f'{name}-{group}-exact-{background}.png'
                columns=5 if group=='bridge' else 8
                # Keep encoded frame pixels at their actual delivered size.
                board=resident.Image.new('RGBA',(columns*width,((len(frames)+columns-1)//columns)*height),color)
                for index,frame in enumerate(frames):board.alpha_composite(frame,((index%columns)*width,(index//columns)*height))
                board.convert('RGB').save(target)
                files[group]['boards'][background]={'file':str(target.relative_to(ROOT)),'sha256':resident.paint.digest(target)}
        evidence['variants'][name]={'export':str(path.relative_to(ROOT)),'sha256':resident.paint.digest(path),'groups':files}
    resident.json_write(output/'exact-export-evidence.json',evidence)
    print('Exact export boards written: '+key,flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--initialize', action='store_true')
    parser.add_argument('--character')
    parser.add_argument('--probe', action='store_true')
    parser.add_argument('--sampled-probe', action='store_true')
    parser.add_argument('--turn-probe', action='store_true')
    parser.add_argument('--export-probe', action='store_true')
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--calibrate', action='store_true')
    args = parser.parse_args()
    if args.initialize: initialize()
    if args.character:
        if not args.character.startswith('crowd-'): raise ValueError('Crowd ownership only')
        if args.probe: resident.probe(args.character)
        elif args.sampled_probe: sampled_probe(args.character)
        elif args.turn_probe: turn_probe(args.character)
        elif args.export_probe: export_probe(args.character)
        elif args.check: resident.check(args.character)
        elif args.calibrate: resident.calibrate(args.character)
        else: raise SystemExit(0 if resident.build(args.character) else 1)
