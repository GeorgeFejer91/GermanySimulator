"""Register approved missing FAR paint; retain actual NEAR paint as a separate layer.

Only technical extraction/one-density registration. Original eight-view paint
and the held first-family outputs are immutable inputs. No family bake here.
"""
from pathlib import Path
import hashlib, importlib.util, json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
OUT = HERE/'profile-leg-repair-v2'
REVIEW = ROOT/'output/baerbel-height/profile-leg-repair-v2'
sys.path.insert(0, str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
RAW = OUT/'raw-far-leg-parts-v1.png'
EXPECTED = {
 RAW: '0732bc0226c18fcad300f658cc09b84e6119c170b4377c6840eb63e5fa5568e3',
 HERE/'registered/right.png': '0bab128b8ee5438bf3e9892e2159727b686d592d49eab05f4262f012e0ba35e3',
 HERE/'registered/left.png': '08183abc739dc9d2c0e8b83005938dfd2851d9ffe94a9c13d04b1f34a8b93ced',
}
# Both pieces share precisely ONE scale from measured 206..210 raw-pixel
# ankle-to-sole depth versus the original ~33 working-pixel shoe/ankle depth.
# No independent width/height fit and no width chosen to satisfy span tests.
SCALE = .16
CONTROLS = {
 'right': {'component': [225,68,750,834], 'rawAnkle': [393,600],
           'targetAnkleX': 255, 'baseline': 472,
           'nearBoundaryYX': [[382,247],[412,246],[432,247],[438,257],[442,267],[448,280],[453,310]],
           'wholeShoeBelowY': 435},
 'left': {'component': [1016,67,1547,833], 'rawAnkle': [1378.5,600],
          'targetAnkleX': 255, 'baseline': 472,
          'nearBoundaryYX': [[382,270],[412,269],[430,269],[435,265],[440,251],[448,230],[453,210]],
          'wholeShoeBelowY': 435},
}
YY,XX=np.mgrid[:512,:512]
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def bounds(im):
 y,x=np.where(np.asarray(im)[:,:,3]>=20)
 return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
def foreground(heading):
 mask=YY<383
 if heading=='left':
  # Actual paper silhouette below the hem, not the original rear grey calf.
  # Above383 the entire original upper/hem/hand is already protected exactly.
  bag=Image.new('L',(512,512))
  ImageDraw.Draw(bag).polygon([(220,382),(301,382),(300,391),(296,398),(286,402),(248,403),(227,399),(220,392)],fill=255)
  mask|=np.asarray(bag)>0
 return mask
def compose(far,near,original,mask):
 canvas=Image.alpha_composite(far,near)
 result=np.asarray(canvas).copy(); source=np.asarray(original)
 result[mask]=source[mask]  # exact RGBA, no second alpha-over on source edges
 return Image.fromarray(result)
def run():
 REVIEW.mkdir(parents=True,exist_ok=True)
 assert all(sha(p)==s for p,s in EXPECTED.items())
 raw=np.asarray(Image.open(RAW).convert('RGBA')).copy()
 clean=raw.copy(); clean[raw[:,:,3]<20]=0
 assert np.array_equal(raw[raw[:,:,3]>=20],clean[raw[:,:,3]>=20])
 Image.fromarray(clean).save(OUT/'cleaned-far-leg-parts-v1.png')
 labels,n=label(clean[:,:,3]>=20)
 measured=[]
 for i in range(1,n+1):
  y,x=np.where(labels==i)
  if len(x)>100: measured.append((i,[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]))
 receipt={'status':'SOURCE_REGISTRATION_FOR_VISUAL_REVIEW; no movement/native/game acceptance',
  'inputs':{str(p.relative_to(ROOT)).replace('\\','/'):s for p,s in EXPECTED.items()},
  'uniformScaleBothAxesBothPieces':SCALE,'selectionBasis':'Original ankle-to-sole depth, unchanged source aspect; actual near shoe remains intact',
  'cleaning':{'rule':'RGBA zero only original alpha<20 before premultiplied registration',
   'preservedAlphaAtLeast20Exact':True,'clearedAlpha1To19':int(((raw[:,:,3]>0)&(raw[:,:,3]<20)).sum()),
   'clearedHiddenRgb':int(((raw[:,:,3]==0)&np.any(raw[:,:,:3]!=0,axis=2)).sum())},'profiles':{}}
 boards={theme:Image.new('RGB',(512*4,512*2),bg) for theme,bg in [('light','#eee8db'),('dark','#25272b')]}
 for row,(heading,c) in enumerate(CONTROLS.items()):
  matches=[i for i,b in measured if b==c['component']]; assert len(matches)==1
  isolated=clean.copy(); isolated[labels!=matches[0]]=0
  origin=[c['targetAnkleX']-SCALE*c['rawAnkle'][0],c['baseline']-SCALE*c['component'][3]]
  far=paint.unpack(paint.sample(paint.premul(Image.fromarray(isolated)),(XX-origin[0])/SCALE,(YY-origin[1])/SCALE))
  original=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
  source=np.asarray(original); mask=foreground(heading)
  ys,xs=zip(*c['nearBoundaryYX']); boundary=np.interp(YY,np.array(ys),np.array(xs))
  selected=(YY>=382)&((XX<=boundary) if heading=='right' else (XX>=boundary))&~mask
  near=source.copy();near[~selected]=0;near=Image.fromarray(near)
  # Every retained near pixel is exact source paint, including complete own
  # sole/heel/toe; zero displacement must not resample these pixels.
  assert np.array_equal(np.asarray(near)[selected],source[selected])
  far.save(OUT/f'{heading}-far-leg.png');near.save(OUT/f'{heading}-near-leg.png')
  Image.fromarray(mask.astype('uint8')*255).save(OUT/f'{heading}-foreground-mask.png')
  planted=compose(far,near,original,mask);planted.save(OUT/f'{heading}-planted.png')
  assert np.array_equal(np.asarray(planted)[mask],source[mask])
  foot_original=source[435:];foot_near=np.asarray(near)[435:]
  # The complete shoe is retained below453; above that the anatomical cut
  # follows the visible calf/inner-vs-outer-shoe occlusion and is reviewed.
  assert np.array_equal(np.asarray(near)[453:],source[453:])
  receipt['profiles'][heading]={'controls':c,'origin':origin,'farBounds':bounds(far),'nearBounds':bounds(near),
   'foregroundRgbaExact':True,'nearRetainedPixelsExact':True,'completeOriginalBelow453Exact':True,
   'farShoeAlpha20BoundsY435Plus':bounds(Image.fromarray(np.where((YY>=435)[:,:,None],np.asarray(far),0))),
   'layers':{name:sha(OUT/f'{heading}-{name}.png') for name in ['near-leg','far-leg','foreground-mask','planted']}}
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   for col,im in enumerate([original,far,near,planted]):
    flat=Image.alpha_composite(Image.new('RGBA',(512,512),bg),im).convert('RGB')
    boards[theme].paste(flat,(col*512,row*512))
    ImageDraw.Draw(boards[theme]).text((col*512+8,row*512+8),heading+' '+['original held','new FAR whole paint','original NEAR exact','planted composite'][col],fill='#111' if theme=='light' else '#eee')
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   crop=Image.alpha_composite(Image.new('RGBA',(512,512),bg),planted).convert('RGB').crop((195,370,330,480)).resize((810,660),Image.Resampling.NEAREST)
   crop.save(REVIEW/f'{heading}-planted-feet-{theme}.png')
 for theme,board in boards.items():board.save(REVIEW/f'registered-layers-{theme}.png')
 (OUT/'profile-layer-registration.json').write_text(json.dumps(receipt,indent=2)+'\n')
 assert all(sha(p)==s for p,s in EXPECTED.items())
 print(json.dumps({'status':receipt['status'],'profiles':receipt['profiles'],'cleanup':receipt['cleaning']},indent=2))
if __name__=='__main__':run()
