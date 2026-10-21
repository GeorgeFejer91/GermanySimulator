"""Bounded uniform Hannelore shoe registration diagnostic. Never builds a gait."""
from pathlib import Path
import sys,json,hashlib,importlib.util,argparse
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
FAMILY=HERE.parent
OUT=ROOT/'output/ambient-city-animation/hannelore-sparkasse-occlusion-components-v2'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
read=lambda p:json.loads(Path(p).read_text(encoding='utf8'))

def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 recipe=read(HERE/'fit.json');source=ROOT/recipe['source']
 if sha(source)!=recipe['sourceSha256']:raise ValueError('Completion source pin changed')
 # Preserve every exact prior 3147 pin and all V1 source/evidence files.
 protected=read(ROOT/'output/ambient-city-animation/hannelore-sparkasse-occlusion-components-v1/input-pins-after.json')
 if len(protected)!=3147:raise ValueError('Unexpected prior protected pin count')
 for rel,digest in protected.items():
  if sha(ROOT/rel)!=digest:raise ValueError('Prior 3147 pin changed: '+rel)
 for base in [FAMILY/'occlusion-components-v1',ROOT/'output/ambient-city-animation/hannelore-sparkasse-occlusion-components-v1']:
  for path in base.rglob('*'):
   if path.is_file() and '__pycache__' not in path.parts:protected[path.relative_to(ROOT).as_posix()]=sha(path)
 for rel,digest in protected.items():
  if sha(ROOT/rel)!=digest:raise ValueError('Prior source/evidence changed: '+rel)
 inputs={**protected}
 for path in [source,HERE/'GENERATION.md',HERE/'fit.json',Path(__file__),ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py',ROOT/'tools/build-street-character-sprites.py',FAMILY/'neutral-source-v1/source-registration.json']:
  inputs[path.relative_to(ROOT).as_posix()]=sha(path)
 (OUT/'input-pins-before.json').write_text(json.dumps(inputs,indent=2)+'\n',encoding='utf8')
 sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
 paint=load('hannelore_completion_sampling',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')
 street=load('hannelore_component_export',ROOT/'tools/build-street-character-sprites.py')
 raw=Image.open(source).convert('RGBA');neutral=read(FAMILY/'neutral-source-v1/source-registration.json');font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14);rows={};output_hashes={}
 def save(image,name):
  path=OUT/name;image.save(path);output_hashes[name]=sha(path)
 def source_target(entry):
  heading=entry['target']['heading']
  if entry['target']['kind']=='manuallyVisibleFarWorking':return entry['target']
  old=neutral['originalVisibleNearBootMeasurements'][heading];view=neutral['views'][heading];pivot=np.array(view['source_pivot']);scale=view['scale']
  def mapped(point):return ((np.array(point)-pivot)*scale+[256,472]).tolist()
  if entry['target']['kind']=='directOriginalRawNear':
   return {k:(mapped([0,v])[1] if k=='soleY' else mapped(v)) for k,v in entry['target'].items() if k not in ['kind','heading']}
  return {'heel':mapped(old['heelPx']),'toe':mapped(old['toePx']),'soleY':mapped(old['solePx'])[1],'cuffRear':mapped(old['visibleAnkleStockingEdgePx'][0]),'cuffFront':mapped(old['visibleAnkleStockingEdgePx'][1])}
 for name,entry in recipe['components'].items():
  src=entry['sourceLandmarks'];target=source_target(entry);heading=entry['target']['heading'];original=Image.open(FAMILY/f'neutral-source-v1/{heading}-registered.png').convert('RGBA')
  if name.endswith('near'):
   scale=float(np.linalg.norm(np.array(target['toe'])-target['heel'])/np.linalg.norm(np.array(src['toe'])-src['heel']));tx=float(np.mean([target[k][0]-scale*src[k][0] for k in ['heel','toe']]))
  else:
   scale=abs((target['toe'][0]-target['cuffFront'][0])/(src['toe'][0]-src['cuffFront'][0]));tx=target['toe'][0]-scale*src['toe'][0]
  ty=target['soleY']-scale*src['soleY'];translation=np.array([tx,ty]);bounds=entry['bounds'];crop=raw.crop((bounds[0]-3,bounds[1]-3,bounds[2]+3,bounds[3]+3));yy,xx=np.mgrid[:512,:512];sx=(xx-tx)/scale-bounds[0]+3;sy=(yy-ty)/scale-bounds[1]+3;registered=paint.unpack(paint.sample(paint.premul(crop),sx,sy));a=np.array(registered);assert not np.any(a[a[:,:,3]==0,:3]);save(registered,name+'-registered.png')
  # Inspectable source and original witnesses, with no fitting hidden edges.
  rawbox=(max(0,bounds[0]-5),max(0,bounds[1]-5),min(raw.width,bounds[2]+5),min(raw.height,bounds[3]+5));rawcrop=Image.alpha_composite(Image.new('RGBA',raw.size,'#eee8db'),raw).crop(rawbox).resize(((rawbox[2]-rawbox[0])*2,(rawbox[3]-rawbox[1])*2),Image.Resampling.NEAREST);rd=ImageDraw.Draw(rawcrop)
  for k,v in src.items():
   if not isinstance(v,list):continue
   x=(v[0]-rawbox[0])*2;y=(v[1]-rawbox[1])*2;rd.ellipse((x-3,y-3,x+3,y+3),fill='red');rd.text((x+4,y-15),k,font=font,fill='red')
  save(rawcrop,name+'-candidate-landmarks.png')
  box=(175,385,335,480);annotated=Image.alpha_composite(Image.new('RGBA',original.size,'#eee8db'),original).crop(box).resize((960,570),Image.Resampling.NEAREST);ad=ImageDraw.Draw(annotated)
  for k,v in target.items():
   if not isinstance(v,list):continue
   x=(v[0]-box[0])*6;y=(v[1]-box[1])*6;ad.ellipse((x-3,y-3,x+3,y+3),fill='red');ad.text((x+4,y-15),k,font=font,fill='red')
  save(annotated,name+'-original-current-landmarks.png')
  projected={k:(np.array(v)*scale+translation).tolist() for k,v in src.items() if isinstance(v,list)};errors={k:{'deltaWorkingPx':(np.array(projected[k])-v).tolist(),'distanceWorkingPx':float(np.linalg.norm(np.array(projected[k])-v))} for k,v in target.items() if k in projected and isinstance(v,list)}
  cuffkeys=['cuffRear','cuffFront'] if name.endswith('near') else ['cuffFront'];own_depth=target['soleY']-float(np.mean([projected[k][1] for k in cuffkeys]));target_depth=target['soleY']-float(np.mean([target[k][1] for k in cuffkeys]));ratio=own_depth/target_depth
  # This is an intentionally unmasked diagnostic: visible exterior mismatch
  # must remain visible, rather than being clipped to force a false neutral fit.
  merged=registered.copy();merged.alpha_composite(original);m=np.array(merged);o=np.array(original);visible=o[:,:,3]>0;m[visible]=o[visible];merged=Image.fromarray(m);assert np.array_equal(np.array(merged)[visible],o[visible]);save(merged,name+'-original-visible-restored-diagnostic.png')
  rows[name]={'sourceBounds':bounds,'uniformScale':scale,'translationWorkingPx':translation.tolist(),'sourceLandmarks':src,'targetLandmarksWorking':target,'projectedLandmarksWorking':projected,'residuals':errors,'cuffToSoleDepthAtFixedBootLengthWorkingPx':own_depth,'originalCuffToSoleDepthWorkingPx':target_depth,'depthRatio':ratio,'openingWidthXWorkingPx':abs(projected['cuffFront'][0]-projected['cuffRear'][0]) if 'cuffRear' in projected else None,'originalOpeningWidthXWorkingPx':abs(target['cuffFront'][0]-target['cuffRear'][0]) if 'cuffRear' in target else None,'tongueCrownToSoleWorkingPx':(target['soleY']-projected['tongueCrown'][1]) if 'tongueCrown' in projected else None,'originalTongueCrownToSoleWorkingPx':(target['soleY']-target['tongueCrown'][1]) if 'tongueCrown' in target else None,'originalVisibleRgbaRestoredExact':True,'farHiddenHeelMeasured':False if name.endswith('far') else None,'status':'HOLD source-registration judgment pending independent review'}
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   images=[original,registered,merged];box=(165,385,340,480);w,h=175*3,95*3;board=Image.new('RGB',((w+8)*3,h+45),bg);dr=ImageDraw.Draw(board)
   for i,(image,label) in enumerate(zip(images,['original','uniform component','original-visible restored; diagnostic'])):
    pic=Image.alpha_composite(Image.new('RGBA',image.size,bg),image).crop(box).resize((w,h),Image.Resampling.NEAREST);board.paste(pic,(i*(w+8),40));dr.text((i*(w+8)+3,4),name+' '+label,font=font,fill='#111' if theme=='light' else '#eee')
   save(board,name+'-comparison-'+theme+'.png')
 for theme in ['light','dark']:
  panels=[Image.open(OUT/(name+'-comparison-'+theme+'.png')).convert('RGB') for name in recipe['components']];board=Image.new('RGB',(panels[0].width,sum(p.height for p in panels)));y=0
  for panel in panels:board.paste(panel,(0,y));y+=panel.height
  save(board,'all-four-comparisons-'+theme+'.png')
 for w,h in [(96,120),(64,80)]:
  ratio=w/128;folder=OUT/f'direct-{w}x{h}';folder.mkdir(exist_ok=True)
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   board=Image.new('RGB',(3*250,4*(h+40)),bg);dr=ImageDraw.Draw(board);ink='#111' if theme=='light' else '#eee'
   for row,(name,entry) in enumerate(recipe['components'].items()):
    original=Image.open(FAMILY/f"neutral-source-v1/{entry['target']['heading']}-registered.png").convert('RGBA')
    component=Image.open(OUT/(name+'-registered.png')).convert('RGBA');merged=Image.open(OUT/(name+'-original-visible-restored-diagnostic.png')).convert('RGBA')
    for col,(im,label) in enumerate(zip([original,component,merged],['original','uniform','overlay diagnostic'])):
     direct=street.export_cell(im,{'working':{'figureHeight':400,'baseline':472},'cell':[w,h],'pivot':[64*ratio,150*ratio],'figureHeight':137*ratio})
     path=folder/(name+'-'+label.split()[0]+'.png');direct.save(path);output_hashes[path.relative_to(OUT).as_posix()]=sha(path)
     comp=Image.alpha_composite(Image.new('RGBA',direct.size,bg),direct).convert('RGB');board.paste(comp,(col*250+30,row*(h+40)+35));dr.text((col*250,row*(h+40)),name,font=font,fill=ink);dr.text((col*250,row*(h+40)+16),label,font=font,fill=ink)
   save(board,f'direct-{w}x{h}-{theme}.png')
   # Dedicated boot crops retain exact direct pixels; enlargement is nearest-only.
   cropboard=Image.new('RGB',(750,4*200),bg);cd=ImageDraw.Draw(cropboard)
   for row,name in enumerate(recipe['components']):
    for col,label in enumerate(['original','uniform','overlay']):
     direct=Image.open(folder/(name+'-'+label+'.png')).convert('RGBA');box=(int(165*137*ratio/400+(64*ratio-256*137*ratio/400))-2,int((385-472)*137*ratio/400+150*ratio)-2,int(340*137*ratio/400+(64*ratio-256*137*ratio/400))+3,int((480-472)*137*ratio/400+150*ratio)+3)
     crop=Image.alpha_composite(Image.new('RGBA',direct.size,bg),direct).crop(box);crop=crop.resize((crop.width*5,crop.height*5),Image.Resampling.NEAREST);cropboard.paste(crop,(col*250+5,row*200+45));cd.text((col*250+5,row*200+3),name,font=font,fill=ink);cd.text((col*250+5,row*200+21),label,font=font,fill=ink)
   save(cropboard,f'direct-{w}x{h}-boots-{theme}.png')
   save(board.resize((board.width*3,board.height*3),Image.Resampling.NEAREST),f'direct-{w}x{h}-{theme}-enlarged.png')
 directMetrics={}
 for path in OUT.glob('direct-*/*.png'):
  a=np.array(Image.open(path).convert('RGBA'));edge=np.concatenate([a[0,:,3],a[-1,:,3],a[:,0,3],a[:,-1,3]]);directMetrics[path.relative_to(OUT).as_posix()]={'edgeAlphaMax':int(edge.max()),'nonzeroRgbAtAlphaZero':int(np.count_nonzero(np.any(a[:,:,:3]!=0,2)&(a[:,:,3]==0)))}
 for rel,digest in inputs.items():
  if sha(ROOT/rel)!=digest:raise ValueError('Input changed during fit: '+rel)
 (OUT/'input-pins-after.json').write_text(json.dumps(inputs,indent=2)+'\n',encoding='utf8')
 receipt={'status':'HOLD completion fit; no gait pilot authored','sourceSha256':sha(source),'recipeSha256':sha(HERE/'fit.json'),'driverSha256':sha(Path(__file__)),'inputPinsSha256':sha(OUT/'input-pins-before.json'),'pinCount':len(inputs),'protectedPins':len(protected),'prior3147PinsUnchanged':True,'directPaintHeight':{'96x120':102.75,'64x80':68.5},'directNominalGeometryUnchanged':{'logicalFigureHeight':136,'worldHeight':1.6},'pinsBeforeAfterExact':True,'components':rows,'outputs':output_hashes,'directPixelChecks':directMetrics,'limitations':['Only uniform scale and translation tested','No hidden original far heel inferred','Manual landmark uncertainty retained','No 4-extreme, full loop, atlas, mouth, runtime, GPU, world or stride acceptance','Original visible RGBA is restored only in labelled static diagnostics; these are not admitted new neutrals']}
 path=OUT/'completion-fit.json';path.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8');print(json.dumps({'receiptSha256':sha(path),'pins':len(inputs),'components':{k:{'scale':v['uniformScale'],'depthRatio':v['depthRatio'],'residuals':v['residuals']} for k,v in rows.items()}},indent=2))

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--outdir',type=Path,default=OUT);args=parser.parse_args();OUT=args.outdir.resolve()
 if not OUT.is_relative_to(ROOT/'output'):raise ValueError('Diagnostic output must remain under ignored output/')
 main()
