from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageFont
root=Path.cwd();here=root/'assets/sprite-sources/resident-motion/stadt-hannelore-sparkasse/mouth-source-v1';out=root/'output/ambient-city-animation/hannelore-sparkasse-neutral-mouths-v1'
receipt=json.loads((here.parent/'neutral-source-v1/registration-receipt.json').read_text());rows=[]
for name,r in receipt['registered'].items():
 p=root/r['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sha256'];rows.append({'name':name,'role':'accepted neutral registration','file':r['file'],'sha256':r['sha256'],'dimensions':list(Image.open(p).size)})
for r in json.loads((here.parent/'neutral-source-v1/input-pins.json').read_text())['rows'][:4]:
 p=root/r['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sha256'];rows.append({'name':'standing' if r['file'].endswith('standing.webp') else p.stem,'role':'own upstream master or original encoded standing',**r})
pin_data={'identity':'stadt-hannelore-sparkasse','status':'SOURCE-only actual neutral and own upstream image pins','rows':rows}
if (here/'input-pins.json').exists() and json.loads((here/'input-pins.json').read_text())!=pin_data:raise ValueError('STOP: inspected inputs changed; do not repin without new direct pixel review')
(here/'input-pins.json').write_text(json.dumps(pin_data,indent=2)+'\n');(out/'pins-before.json').write_text(json.dumps(rows,indent=2)+'\n')
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',12)
for row in rows[:9]:
 name=row['name'];im=Image.open(root/row['file']).convert('RGBA');box=(135,145,360,245) if name!='standing' else (35,38,95,75);zoom=5 if name!='standing' else 10
 # All eight actual faces are retained, including rear/obscured views.
 crop=im.crop(box);w,h=crop.size;cv=Image.new('RGB',(w*zoom,h*zoom+35),'#eee8db');tile=Image.new('RGBA',crop.size,'#eee8db');tile.alpha_composite(crop);cv.paste(tile.resize((w*zoom,h*zoom),Image.Resampling.NEAREST),(0,35));d=ImageDraw.Draw(cv);d.text((4,4),f'{name}: actual source xy{box}; native pixels enlarged',font=font,fill='#111');cv.save(out/f'{name}-face-clean.png')
 # Mouth detail grid remains a direct pixel inspection aid, not a fit.
 grid=cv.copy();d=ImageDraw.Draw(grid)
 step=5 if name!='standing' else 2
 for x in range(((box[0]+step-1)//step)*step,box[2],step):
  px=(x-box[0])*zoom;d.line((px,35,px,grid.height),fill='#999999',width=1);d.text((px+2,20),str(x),font=font,fill='#111')
 for y in range(((box[1]+step-1)//step)*step,box[3],step):
  py=(y-box[1])*zoom+35;d.line((0,py,grid.width,py),fill='#999999',width=1);d.text((2,py+1),str(y),font=font,fill='#111')
 grid.save(out/f'{name}-face-grid.png')
print(len(rows),'own input images pinned')
