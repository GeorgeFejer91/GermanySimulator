"""Hartmut's own adult source fields, diagnostic only until native game review.

The cardinal sources share one original scale. The side lower-body field keeps
his overlapping trouser/boot paint connected instead of cutting hidden shins.
No new limbs, mirrored art, final cell fitting or independent runtime clock.
"""
from pathlib import Path
import sys,math,json,hashlib
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/hartmut-keller-end-to-end/pilot-motion'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
YY,XX=np.mgrid[:512,:512]
ORDER=('down','right','up','left')
LANDMARKS={
 'down':dict(waist=249,hip=280,mid=251,centres=[221,283],hem=[308,308],knee=[372,372],ankle=[439,439],foot_centres=[214,303],step_width=14,depth_amplitude=6,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
 'up':dict(waist=253,hip=280,mid=249,centres=[220,286],hem=[308,308],knee=[371,371],ankle=[441,441],foot_centres=[215,299],step_width=14,depth_amplitude=6,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
}
TRAVEL={'down':(0,1),'up':(0,-1)}
SIDE_SEAMS={
 'right':([280,330,380,420,438,450,471],[256,251,248,246,258,278,291]),
 'left':([280,330,380,420,438,450,471],[255,256,258,258,250,234,220]),
}

def smooth(v):
 v=np.clip(v,0,1);return v*v*(3-2*v)
def planted_stride(p):
 p=p%1
 if .25<=p<=.75:return 2-4*p
 swing=((p-.75)%1)*2
 return -1-2*swing+12*swing*swing-8*swing*swing*swing
def side_displacement(heading,phase,strength,x,y):
 rows,seams=SIDE_SEAMS[heading]
 p=(phase/math.tau)%1;sign=1 if heading=='right' else -1
 dx=sign*10*planted_stride(p)*strength;far_dx=sign*10*planted_stride(p+.5)*strength
 near_dy=-4*max(0,math.cos(phase))*strength;far_dy=-4*max(0,-math.cos(phase))*strength
 seam=np.interp(np.clip(y,0,511),rows,seams)
 side=smooth((x-seam+30)/60);near=1-side if heading=='right' else side
 lower=smooth((y-280)/160)
 return lower*(near*dx+(1-near)*far_dx),lower*(near*near_dy+(1-near)*far_dy)

def render(heading,phase,strength=1):
 source=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
 if strength==0:return source,{'neutralExact':True}
 if heading in LANDMARKS:
  def planted_floor(side,nodes,dx,dy):
   descent=max(0,dy[-1]);hip,ankle=nodes[2],nodes[-2]
   return dx,[value-descent*max(0,min(1,(y-hip)/(ankle-hip))) for y,value in zip(nodes,dy)]
  frames,records=paint.animate(source,LANDMARKS[heading],travel=TRAVEL[heading],count=16,foreground=1 if heading=='down' else 0,strength=strength,phases=[phase],limb_pose=planted_floor)
  return frames[0],records[0]
 # Own source seam: right near trouser/boot lies screen left; left near lies
 # screen right. A continuous transition retains the original overlap cloth.
 rows,seams=SIDE_SEAMS[heading]
 p=(phase/math.tau)%1;sign=1 if heading=='right' else -1
 dx=sign*10*planted_stride(p)*strength
 far_dx=sign*10*planted_stride(p+.5)*strength
 near_dy=-4*max(0,math.cos(phase))*strength
 far_dy=-4*max(0,-math.cos(phase))*strength
 sx=XX.astype(float);sy=YY.astype(float)
 for _ in range(12):
  mx,my=side_displacement(heading,phase,strength,sx,sy)
  sx=XX-mx;sy=YY-my
 result=paint.unpack(paint.sample(paint.premul(source),sx,sy))
 return result,{'phase':phase,'strength':strength,'nearDxDy':[dx,near_dy],'farDxDy':[far_dx,far_dy],'sourceSeam':{'rows':rows,'x':seams}}
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
