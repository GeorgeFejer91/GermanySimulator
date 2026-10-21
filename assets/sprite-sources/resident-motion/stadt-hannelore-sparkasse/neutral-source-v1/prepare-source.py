"""Hannelore-only neutral source preparation; no gait, mouth or runtime export."""
from pathlib import Path
import hashlib, importlib.util, json, math, sys
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from scipy.optimize import minimize_scalar

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/hannelore-sparkasse-neutral-source-v1'
FONT=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',13)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load_module(name,p):
 spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def pins():
 rows=json.loads((HERE/'input-pins.json').read_text())['rows']
 for r in rows:
  p=ROOT/r['file']
  if sha(p)!=r['sha256']:raise ValueError('Changed own source input: '+r['file'])
  if 'dimensions'in r and list(Image.open(p).size)!=r['dimensions']:raise ValueError('Changed source dimensions')
 return rows
def bbox(im):return im.getchannel('A').point(lambda x:255 if x>=20 else 0).getbbox()
def composite(im,bg):
 cv=Image.new('RGBA',im.size,bg);cv.alpha_composite(im);return cv.convert('RGB')
def sheet(ims,names,bg,tile=(512,546),scale=1):
 w,h=tile;cv=Image.new('RGB',(w*4,h*2),bg);d=ImageDraw.Draw(cv);ink='#eee8db'if bg=='#25272b'else'#111'
 for i,(n,im)in enumerate(zip(names,ims)):
  x=i%4*w;y=i//4*h;cv.paste(composite(im,bg),(x,y+28));d.text((x+3,y+4),n,font=FONT,fill=ink)
 return cv.resize((cv.width*scale,cv.height*scale),Image.Resampling.NEAREST)if scale!=1 else cv
def metric(im):
 a=np.asarray(im,dtype=float)/255;return np.concatenate([a[:,:,:3]*a[:,:,3:4],a[:,:,3:4]],2)
def export(street,im,paint_height,cell=(128,160)):
 ratio=cell[0]/128
 return street.export_cell(im,{'working':{'figureHeight':400,'baseline':472},'cell':list(cell),'pivot':[64*ratio,150*ratio],'figureHeight':paint_height*ratio})
