"""Brigitte's source-measured intact fields and LEFT-owned green pouch.

This is a small pose pilot, not full family/native/runtime approval. The common
existing painted sampler is reused; all landmarks/protected polygons below were
chosen from this actor's actual512-square registered source paintings.
"""
from pathlib import Path
import sys, math, json
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, map_coordinates

ROOT = Path(__file__).resolve().parents[5]; HERE = Path(__file__).resolve().parent
OUT = ROOT / 'output/street-redesign/bueroklammer-end-to-end/pilot-motion'
sys.path.insert(0, str(ROOT / '.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
YY, XX = np.mgrid[:512,:512]
LANDMARKS = {
    'down': dict(waist=290,hip=319,mid=259,centres=[212,305],hem=[341,341],
                 knee=[391,391],ankle=[438,438],foot_centres=[201,315],
                 step_width=14,depth_amplitude=6,root_overlap=2,
                 stride_curve='planted',auto_hand_mask=False),
    'up': dict(waist=307,hip=331,mid=259,centres=[216,307],hem=[350,350],
               knee=[395,395],ankle=[438,438],foot_centres=[207,315],
               step_width=14,depth_amplitude=6,root_overlap=2,
               stride_curve='planted',auto_hand_mask=False)
}
TRAVEL = {'down':(0,1),'up':(0,-1)}
OWNED_HANDS = {
    'down': [
        [(157,266),(187,272),(192,306),(191,331),(180,347),(168,348),(154,329),(153,306)],
        [(309,270),(343,270),(356,309),(358,333),(346,348),(323,352),(300,339),(300,291)]
    ],
    'up': [
        [(161,274),(191,279),(196,309),(186,347),(159,346),(156,317)],
        [(330,274),(353,271),(359,313),(356,333),(345,349),(332,341)]
    ],
    'right': [[(224,265),(263,271),(270,304),(277,325),(273,341),(255,348),(236,340),(230,310)]],
    'left': [[(226,273),(276,273),(294,294),(306,334),(292,361),(229,355),(222,306)]]
}
def hand_mask(heading):
    mask = Image.new('L',(512,512)); draw = ImageDraw.Draw(mask)
    for polygon in OWNED_HANDS[heading]: draw.polygon(polygon,fill=255)
    return mask
def planted_floor(side,nodes,dx,dy):
    descent = max(0,dy[-1]); hip,ankle = nodes[2],nodes[-2]
    return dx,[value-descent*max(0,min(1,(y-hip)/(ankle-hip))) for y,value in zip(nodes,dy)]
def smooth(value):
    value = np.clip(value,0,1); return value*value*(3-2*value)
def planted_stride(phase):
    p = (phase/math.tau)%1
    if .25 <= p <= .75: stride = 2-4*p
    else:
        swing = ((p-.75)%1)*2
        stride = -1-2*swing+12*swing*swing-8*swing*swing*swing
    return stride
def side_field(heading,phase,strength=1):
    seam = {'right':260,'left':260}[heading]
    direction = 1 if heading == 'right' else -1
    dx = direction*12*planted_stride(phase)*strength
    # Opposite shoe owns the SAME planted curve half a cycle later. Negating
    # nearDx made its actual stance inherit the near shoe's cubic swing curve.
    far_dx = direction*12*planted_stride(phase+math.pi)*strength
    near_dy = -4.4*max(0,math.cos(phase))*strength
    far_dy = -4.4*max(0,-math.cos(phase))*strength
    protection = smooth(distance_transform_edt(np.asarray(hand_mask(heading)) == 0)/11)
    sx = XX.astype(float); sy = YY.astype(float)
    for _ in range(12):
        side = smooth((sx-seam+23)/46)
        near = 1-side if heading == 'right' else side
        lower = smooth((sy-315)/123)*map_coordinates(protection,[sy,sx],order=1,mode='nearest')
        sx = XX-lower*(near*dx+(1-near)*far_dx)
        sy = YY-lower*(near*near_dy+(1-near)*far_dy)
    return sx,sy,{'phase':phase,'strength':strength,'nearDxDy':[dx,near_dy],
                  'farDxDy':[far_dx,far_dy],'sourceSeamX':seam}
def render(heading,phase,strength=1):
    with Image.open(HERE/'registered'/f'{heading}.png') as raw: source=raw.convert('RGBA')
    if strength == 0: return source,{'neutralExact':True}
    if heading in LANDMARKS:
        frames,records = paint.animate(source,LANDMARKS[heading],travel=TRAVEL[heading],
            count=16,foreground=1 if heading=='down' else 0,strength=strength,
            phases=[phase],limb_pose=planted_floor,rigid_mask=hand_mask(heading))
        source.close(); return frames[0],records[0]
    sx,sy,record = side_field(heading,phase,strength)
    frame = paint.unpack(paint.sample(paint.premul(source),sx,sy)); source.close()
    return frame,record

def reference_comparison():
    board = Image.new('RGB',(2048,512),'#eee8db'); draw=ImageDraw.Draw(board)
    with Image.open(HERE/'registered/down.png') as raw: own=raw.convert('RGBA')
    board.paste(Image.alpha_composite(Image.new('RGBA',own.size,'#eee8db'),own).convert('RGB'),(0,0))
    draw.text((8,8),'Brigitte source;400px figure',fill='#111'); own.close()
    for index,key in enumerate(('soeder','herr-sandale','frau-sandale'),1):
        with Image.open(HERE/f'reference-{key}-neutral.png') as raw: image=raw.convert('RGBA')
        bounds=image.getchannel('A').getbbox(); crop=image.crop(bounds)
        scale=400/(bounds[3]-bounds[1]); size=(round(crop.width*scale),400)
        # Comparison-only nearest enlargement makes original low-detail pixels
        # explicit. It never becomes generated character art or an export input.
        enlarged=crop.resize(size,Image.Resampling.NEAREST)
        tile=Image.new('RGBA',(512,512),'#eee8db')
        tile.alpha_composite(enlarged,((512-size[0])//2,72))
        board.paste(tile.convert('RGB'),(index*512,0))
        draw.text((index*512+8,8),key+' selected neutral;comparison-only',fill='#111')
        image.close();crop.close();enlarged.close();tile.close()
    board.save(OUT/'actual-canonical-equal-height.png');board.close()

def main():
    OUT.mkdir(parents=True,exist_ok=True); receipt={}; images={}
    for heading in ('down','right','up','left'):
        receipt[heading]=[]
        for col,phase in enumerate((0,math.pi/2,math.pi,3*math.pi/2)):
            try:
                image,record=render(heading,phase)
            except Exception as error:
                # Preserve the first actual failing surface rather than having
                # to repeat a rejected child merely to obtain its pixels.
                if hasattr(error,'frame'):
                    error.frame.save(OUT/f'failed-{heading}-{col*4:02}.png')
                (OUT/'failure.json').write_text(json.dumps({'heading':heading,
                    'phase':col*4,'error':repr(error),'scope':'SOURCE PILOT FAILURE; no full expansion'},indent=2)+'\n')
                raise
            images[heading,col]=image
            image.save(OUT/f'{heading}-{col*4:02}.png'); receipt[heading].append(record)
    for theme,background in [('light','#eee8db'),('dark','#25272b')]:
        board=Image.new('RGB',(2048,2048),background); draw=ImageDraw.Draw(board)
        for row,heading in enumerate(('down','right','up','left')):
            for col in range(4):
                image=images[heading,col]
                flat=Image.alpha_composite(Image.new('RGBA',image.size,background),image).convert('RGB')
                board.paste(flat,(col*512,row*512));flat.close()
                draw.text((col*512+8,row*512+8),f'{heading} phase{col*4}',fill='#111' if theme=='light' else '#eee')
        board.save(OUT/f'four-directions-{theme}.png');board.close()
    for image in images.values():image.close()
    for heading in ('down','front-right','right','left','front-left'):
        with Image.open(HERE/'registered'/f'{heading}.png') as raw:image=raw.convert('RGBA')
        flat=Image.alpha_composite(Image.new('RGBA',image.size,'#eee8db'),image).convert('RGB')
        box=(185,112,325,184);head=flat.crop(box).resize((1400,720),Image.Resampling.NEAREST);draw=ImageDraw.Draw(head)
        for x in range(190,325,5):
            draw.line(((x-185)*10,0,(x-185)*10,720),fill='#7d6570',width=1)
            draw.text(((x-185)*10,0),str(x),fill='red')
        for y in range(115,184,5):
            draw.line((0,(y-112)*10,1400,(y-112)*10),fill='#7d6570',width=1)
            draw.text((0,(y-112)*10),str(y),fill='red')
        head.save(OUT/f'{heading}-lip-grid.png');head.close();flat.close();image.close()
    reference_comparison()
    (OUT/'receipt.json').write_text(json.dumps({'status':'OWN SOURCE PILOT; native/runtime pending',
        'landmarks':LANDMARKS,'protectedOwnedHands':OWNED_HANDS,'fields':receipt},indent=2)+'\n')
    print('Own16 extremes,5lip grids and actual equal-height reference comparison prepared.')
if __name__=='__main__':main()
