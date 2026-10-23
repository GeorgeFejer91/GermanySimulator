"""Extract explicit bridge review boards from existing encoded paint; no art changes."""
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,json
root=Path.cwd(); work=root/'output/street-redesign/klaus-klein-end-to-end'; out=work/'native-source-review'; records=[]
for variant,w,h in [('desktop',96,120),('mobile',64,80)]:
 atlas=Image.open(root/f'assets/characters/residents/stadt-klaus-dieter-klein/delivery-v2/source-{variant}.webp').convert('RGBA')
 for row,heading in enumerate(('down','right','up','left'),4):
  cells=[atlas.crop((col*w,row*h,(col+1)*w,(row+1)*h)) for col in range(5)]
  for theme,bg,fg in [('light','#eee8db','#262626'),('dark','#20232a','#efefef')]:
   board=Image.new('RGB',(5*(w*3+12),h*3+46),bg); draw=ImageDraw.Draw(board)
   for col,cell in enumerate(cells):
    x=col*(w*3+12)+6; board.paste(cell.resize((w*3,h*3),Image.Resampling.NEAREST),(x,28),cell.resize((w*3,h*3),Image.Resampling.NEAREST))
    draw.text((x,8),['stop .5','stop .25','neutral','start .5','walk phase0'][col],fill=fg)
   p=out/f'{variant}-{heading}-bridges-{theme}.png';board.save(p)
   records.append({'file':p.relative_to(root).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'row':row,'cols':[0,1,2,3,4]})
report={'status':'EXTRACTED_NOT_YET_VISUALLY_REVIEWED','boards':records,'source':'Exact selected existing source atlases; no art generation or rerender','nativeCells':40}
(work/'bridge-extraction.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'boards':len(records),'nativeCells':40,'status':report['status']}))
