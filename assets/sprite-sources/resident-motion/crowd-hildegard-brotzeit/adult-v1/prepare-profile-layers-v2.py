"""Hildegard own whole FAR paint + exact original NEAR extraction.

Technical isolation/registration, retaining original8/face/braid/RIGHTbasket.
All outputs require actual composite, source-motion and native review.
"""
from pathlib import Path
import hashlib, json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label

HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
OUT=HERE/'profile-leg-repair-v2';REVIEW=ROOT/'output/hildegard-height/profile-leg-repair-v2'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
CONTROL=json.loads((HERE/'profile-leg-controls-v2.json').read_text())
RAW=OUT/'raw-far-leg-parts-v1.png'
EXPECTED={RAW:'bda9a1ffbf871ec7b8e6412b930a00a5cd8a75059a4446905a6075831183a7d3',
 HERE/'registered/right.png':'c24b2db2e546dc13842940a716393e5c4b6878a5ed51ea844490100756e547c0',
 HERE/'registered/left.png':'ae05c56358507380e401ed909e8227187cde19770cc8564707aacd0a055d67ef'}
YY,XX=np.mgrid[:512,:512]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def bounds(im):
 y,x=np.where(np.asarray(im)[:,:,3]>=20)
 return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
def run():
 assert all(sha(p)==s for p,s in EXPECTED.items())
 assert not (OUT/'profile-layer-registration.json').exists() or (REVIEW/'registration-01-held/ARCHIVE.json').exists(),'Preserve prior registration'
 REVIEW.mkdir(parents=True,exist_ok=True)
 raw=np.asarray(Image.open(RAW).convert('RGBA'));clean=raw.copy();clean[raw[:,:,3]<20]=0
 assert np.array_equal(clean[raw[:,:,3]>=20],raw[raw[:,:,3]>=20])
 Image.fromarray(clean).save(OUT/'cleaned-far-leg-parts-v1.png')
 labels,n=label(clean[:,:,3]>=20);components=[]
 for i in range(1,n+1):
  y,x=np.where(labels==i)
  if len(x)>100:components.append((i,[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]))
 receipt={'status':'SOURCE_ONLY_REGISTRATION; actual planted review required','inputs':{p.relative_to(ROOT).as_posix():s for p,s in EXPECTED.items()},'controlsSha256':sha(HERE/'profile-leg-controls-v2.json'),'uniformScaleBothPartsBothAxes':CONTROL['uniformScale'],'cleaning':{'rule':'Zero RGBA only originalalpha<20 before premultiplied sampling','preservedOriginalAlphaAtLeast20Exact':True},'profiles':{}}
 boards={t:Image.new('RGB',(2048,1024),bg) for t,bg in [('light','#eee8db'),('dark','#25272b')]}
 for row,(heading,c) in enumerate(CONTROL['profiles'].items()):
  matches=[i for i,b in components if b==c['component']];assert len(matches)==1
  isolated=clean.copy();isolated[labels!=matches[0]]=0
  scale=CONTROL['uniformScale'];origin=[c['targetAnkleX']-scale*c['rawAnkleX'],c['baseline']-scale*c['component'][3]]
  far=paint.unpack(paint.sample(paint.premul(Image.fromarray(isolated)),(XX-origin[0])/scale,(YY-origin[1])/scale))
  original=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA');source=np.asarray(original)
  foreground=YY<CONTROL['fixedForegroundAboveY'];ys,xs=zip(*c['nearBoundaryYX']);boundary=np.interp(YY,ys,xs)
  side=XX>=boundary if c['nearSide']=='greater-x' else XX<=boundary
  selected=(YY>=CONTROL['sourceRootY'])&side&~foreground
  near=source.copy();near[~selected]=0;near=Image.fromarray(near)
  assert np.array_equal(np.asarray(near)[selected],source[selected])
  # Preserve the measured original curved hem and lower RIGHTbasket edge.
  overlap=source.copy();overlap[(YY<CONTROL['fixedForegroundAboveY'])|(YY>=CONTROL['upperOverlapUntilY'])]=0
  planted=np.asarray(Image.alpha_composite(Image.alpha_composite(far,near),Image.fromarray(overlap))).copy()
  planted[foreground]=source[foreground];planted=Image.fromarray(planted)
  assert np.array_equal(np.asarray(planted)[foreground],source[foreground])
  for name,im in [('far-leg',far),('near-leg',near),('planted',planted)]:im.save(OUT/f'{heading}-{name}.png')
  Image.fromarray(foreground.astype('uint8')*255).save(OUT/f'{heading}-foreground-mask.png')
  Image.fromarray(overlap).save(OUT/f'{heading}-hem-overlap.png')
  receipt['profiles'][heading]={'controls':c,'origin':origin,'farBounds':bounds(far),'nearBounds':bounds(near),'upperFaceBraidRightBasketRgbaExact':True,'nearRetainedPixelsExact':True,'layers':{name:sha(OUT/f'{heading}-{name}.png') for name in ['far-leg','near-leg','planted','foreground-mask','hem-overlap']}}
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   for col,im in enumerate([original,far,near,planted]):
    flat=Image.alpha_composite(Image.new('RGBA',(512,512),bg),im).convert('RGB');boards[theme].paste(flat,(512*col,512*row));ImageDraw.Draw(boards[theme]).text((512*col+8,512*row+8),heading+' '+['original held','additional FAR whole paint','original NEAR extraction','planted candidate'][col],fill='#111' if theme=='light' else '#eee')
   flat=Image.alpha_composite(Image.new('RGBA',(512,512),bg),planted).convert('RGB')
   flat.crop((190,340,330,480)).resize((840,840),Image.Resampling.NEAREST).save(REVIEW/f'{heading}-planted-feet-{theme}.png')
 for theme,board in boards.items():board.save(REVIEW/f'registered-layers-{theme}.png')
 (OUT/'profile-layer-registration.json').write_text(json.dumps(receipt,indent=2)+'\n')
 assert all(sha(p)==s for p,s in EXPECTED.items())
 print(json.dumps({'status':receipt['status'],'profiles':{h:{k:v[k] for k in ['origin','farBounds','nearBounds']} for h,v in receipt['profiles'].items()}}))
if __name__=='__main__':run()
