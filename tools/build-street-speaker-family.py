"""Bake one source-bound street speaker using the resident motion implementation."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import math
import re

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


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
        for view in person['views'].values():
            if view.get('plantedTransition') not in (None, 'fade-to-source'):
                raise ValueError('Unknown planted transition recipe')
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
    original_neutral = builder.neutral
    original_bridge = builder.bridge_frames
    original_bindings = builder.source_bindings

    def neutral(person, direction):
        if person['views'][direction].get('plantedTransition') == 'fade-to-source':
            return builder.motion(person, direction, count=4, strength=0, phases=[0])[0][0]
        return original_neutral(person, direction)

    def bridge_frames(person, direction):
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

    builder.neutral = neutral
    builder.bridge_frames = bridge_frames
    builder.source_bindings = source_bindings
    return builder, spec


def apply_family_metadata(manifest, spec, person):
    manifest.update(world_geometry(spec, person))
    for state in manifest['interactions']['states'].values():
        state['visualStatus'] = 'candidate limited body diagnostic; not authored greeting/work/answer-review'
    manifest['limitations'].append('Generic idle/look/success/failure diagnostics do not supply own greeting, work or answer-review gesture art.')
    return manifest


def check_geometry(manifest, spec, person):
    for field, expected in world_geometry(spec, person).items():
        if not math.isclose(manifest.get(field, -1), expected, rel_tol=0, abs_tol=1e-12):
            raise ValueError('Export family geometry mismatch: ' + field)


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
        return True
    if not builder.build(key):
        return False
    path = builder.DEST / key / 'manifest.json'
    manifest = apply_family_metadata(json.loads(path.read_text()), spec, person)
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
