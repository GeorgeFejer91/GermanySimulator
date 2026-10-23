"""Exact decoded Hannelore atlas rows on light/dark review backgrounds."""
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5]
SOURCE=ROOT/'output/street-redesign/hannelore-end-to-end/candidate-v2'
OUT=ROOT/'output/street-redesign/hannelore-end-to-end/native-boards-v2'
OUT.mkdir(parents=True,exist_ok=True)
for variant,width in [('desktop',80),('mobile',64)]:
 height=int(width*1.25)
 atlas=Image.open(SOURCE/f'source-{variant}.webp').convert('RGBA')
 assert atlas.size==(16*width,32*height)
 for start,end,name in [(0,4,'walk'),(4,8,'bridges'),(8,9,'turns'),(9,13,'stops-down'),
                        (13,16,'stops-up-1'),(16,18,'gesture-up-2'),(18,22,'stops-right-1'),
                        (22,25,'stops-right-2'),(25,29,'stops-left-1'),(29,32,'stops-left-2')]:
  source=atlas.crop((0,start*height,atlas.width,end*height))
  for theme,bg,ink in [('light','#eee8db','#111'),('dark','#25272b','#eee')]:
   image=Image.alpha_composite(Image.new('RGBA',source.size,bg),source).convert('RGB')
   board=Image.new('RGB',(image.width,image.height+18),bg)
   board.paste(image,(0,18))
   ImageDraw.Draw(board).text((5,3),f'{variant} {name} rows {start}-{end-1} exact decoded',fill=ink)
   board.save(OUT/f'{variant}-{name}-{theme}.png')
print('decoded atlas rows prepared')
