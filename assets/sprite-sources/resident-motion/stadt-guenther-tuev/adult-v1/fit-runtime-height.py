"""Apply Günther's rendered height fit after the unchanged source rebuild."""
from pathlib import Path
import hashlib
import importlib.util
import json

ROOT = Path(__file__).resolve().parents[5]
ID = 'stadt-guenther-tuev'
WORK = ROOT / 'output/street-redesign/guenther-end-to-end'
RUNTIME = ROOT / 'assets/characters/residents' / ID / 'delivery-v2'
manifest_path = ROOT / 'assets/characters/street/manifest.json'
manifest = json.loads(manifest_path.read_text())
person = json.loads((WORK / 'private-manifest.json').read_text())['characters'][ID]
assert person['figureWorldHeight'] == 2.33
person['strideDistance'] *= 2.77 / person['figureWorldHeight']
person['figureWorldHeight'] = 2.77
manifest['characters'][ID] = person
fit_manifest = WORK / 'height-fit-manifest.json'
fit_manifest.write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + '\n')

spec = importlib.util.spec_from_file_location('street_delivery', ROOT / 'tools/build-street-motion-delivery.py')
delivery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(delivery)
delivery.run(fit_manifest, ID, RUNTIME / 'delivery')
packet = RUNTIME / 'delivery/motion-delivery.json'
person['motionDelivery']['sha256'] = hashlib.sha256(packet.read_bytes()).hexdigest()
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + '\n')
(RUNTIME / 'person.json').write_text(json.dumps(person, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'id': ID, 'height': person['figureWorldHeight'], 'stride': person['strideDistance']}))
