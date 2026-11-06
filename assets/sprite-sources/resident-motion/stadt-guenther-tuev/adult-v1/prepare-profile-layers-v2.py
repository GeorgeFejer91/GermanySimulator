"""G-only separate profile layers: original intact NEAR and newly painted complete FAR.
Technical extraction/one-density registration, no family/runtime changes.
"""
from pathlib import Path
import json,hashlib,sys
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=HERE/'profile-leg-repair-v2';REVIEW=ROOT/'output/guenther-shoe-repair/registered-v2b'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
EXPECTED={'assets/sprite-sources/resident-motion/stadt-guenther-tuev/adult-v1/profile-leg-repair-v2/raw-far-leg-parts-v1.png': '293c6e20e1f7e8ac38a6e7b71d0887ed9ba7666ff657fc5c9ad9744746149564', 'assets/sprite-sources/resident-motion/stadt-guenther-tuev/adult-v1/registered/right.png': 'e4049162220631a7a553bec1a34e1e1ff9dadc6501ed5fce5db3f4fcef6a4372', 'assets/sprite-sources/resident-motion/stadt-guenther-tuev/adult-v1/registered/left.png': '3ec2608f3a3397b1e19c0f9f347697f6a197119ec4bd521da6d1068bbe65d89b'}
# Own boot tongue/ankle-to-floor depth ~155rawpx→42workingpx; both pieces,
# both axes share .27. No width fitted to shoe-span checks.
SCALE=.27
CONTROLS={
 'right':{'component':[349,100,677,815],'rawAnkleX':450,'targetAnkleX':238,'baseline':472,
  'nearBoundaryYX':[[314,260],[340,257],[375,252],[405,252],[414,254],[425,257],[432,264],[439,275],[447,284],[452,288],[456,290],[458,330]],'originalWholePaintBelowY':458,'rootNodesY':[0,280,314,350,380,400,407,511],'rootDx':[20,20,20,16,10,3,0,0]},
 'left':{'component':[1098,101,1429,815],'rawAnkleX':1327,'targetAnkleX':282,'baseline':472,
  'nearBoundaryYX':[[314,262],[350,265],[380,269],[405,261],[411,258],[415,256],[420,252],[427,249],[434,248],[440,240],[446,230],[450,220],[454,210],[456,190]],'originalWholePaintBelowY':456,'rootNodesY':[0,280,314,350,380,400,407,511],'rootDx':[-26,-26,-26,-25,-15,-5,0,0]}
}
YY,XX=np.mgrid[:512,:512]
# Source-fitted foreground protects the real hand/gauge/hose, not a broad
# trousers rectangle which would leave a stationary leg stripe.
PROP_POLYGONS={
 'right':[
  [(235,311),(261,311),(263,318),(259,326),(246,327),(235,320)],
  [(268,309),(279,309),(282,316),(276,322),(268,318)],
  [(263,319),(269,319),(270,333),(269,344),(265,356),(261,364),(258,369),(258,374),(253,379),(247,379),(246,374),(251,367),(255,359),(260,350),(263,340)]],
 'left':[[(244,311),(265,311),(269,319),(265,326),(252,327),(244,321)]]
}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def foreground(heading):
 mask=Image.new('L',(512,512));d=ImageDraw.Draw(mask);d.rectangle((0,0,511,314),fill=255)
 for points in PROP_POLYGONS[heading]:d.polygon(points,fill=255)
 return np.asarray(mask)>0
