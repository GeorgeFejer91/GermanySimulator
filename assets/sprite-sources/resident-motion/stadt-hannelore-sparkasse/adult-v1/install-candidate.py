"""Install the pinned Hannelore candidate in this isolated review worktree."""
from pathlib import Path
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[5]
ID = 'stadt-hannelore-sparkasse'
SOURCE = ROOT / 'output/street-redesign/hannelore-end-to-end/candidate-v2'
DEST = ROOT / 'assets/characters/residents/stadt-hannelore-sparkasse/delivery-v2'
MANIFEST = ROOT / 'assets/characters/street/manifest.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run():
    receipt = json.loads((SOURCE / 'compile-receipt.json').read_text())
    assert receipt['id'] == ID and receipt['selectedCells'] == 470
    for name, digest in receipt['outputs'].items():
        assert sha(SOURCE / name) == digest, name
    data = json.loads(MANIFEST.read_text())
    other_people = {key: value for key, value in data['characters'].items() if key != ID}
    person = json.loads((SOURCE / 'person.json').read_text())
    old = data['characters'][ID]
    assert old['standing']['sha256'] == '10f00a68ec8e46e62be8beeb3dcc0e4818e3a8ae657844f48b04992d0b83272e'
    assert old['figureWorldHeight'] == 1.6 and person['figureWorldHeight'] == 2.33
    assert set(person['aliases']) == set(old['aliases'])
    assert DEST.exists() is False
    DEST.mkdir(parents=True)
    for name in ('standing.webp', 'source-desktop.webp', 'source-mobile.webp', 'mouths-v1.json'):
        shutil.copyfile(SOURCE / name, DEST / name)
        assert sha(DEST / name) == receipt['outputs'][name]
    data['characters'][ID] = person
    MANIFEST.write_text(json.dumps(data, separators=(',', ':'), ensure_ascii=False) + '\n')
    assert all(data['characters'][key] == original for key, original in other_people.items())
    print(json.dumps({'installed': ID, 'outputs': receipt['outputs'], 'manifestSha256': sha(MANIFEST)}))


if __name__ == '__main__':
    run()
