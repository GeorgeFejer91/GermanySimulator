"""Bind the existing selective-delivery output to Bärbel's actor entry only."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[5];ID='crowd-baerbel-brezel'
path=ROOT/'output/street-redesign/baerbel-brezel-end-to-end/private-manifest-v2.json';manifest=json.loads(path.read_text());old=manifest['characters'].copy()
delivery=ROOT/'assets/characters/residents'/ID/'delivery-v2/delivery/motion-delivery.json'
packet=json.loads(delivery.read_text());assert packet['id']==ID
person=manifest['characters'][ID];assert person['figureWorldHeight']==2.33 and person['strideDistance']==11.65 and person['grid']==[21,20]
person['motionDelivery']={'file':'./'+delivery.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(delivery.read_bytes()).hexdigest()}
assert all(manifest['characters'][k]==v for k,v in old.items() if k!=ID)
path.write_text(json.dumps(manifest,separators=(',',':'),ensure_ascii=False)+'\n')
print(json.dumps(person['motionDelivery']))

# Authored packet for source-stage regression; production registry remains integrator-owned.
(ROOT/'assets/characters/residents'/ID/'delivery-v2/person.json').write_text(json.dumps(person,indent=2)+'\n')
