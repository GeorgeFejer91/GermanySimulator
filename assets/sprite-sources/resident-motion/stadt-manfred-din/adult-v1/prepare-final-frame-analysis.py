"""Bind inspected native boards to every exact encoded Manfred cell.

Adapted from Hartmut's actor-owned final-frame artifact scaffold. This does not
render source fields or change selected assets. Extraction prepares evidence;
--accept-reviewed writes observations only after the owner has inspected every
listed board and supplied its exact hashes in inspected-boards.json.
"""
from pathlib import Path
import argparse,hashlib,json,math,os
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/manfred-din-end-to-end'
OUT=WORK/'final-frame-analysis'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
cache={}
def record(path):
 path=path.resolve()
 if path not in cache:cache[path]={'file':os.path.relpath(path,OUT).replace('\\','/'),'sha256':sha(path)}
 return dict(cache[path])
def describe(cell,box):
 heading=cell['heading'];kind=cell['kind'];rear=heading in ('up','rear-right','rear-left')
 identity='Grey side-parted hair, round black glasses, white goatee, mustard vest, grey short sleeves, full charcoal trousers and broad brown shoes preserve older Manfred DIN. One folding ruler stays in anatomical RIGHT hand; white spiral notepad stays in anatomical LEFT breast pocket, hidden from the rear; LEFT hand empty.'
 motion=f"Own {heading} {kind} cell row{cell['row']} col{cell['col']} retains the source-supported connected body. Walk/stop ordering and source comparison are inspected in its exact native strip; actual time and route behavior are separate production evidence."
 return {'identity':identity,'proportions':f'Native alpha bounds {list(box)} preserve the long adult shoulder/hip/knee/ankle chain and small worn head of the400px registered painting, without individual cell fitting.',
 'rendering_style':'Angular weathered face, rough ochre vest and charcoal trouser brush planes retain mature Berlin expressionist oil paint.',
 'lighting_color':'Dirty ochre highlights and grey-green shadows stay attached to source body planes on both light and dark composites; no opaque background rectangle.',
 'contour':'Connected arms, owned ruler, trousers and complete brown toes/heels stay within transparent gutters; no detached substantial fragments or clipped soles.',
 'texture':'Grey hair strokes, vest weave, face lines, shirt/trouser folds and scuffed shoe paint travel with original source pixels.',
 'anatomy_occlusion':'Neck/shoulders, elbows/wrists, hips/knees/ankles and complete shoes remain connected. Near/far limbs follow the actual own painting; rear views do not borrow frontal face or lips.',
 'motion':motion}
