"""Hannelore original-owned near-foot masks only. No gait or hidden-paint reconstruction."""
from pathlib import Path
import argparse,hashlib,json,sys,importlib.util
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
FAMILY=HERE.parent
OUT=ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-gait-source-v2'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
read=lambda p:json.loads(Path(p).read_text(encoding='utf8'))
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def split(image,mask):
 a=np.asarray(image);m=np.asarray(mask)>0;n=np.where(m[:,:,None],a,0).astype('uint8');b=np.where(~m[:,:,None],a,0).astype('uint8')
 n[n[:,:,3]==0,:3]=0;b[b[:,:,3]==0,:3]=0
 near=Image.fromarray(n);rest=Image.fromarray(b);joined=Image.alpha_composite(rest,near)
 aa=np.asarray(joined);v=a[:,:,3]>0
 assert np.array_equal(aa[v],a[v]) and np.array_equal(aa[:,:,3],a[:,:,3])
 return near,rest,joined,{'visibleRgbaExact':True,'alphaExact':True,'fullRgbaExact':bool(np.array_equal(aa,a)),'selectedVisiblePixels':int(np.count_nonzero(m&v)),'sourceAlphaZeroHiddenRgbPixels':int(np.count_nonzero(np.any(a[:,:,:3]!=0,2)&~v))}

