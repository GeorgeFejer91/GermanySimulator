"""Portable own registered-original/genuine rawFar neutral construction; no runtime imports."""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw

def construct(base,heading):
 base=Path(base);c=json.loads((base/'profile-neutral-controls-v2.json').read_text());v=c['headings'][heading]
 source=np.asarray(Image.open(base/v['registered']).convert('RGBA')).copy();yy,xx=np.indices((512,512));fixed_domain=yy<=c['stationaryUpperContactBandThroughY']
 polygon=Image.new('1',(512,512));ImageDraw.Draw(polygon).polygon([tuple(p) for p in v['oldVisibleRearShoePolygonXY']],fill=1)
 old_domain=np.asarray(polygon,dtype=bool)&~fixed_domain;near_domain=~fixed_domain&~old_domain
 fixed=np.where(fixed_domain[...,None],source,0).astype(np.uint8);near=np.where(near_domain[...,None],source,0).astype(np.uint8);old=np.where(old_domain[...,None],source,0).astype(np.uint8)
 assert np.array_equal(fixed.astype(np.uint16)+near.astype(np.uint16)+old.astype(np.uint16),source)
 t=json.loads((base/c['wholepartTransform']).read_text());q=t['directions'][heading];raw=Image.open(base/t['raw']['path']).convert('RGBA');x,y,w,h=q['rawSemanticCellXYWH'];raw=raw.crop((x,y,x+w,y+h))
 fitted=np.asarray(raw.convert('RGBa').transform((512,512),Image.Transform.AFFINE,q['affineOutputToSource'],Image.Resampling.BICUBIC).convert('RGBA')).copy();far=fitted.copy();far[fixed_domain]=0
 neutral=np.asarray(Image.alpha_composite(Image.alpha_composite(Image.fromarray(far),Image.fromarray(near)),Image.fromarray(fixed))).copy()
 return {'original':source,'fixed':fixed,'near':near,'oldfar':old,'fitted':fitted,'far':far,'neutral':neutral,'priorOpposingToeOccluder':old_domain&(source[:,:,3]>0),'stationaryDomain':fixed_domain}
