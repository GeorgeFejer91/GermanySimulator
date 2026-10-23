"""Rebuild one adult family from canonical own source, optionally check selected bytes."""
from pathlib import Path
import argparse,hashlib,json,subprocess,sys
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/renate-end-to-end';ID='stadt-renate-termin'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run(a):
 out=a.outdir.resolve();assert out.is_relative_to(ROOT/'output') and not out.exists()
 WORK.mkdir(parents=True,exist_ok=True)
 baseline=json.loads((HERE/'pre-admission-person.json').read_text());assert baseline['id']==ID and baseline['standing']['sha256']=='555be43f14ae488422032e1b6b68dc429c6d6052607991daf5e7834d04c2b1da'
 manifest_path=ROOT/'assets/characters/street/manifest.json';before=sha(manifest_path)
 for name in ['prepare-neutrals.py','fit-adult-mouths.py','build-family-source.py','prepare-family-mouths.py','measure-sole-cadence.py']:
  subprocess.run([sys.executable,str(HERE/name)],cwd=ROOT,check=True)
 cycle=json.loads((WORK/'sole-cadence/report.json').read_text())['fittedCycle']
 subprocess.run([sys.executable,str(HERE/'build-candidate.py'),'--outdir',str(out),'--stride-distance',str(cycle)],cwd=ROOT,check=True)
 receipt={'status':'SOURCE REBUILD; no runtime mutation','cycleDistance':cycle,'candidate':str(out.relative_to(ROOT)),'outputs':{p.name:sha(p) for p in out.iterdir() if p.is_file()}}
 if a.check_selected:
  person=json.loads(manifest_path.read_text())['characters'][ID]
  assert json.loads((out/'person.json').read_text())=={k:v for k,v in person.items() if k!='motionDelivery'}
  selected=ROOT/'assets/characters/residents'/ID/'delivery-v2'
  for name in ['standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json']:assert sha(out/name)==sha(selected/name),name
  subprocess.run([sys.executable,'tools/build-street-motion-delivery.py','--manifest',str(manifest_path),'--character',ID,'--outdir',str(selected/'delivery'),'--check'],cwd=ROOT,check=True)
  assert sha(manifest_path)==before
  receipt['checkSelected']='All four selected own source/body/mouth files and existing five delivery files reproduce byte-exact; actor registry untouched.'
 (out/'rebuild-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--outdir',type=Path,required=True);p.add_argument('--check-selected',action='store_true');run(p.parse_args())
