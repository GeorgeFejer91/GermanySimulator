"""Fit Ursula's source-identified visible near soles on exact native cells.

The source field identifies one unoccluded near-shoe sole in each side view.
Actual source-RGB patches retain native alpha-weighted subpixel centroids. This is encoded calibration,
not proof of actual city floor contact, opposite-foot identity or natural gait. Own exact source-RGB stance marker pilot remains in audit-source-contacts.py.
"""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/ursula-neumann-end-to-end';OUT=WORK/'sole-cadence'
MARKS={'right':{'point':[260,468],'polygon':[(252,463),(269,463),(269,469),(252,469)],'row':1,'travel':1},'left':{'point':[260,468],'polygon':[(252,463),(269,463),(269,469),(252,469)],'row':3,'travel':-1}}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 OUT.mkdir(parents=True,exist_ok=True);index_path=WORK/'full-working/body-index.json';index=json.loads(index_path.read_text())
 street=load('ursula_sole_export',ROOT/'tools/build-street-character-sprites.py');method=load('ursula_sole_fit',ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py')
 actor=load('ursula_own_sole_field',HERE/'pilot-motion.py')
 cases=[];observations=[];encoded_pins={}
 for heading,mark in MARKS.items():
  original=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA');sx,sy=mark['point'];assert original.getpixel((sx,sy))[3]>=200
  stencil=Image.new('L',(512,512));ImageDraw.Draw(stencil).polygon(mark['polygon'],fill=255)
  rgba=np.array(original);keep=(np.array(stencil)>0)&(rgba[:,:,3]>=200);assert int(keep.sum())>=40
  patch_pixels=rgba.copy();patch_pixels[~keep]=0;patch=Image.fromarray(patch_pixels)
  for name,w,h in [('desktop',96,120),('mobile',64,80)]:
   selected=ROOT/'assets/characters/residents/stadt-ursula-neumann/delivery-v2'/f'source-{name}.webp'
   atlas=Image.open(selected).convert('RGBA') if selected.exists() else None
   if atlas is not None:encoded_pins[selected.relative_to(ROOT).as_posix()]=sha(selected)
   s=136*w/128/400;q=w/128;scale=2.33/(136*q*.02);samples=[];board=Image.new('RGB',(w*5,h),'#eee8db')
   for col,phase in enumerate([4,6,8,10,12]):
    cell=next(c for c in index['cells'] if (c['row'],c['col'])==(mark['row'],phase));p=ROOT/cell['source']['file'];assert sha(p)==cell['source']['sha256']
    image=street.export_cell(Image.open(p).convert('RGBA'),{'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}})
    if atlas is not None:
     decoded=atlas.crop((phase*w,mark['row']*h,(phase+1)*w,(mark['row']+1)*h))
     assert decoded.tobytes()==image.tobytes(), 'Selected encoded sole cell changed'
     image=decoded
    field_x,field_y,_=actor.side_field(heading,math.tau*phase/16)
    # Full body and patch share this exact sampler. The stencil selects actual
    # pre-existing shoe RGB, never an invented limb or a metadata displacement.
    transported=actor.paint.unpack(actor.paint.sample(actor.paint.premul(patch),field_x,field_y))
    mask=street.export_cell(transported,{'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}})
    weights=np.asarray(mask.getchannel('A'),float);yy,xx=np.indices(weights.shape);total=float(weights.sum());assert total>0
    point=[float((weights*xx).sum()/total),float((weights*yy).sum()/total)];x,y=map(round,point)
    assert image.getpixel((x,y))[3]>=21,(heading,name,phase,point)
    samples.append({'frame':phase,'along_pixels':mark['travel']*point[0],'pointPx':point,'ownSolePolygon':mark['polygon'],'sourcePointRGBA':list(original.getpixel((sx,sy))),'sourceCellSha256':sha(p)})
    flat=Image.alpha_composite(Image.new('RGBA',image.size,'#eee8db'),image).convert('RGB');d=ImageDraw.Draw(flat);d.ellipse((x-1,y-1,x+1,y+1),fill='#ff3050');d.text((2,2),f'{phase}:{x},{y}',fill='#111');board.paste(flat,(col*w,0))
   board.resize((board.width*4,board.height*4),Image.Resampling.NEAREST).save(OUT/f'{heading}-{name}-marked.png')
   data={'character':'stadt-ursula-neumann','view':heading,'variant':name,'atlas_sha256':sha(selected) if atlas is not None else None,'frames_per_cycle':16,'game_units_per_pixel':scale,'current_cycle_distance':11.65,'shoe_length_pixels':18*w/96,'contacts':[{'foot':heading+' own near burgundy shoe','samples':samples}]}
   result=method.assess(data);result['variant']=name;result['method']='Actual own RGB patch, native alpha-weighted subpixel centroid';cases.append(result);observations.append(data)
 mean=sum(c['fitted_cycle_distance'] for c in cases)/len(cases)
 report={'status':'SOURCE CALIBRATION; actual floor/cadence evidence remains separate','selectedAtlasPins':encoded_pins,'exactSelectedCellsChecked':20 if len(encoded_pins)==2 else 0,'bodyIndexSha256':sha(index_path),'worldUnitsPerGameUnit':.02,'sourceAnalyticCycle':11.65,'fittedCycle':mean,'fitRange':[min(c['fitted_cycle_distance'] for c in cases),max(c['fitted_cycle_distance'] for c in cases)],'assessments':cases,'observations':observations,'limits':['Only known near burgundy shoe per side; opposite foot is not separately marked through overlap.','Actual near-shoe RGB patch through the same continuous source sampler; native alpha-weighted centroid, not rounded predicted position or nearDx metadata.','Existing assess_walk_speed.py slope/slip fit; actual route speed13 and floor contact require separate game evidence.']}
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['fittedCycle','fitRange','sourceAnalyticCycle']}))
if __name__=='__main__':run()
