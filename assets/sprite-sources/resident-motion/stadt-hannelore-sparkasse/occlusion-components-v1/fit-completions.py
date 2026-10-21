"""Bounded uniform Hannelore shoe registration diagnostic. Never builds a gait."""
from pathlib import Path
import sys,json,hashlib,importlib.util,argparse
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
FAMILY=HERE.parent
OUT=ROOT/'output/ambient-city-animation/hannelore-sparkasse-occlusion-components-v1'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
read=lambda p:json.loads(Path(p).read_text(encoding='utf8'))

def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 recipe=read(HERE/'fit.json');source=ROOT/recipe['source']
 if sha(source)!=recipe['sourceSha256']:raise ValueError('Completion source pin changed')
 # Protect all earlier Hannelore source packets and the already reviewed Renate
 # source snapshot. Global manifests can change under the integrator's ownership.
 protected={}
 for base in [FAMILY/'neutral-source-v1',FAMILY/'side-gait-source-v1',FAMILY/'mouth-source-v1',ROOT/'output/ambient-city-animation/hannelore-sparkasse-neutral-source-v1',ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-gait-source-v1',ROOT/'output/ambient-city-animation/hannelore-sparkasse-neutral-mouths-v1']:
  for path in base.rglob('*'):
   if path.is_file() and '__pycache__' not in path.parts:protected[path.relative_to(ROOT).as_posix()]=sha(path)
 previous=read(ROOT/'output/ambient-city-animation/renate-termin-full-source-review-v1/pins-extension-after.json')
 for rel,digest in previous.items():
  if '/stadt-renate-termin/' in rel or ('/renate-termin-' in rel and '/reviews/' not in rel):
   if sha(ROOT/rel)!=digest:raise ValueError('Protected Renate source changed: '+rel)
   protected[rel]=digest
 standing=ROOT/'assets/characters/street/stadt-hannelore-sparkasse-standing.webp';protected[standing.relative_to(ROOT).as_posix()]=sha(standing)
 inputs={**protected}
 for path in [source,HERE/'GENERATION.md',HERE/'fit.json',Path(__file__),ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py',ROOT/'tools/build-street-character-sprites.py']:
  inputs[path.relative_to(ROOT).as_posix()]=sha(path)
 (OUT/'input-pins-before.json').write_text(json.dumps(inputs,indent=2)+'\n',encoding='utf8')
 sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
 paint=load('hannelore_completion_sampling',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')
 raw=Image.open(source).convert('RGBA');neutral=read(FAMILY/'neutral-source-v1/source-registration.json');font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14);rows={};output_hashes={}
 def save(image,name):
  path=OUT/name;image.save(path);output_hashes[name]=sha(path)
 def source_target(entry):
  heading=entry['target']['heading']
  if entry['target']['kind']=='manuallyVisibleFarWorking':return entry['target']
  old=neutral['originalVisibleNearBootMeasurements'][heading];view=neutral['views'][heading];pivot=np.array(view['source_pivot']);scale=view['scale']
  def mapped(point):return ((np.array(point)-pivot)*scale+[256,472]).tolist()
  return {'heel':mapped(old['heelPx']),'toe':mapped(old['toePx']),'soleY':mapped(old['solePx'])[1],'cuffRear':mapped(old['visibleAnkleStockingEdgePx'][0]),'cuffFront':mapped(old['visibleAnkleStockingEdgePx'][1])}
 for name,entry in recipe['components'].items():
  src=entry['sourceLandmarks'];target=source_target(entry);heading=entry['target']['heading'];original=Image.open(FAMILY/f'neutral-source-v1/{heading}-registered.png').convert('RGBA')
  if name.endswith('near'):
   scale=float(np.linalg.norm(np.array(target['toe'])-target['heel'])/np.linalg.norm(np.array(src['toe'])-src['heel']));tx=float(np.mean([target[k][0]-scale*src[k][0] for k in ['heel','toe']]))
  else:
   scale=abs((target['toe'][0]-target['cuffFront'][0])/(src['toe'][0]-src['cuffFront'][0]));tx=target['toe'][0]-scale*src['toe'][0]
  ty=target['soleY']-scale*src['soleY'];translation=np.array([tx,ty]);bounds=entry['bounds'];crop=raw.crop((bounds[0]-3,bounds[1]-3,bounds[2]+3,bounds[3]+3));yy,xx=np.mgrid[:512,:512];sx=(xx-tx)/scale-bounds[0]+3;sy=(yy-ty)/scale-bounds[1]+3;registered=paint.unpack(paint.sample(paint.premul(crop),sx,sy));a=np.array(registered);assert not np.any(a[a[:,:,3]==0,:3]);save(registered,name+'-registered.png')
  projected={k:(np.array(v)*scale+translation).tolist() for k,v in src.items() if isinstance(v,list)};errors={k:{'deltaWorkingPx':(np.array(projected[k])-v).tolist(),'distanceWorkingPx':float(np.linalg.norm(np.array(projected[k])-v))} for k,v in target.items() if k in projected and isinstance(v,list)}
  cuffkeys=['cuffRear','cuffFront'] if name.endswith('near') else ['cuffFront'];own_depth=target['soleY']-float(np.mean([projected[k][1] for k in cuffkeys]));target_depth=target['soleY']-float(np.mean([target[k][1] for k in cuffkeys]));ratio=own_depth/target_depth
  # This is an intentionally unmasked diagnostic: visible exterior mismatch
  # must remain visible, rather than being clipped to force a false neutral fit.
  merged=registered.copy();merged.alpha_composite(original);m=np.array(merged);o=np.array(original);visible=o[:,:,3]>0;m[visible]=o[visible];merged=Image.fromarray(m);assert np.array_equal(np.array(merged)[visible],o[visible]);save(merged,name+'-original-visible-restored-diagnostic.png')
  rows[name]={'sourceBounds':bounds,'uniformScale':scale,'translationWorkingPx':translation.tolist(),'sourceLandmarks':src,'targetLandmarksWorking':target,'projectedLandmarksWorking':projected,'residuals':errors,'cuffToSoleDepthAtFixedBootLengthWorkingPx':own_depth,'originalCuffToSoleDepthWorkingPx':target_depth,'depthRatio':ratio,'originalVisibleRgbaRestoredExact':True,'farHiddenHeelMeasured':False if name.endswith('far') else None,'status':'HOLD source-registration judgment pending independent review'}
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   images=[original,registered,merged];box=(165,385,340,480);w,h=175*3,95*3;board=Image.new('RGB',((w+8)*3,h+45),bg);dr=ImageDraw.Draw(board)
   for i,(image,label) in enumerate(zip(images,['original','uniform component','original-visible restored; diagnostic'])):
    pic=Image.alpha_composite(Image.new('RGBA',image.size,bg),image).crop(box).resize((w,h),Image.Resampling.NEAREST);board.paste(pic,(i*(w+8),40));dr.text((i*(w+8)+3,4),name+' '+label,font=font,fill='#111' if theme=='light' else '#eee')
   save(board,name+'-comparison-'+theme+'.png')
 for rel,digest in inputs.items():
  if sha(ROOT/rel)!=digest:raise ValueError('Input changed during fit: '+rel)
 (OUT/'input-pins-after.json').write_text(json.dumps(inputs,indent=2)+'\n',encoding='utf8')
 receipt={'status':'HOLD completion fit; no gait pilot authored','sourceSha256':sha(source),'recipeSha256':sha(HERE/'fit.json'),'driverSha256':sha(Path(__file__)),'inputPinsSha256':sha(OUT/'input-pins-before.json'),'pinCount':len(inputs),'protectedPins':len(protected),'pinsBeforeAfterExact':True,'components':rows,'outputs':output_hashes,'limitations':['Only uniform scale and translation tested','No hidden original far heel inferred','Manual landmark uncertainty retained','No 4-extreme, full loop, atlas, mouth, runtime, GPU, world or stride acceptance','Original visible RGBA is restored only in labelled static diagnostics; these are not admitted new neutrals']}
 path=OUT/'completion-fit.json';path.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8');print(json.dumps({'receiptSha256':sha(path),'pins':len(inputs),'components':{k:{'scale':v['uniformScale'],'depthRatio':v['depthRatio'],'residuals':v['residuals']} for k,v in rows.items()}},indent=2))

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--outdir',type=Path,default=OUT);args=parser.parse_args();OUT=args.outdir.resolve()
 if not OUT.is_relative_to(ROOT/'output'):raise ValueError('Diagnostic output must remain under ignored output/')
 main()
