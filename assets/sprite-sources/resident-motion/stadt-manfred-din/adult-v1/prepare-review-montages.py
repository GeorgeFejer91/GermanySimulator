"""Lossless four-board review pages; original native boards remain authoritative."""
from pathlib import Path
import hashlib,json
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5]
WORK=ROOT/'output/street-redesign/manfred-din-end-to-end'
OUT=WORK/'review-montages';OUT.mkdir(exist_ok=False)
paths=sorted((WORK/'native-source-review').glob('*.png'))+sorted((WORK/'final-frame-analysis').glob('*-bridges-*.png'))
groups={}
for path in paths:
 with Image.open(path) as im:groups.setdefault(im.size,[]).append(path)
records=[]
for dimensions,group in sorted(groups.items()):
 for start in range(0,len(group),4):
  selected=group[start:start+4];w,h=dimensions
  page=Image.new('RGB',(w*2,h*2),'#aaaaaa')
  for index,path in enumerate(selected):
   with Image.open(path) as im:page.paste(im,((index%2)*w,(index//2)*h))
  dest=OUT/f'page-{len(records):02}.png';page.save(dest)
  records.append({'page':dest.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'sourceBoards':[{'file':p.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'slot':i} for i,p in enumerate(selected)],'sourceBoardSize':list(dimensions),'unresizedOriginalPixels':True})
assert sum(len(r['sourceBoards']) for r in records)==116
(OUT/'index.json').write_text(json.dumps({'status':'PREPARED; actual view inspection required','pages':records},indent=2)+'\n')
print(json.dumps({'pages':len(records),'allOriginalBoards':116,'unresizedOriginalPixels':True}))
