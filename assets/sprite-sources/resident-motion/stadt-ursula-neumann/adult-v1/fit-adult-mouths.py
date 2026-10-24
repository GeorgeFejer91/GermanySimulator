"""Fit Ursula's own painted closed lip creases, no other actor profile."""
from pathlib import Path
import hashlib,importlib.util,json
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/ursula-neumann-end-to-end/adult-mouth-fit'
TRACE={
 'down':([271,138.6],[8.5,0,0,2.7],[[262.5,139],[266.75,138],[271,138.2],[275.25,138.8],[279.5,140]]),
 'front-right':([280.5,137.4],[7.5,0,0,2.6],[[273,137.9],[276.75,136.8],[280.5,137.1],[284.25,137.6],[288,139.2]]),
 'right':([280,139.8],[3.5,0,0,2.4],[[276.5,140],[278.25,139.7],[280,139.8],[281.75,140],[283.5,140.2]]),
 'left':([229.5,139.2],[4,0,0,2.2],[[225.5,138.4],[227.5,138.8],[229.5,139],[231.5,139.7],[233.5,140.4]]),
 'front-left':([224,137.5],[5.5,0,0,2.5],[[218.5,137],[221.25,137.2],[224,137.5],[226.75,138],[229.5,139]]),
 'up':None,'rear-right':None,'rear-left':None}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def run():
 OUT.mkdir(parents=True,exist_ok=True);mouth=load('ursula_own_lips',ROOT/'tools/build-street-mouths.py');street=load('ursula_export',ROOT/'tools/build-street-character-sprites.py')
 regs={};entries={};checks={};pins={p.relative_to(ROOT).as_posix():sha(p) for p in [Path(__file__),ROOT/'tools/build-street-mouths.py',ROOT/'tools/build-street-character-sprites.py']}
 for heading,trace in TRACE.items():
  if trace is None:regs[heading]=None;continue
  path=HERE/'registered'/f'{heading}.png';im=Image.open(path).convert('RGBA');pins[path.relative_to(ROOT).as_posix()]=sha(path)
  center,axes,crease=trace;crease=np.array(crease,float);upper=crease.copy();lower=crease.copy()
  upper[:,1]-=np.array([0,.45,.6,.35,0])*axes[3];lower[:,1]+=np.array([0,.65,.85,.55,0])*axes[3]
  entry={'input':{'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':[512,512]},'centerPx':center,'axesPx':axes,
   'contoursPx':{'crease':crease.tolist(),'source_upper':crease.tolist(),'source_lower':crease.tolist(),'open_upper':upper.tolist(),'open_lower':lower.tolist()},'width':[.08,.12],'teeth':0}
  reg=mouth.compile_registration(entry);mouth.review_board('stadt-ursula-neumann',heading,entry,reg,OUT)
  closed=mouth.preview(entry,reg,0);opened=mouth.preview(entry,reg,1)
  assert closed.tobytes()==im.tobytes();assert opened.getchannel('A').tobytes()==im.getchannel('A').tobytes()
  changed=int(np.count_nonzero(np.any(np.array(opened)[:,:,:3]!=np.array(im)[:,:,:3],axis=2)))
  assert changed>0;checks[heading]={'closedExact':True,'openAlphaExact':True,'changedRgbPixels':changed};regs[heading]=reg;entries[heading]=entry
 front=Image.open(HERE/'registered/down.png').convert('RGBA');standing=street.export_cell(front,{'cell':[128,160],'pivot':[64,150],'figureHeight':136,'working':{'figureHeight':400,'baseline':472}});standing.save(OUT/'standing-candidate.png')
 s=136/400;center=np.array([64,150])+(np.array(TRACE['down'][0])-[256,472])*s;axes=np.array(TRACE['down'][1])*s
 regs['standing']={'rect':[float(center[0]/128),float(1-center[1]/160),float(np.linalg.norm(axes[:2])/128),float(np.linalg.norm(axes[2:])/160)],'axes':axes.tolist(),'profile':regs['down']['profile']}
 data={'identity':'stadt-ursula-neumann','status':'SOURCE native/rendered review pending','pins':pins,'manualClosedLipFits':TRACE,'sourceEntries':entries,'registrations':regs,'checks':checks,'noMouthReason':'Rear/rear-quarter face absent or only silhouette sliver; no invented frontal lips.'}
 (OUT/'fit.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(checks))
if __name__=='__main__':run()
