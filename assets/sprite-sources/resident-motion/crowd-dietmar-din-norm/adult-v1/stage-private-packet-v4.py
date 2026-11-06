"""Existing selective packer in an ignored actor-only staging root; no runtime install."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,shutil
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4];ID='crowd-dietmar-din-norm'
WORK=ROOT/'output/street-redesign/dietmar-din-norm-end-to-end'
STAGE=ROOT/'output/dietmar-height/authored-packet-v4'
ASSET=Path('assets/characters/residents')/ID/'delivery-v2'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,data):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False,allow_nan=False)+'\n')
def run(mode):
 assert STAGE.is_relative_to(ROOT/'output/dietmar-height')
 candidate=WORK/'candidate-v4';manifest=STAGE/'private-manifest.json';folder=STAGE/ASSET;delivery=folder/'delivery'
 if mode=='init':
  assert not STAGE.exists(),'Preserve prior authored staging'
  receipt=json.loads((candidate/'compile-receipt.json').read_text());person=json.loads((candidate/'person.json').read_text())
  assert person['id']==ID and person['figureWorldHeight']==2.33 and person['strideDistance']==11.65
  folder.mkdir(parents=True)
  for name in ['standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json','person.json']:
   assert sha(candidate/name)==receipt['outputs'][name];shutil.copy2(candidate/name,folder/name)
  write(manifest,{'schemaVersion':1,'characters':{ID:person}})
 else:
  assert manifest.is_file()
  if mode in ('pack','check'):
   spec=importlib.util.spec_from_file_location('dietmar_existing_selective_packer',ROOT/'tools/build-street-motion-delivery.py')
   helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
   result=helper.run(manifest,ID,delivery,check=mode=='check',root=STAGE)
   assert result['id']==ID and result['definitionHashFormat']=='typed-json-f64-v1'
  else:
   assert mode=='bind';data=json.loads(manifest.read_text());person=data['characters'][ID]
   assert person['figureWorldHeight']==2.33 and person['strideDistance']==11.65
   packet=json.loads((delivery/'motion-delivery.json').read_text());assert packet['id']==ID
   person['motionDelivery']={'file':'./'+(ASSET/'delivery/motion-delivery.json').as_posix(),'sha256':sha(delivery/'motion-delivery.json')}
   write(manifest,data);write(folder/'person.json',person)
 print(json.dumps({'mode':mode,'stageRoot':STAGE.relative_to(ROOT).as_posix(),'productionAssetsWritten':False,'canonicalWritten':False}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--mode',required=True,choices=['init','pack','bind','check']);run(p.parse_args().mode)
