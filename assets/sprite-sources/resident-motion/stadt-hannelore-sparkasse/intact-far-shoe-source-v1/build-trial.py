"""Source-only intact own-shoe revision. No gait, new paint or runtime adoption."""
from pathlib import Path
import sys,json,hashlib,importlib.util
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/hannelore-sparkasse-intact-far-shoe-source-v1'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 OUT.mkdir(parents=True,exist_ok=True)
 recipe=json.loads((HERE/'recipe.json').read_text());pins=recipe['inputs'].copy()
 for p in [HERE/'recipe.json',Path(__file__)]:pins[p.relative_to(ROOT).as_posix()]=sha(p)
 def audit():
  for p,h in pins.items():assert sha(ROOT/p)==h, 'Input changed: '+p
 audit();(OUT/'input-pins-before.json').write_text(json.dumps(pins,indent=2)+'\n')
 sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
 spec=importlib.util.spec_from_file_location('own_street_export',ROOT/'tools/build-street-character-sprites.py');street=importlib.util.module_from_spec(spec);spec.loader.exec_module(street)
 font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',13);files={};rows={};all_direct={}
 def save(im,name):
  p=OUT/name;p.parent.mkdir(exist_ok=True,parents=True);im.save(p);files[name]=sha(p)
 def flat(im,bg):return Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
 def bbox(mask):
  yy,xx=np.where(mask)
  return [int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)] if len(xx) else None
 def delta(a,b):
  d=np.abs(a.astype(int)-b.astype(int));m=np.any(d!=0,2)
  return {'changedPixels':int(m.sum()),'bounds':bbox(m),'maxAbsRgba':d.max(axis=(0,1)).tolist()}
 raw=Image.open(ROOT/'assets/sprite-sources/street-residents/stadt-hannelore-sparkasse-directions-candidate.png')
 for heading,side in recipe['sides'].items():
  ims={k:Image.open(ROOT/p).convert('RGBA' if k not in ['nearMask','farVisibleMask'] else 'L') for k,p in side['files'].items()}
  orig=np.array(ims['original']);donor=np.array(ims['intactShoe']);far=np.array(ims['farVisibleMask'])>0;near=np.array(ims['nearMask'])>0
  v=side['view'];origin=np.array([256,472])-np.array(v['source_pivot'])*v['scale']
  rawmask=Image.new('L',raw.size);ImageDraw.Draw(rawmask).polygon([tuple(p) for p in side['removeFarShoePolygonRaw']],fill=255)
  yy,xx=np.mgrid[:512,:512];sx=np.rint((xx-origin[0])/v['scale']).astype(int);sy=np.rint((yy-origin[1])/v['scale']).astype(int);valid=(sx>=0)&(sx<raw.width)&(sy>=0)&(sy<raw.height)
  cut=np.zeros((512,512),bool);cut[valid]=np.array(rawmask)[sy[valid],sx[valid]]>0;cut &= far & ~near
  g=side['stockingEdgeGuardWorking'];skin_edge=cut & (xx>=g['xMin']) & (xx<=g['xMax']) & (yy<=g['yMax']) & ((orig[:,:,0].astype(int)-orig[:,:,2].astype(int))>g['redMinusBlueMinExclusive']) & (orig[:,:,0]>g['redMinExclusive'])
  cut &= ~skin_edge
  save(Image.fromarray((skin_edge*255).astype('uint8')),heading+'-retained-stocking-edge-guard.png')
  retained=orig.copy();retained[cut]=0;retained[retained[:,:,3]==0,:3]=0
  # The source is a flat painting with non-opaque interiors. Original pixel owners
  # remain exact; no over-blend of the revised shoe into calf/near/upper paint.
  revised=np.array(Image.alpha_composite(ims['intactShoe'],Image.fromarray(retained)))
  owned=retained[:,:,3]>0;revised[owned]=retained[owned];revised[revised[:,:,3]==0,:3]=0
  original_far=np.where((far & (orig[:,:,3]>0))[:,:,None],orig,0).astype('uint8')
  original_shoe=np.where(cut[:,:,None],orig,0).astype('uint8')
  calf=np.where((far & ~cut)[:,:,None],orig,0).astype('uint8');calf[calf[:,:,3]==0,:3]=0
  revised_far=np.array(Image.alpha_composite(ims['intactShoe'],Image.fromarray(calf)));cm=calf[:,:,3]>0;revised_far[cm]=calf[cm];revised_far[revised_far[:,:,3]==0,:3]=0
  arrayims={'original':orig,'revised':revised,'original-visible-far':original_far,'removed-original-far-shoe':original_shoe,'retained-far-stocking':calf,'revised-far-separated':revised_far,'intact-own-shoe':donor}
  for name,a in arrayims.items():save(Image.fromarray(a),heading+'-'+name+'.png')
  save(Image.fromarray((cut*255).astype('uint8')),heading+'-remove-old-far-shoe-mask.png')
  # Mask overlay is a diagnostic, not paint.
  colors=np.zeros_like(orig);colors[cut]=[250,40,170,150]
  overlay=Image.alpha_composite(ims['original'],Image.fromarray(colors));save(flat(overlay,'#eee8db').crop((170,398,340,478)).resize((850,400),Image.Resampling.NEAREST),heading+'-removal-mask-overlay.png')
  pairs=[(ims['original'],'original neutral'),(Image.fromarray(revised),'revised neutral'),(Image.fromarray(original_far),'original far visible'),(Image.fromarray(revised_far),'intact shoe + own calf'),(ims['originalNearShoe'],'own near shoe source')]
  board=Image.new('RGB',(5*344,2*205),'#eee8db');dr=ImageDraw.Draw(board)
  for row,(bg,ink) in enumerate([('#eee8db','#111'),('#25272b','#eee')]):
   dr.rectangle((0,row*205,board.width,(row+1)*205),fill=bg)
   for col,(im,label) in enumerate(pairs):
    board.paste(flat(im,bg).crop((170,398,340,478)).resize((340,160),Image.Resampling.NEAREST),(col*344,row*205+38));dr.text((col*344+3,row*205+4),heading+' '+label,font=font,fill=ink)
  save(board,heading+'-comparison-light-dark.png')
  old_alpha=orig[:,:,3]>0;new_alpha=revised[:,:,3]>0;visible_shoe=cut & old_alpha
  row={'status':'HOLD: intact shoe is coherent but original calf/opening correspondence is not continuous','inputDimensions':list(ims['original'].size),'uniformPlacement':side['uniformPlacementFromFrozenBacking'],'preservedStockingEdgeTexels':int(skin_edge.sum()),'removedOldFarShoeNonzero':int(visible_shoe.sum()),'removedOldFarShoeBounds':bbox(visible_shoe),'neutralDifference':delta(orig,revised),'oldVisibleFarShoeChangedPixels':int(np.count_nonzero(visible_shoe & np.any(orig!=revised,2))),'outsideRemovedShoeOriginalNonzeroRgbaExact':bool(np.array_equal(orig[old_alpha & ~cut],revised[old_alpha & ~cut])),'originalVisibleNearRgbaExact':bool(np.array_equal(orig[near & old_alpha],revised[near & old_alpha])),'retainedFarStockingRgbaExact':bool(np.array_equal(orig[far & ~cut & old_alpha],revised[far & ~cut & old_alpha])),'addedExteriorPixels':int(np.count_nonzero(new_alpha & ~old_alpha)),'removedExteriorPixels':int(np.count_nonzero(old_alpha & ~new_alpha)),'originalSoleBoundsAlpha20':bbox(orig[:,:,3]>=20),'revisedSoleBoundsAlpha20':bbox(revised[:,:,3]>=20),'isolatedIntactShoeBoundsAlpha20':bbox(donor[:,:,3]>=20),'alphaZeroHiddenRgb':int(np.count_nonzero(np.any(revised[:,:,:3]!=0,2)&(revised[:,:,3]==0))),'direct':{},'hiddenHeelMeasured':False,'fullLegs':False}
  b=side['openingInspectionBoxWorking'];opening=np.zeros((512,512),bool);opening[b[1]:b[3],b[0]:b[2]]=True
  lost=opening & (orig[:,:,3]>=200) & (revised[:,:,3]<20);soft=opening & (orig[:,:,3]>=200) & (revised[:,:,3]<160)
  row['openingBand']={'inspectionBox':b,'previousSolidNowAlphaUnder20':int(lost.sum()),'previousSolidNowAlphaUnder160':int(soft.sum()),'under20Bounds':bbox(lost),'qualification':'Diagnostic loss within inspected collar/tongue region, not a measurement of unknown hidden calf or a whole-foot alpha gate'}
  assert row['outsideRemovedShoeOriginalNonzeroRgbaExact'] and row['originalVisibleNearRgbaExact'] and row['retainedFarStockingRgbaExact']
  for w,h in [(96,120),(64,80)]:
   ratio=w/128;s={'working':{'figureHeight':400,'baseline':472},'cell':[w,h],'pivot':[64*ratio,150*ratio],'figureHeight':137*ratio}
   cells={k:street.export_cell(Image.fromarray(a),s) for k,a in arrayims.items() if k in ['original','revised','revised-far-separated','intact-own-shoe']}
   for name,im in cells.items():save(im,f'direct-{w}x{h}/{heading}-{name}.png')
   aa=np.array(cells['revised']);edge=np.concatenate([aa[0,:,3],aa[-1,:,3],aa[:,0,3],aa[:,-1,3]])
   row['direct'][str(w)]={**delta(np.array(cells['original']),aa),'paintHeight':137*ratio,'edgeAlphaMax':int(edge.max()),'alphaZeroHiddenRgb':int(np.count_nonzero(np.any(aa[:,:,:3]!=0,2)&(aa[:,:,3]==0)))}
   assert edge.max()==0 and row['direct'][str(w)]['alphaZeroHiddenRgb']==0
   all_direct[(heading,w)]=cells
  rows[heading]=row
 # Whole neutral is assembled once at working resolution then exported once.
 board=Image.new('RGB',(4*310,2*510),'#eee8db');dr=ImageDraw.Draw(board)
 for row,(bg,ink) in enumerate([('#eee8db','#111'),('#25272b','#eee')]):
  dr.rectangle((0,row*510,board.width,(row+1)*510),fill=bg)
  for col,(heading,w) in enumerate([('right',96),('left',96),('right',64),('left',64)]):
   cells=all_direct[(heading,w)]
   # Actual-size row and nearest-neighbour enlarged pair; no independent layer filtering.
   board.paste(flat(cells['original'],bg),(col*310+5,row*510+40));board.paste(flat(cells['revised'],bg),(col*310+115,row*510+40))
   for k,name in enumerate(['original','revised']):
    im=cells[name];fac=1 if w==96 else 2;board.paste(flat(im,bg).resize((im.width*fac,im.height*fac),Image.Resampling.NEAREST),(col*310+5+k*150,row*510+195))
   dr.text((col*310+3,row*510+4),f'{heading} {w} original / revised',font=font,fill=ink)
 save(board,'fullbody-direct-light-dark.png')
 audit();(OUT/'input-pins-after.json').write_text(json.dumps(pins,indent=2)+'\n')
 receipt={'scope':'SOURCE revised intact far shoes only; no complete legs/gait/runtime','pinsBeforeAfterExact':True,'inputPins':pins,'sides':rows,'files':files,'limitations':['Hidden far heels inferred from same-heading own shoe, not measured original anatomy','Original far forefoot intentionally replaced as distinct revised source','Source-flat RGBA ownership preserves calf/near/upper; not a moving alpha compositor','No gait, deformed ankle, source-floor transport, GPU or runtime approval']}
 (OUT/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'receiptSha256':sha(OUT/'receipt.json'),'sides':rows},indent=2))
if __name__=='__main__':main()