def bounds(im):
 y,x=np.where(np.asarray(im)[:,:,3]>=20);return[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
def compose(far,near,original,mask):
 a=np.asarray(Image.alpha_composite(far,near)).copy();a[mask]=np.asarray(original)[mask];return Image.fromarray(a)
def run():
 REVIEW.mkdir(parents=True,exist_ok=True);assert all(sha(ROOT/k)==v for k,v in EXPECTED.items())
 raw=np.asarray(Image.open(OUT/'raw-far-leg-parts-v1.png').convert('RGBA'));clean=raw.copy();clean[raw[:,:,3]<20]=0
 assert np.array_equal(raw[raw[:,:,3]>=20],clean[raw[:,:,3]>=20]);Image.fromarray(clean).save(OUT/'cleaned-far-leg-parts-v1.png')
 labels,n=label(clean[:,:,3]>=20);components=[]
 for i in range(1,n+1):
  y,x=np.where(labels==i)
  if len(x)>100:components.append((i,[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]))
 report={'scope':'G-only raw far anatomy completion/own near extraction; no412bake or runtime write','inputs':EXPECTED,'scaleBothPiecesBothAxes':SCALE,'scaleBasis':'Own raw boot tongue-to-sole155px and original approximately42workingpx; full cloth-to-sole span registers under original hip. No independent shoe-width fit.','profiles':{}}
 boards={theme:Image.new('RGB',(4*512,2*512),bg)for theme,bg in [('light','#eee8db'),('dark','#25272b')]}
 for row,(heading,c)in enumerate(CONTROLS.items()):
  match=[i for i,b in components if b==c['component']];assert len(match)==1,(heading,components)
  isolated=clean.copy();isolated[labels!=match[0]]=0;origin=[c['targetAnkleX']-SCALE*c['rawAnkleX'],c['baseline']-SCALE*c['component'][3]]
  far=paint.unpack(paint.sample(paint.premul(Image.fromarray(isolated)),(XX-origin[0])/SCALE,(YY-origin[1])/SCALE))
  registeredFoot=np.asarray(far).copy();far=paint.warp_layer(far,c['rootNodesY'],c['rootDx'],[0]*len(c['rootNodesY']));assert np.array_equal(np.asarray(far)[407:],registeredFoot[407:]),'Static hip-root fit must preserve complete cuff/shoe pixels exactly'
  original=Image.open(HERE/'registered'/(heading+'.png')).convert('RGBA');a=np.asarray(original);mask=foreground(heading);ys,xs=zip(*c['nearBoundaryYX']);edge=np.interp(YY,np.array(ys),np.array(xs));selected=(YY>=314)&((XX<=edge)if heading=='right'else(XX>=edge))&~mask
  near=a.copy();near[~selected]=0;near=Image.fromarray(near);assert np.array_equal(np.asarray(near)[selected],a[selected]);assert np.array_equal(np.asarray(near)[c['originalWholePaintBelowY']:],a[c['originalWholePaintBelowY']:])
  planted=compose(far,near,original,mask);assert np.array_equal(np.asarray(planted)[mask],a[mask])
  for name,im in [('far-leg',far),('near-leg',near),('foreground-mask',Image.fromarray(mask.astype('uint8')*255)),('planted',planted)]:im.save(OUT/(heading+'-'+name+'.png'))
  report['profiles'][heading]={'controls':c,'origin':origin,'farBounds':bounds(far),'nearBounds':bounds(near),'upperFaceHairTorsoAndTUVPropExact':True,'hipRootFitShoeRgbaExactFromY407':True,'hipRootFitBasis':'Own old upperpants contour at314 and straight generated farleg; rowtranslation field tapers tozero before fullcuff/shoe, no width scaling','nearRetainedPixelsExact':True,'wholeOriginalLowShoePixelsExactFromY':c['originalWholePaintBelowY'],'layerHashes':{name:sha(OUT/(heading+'-'+name+'.png'))for name in ['far-leg','near-leg','foreground-mask','planted']}}
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   for col,im in enumerate([original,far,near,planted]):
    flat=Image.alpha_composite(Image.new('RGBA',(512,512),bg),im).convert('RGB');boards[theme].paste(flat,(col*512,row*512));ImageDraw.Draw(boards[theme]).text((col*512+8,row*512+8),heading+' '+['held original','new complete FAR','original NEAR','planted composite'][col],fill='#111'if theme=='light'else'#eee')
   flat=Image.alpha_composite(Image.new('RGBA',(512,512),bg),planted).convert('RGB');flat.crop((180,300,340,480)).resize((800,900),Image.Resampling.NEAREST).save(REVIEW/(heading+'-planted-lower-'+theme+'.png'))
 for theme,im in boards.items():im.save(REVIEW/('registered-layers-'+theme+'.png'))
 (OUT/'profile-layer-registration.json').write_text(json.dumps(report,indent=2)+'\n');assert all(sha(ROOT/k)==v for k,v in EXPECTED.items());print(json.dumps({'status':'REGISTRATION_FOR_ROOT_VISUAL_REVIEW','profiles':report['profiles']}))
if __name__=='__main__':run()
