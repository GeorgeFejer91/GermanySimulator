"""Dietmar's own source-fitted connected fields; RIGHT chest folding ruler and LEFT leather briefcase."""
from pathlib import Path
import sys, math, json
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, map_coordinates
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/dietmar-din-norm-end-to-end/pilot-motion'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
YY,XX=np.mgrid[:512,:512]
ORDER=('down','right','up','left')
LANDMARKS={
 # The hem control is a continuous upper-thigh paint overlap, not an exposed
 # shorts/skirt edge: Dietmar wears complete trousers to the shoe cuffs.
 'down':dict(waist=238,hip=286,mid=256,centres=[220,291],hem=[319,319],knee=[357,358],ankle=[439,439],foot_centres=[208,301],step_width=16,depth_amplitude=6.5,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
 'up':dict(waist=255,hip=294,mid=256,centres=[225,294],hem=[324,324],knee=[365,365],ankle=[442,442],foot_centres=[217,296],step_width=16,depth_amplitude=6.5,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
}
TRAVEL={'down':(0,1),'up':(0,-1)}
# RIGHT owns the bent chest hand and folding ruler. LEFT owns the thigh case.
# These are own measured paint boundaries, never another actor's prop mask.
OWNED_HANDS={
 'down':[
  [(199,168),(216,168),(222,193),(231,201),(231,218),(221,229),(228,255),(214,258),(207,235),(193,232),(188,220),(193,204),(205,201)],
  [(305,274),(330,272),(332,292),(329,303),(340,307),(350,313),(351,368),(340,377),(296,374),(291,360),(293,314),(306,305),(310,300),(304,293)]],
 'up':[
  [(183,276),(209,279),(211,298),(207,305),(216,313),(216,373),(205,378),(177,376),(174,361),(176,315),(188,304),(185,299)],
  [(306,183),(326,183),(337,207),(338,224),(325,239),(311,230)]],
 'right':[
  [(266,162),(283,162),(287,190),(294,196),(294,215),(283,222),(288,243),(275,248),(273,227),(260,223),(254,210),(259,194),(270,192)],
  [(277,300),(288,301),(299,307),(300,367),(286,373),(273,369),(275,324)]],
 'left':[
  [(215,163),(229,163),(228,187),(233,192),(233,211),(225,217),(226,246),(214,247),(214,222),(207,213),(207,193),(215,189)],
  [(244,275),(270,279),(275,300),(270,307),(287,307),(298,316),(299,371),(288,380),(226,378),(220,365),(222,314),(239,307),(248,302),(243,292)]],
}
def hand_mask(heading):
 mask=Image.new('L',(512,512));draw=ImageDraw.Draw(mask)
 for polygon in OWNED_HANDS[heading]:draw.polygon(polygon,fill=255)
 return mask
def planted_floor(side,nodes,dx,dy):
 descent=max(0,dy[-1]);hip,ankle=nodes[2],nodes[-2]
 return dx,[value-descent*max(0,min(1,(y-hip)/(ankle-hip))) for y,value in zip(nodes,dy)]
def smooth(value):
 value=np.clip(value,0,1)
 return value*value*(3-2*value)
def planted_curve(p):
 p=p%1
 if .25<=p<=.75:stride=2-4*p
 else:
  swing=((p-.75)%1)*2
  stride=-1-2*swing+12*swing*swing-8*swing*swing*swing
 return stride

def side_map(heading,phase,strength=1):
 seam=255 if heading=='right' else 260
 p=(phase/math.tau)%1
 dx=(1 if heading=='right' else -1)*10*planted_curve(p)*strength
 far_dx=(1 if heading=='right' else -1)*10*planted_curve(p+.5)*strength
 near_dy=-4*max(0,math.cos(phase))*strength
 far_dy=-4*max(0,-math.cos(phase))*strength
 # Smooth32px separation has positive horizontal Jacobian at full +/-10px
 # opposite contacts. Preserve a connected whole painted foot. Solve the
 # connected source field with its actual Jacobian, rather than relying on
 # slowly convergent fixed-point inversion near the two occluded shoes.
 protection=smooth(distance_transform_edt(np.array(hand_mask(heading))==0)/16)
 py,px=np.gradient(protection)
 sx=XX.astype(float);sy=YY.astype(float)
 for _ in range(8):
  u=np.clip((sx-seam+16)/32,0,1);side=u*u*(3-2*u)
  derivative=6*u*(1-u)/32
  near_side=1-side if heading=='right' else side
  near_side_x=-derivative if heading=='right' else derivative
  # Own occlusion seam: visible far boot is above the front boot's forefoot;
  # below the measured448..458px forefoot band the entire near sole belongs
  # to its own foot, including its toe. An x-only split squashed that boot.
  foot_u=np.clip((sy-448)/10,0,1);near_sole=foot_u*foot_u*(3-2*foot_u)
  near_sole_y=6*foot_u*(1-foot_u)/10
  near=near_side+(1-near_side)*near_sole
  near_x=near_side_x*(1-near_sole)
  near_y=(1-near_side)*near_sole_y
  v=np.clip((sy-286)/152,0,1);lower=v*v*(3-2*v);lower_y=6*v*(1-v)/152
  protect=map_coordinates(protection,[sy,sx],order=1,mode='nearest')
  protect_x=map_coordinates(px,[sy,sx],order=1,mode='nearest')
  protect_y=map_coordinates(py,[sy,sx],order=1,mode='nearest')
  weight=lower*protect;weight_x=lower*protect_x;weight_y=lower_y*protect+lower*protect_y
  a=near*dx+(1-near)*far_dx;b=near*near_dy+(1-near)*far_dy
  ax=near_x*(dx-far_dx);bx=near_x*(near_dy-far_dy)
  ay=near_y*(dx-far_dx);by=near_y*(near_dy-far_dy)
  j00=1+weight_x*a+weight*ax;j01=weight_y*a+weight*ay
  j10=weight_x*b+weight*bx;j11=1+weight_y*b+weight*by
  determinant=j00*j11-j01*j10
  assert determinant.min()>0, 'Profile source field folded'
  rx=sx+weight*a-XX;ry=sy+weight*b-YY
  sx-=(j11*rx-j01*ry)/determinant
  sy-=(-j10*rx+j00*ry)/determinant
 return sx,sy,{'phase':phase,'strength':strength,'nearDxDy':[dx,near_dy],'farDxDy':[far_dx,far_dy],'sourceSeamX':seam}
def render(heading,phase,strength=1):
 source=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
 if strength==0:return source,{'neutralExact':True}
 if heading in LANDMARKS:
  frames,records=paint.animate(source,LANDMARKS[heading],travel=TRAVEL[heading],count=16,foreground=1 if heading=='down' else 0,strength=strength,phases=[phase],limb_pose=planted_floor,rigid_mask=hand_mask(heading))
  return frames[0],records[0]
 sx,sy,record=side_map(heading,phase,strength)
 return paint.unpack(paint.sample(paint.premul(source),sx,sy)),record
def run():
 OUT.mkdir(parents=True,exist_ok=True);receipt={}
 for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
  board=Image.new('RGB',(4*512,4*512),bg)
  for row,heading in enumerate(ORDER):
   receipt[heading]=[]
   for col,phase in enumerate((0,math.pi/2,math.pi,3*math.pi/2)):
    image,record=render(heading,phase);image.save(OUT/f'{heading}-{col*4:02}.png')
    receipt[heading].append(record)
    flat=Image.alpha_composite(Image.new('RGBA',image.size,bg),image).convert('RGB')
    board.paste(flat,(col*512,row*512));ImageDraw.Draw(board).text((col*512+8,row*512+8),f'{heading} phase{col*4}',fill='#111' if theme=='light' else '#eee')
  board.save(OUT/f'four-directions-{theme}.png')
 for heading in ('down','front-right','right','left','front-left'):
  image=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
  flat=Image.alpha_composite(Image.new('RGBA',image.size,'#eee8db'),image).convert('RGB')
  head=flat.crop((190,90,325,150)).resize((1080,480),Image.Resampling.NEAREST)
  d=ImageDraw.Draw(head)
  for x in range(200,325,10):d.text(((x-190)*8,0),str(x),fill='red')
  for y in range(100,150,10):d.text((0,(y-90)*8),str(y),fill='red')
  head.save(OUT/f'{heading}-lip-grid.png')
 (OUT/'receipt.json').write_text(json.dumps({'status':'SOURCE PILOT; no gait/world approval','fields':receipt},indent=2)+'\n')
if __name__=='__main__':run()

