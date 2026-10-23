"""Sabine's own adult source fields, diagnostic only until native game review.

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
OUT=ROOT/'output/street-redesign/sabine-end-to-end/pilot-motion'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
YY,XX=np.mgrid[:512,:512]
ORDER=('down','right','up','left')
LANDMARKS={
 'down':dict(waist=248,hip=290,mid=270,centres=[245,293],hem=[354,354],knee=[382,382],ankle=[448,448],foot_centres=[236,293],step_width=14,depth_amplitude=6,root_overlap=2,stride_curve='planted'),
 'up':dict(waist=250,hip=290,mid=252,centres=[235,280],hem=[358,358],knee=[385,385],ankle=[449,449],foot_centres=[233,283],step_width=14,depth_amplitude=6,root_overlap=2,stride_curve='planted'),
}
TRAVEL={'down':(0,1),'up':(0,-1)}
SIDE_SEAMS={
 'right':([350,400,438,445,455,471],[259,254,253,260,280,292]),
 'left':([350,400,438,445,455,471],[264,266,268,261,242,223]),
}
def smooth(v):
 v=np.clip(v,0,1);return v*v*(3-2*v)
def planted_stride(p):
 p=p%1
 if .25<=p<=.75:return 2-4*p
 swing=((p-.75)%1)*2
 return -1-2*swing+12*swing*swing-8*swing*swing*swing
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
  seam=np.interp(np.clip(sy,0,511),rows,seams)
  side=smooth((sx-seam+30)/60)
  near=1-side if heading=='right' else side
  lower=smooth((sy-350)/95)
  sx=XX-lower*(near*dx+(1-near)*far_dx)
  sy=YY-lower*(near*near_dy+(1-near)*far_dy)
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
