"""Guenther source-measured connected clothing fields and right-hand gauge."""
from pathlib import Path
import sys,math,json
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import distance_transform_edt,map_coordinates
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/guenther-end-to-end/pilot-motion'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
YY,XX=np.mgrid[:512,:512]
LANDMARKS={
 'down':dict(waist=254,hip=302,mid=258,centres=[224,291],hem=[330,330],knee=[381,381],ankle=[433,433],foot_centres=[202,310],step_width=15,depth_amplitude=6.5,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
 'up':dict(waist=263,hip=313,mid=260,centres=[223,296],hem=[338,338],knee=[384,384],ankle=[436,436],foot_centres=[201,311],step_width=15,depth_amplitude=6.5,root_overlap=2,stride_curve='planted',auto_hand_mask=False),
}
TRAVEL={'down':(0,1),'up':(0,-1)}
OWNED_HANDS={
 'down':[[(169,283),(188,282),(197,296),(210,298),(213,321),(195,330),(192,350),(188,378),(174,384),(167,374),(174,343),(182,326),(167,318)],[(318,281),(340,280),(348,316),(338,332),(321,327)]],
 'up':[[(318,290),(341,287),(349,319),(341,335),(347,359),(345,374),(333,377),(329,356),(331,337),(318,331)],[(169,290),(190,289),(196,321),(186,335),(170,329)]],
 'right':[[(235,280),(263,281),(267,300),(281,298),(284,320),(271,330),(270,350),(258,380),(247,384),(246,372),(257,348),(259,330),(239,324)]],
 'left':[[(239,280),(267,278),(273,306),(265,327),(246,326),(236,309)]],
}
def hand_mask(heading):
 mask=Image.new('L',(512,512));draw=ImageDraw.Draw(mask)
 for polygon in OWNED_HANDS[heading]:draw.polygon(polygon,fill=255)
 return mask
def planted_floor(side,nodes,dx,dy):
 descent=max(0,dy[-1]);hip,ankle=nodes[2],nodes[-2]
 return dx,[value-descent*max(0,min(1,(y-hip)/(ankle-hip))) for y,value in zip(nodes,dy)]
def smooth(value):
 value=np.clip(value,0,1);return value*value*(3-2*value)
def planted_curve(phase):
 p=(phase/math.tau)%1
 if .25<=p<=.75:return 2-4*p
 swing=((p-.75)%1)*2
 return -1-2*swing+12*swing*swing-8*swing*swing*swing
def side_map(heading,phase,strength=1):
 seam={'right':260,'left':258}[heading];sign=1 if heading=='right' else -1
 dx=sign*11.5*planted_curve(phase)*strength
 far_dx=sign*11.5*planted_curve(phase+math.pi)*strength
 near_dy=-4.5*max(0,math.cos(phase))*strength;far_dy=-4.5*max(0,-math.cos(phase))*strength
 protection=smooth(distance_transform_edt(np.array(hand_mask(heading))==0)/11)
 sx=XX.astype(float);sy=YY.astype(float)
 for _ in range(12):
  side=smooth((sx-seam+23)/46);near=1-side if heading=='right' else side
  lower=smooth((sy-302)/132)*map_coordinates(protection,[sy,sx],order=1,mode='nearest')
  sx=XX-lower*(near*dx+(1-near)*far_dx);sy=YY-lower*(near*near_dy+(1-near)*far_dy)
 return sx,sy,{'phase':phase,'strength':strength,'nearDxDy':[dx,near_dy],'farDxDy':[far_dx,far_dy],'sourceSeamX':seam}
def render(heading,phase,strength=1):
 source=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
 if strength==0:return source,{'neutralExact':True}
 if heading in LANDMARKS:
  frames,records=paint.animate(source,LANDMARKS[heading],travel=TRAVEL[heading],count=16,foreground=1 if heading=='down' else 0,strength=strength,phases=[phase],limb_pose=planted_floor,rigid_mask=hand_mask(heading));return frames[0],records[0]
 sx,sy,record=side_map(heading,phase,strength);return paint.unpack(paint.sample(paint.premul(source),sx,sy)),record
def main():
 OUT.mkdir(parents=True,exist_ok=True);receipt={};images={}
 for heading in ('down','right','up','left'):
  receipt[heading]=[]
  for col,phase in enumerate((0,math.pi/2,math.pi,3*math.pi/2)):
   image,record=render(heading,phase);images[heading,col]=image;image.save(OUT/f'{heading}-{col*4:02}.png');receipt[heading].append(record)
 for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
  board=Image.new('RGB',(2048,2048),bg)
  for row,heading in enumerate(('down','right','up','left')):
   for col,phase in enumerate((0,math.pi/2,math.pi,3*math.pi/2)):
    image=images[heading,col]
    flat=Image.alpha_composite(Image.new('RGBA',image.size,bg),image).convert('RGB');board.paste(flat,(col*512,row*512));ImageDraw.Draw(board).text((col*512+8,row*512+8),f'{heading} phase{col*4}',fill='#111' if theme=='light' else '#eee')
  board.save(OUT/f'four-directions-{theme}.png')
 for heading in ('down','front-right','right','left','front-left'):
  image=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA');flat=Image.alpha_composite(Image.new('RGBA',image.size,'#eee8db'),image).convert('RGB')
  box=(195,110,306,166);head=flat.crop(box).resize((1110,560),Image.Resampling.NEAREST);draw=ImageDraw.Draw(head)
  for x in range(200,306,5):draw.line(((x-195)*10,0,(x-195)*10,560),fill='#7d6570',width=1);draw.text(((x-195)*10,0),str(x),fill='red')
  for y in range(115,166,5):draw.line((0,(y-110)*10,1110,(y-110)*10),fill='#7d6570',width=1);draw.text((0,(y-110)*10),str(y),fill='red')
  head.save(OUT/f'{heading}-lip-grid.png')
 (OUT/'receipt.json').write_text(json.dumps({'status':'OWN SOURCE PILOT; no native/runtime approval','landmarks':LANDMARKS,'protectedOwnedHands':OWNED_HANDS,'fields':receipt},indent=2)+'\n');print('Own16extremes and5lipgrids rendered.')
if __name__=='__main__':main()
