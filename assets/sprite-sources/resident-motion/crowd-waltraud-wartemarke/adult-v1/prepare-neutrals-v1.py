"""One actor-owned source registration trial; no limbs/motion/runtime export."""
from pathlib import Path
import hashlib,importlib.util,json
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import distance_transform_edt,find_objects,label
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
OUT=ROOT/'output/waltraud-height/registration-v1'
ORDER=('down','front-right','right','rear-right','up','rear-left','left','front-left')
SHEETS={'cardinals':{'raw':'raw-cardinals-v1.png','sha256':'bc4c994b7a09234a08f56455beaef16ccf44392ccd04893fd7a5e71548e5fbf8','headings':['down','right','up','left'],'anchor':'down'},
 'quarters':{'raw':'raw-quarters-v1.png','sha256':'011525bd11067eedf0f28854f9c49148ad640bd860515e06de212fd2f5f310aa','headings':['front-right','rear-right','rear-left','front-left'],'anchor':'front-right'}}
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def support(image,bounds):
 alpha=np.asarray(image.getchannel('A'));left,top,right,bottom=bounds;start=max(top,bottom-90)
 labels,_=label(alpha[start:bottom,left:right]>=20);parts=[]
 for index,region in enumerate(find_objects(labels),1):
  if region is None:continue
  pixels=int((labels[region]==index).sum())
  if pixels<100:continue
  y,x=region;parts.append({'centerX':left+(x.start+x.stop)/2,'bounds':[left+x.start,start+y.start,left+x.stop,start+y.stop],'pixels':pixels})
 assert parts,'No actual own boot support'
 selected=sorted(parts,key=lambda p:p['pixels'],reverse=True)[:2]
 return [sum(p['centerX'] for p in selected)/len(selected),bottom],parts