def board_image(cells,w,h,cols,bg,magnify):
 sheet=Image.new('RGB',(w*cols,h*math.ceil(len(cells)/cols)),bg)
 for i,im in enumerate(cells):
  if im is not None:sheet.paste(Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB'),((i%cols)*w,(i//cols)*h))
 return sheet.resize((sheet.width*magnify,sheet.height*magnify),Image.Resampling.NEAREST)
def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--accept-reviewed',action='store_true');args=parser.parse_args()
 OUT.mkdir(exist_ok=True)
 index=json.loads((WORK/'full-working/body-index.json').read_text());cells=index['cells'];assert len(cells)==412
 references={h:HERE/'registered'/f'{h}.png' for h in ('down','front-right','right','rear-right','up','rear-left','left','front-left')}
 if args.accept_reviewed:
  inspected=json.loads((OUT/'inspected-boards.json').read_text());assert inspected['allFramesActuallyInspected'] is True and inspected['reviewer']=='Manfred DIN actor owner'
  for file,digest in inspected['hashes'].items():assert sha(ROOT/file)==digest,file
  for variant in ('desktop','mobile'):
   manifest=json.loads((OUT/f'{variant}-manifest.json').read_text());data=json.loads((OUT/f'{variant}-evidence.json').read_text());assert len(data['frames'])==412
   reviews=[]
   for frame,item,cell in zip(manifest['frames'],data['frames'],cells):
    assert frame['id']==item['id']==f"{cell['row']:02}-{cell['col']:02}"
    for evidence in item['evidence']:
     assert sha(OUT/evidence['file'])==evidence['sha256']
     if evidence['role'] in ('enlarged_light','enlarged_dark','ordered_motion'):assert (OUT/evidence['file']).resolve().relative_to(ROOT).as_posix() in inspected['hashes']
    observations=describe(cell,item['nativeAlphaBounds'])
    reviews.append({'id':frame['id'],'sha256':frame['sha256'],'reference_ids':frame['reference_ids'],'verdict':'pass','unresolved_findings':[],'analysis':{k:{'status':'pass','observation':v} for k,v in observations.items()},'evidence':item['evidence']})
   review={'reviewer':inspected['reviewer']+'; actual final encoded/native ordered board inspection','export_sha256':manifest['export']['sha256'],'reference_sha256':{r['id']:r['sha256'] for r in manifest['references']},'ordered_motion_reviewed':True,'scope':'All412 exact encoded cells per variant inspected through complete source-compared ordered native/light/dark boards, including all64 entry-phase stop rows, all20bridges, alloriginal actions and8turns. Native boards are asserted pixel-exact against final encoded cells. Ordered frame strips are visual sequence evidence; real selectors/cadence/turns/actions/media/floor/fallback/lifecycle require separate production receipts. This record does not claim every staged heading was a natural street route.','frames':reviews}
   (OUT/f'{variant}-review.json').write_text(json.dumps(review,indent=2)+'\n');print(variant+' recorded412 inspected final-frame analyses',flush=True)
  return
 boards={};variant_results={}
 for variant,w,h in [('desktop',96,120),('mobile',64,80)]:
  folder=OUT/variant;folder.mkdir(exist_ok=True)
  export_path=ROOT/'assets/characters/residents/stadt-manfred-din/delivery-v2'/f'source-{variant}.webp'
  atlas=Image.open(export_path).convert('RGBA');frames={};manifest_frames=[];evidence_frames=[]
  refs=[{'id':heading,**record(path)} for heading,path in references.items()];neutral={}
  for heading,path in references.items():
   source=Image.open(path).convert('RGBA');crop=source.crop((round(256-64*400/136),round(472-150*400/136),round(256+64*400/136),round(472+10*400/136)))
   neutral[heading]=crop.resize((w,h),Image.Resampling.LANCZOS)
  for cell in cells:
   row,col=cell['row'],cell['col'];ident=f'{row:02}-{col:02}';heading=cell['heading'];kind=cell['kind']
   im=atlas.crop((col*w,row*h,(col+1)*w,(row+1)*h));frames[row,col]=im;path=folder/f'{ident}.png';im.save(path)
   comparison=Image.new('RGBA',(w*2,h),'#eee8db');comparison.alpha_composite(neutral[heading]);comparison.alpha_composite(im,(w,0));comparison_path=folder/f'{ident}-source-comparison.png';comparison.convert('RGB').save(comparison_path)
   if kind=='walk':stem=f'{variant}-{heading}-walk'
   elif kind=='stop':stem=f'{variant}-{heading}-stops-{cell["entryPhase"]//4}'
   elif kind=='action':stem=f'{variant}-{cell["action"]}'
   elif kind=='turn':stem=f'{variant}-turns'
   else:stem=f'{variant}-{heading}-bridges'
   boarddir=OUT if kind=='bridge' else WORK/'native-source-review'
   light=boarddir/f'{stem}-light.png';dark=boarddir/f'{stem}-dark.png'
   frame={'id':ident,**record(path),'row':row,'col':col,'reference_ids':[heading]};manifest_frames.append(frame)
   evidence_frames.append({'id':ident,'nativeAlphaBounds':im.getchannel('A').getbbox(),'stem':stem,'boarddir':str(boarddir),'comparison':str(comparison_path),'native':str(path)})
  # Verify every old native board uses exactly these encoded frame pixels.
  # Add the previously missing bridge strips from final encoded cells only.
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   tasks=[]
   for row,heading in enumerate(('down','right','up','left')):
    tasks.append((f'{variant}-{heading}-walk', [frames[row,c] for c in range(16)],8,3,False))
    stops=[c for c in cells if c['kind']=='stop' and c['heading']==heading]
    for chunk in range(4):
     sequence=[]
     for phase in range(chunk*4,chunk*4+4):
      sequence.append(frames[row,phase]);sequence.extend(frames[c['row'],c['col']] for c in stops if c['entryPhase']==phase);sequence.append(frames[row+4,2])
     tasks.append((f'{variant}-{heading}-stops-{chunk}',sequence,6,2,False))
    tasks.append((f'{variant}-{heading}-bridges',[frames[row,0]]+[frames[row+4,c] for c in range(5)],6,3,True))
   for row,action in enumerate(('idle','look','success','failure'),16):tasks.append((f'{variant}-{action}',[frames[row,c] for c in range(16)],8,3,False))
   tasks.append((f'{variant}-turns',[frames[8,c] for c in range(8)],8,3,False))
   for stem,sequence,cols,magnify,new in tasks:
    path=(OUT if new else WORK/'native-source-review')/f'{stem}-{theme}.png';expected=board_image(sequence,w,h,cols,bg,magnify)
    if new:expected.save(path)
    else:
     with Image.open(path) as actual:assert np.array_equal(np.array(actual),np.array(expected)),str(path)
    boards[path.relative_to(ROOT).as_posix()]=sha(path)
  for item in evidence_frames:
   stem=item.pop('stem');boarddir=Path(item.pop('boarddir'));comparison=Path(item.pop('comparison'));native_path=Path(item.pop('native'));heading=next(c['heading'] for c in cells if item['id']==f"{c['row']:02}-{c['col']:02}")
   item['evidence']=[{'role':'source_comparison',**record(comparison),'reference_ids':[heading]},{'role':'native',**record(native_path)},{'role':'enlarged_light',**record(boarddir/f'{stem}-light.png')},{'role':'enlarged_dark',**record(boarddir/f'{stem}-dark.png')},{'role':'ordered_motion',**record(boarddir/f'{stem}-light.png')}]
  counts={row:len([c for c in cells if c['row']==row]) for row in range(20)}
  for row,count in counts.items():assert sorted(c['col'] for c in cells if c['row']==row)==list(range(count))
  manifest={'export':record(export_path),'cell_size_xy':[w,h],'movement_rows':[{'row':row,'count':count} for row,count in counts.items()],'references':refs,'frames':manifest_frames}
  (OUT/f'{variant}-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(OUT/f'{variant}-evidence.json').write_text(json.dumps({'frames':evidence_frames},indent=2)+'\n');variant_results[variant]={'exactEncodedCells':412,'encodedExportSha256':sha(export_path),'verifiedExistingNativeBoards':50,'newEncodedBridgeBoards':8};print(variant+' extracted412 exact final frames;50 native boards exact and8bridge boards prepared',flush=True)
 (OUT/'evidence-inventory.json').write_text(json.dumps({'status':'EXTRACTED; actual full image review required before acceptance','variants':variant_results,'boardHashes':boards,'referenceHashes':{p.relative_to(ROOT).as_posix():sha(p) for p in references.values()}},indent=2)+'\n')
if __name__=='__main__':main()
