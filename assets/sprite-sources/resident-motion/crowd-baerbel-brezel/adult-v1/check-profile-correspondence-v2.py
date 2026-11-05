"""Focused correction of the source-pilot alpha==255 zero-support mistake.

Rechecks only correspondence against existing inspected160 PNGs. Paint with
actual alpha>=200 is a valid own source interior. Expected near-patch RGBA is
the real patch OVER actual FAR context; FAR is checked only with near alpha0.
No old reports/frames are overwritten, no gate tolerance or anatomy changed.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,math
import numpy as np
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
BASE=ROOT/'output/baerbel-height/profile-leg-repair-v2'
POINTS={'right':{'near':{'heel':(221,459),'toe':(289,459)},'far':{'heel':(241,460),'toe':(306,460)}},
        'left':{'near':{'heel':(291,458),'toe':(224,458)},'far':{'heel':(270,460),'toe':(204,460)}}}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def run(args):
 out=BASE/'actual-correspondence-v2'/args.heading;assert not out.exists();out.mkdir(parents=True)
 pilot=load('baerbel_correspondence_actual_layers',HERE/'profile-motion-v2.py')
 config=load('baerbel_correspondence_native_folders',HERE/'native-profile-repair-v2.py')
 s=pilot.sources(args.heading);pins={};records=[];patches={}
 def pin(p):pins[p.relative_to(ROOT).as_posix()]=sha(p)
 for p in [Path(__file__),HERE/'profile-motion-v2.py',HERE/'native-profile-repair-v2.py',HERE/'profile-leg-repair-v2/profile-layer-registration.json']:pin(p)
 for foot in ('near','far'):
  p=HERE/'profile-leg-repair-v2'/f'{args.heading}-{foot}-leg.png';pin(p)
  for name,(x,y) in POINTS[args.heading][foot].items():
   raw=np.asarray(s[foot]);part=np.zeros_like(raw);part[y-2:y+3,x-2:x+3]=raw[y-2:y+3,x-2:x+3]
   assert part[y-2:y+3,x-2:x+3,3].min()>=200
   control=np.zeros_like(raw);control[y-2:y+3,x-2:x+3]=255
   patches[foot,name]=(pilot.paint.premul(Image.fromarray(part)),pilot.paint.premul(Image.fromarray(control)),int(raw[y-2:y+3,x-2:x+3,3].min()),int(raw[y-2:y+3,x-2:x+3,3].max()))
 for strength,folder in config.FOLDERS[args.heading]:
  receipt=BASE/folder/'report.json';pin(receipt);old=json.loads(receipt.read_text())
  for phase,entry in enumerate(old['records']):
   source=ROOT/entry['image']['file'];pin(source);assert sha(source)==entry['image']['sha256']
   with Image.open(source) as opened:body=opened.convert('RGBA')
   full,field,layers=pilot.render(args.heading,math.tau*phase/16,strength,True)
   assert full.tobytes()==body.tobytes(),'Actual viewed source must still replay exact'
   actual=np.asarray(body);record={'strength':strength,'phase':phase,'actualSource':source.relative_to(ROOT).as_posix(),'sha256':sha(source),'replayRgbaExact':True,'feet':{}}
   for foot in ('near','far'):
    dx,dy=field['limb_displacement'][foot]['footDxDy'];point_results={}
    for name,(x,y) in POINTS[args.heading][foot].items():
     pixels,control,min_alpha,max_alpha=patches[foot,name]
     l,t=math.floor(x+dx)-9,math.floor(y+dy)-9;yy,xx=np.mgrid[t:t+20,l:l+20]
     moved=pilot.paint.unpack(pilot.paint.sample(pixels,xx-dx,yy-dy));a=np.asarray(moved)
     coverage=pilot.paint.sample(control,xx-dx,yy-dy)[:,:,3]
     fully_inside=coverage>=1-1e-8
     valid=fully_inside&(a[:,:,3]>=200)&~s['foreground'][t:t+20,l:l+20]
     other=layers['far' if foot=='near' else 'near'].crop((l,t,l+20,t+20))
     if foot=='far':valid&=np.asarray(other)[:,:,3]==0
     expected=Image.alpha_composite(other,moved) if foot=='near' else Image.alpha_composite(moved,other)
     expected_rgba=np.asarray(expected)
     errors=np.abs(expected_rgba.astype(int)-actual[t:t+20,l:l+20].astype(int))
     rgb_error=int(errors[valid,:3].max()) if valid.any() else None
     rgba_error=int(errors[valid].max()) if valid.any() else None
     assert rgba_error is None or rgba_error<=1,'Actual composited own paint correspondence failed'
     if foot=='near':assert valid.any(),'Actual near paint gate must execute, not null-pass'
     if foot=='far' and name=='toe' and phase in [12,13,14,15,0]:assert valid.any(),'Viewed exposed far toe must retain actual supported body paint'
     point_results[name]={'sourcePoint':[x,y],'sourcePatch':[x-2,y-2,x+3,y+3],
      'sourcePatchAlphaRange':[min_alpha,max_alpha],'transportedPaintSupportAtLeast200':int(((a[:,:,3]>=200)&fully_inside).sum()),
      'actualBodyVisibleSupportedPixels':int(valid.sum()),'maximumRgbError':rgb_error,'maximumRgbaError':rgba_error,
      'status':'ACTUAL_BODY_SUPPORTED' if valid.any() else 'OCCLUDED_FAR_PATCH_NO_BODY_CLAIM'}
    record['feet'][foot]=point_results
   records.append(record)
 report={'status':'ACTUAL_SOURCE_BODY_CORRESPONDENCE_PASS; not native/world release acceptance','heading':args.heading,
  'corrects':'Initial checker usedalpha==255 and consequently0/null actual body support. Those historical reports/RED remain unchanged.',
  'paintRule':'Actual source5x5alpha>=200; fully sampled patch interior; transformed alpha>=200; original foreground excluded. FAR additionally requires actual NEAR alpha0.',
  'compositingFormula':'NEAR expected=PIL.Image.alpha_composite(actualFarContext,realNearPatch); FAR expected=alpha_composite(realFarPatch,actualNearContext) only whereNearAlpha0. Compare exact RGBA to actual stored body PNG, existing<=1 rounding tolerance.',
  'inputPins':pins,'framesChecked':len(records),'records':records,
  'totalActualBodySupportedPixels':sum(p['actualBodyVisibleSupportedPixels'] for r in records for f in r['feet'].values() for p in f.values()),
  'maximumSupportedRgbaError':max(p['maximumRgbaError'] or 0 for r in records for f in r['feet'].values() for p in f.values()),
  'occludedFarPointCases':sum(p['actualBodyVisibleSupportedPixels']==0 for r in records for p in r['feet']['far'].values())}
 assert all(sha(ROOT/p)==v for p,v in pins.items())
 (out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['heading','framesChecked','totalActualBodySupportedPixels','maximumSupportedRgbaError','occludedFarPointCases']}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--heading',required=True,choices=['right','left']);run(p.parse_args())