def run():
 assert not OUT.exists() and not (HERE/'registered').exists() and not (HERE/'prepared-source-v1').exists(),'Preserve every trial'
 OUT.mkdir(parents=True);(HERE/'registered').mkdir();(HERE/'prepared-source-v1').mkdir()
 helper_path=ROOT/'tools/build-street-character-sprites.py';street=module('waltraud_existing_source_registration',helper_path)
 raw_pins={HERE/info['raw']:info['sha256'] for info in SHEETS.values()}
 report={'id':'crowd-waltraud-wartemarke','status':'TECHNICAL_REGISTRATION_TRIAL; root actual source review pending','working':{'cell':[512,512],'sourceDownHeight':400,'pivotX':256,'baselineY':472},
  'sourceBytesUntouched':True,'noOpaquePaintCleanup':True,'noLegExtractionOrMotion':True,'helper':{'path':helper_path.relative_to(ROOT).as_posix(),'sha256':sha(helper_path)},'sheets':{},'views':{},'boards':[]}
 registered={};common_scale=None;common_anchor_height=None
 for sheet_name,info in SHEETS.items():
  path=HERE/info['raw'];assert sha(path)==info['sha256']
  with Image.open(path) as opened:original=np.asarray(opened.convert('RGBA')).copy()
  cleaned=original.copy();cleaned[original[:,:,3]<20]=0
  assert np.array_equal(cleaned[original[:,:,3]>=20],original[original[:,:,3]>=20])
  cleaned_path=HERE/'prepared-source-v1'/info['raw'];Image.fromarray(cleaned).save(cleaned_path)
  alpha=cleaned[:,:,3];labels,_=label(alpha>=20);regions=find_objects(labels);sizes=np.bincount(labels.ravel())
  main_ids=sorted([i for i in range(1,len(sizes)) if sizes[i]>=1000],key=lambda i:regions[i-1][1].start)
  assert len(main_ids)==4,'Actual owning source must have four full components'
  main=np.where(np.isin(labels,main_ids),labels,0)
  _,nearest=distance_transform_edt(main==0,return_indices=True)
  ownership=main[tuple(nearest)];del nearest,main
  major_bounds=[]
  for index in main_ids:
   y,x=regions[index-1];major_bounds.append([x.start,y.start,x.stop,y.stop])
  anchor_height=major_bounds[0][3]-major_bounds[0][1]
  if common_scale is None:common_anchor_height=anchor_height;common_scale=400/anchor_height
  scale=common_scale
  reconstructed=np.zeros_like(cleaned);coverage=np.zeros(alpha.shape,bool);source_records=[]
  for heading,index,bounds in zip(info['headings'],main_ids,major_bounds):
   own=(ownership==index)&(alpha>=20)
   assert not np.any(coverage&own);coverage|=own
   pixels=cleaned.copy();pixels[~own]=0;reconstructed[own]=pixels[own]
   assert np.array_equal(pixels[own],original[own]),'Retain every assigned opaque/partial original paint byte'
   isolated=Image.fromarray(pixels);full_bounds=list(isolated.getchannel('A').getbbox())
   pivot,boots=support(isolated,bounds)
   view={'component_bounds':full_bounds,'source_pivot':pivot}
   image,origin=street.register_source(isolated,view,scale,472)
   rgba=np.asarray(image).copy();subthreshold=(rgba[:,:,3]<20);rgba[subthreshold]=0;image=Image.fromarray(rgba)
   target=HERE/'registered'/f'{heading}.png';image.save(target);registered[heading]=image
   y,x=np.where(rgba[:,:,3]>=20);working=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
   assert working[0]>0 and working[1]>0 and working[2]<512 and working[3]<512,'Unclipped transparent working gutter required'
   assert not np.any(rgba[rgba[:,:,3]==0,:3])
   groups,_=label(rgba[:,:,3]>=20);counts=np.bincount(groups.ravel())[1:]
   record={'sheet':sheet_name,'sourceRaw':path.relative_to(ROOT).as_posix(),'sourceRawSha256':sha(path),'sourceMainBoundsAlpha20':bounds,
    'sourceOwnedFullBoundsAlpha20':full_bounds,'sourceOwnedOpaquePaintPixels':int(own.sum()),'sourcePivot':pivot,'actualBootSupports':boots,
    'bootSupportQualification':'Two separate observed lower-boot supports where present; merged/occluded footprint is not invented as two feet',
    'uniformSheetScale':scale,'sourceOrigin':origin.tolist(),'registered':target.relative_to(ROOT).as_posix(),'registeredSha256':sha(target),'workingBoundsAlpha20':working,
    'workingMainHeight':working[3]-working[1],'workingSubstantiveComponentsAlpha20':[int(n) for n in counts if n>=15],
    'opaqueSourceBytesExact':True,'resampledSubthresholdClearedPixels':int(subthreshold.sum())}
   report['views'][heading]=record;source_records.append(record)
  assert np.array_equal(reconstructed,cleaned),'Every source alpha>=20 pixel retained exactly once across four actual figures'
  assert np.array_equal(coverage,alpha>=20)
  report['sheets'][sheet_name]={'raw':path.relative_to(ROOT).as_posix(),'rawSha256':sha(path),'prepared':cleaned_path.relative_to(ROOT).as_posix(),'preparedSha256':sha(cleaned_path),
   'anchorHeading':'down/cardinals (common to all eight)','anchorRawFigureHeight':common_anchor_height,'actualSheetFirstFigureHeight':anchor_height,'isotropicScaleAllFourViews':scale,'allOpaqueRawPaintPreservedExactlyOnce':True,
   'removedOnlyRawAlphaBelow20':True,'clearedAlpha1To19Pixels':int(((original[:,:,3]>0)&(original[:,:,3]<20)).sum()),
   'clearedHiddenRgbAtAlpha0Pixels':int(((original[:,:,3]==0)&np.any(original[:,:,:3]!=0,axis=2)).sum()),
   'minorAlpha20PixelsRetainedByNearestActualFigure':int((alpha>=20).sum()-sum(int(sizes[i]) for i in main_ids))}
 for theme,bg,ink in [('light','#eee8db','#222'),('dark','#25272b','#eee')]:
  board=Image.new('RGB',(2048,1024),bg);draw=ImageDraw.Draw(board)
  for slot,heading in enumerate(ORDER):
   x,y=(slot%4)*512,(slot//4)*512;im=registered[heading]
   board.paste(Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB'),(x,y))
   draw.line((x,y+472,x+511,y+472),fill='#9b8d78',width=1);draw.text((x+10,y+10),heading+' | source only',fill=ink)
  target=OUT/f'registered-eight-views-{theme}.png';board.save(target);report['boards'].append({'path':target.relative_to(ROOT).as_posix(),'sha256':sha(target),'cell':[512,512],'groundLine':472})
 for path,digest in raw_pins.items():assert sha(path)==digest
 report['sourceHashAfterExact']=True
 (HERE/'registration-v1.json').write_text(json.dumps(report,indent=2)+'\n');(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'views':len(registered),'scales':{name:info['isotropicScaleAllFourViews'] for name,info in report['sheets'].items()},'bounds':{name:info['workingBoundsAlpha20'] for name,info in report['views'].items()},'rawExact':True,'registrationAccepted':False}))
if __name__=='__main__':run()
