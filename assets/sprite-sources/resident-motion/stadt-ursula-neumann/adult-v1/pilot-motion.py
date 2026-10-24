"""Ursula's own adult source fields, diagnostic only until native game review.

The cardinal sources share one original scale. The side lower-body field keeps
her overlapping stocking/strap-shoe paint connected through the hidden shins.
No new limbs, mirrored art, final cell fitting or independent runtime clock.
"""
from pathlib import Path
import sys,math,json,hashlib
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/ursula-neumann-end-to-end/pilot-motion'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
YY,XX=np.mgrid[:512,:512]
ORDER=('down','right','up','left')
LANDMARKS={
 'down':dict(waist=260,hip=286,mid=263,centres=[228,293],hem=[308,308],knee=[372,372],ankle=[437,433],foot_centres=[208,302],step_width=14,depth_amplitude=7,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
 'up':dict(waist=265,hip=286,mid=251,centres=[222,286],hem=[308,308],knee=[372,372],ankle=[439,439],foot_centres=[210,303],step_width=14,depth_amplitude=7,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
}
TRAVEL={'down':(0,1),'up':(0,-1)}
RIGID={
 'down':[[(167,271),(191,273),(199,295),(210,311),(211,327),(196,337),(182,324),(165,306)],[(329,271),(350,274),(354,301),(346,320),(332,326),(326,315)]],
 'up':[[(169,280),(189,284),(194,306),(188,327),(174,329),(164,312)],[(313,282),(334,282),(343,308),(338,325),(322,331),(309,323)]]}
def planted_floor(side,nodes,dx,dy):
 # Existing build-street-speaker-family.py plantedFloor limb callback:
 # upright billboards cannot put the loaded contact below their ground root.
 # Retain swing lift and the connected hip-to-ankle field, without cropping.
 descent=max(0,dy[-1]);hip,ankle=nodes[2],nodes[-2]
 dy=[value-descent*max(0,min(1,(y-hip)/(ankle-hip))) for y,value in zip(nodes,dy)]
 return dx,dy
def smooth(v):
 v=np.clip(v,0,1);return v*v*(3-2*v)
def render(heading,phase,strength=1):
 source=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
 if strength==0:return source,{'neutralExact':True}
 if heading in LANDMARKS:
  rigid=Image.new('L',source.size)
  for polygon in RIGID[heading]:ImageDraw.Draw(rigid).polygon(polygon,fill=255)
  frames,records=paint.animate(source,LANDMARKS[heading],travel=TRAVEL[heading],count=16,foreground=1 if heading=='down' else 0,strength=strength,phases=[phase],rigid_mask=rigid,limb_pose=planted_floor)
  return frames[0],records[0]
 sx,sy,record=side_field(heading,phase,strength)
 result=paint.unpack(paint.sample(paint.premul(source),sx,sy))
 sy_y,sy_x=np.gradient(sy);sx_y,sx_x=np.gradient(sx);det=sx_x*sy_y-sx_y*sy_x
 visible=np.asarray(result)[:,:,3]>=21;minimum=float(det[visible].min());assert minimum>0.1,(heading,phase,minimum)
 return result,{**record,'minimumSamplingJacobian':minimum}
def side_field(heading,phase,strength=1):
 assert heading in ('right','left')
 # Own source seam: right near stocking/strap shoe lies screen left; left near lies
 # screen right. A continuous transition retains the original overlap cloth.
 seam_nodes=([290,350,409,433,447,472,511],[250,247,251,257,275,320,320]) if heading=='right' else ([290,350,410,433,448,472,511],[252,257,265,254,233,185,185])
 p=(phase/math.tau)%1
 if .25<=p<=.75:stride=2-4*p
 else:
  swing=((p-.75)%1)*2
  stride=-1-2*swing+12*swing*swing-8*swing*swing*swing
 dx=(1 if heading=='right' else -1)*10*stride*strength
 near_dy=-4*max(0,math.cos(phase))*strength
 far_dy=-4*max(0,-math.cos(phase))*strength
 sx=XX.astype(float);sy=YY.astype(float)
 for _ in range(12):
  seam=np.interp(sy,*seam_nodes)
  side=smooth((sx-seam+30)/60)
  near=1-side if heading=='right' else side
  lower=smooth((sy-300)/140)
  sx=XX-lower*(near*dx+(1-near)*-dx)
  sy=YY-lower*(near*near_dy+(1-near)*far_dy)
 return sx,sy,{'phase':phase,'strength':strength,'nearDxDy':[dx,near_dy],'farDxDy':[-dx,far_dy],'sourceSeamNodes':seam_nodes}

def run():
 OUT.mkdir(parents=True,exist_ok=True);receipt={}
 for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
  board=Image.new('RGB',(4*512,4*512),bg)
  for row,heading in enumerate(ORDER):
   receipt[heading]=[]
   for col,p in enumerate((0,math.pi/2,math.pi,3*math.pi/2)):
    image,record=render(heading,p);image.save(OUT/f'{heading}-{col*4:02}.png')
    receipt[heading].append(record)
    flat=Image.alpha_composite(Image.new('RGBA',image.size,bg),image).convert('RGB')
    board.paste(flat,(col*512,row*512));ImageDraw.Draw(board).text((col*512+8,row*512+8),f'{heading} phase{col*4}',fill='#111' if theme=='light' else '#eee')
  board.save(OUT/f'four-directions-{theme}.png')
 (OUT/'receipt.json').write_text(json.dumps({'status':'SOURCE PILOT; no gait/world approval','fields':receipt},indent=2)+'\n')
if __name__=='__main__':run()
