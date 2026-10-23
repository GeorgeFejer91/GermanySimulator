"""Rebuild this actor from raw tracked inputs in a new empty private replica.

Run only while holding the heavy CPU lease. No current shared registry is read
as a build input, no installed source PNG/cache is copied, and nothing publishes.
"""
from pathlib import Path
import argparse, hashlib, json, os, shutil, subprocess, sys, time

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
REL = HERE.relative_to(ROOT)
ID = 'quiz-hartmut-keller'
WORK = Path('output/street-redesign/hartmut-keller-end-to-end')
ASSET = Path('assets/characters/street-speakers') / ID / 'delivery-adult-v1'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def run(destination):
    destination = destination.resolve()
    assert destination.is_relative_to(ROOT / 'output') and not destination.exists()
    destination.mkdir(parents=True)
    # A nested empty replica exceeds classic Windows MAX_PATH. Keep every
    # copied source and child script under an extended-length absolute root.
    if os.name == 'nt':
        destination = Path('\\\\?\\' + str(destination))
    pins = {}

    def copy(rel):
        rel = Path(rel)
        source = ROOT / rel
        target = destination / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        pins[rel.as_posix()] = sha(source)
        assert sha(target) == pins[rel.as_posix()]

    # Deliberately exclude generated registration.json, registered/, output and
    # __pycache__. Every required reference remains in the immutable raw chain.
    for p in HERE.iterdir():
        if p.is_file() and p.name != 'registration.json':
            copy(p.relative_to(ROOT))
    raw = Path('assets/sprite-sources/berlin-street-20261022')
    for suffix in ['directions-v1.png', 'diagonals-v1.png', 'front-right-v1.png']:
        copy(raw / f'{ID}-expressionist-{suffix}')
    cardinal = json.loads((HERE / 'cardinal-original-record.json').read_text())
    for ref in cardinal['generationRequest']['referenced_image_paths']:
        copy(ref['path'])
    for kind in ['quarter', 'front-right']:
        request = json.loads((HERE / f'{kind}-generation-request.json').read_text())
        for ref in request['references']:
            copy(ref['path'])
    for name in ['build-street-character-sprites.py', 'build-street-mouths.py',
                 'build-street-motion-delivery.py']:
        copy(Path('tools') / name)
    for name in ['painted_walk.py', 'harmonize_material.py']:
        copy(Path('.agents/skills/animate-2d-characters/scripts') / name)

    env = dict(os.environ, OMP_NUM_THREADS='1', OPENBLAS_NUM_THREADS='1',
               PYTHONDONTWRITEBYTECODE='1')
    flags = (subprocess.CREATE_NO_WINDOW | subprocess.BELOW_NORMAL_PRIORITY_CLASS) if os.name == 'nt' else 0
    steps = []

    def command(script, *args):
        start = time.time()
        arguments = list(args)
        if os.name == 'nt':
            for index, value in enumerate(arguments):
                parts = Path(value).parts
                if parts and parts[0] in ('assets', 'tools', 'output'):
                    arguments[index] = str(destination / value)
        with (destination / 'rebuild.log').open('a', encoding='utf-8') as log:
            log.write(f'\nBEGIN {script} {args}\n'); log.flush()
            child = subprocess.Popen([sys.executable, '-B', str(destination / script), *arguments],
                cwd=destination, env=env, creationflags=flags,
                stdout=log, stderr=subprocess.STDOUT)
            print(json.dumps({'step': str(script), 'pid': child.pid}), flush=True)
            result = child.wait()
        steps.append({'script': str(script), 'exit': result, 'seconds': time.time()-start})
        assert result == 0, (script, result)

    for name in ['prepare-neutrals.py', 'test-provenance.py',
                 'build-family-source.py', 'fit-adult-mouths.py',
                 'prepare-family-mouths.py']:
        command(REL / name)
    candidate = WORK / 'clean-candidate'
    command(REL / 'build-candidate.py', '--outdir', candidate.as_posix(),
            '--stride-distance', '9.68')
    person = json.loads((destination / candidate / 'person.json').read_text())
    folder = destination / ASSET
    folder.mkdir(parents=True)
    for name in ['standing.webp', 'source-desktop.webp', 'source-mobile.webp', 'mouths-v1.json']:
        shutil.copy2(destination / candidate / name, folder / name)
    # Actor-only manifest built from the fresh immutable-baseline recipe.
    manifest = destination / 'assets/characters/street/manifest.json'
    manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest.write_text(json.dumps({'schemaVersion': 1, 'characters': {ID: person}},
                                 separators=(',', ':'))+'\n')
    command(Path('tools/build-street-motion-delivery.py'), '--manifest',
            manifest.relative_to(destination).as_posix(), '--character', ID,
            '--outdir', (ASSET / 'delivery').as_posix())

    baseline = json.loads((HERE / "rebuild-baseline.json").read_text())
    assert baseline["actor"] == ID
    matches = []
    for name in ['standing.webp', 'source-desktop.webp', 'source-mobile.webp', 'mouths-v1.json']:
        got = sha(folder / name); expected = baseline["expectedFiles"][(ASSET / name).as_posix()]
        matches.append({'file': (ASSET / name).as_posix(), 'sha256': got, 'expected': expected})
    for p in sorted((folder / 'delivery').iterdir()):
        got = sha(p); expected = baseline["expectedFiles"][(ASSET / "delivery" / p.name).as_posix()]
        matches.append({'file': (ASSET / 'delivery' / p.name).as_posix(), 'sha256': got, 'expected': expected})
    generated = [REL / 'registration.json']
    generated += [REL / 'registered' / f'{heading}.png' for heading in
                  ['down', 'right', 'up', 'left', 'front-right', 'rear-right', 'rear-left', 'front-left']]
    generated += [WORK / name for name in ['full-working/body-index.json',
                  'adult-mouth-fit/fit.json', 'family-mouths/mouths-working.json']]
    for rel in generated:
        matches.append({'file': rel.as_posix(), 'sha256': sha(destination / rel),
                        'expected': baseline["expectedFiles"][rel.as_posix()]})
    # Immutable expected output is validation-only, after raw generation.
    assert person == baseline['preDeliveryPerson']
    person['motionDelivery'] = {'file': './' + (ASSET / 'delivery/motion-delivery.json').as_posix(),
                               'sha256': sha(folder / 'delivery/motion-delivery.json')}
    assert person == baseline['selectedPerson']
    assert all(x['sha256'] == x['expected'] for x in matches)
    for rel, digest in pins.items():
        assert sha(ROOT / rel) == sha(destination / rel) == digest
    report = {'status': 'PASS', 'actor': ID, 'inputPins': pins, 'steps': steps,
              'samePerson': True, 'exactFiles': matches,
              'copiedGeneratedInputs': False,
              'bootstrap': 'immutable own pre-admission-person.json + legacy-family.json'}
    (destination / 'clean-replay-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'status': 'PASS', 'exactFiles': len(matches), 'samePerson': True}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--outdir', type=Path, required=True)
    run(parser.parse_args().outdir)
