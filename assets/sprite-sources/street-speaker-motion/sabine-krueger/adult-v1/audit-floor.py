"""Measure exact exported alpha21 sole support against the unchanged pivot."""
from pathlib import Path
import json,hashlib,importlib.util
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run():
 p=ROOT/'output/street-redesign/sabine-end-to-end/full-working/body-index.json';index=json.loads(p.read_text());s=importlib.util.spec_from_file_location('sabine_floor_export',ROOT/'tools/build-street-character-sprites.py');street=importlib.util.module_from_spec(s);s.loader.exec_module(street);cases=[]
 for name,w,h in [('desktop',96,120),('mobile',64,80)]:
  q=w/128;pivot=150*q
  for cell in index['cells']:
   file=ROOT/cell['source']['file'];assert sha(file)==cell['source']['sha256'];im=street.export_cell(Image.open(file).convert('RGBA'),{'cell':[w,h],'pivot':[64*q,pivot],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}});y,x=np.nonzero(np.array(im)[:,:,3]>=21);bottom=int(y.max())+1;error=bottom-pivot
   assert error<=1.5,(name,cell['heading'],cell['kind'],cell['row'],cell['col'],error)
   cases.append({'variant':name,'heading':cell['heading'],'kind':cell['kind'],'slot':cell['row']*21+cell['col'],'alpha21BottomExclusive':bottom,'pivotY':pivot,'belowPivotPixels':error})
 out=ROOT/'output/street-redesign/sabine-end-to-end/native-floor.json';out.write_text(json.dumps({'bodyIndexSha256':sha(p),'nativeAntialiasEdgeAllowancePixels':1.5,'maximumBelowPivot':max(c['belowPivotPixels'] for c in cases),'cells':cases},indent=2)+'\n');print(json.dumps({'checked':len(cases),'maximumBelowPivot':max(c['belowPivotPixels'] for c in cases)}))
if __name__=='__main__':run()
