"""Compile reviewed Sandale cell fits to ignored integration metadata.

This does not edit a manifest or accepted atlas. Source registrations own the
geometry; the existing shared compiler owns normalization and contour checks.
"""
from pathlib import Path
import hashlib
import importlib.util
import json

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('street_mouth_compiler', ROOT / 'tools/build-street-mouths.py')
compiler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compiler)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(kind):
    folder = ROOT / 'assets/sprite-sources/sandale-mouths'
    inventory = json.loads((folder / f'{kind}-remaining-v1.registration.json').read_text())
    manifest = json.loads((ROOT / f'assets/tourists/{kind}/manifest.json').read_text())
    assert inventory['sourceSha256'] == manifest['sha256']
    assert inventory['cell'] == manifest['frame_size']
    assert inventory['grid'] == [manifest['cols'], manifest['rows']]
    assert len(inventory['coverage']) == manifest['cols'] * manifest['rows']
    loaded, sources, frames = {}, {}, []
    for slot, cell in enumerate(inventory['coverage']):
        assert cell['slot'] == slot
        if 'registrationIndex' not in cell:
            assert cell.get('registration') is None
            frames.append(None)
            continue
        reference = cell.get('registrationFile', (folder / f'{kind}-remaining-v1.registration.json').relative_to(ROOT).as_posix())
        if reference not in loaded:
            source = ROOT / reference
            loaded[reference] = json.loads(source.read_text())
            sources[reference] = digest(source)
        entry = loaded[reference]['frames'][cell['registrationIndex']]
        assert entry['cellOriginPx'] == [cell['col'] * manifest['frame_size'][0], cell['row'] * manifest['frame_size'][1]]
        assert entry['input']['sha256'] == manifest['sha256']
        compiled = compiler.compile_registration(entry)
        frames.append({key: compiled[key] for key in ['rect', 'axes', 'profile']})
    expected = 106 if kind == 'towelMan' else 105
    assert sum(frame is not None for frame in frames) == expected
    result = dict(schemaVersion=1, sourceSha256=manifest['sha256'], cell=inventory['cell'], grid=inventory['grid'], frames=frames)
    output = ROOT / 'output/ambient-city-animation/sandale-mouth-integration'
    output.mkdir(parents=True, exist_ok=True)
    path = output / f'{kind}-mouth-paint.json'
    path.write_text(json.dumps(result, separators=(',', ':')) + '\n', newline='\n')
    return dict(character=kind, file=path.relative_to(ROOT).as_posix(), sha256=digest(path), visible=expected, null=len(frames)-expected, sourceRegistrations=sources)


if __name__ == '__main__':
    results = [build(kind) for kind in ['towelMan', 'towelWoman']]
    path = ROOT / 'output/ambient-city-animation/sandale-mouth-integration/compile-receipt.json'
    path.write_text(json.dumps(results, indent=2) + '\n', newline='\n')
    print(json.dumps(results))
