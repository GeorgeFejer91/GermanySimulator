"""Measure Irmgard's actual source-owned sole paint on exact native body cells.

The opaque sole patches are the independently inspected patches in
test-own-sole-direction.py. They are transported with the production source
field. Their native alpha-weighted centres retain subpixel paint travel. This
does not establish actual projected world-floor planting or hidden far feet.
"""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/aktenstapel-end-to-end';OUT=WORK/'sole-cadence'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def load(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def main():
 own=load('aktenstapel_sole_annotations',HERE/'test-own-sole-direction.py')
 actor=load('aktenstapel_sole_transport',HERE/'pilot-motion.py')
 street=load('aktenstapel_sole_export',ROOT/'tools/build-street-character-sprites.py')
 assess=load('aktenstapel_sole_assess',ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py')
 body_path=WORK/'full-working/body-index.json';body=json.loads(body_path.read_text())
 OUT.mkdir(parents=True,exist_ok=True);cases=[];observations=[];pins={}
 for heading,polygon in own.PATCH.items():
  source=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
  stencil=Image.new('L',(512,512));ImageDraw.Draw(stencil).polygon(polygon,fill=255)
  rgba=np.array(source);keep=(np.array(stencil)>0)&(rgba[:,:,3]>=200)
  rgba[~keep]=0;patch=Image.fromarray(rgba)
  row=1 if heading=='right' else 3;travel=1 if heading=='right' else -1
  for variant,w,h in [('desktop',96,120),('mobile',64,80)]:
   selected=ROOT/'assets/characters/residents/stadt-irmgard-aktenstapel/delivery-v2'/f'source-{variant}.webp'
   atlas=Image.open(selected).convert('RGBA') if selected.exists() else None
   if atlas is not None:pins[selected.relative_to(ROOT).as_posix()]=sha(selected)
   q=w/128;spec={'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}}
   samples=[]
   for phase in (4,6,8,10,12):
    cell=next(c for c in body['cells'] if (c['row'],c['col'])==(row,phase))
    source_cell=ROOT/cell['source']['file'];assert sha(source_cell)==cell['source']['sha256']
    encoded=street.export_cell(Image.open(source_cell).convert('RGBA'),spec)
    if atlas is not None:
     actual=atlas.crop((phase*w,row*h,(phase+1)*w,(row+1)*h));assert actual.tobytes()==encoded.tobytes()
    sx,sy,_=actor.side_field(heading,phase/16*math.tau)
    transported=actor.paint.unpack(actor.paint.sample(actor.paint.premul(patch),sx,sy))
    mask=street.export_cell(transported,spec);point=own.center(mask)
    samples.append({'frame':phase,'along_pixels':travel*point[0],'pointPx':point,
     'ownSolePolygon':polygon,'sourceCellSha256':sha(source_cell)})
   data={'character':'stadt-irmgard-aktenstapel','view':heading,'variant':variant,
    'atlas_sha256':sha(selected) if atlas is not None else None,'frames_per_cycle':16,
    'game_units_per_pixel':2.33/(136*q*.02),'current_cycle_distance':7.71,
    'shoe_length_pixels':32*136/400*q,
    'contacts':[{'foot':'own visible near-sole paint patch','samples':samples}]}
   result=assess.assess(data);result['variant']=variant;cases.append(result);observations.append(data)
 mean=sum(c['fitted_cycle_distance'] for c in cases)/len(cases)
 report={'bodyIndexSha256':sha(body_path),'selectedAtlasPins':pins,
  'exactSelectedCellsChecked':20 if len(pins)==2 else 0,
  'fittedCycle':mean,'fitRange':[min(c['fitted_cycle_distance'] for c in cases),max(c['fitted_cycle_distance'] for c in cases)],
  'assessments':cases,'observations':observations,
  'limits':['Actual near-sole RGB patch transport, not nearDx metadata or a copied actor clock.',
   'The narrow visible far-shoe portions are not separately calibrated through overlap.',
   'Native patch centroid retains alpha-weighted subpixel travel; it does not waive actual game planting review.']}
 (OUT/'report.json').write_bytes((json.dumps(report,indent=2)+'\n').encode())
 print(json.dumps({k:report[k] for k in ['fittedCycle','fitRange','exactSelectedCellsChecked']}))

if __name__=='__main__':main()
