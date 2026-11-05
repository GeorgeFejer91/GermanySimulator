"""Export the exact own source fields for native all-frame visual inspection."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,math,shutil
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/hildegard-brotzeit-end-to-end';OUT=WORK/'native-source-review'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):
 s=importlib.util.spec_from_file_location('hildegard_native_export',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run(profile_far_v2=False):
 index_path=WORK/'full-working/body-index.json';index=json.loads(index_path.read_text());street=load(ROOT/'tools/build-street-character-sprites.py')
 OUT.mkdir(parents=True,exist_ok=True);checks={};native={}
 if profile_far_v2:
  archive=WORK/'v1-preserved-packet/native-source-review';archive.mkdir(parents=True,exist_ok=False)
  prior=json.loads((OUT/'owner-visual-review.json').read_text(encoding='utf-8-sig'))
  for rel,digest in prior['hashes'].items():assert sha(ROOT/rel)==digest,rel
  for name in ('owner-visual-review.json','receipt.json'):shutil.copy2(OUT/name,archive/name)
  for rel in prior['hashes']:
   if any(f'-{heading}-' in Path(rel).name for heading in ('right','left')):shutil.copy2(ROOT/rel,archive/Path(rel).name)
 for name,w,h in [('desktop',96,120),('mobile',64,80)]:
  q=w/128;frames={};check=[]
  for cell in index['cells']:
   if profile_far_v2 and not (cell['heading'] in ('right','left') and (cell['kind'] in ('walk','stop') or cell['kind']=='bridge' and cell['col']==2)):continue
   path=ROOT/cell['source']['file'];assert sha(path)==cell['source']['sha256']
   im=street.export_cell(Image.open(path).convert('RGBA'),{'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}})
   rgba=np.array(im);alpha=rgba[:,:,3];assert not np.any(rgba[alpha==0,:3])
   box=im.getchannel('A').getbbox();assert box
   g,n=label(alpha>=21);sizes=np.bincount(g.ravel())[1:]
   below=int(((alpha>=21)&(np.arange(h)[:,None]+.5>150*q+.5)).sum())
   check.append({'row':cell['row'],'col':cell['col'],'gutter':min(box[0],box[1],w-box[2],h-box[3]),'components':[int(z) for z in sizes if z>=3],'belowGroundPixels':below})
   frames[cell['row'],cell['col']]=im
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   def board(cells,cols,path,magnify=3):
    sheet=Image.new('RGB',(w*cols,h*math.ceil(len(cells)/cols)),bg)
    for i,cell in enumerate(cells):
     if cell is not None:sheet.paste(Image.alpha_composite(Image.new('RGBA',cell.size,bg),cell).convert('RGB'),((i%cols)*w,(i//cols)*h))
    sheet.resize((sheet.width*magnify,sheet.height*magnify),Image.Resampling.NEAREST).save(OUT/path)
   for row,heading in enumerate(('down','right','up','left')):
    if profile_far_v2 and heading not in ('right','left'):continue
    board([frames[row,c] for c in range(16)],8,f'{name}-{heading}-walk-{theme}.png')
    stops=[c for c in index['cells'] if c['kind']=='stop' and c['heading']==heading]
    # Four complete phase rows per board: each row is the owned walk phase,
    # four source-supported strength stages and the exact neutral endpoint.
    for chunk in range(4):
     cells=[]
     for phase in range(chunk*4,chunk*4+4):
      cells.append(frames[row,phase]);cells.extend(frames[c['row'],c['col']] for c in stops if c['entryPhase']==phase);cells.append(frames[row+4,2])
     board(cells,6,f'{name}-{heading}-stops-{chunk}-{theme}.png',2)
   if not profile_far_v2:
    for row,action in enumerate(('idle','look','success','failure'),16):board([frames[row,c] for c in range(16)],8,f'{name}-{action}-{theme}.png')
    board([frames.get((8,c)) for c in range(8)],8,f'{name}-turns-{theme}.png')
  checks[name]={'selectedCells':len(check),'minimumGutter':min(x['gutter'] for x in check),'multipleComponents':sum(len(x['components'])>1 for x in check),'belowGroundPixels':sum(x['belowGroundPixels'] for x in check),'cells':check}
 receipt={'status':'MECHANICAL checks only; exact boards require image review','profileFarV2Only':profile_far_v2,'indexSha256':sha(index_path),'native':checks}
 (OUT/('receipt-profile-far-v2.json' if profile_far_v2 else 'receipt.json')).write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({k:{f:v[f] for f in ['selectedCells','minimumGutter','multipleComponents','belowGroundPixels']} for k,v in checks.items()}))
 assert all(v['belowGroundPixels']==0 for v in checks.values()),'Native cell paint crosses the half-pixel pivot allowance; inspect recorded exact cell counts'
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--profile-far-v2',action='store_true');run(p.parse_args().profile_far_v2)
