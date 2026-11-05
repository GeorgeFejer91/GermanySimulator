"""Actual encoded pilot + own painted heel/toe support, one bounded profile.

Keeps whole-layer transport distinct from visibility after near/far occlusion.
Larger real own RGB rectangles survive native mobile sampling; no drawn marks
enter any production frame. No distance clock or acceptance threshold changed.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,math
import numpy as np
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
WORK=ROOT/'output/street-redesign/baerbel-brezel-end-to-end/native-profile-repair-v2'
OUT=ROOT/'output/baerbel-height/profile-leg-repair-v2/native-contacts-v1'
POINTS={'right':{'near':{'heel':(221,459),'toe':(289,459)},'far':{'heel':(241,460),'toe':(306,460)}},
        'left':{'near':{'heel':(291,458),'toe':(224,458)},'far':{'heel':(270,460),'toe':(204,460)}}}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def centroid(im):
 a=np.asarray(im)[:,:,3].astype(float);yy,xx=np.mgrid[:a.shape[0],:a.shape[1]];assert a.sum()>0,'Real own source patch vanished at this native density'
 return [float((a*xx).sum()/a.sum()),float((a*yy).sum()/a.sum())]
def run(args):
 out=OUT/args.heading;assert not out.exists();out.mkdir(parents=True)
 pilot=load('baerbel_native_contact_layers',HERE/'profile-motion-v2.py')
 street=load('baerbel_native_contact_export',ROOT/'tools/build-street-character-sprites.py')
 sources=pilot.sources(args.heading);pins={}
 def pin(p):pins[p.relative_to(ROOT).as_posix()]=sha(p)
 for p in [Path(__file__),HERE/'profile-motion-v2.py',ROOT/'tools/build-street-character-sprites.py',HERE/'profile-leg-repair-v2/profile-layer-registration.json',HERE/'profile-leg-repair-v2'/f'{args.heading}-near-leg.png',HERE/'profile-leg-repair-v2'/f'{args.heading}-far-leg.png']:pin(p)
 patches={}
 for foot,points in POINTS[args.heading].items():
  rgba=np.asarray(sources[foot])
  for name,(x,y) in points.items():
   assert rgba[y-2:y+3,x-2:x+3,3].min()>=200,'Anchor is actual own opaque shoe interior'
   a=np.zeros_like(rgba);a[y-4:y+5,x-6:x+7]=rgba[y-4:y+5,x-6:x+7]
   patches[foot,name]=Image.fromarray(a)
 records=[];atlases={};metas={};specs={};boards={}
 for variant,w,h in [('desktop',96,120),('mobile',64,80)]:
  q=w/128;specs[variant]={'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}}
  path=WORK/variant/'report.json';pin(path);meta=json.loads(path.read_text());metas[variant]=meta
  path=ROOT/meta['encoded']['file'];pin(path);assert sha(path)==meta['encoded']['sha256'];atlases[variant]=Image.open(path).convert('RGBA')
  boards[variant]=Image.new('RGB',(8*w*3,2*36*3),'#eee8db')
 for phase in range(16):
  angle=math.tau*phase/16;full,record,layers=pilot.render(args.heading,angle,1,True)
  r={'phase':phase,'sourceCurrentReplayExact':{},'variants':{}}
  transported={key:pilot.transport(im,args.heading,angle,1,key[0])[0] for key,im in patches.items()}
  for variant,w,h in [('desktop',96,120),('mobile',64,80)]:
   row=next(r for r in metas[variant]['rows'] if r['heading']==args.heading and r['strength']==1)
   cell=row['cells'][phase];source=ROOT/cell['source'];pin(source);assert sha(source)==cell['sourceSha256']
   with Image.open(source) as opened:assert opened.convert('RGBA').tobytes()==full.tobytes(),'Current separate-layer source must replay exact inspected pilot'
   r['sourceCurrentReplayExact'][variant]=True;rowindex=cell['row'];native=atlases[variant].crop((phase*w,rowindex*h,(phase+1)*w,(rowindex+1)*h))
   assert native.tobytes()==street.export_cell(full,specs[variant]).tobytes()
   feet={}
   for foot in ('near','far'):
    witnesses={name:street.export_cell(transported[foot,name],specs[variant]) for name in ('heel','toe')}
    positions={name:centroid(im) for name,im in witnesses.items()}
    supports={name:int((np.asarray(im)[:,:,3]>0).sum()) for name,im in witnesses.items()}
    other=street.export_cell(layers['near'],specs[variant]) if foot=='far' else Image.new('RGBA',(w,h))
    visible={name:int(((np.asarray(im)[:,:,3]>0)&(np.asarray(other)[:,:,3]==0)).sum()) for name,im in witnesses.items()}
    feet[foot]={'nativeRgbaCentroids':positions,'span':abs(positions['toe'][0]-positions['heel'][0]),'realPatchSupportPixels':supports,
     'supportWithoutNearOcclusionPixels':visible,'qualification':'Centroids are exact exported actual painted-layer support; zero unoccluded count does NOT establish visible body contact'}
   r['variants'][variant]={'feet':feet,'encodedCellMatchesActualSource':True}
   cut=Image.alpha_composite(Image.new('RGBA',(w,h),'#eee8db'),native).convert('RGB').crop((0,h-36,w,h)).resize((w*3,108),Image.Resampling.NEAREST)
   boards[variant].paste(cut,((phase%8)*w*3,(phase//8)*108));ImageDraw.Draw(boards[variant]).text(((phase%8)*w*3+4,(phase//8)*108+2),str(phase),fill='red')
  records.append(r)
 report={'heading':args.heading,'mode':'NATIVE_REAL_RGBA_SOURCE_LAYER_DIAGNOSTIC; no actual-world/gait acceptance','sourcePatchRectangles':'13x9 own existing RGB/alpha centered on opaque5x5 interior anchors; no synthetic pixels',
  'points':POINTS[args.heading],'inputPins':pins,'records':records,'ranges':{},'fivePositionStances':[]}
 for variant in specs:
  report['ranges'][variant]={foot:{'min':min(r['variants'][variant]['feet'][foot]['span'] for r in records),'max':max(r['variants'][variant]['feet'][foot]['span'] for r in records),
   'minimumRealPatchSupport':min(v for r in records for v in r['variants'][variant]['feet'][foot]['realPatchSupportPixels'].values())} for foot in ('near','far')}
  # FAR heel is naturally behind the near shoe. Track its genuinely exposed
  # TOE over five actual planted samples; don't call hidden heel marks a
  # body-visible contact. These phases were chosen from the viewed sources.
  for foot,point,phases in [('near','heel',[4,6,8,10,12]),('far','toe',[12,13,14,15,16])]:
   xs=[records[i%16]['variants'][variant]['feet'][foot]['nativeRgbaCentroids'][point][0]*(1 if args.heading=='right' else -1) for i in phases]
   p=np.array(phases)/16;a=np.array(xs);slope=float(np.dot(p-p.mean(),a-a.mean())/np.dot(p-p.mean(),p-p.mean()));residual=float(abs(a-(a.mean()+slope*(p-p.mean()))).max())
   visible=[records[i%16]['variants'][variant]['feet'][foot]['supportWithoutNearOcclusionPixels'][point] for i in phases]
   total=[records[i%16]['variants'][variant]['feet'][foot]['realPatchSupportPixels'][point] for i in phases]
   assert min(visible)>0,'Actual native planted contact must retain visible real paint'
   report['fivePositionStances'].append({'variant':variant,'foot':foot,'point':point,'unwrappedFrames':phases,'alongNativePixels':xs,'slopePerCycleNativePixels':slope,'maximumLineResidualNativePixels':residual,
    'bodyUnoccludedSupportCounts':visible,'realPatchSupportCounts':total,'allSupportUnoccluded':visible==total})
  boards[variant].save(out/f'{variant}-unmarked-real-encoded-16phase-feet.png')
 assert all(sha(ROOT/p)==digest for p,digest in pins.items())
 (out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'heading':args.heading,'ranges':report['ranges'],'fivePositionStances':report['fivePositionStances']}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--heading',required=True,choices=['right','left']);run(p.parse_args())
