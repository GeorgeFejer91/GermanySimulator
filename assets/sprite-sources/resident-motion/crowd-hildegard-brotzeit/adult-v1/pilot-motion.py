"""Hildegard's own source-fitted connected fields; right-owned wicker basket and left empty."""
from pathlib import Path
import sys, math, json
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, map_coordinates
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/hildegard-brotzeit-end-to-end/pilot-motion'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
YY,XX=np.mgrid[:512,:512]
ORDER=('down','right','up','left')
LANDMARKS={
 'down':dict(waist=213,hip=276,mid=256,centres=[228,289],hem=[358,358],knee=[374,374],ankle=[435,436],foot_centres=[217,295],step_width=16,depth_amplitude=7,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
 'up':dict(waist=217,hip=280,mid=256,centres=[226,288],hem=[362,362],knee=[377,377],ankle=[441,442],foot_centres=[217,294],step_width=16,depth_amplitude=7,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
}
TRAVEL={'down':(0,1),'up':(0,-1)}
OWNED_HANDS={
 'down':[
  [(181,242),(199,245),(199,276),(193,296),(208,302),(212,320),(208,344),(200,357),(164,357),(151,344),(149,310),(164,302),(173,288)],
  [(321,245),(336,246),(343,278),(346,291),(342,302),(332,309),(322,302),(324,284)]],
 'up':[
  [(181,253),(195,257),(192,282),(195,294),(190,305),(182,307),(175,297),(176,281)],
  [(314,252),(331,251),(339,284),(339,303),(355,311),(363,327),(359,351),(348,362),(323,361),(315,351),(314,316),(325,306),(321,287)]],
 'right':[
  [(232,249),(251,249),(257,277),(255,295),(269,303),(292,307),(299,320),(296,342),(284,358),(229,358),(213,350),(210,318),(225,307),(238,300),(237,280)]],
 'left':[
  [(264,248),(282,250),(279,277),(282,288),(274,300),(264,304),(255,297),(256,281)]],
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
 seam=244 if heading=='right' else 266
 p=(phase/math.tau)%1
 dx=(1 if heading=='right' else -1)*10*planted_curve(p)*strength
 # Each own foot gets the same authored planted/swing curve, half a cycle
 # apart. Negating nearDx incorrectly made the far planted half cubic.
 far_dx=(1 if heading=='right' else -1)*10*planted_curve(p+.5)*strength
 near_dy=-4*max(0,math.cos(phase))*strength
 far_dy=-4*max(0,-math.cos(phase))*strength
 protection=smooth(distance_transform_edt(np.array(hand_mask(heading))==0)/12)
 sx=XX.astype(float);sy=YY.astype(float)
 for _ in range(12):
  side=smooth((sx-seam+24)/48)
  near=1-side if heading=='right' else side
  lower=smooth((sy-358)/77)*map_coordinates(protection,[sy,sx],order=1,mode='nearest')
  sx=XX-lower*(near*dx+(1-near)*far_dx)
  sy=YY-lower*(near*near_dy+(1-near)*far_dy)
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

