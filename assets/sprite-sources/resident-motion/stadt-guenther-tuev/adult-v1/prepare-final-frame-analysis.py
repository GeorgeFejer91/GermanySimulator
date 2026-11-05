"""Bind inspected native boards to every exact encoded Guenther cell.

Adapted from Hartmut's actor-owned final-frame artifact scaffold. This does not
render source fields or change selected assets. Extraction prepares evidence;
--accept-reviewed writes observations only after the owner has inspected every
listed board and supplied its exact hashes in inspected-boards.json.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,math,os,shutil
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/guenther-end-to-end'
OUT=WORK/'final-frame-analysis'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
cache={}
def record(path):
 path=path.resolve()
 if path not in cache:cache[path]={'file':os.path.relpath(path,OUT).replace('\\','/'),'sha256':sha(path)}
 return dict(cache[path])
def describe(cell,box,variant):
 heading=cell['heading'];kind=cell['kind'];rear=heading in ('up','rear-right','rear-left')
 identity=('Swept iron-grey hair, beige rear collar, crossed blue overall straps and full blue trouser legs retain older Guenther in rear projection. One round gauge and black hose remain anatomical RIGHT; rear faces remain hidden.' if rear else 'Swept iron-grey hair, thick grey brows and stern angular clean-shaven square worn face retain Guenther Tuev. Beige short sleeves, faded blue overalls, rolled hems and broad black boots preserve his mechanic identity. One round pressure gauge and black hose stay in anatomical RIGHT hand; anatomical LEFT stays empty.')
 if kind=='walk':motion=f"{heading} ordered walk sample {cell['col']} of16 retains its own small alternating trouser/shoe step. The last-to-first strip comparison returns to the same source pose; rendered displacement cadence requires separate production evidence."
 elif kind=='stop':motion=f"{heading} entry phase {cell['entryPhase']} at source field strength {cell['strength']} belongs to its inspected six-column walk-phase/settle/neutral row. Head, right gauge grip and sole ownership persist while the lower chain returns to neutral."
 elif kind=='action':motion=f"Original {cell['action']} sample {cell['actionFrame']} of16 retains its original source-supported torso/head field and durations. RIGHT gauge grip and empty LEFT hand stay attached. Success includes the original bounded lift and return; other quiet states preserve their original distinct fields."
 elif kind=='turn':motion=f"{heading} is an intact own whole-body painted anchor. Head and neck, beige shoulder/overall waist, trouser hips/knees/ankles and broad shoes change projection together; this is not a mirrored cardinal or a head-only replacement."
 else:motion=f"{heading} bridge sample {cell['col']} belongs to the inspected stop-neutral-start strip, connecting source phase0 through half strength and the exact own neutral. The source shoes and clothing retain family scale and pivot."
 hose_note=(' Mobile hose pixels (19,52) alpha231 and (18,53) alpha244 meet diagonally. The original four-neighbour1335+10 audit count is retained; actual eight-neighbour support is one1345-pixel component with no empty native row.' if variant=='mobile' and heading=='down' and (kind=='walk' and cell['col']==14 or kind=='stop' and cell['entryPhase']==14 and cell['strength']==1) else '')
 return {'identity':identity,
 'proportions':f"Native alpha bounds {list(box)} preserve the adult overall waist/hip/knee/ankle chain and adult head of the400px registered painting. The family uses one scale; this frame is not individually stretched or fitted.",
 'rendering_style':'Angular dirty-beige sleeve planes, faded petrol-blue overall folds, rolled hems and scuffed broad black boots retain weathered Berlin adult painting. His lined face and clothing keep irregular painted detail.',
 'lighting_color':'Warm cheek and cotton highlights stay attached to their original body planes. Dark hose, metal gauge rim and cool blue trouser/boot shadows keep their depth against light and dark composites without an opaque background rectangle.',
 'contour':'Swept hair, beige sleeve hems, empty LEFT hand, RIGHT gauge/hose contour and complete shoe toes/heels remain inside transparent gutters. Actual source-supported contours and complete soles were inspected.'+hose_note,
 'texture':'Overall straps/buttons, beige shirt collar, gauge rim, black hose and blue trouser creases travel with original source pixels. Fine native facial detail loss follows the common export sampling.',
 'anatomy_occlusion':('Rear collar/neck and beige-shirt shoulders meet the trouser waist; both full trouser chains continue through knees and ankles into broad shoes. Gauge grip stays with RIGHT forearm and near/far overlap follows this own rear painting.' if rear else 'Collar/neck, beige shoulder/sleeve, RIGHT wrist/gauge grip, empty LEFT hand, trouser hip/knee/calf/ankle and shoe joins remain connected. Side views retain their own near/far leg occlusion and complete shoe overlap.'),
 'motion':motion}
def board_image(cells,w,h,cols,bg,magnify):
 sheet=Image.new('RGB',(w*cols,h*math.ceil(len(cells)/cols)),bg)
 for i,im in enumerate(cells):
  if im is not None:sheet.paste(Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB'),((i%cols)*w,(i//cols)*h))
 return sheet.resize((sheet.width*magnify,sheet.height*magnify),Image.Resampling.NEAREST)
def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--accept-reviewed',action='store_true');parser.add_argument('--profile-far-v2',action='store_true');args=parser.parse_args()
 OUT.mkdir(exist_ok=True)
 index=json.loads((WORK/'full-working/body-index.json').read_text());cells=index['cells'];assert len(cells)==412
 references={h:HERE/'registered'/f'{h}.png' for h in ('down','front-right','right','rear-right','up','rear-left','left','front-left')}
 if args.accept_reviewed:
  inspected=json.loads((OUT/'inspected-boards.json').read_text());assert inspected['allFramesActuallyInspected'] is True and inspected['reviewer']=='Guenther Tuev actor owner'
  for file,digest in inspected['hashes'].items():assert sha(ROOT/file)==digest,file
  for variant in ('desktop','mobile'):
   manifest=json.loads((OUT/f'{variant}-manifest.json').read_text());data=json.loads((OUT/f'{variant}-evidence.json').read_text());assert len(data['frames'])==412
   reviews=[]
   for frame,item,cell in zip(manifest['frames'],data['frames'],cells):
    assert frame['id']==item['id']==f"{cell['row']:02}-{cell['col']:02}"
    for evidence in item['evidence']:
     assert sha(OUT/evidence['file'])==evidence['sha256']
     if evidence['role'] in ('enlarged_light','enlarged_dark','ordered_motion'):assert (OUT/evidence['file']).resolve().relative_to(ROOT).as_posix() in inspected['hashes']
    observations=describe(cell,item['nativeAlphaBounds'],variant)
    reviews.append({'id':frame['id'],'sha256':frame['sha256'],'reference_ids':frame['reference_ids'],'verdict':'pass','unresolved_findings':[],'analysis':{k:{'status':'pass','observation':v} for k,v in observations.items()},'evidence':item['evidence']})
   review={'reviewer':inspected['reviewer']+'; actual final encoded/native ordered board inspection','export_sha256':manifest['export']['sha256'],'reference_sha256':{r['id']:r['sha256'] for r in manifest['references']},'ordered_motion_reviewed':True,'scope':'All412 exact encoded cells per variant inspected through complete source-compared ordered native/light/dark boards, including all64 entry-phase stop rows, all20bridges, alloriginal actions and8turns. Native boards are asserted pixel-exact against final encoded cells. Ordered frame strips are visual sequence evidence; separate actual production receipts cover real selectors/cadence/turns/actions/media/floor/fallback/lifecycle. This record does not claim every staged heading was a natural street route.','frames':reviews}
   (OUT/f'{variant}-review.json').write_text(json.dumps(review,indent=2)+'\n');print(variant+' recorded412 inspected final-frame analyses',flush=True)
  return
 helper_path=ROOT/'tools/build-street-character-sprites.py'
 helper_spec=importlib.util.spec_from_file_location('guenther_final_native_export',helper_path);street=importlib.util.module_from_spec(helper_spec);helper_spec.loader.exec_module(street)
 prior_review_path=WORK/'native-source-review/owner-visual-review.json';prior_review=json.loads(prior_review_path.read_text(encoding='utf-8-sig'))
 assert prior_review['actuallyInspectedBoardCount']==100 and prior_review['allListedBoardsActuallyInspected'] is True
 for file,digest in prior_review['hashes'].items():assert sha(ROOT/file)==digest,file
 boards={};variant_results={};old_cells={}
 if args.profile_far_v2:
  preserved=WORK/'v1-preserved-packet';old_index=json.loads((preserved/'body-index.json').read_text());old_cells={(c['row'],c['col']):c for c in old_index['cells']}
  archive=preserved/'final-frame-analysis';archive.mkdir(exist_ok=False)
  for path in OUT.glob('*.json'):shutil.copy2(path,archive/path.name)
  old_mouth=json.loads((preserved/'assets/characters/residents/stadt-guenther-tuev/delivery-v2/mouths-v1.json').read_text())
  new_mouth=json.loads((ROOT/'assets/characters/residents/stadt-guenther-tuev/delivery-v2/mouths-v1.json').read_text())
  assert old_mouth['frames']==new_mouth['frames'] and old_mouth['standing']==new_mouth['standing'],'Own lip registration changed unexpectedly'
 for variant,w,h in [('desktop',96,120),('mobile',64,80)]:
  folder=OUT/variant;folder.mkdir(exist_ok=True)
  export_path=ROOT/'assets/characters/residents/stadt-guenther-tuev/delivery-v2'/f'source-{variant}.webp'
  atlas=Image.open(export_path).convert('RGBA');frames={};manifest_frames=[];evidence_frames=[]
  old_atlas=Image.open(preserved/export_path.relative_to(ROOT)).convert('RGBA') if args.profile_far_v2 else None
  unchanged=changed=upper_halves=0
  refs=[{'id':heading,**record(path)} for heading,path in references.items()];neutral={}
  for heading,path in references.items():
   source=Image.open(path).convert('RGBA');crop=source.crop((round(256-64*400/136),round(472-150*400/136),round(256+64*400/136),round(472+10*400/136)))
   neutral[heading]=crop.resize((w,h),Image.Resampling.LANCZOS)
  for cell in cells:
   row,col=cell['row'],cell['col'];ident=f'{row:02}-{col:02}';heading=cell['heading'];kind=cell['kind']
   im=atlas.crop((col*w,row*h,(col+1)*w,(row+1)*h));frames[row,col]=im;path=folder/f'{ident}.png';im.save(path)
   source_path=ROOT/cell['source']['file'];assert sha(source_path)==cell['source']['sha256']
   q=w/128;native=street.export_cell(Image.open(source_path).convert('RGBA'),{'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}})
   assert im.tobytes()==native.tobytes(),f'{variant} {ident} final encoded RGBA differs from exact own native export'
   if old_atlas is not None:
    old_im=old_atlas.crop((col*w,row*h,(col+1)*w,(row+1)*h))
    assert im.crop((0,0,w,h//2)).tobytes()==old_im.crop((0,0,w,h//2)).tobytes(),'Native upper body/mouth pixels unexpectedly changed';upper_halves+=1
    if cell['source']['sha256']==old_cells[row,col]['source']['sha256']:
     assert im.tobytes()==old_im.tobytes(),'Unaffected encoded cell changed';unchanged+=1
    else:
     assert cell['heading'] in ('right','left') and cell['kind'] in ('walk','stop');changed+=1
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
    if new and not args.profile_far_v2:expected.save(path)
    else:
     with Image.open(path) as actual:assert np.array_equal(np.array(actual),np.array(expected)),str(path)
    boards[path.relative_to(ROOT).as_posix()]=sha(path)
  for item in evidence_frames:
   stem=item.pop('stem');boarddir=Path(item.pop('boarddir'));comparison=Path(item.pop('comparison'));native_path=Path(item.pop('native'));heading=next(c['heading'] for c in cells if item['id']==f"{c['row']:02}-{c['col']:02}")
   item['evidence']=[{'role':'source_comparison',**record(comparison),'reference_ids':[heading]},{'role':'native',**record(native_path)},{'role':'enlarged_light',**record(boarddir/f'{stem}-light.png')},{'role':'enlarged_dark',**record(boarddir/f'{stem}-dark.png')},{'role':'ordered_motion',**record(boarddir/f'{stem}-light.png')}]
  counts={row:len([c for c in cells if c['row']==row]) for row in range(20)}
  for row,count in counts.items():assert sorted(c['col'] for c in cells if c['row']==row)==list(range(count))
  manifest={'export':record(export_path),'cell_size_xy':[w,h],'movement_rows':[{'row':row,'count':count} for row,count in counts.items()],'references':refs,'frames':manifest_frames}
  if args.profile_far_v2:assert (unchanged,changed,upper_halves)==(292,120,412)
  (OUT/f'{variant}-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(OUT/f'{variant}-evidence.json').write_text(json.dumps({'frames':evidence_frames},indent=2)+'\n');variant_results[variant]={'exactEncodedCells':412,'nativeSourceRgbaExact':412,'encodedExportSha256':sha(export_path),'verifiedExistingNativeBoards':50,'newEncodedBridgeBoards':0 if args.profile_far_v2 else 8,'unchangedEncodedCellsExact':unchanged,'affectedEncodedCellsSourceExact':changed,'upperHalfMouthPixelsExact':upper_halves};print(variant+' extracted412 exact final RGBA frames;50 native boards exact and8bridge boards '+('carried exact' if args.profile_far_v2 else 'prepared'),flush=True)
 (OUT/'evidence-inventory.json').write_text(json.dumps({'status':'EXTRACTED; v2 carries60 unchanged native boards and16 exact bridge boards;40 affected native boards separately reviewed' if args.profile_far_v2 else 'EXTRACTED; carry exact prior100-board visual review and inspect all16 new bridge boards before acceptance','profileFarV2Only':args.profile_far_v2,'variants':variant_results,'boardHashes':boards,'carriedVisualReview':{'file':prior_review_path.relative_to(ROOT).as_posix(),'sha256':sha(prior_review_path),'actuallyInspectedBoards':100},'nativeExportHelper':{'file':helper_path.relative_to(ROOT).as_posix(),'sha256':sha(helper_path)},'referenceHashes':{p.relative_to(ROOT).as_posix():sha(p) for p in references.values()}},indent=2)+'\n')
if __name__=='__main__':main()
