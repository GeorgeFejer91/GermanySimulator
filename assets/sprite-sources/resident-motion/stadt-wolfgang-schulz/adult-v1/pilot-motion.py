"""Wolfgang's own connected paint fields and protected right-hand briefcase."""
from pathlib import Path
import sys, math, json
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, map_coordinates
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/wolfgang-end-to-end/pilot-motion'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
YY,XX=np.mgrid[:512,:512]
ORDER=('down','right','up','left')
LANDMARKS={
 'down':dict(waist=302,hip=326,mid=251,centres=[220,287],hem=[345,345],knee=[396,396],ankle=[445,445],foot_centres=[202,309],step_width=16,depth_amplitude=7,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
 'up':dict(waist=299,hip=325,mid=261,centres=[224,296],hem=[345,345],knee=[395,395],ankle=[445,445],foot_centres=[200,309],step_width=16,depth_amplitude=7,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
}
TRAVEL={'down':(0,1),'up':(0,-1)}
OWNED_HANDS={
 'down':[
  [(144,305),(172,305),(179,333),(197,340),(200,405),(188,412),(115,400),(119,338),(143,328)],
  [(325,304),(350,303),(354,329),(346,340),(328,340),(321,326)]],
 'up':[
  [(331,309),(357,309),(360,331),(372,339),(378,402),(367,411),(320,404),(321,342),(335,331)],
  [(155,309),(182,309),(190,333),(177,342),(160,336)]],
 'right':[
  [(210,304),(240,304),(245,331),(270,341),(270,407),(257,414),(176,401),(181,341),(212,329)]],
 'left':[
  [(233,304),(263,305),(271,331),(260,342),(241,342),(232,328)],
  [(308,306),(323,306),(323,327),(334,329),(344,389),(332,399),(309,398),(304,332)]],
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
def side_map(heading,phase,strength=1):
 seam=270 if heading=='right' else 251
 p=(phase/math.tau)%1
 if .25<=p<=.75:stride=2-4*p
 else:
  swing=((p-.75)%1)*2
  stride=-1-2*swing+12*swing*swing-8*swing*swing*swing
 dx=(1 if heading=='right' else -1)*10*stride*strength
 near_dy=-4*max(0,math.cos(phase))*strength
 far_dy=-4*max(0,-math.cos(phase))*strength
 protection=smooth(distance_transform_edt(np.array(hand_mask(heading))==0)/12)
 sx=XX.astype(float);sy=YY.astype(float)
 for _ in range(12):
  side=smooth((sx-seam+24)/48)
  near=1-side if heading=='right' else side
  lower=smooth((sy-325)/119)*map_coordinates(protection,[sy,sx],order=1,mode='nearest')
  sx=XX-lower*(near*dx+(1-near)*-dx)
  sy=YY-lower*(near*near_dy+(1-near)*far_dy)
 return sx,sy,{'phase':phase,'strength':strength,'nearDxDy':[dx,near_dy],'farDxDy':[-dx,far_dy],'sourceSeamX':seam}
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
  head=flat.crop((190,100,300,175)).resize((880,600),Image.Resampling.NEAREST)
  d=ImageDraw.Draw(head)
  for x in range(200,300,10):d.text(((x-190)*8,0),str(x),fill='red')
  for y in range(110,175,10):d.text((0,(y-100)*8),str(y),fill='red')
  head.save(OUT/f'{heading}-lip-grid.png')
 (OUT/'receipt.json').write_text(json.dumps({'status':'SOURCE PILOT; no gait/world approval','fields':receipt},indent=2)+'\n')
if __name__=='__main__':run()
