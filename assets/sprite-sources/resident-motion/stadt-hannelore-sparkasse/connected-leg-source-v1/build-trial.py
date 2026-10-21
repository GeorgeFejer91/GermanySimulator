"""Connected own-limb source trial; no motion or runtime writes."""
from pathlib import Path
import sys,json,hashlib,importlib.util
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/hannelore-sparkasse-connected-leg-source-v1'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def main():
 OUT.mkdir(exist_ok=True,parents=True);r=json.loads((HERE/'recipe.json').read_text());pins=r['inputs'].copy()
 for p in [HERE/'recipe.json',Path(__file__)]:pins[p.relative_to(ROOT).as_posix()]=sha(p)
 def audit():
  for p,h in pins.items():assert sha(ROOT/p)==h,p
 audit();(OUT/'input-pins-before.json').write_text(json.dumps(pins,indent=2)+'\n')
 sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
 paint=load('connected_limb_sampler',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py');street=load('connected_limb_export',ROOT/'tools/build-street-character-sprites.py')
 font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',13);files={};rows={};direct={};yy,xx=np.mgrid[:512,:512]
 source=Image.open(ROOT/r['sourceRightNear']).convert('RGBA');sourceShoe=Image.open(ROOT/r['sides']['right']['originalNearShoe']).convert('RGBA')
 def save(im,name):
  p=OUT/name;p.parent.mkdir(exist_ok=True,parents=True);im.save(p);files[name]=sha(p)
 def bbox(m):
  y,x=np.where(m);return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)] if len(x) else None
 def flat(im,bg):return Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
 def owner(base,layer):
  a=np.array(base).copy();b=np.array(layer);m=b[:,:,3]>0;a[m]=b[m];return Image.fromarray(a)
 def delta(a,b):
  d=np.abs(a.astype(int)-b.astype(int));m=np.any(d!=0,2);return {'changedPixels':int(m.sum()),'bounds':bbox(m),'maxAbsRgba':d.max(axis=(0,1)).tolist()}
 for h,s in r['sides'].items():
  original=Image.open(ROOT/s['original']).convert('RGBA');a=np.array(original)
  near=source if h=='right' else source.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
  shoe=sourceShoe if h=='right' else sourceShoe.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
  scale=s['farScale'];tx,ty=s['farTranslation'];far=paint.unpack(paint.sample(paint.premul(near),(xx-tx)/scale,(yy-ty)/scale));farshoe=paint.unpack(paint.sample(paint.premul(shoe),(xx-tx)/scale,(yy-ty)/scale))
  lower=(np.array(Image.open(ROOT/s['originalNearMask']).convert('L'))>0) | (np.array(Image.open(ROOT/s['originalFarVisibleMask']).convert('L'))>0)
  remnants=np.zeros((512,512),bool)
  for x0,y0,x1,y1 in s['oldCalfRootRemnantRectsWorking']:remnants[y0:y1,x0:x1]=True
  remnants &= ~lower & (a[:,:,3]>0);lower |= remnants
  save(Image.fromarray((remnants*255).astype('uint8')),h+'-old-calf-root-remnant-mask.png')
  retained=a.copy();retained[lower]=0;retained[retained[:,:,3]==0,:3]=0;upper=Image.fromarray(retained)
  joined=owner(owner(far,near),upper);b=np.array(joined);upperVisible=retained[:,:,3]>0
  assert np.array_equal(b[upperVisible],retained[upperVisible])
  assert np.array_equal(np.array(near),np.array(source) if h=='right' else np.array(source)[:,::-1])
  pairs=[(original,'original neutral'),(joined,'revised neutral'),(near,'complete own near'),(far,'complete own far'),(upper,'original hem / purse')]
  for im,name in [(original,'original'),(joined,'revised'),(near,'near-complete'),(far,'far-complete'),(shoe,'near-shoe'),(farshoe,'far-shoe'),(upper,'upper-preserved')]:save(im,h+'-'+name+'.png')
  save(Image.fromarray((lower*255).astype('uint8')),h+'-remove-original-lower-mask.png')
  # Actual source-over is retained as a separate alpha diagnostic, not confused
  # with source-flat pixel-owner preservation used for this static source trial.
  over=Image.alpha_composite(Image.alpha_composite(far,near),upper);save(over,h+'-raw-source-over.png')
  board=Image.new('RGB',(5*344,2*260),'#eee8db');dr=ImageDraw.Draw(board)
  for row,(bg,ink) in enumerate([('#eee8db','#111'),('#25272b','#eee')]):
   dr.rectangle((0,row*260,board.width,(row+1)*260),fill=bg)
   for col,(im,label) in enumerate(pairs):
    board.paste(flat(im,bg).crop((170,370,340,478)).resize((340,216),Image.Resampling.NEAREST),(col*344,row*260+36));dr.text((col*344+3,row*260+3),h+' '+label,font=font,fill=ink)
  save(board,h+'-comparison-light-dark.png')
  nearA=np.array(near);farA=np.array(far);shoeA=np.array(shoe);farShoeA=np.array(farshoe)
  marks=s['actualNearLandmarks'];src=r['sides']['right']['actualNearLandmarks'];actual={k:([511-v[0],v[1]] if h=='left' else v) for k,v in src.items() if isinstance(v,list)};actual['soleY']=src['soleY'];farMarks={k:(np.array(v)*scale+[tx,ty]).tolist() for k,v in actual.items() if isinstance(v,list)};farMarks['soleY']=actual['soleY']*scale+ty
  rawover=np.array(over);oldalpha=a[:,:,3]>0;newalpha=b[:,:,3]>0
  oldshoe=np.array(Image.open(ROOT/s['originalNearShoe']).convert('RGBA'));rootBand=yy<(405 if h=='right' else 420)
  row={'status':r['authorSourceAssessment']['status'],'removedOldRootRemnantPixels':int(remnants.sum()),'removedOldRootRemnantBounds':bbox(remnants),'nearIsExactRightOriginalOrLimbOnlyMirror':True,'upperHemPurseOwnedRgbaExact':True,'neutralDifference':delta(a,b),'originalAlphaBounds20':bbox(a[:,:,3]>=20),'revisedAlphaBounds20':bbox(b[:,:,3]>=20),'nearLegAlpha20Bounds':bbox(nearA[:,:,3]>=20),'farLegAlpha20Bounds':bbox(farA[:,:,3]>=20),'originalNearShoeAlpha20Bounds':bbox(oldshoe[:,:,3]>=20),'nearShoeAlpha20Bounds':bbox(shoeA[:,:,3]>=20),'nearRootUpperOverlapAlpha20':int(np.count_nonzero(rootBand & (nearA[:,:,3]>=20) & (retained[:,:,3]>=20))),'farRootUpperOverlapAlpha20':int(np.count_nonzero(rootBand & (farA[:,:,3]>=20) & (retained[:,:,3]>=20))),'farShoeAlpha20Bounds':bbox(farShoeA[:,:,3]>=20),'nearLandmarks':actual,'nearResidualVsOwnOriginal':{k:(np.array(actual[k])-np.array(marks[k])).tolist() for k in ['toe','cuffFront']},'farLandmarks':farMarks,'farResidualVsVisibleOriginal':{k:(np.array(farMarks[k])-np.array(s['targetVisibleFarLandmarks'][k])).tolist() for k in ['toe','cuffFront']},'newExteriorPixels':int(np.count_nonzero(newalpha & ~oldalpha)),'removedExteriorPixels':int(np.count_nonzero(oldalpha & ~newalpha)),'rawSourceOverDifferenceFromOwnedFlat':delta(b,rawover),'direct':{},'hiddenOriginalHeelMeasured':False}
  for w,ht in [(96,120),(64,80)]:
   q=w/128;spec={'working':{'figureHeight':400,'baseline':472},'cell':[w,ht],'pivot':[64*q,150*q],'figureHeight':137*q}
   cells={name:street.export_cell(im,spec) for im,name in [(original,'original'),(joined,'revised'),(near,'near-complete'),(far,'far-complete')]}
   for name,im in cells.items():save(im,f'direct-{w}x{ht}/{h}-{name}.png')
   aa=np.array(cells['revised']);edge=np.concatenate([aa[0,:,3],aa[-1,:,3],aa[:,0,3],aa[:,-1,3]]);hidden=int(np.count_nonzero(np.any(aa[:,:,:3]!=0,2)&(aa[:,:,3]==0)));assert edge.max()==0 and hidden==0
   row['direct'][str(w)]={**delta(np.array(cells['original']),aa),'paintHeight':137*q,'edgeAlphaMax':int(edge.max()),'hiddenRgbAtAlphaZero':hidden};direct[(h,w)]=cells
  rows[h]=row
 board=Image.new('RGB',(4*400,2*440),'#eee8db');dr=ImageDraw.Draw(board)
 for row,(bg,ink) in enumerate([('#eee8db','#111'),('#25272b','#eee')]):
  dr.rectangle((0,row*440,board.width,(row+1)*440),fill=bg)
  for col,(h,w) in enumerate([('right',96),('left',96),('right',64),('left',64)]):
   dr.text((col*400+3,row*440+4),f'{h} {w} original / revised',font=font,fill=ink)
   for k,name in enumerate(['original','revised']):
    im=direct[(h,w)][name];board.paste(flat(im,bg),(col*400+5+k*195,row*440+32));board.paste(flat(im,bg).resize((im.width*2,im.height*2),Image.Resampling.NEAREST),(col*400+5+k*195,row*440+178))
 save(board,'fullbody-direct-light-dark.png')
 audit();(OUT/'input-pins-after.json').write_text(json.dumps(pins,indent=2)+'\n');receipt={'scope':'SOURCE connected own legs only; no gait','pinsBeforeAfterExact':True,'inputPins':pins,'sides':rows,'files':files};(OUT/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'receiptSha256':sha(OUT/'receipt.json'),'sides':rows},indent=2))
if __name__=='__main__':main()
