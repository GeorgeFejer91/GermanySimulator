"""Bärbel's own source-fitted connected fields; LEFT-owned paper grocery bag and RIGHT empty."""
from pathlib import Path
import sys, math, json
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, map_coordinates
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/baerbel-brezel-end-to-end/pilot-motion'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
YY,XX=np.mgrid[:512,:512]
ORDER=('down','right','up','left')
LANDMARKS={
 'down':dict(waist=262,hip=296,mid=256,centres=[226,283],hem=[382,382],knee=[399,399],ankle=[438,438],foot_centres=[224,289],step_width=16,depth_amplitude=7,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
 'up':dict(waist=265,hip=298,mid=256,centres=[228,285],hem=[382,382],knee=[399,399],ankle=[440,440],foot_centres=[224,287],step_width=16,depth_amplitude=7,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
}
TRAVEL={'down':(0,1),'up':(0,-1)}
# Actual own cuff-to-hand chains and the LEFT-owned grocery bag. RIGHT empty.
OWNED_HANDS={
 'down':[
  [(160,272),(186,272),(190,295),(189,321),(179,328),(160,318),(154,301)],
  [(318,272),(344,273),(349,300),(346,313),(356,326),(365,398),(345,405),(308,399),(309,354),(315,326),(328,316),(321,307)]],
 'up':[
  [(162,274),(187,275),(189,303),(187,315),(197,326),(198,391),(172,403),(143,396),(146,353),(154,326),(169,314),(161,307)],
  [(324,274),(349,274),(352,302),(344,323),(333,329),(321,318),(320,299)]],
 'right':[
  [(239,279),(268,277),(276,305),(273,318),(262,329),(247,327),(237,317)]],
 'left':[
  [(251,278),(281,278),(283,304),(280,318),(296,327),(303,395),(286,404),(249,400),(232,391),(236,351),(240,327),(253,317),(248,306)]],
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
 seam=244 if heading=='right' else 274
 p=(phase/math.tau)%1
 dx=(1 if heading=='right' else -1)*10*planted_curve(p)*strength
 far_dx=(1 if heading=='right' else -1)*10*planted_curve(p+.5)*strength
 near_dy=-4*max(0,math.cos(phase))*strength
 far_dy=-4*max(0,-math.cos(phase))*strength
 # Smooth32px separation has positive horizontal Jacobian at full +/-10px
 # opposite contacts. The old10px seam folded and detached a toe. Solve the
 # connected source field with its actual Jacobian, rather than relying on
 # slowly convergent fixed-point inversion near the two occluded shoes.
 protection=smooth(distance_transform_edt(np.array(hand_mask(heading))==0)/12)
 py,px=np.gradient(protection)
 sx=XX.astype(float);sy=YY.astype(float)
 for _ in range(8):
  u=np.clip((sx-seam+16)/32,0,1);side=u*u*(3-2*u)
  derivative=6*u*(1-u)/32
  near=1-side if heading=='right' else side
  near_x=-derivative if heading=='right' else derivative
  v=np.clip((sy-382)/56,0,1);lower=v*v*(3-2*v);lower_y=6*v*(1-v)/56
  protect=map_coordinates(protection,[sy,sx],order=1,mode='nearest')
  protect_x=map_coordinates(px,[sy,sx],order=1,mode='nearest')
  protect_y=map_coordinates(py,[sy,sx],order=1,mode='nearest')
  weight=lower*protect;weight_x=lower*protect_x;weight_y=lower_y*protect+lower*protect_y
  a=near*dx+(1-near)*far_dx;b=near*near_dy+(1-near)*far_dy
  ax=near_x*(dx-far_dx);bx=near_x*(near_dy-far_dy)
  j00=1+weight_x*a+weight*ax;j01=weight_y*a
  j10=weight_x*b+weight*bx;j11=1+weight_y*b
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

