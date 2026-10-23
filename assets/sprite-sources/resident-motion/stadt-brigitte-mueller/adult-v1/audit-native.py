"""Export the exact own source fields for native all-frame visual inspection."""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/brigitte-mueller-end-to-end';OUT=WORK/'native-source-review'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):
 s=importlib.util.spec_from_file_location('brigitte_native_export',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 index_path=WORK/'full-working/body-index.json';index=json.loads(index_path.read_text());street=load(ROOT/'tools/build-street-character-sprites.py')
 OUT.mkdir(parents=True,exist_ok=True);checks={};native={}
 for name,w,h in [('desktop',96,120),('mobile',64,80)]:
  q=w/128;frames={};check=[]
  for cell in index['cells']:
   path=ROOT/cell['source']['file'];assert sha(path)==cell['source']['sha256']
   im=street.export_cell(Image.open(path).convert('RGBA'),{'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}})
   rgba=np.array(im);alpha=rgba[:,:,3];assert not np.any(rgba[alpha==0,:3])
   box=im.getchannel('A').getbbox();assert box
   g,n=label(alpha>=21);sizes=np.bincount(g.ravel())[1:]
   check.append({'row':cell['row'],'col':cell['col'],'gutter':min(box[0],box[1],w-box[2],h-box[3]),'components':[int(z) for z in sizes if z>=3]})
   frames[cell['row'],cell['col']]=im
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   def board(cells,cols,path,magnify=3):
    sheet=Image.new('RGB',(w*cols,h*math.ceil(len(cells)/cols)),bg)
    for i,cell in enumerate(cells):
     if cell is not None:sheet.paste(Image.alpha_composite(Image.new('RGBA',cell.size,bg),cell).convert('RGB'),((i%cols)*w,(i//cols)*h))
    sheet.resize((sheet.width*magnify,sheet.height*magnify),Image.Resampling.NEAREST).save(OUT/path)
   for row,heading in enumerate(('down','right','up','left')):
    board([frames[row,c] for c in range(16)],8,f'{name}-{heading}-walk-{theme}.png')
    stops=[c for c in index['cells'] if c['kind']=='stop' and c['heading']==heading]
    # Four complete phase rows per board: each row is the owned walk phase,
    # four source-supported strength stages and the exact neutral endpoint.
    for chunk in range(4):
     cells=[]
     for phase in range(chunk*4,chunk*4+4):
      cells.append(frames[row,phase]);cells.extend(frames[c['row'],c['col']] for c in stops if c['entryPhase']==phase);cells.append(frames[row+4,2])
     board(cells,6,f'{name}-{heading}-stops-{chunk}-{theme}.png',2)
   for row,action in enumerate(('idle','look','success','failure'),16):board([frames[row,c] for c in range(16)],8,f'{name}-{action}-{theme}.png')
   board([frames.get((8,c)) for c in range(8)],8,f'{name}-turns-{theme}.png')
  checks[name]={'selectedCells':len(check),'minimumGutter':min(x['gutter'] for x in check),'multipleComponents':sum(len(x['components'])>1 for x in check),'cells':check}
 receipt={'status':'MECHANICAL checks only; exact boards require image review','indexSha256':sha(index_path),'native':checks}
 (OUT/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({k:{f:v[f] for f in ['selectedCells','minimumGutter','multipleComponents']} for k,v in checks.items()}))
if __name__=='__main__':run()