def main():
 before=pins();OUT.mkdir(parents=True,exist_ok=True);(OUT/'pins-before.json').write_text(json.dumps(before,indent=2)+'\n');recipe=json.loads((HERE/'source-registration.json').read_text());street=load_module('hannelore_street_source',ROOT/'tools/build-street-character-sprites.py');paint=street.paint
 names=recipe['headingOrder'];images={};records={}
 for n in names:
  v=recipe['views'][n];raw=Image.open(ROOT/v['source']).convert('RGBA')
  if v['component_bounds']not in street.source_components(raw):raise ValueError('Extraction is not a whole substantial source component: '+n)
  im,origin=street.register_source(raw,v,v['scale'],472);im.save(HERE/f'{n}-registered.png');images[n]=im
  records[n]={'file':(HERE/f'{n}-registered.png').relative_to(ROOT).as_posix(),'sha256':sha(HERE/f'{n}-registered.png'),'dimensions':list(im.size),'alpha20BBox':bbox(im),'workingOrigin':origin.tolist(),'rawComponentBounds':v['component_bounds'],'source':v['source'],'sourceSha256':v['sourceSha256'],'scale':v['scale'],'sourcePivot':v['source_pivot']}
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:composite(im,bg).save(OUT/f'{n}-native-{theme}.png')
 for theme,bg in [('light','#eee8db'),('dark','#25272b')]:sheet([images[n]for n in names],names,bg).save(OUT/f'eight-neutrals-{theme}.png')
 standing=Image.open(ROOT/recipe['standing']['file']).convert('RGBA');target=metric(standing)
 def cost(h):return float(np.mean((metric(export(street,images['down'],h))-target)**2))
 result=minimize_scalar(cost,bounds=(126,144),method='bounded',options={'xatol':.0005});best=float(result.x);proposed=round(best*4)/4
 # One measured export paint scale applies to all eight views. No per-view fit.
 candidates=sorted(set([132,136,proposed]));calibration={'status':'sourcecomparisoncandidate;notbody/runtimeapproval','method':'premultipliedRGBA MSE against exact ownstanding,onepaintheight only;fixed64,150pivot','standing':recipe['standing'],'standingAlpha20BBox':bbox(standing),'bestPaintFigureHeight':best,'bestMSE':cost(best),'proposedPaintFigureHeight':proposed,'proposedMSE':cost(proposed),'nominal136MSE':cost(136),'candidateMetrics':[{'paintFigureHeight':h,'mse':cost(h),'alpha20BBox':bbox(export(street,images['down'],h))}for h in candidates]}
 (OUT/'standing-calibration.json').write_text(json.dumps(calibration,indent=2)+'\n')
 for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
  pics=[standing]+[export(street,images['down'],h)for h in candidates];labels=['exactshippedstanding']+[f'paint{h:g}'for h in candidates];cv=Image.new('RGB',(len(pics)*160,232),bg);d=ImageDraw.Draw(cv);ink='#eee8db'if theme=='dark'else'#111'
  for i,(im,label)in enumerate(zip(pics,labels)):cv.paste(composite(im,bg),(i*160+16,50));d.text((i*160+4,8),label,font=FONT,fill=ink);d.text((i*160+4,28),str(bbox(im)),font=FONT,fill=ink)
  cv.save(OUT/f'standing-comparison-{theme}.png')
 direct={}
 for w,h in [(128,160),(96,120),(64,80)]:
  folder=OUT/f'direct-{w}x{h}';folder.mkdir(exist_ok=True);direct[f'{w}x{h}']={}
  ims=[]
  for n in names:
   im=export(street,images[n],proposed,(w,h));im.save(folder/f'{n}.png');ims.append(im);bb=bbox(im);aa=np.asarray(im);edge=np.concatenate([aa[0,:,3],aa[-1,:,3],aa[:,0,3],aa[:,-1,3]]);direct[f'{w}x{h}'][n]={'file':(folder/f'{n}.png').relative_to(ROOT).as_posix(),'sha256':sha(folder/f'{n}.png'),'bbox':bb,'gutter':[bb[0],bb[1],w-bb[2],h-bb[3]],'edgeAlphaMax':int(edge.max()),'nonzeroRgbAtAlphaZeroPixels':int(np.count_nonzero(np.any(aa[:,:,:3]!=0,2)&(aa[:,:,3]==0))),'paintFigureHeight':proposed*w/128,'pivot':[64*w/128,150*w/128]}
   for theme,bg in [('light','#eee8db'),('dark','#25272b')]:composite(im,bg).save(folder/f'{n}-{theme}.png')
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:sheet(ims,names,bg,tile=(w+8,h+36)).save(folder/f'eight-neutrals-{theme}.png')
 # Measure component shoe scale from visible own heel/toe, never stock body scale.
 measured={}
 for direction in ['right','left']:
  original=recipe['originalVisibleNearBootMeasurements'][direction];v=recipe['views'][direction];raw_span=float(np.linalg.norm(np.array(original['toePx'])-original['heelPx']));target_span=raw_span*v['scale'];near=next(c for c in recipe['completeLegSourceComponents']if c['name']==direction+'-near');near_span=float(np.linalg.norm(np.array(near['toePx'])-near['heelPx']));component_scale=target_span/near_span
  original_cuff=(original['solePx'][1]-np.mean(np.array(original['visibleAnkleStockingEdgePx'])[:,1]))*v['scale'];near_cuff=(near['solePx'][1]-np.mean(np.array(near['visibleAnkleStockingEdgePx'])[:,1]))*component_scale
  measured[direction]={'originalHeelToeDistanceSourcePx':raw_span,'originalHeelToeDistanceWorkingPx':target_span,'completeNearComponentHeelToeDistanceSourcePx':near_span,'uniformBootDerivedComponentScale':component_scale,'bodyMasterScale':v['scale'],'originalMeanMarkedCuffToSoleWorkingPx':float(original_cuff),'componentMeanMarkedCuffToSoleWorkingPx':float(near_cuff),'cuffDepthRatioComponentToOriginal':float(near_cuff/original_cuff),'status':'measurement only; no attached leg layers or far hidden heel claim','components':[]}
  for c in [x for x in recipe['completeLegSourceComponents']if x['name'].startswith(direction)]:
   span=float(np.linalg.norm(np.array(c['toePx'])-c['heelPx']));measured[direction]['components'].append({'name':c['name'],'sourceHeelToeDistancePx':span,'scaledWorkingHeelToeDistancePx':span*component_scale,'anklePointsWorkingRelativeToSole':((np.array(c['visibleAnkleStockingEdgePx'])-c['solePx'])*component_scale).tolist()})
 (OUT/'boot-scale-measurements.json').write_text(json.dumps(measured,indent=2)+'\n')
 # Source crops only, with measured points. No rig or gait is instantiated.
 for direction in ['right','left']:
  original=recipe['originalVisibleNearBootMeasurements'][direction];near=next(c for c in recipe['completeLegSourceComponents']if c['name']==direction+'-near');panels=[]
  for label,source,points,scale in [('originalnear',original['source'],original,recipe['views'][direction]['scale']),('owncompletenear',near['source'],near,measured[direction]['uniformBootDerivedComponentScale'])]:
   im=Image.open(ROOT/source).convert('RGBA');pts=np.array([points['heelPx'],points['toePx'],points['solePx']]+points['visibleAnkleStockingEdgePx']);lo=np.floor(pts.min(0)-12).astype(int);hi=np.ceil(pts.max(0)+12).astype(int);crop=im.crop((*lo,*hi));a=np.asarray(crop);yy,xx=np.mgrid[:math.ceil(crop.height*scale),:math.ceil(crop.width*scale)];scaled=paint.unpack(paint.sample(paint.premul(crop),xx/scale,yy/scale));panels.append((label,scaled))
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   cv=Image.new('RGB',(520,230),bg);d=ImageDraw.Draw(cv);ink='#eee8db'if theme=='dark'else'#111';d.text((4,3),direction+' | same measured boot span; no body leg registration',font=FONT,fill=ink)
   for i,(label,im)in enumerate(panels):cv.paste(composite(im,bg).resize((im.width*2,im.height*2),Image.Resampling.NEAREST),(i*260+15,60));d.text((i*260+4,28),label,font=FONT,fill=ink)
   cv.save(OUT/f'{direction}-near-boot-scale-{theme}.png')
 after=pins();(OUT/'pins-after.json').write_text(json.dumps(after,indent=2)+'\n')
 proof={'status':'SOURCE-only neutral readiness packet; independent review pending','recipeSha256':sha(HERE/'source-registration.json'),'preparationHelperSha256':sha(HERE/'prepare-source.py'),'helper':{'file':'tools/build-street-character-sprites.py','sha256':sha(ROOT/'tools/build-street-character-sprites.py')},'registered':records,'standingCalibration':calibration,'directCells':direct,'bootMeasurements':measured,'inputPinsUnchanged':before==after,'notRun':['leg body registration','gait/contacts/bridges/gesture','mouth fit/transport','canonical runtime/audio','browser/GPU/performance/device']}
 (HERE/'registration-receipt.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps({'paintHeight':proposed,'best':best,'standingBBox':bbox(standing),'proposedBBox':bbox(export(street,images['down'],proposed)),'nominalMSE':cost(136),'proposedMSE':cost(proposed),'bootScales':{k:v['uniformBootDerivedComponentScale']for k,v in measured.items()},'inputsExact':before==after},indent=2))

if __name__=='__main__':main()
