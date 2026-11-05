"""One bounded source-profile/strength slice; no full-family or runtime writes."""
from pathlib import Path
import argparse, hashlib, importlib.util, json, math
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
WORK=ROOT/'output/baerbel-height/profile-leg-repair-v2'
def load(name,p):
 spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
# Actual opaque source MaryJane interior heel and toe paint (not invented
# silhouette endpoints). New FAR witness points belong to its own new layer.
POINTS={'right':{'near':{'heel':(221,459),'toe':(289,459)},'far':{'heel':(241,460),'toe':(306,460)}},
        'left':{'near':{'heel':(291,458),'toe':(224,458)},'far':{'heel':(270,460),'toe':(204,460)}}}
def witness(pilot,source,point,dx,dy):
 x,y=point;a=np.asarray(source);patch=np.zeros_like(a);patch[y-2:y+3,x-2:x+3]=a[y-2:y+3,x-2:x+3]
 assert patch[y-2:y+3,x-2:x+3,3].min()>=200,(point,'requires own opaque interior shoe paint')
 l,t=math.floor(x+dx)-9,math.floor(y+dy)-9
 yy,xx=np.mgrid[t:t+20,l:l+20]
 image=pilot.paint.unpack(pilot.paint.sample(pilot.paint.premul(Image.fromarray(patch)),xx-dx,yy-dy))
 pixels=np.asarray(image);weight=pixels[:,:,3].astype(float);assert weight.sum()>0
 centroid=[float((xx*weight).sum()/weight.sum()),float((yy*weight).sum()/weight.sum())]
 return pixels,centroid,[l,t]
