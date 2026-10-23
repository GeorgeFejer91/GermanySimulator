"""Attach inspected own adult lip fields to the complete logical body family."""
from __future__ import annotations
import hashlib,importlib.util,json,math
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
FIT=ROOT/'output/street-redesign/hannelore-end-to-end/adult-mouth-fit/fit.json'
BODY=ROOT/'output/street-redesign/hannelore-end-to-end/full-working/body-index.json'
OUT=ROOT/'output/street-redesign/hannelore-end-to-end/family-mouths'
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def head(y):
 u=max(0,min(1,(168-y)/32));return u*u*(3-2*u)
def head_derivative(y):
 u=max(0,min(1,(168-y)/32));return -6*u*(1-u)/32
def pose_reg(base,cell):
 center=np.array([base['rect'][0]*512,(1-base['rect'][1])*512],float)
 axes=np.array(base['axes'],float)
 if cell['kind']=='gesture':
  wave=cell['mouthDx']/2
  ysrc=center[1];dest=ysrc
  for _ in range(20):dest=ysrc+7*wave*head(dest)
  center[0]+=cell['mouthDx'];center[1]=dest
  axes[3]/=1-7*wave*head_derivative(dest)
 else:
  center+=np.array([cell['mouthDx'],cell['mouthDy']])
 s=136/400
 dest=np.array([64,150])+(center-np.array([256,472]))*s
 physical=axes*s
 return {'rect':[float(dest[0]/128),float(1-dest[1]/160),float(np.linalg.norm(physical[:2])/128),float(np.linalg.norm(physical[2:])/160)],
         'axes':physical.tolist(),'profile':base['profile']}
def main():
 fit=json.loads(FIT.read_text());index=json.loads(BODY.read_text())
 assert index['identity']==fit['identity']=='stadt-hannelore-sparkasse'
 OUT.mkdir(parents=True,exist_ok=True)
 mouth=load('hannelore_adult_cpu_mouths',ROOT/'tools/build-street-mouths.py')
 street=load('hannelore_adult_cell_export',ROOT/'tools/build-street-character-sprites.py')
 frames=[None]*512;visible=0;checks={}
 for cell in index['cells']:
  slot=cell['row']*16+cell['col'];base=fit['registrations'][cell['heading']]
  if base is None:continue
  reg=pose_reg(base,cell);frames[slot]=reg;visible+=1
  if (cell['row'],cell['col']) in [(0,0),(0,4),(0,8),(0,12),(1,0),(1,4),(1,8),(1,12),(2,0),
                                  (3,0),(3,4),(3,8),(3,12),(8,0),(8,1),(8,2),(8,3),(8,5),(8,6),(8,7),
                                  (16,0),(16,4),(16,8),(16,15)]:
   source=ROOT/cell['source']['file']
   image=Image.open(source).convert('RGBA')
   w=80;s=w/128;export=street.export_cell(image,{'cell':[w,100],'pivot':[64*s,150*s],
      'figureHeight':136*s,'working':{'figureHeight':400,'baseline':472}})
   work_center=np.array([reg['rect'][0]*128,(1-reg['rect'][1])*160])
   physical_center=work_center*s
   physical_axes=np.array(reg['axes'])*s
   path=OUT/f'slot-{slot:03}-80.png';export.save(path)
   preview_reg={'profile':reg['profile']}
   entry={'input':{'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':[80,100]},
          'centerPx':physical_center.tolist(),'axesPx':physical_axes.tolist()}
   closed=mouth.preview(entry,preview_reg,0);opened=mouth.preview(entry,preview_reg,1)
   assert closed.tobytes()==export.tobytes(),slot
   assert opened.getchannel('A').tobytes()==export.getchannel('A').tobytes(),slot
   rgb=np.asarray(export)[:,:,:3];changed=int(np.count_nonzero(np.any(np.asarray(opened)[:,:,:3]!=rgb,axis=2)))
   checks[str(slot)]={'heading':cell['heading'],'kind':cell['kind'],'closedExact':True,
                      'openAlphaExact':True,'changedRgbPixels':changed}
   if changed:
    opened.save(OUT/f'slot-{slot:03}-open-80.png')
    cx,cy=physical_center;box=(int(cx-7),int(cy-5),int(cx+8),int(cy+8))
    for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
     board=Image.new('RGB',((box[2]-box[0])*16*2,(box[3]-box[1])*16+30),bg)
     for j,im in enumerate((export,opened)):
      crop=im.crop(box);flat=Image.alpha_composite(Image.new('RGBA',crop.size,bg),crop)
      board.paste(flat.resize((crop.width*16,crop.height*16),Image.Resampling.NEAREST),(j*crop.width*16,30))
     ImageDraw.Draw(board).text((5,5),f'{slot} {cell["heading"]} {cell["kind"]} own lip',fill='#eee' if theme=='dark' else '#111')
     board.save(OUT/f'slot-{slot:03}-{theme}.png')
 stand=fit['registrations']['standing']
 assert visible>0 and len(frames)==512
 data={'identity':'stadt-hannelore-sparkasse','grid':[16,32],'selectedCells':470,
       'visible':visible,'frames':frames,'standing':stand,
       'status':'PRIVATE adult moving-mouth packet; renderer/media pending',
       'inputPins':{FIT.relative_to(ROOT).as_posix():sha(FIT),BODY.relative_to(ROOT).as_posix():sha(BODY)},
       'sampleChecks':checks}
 (OUT/'mouths-working.json').write_text(json.dumps(data,indent=2)+'\n')
 print(json.dumps({'visible':visible,'explicitNull':512-visible,
                   'checkedNative80':len(checks),'changedNative80':sum(v['changedRgbPixels']>0 for v in checks.values()),
                   'packetSha256':sha(OUT/'mouths-working.json')}))
if __name__=='__main__':main()
