"""Source-only equal-figure-height comparison to the actual selected masters.

Reference enlargement is diagnostic, not newly authored detail or runtime scale.
The actual common-ground game comparison belongs to the in-game Camera gate.
"""
from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/klaus-klein-end-to-end/population-source'
def run():
 OUT.mkdir(parents=True,exist_ok=True);figures=[('Klaus adult',Image.open(HERE/'registered/down.png').convert('RGBA'))];pins={}
 for label,folder in [('Söder','assets/characters/bayern'),('Herr Sandale','assets/tourists/towelMan'),('Frau Sandale','assets/tourists/towelWoman')]:
  base=ROOT/folder;path=base/'manifest.json';m=json.loads(path.read_text());w,h=m['frame_size'];turn=m['turns'];anchor=turn['anchors']['down'];row=turn.get('cells',[{'row':4,'col':0}])[anchor]['row'] if 'cells' in turn else turn['rows'][anchor//m['cols']];col=turn['cells'][anchor]['col'] if 'cells' in turn else anchor%m['cols']
  source=base/m['image'];pins[path.relative_to(ROOT).as_posix()]=hashlib.sha256(path.read_bytes()).hexdigest();pins[source.relative_to(ROOT).as_posix()]=hashlib.sha256(source.read_bytes()).hexdigest()
  with Image.open(source) as atlas:cell=atlas.crop((col*w,row*h,(col+1)*w,(row+1)*h)).convert('RGBA')
  figures.append((label,cell))
 metrics={};board=Image.new('RGB',(512*4,512),'#eee8db');draw=ImageDraw.Draw(board)
 for index,(label,image) in enumerate(figures):
  mask=image.getchannel('A').point(lambda a:255 if a>=20 else 0);box=mask.getbbox();assert box
  cropped=image.crop(box);scale=400/cropped.height;display=cropped.resize((round(cropped.width*scale),400),Image.Resampling.LANCZOS);x=index*512+(512-display.width)//2;board.paste(display,(x,472-400),display);draw.text((index*512+12,15),label,fill='#111')
  metrics[label]={'originalCell':list(image.size),'alpha20Bounds':box,'sourceFigureHeight':box[3]-box[1],'diagnosticEqualHeight':400,'displayScale':scale}
 board.save(OUT/'equal-height-selected-neutral-masters.png');(OUT/'receipt.json').write_text(json.dumps({'scope':'Source neutral comparison only; runtime scale and interpretation remain separate','selectedMasterPins':pins,'figures':metrics},indent=2)+'\n');print(json.dumps(metrics))
if __name__=='__main__':run()
