"""Irmgard's measured own adult source fields; private source diagnostic."""
from pathlib import Path
import sys, math
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
YY,XX=np.mgrid[:512,:512]
LANDMARKS={
 'down':dict(waist=249,hip=291,mid=258,centres=[231,285],hem=[373,373],
  knee=[402,402],ankle=[438,438],foot_centres=[220,291],step_width=16,
  depth_amplitude=7,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
 'up':dict(waist=249,hip=291,mid=254,centres=[231,281],hem=[368,368],
  knee=[401,401],ankle=[438,438],foot_centres=[224,287],step_width=16,
  depth_amplitude=7,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
}
TRAVEL={'down':(0,1),'up':(0,-1)}
SIDE={'right':{'seam':246,'nearScreen':'left','solePoint':[232,465]},
      'left':{'seam':269,'nearScreen':'right','solePoint':[277,465]}}

def smooth(v):
 v=np.clip(v,0,1);return v*v*(3-2*v)

def planted_floor(side,nodes,dx,dy):
 # The existing shared family wrapper applies this same connected hip/ankle
 # field. Direct painted_walk.animate requires the actual callback: a JSON
 # plantedFloor flag alone has no effect. Preserve the raw sole, not a crop.
 descent=max(0,dy[-1]);hip,ankle=nodes[2],nodes[-2]
 return dx,[value-descent*max(0,min(1,(y-hip)/(ankle-hip)))
            for y,value in zip(nodes,dy)]

def side_field(heading,phase,strength=1):
 own=SIDE[heading];p=(phase/math.tau)%1
 if .25<=p<=.75:stride=2-4*p
 else:
  swing=((p-.75)%1)*2
  stride=-1-2*swing+12*swing*swing-8*swing*swing*swing
 dx=(1 if heading=='right' else -1)*8*stride*strength
 near_dy=-4*max(0,math.cos(phase))*strength
 far_dy=-4*max(0,-math.cos(phase))*strength
 sx=XX.astype(float);sy=YY.astype(float)
 for _ in range(12):
  side=smooth((sx-own['seam']+18)/36)
  near=1-side if own['nearScreen']=='left' else side
  lower=smooth((sy-321)/117)
  sx=XX-lower*(near*dx+(1-near)*-dx)
  sy=YY-lower*(near*near_dy+(1-near)*far_dy)
 return sx,sy,{
  'phase':phase,'strength':strength,'nearDxDy':[dx,near_dy],
  'farDxDy':[-dx,far_dy],'sourceSeamX':own['seam'],'nearScreen':own['nearScreen']}

def render(heading,phase,strength=1):
 source=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
 if strength==0:return source,{'neutralExact':True}
 if heading in LANDMARKS:
  protected=Image.new('L',(512,512))
  polygon=([(173,267),(189,270),(193,311),(195,335),(184,343),(171,330),(166,311)]
   if heading=='down' else [(316,275),(330,277),(337,315),(334,335),(323,338),(318,320)])
  ImageDraw.Draw(protected).polygon(polygon,fill=255)
  frames,records=paint.animate(source,LANDMARKS[heading],travel=TRAVEL[heading],
   count=16,foreground=1 if heading=='down' else 0,strength=strength,phases=[phase],
   rigid_mask=protected,limb_pose=planted_floor)
  return frames[0],records[0]
 sx,sy,record=side_field(heading,phase,strength)
 return paint.unpack(paint.sample(paint.premul(source),sx,sy)),record