def run(args):
 pilot=load('baerbel_separate_profile_v2',HERE/'profile-motion-v2.py')
 out=WORK/args.output;assert out.is_relative_to(WORK) and not out.exists();out.mkdir(parents=True)
 pins={str(p.relative_to(ROOT)).replace('\\','/'):sha(p) for p in [Path(__file__),HERE/'profile-motion-v2.py',HERE/'prepare-profile-layers-v2.py',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py',HERE/'registered'/f'{args.heading}.png',*sorted((HERE/'profile-leg-repair-v2').glob('*.png'))]}
 s=pilot.sources(args.heading);records=[]
 board={theme:Image.new('RGB',(4*512,4*512),bg) for theme,bg in [('light','#eee8db'),('dark','#25272b')]}
 feet={theme:Image.new('RGB',(8*140*3,2*110*3),bg) for theme,bg in [('light','#eee8db'),('dark','#25272b')]}
 for phase in range(16):
  angle=math.tau*phase/16;full,record,layers=pilot.render(args.heading,angle,args.strength,True)
  dest=out/f'{args.heading}-{phase:02}.png';full.save(dest)
  record['frame']=phase;record['image']={'file':dest.relative_to(ROOT).as_posix(),'sha256':sha(dest)}
  a=np.asarray(full);components,n=label(a[:,:,3]>=128)
  sizes=sorted([int(v) for v in np.bincount(components.ravel())[1:] if v>=100],reverse=True)
  assert len(sizes)==1,(args.heading,args.strength,phase,'disconnected body',sizes)
  assert np.where(a[:,:,3]>=20)[0].max()<=471,'No foot may descend below own472 baseline'
  record['bodyComponentsAtLeast100Pixels']=sizes;record['feet']={}
  for foot in ('near','far'):
   field=record['limb_displacement'][foot];dx,dy=field['footDxDy']
   # Exact full-source sample of the independently retained leg, using a
   # constant whole-shoe translation. Equality in431+ directly rejects any
   # within-shoe deformation in the actual existing transport helper.
   rigid=pilot.paint.unpack(pilot.paint.sample(pilot.paint.premul(s[foot]),pilot.XX-dx,pilot.YY-dy)) if args.strength else s[foot]
   assert np.array_equal(np.asarray(layers[foot])[431:],np.asarray(rigid)[431:]),'Shoe paint must be one rigid translation'
   actual=np.asarray(layers[foot]);other=np.asarray(layers['near']) if foot=='far' else np.zeros_like(actual)
   point_results={}
   for name,point in POINTS[args.heading][foot].items():
    patch,centroid,origin=witness(pilot,s[foot],point,dx,dy);l,t=origin
    opaque=patch[:,:,3]==255
    visible=opaque & (other[t:t+20,l:l+20,3]==0) & ~s['foreground'][t:t+20,l:l+20]
    error=int(np.abs(patch[visible,:3].astype(int)-a[t:t+20,l:l+20,:3][visible].astype(int)).max()) if visible.any() else None
    assert error is None or error<=1,'A visible source shoe patch changed RGB unexpectedly'
    point_results[name]={'ownSourcePoint':point,'sourceRgba':np.asarray(s[foot])[point[1],point[0]].tolist(),
     'observedRgbaCentroid':centroid,'bodyVisibleOpaqueSupportPixels':int(visible.sum()),'visibleBodyMaximumRgbError':error,
     'occlusionQualification':'Null RGB error means this witness is occluded; independent complete layer proof is separate'}
   source_span=abs(POINTS[args.heading][foot]['toe'][0]-POINTS[args.heading][foot]['heel'][0])
   span=abs(point_results['toe']['observedRgbaCentroid'][0]-point_results['heel']['observedRgbaCentroid'][0])
   assert abs(span-source_span)<.01,'Actual own heel-to-toe span changed within one shoe'
   foot_region=actual[435:,:,3].astype(float)/255
   uncovered=(1-other[435:,:,3].astype(float)/255)
   record['feet'][foot]={'points':point_results,'sourceInteriorSpan':source_span,'transportedSpan':span,
    'wholeShoeRgbaEqualsRigidTranslationFromY431':True,'layerShoeCoveragePixels':float(foot_region.sum()),
    'shoeVisibleFractionAfterNearOcclusion':float((foot_region*uncovered).sum()/foot_region.sum())}
  records.append(record)
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   flat=Image.alpha_composite(Image.new('RGBA',(512,512),bg),full).convert('RGB')
   board[theme].paste(flat,((phase%4)*512,(phase//4)*512))
   ImageDraw.Draw(board[theme]).text(((phase%4)*512+8,(phase//4)*512+8),f'{args.heading} phase{phase} strength{args.strength}',fill='#111' if theme=='light' else '#eee')
   cut=flat.crop((185,370,325,480)).resize((420,330),Image.Resampling.NEAREST)
   feet[theme].paste(cut,((phase%8)*420,(phase//8)*330));ImageDraw.Draw(feet[theme]).text(((phase%8)*420+5,(phase//8)*330+5),str(phase),fill='red')
 for theme in board:
  board[theme].save(out/f'{args.heading}-16phase-{theme}.png')
  feet[theme].save(out/f'{args.heading}-16phase-feet-{theme}.png')
 report={'status':'ACTUAL_SOURCE_LAYER_TRANSPORT_DIAGNOSTIC; visual/native/game gates pending','heading':args.heading,'strength':args.strength,
  'inputPins':pins,'records':records,'proof':'Actual near and new far source paint stay separate; foot layers equal a rigid translation; visible own RGBA support distinguished from occluded support',
  'sourceFivePositionStance':[]}
 for foot,phases in [('near',[4,6,8,10,12]),('far',[12,14,16,18,20])]:
  values=[records[p%16]['feet'][foot]['points']['heel']['observedRgbaCentroid'][0]*(1 if args.heading=='right' else -1) for p in phases]
  p=np.array(phases)/16;v=np.array(values);slope=float(np.dot(p-p.mean(),v-v.mean())/np.dot(p-p.mean(),p-p.mean()))
  residual=float(abs(v-(v.mean()+slope*(p-p.mean()))).max())
  assert abs(slope+40*args.strength)<.01 and residual<.01
  report['sourceFivePositionStance'].append({'foot':foot,'unwrappedFrames':phases,'actualLayerRgbaAlongTravel':values,'slope':slope,'maximumResidual':residual,
   'qualification':'Independent real painted layer; per-frame body-visible/occluded supports recorded above. Native/game cadence unproved.'})
 for rel,digest in pins.items():assert sha(ROOT/rel)==digest
 (out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'heading':args.heading,'strength':args.strength,'frames':len(records),'allWholeShoeLayersRigid':True,'sourceFivePositionStance':report['sourceFivePositionStance'],'output':str(out)}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--heading',required=True,choices=['right','left']);p.add_argument('--strength',type=float,default=1);p.add_argument('--strengths',type=float,nargs='+');p.add_argument('--output',required=True);args=p.parse_args()
 if args.strengths:
  assert len(args.strengths)<=2,'Keep a single bounded slice at most32frames'
  for strength in args.strengths:
   run(argparse.Namespace(heading=args.heading,strength=strength,output=args.output+'-strength'+str(strength)))
 else:run(args)
