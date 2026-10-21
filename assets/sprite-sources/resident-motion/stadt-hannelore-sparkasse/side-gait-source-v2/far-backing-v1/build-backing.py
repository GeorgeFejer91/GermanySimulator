"""Two source-only own-near to far-foot backing prototypes. No motion or hidden-heel claim."""
from pathlib import Path
import sys,json,hashlib,argparse,importlib.util
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[6];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-gait-source-v2/far-backing-v1'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
read=lambda p:json.loads(Path(p).read_text(encoding='utf8'))
def load(name,p):
 spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def main():
 OUT.mkdir(parents=True,exist_ok=True);recipe=read(HERE/'backing.json');parent=ROOT/recipe['acceptedNearFinal']['file'];assert sha(parent)==recipe['acceptedNearFinal']['sha256'];assert sha(ROOT/recipe['acceptedNearReceipt']['file'])==recipe['acceptedNearReceipt']['sha256']
 pins=read(parent.parent/'input-pins-before.json');pins.update(read(parent)['files']);pins[parent.relative_to(ROOT).as_posix()]=sha(parent)
 assert len(pins)==3302
 for p,h in pins.items():
  if sha(ROOT/p)!=h:raise ValueError('Frozen source changed: '+p)
 for p in [HERE/'backing.json',Path(__file__),ROOT/'tools/build-street-character-sprites.py',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py']:pins[p.relative_to(ROOT).as_posix()]=sha(p)
 (OUT/'input-pins-before.json').write_text(json.dumps(pins,indent=2)+'\n');sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'));paint=load('hannelore_far_sampling',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py');street=load('hannelore_far_export',ROOT/'tools/build-street-character-sprites.py')
 raw=Image.open(ROOT/recipe['source']).convert('RGBA');assert sha(ROOT/recipe['source'])==recipe['sourceSha256'];assert list(raw.size)==recipe['sourceDimensions'];font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14);rows={};files={}
 def save(im,name):
  p=OUT/name;p.parent.mkdir(exist_ok=True,parents=True);im.save(p);files[name]=sha(p)
 def comp(im,bg):return Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
 for heading,side in recipe['sides'].items():
  original=Image.open(ROOT/side['neutralFile']).convert('RGBA');near=Image.open(ROOT/side['originalNearRgba']['file']).convert('RGBA');nearMask=np.asarray(Image.open(ROOT/side['originalNearMask']['file']))>0
  assert sha(ROOT/side['neutralFile'])==side['neutralSha256'] and sha(ROOT/side['originalNearRgba']['file'])==side['originalNearRgba']['sha256'] and sha(ROOT/side['originalNearMask']['file'])==side['originalNearMask']['sha256']
  view=side['view'];bodyScale=view['scale'];origin=np.array([256,472])-np.array(view['source_pivot'])*bodyScale;rawRoi=Image.new('L',raw.size);ImageDraw.Draw(rawRoi).polygon([tuple(p) for p in side['visibleFarRoiRaw']],fill=255);yy,xx=np.mgrid[:512,:512];sx=np.rint((xx-origin[0])/bodyScale).astype(int);sy=np.rint((yy-origin[1])/bodyScale).astype(int);valid=(sx>=0)&(sx<raw.width)&(sy>=0)&(sy<raw.height);roi=np.zeros((512,512),dtype=bool);roi[valid]=np.asarray(rawRoi)[sy[valid],sx[valid]]>0;farMask=roi&~nearMask
  a=np.asarray(original);na=np.asarray(near);visibleFar=np.where(farMask[:,:,None],a,0).astype('uint8');visibleFar[visibleFar[:,:,3]==0,:3]=0;farVisible=Image.fromarray(visibleFar);rest=np.where((~(nearMask|farMask))[:,:,None],a,0).astype('uint8');rest[rest[:,:,3]==0,:3]=0;body=Image.fromarray(rest)
  shoeRaw=Image.new('L',raw.size);ImageDraw.Draw(shoeRaw).polygon([tuple(p) for p in side['donorShoePolygonRaw']],fill=255);shoeMask=np.zeros((512,512),dtype=bool);shoeMask[valid]=np.asarray(shoeRaw)[sy[valid],sx[valid]]>0;shoeMask &= nearMask;shoeArray=np.where(shoeMask[:,:,None],na,0).astype('uint8');shoeArray[shoeArray[:,:,3]==0,:3]=0;shoe=Image.fromarray(shoeArray);save(shoe,heading+'-own-near-shoe-only.png');save(Image.fromarray((shoeMask*255).astype('uint8')),heading+'-own-near-shoe-only-mask.png')
  src=side['donorLandmarksWorking'];target=side['farVisibleLandmarksWorking'];scale=(target['toe'][0]-target['cuffFront'][0])/(src['toe'][0]-src['cuffFront'][0]);assert scale>0;tx=target['toe'][0]-scale*src['toe'][0];ty=target['soleY']-scale*src['soleY'];donor=paint.unpack(paint.sample(paint.premul(shoe),(xx-tx)/scale,(yy-ty)/scale));da=np.asarray(donor)
  # Original generator interiors are alpha252–253. Preserve their source;
  # report raw source-over separately from exact original-owned flat replacement.
  occlusion=nearMask&(na[:,:,3]>0);added=occlusion&(da[:,:,3]>0);addedPaint=np.where(added[:,:,None],da,0).astype('uint8');candidate=visibleFar.copy();candidate[added]=da[added];far=Image.fromarray(candidate);sourceOver=Image.alpha_composite(Image.alpha_composite(body,far),near);overDelta=np.asarray(sourceOver).astype(int)-a.astype(int);flat=np.asarray(sourceOver).copy();flat[nearMask]=a[nearMask];joined=Image.fromarray(flat);assert np.array_equal(np.asarray(joined),a)
  assert np.array_equal(candidate[farMask],visibleFar[farMask]);assert not np.any(added&~occlusion);assert not np.any(added&(a[:,:,3]==0))
  unknown=(da[:,:,3]>0)&~farMask&~occlusion;outsideAlpha=unknown&(a[:,:,3]==0);staticOther=unknown&(a[:,:,3]>0)&~nearMask;softNear=unknown&nearMask
  ims=[(original,'original'),(shoe,'own-near-source'),(donor,'uniform-untrimmed'),(farVisible,'own-visible-far'),(far,'candidate-far'),(joined,'owned-flat-neutral')]
  for im,name in ims:save(im,heading+'-'+name+'.png')
  save(sourceOver,heading+'-raw-source-over-neutral.png');save(body,heading+'-static-remainder.png');save(Image.fromarray((farMask*255).astype('uint8')),heading+'-far-visible-mask.png');save(Image.fromarray((occlusion*255).astype('uint8')),heading+'-actual-near-occlusion.png');save(Image.fromarray((added*255).astype('uint8')),heading+'-added-paint-mask.png');save(Image.fromarray(addedPaint),heading+'-added-paint.png');save(Image.fromarray((unknown*255).astype('uint8')),heading+'-unsupported-untrimmed-mask.png')
  # Explicit original/raw ROI proof, no inferred hidden heel outline.
  box=side['rawCrop'];overlay=comp(raw.crop(box),'#eee8db').resize(((box[2]-box[0])*4,(box[3]-box[1])*4),Image.Resampling.NEAREST);dr=ImageDraw.Draw(overlay);dr.line([tuple((np.array(p)-box[:2])*4) for p in side['visibleFarRoiRaw']+[side['visibleFarRoiRaw'][0]]],fill='#00aadd',width=3);dr.text((4,4),heading+' far ROI; accepted near ownership subtracted',font=font,fill='#a00000');save(overlay,heading+'-raw-far-roi.png')
  # Show added regions in green and rejected/unsupported untrimmed paint in magenta.
  diagnostic=original.copy();colors=np.zeros((512,512,4),dtype='uint8');colors[added]=[10,220,70,150];colors[unknown]=[230,20,190,190];diagnostic=Image.alpha_composite(diagnostic,Image.fromarray(colors));save(comp(diagnostic,'#eee8db').crop((175,385,335,480)).resize((960,570),Image.Resampling.NEAREST),heading+'-added-green-unsupported-magenta.png')
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   diff=np.zeros_like(a);diff[:,:,:3]=np.minimum(255,np.abs(overDelta[:,:,:3])*20).astype('uint8');diff[:,:,3]=255;alphaDiff=np.zeros_like(a);alphaDiff[:,:,:3]=np.minimum(255,np.abs(overDelta[:,:,3:4])*20).astype('uint8');alphaDiff[:,:,3]=255;diag=Image.new('RGB',(3*490,335),bg);dd=ImageDraw.Draw(diag)
   for i,(im,name) in enumerate([(original,'original'),(sourceOver,'raw source-over'),(Image.fromarray(alphaDiff),'alpha difference x20')]):diag.paste(comp(im,bg).crop((175,385,335,480)).resize((480,285),Image.Resampling.NEAREST),(i*490,45));dd.text((i*490+3,3),heading+' '+name,font=font,fill='#888')
   save(diag,heading+'-source-over-alpha-'+theme+'.png')
   board=Image.new('RGB',(3*490,2*335),bg);dr=ImageDraw.Draw(board);ink='#111' if theme=='light' else '#eee'
   for i,(im,name) in enumerate(ims):
    col=i%3;row=i//3;board.paste(comp(im,bg).crop((175,385,335,480)).resize((480,285),Image.Resampling.NEAREST),(col*490,row*335+45));dr.text((col*490+3,row*335+3),heading+' '+name,font=font,fill=ink)
   save(board,heading+'-native-'+theme+'.png')
  direct={}
  for w,h in [(96,120),(64,80)]:
   ratio=w/128;spec={'working':{'figureHeight':400,'baseline':472},'cell':[w,h],'pivot':[64*ratio,150*ratio],'figureHeight':137*ratio};cells=[(street.export_cell(im,spec),name) for im,name in ims];assert np.array_equal(np.asarray(cells[0][0]),np.asarray(cells[-1][0]));metrics={}
   for im,name in cells:
    aa=np.asarray(im);edge=np.concatenate([aa[0,:,3],aa[-1,:,3],aa[:,0,3],aa[:,-1,3]]);metrics[name]={'edgeAlphaMax':int(edge.max()),'alphaZeroHiddenRgb':int(np.count_nonzero(np.any(aa[:,:,:3]!=0,2)&(aa[:,:,3]==0)))};assert metrics[name]['edgeAlphaMax']==0 and metrics[name]['alphaZeroHiddenRgb']==0;save(im,f'direct-{w}x{h}/{heading}-{name}.png')
   sourceOverDirect=street.export_cell(sourceOver,spec);od=np.asarray(sourceOverDirect).astype(int)-np.asarray(cells[0][0]).astype(int);save(sourceOverDirect,f'direct-{w}x{h}/{heading}-raw-source-over-neutral.png')
   direct[f'{w}x{h}']={'rawSourceOverChangedPixels':int(np.count_nonzero(np.any(od!=0,2))),'rawSourceOverMaxAbsRgbaDifference':np.max(np.abs(od),axis=(0,1)).tolist(),'neutralAfterOwnedFlatWorkingAssemblyExact':True,'paintHeight':137*ratio,'cells':metrics}
   fac=137*ratio/400;b=(int((175-256)*fac+64*ratio)-2,int((385-472)*fac+150*ratio)-2,int((335-256)*fac+64*ratio)+3,int((480-472)*fac+150*ratio)+3)
   for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
    board=Image.new('RGB',(3*300,2*230),bg);dr=ImageDraw.Draw(board);ink='#111' if theme=='light' else '#eee'
    for i,(im,name) in enumerate(cells):
     col=i%3;row=i//3;board.paste(comp(im,bg).crop(b).resize(((b[2]-b[0])*5,(b[3]-b[1])*5),Image.Resampling.NEAREST),(col*300,row*230+45));dr.text((col*300+3,row*230+3),heading+' '+str(w)+' '+name,font=font,fill=ink)
    save(board,f'{heading}-direct-{w}x{h}-{theme}.png')
  probes={}
  for k in ['toe','cuffFront']:
   p=target[k];px,py=np.rint(p).astype(int);probes[k]={'pointWorking':p,'farMaskValue':bool(farMask[py,px]),'nearMaskValue':bool(nearMask[py,px]),'originalAlpha':int(a[py,px,3])};assert farMask[py,px]
  mapped={k:(np.array(v)*scale+[tx,ty]).tolist() for k,v in src.items() if isinstance(v,list)};regions,n=label(candidate[:,:,3]>=20);sizes=sorted([int(np.count_nonzero(regions==i)) for i in range(1,n+1)],reverse=True)
  rows[heading]={'status':'HOLD: separated-foot material/sole join; source-only candidate for independent review','uniformScale':scale,'translationWorking':[tx,ty],'sourceLandmarksWorking':src,'targetVisibleLandmarksWorking':target,'mappedLandmarksWorking':mapped,'toeYResidual':mapped['toe'][1]-target['toe'][1],'frontOpeningYResidual':mapped['cuffFront'][1]-target['cuffFront'][1],'visibleFarPixelCount':int(np.count_nonzero((visibleFar[:,:,3]>0))),'addedPixelCount':int(np.count_nonzero(added)),'addedAlpha20Pixels':int(np.count_nonzero(added&(da[:,:,3]>=20))),'addedOnlyInsideActualNearFootOwnership':True,'rawSourceOverNeutralChangedPixels':int(np.count_nonzero(np.any(overDelta!=0,2))),'rawSourceOverNeutralMaxAbsRgbaDifference':np.max(np.abs(overDelta),axis=(0,1)).tolist(),'exactNeutralMethod':'Original-owned nearRGBA replaces, rather than alpha-blends, at neutral source pixel ownership; static preservation diagnostic only','unsupportedUntrimmedPixelCount':int(np.count_nonzero(unknown)),'unsupportedAlpha20Pixels':int(np.count_nonzero(unknown&(da[:,:,3]>=20))),'unsupportedOutsideOriginalAlpha20Pixels':int(np.count_nonzero(outsideAlpha&(da[:,:,3]>=20))),'unsupportedStaticOtherAlpha20Pixels':int(np.count_nonzero(staticOther&(da[:,:,3]>=20))),'unsupportedNearSoftAlpha20Pixels':int(np.count_nonzero(softNear&(da[:,:,3]>=20))),'fullCandidateAlpha20Components':sizes,'visibleFarRgbaExact':True,'ownedFlatNeutralFullRgbaExact':True,'rawSourceOverNeutralExact':bool(np.array_equal(np.asarray(sourceOver),a)),'originalNearRgbaUnchanged':True,'probes':probes,'direct':direct,'hiddenHeelMeasured':False,'farRearOpeningMeasured':False,'upperStockingComplete':False}
 for p,h in pins.items():
  if sha(ROOT/p)!=h:raise ValueError('Pinned source changed during build: '+p)
 (OUT/'input-pins-after.json').write_text(json.dumps(pins,indent=2)+'\n');receipt={'status':'HOLD own-near hidden far backing prototype: visible source correspondence seams; no gait','recipeSha256':sha(HERE/'backing.json'),'driverSha256':sha(Path(__file__)),'inputPins':len(pins),'previous3302PinsUnchanged':True,'pinsBeforeAfterExact':True,'sides':rows,'files':files};(OUT/'backing-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'receiptSha256':sha(OUT/'backing-receipt.json'),'pins':len(pins),'sides':rows},indent=2))
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--outdir',type=Path,default=OUT);args=parser.parse_args();OUT=args.outdir.resolve()
 if not OUT.is_relative_to(ROOT/'output'):raise ValueError('Output must stay ignored')
 main()
