"""Manfred's own adult source fields, diagnostic only until native game review.

The cardinal sources share one original scale. The side lower-body field keeps
his overlapping full-trouser/shoe paint connected through the hidden shins.
No new limbs, mirrored art, final cell fitting or independent runtime clock.
"""
from pathlib import Path
import sys,math,json,hashlib
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/manfred-din-end-to-end/pilot-motion'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
YY,XX=np.mgrid[:512,:512]
ORDER=('down','right','up','left')
LANDMARKS={
 'down':dict(waist=248,hip=283,mid=256,centres=[233,279],hem=[321,321],knee=[380,380],ankle=[448,448],foot_centres=[225,294],step_width=14,depth_amplitude=7,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
 'up':dict(waist=248,hip=283,mid=256,centres=[232,279],hem=[321,321],knee=[380,380],ankle=[447,447],foot_centres=[224,295],step_width=14,depth_amplitude=7,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
}
TRAVEL={'down':(0,1),'up':(0,-1)}
RIGID={'down':[[(187,262),(204,265),(209,290),(209,340),(197,340),(188,308)],[(307,258),(321,259),(323,300),(313,310),(306,299)]], 'up':[[(302,263),(318,261),(322,291),(314,341),(302,340),(302,307)],[(185,263),(201,263),(205,302),(195,311),(184,300)]]}
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
 # Own source seam: right near brown shoe lies screen left; left near lies
 # screen right. A continuous transition retains the original overlap cloth.
 seam_nodes=([283,380,430,448,466,511],[256,257,264,282,314,314]) if heading=='right' else ([283,380,430,448,466,511],[256,257,250,228,197,197])
 def planted_curve(p):
  p=p%1
  if .25<=p<=.75:return 2-4*p
  swing=((p-.75)%1)*2
  return -1-2*swing+12*swing*swing-8*swing*swing*swing
 p=(phase/math.tau)%1
 sign=1 if heading=='right' else -1
 dx=sign*10*planted_curve(p)*strength
 # Each foot gets its own planted half-cycle; negating the near swing
 # would ease the far foot during its loaded step. Keep paint and lift.
 far_dx=sign*10*planted_curve(p+.5)*strength
 near_dy=-4*max(0,math.cos(phase))*strength
 far_dy=-4*max(0,-math.cos(phase))*strength
 sx=XX.astype(float);sy=YY.astype(float)
 for _ in range(12):
  seam=np.interp(sy,*seam_nodes)
  side=smooth((sx-seam+30)/60)
  near=1-side if heading=='right' else side
  lower=smooth((sy-283)/165)
  sx=XX-lower*(near*dx+(1-near)*far_dx)
  sy=YY-lower*(near*near_dy+(1-near)*far_dy)
 return sx,sy,{'phase':phase,'strength':strength,'nearDxDy':[dx,near_dy],'farDxDy':[far_dx,far_dy],'sourceSeamNodes':seam_nodes}

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
