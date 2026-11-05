"""Five actual own RGBA points per stance; diagnostic or required-uniform mode.

No painting/motion edit, full-family build, native export or browser operation.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,math
import numpy as np
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
WORK=ROOT/'output/street-redesign/hildegard-brotzeit-end-to-end'
POINTS={'right':{'near':(217,456),'far':(289,451)},'left':{'near':(295,458),'far':(217,449)}}
def run(args):
 out=WORK/args.output;assert out.is_relative_to(WORK) and not out.exists();out.mkdir(parents=True)
 spec=importlib.util.spec_from_file_location('hildegard_five_position_field',HERE/'pilot-motion.py');pilot=importlib.util.module_from_spec(spec);spec.loader.exec_module(pilot)
 report={'actor':'crowd-hildegard-brotzeit','mode':'REQUIRED_UNIFORM' if args.require_uniform else 'DIAGNOSTIC_ONLY_NOT_GAIT_ACCEPTANCE','sourceFieldSha256':hashlib.sha256((HERE/'pilot-motion.py').read_bytes()).hexdigest(),'samplesPerStance':5,'selectedEncodedCellsChecked':0,'stances':[]}
 extremes=[];stance_images=[]
 if args.compare_extremes:
  report['previouslyViewedExtremes']=[]
  for heading in ['down','right','up','left']:
   for phase in [0,4,8,12]:
    path=WORK/'pilot-motion'/f'{heading}-{phase:02}.png'
    with Image.open(path) as opened:old=opened.convert('RGBA')
    new=pilot.render(heading,math.tau*phase/16)[0]
    assert old.tobytes()==new.tobytes(),(heading,phase,'previously viewed extreme changed')
    extremes.append((f'{heading} phase{phase}',new))
    report['previouslyViewedExtremes'].append({'heading':heading,'phase':phase,'oldPngSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'newRenderRgbaExact':True})
 for heading,feet in POINTS.items():
  source=HERE/'registered'/f'{heading}.png'
  with Image.open(source) as opened:rgba=np.array(opened.convert('RGBA'))
  for foot,(x,y) in feet.items():
   patch=np.zeros_like(rgba);patch[y-2:y+3,x-2:x+3]=rgba[y-2:y+3,x-2:x+3];assert patch[y-2:y+3,x-2:x+3,3].min()>=200
   control=np.zeros_like(rgba);control[y-2:y+3,x-2:x+3]=255
   phases=[4,6,8,10,12] if foot=='near' else [12,14,16,18,20];samples=[]
   for phase in phases:
    angle=math.tau*phase/16;sx,sy,_=pilot.side_map(heading,angle)
    witness=np.array(pilot.paint.unpack(pilot.paint.sample(pilot.paint.premul(Image.fromarray(patch)),sx,sy)))
    coverage=pilot.paint.sample(pilot.paint.premul(Image.fromarray(control)),sx,sy)[:,:,3]
    full=np.array(pilot.render(heading,angle)[0]);valid=coverage>=1-1e-8;assert valid.any()
    error=int(np.abs(witness[valid,:3].astype(int)-full[valid,:3].astype(int)).max());assert error<=1
    weights=witness[:,:,3].astype(float);centroid=float((weights*pilot.XX).sum()/weights.sum())
    samples.append({'unwrappedFrame':phase,'centroidX':centroid,'alongTravelPixels':centroid*(1 if heading=='right' else -1),'fullySupportedPixels':int(valid.sum()),'maximumRgbError':error})
    stance_images.append((f'{heading} {foot} frame{phase}',Image.fromarray(full)))
   phase=np.array(phases,float)/16;along=np.array([s['alongTravelPixels'] for s in samples]);assert np.all(np.diff(along)<0)
   slope=float(np.dot(phase-phase.mean(),along-along.mean())/np.dot(phase-phase.mean(),phase-phase.mean()))
   predicted=along.mean()+slope*(phase-phase.mean());residual=float(np.max(np.abs(along-predicted)))
   ratio=abs((-slope)/40-1);uniform=ratio<=.02 and residual<=.25
   report['stances'].append({'heading':heading,'foot':foot,'ownPoint':[x,y],'sourcePointRgba':rgba[y,x].tolist(),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'samples':samples,'stepsAlongPixels':np.diff(along).tolist(),'slopePerCycleSourcePixels':slope,'ownCycleDistance':-slope*2.33/400/.02,'slopeDeviationFromOwn10pxPlantedField':ratio,'maximumLineResidualSourcePixels':residual,'uniformWithinOwnField':uniform})
 report['allFourStancesUniform']=all(s['uniformWithinOwnField'] for s in report['stances'])
 report['meanOwnSourceCycleDistance']=float(np.mean([s['ownCycleDistance'] for s in report['stances']]))
 report['verdict']='UNIFORM_SOURCE_WITNESS' if report['allFourStancesUniform'] else 'RED_NONUNIFORM_SOURCE_STANCE'
 report['actualBoards']=[]
 for name,images,columns in [('extremes',extremes,4),('five-positions',stance_images,5)]:
  if not images:continue
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   board=Image.new('RGB',(columns*512,math.ceil(len(images)/columns)*512),bg)
   for i,(label,image) in enumerate(images):
    board.paste(Image.alpha_composite(Image.new('RGBA',image.size,bg),image).convert('RGB'),((i%columns)*512,(i//columns)*512))
    ImageDraw.Draw(board).text(((i%columns)*512+8,(i//columns)*512+8),label,fill='#111' if theme=='light' else '#eee')
   path=out/f'{name}-{theme}.png';board.save(path);report['actualBoards'].append({'file':path.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 report['qualification']='Actual source-RGBA patch evidence only. Expected own10px-amplitude planted slope40 source pixels/cycle; tolerance2percent and max0.25sourcepixel residual diagnose source-field inconsistency. Actual source points are Hildegard sole paint, not another actor markers. Final selected native cadence and production context remain pending.'
 (out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
 if args.require_uniform:assert report['allFourStancesUniform'],'Uniform own five-position source witness required'
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--output',required=True);p.add_argument('--require-uniform',action='store_true');p.add_argument('--compare-extremes',action='store_true');run(p.parse_args())
