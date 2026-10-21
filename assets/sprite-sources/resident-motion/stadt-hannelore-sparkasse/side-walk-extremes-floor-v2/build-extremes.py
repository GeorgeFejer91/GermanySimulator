"""Only four source extremes per side, from accepted own legs and existing warp_layer."""
from pathlib import Path
import sys,json,hashlib,importlib.util
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from scipy.interpolate import PchipInterpolator
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-walk-extremes-floor-v2'
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
 paint=load('hannelore_side_sampler',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py');street=load('hannelore_side_export',ROOT/'tools/build-street-character-sprites.py')
 sourceRecipe=json.loads((ROOT/'assets/sprite-sources/resident-motion/stadt-hannelore-sparkasse/connected-leg-source-v1/recipe.json').read_text())
 font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',13);files={};records={};yy,xx=np.mgrid[:512,:512]
 def save(im,name):
  p=OUT/name;p.parent.mkdir(exist_ok=True,parents=True);im.save(p);files[name]=sha(p)
 def bbox(m):
  y,x=np.where(m);return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)] if len(x) else None
 def flat(im,bg):return Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
 def over(layers):
  dst=np.zeros((512,512,4),float)
  for im in layers:
   src=paint.premul(im);dst=src+dst*(1-src[:,:,3:4])
  return paint.unpack(dst)
 for h,cfg in r['sides'].items():
  cs=r['renderSources']['components'][h];near=Image.open(ROOT/cs['near-complete']['file']).convert('RGBA');far=Image.open(ROOT/cs['far-complete']['file']).convert('RGBA');reference=Image.open(ROOT/cs['revised']['file']).convert('RGBA');upper=Image.open(ROOT/cs['upper-preserved']['file']).convert('RGBA')
  ua=np.array(upper);edge=np.array(cfg['garmentCutoffWorking']);cut=(xx>=edge[0,0])&(xx<=edge[-1,0])&(yy>=np.interp(xx,edge[:,0],edge[:,1]));removed=cut&(ua[:,:,3]>0);ua[cut]=0;ua[ua[:,:,3]==0,:3]=0;upper=Image.fromarray(ua)
  save(upper,h+'-moving-upper.png');save(Image.fromarray((removed*255).astype('uint8')),h+'-removed-static-stocking-guard-mask.png')
  layers=[near,far];centres=[];bounds=[]
  for k,layer in enumerate(layers):
   a=np.array(layer);b=cfg['measuredShoeBoundsAlpha20'][k];bounds.append(b);centres.append((b[0]+b[2])/2 if k==0 else cfg['farCentreX'])
  common=r['sourceSupportPivotX'];bases=[common-v for v in centres]
  sourcePoints=sourceRecipe['sides']['right']['actualNearLandmarks'].copy()
  if h=='left':sourcePoints={k:([511-v[0],v[1]] if isinstance(v,list) else v) for k,v in sourcePoints.items()}
  fs=r['freshFarSources'][h];sourceFarPoints={k:((np.array(v)*fs['scale']+fs['translation']).tolist() if isinstance(v,list) else v*fs['scale']+fs['translation'][1]) for k,v in sourcePoints.items()}
  expectedFar=paint.unpack(paint.sample(paint.premul(near),(xx-fs['translation'][0])/fs['scale'],(yy-fs['translation'][1])/fs['scale']));assert np.array_equal(np.array(expectedFar),np.array(far))
  marks=[sourcePoints,sourceFarPoints];poses={};poseRecords={};componentFrames={}
  for phase in [None,0,4,8,12]:
   ident='neutral' if phase is None else f'phase-{phase:02d}';theta=0 if phase is None else phase*2*np.pi/16;warped=[];capMasks=[];moves=[]
   for k,layer in enumerate(layers):
    la=np.array(layer);fb=bounds[k];sxCentre=int(round(centres[k]));heelX=(fb[0]+8 if cfg['travelX']==1 else fb[2]-9);toeX=(fb[2]-9 if cfg['travelX']==1 else fb[0]+8);sourceWitnesses={}
    for name,wx in [('centre',sxCentre),('heel',heelX),('forefoot',toeX)]:
     hits=np.where((la[:,wx,3]>=20)&(np.arange(512)>=cfg['rigidFromY'][k]))[0];assert len(hits);wy=int(hits.max());sourceWitnesses[name]={'point':[int(wx),wy],'rgba':la[wy,wx].tolist(),'pixelCentreUncertaintyWorking':.5}
    rootRaise=cfg['rootRaisePerLimb'][k]
    # Fixed strongest bottom-row painted support sample, selected once per source.
    bottom=int(np.where(la[:,:,3].max(axis=1)>=20)[0].max());xs=np.where(la[bottom,:,3]==la[bottom,:,3].max())[0];supportX=int(xs[np.argmin(np.abs(xs-centres[k]))]);sourceWitnesses['support']={'point':[supportX,bottom],'rgba':la[bottom,supportX].tolist(),'pixelCentreUncertaintyWorking':.5}
    role=1 if k==0 else -1;stride=0 if phase is None else cfg['travelX']*r['footAmplitudeWorking']*np.cos(theta)*role;lift=0 if phase is None else r['swingLiftWorking']*max(0,(-1 if k==0 else 1)*np.sin(theta));base=0 if phase is None else bases[k]
    root=cfg['rootY'][k];rigid=cfg['rigidFromY'][k];nodes=[0,root,root+7,rigid,511]
    dx=[base,base,base+stride*.35,base+stride,base+stride];endY=-lift;dy=[-rootRaise,-rootRaise,-rootRaise+(endY+rootRaise)*.35,endY,endY]
    fieldX=PchipInterpolator(nodes,dx);fieldY=PchipInterpolator(nodes,dy);jac=1+fieldY.derivative()(np.arange(512));assert jac.min()>.5
    # Rigid collar/shoe portion must be pure translation, with no tilt/scale.
    assert np.max(np.abs(fieldX.derivative()(np.arange(rigid,512))))<1e-10 and np.max(np.abs(fieldY.derivative()(np.arange(rigid,512))))<1e-10
    moved=paint.warp_layer(layer,nodes,dx,dy);warped.append(moved);save(moved,f'isolated/{h}-{ident}-'+('near' if k==0 else 'far')+'.png')
    cap=np.zeros_like(la)
    for cx in range(512):
     hits=np.where(la[:,cx,3]>=20)[0]
     if len(hits) and hits[0]<=np.ceil(root)+2:cap[hits[0],cx]=la[hits[0],cx]
    capIm=paint.warp_layer(Image.fromarray(cap),nodes,dx,dy);ca=np.array(capIm)[:,:,3];uncovered=(ca>=20)&(ua[:,:,3]<200);capMasks.append(ca)
    transported={}
    for name,p in marks[k].items():
     if isinstance(p,list):transported[name]=[float(p[0]+fieldX(p[1])),float(p[1]+fieldY(p[1]))]
     else:transported[name]=float(p+fieldY(p))
    a=np.array(moved);feet=bbox((a[:,:,3]>=20)&(yy>=rigid-lift));moves.append({'limb':'near' if k==0 else 'far','role':('neutral' if phase is None else ('swing' if lift>1e-6 else 'contact/stance')),'sourceShoeBoundsAlpha20':bounds[k],'sourceFootCentreX':centres[k],'sourceFootCentreY':(bounds[k][1]+bounds[k][3])/2,'targetFootCentreX':float(centres[k]+base+stride),'footDx':float(base+stride),'footDy':float(endY),'footLift':float(lift),'paintedSoleWitnesses':{name:{**w,'transportedPoint':[float(w['point'][0]+fieldX(w['point'][1])),float(w['point'][1]+fieldY(w['point'][1]))]} for name,w in sourceWitnesses.items()},'sourcePoints':marks[k],'transportedPoints':transported,'rootRaise':rootRaise,'nodesY':nodes,'dx':dx,'dy':dy,'minimumVerticalJacobian':float(jac.min()),'maximumVerticalJacobian':float(jac.max()),'wholeShoeRigidTranslation':True,'rootCapAlpha20Pixels':int(np.count_nonzero(ca>=20)),'rootCapNotCoveredByUpperAlpha200':int(uncovered.sum()),'uncoveredRootBounds':bbox(uncovered),'movedLegAlpha20Bounds':bbox(a[:,:,3]>=20),'movingFootRegionAlpha20Bounds':feet,'isolatedAlpha20BottomExclusive':int(np.where(a[:,:,3].max(axis=1)>=20)[0].max()+1)})
   frame=over([warped[1],warped[0],upper]);poses[ident]=frame;componentFrames[ident]=warped;save(frame,f'{h}-{ident}.png')
   for k,m in enumerate(moves):
    for name,w in m['paintedSoleWitnesses'].items():
     px,py=np.rint(w['transportedPoint']).astype(int);upperCover=int(ua[py,px,3]);nearCover=int(np.array(warped[0])[py,px,3]) if k==1 else 0;w['coveredByUpperAlpha200']=upperCover>=200;w['coveredByNearAlpha200']=nearCover>=200;w['qualification']='Fixed source pixel centre; no witness relocation when occluded; source-only nearest-sample visibility diagnostic'
   aa=np.array(frame);edgeAlpha=np.concatenate([aa[0,:,3],aa[-1,:,3],aa[:,0,3],aa[:,-1,3]]);assert edgeAlpha.max()==0
   labels,n=label(aa[:,:,3]>=128);sizes=sorted([int(np.count_nonzero(labels==v)) for v in range(1,n+1)],reverse=True)
   poseRecords[ident]={'phase':phase,'limbs':moves,'assembledAlpha20BottomExclusive':int(np.where(aa[:,:,3].max(axis=1)>=20)[0].max()+1),'footCentreDifferenceNearMinusFar':float(moves[0]['targetFootCentreX']-moves[1]['targetFootCentreX']),'connectedAlpha128ComponentSizes':sizes[:8],'edgeAlphaMax':int(edgeAlpha.max()),'hiddenRgbAlphaZero':int(np.count_nonzero(np.any(aa[:,:,:3]!=0,2)&(aa[:,:,3]==0))),'direct':{}}
   # Root diagnostic: actual upper and cap samples overlaid in green, not source.
   diag=upper.copy();color=np.zeros((512,512,4),dtype='uint8');color[np.maximum(*capMasks)>=20]=[0,210,60,180];diag=Image.alpha_composite(diag,Image.fromarray(color));save(flat(diag,'#eee8db').crop((175,378,335,425)).resize((640,188),Image.Resampling.NEAREST),f'roots/{h}-{ident}-cap-overlay.png')
   for w,ht in [(96,120),(64,80)]:
    q=w/128;spec={'working':{'figureHeight':400,'baseline':472},'cell':[w,ht],'pivot':[64*q,150*q],'figureHeight':137*q};im=street.export_cell(frame,spec);save(im,f'direct-{w}x{ht}/{h}-{ident}.png');a=np.array(im);ed=np.concatenate([a[0,:,3],a[-1,:,3],a[:,0,3],a[:,-1,3]]);assert ed.max()==0
    poseRecords[ident]['direct'][str(w)]={'edgeAlphaMax':int(ed.max()),'hiddenRgbAtAlphaZero':int(np.count_nonzero(np.any(a[:,:,:3]!=0,2)&(a[:,:,3]==0))),'alpha20Bounds':bbox(a[:,:,3]>=20),'paintHeight':137*q}
  save(reference,h+'-accepted-flat-reference.png')
  # Measurement mask selects actual own black shoe pixels from the unchanged
  # primary complete leg; it never supplies any old FAR paint to the new source.
  ownMask=np.array(Image.open(ROOT/r['measurementOwnShoeMask']).convert('L'))>0
  if h=='left':ownMask=ownMask[:,::-1]
  nearShoe=np.array(near).copy();nearShoe[~ownMask]=0;nearShoe=Image.fromarray(nearShoe);freshShoe=paint.unpack(paint.sample(paint.premul(nearShoe),(xx-fs['translation'][0])/fs['scale'],(yy-fs['translation'][1])/fs['scale']))
  save(nearShoe,h+'-near-shoe-measurement.png');save(freshShoe,h+'-fresh-far-shoe-measurement.png');shoeSize={'nearBounds':bbox(np.array(nearShoe)[:,:,3]>=20),'freshFarBounds':bbox(np.array(freshShoe)[:,:,3]>=20),'continuousWidthHeight':[91*.95,48*.95]}
  oldPose=Image.open(ROOT/f'output/ambient-city-animation/hannelore-sparkasse-side-walk-extremes-v1/{h}-phase-12.png').convert('RGBA');oldFar=Image.open(ROOT/r['acceptedNearSource']['components'][h]['far-complete']['file']).convert('RGBA')
  compare=[(oldPose,'V1 passing12'),(poses['phase-12'],'V2 passing12'),(near,'own NEAR source'),(oldFar,'old FAR source'),(far,'.95FAR source')];fboard=Image.new('RGB',(5*344,2*250),'#eee8db');fd=ImageDraw.Draw(fboard)
  for row,(bg,ink) in enumerate([('#eee8db','#111'),('#25272b','#eee')]):
   fd.rectangle((0,row*250,fboard.width,(row+1)*250),fill=bg)
   for col,(im,text) in enumerate(compare):
    pic=flat(im,bg).crop((170,375,340,478)).resize((340,206),Image.Resampling.NEAREST);pd=ImageDraw.Draw(pic);pd.line((0,(472-375)*2,340,(472-375)*2),fill='#d04040',width=1);fboard.paste(pic,(col*344,row*250+35));fd.text((col*344+3,row*250+3),h+' '+text,font=font,fill=ink)
  save(fboard,h+'-v1-v2-floor-and-source-comparison.png')
  # Native source contact board; four actual held extremes, no missing frames implied.
  items=[('accepted flat',reference),('actual neutral',poses['neutral'])]+[(f'phase{p}',poses[f'phase-{p:02d}']) for p in [0,4,8,12]]
  board=Image.new('RGB',(len(items)*344,2*260),'#eee8db');dr=ImageDraw.Draw(board)
  for row,(bg,ink) in enumerate([('#eee8db','#111'),('#25272b','#eee')]):
   dr.rectangle((0,row*260,board.width,(row+1)*260),fill=bg)
   for col,(text,im) in enumerate(items):board.paste(flat(im,bg).crop((170,370,340,478)).resize((340,216),Image.Resampling.NEAREST),(col*344,row*260+36));dr.text((col*344+3,row*260+3),h+' '+text,font=font,fill=ink)
  save(board,h+'-native-contacts-light-dark.png')
  isolated=Image.new('RGB',(8*260,2*195),'#eee8db');idr=ImageDraw.Draw(isolated)
  for row,(bg,ink) in enumerate([('#eee8db','#111'),('#25272b','#eee')]):
   idr.rectangle((0,row*195,isolated.width,(row+1)*195),fill=bg)
   for pi,phase in enumerate([0,4,8,12]):
    for k,limb in enumerate(['near','far']):
     im=componentFrames[f'phase-{phase:02d}'][k];col=pi*2+k;isolated.paste(flat(im,bg).crop((170,380,340,478)).resize((255,147),Image.Resampling.NEAREST),(col*260,row*195+35));idr.text((col*260+3,row*195+3),f'{h} {phase} {limb}',font=font,fill=ink)
  save(isolated,h+'-isolated-legs-light-dark.png')
  board=Image.new('RGB',(5*200,4*280),'#eee8db');dr=ImageDraw.Draw(board)
  for row,(w,ht,bg,ink) in enumerate([(96,120,'#eee8db','#111'),(96,120,'#25272b','#eee'),(64,80,'#eee8db','#111'),(64,80,'#25272b','#eee')]):
   dr.rectangle((0,row*280,board.width,(row+1)*280),fill=bg)
   for col,ident in enumerate(['neutral','phase-00','phase-04','phase-08','phase-12']):
    im=Image.open(OUT/f'direct-{w}x{ht}/{h}-{ident}.png').convert('RGBA');fac=2 if w==96 else 3;board.paste(flat(im,bg).resize((im.width*fac,im.height*fac),Image.Resampling.NEAREST),(col*200+4,row*280+32));dr.text((col*200+3,row*280+3),f'{w} {ident}',font=font,fill=ink)
  save(board,h+'-direct-contacts-light-dark.png')
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   preview=[flat(poses[f'phase-{p:02d}'],bg).crop((150,40,370,485)) for p in [0,4,8,12]];path=OUT/f'{h}-four-held-extremes-{theme}.gif';preview[0].save(path,save_all=True,append_images=preview[1:],duration=r['previewCycleMs']//4,loop=0);files[path.name]=sha(path)
  phases=poseRecords
  sign=cfg['travelX'];assert sign*phases['phase-00']['footCentreDifferenceNearMinusFar']>0 and sign*phases['phase-08']['footCentreDifferenceNearMinusFar']<0
  assert abs(phases['phase-04']['limbs'][0]['footDy'])<1e-8 and abs(phases['phase-04']['limbs'][1]['footDy']+r['swingLiftWorking'])<1e-8
  assert abs(phases['phase-12']['limbs'][1]['footDy'])<1e-8 and abs(phases['phase-12']['limbs'][0]['footDy']+r['swingLiftWorking'])<1e-8
  capcheck={p:[m['rootCapNotCoveredByUpperAlpha200'] for m in v['limbs']] for p,v in phases.items()}
  if any(n for pair in capcheck.values() for n in pair):
   (OUT/(h+'-cap-failure.json')).write_text(json.dumps(capcheck,indent=2)+'\n');print(h,capcheck)
  assert all(m['rootCapNotCoveredByUpperAlpha200']==0 for v in phases.values() for m in v['limbs'])
  for ident,v in phases.items():
   assert v['assembledAlpha20BottomExclusive']==472, (h,ident,'assembled floor')
   assert v['direct']['96']['alpha20Bounds'][3]==113 and v['direct']['64']['alpha20Bounds'][3]==75, (h,ident,'direct floor')
   for m in v['limbs']:
    expected=472-int(round(m['footLift']));assert m['isolatedAlpha20BottomExclusive']==expected, (h,ident,m['limb'],'isolated floor')
    assert m['paintedSoleWitnesses']['support']['point'][1]==471
    assert abs(m['paintedSoleWitnesses']['support']['transportedPoint'][1]-(471-m['footLift']))<1e-8
  records[h]={'checks':{'sharedFloorAllPoses':True,'fixedPaintedSupportCommonY':True},'constructionChecks':{'oppositeContactRoles':True,'bothPassingRoles':True,'allRootCapsHiddenUnderActualUpper':True,'rigidShoes':True,'foldGuardUnchanged':True,'directGutterAndHiddenRgb':True},'status':'SOURCE candidate awaiting independent visual review','sourceFootCentresX':centres,'sourcePairCentreX':float(np.mean(centres)),'shoeSourceMeasurement':shoeSize,'targetSupportPivotX':common,'rootBaseDx':bases,'removedStaticStockingGuardPixels':int(removed.sum()),'removedStaticStockingGuardBounds':bbox(removed),'phases':poseRecords}
 audit();(OUT/'input-pins-after.json').write_text(json.dumps(pins,indent=2)+'\n');receipt={'scope':r['scope'],'inputPins':pins,'pinsBeforeAfterExact':True,'sides':records,'files':files,'limits':r['limits']};(OUT/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'receiptSha256':sha(OUT/'receipt.json'),'rootUncovered':{h:{p:[m['rootCapNotCoveredByUpperAlpha200'] for m in v['limbs']] for p,v in side['phases'].items()} for h,side in records.items()}},indent=2))
if __name__=='__main__':main()
