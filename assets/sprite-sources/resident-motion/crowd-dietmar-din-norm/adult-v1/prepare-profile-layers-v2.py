"""Dietmar-only source-part registration proposal. DO NOT run without CPU lease.

Raw anatomy approval is not registration/anatomy admission. Controls are own
source-grid proposals; inspect the actual root/prop/cuff diagnostics before
motion. Original eight views and near paint are immutable input authorities.
"""
from pathlib import Path
import hashlib,json,sys
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
PARTS=HERE/'profile-leg-repair-v2';OUT=ROOT/'output/dietmar-height/profile-leg-repair-v2/registration-v1'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
YY,XX=np.mgrid[:512,:512]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def bounds(im):
 y,x=np.where(np.asarray(im)[:,:,3]>=20)
 return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
def polygon(points):
 mask=Image.new('L',(512,512))
 if points:ImageDraw.Draw(mask).polygon(points,fill=255)
 return np.asarray(mask)>0
def original_masks(original,heading,c):
 a=np.asarray(original);own=c['profiles'][heading]
 far_case=polygon(own['farCasePolygon'])&(a[:,:,3]>0)
 near_case=polygon(own['nearCasePolygon'])&(a[:,:,3]>0)
 # Exact original coat/head/RIGHT ruler, plus actual original pelvis paint.
 # Do not punch a rectangular transparent hole through new thigh paint below
 # the coat. The real upper trouser overlap is reported from actual pixels.
 upper=(YY<c['upperExactThroughY'])|((YY<c['pelvisExactThroughY'])&(a[:,:,3]>0))
 return upper,far_case,near_case
def compose(original,far,near,upper,far_case,near_case):
 raw=np.asarray(original);case=raw.copy();case[~far_case]=0
 canvas=Image.alpha_composite(far,Image.fromarray(case))
 canvas=Image.alpha_composite(canvas,near)
 a=np.asarray(canvas).copy();protected=upper|near_case;a[protected]=raw[protected]
 return Image.fromarray(a)
