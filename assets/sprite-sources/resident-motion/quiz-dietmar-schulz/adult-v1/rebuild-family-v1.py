"""Rebuild Dietmar's own registered views and neutral layers in a disposable output tree."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label


ROOT = Path.cwd()
RECIPES = Path(__file__).resolve().parent
ACTOR = Path('assets/sprite-sources/resident-motion/quiz-dietmar-schulz/adult-v1')
SAMPLER = ROOT / 'assets/sprite-sources/resident-motion/crowd-waltraud-wartemarke/adult-v1/mixed-material-helper-v3-exact-half.py'
PROFILE_SEEDS = (
    'profile-source-v2.py', 'profile-source-v4.py', 'profile-source-v5.py', 'profile-source-v6.py',
    'profile-neutral-controls-v2.json', 'far-legs-v1/wholepart-transform-v2.json',
    'far-legs-v1/raw-complete-profile-legs-v1.png', 'near-instep-edit-v1/fullpart-transform-v1.json',
    'near-instep-edit-v1/raw-edited-near-leg-v1.png', 'left-foreground-cuff-trace-v1.json',
    'left-near-instep-edit-v1/fullpart-transform-v1.json', 'left-near-instep-edit-v1/raw-edited-near-leg-v1.png',
)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def copy_seeds(target, names):
    for name in names:
        source = ROOT / ACTOR / name
        destination = target / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        with destination.open('xb') as file:
            file.write(source.read_bytes())


def finish(out, stage, products, facts):
    refs = {path.relative_to(out).as_posix(): sha(path) for path in products}
    assert len(refs) == len(products)
    value = {'status': 'PASS_GENERATED_FROM_OWN_RAW_SEEDS', 'stage': stage, 'products': refs, 'facts': facts}
    with (out / f'{stage}-receipt.json').open('x', encoding='utf-8', newline='\n') as file:
        file.write(json.dumps(value, indent=2, allow_nan=False) + '\n')
    print(json.dumps({'stage': stage, 'products': len(refs), 'status': value['status']}))


def registration(out):
    out.mkdir(exist_ok=False)
    actor = out / ACTOR
    copy_seeds(actor, ('raw/raw-eight-views-v1.png', 'register-views-v1.py'))
    worker = load('dietmar_raw_registrar', actor / 'register-views-v1.py')
    assert worker.HERE == actor and worker.ROOT == out
    record = actor / 'registration-v1.json'
    data = json.loads(record.read_text(encoding='utf-8-sig'))
    directions = data['directions']
    products = [record]
    for row in directions.values():
        path = actor / row['file']
        assert sha(path) == row['sha256']
        products.append(path)
    assert set(directions) == {'down', 'right', 'up', 'left', 'down-right', 'up-right', 'up-left', 'down-left'}
    finish(out, 'register', products, {'directions': list(directions)})


def registration_for(out):
    actor = out / ACTOR
    receipt = json.loads((out / 'register-receipt.json').read_text(encoding='utf-8'))
    assert receipt['status'] == 'PASS_GENERATED_FROM_OWN_RAW_SEEDS' and receipt['stage'] == 'register'
    assert len(receipt['products']) == 9
    for path, digest in receipt['products'].items():
        assert sha(out / path) == digest, path
    data = json.loads((actor / 'registration-v1.json').read_text(encoding='utf-8-sig'))
    return actor, data['directions']


def neutral(out):
    actor, _ = registration_for(out)
    copy_seeds(actor, PROFILE_SEEDS)
    cardinal = load('dietmar_cardinal_ownership', RECIPES / 'own-cardinal-neutral-v4.py')
    profile = load('dietmar_profile_ownership', actor / 'profile-source-v6.py')
    cardinals = out / 'cardinal-neutral-parts-v1'
    profiles = out / 'profile-parts-v1'
    cardinals.mkdir(exist_ok=False)
    profiles.mkdir(exist_ok=False)
    products, facts = [], {}
    for heading in ('down', 'up'):
        _, parts, combined, seam, sole_rows, _ = cardinal.partition(actor, heading)
        images = {'neutral': combined, **{name: Image.fromarray(rgba) for name, rgba in parts.items()}}
        for name, image in images.items():
            path = cardinals / f'{heading}-{name}.png'
            image.save(path, compress_level=1)
            products.append(path)
        facts[heading] = {'midlineAlpha': seam, 'soleRows': sole_rows}
    for heading in ('right', 'left'):
        parts = profile.construct(actor, heading)
        for name in ('fixed', 'near', 'oldfar', 'fitted', 'far', 'neutral'):
            path = profiles / f'{heading}-{name}.png'
            Image.fromarray(parts[name]).save(path, compress_level=1)
            products.append(path)
        facts[heading] = parts['sourceQualification']
    assert len(products) == 20
    finish(out, 'neutral', products, facts)


def quarters(out):
    actor, registration = registration_for(out)
    cardinal = load('dietmar_native_export', RECIPES / 'own-cardinal-neutral-v4.py')
    posture = load('dietmar_quarter_posture', RECIPES / 'pilot-own-quarter-height-posture-v1.py')
    export = cardinal.load_export()
    sampler = load('independent_material_sampler', SAMPLER)
    destination = out / 'quarter-height-posture-v1'
    destination.mkdir(exist_ok=False)
    products, facts = [], {}
    for heading, shift in posture.QUARTERS.items():
        with Image.open(actor / registration[heading]['file']) as image:
            original = image.convert('RGBA')
        corrected, proof = posture.source_proposal(original, shift, export.paint, sampler)
        before = posture.bounds(np.asarray(original)[..., 3])
        after = posture.bounds(np.asarray(corrected)[..., 3])
        assert after[1] - before[1] == shift and after[3] == before[3]
        path = destination / f'{heading}-posture-source.png'
        corrected.save(path, compress_level=1)
        products.append(path)
        for tier in cardinal.TIERS:
            before = np.asarray(cardinal.native(original, tier, export))[..., 3]
            after = np.asarray(cardinal.native(corrected, tier, export))[..., 3]
            assert posture.bounds(before)[3] == posture.bounds(after)[3]
            assert posture.bounds(after)[1] > posture.bounds(before)[1]
            assert not any(edge.any() for edge in (after[0], after[-1], after[:, 0], after[:, -1]))
            assert label(after >= 21)[1] <= label(before >= 21)[1]
        facts[heading] = proof
    assert len(products) == 4
    finish(out, 'quarters', products, facts)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--stage', required=True, choices=('register', 'neutral', 'quarters'))
    args = parser.parse_args()
    stages = {'register': registration, 'neutral': neutral, 'quarters': quarters}
    stages[args.stage](args.out.resolve())
