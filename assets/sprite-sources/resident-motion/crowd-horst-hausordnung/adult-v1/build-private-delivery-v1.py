"""Own actor-only private packet stages; no production, selected fit or voice writes."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import shutil

ROOT = Path(__file__).resolve().parents[5]
ID = 'crowd-horst-hausordnung'
BASE = ROOT / 'output/horst-height/full-family-v1'
COMPILED = BASE / 'compiled02'
MIRROR = BASE / 'private01'
DEST = MIRROR / 'assets/characters/residents' / ID / 'delivery-v2'
MANIFEST = MIRROR / 'assets/characters/street/manifest.json'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()

def write(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')

def run(stage):
    if stage == 'init':
        assert not MIRROR.exists(), 'Preserve prior private packet'
        receipt = json.loads((COMPILED / 'compile-receipt.json').read_text())
        assert receipt['id'] == ID and receipt['authoredHeight'] == 2.33 and receipt['authoredStride'] == 13.6305
        DEST.mkdir(parents=True)
        for name, digest in receipt['outputs'].items():
            source = COMPILED / name
            assert sha(source) == digest
            shutil.copy2(source, DEST / name)
        person = json.loads((DEST / 'person.json').read_text())
        assert person['id'] == ID and person['figureWorldHeight'] == 2.33 and person['strideDistance'] == 13.6305
        MANIFEST.parent.mkdir(parents=True)
        write(MANIFEST, {'schemaVersion': 1, 'characters': {ID: person}})
        write(MIRROR / 'init.json', {'status': 'PRIVATE AUTHORED MIRROR ONLY', 'inputs': receipt['outputs'], 'productionEdited': False})
        print('Private Horst mirror initialized')
        return
    person = json.loads((DEST / 'person.json').read_text())
    assert person['id'] == ID and person['figureWorldHeight'] == 2.33 and person['strideDistance'] == 13.6305
    if stage == 'bind':
        assert not person.get('motionDelivery'), 'Preserve prior binding'
        packet = DEST / 'delivery/motion-delivery.json'
        data = json.loads(packet.read_text())
        assert data['id'] == ID
        person['motionDelivery'] = {'file': './assets/characters/residents/' + ID + '/delivery-v2/delivery/motion-delivery.json', 'sha256': sha(packet)}
        write(DEST / 'person.json', person)
        write(MANIFEST, {'schemaVersion': 1, 'characters': {ID: person}})
        write(MIRROR / 'bind.json', {'status': 'AUTHORED PRIVATE BINDING ONLY', 'height': 2.33, 'stride': 13.6305, 'personSha256': sha(DEST / 'person.json'), 'packetSha256': sha(packet), 'productionEdited': False})
        print(json.dumps(person['motionDelivery']))
        return
    assert stage in ['build', 'check']
    if stage == 'build':
        assert not (DEST / 'delivery').exists(), 'Preserve prior packet'
    spec = importlib.util.spec_from_file_location('horst_existing_selective_delivery', ROOT / 'tools/build-street-motion-delivery.py')
    tool = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(tool)
    result = tool.run(MANIFEST, ID, DEST / 'delivery', check=stage == 'check', root=MIRROR)
    write(MIRROR / (stage + '-receipt.json'), {'status': 'PASS private selective delivery ' + stage, 'packetSha256': sha(DEST / 'delivery/motion-delivery.json'), 'movementSlots': sum(value is not None for value in result['packs']['movement']['slots']), 'reactionSlots': sum(value is not None for value in result['packs']['reactions']['slots']), 'productionEdited': False})
    print(json.dumps({'stage': stage, 'packs': {key: len(value['slots']) for key, value in result['packs'].items()}, 'productionEdited': False}))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stage', choices=['init', 'build', 'bind', 'check'], required=True)
    run(parser.parse_args().stage)