def main():
 OUT.mkdir(parents=True,exist_ok=True);recipe=read(HERE/'ownership.json');protected=read(ROOT/recipe['prior3147Pins']['file'])
 assert len(protected)==3147 and sha(ROOT/recipe['prior3147Pins']['file'])==recipe['prior3147Pins']['sha256']
 for rel,digest in protected.items():
  if sha(ROOT/rel)!=digest:raise ValueError('Protected previous3147 changed: '+rel)
 # Retain all historical completion evidence, not just the prior pin map.
 for base in [FAMILY/'occlusion-components-v2',ROOT/'output/ambient-city-animation/hannelore-sparkasse-occlusion-components-v2']:
  for p in base.rglob('*'):
   if p.is_file() and '__pycache__' not in p.parts:protected[p.relative_to(ROOT).as_posix()]=sha(p)
 inputs=dict(protected)
 for p in [HERE/'ownership.json',Path(__file__),ROOT/recipe['source'],ROOT/recipe['neutralReceipt']['file'],ROOT/'tools/build-street-character-sprites.py',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py']:
  inputs[p.relative_to(ROOT).as_posix()]=sha(p)
 for side in recipe['sides'].values():
  p=ROOT/side['neutralFile'];assert sha(p)==side['neutralSha256'];inputs[p.relative_to(ROOT).as_posix()]=sha(p)
 assert sha(ROOT/recipe['source'])==recipe['sourceSha256'];source=Image.open(ROOT/recipe['source']).convert('RGBA');assert list(source.size)==recipe['sourceDimensions'];assert sha(ROOT/recipe['neutralReceipt']['file'])==recipe['neutralReceipt']['sha256']
 (OUT/'input-pins-before.json').write_text(json.dumps(inputs,indent=2)+'\n')
 sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'));street=load('hannelore_near_export',ROOT/'tools/build-street-character-sprites.py');font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14);files={};rows={};nativeBoards={k:[] for k in ['light','dark']}
 def save(im,name):
  p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True);im.save(p);files[name]=sha(p)
 def comp(im,bg):return Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
 for heading,side in recipe['sides'].items():
  v=side['view'];scale=v['scale'];origin=np.array([256,472])-np.array(v['source_pivot'])*scale
  rawMask=Image.new('L',source.size);ImageDraw.Draw(rawMask).polygon([tuple(p) for p in side['ownedPolygonRaw']],fill=255)
  crop=source.crop(side['cropRaw']);cm=rawMask.crop(side['cropRaw']);rawNear,rawRest,rawJoined,rawChecks=split(crop,cm)
  for name,im in [('raw-mask',cm),('raw-near',rawNear),('raw-remainder',rawRest),('raw-reassembled',rawJoined)]:save(im,heading+'-'+name+'.png')
  original=Image.open(ROOT/side['neutralFile']).convert('RGBA');yy,xx=np.mgrid[:512,:512];sx=np.rint((xx-origin[0])/scale).astype(int);sy=np.rint((yy-origin[1])/scale).astype(int);valid=(sx>=0)&(sx<source.width)&(sy>=0)&(sy<source.height);wm=np.zeros((512,512),dtype='uint8');ra=np.asarray(rawMask);wm[valid]=ra[sy[valid],sx[valid]];mask=Image.fromarray(wm)
  near,rest,joined,checks=split(original,mask)
  for name,im in [('working-mask',mask),('working-near',near),('working-remainder',rest),('working-reassembled',joined)]:save(im,heading+'-'+name+'.png')
  witnesses={}
  for name,point in side['directOriginalRawWitnesses'].items():
   if not isinstance(point,list):continue
   px,py=point;working=np.asarray(point)*scale+origin;wx,wy=np.rint(working).astype(int)
   witnesses[name]={'raw':point,'rawMaskValue':int(ra[py,px]),'rawSourceAlpha':source.getpixel((px,py))[3],'working':working.tolist(),'workingMaskValue':int(wm[wy,wx])}
   assert ra[py,px]==255 and wm[wy,wx]==255,heading+' unowned witness '+name
  # Raw overlay: mask in green; actual intershoe edge yellow; static occluder cyan.
  overlay=crop.copy();green=Image.new('RGBA',crop.size,(30,210,70,0));gg=np.asarray(green).copy();gg[:,:,3]=np.asarray(cm)//3;overlay=Image.alpha_composite(overlay,Image.fromarray(gg));display=comp(overlay,'#eee8db').resize((crop.width*4,crop.height*4),Image.Resampling.NEAREST);d=ImageDraw.Draw(display);lo=np.array(side['cropRaw'][:2])
  mapped=lambda points:[tuple((np.array(p)-lo)*4) for p in points]
  d.line(mapped(side['intershoeSeamRaw']),fill='#ffb800',width=3);d.line(mapped(side['occluderBoundaryRaw']),fill='#00aadd',width=3);d.text((4,4),heading+' near '+side['anatomicalNearFoot']+' | green own, yellow seam, cyan static occluder',font=font,fill='#a00000');save(display,heading+'-raw-mask-overlay.png')
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   ink='#111' if theme=='light' else '#eee';box=(175,385,335,480);board=Image.new('RGB',(4*490,335),bg);d=ImageDraw.Draw(board)
   for col,(im,label) in enumerate([(original,'original'),(near,'original-owned near'),(rest,'complement remainder'),(joined,'exact reassembly')]):
    board.paste(comp(im,bg).crop(box).resize((480,285),Image.Resampling.NEAREST),(col*490,45));d.text((col*490+3,3),heading+' '+label,font=font,fill=ink)
   save(board,heading+'-native-comparison-'+theme+'.png');nativeBoards[theme].append(board);save(comp(near,bg),heading+'-isolated-native-'+theme+'.png')
  direct={}
  for w,h in [(96,120),(64,80)]:
   ratio=w/128;spec={'working':{'figureHeight':400,'baseline':472},'cell':[w,h],'pivot':[64*ratio,150*ratio],'figureHeight':137*ratio};originalD=street.export_cell(original,spec);nearD=street.export_cell(near,spec);restD=street.export_cell(rest,spec);joinedD=street.export_cell(joined,spec);separate=Image.alpha_composite(restD,nearD);oa=np.asarray(originalD);ja=np.asarray(joinedD);sa=np.asarray(separate);assert np.array_equal(oa,ja)
   # Expected diagnostic: independently filtered complementary interior cuts overlap.
   delta=sa.astype(int)-oa.astype(int);metric={'reassembledWorkingThenExportRgbaExact':True,'separatelyExportedLayerChangedPixels':int(np.count_nonzero(np.any(delta!=0,2))),'separatelyExportedLayerMaxAbsRgbaDifference':np.max(np.abs(delta),axis=(0,1)).tolist(),'paintHeight':137*ratio,'pivot':spec['pivot'],'cells':{}}
   ims=[(originalD,'original'),(nearD,'near'),(restD,'remainder'),(joinedD,'reassembled-once'),(separate,'separately-filtered')]
   for im,label in ims:
    a=np.asarray(im);edge=np.concatenate([a[0,:,3],a[-1,:,3],a[:,0,3],a[:,-1,3]]);metric['cells'][label]={'edgeAlphaMax':int(edge.max()),'hiddenRgbAtAlphaZero':int(np.count_nonzero(np.any(a[:,:,:3]!=0,2)&(a[:,:,3]==0)))};assert metric['cells'][label]['edgeAlphaMax']==0 and metric['cells'][label]['hiddenRgbAtAlphaZero']==0;save(im,f'direct-{w}x{h}/{heading}-{label}.png')
   direct[f'{w}x{h}']=metric
   for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
    ink='#111' if theme=='light' else '#eee';board=Image.new('RGB',(5*250,230),bg);d=ImageDraw.Draw(board);fac=137*ratio/400;box=(int((175-256)*fac+64*ratio)-2,int((385-472)*fac+150*ratio)-2,int((335-256)*fac+64*ratio)+3,int((480-472)*fac+150*ratio)+3)
    for col,(im,label) in enumerate(ims):
     board.paste(comp(im,bg).crop(box).resize(((box[2]-box[0])*5,(box[3]-box[1])*5),Image.Resampling.NEAREST),(col*250+3,45));d.text((col*250+3,3),heading+' '+str(w)+' '+label,font=font,fill=ink)
    save(board,f'{heading}-direct-{w}x{h}-boots-{theme}.png')
  rows[heading]={'anatomicalNearFoot':side['anatomicalNearFoot'],'sourceSha256':recipe['sourceSha256'],'neutralSha256':side['neutralSha256'],'originWorking':origin.tolist(),'uniformScaleUnchanged':scale,'rawChecks':rawChecks,'workingChecks':checks,'ownedWitnesses':witnesses,'direct':direct,'missingPaint':side['missing'],'donorPixelsUsed':0,'status':'SOURCE-only ownership prototype; independent visual review required'}
 for theme,boards in nativeBoards.items():
  board=Image.new('RGB',(boards[0].width,sum(i.height for i in boards)));y=0
  for im in boards:board.paste(im,(0,y));y+=im.height
  save(board,'both-near-native-'+theme+'.png')
 for rel,digest in inputs.items():
  if sha(ROOT/rel)!=digest:raise ValueError('Pinned input changed: '+rel)
 (OUT/'input-pins-after.json').write_text(json.dumps(inputs,indent=2)+'\n')
 receipt={'schemaVersion':1,'status':'SOURCE-only two original-owned near masks; no gait; acceptance pending','recipeSha256':sha(HERE/'ownership.json'),'driverSha256':sha(Path(__file__)),'prior3147PinsUnchanged':True,'inputPinCount':len(inputs),'pinsBeforeAfterExact':True,'inputsSha256':sha(OUT/'input-pins-before.json'),'sides':rows,'files':files,'notRun':['hidden-paint completion','complete far heel or isolated far body','gait extremes/full16','walking mouths','stride/contact','runtime/GPU']}
 (OUT/'ownership-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'receiptSha256':sha(OUT/'ownership-receipt.json'),'pins':len(inputs),'sides':rows},indent=2))
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--outdir',type=Path,default=OUT);args=parser.parse_args();OUT=args.outdir.resolve()
 if not OUT.is_relative_to(ROOT/'output'):raise ValueError('Output must stay ignored')
 main()
