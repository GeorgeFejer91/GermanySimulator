"""Pack Ute through the existing delivery tool in an ignored actor-only mirror.

Each stage is bounded separately. No selected runtime, registry or voice write.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,shutil
ROOT=Path(__file__).resolve().parents[5];ID='stadt-ute-ruhe'
WORK=ROOT/'output/street-redesign/ute-ruhe-end-to-end';COMPILED=WORK/'compiled-v1';MIRROR=WORK/'private-mirror-v1'
DEST=MIRROR/'assets/characters/residents'/ID/'delivery-v2';MANIFEST=MIRROR/'assets/characters/street/manifest.json'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,data):p.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
def main(stage):
 if stage=='init':
  assert not MIRROR.exists(),'Preserve previous private packet'
  receipt=json.loads((COMPILED/'compile-receipt.json').read_text());DEST.mkdir(parents=True)
  for name,digest in receipt['outputs'].items():
   source=COMPILED/name;assert sha(source)==digest;shutil.copy2(source,DEST/name)
  person=json.loads((DEST/'person.json').read_text());assert person['id']==ID and person['figureWorldHeight']==2.33 and person['strideDistance']==11.65
  MANIFEST.parent.mkdir(parents=True);write(MANIFEST,{'schemaVersion':1,'characters':{ID:person}})
  write(MIRROR/'init.json',{'status':'PRIVATE_MIRROR_ONLY','inputs':receipt['outputs'],'productionEdited':False});print('Private own mirror initialized');return
 person=json.loads((DEST/'person.json').read_text());assert person['id']==ID and person['figureWorldHeight']==2.33 and person['strideDistance']==11.65
 if stage=='bind':
  assert not person.get('motionDelivery'),'Preserve previous private binding'
  packet=DEST/'delivery/motion-delivery.json';data=json.loads(packet.read_text());assert data['id']==ID
  person['motionDelivery']={'file':'./assets/characters/residents/'+ID+'/delivery-v2/delivery/motion-delivery.json','sha256':sha(packet)}
  write(DEST/'person.json',person);write(MANIFEST,{'schemaVersion':1,'characters':{ID:person}})
  write(MIRROR/'bind.json',{'status':'AUTHORED_PRIVATE_BINDING_ONLY','height':2.33,'stride':11.65,'personSha256':sha(DEST/'person.json'),'packetSha256':sha(packet),'productionEdited':False});print(json.dumps(person['motionDelivery']));return
 spec=importlib.util.spec_from_file_location('ute_existing_selective_delivery',ROOT/'tools/build-street-motion-delivery.py');tool=importlib.util.module_from_spec(spec);spec.loader.exec_module(tool)
 assert stage in ('build','check')
 if stage=='build':assert not (DEST/'delivery').exists(),'Preserve previous packet'
 result=tool.run(MANIFEST,ID,DEST/'delivery',check=stage=='check',root=MIRROR)
 write(MIRROR/(stage+'-receipt.json'),{'status':'PASS private selective delivery '+stage,'packetSha256':sha(DEST/'delivery/motion-delivery.json'),'movementSlots':sum(p is not None for p in result['packs']['movement']['slots']),'reactionSlots':sum(p is not None for p in result['packs']['reactions']['slots']),'productionEdited':False})
 print(json.dumps({'stage':stage,'packs':{k:len(v['slots']) for k,v in result['packs'].items()},'productionEdited':False}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--stage',choices=('init','build','bind','check'),required=True);main(p.parse_args().stage)
