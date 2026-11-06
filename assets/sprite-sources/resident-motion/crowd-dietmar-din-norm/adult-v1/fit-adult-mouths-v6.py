"""Compile own FR4.8/LEFTv5 controls into source registrations; no body export."""
from pathlib import Path
import hashlib,importlib.util,json
import numpy as np
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/dietmar-din-norm-end-to-end/adult-mouth-fit-v6'
FITS=HERE/'lip-fits-v6.json'
HEADINGS=('down','front-right','right','rear-right','up','rear-left','left','front-left')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def native(center,axes,profile,size):
 return {'rect':[center[0]/size[0],1-center[1]/size[1],float(np.linalg.norm(axes[:2]))/size[0],float(np.linalg.norm(axes[2:]))/size[1]],'axes':list(axes),'profile':profile}
def run():
 assert not OUT.exists(),'Preserve every fit generation'
 OUT.mkdir(parents=True)
 spec=importlib.util.spec_from_file_location('dietmar_own_v6_lips',ROOT/'tools/build-street-mouths.py');mouth=importlib.util.module_from_spec(spec);spec.loader.exec_module(mouth)
 fits=json.loads(FITS.read_text());traced=fits['views'];assert set(traced)==set(HEADINGS)
 registrations={};checks={};pins={FITS.relative_to(ROOT).as_posix():sha(FITS),Path(__file__).relative_to(ROOT).as_posix():sha(Path(__file__)),(ROOT/'tools/build-street-mouths.py').relative_to(ROOT).as_posix():sha(ROOT/'tools/build-street-mouths.py')}
 for name in HEADINGS:
  own=traced[name]
  if own is None:registrations[name]=None;continue
  path=HERE/'registered'/f'{name}.png';pins[path.relative_to(ROOT).as_posix()]=sha(path)
  center,axes,profile=own['centerPx'],own['axesPx'],own['profile'];mouth.validate(profile)
  reg=native(center,axes,profile,[512,512]);registrations[name]=reg
  entry={'input':{'file':path.relative_to(ROOT).as_posix()},'centerPx':center,'axesPx':axes}
  closed=mouth.preview(entry,reg,0);opened=mouth.preview(entry,reg,1)
  from PIL import Image
  with Image.open(path) as source:assert closed.tobytes()==source.convert('RGBA').tobytes()
  assert closed.getchannel('A').tobytes()==opened.getchannel('A').tobytes()
  checks[name]={'closedExact':True,'openAlphaExact':True,'changedRgbPixels':int(np.count_nonzero(np.any(np.asarray(opened)[:,:,:3]!=np.asarray(closed)[:,:,:3],axis=2)))}
 s=136/400;center=np.array([64,150])+(np.array(traced['down']['centerPx'])-[256,472])*s
 registrations['standing']=native(center.tolist(),(np.array(traced['down']['axesPx'])*s).tolist(),registrations['down']['profile'],[128,160])
 data={'identity':'crowd-dietmar-din-norm','status':'ROOT_ADMITTED_FR4.8_AND_LEFTv5_SOURCE_FIT; native successor root admission pending','pins':pins,'manualClosedLipFits':traced,'registrations':registrations,'checks':checks}
 (OUT/'fit.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(checks))
if __name__=='__main__':run()