def run():
 assert not OUT.exists(),'Preserve first actual registration attempt'
 OUT.mkdir(parents=True)
 controls_path=PARTS/'controls-proposed-v1.json';c=json.loads(controls_path.read_text())
 raw_path=PARTS/'raw-far-leg-parts-v1.png';assert sha(raw_path)==c['rawSha256']
 raw=np.asarray(Image.open(raw_path).convert('RGBA')).copy();clean=raw.copy();clean[raw[:,:,3]<20]=0
 assert np.array_equal(raw[raw[:,:,3]>=20],clean[raw[:,:,3]>=20])
 Image.fromarray(clean).save(PARTS/'cleaned-far-leg-parts-v1.png')
 labels,n=label(clean[:,:,3]>=20);components=[]
 for i in range(1,n+1):
  y,x=np.where(labels==i)
  if len(x)>=100:components.append((i,[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)],len(x)))
 components.sort(key=lambda item:item[1][0]);assert len(components)==2,'Exactly two actual far-leg parts required'
 scale=c['uniformScaleBothAxesBothParts'];assert 0<scale<1
 receipt={'status':'PROVISIONAL_REGISTERED_SOURCE_FOR_ROOT_VIEW; NOT_MOTION_ADMISSION',
  'rawSha256':sha(raw_path),'controlsSha256':sha(controls_path),'uniformScaleBothAxesBothParts':scale,
  'cleaning':{'rule':'RGBA zero only originalalpha<20 before premultiplied sampling','alphaAtLeast20SourceBytesExact':True,
   'clearedAlpha1to19':int(((raw[:,:,3]>0)&(raw[:,:,3]<20)).sum()),'clearedHiddenRgb':int(((raw[:,:,3]==0)&np.any(raw[:,:,:3]!=0,axis=2)).sum())},
  'rootGate':'Actual part top must overlap own retained pelvis; every exposed flat root edge/prop join needs visual review, never waived by a component count',
  'profiles':{}}
 boards={theme:Image.new('RGB',(4*512,2*512),bg) for theme,bg in [('light','#eee8db'),('dark','#25272b')]}
 for row,heading in enumerate(['right','left']):
  source_path=HERE/'registered'/f'{heading}.png';assert sha(source_path)==c['sourceAuthority'][heading]
  original=Image.open(source_path).convert('RGBA');source=np.asarray(original)
  control=c['profiles'][heading];index,bbox,pixels=components[control['partPanel']]
  isolated=clean.copy();isolated[labels!=index]=0
  origin=[control['targetAnkleX']-control['rawAnkleX']*scale,c['baselineY']-bbox[3]*scale]
  far=paint.unpack(paint.sample(paint.premul(Image.fromarray(isolated)),(XX-origin[0])/scale,(YY-origin[1])/scale))
  upper,far_case,near_case=original_masks(original,heading,c)
  selected=(YY>=c['nearRootY'])&~(far_case|near_case)
  near=source.copy();near[~selected]=0;near=Image.fromarray(near)
  assert np.array_equal(np.asarray(near)[selected],source[selected]),'Actual retained near paint must stay exact'
  planted=compose(original,far,near,upper,far_case,near_case)
  assert np.array_equal(np.asarray(planted)[upper|near_case],source[upper|near_case])
  far_box=bounds(far);root_band=(YY<far_box[1]+3)&(np.asarray(far)[:,:,3]>=20)
  top_visible=root_band&(np.asarray(near)[:,:,3]==0)&~upper&~near_case&~far_case
  overlap=c['hipRootY']-far_box[1]
  for name,im in [('near-leg',near),('far-leg',far),('planted',planted)]:im.save(PARTS/f'{heading}-{name}.png')
  for name,mask in [('upper-mask',upper),('far-case-mask',far_case),('near-case-mask',near_case)]:Image.fromarray(mask.astype('uint8')*255).save(PARTS/f'{heading}-{name}.png')
  receipt['profiles'][heading]={'originalSha256':sha(source_path),'rawComponentBounds':bbox,'rawComponentPixels':int(pixels),'origin':origin,
   'farRegisteredBounds':far_box,'nearRegisteredBounds':bounds(near),'sourceRootOverlapWorkingPixels':overlap,
   'unoccludedTop3SourceRowsPixels':int(top_visible.sum()),'rootTopBeforeHip':overlap>0,
   'propOrder':control['drawOrder'],'originalUpperAndNearCaseRgbaExact':True,'retainedNearLayerSourceRgbaExact':True,
   'notAdmittedUntilViewed':'Density, hip-root contour/notch, original case-only masks, cuff/ankle/whole shoe must be compared to actual source before16phase prototype'}
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   for col,im in enumerate([original,far,near,planted]):
    boards[theme].paste(Image.alpha_composite(Image.new('RGBA',(512,512),bg),im).convert('RGB'),(col*512,row*512))
    ImageDraw.Draw(boards[theme]).text((col*512+8,row*512+8),heading+' '+['original','new FAR full trouser/shoe','original NEAR retained','candidate planted'][col],fill='#111' if theme=='light' else '#eee')
   for name,box in [('root',(195,250,320,330)),('case',(205,270,310,390)),('cuff-feet',(195,390,325,480))]:
    cut=Image.alpha_composite(Image.new('RGBA',(512,512),bg),planted).convert('RGB').crop(box)
    cut.resize((cut.width*6,cut.height*6),Image.Resampling.NEAREST).save(OUT/f'{heading}-{name}-{theme}.png')
 for theme,board in boards.items():board.save(OUT/f'registered-layers-{theme}.png')
 (PARTS/'profile-layer-registration.json').write_text(json.dumps(receipt,indent=2)+'\n')
 print(json.dumps(receipt))
 assert all(v['rootTopBeforeHip'] for v in receipt['profiles'].values()),'New source root does not reach its actual own retained pelvis'
if __name__=='__main__':run()
