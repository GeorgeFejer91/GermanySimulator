"""Update only own delivery definition receipt after an isolated lip-fit change."""
from pathlib import Path
import hashlib,importlib.util,json
ROOT=Path(__file__).resolve().parents[5];ID='stadt-manfred-din'
path=ROOT/'assets/characters/residents'/ID/'delivery-v2/delivery/motion-delivery.json'
receipt=json.loads(path.read_text());person=json.loads((ROOT/'assets/characters/street/manifest.json').read_text())['characters'][ID]
for pack in receipt['packs'].values():
 for meta in pack['variants'].values():
  assert hashlib.sha256((ROOT/meta['file'].removeprefix('./')).read_bytes()).hexdigest()==meta['sha256']
spec=importlib.util.spec_from_file_location('manfred_existing_delivery_identity',ROOT/'tools/build-street-motion-delivery.py');shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
before=receipt['definitionSha256'];receipt['definitionSha256']=shared.definition_fingerprint(person)
path.write_bytes((json.dumps(receipt,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
print(json.dumps({'oldDefinitionSha256':before,'newDefinitionSha256':receipt['definitionSha256'],'allMovementReactionBytesUnchanged':True}))
