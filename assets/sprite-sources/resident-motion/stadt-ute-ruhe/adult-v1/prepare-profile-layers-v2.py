"""Uniformly register Ute's complete FAR paint beside her original NEAR leg.

Technical isolation and registration only; intact raw8, face, LEFT book and
RIGHT empty hand remain unchanged. No family or production selection here.
"""
from pathlib import Path
import hashlib, json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
OUT=HERE/'profile-leg-repair-v2'
REVIEW=ROOT/'output/ute-height/profile-leg-repair-v2'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
CONTROL=json.loads((HERE/'profile-leg-controls-v2.json').read_text())
RAW=OUT/'raw-far-leg-parts-v1.png'
EXPECTED={RAW:'315e0d84faf444da6d71fbb52e9086e34b218e92e6093f34c6f2bdadcff854ff',
 HERE/'registered/right.png':'c9dd2b5aa2c4981295034e8eb42347621b8e525133f20f7b8179ed347fee8c95',
 HERE/'registered/left.png':'d975b13e8b76b534f54564ff0039c06820b3283d2ff6a5ae5d10fa3acf58f38e'}
YY,XX=np.mgrid[:512,:512]

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def bounds(im):
 y,x=np.where(np.asarray(im)[:,:,3]>=20)
 return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]

def run():
 assert all(sha(p)==s for p,s in EXPECTED.items())
 REVIEW.mkdir(parents=True,exist_ok=True)
 raw=np.asarray(Image.open(RAW).convert('RGBA'))
 clean=raw.copy();clean[raw[:,:,3]<20]=0
 assert np.array_equal(clean[raw[:,:,3]>=20],raw[raw[:,:,3]>=20])
 Image.fromarray(clean).save(OUT/'cleaned-far-leg-parts-v1.png')
 labels,n=label(clean[:,:,3]>=20)
 components=[]
 for i in range(1,n+1):
  y,x=np.where(labels==i)
  if len(x)>100:components.append((i,[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]))
 receipt={'status':'SOURCE_ONLY_REGISTRATION; planted composite review required',
  'inputs':{p.relative_to(ROOT).as_posix():s for p,s in EXPECTED.items()},
  'controlsSha256':sha(HERE/'profile-leg-controls-v2.json'),
  'uniformScaleBothPartsBothAxes':CONTROL['uniformScale'],
  'cleaning':{'rule':'Zero RGBA only original alpha<20 before premultiplied resampling',
   'preservedOriginalAlphaAtLeast20Exact':True,
   'clearedAlpha1To19':int(((raw[:,:,3]>0)&(raw[:,:,3]<20)).sum()),
   'clearedHiddenRgb':int(((raw[:,:,3]==0)&np.any(raw[:,:,:3]!=0,axis=2)).sum())},'profiles':{}}
 boards={theme:Image.new('RGB',(2048,1024),bg) for theme,bg in [('light','#eee8db'),('dark','#25272b')]}
 for row,(heading,c) in enumerate(CONTROL['profiles'].items()):
  matches=[i for i,b in components if b==c['component']];assert len(matches)==1
  isolated=clean.copy();isolated[labels!=matches[0]]=0
  scale=CONTROL['uniformScale'];origin=[c['targetAnkleX']-scale*c['rawAnkleX'],c['baseline']-scale*c['component'][3]]
  far=paint.unpack(paint.sample(paint.premul(Image.fromarray(isolated)),(XX-origin[0])/scale,(YY-origin[1])/scale))
  original=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA');source=np.asarray(original)
  foreground=YY<CONTROL['fixedForegroundAboveY']
  ys,xs=zip(*c['nearBoundaryYX']);boundary=np.interp(YY,ys,xs)
  side=XX>=boundary if c['nearSide']=='greater-x' else XX<=boundary
  selected=(YY>=CONTROL['sourceRootY'])&side&~foreground
  near=source.copy();near[~selected]=0;near=Image.fromarray(near)
  assert np.array_equal(np.asarray(near)[selected],source[selected])
  # The own hem is curved over365..369. A full-width hard cutoff at370
  # cleared genuine FAR root paint immediately under its higher outer hem,
  # producing a visible thin gap. Keep that real root behind the original
  # five-row garment edge with ordinary alpha-over; exact full foreground
  # restoration still owns every face/book/hand/upper-body pixel above365.
  overlap=source.copy()
  overlap[(YY<CONTROL['fixedForegroundAboveY'])|(YY>=CONTROL['upperOverlapUntilY'])]=0
  planted=np.asarray(Image.alpha_composite(Image.alpha_composite(far,near),Image.fromarray(overlap))).copy()
  planted[foreground]=source[foreground];planted=Image.fromarray(planted)
  assert np.array_equal(np.asarray(planted)[foreground],source[foreground])
  for name,im in [('far-leg',far),('near-leg',near),('planted',planted)]:im.save(OUT/f'{heading}-{name}.png')
  Image.fromarray(foreground.astype('uint8')*255).save(OUT/f'{heading}-foreground-mask.png')
  Image.fromarray(overlap).save(OUT/f'{heading}-hem-overlap.png')
  receipt['profiles'][heading]={'controls':c,'origin':origin,'farBounds':bounds(far),'nearBounds':bounds(near),'upperBookAndHandsRgbaExact':True,
   'nearRetainedPixelsExact':True,'layers':{name:sha(OUT/f'{heading}-{name}.png') for name in ['far-leg','near-leg','planted','foreground-mask']}}
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   for col,im in enumerate([original,far,near,planted]):
    flat=Image.alpha_composite(Image.new('RGBA',(512,512),bg),im).convert('RGB');boards[theme].paste(flat,(512*col,512*row))
    ImageDraw.Draw(boards[theme]).text((512*col+8,512*row+8),heading+' '+['original held','new FAR whole paint','original NEAR extraction','planted composite'][col],fill='#111' if theme=='light' else '#eee')
   Image.alpha_composite(Image.new('RGBA',(512,512),bg),planted).convert('RGB').crop((200,350,320,480)).resize((720,780),Image.Resampling.NEAREST).save(REVIEW/f'{heading}-planted-feet-{theme}.png')
 for theme,board in boards.items():board.save(REVIEW/f'registered-layers-{theme}.png')
 (OUT/'profile-layer-registration.json').write_text(json.dumps(receipt,indent=2)+'\n')
 assert all(sha(p)==s for p,s in EXPECTED.items())
 print(json.dumps({'status':receipt['status'],'profiles':{h:{k:v[k] for k in ['origin','farBounds','nearBounds']} for h,v in receipt['profiles'].items()},'cleanup':receipt['cleaning']}))
if __name__=='__main__':run()
