"""Exact production-native pilot for B's source-layer repair; no412/runtime write."""
from pathlib import Path
import argparse, hashlib, importlib.util, json, math
import numpy as np
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
SOURCE=ROOT/'output/baerbel-height/profile-leg-repair-v2'
OUT=ROOT/'output/street-redesign/baerbel-brezel-end-to-end/native-profile-repair-v2'
WORK=ROOT/'output/street-redesign/baerbel-brezel-end-to-end'
FOLDERS={
 'right':[(1,'right-strength1-01'),(.75,'right-stops-01-strength0.75'),(.5,'right-stops-01-strength0.5'),(.25,'right-stops-lower-01-strength0.25'),(0,'right-stops-lower-01-strength0.0')],
 'left':[(1,'left-strength1-02'),(.75,'left-stops-01-strength0.75'),(.5,'left-stops-01-strength0.5'),(.25,'left-stops-lower-02-strength0.25'),(0,'left-stops-lower-02-strength0.0')],
}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def run(args):
 folder=OUT/args.variant;assert not folder.exists(),'Preserve every native pilot attempt';folder.mkdir(parents=True)
 street=load('baerbel_profile_native_export_v2',ROOT/'tools/build-street-character-sprites.py')
 mouth=load('baerbel_profile_native_mouth_v2',ROOT/'tools/build-street-mouths.py')
 pilot=load('baerbel_profile_native_layers_v2',HERE/'profile-motion-v2.py')
 fits=json.loads((WORK/'adult-mouth-fit-v2/fit.json').read_text())
 w,h=(96,120) if args.variant=='desktop' else (64,80)
 q=w/128;scale=136*q/400;pivot=np.array([64*q,150*q])
 spec={'cell':[w,h],'pivot':pivot.tolist(),'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}}
 pins={}
 def pin(p):pins[p.relative_to(ROOT).as_posix()]=sha(p)
 for p in [Path(__file__),HERE/'profile-motion-v2.py',ROOT/'tools/build-street-character-sprites.py',ROOT/'tools/build-street-mouths.py',WORK/'adult-mouth-fit-v2/fit.json']:pin(p)
 report={'status':'EXACT_NATIVE_PROFILE_PILOT; source/encoded image review and actual game still required','variant':args.variant,'cell':[w,h],
  'inputPins':pins,'rows':[],'mouths':[],'newMotionSelection':False,'fullFamilyCellsChecked':0}
 atlas=Image.new('RGBA',(w*16,h*10));all_sources=[]
 for direction_index,heading in enumerate(['right','left']):
  neutral=street.export_cell(pilot.sources(heading)['neutral'],spec);neutral_floor=neutral.getchannel('A').getbbox()[3]
  for strength_index,(strength,subdir) in enumerate(FOLDERS[heading]):
   row=direction_index*5+strength_index;receipt=SOURCE/subdir/'report.json';pin(receipt)
   source_report=json.loads(receipt.read_text());assert source_report['heading']==heading and source_report['strength']==strength
   entries=[]
   for phase,source_record in enumerate(source_report['records']):
    source=ROOT/source_record['image']['file'];assert sha(source)==source_record['image']['sha256'];pin(source)
    with Image.open(source) as opened:rgba=opened.convert('RGBA');native=street.export_cell(rgba,spec)
    if strength==0:assert native.tobytes()==neutral.tobytes(),'All16 phase stops must equal actual new planted anchor'
    bounds=native.getchannel('A').getbbox();gutter=min(bounds[0],bounds[1],w-bounds[2],h-bounds[3]);assert gutter>=2
    assert bounds[3]<=neutral_floor,'No descent below own native planted floor'
    atlas.paste(native,(phase*w,row*h));all_sources.append((source,native.copy(),row,phase))
    entries.append({'phase':phase,'row':row,'col':phase,'source':source.relative_to(ROOT).as_posix(),'sourceSha256':sha(source),'minimumGutter':gutter,'alphaBounds':list(bounds),'bottomVsOwnNeutral':bounds[3]-neutral_floor})
   report['rows'].append({'heading':heading,'strength':strength,'cells':entries})
 path=folder/'profile-all-phases-and-stops.webp';atlas.save(path,lossless=True,exact=True,method=4);pin(path)
 with Image.open(path) as opened:decoded=opened.convert('RGBA')
 assert decoded.tobytes()==atlas.tobytes()
 for source,expected,row,phase in all_sources:
  actual=decoded.crop((phase*w,row*h,(phase+1)*w,(row+1)*h));assert actual.tobytes()==expected.tobytes()
 report['encoded']={'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'all160CellsDecodedSourceExportExact':True}
 for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
  for direction_index,heading in enumerate(['right','left']):
   # Full-strength sixteen real native body cells, ordered in two rows.
   board=Image.new('RGB',(8*w,2*h),bg)
   feet=Image.new('RGB',(8*w*3,2*36*3),bg)
   stops=Image.new('RGB',(8*w,10*h),bg)
   for strength_index in range(5):
    row=direction_index*5+strength_index
    for phase in range(16):
     cell=decoded.crop((phase*w,row*h,(phase+1)*w,(row+1)*h));flat=Image.alpha_composite(Image.new('RGBA',(w,h),bg),cell).convert('RGB')
     stops.paste(flat,((phase%8)*w,(strength_index*2+phase//8)*h))
     if strength_index==0:
      board.paste(flat,((phase%8)*w,(phase//8)*h))
      cut=flat.crop((0,h-36,w,h)).resize((w*3,108),Image.Resampling.NEAREST)
      feet.paste(cut,((phase%8)*w*3,(phase//8)*108));ImageDraw.Draw(feet).text(((phase%8)*w*3+4,(phase//8)*108+2),str(phase),fill='red')
   board.resize((board.width*2,board.height*2),Image.Resampling.NEAREST).save(folder/f'{heading}-16phase-native-{theme}.png')
   feet.save(folder/f'{heading}-16phase-native-feet-{theme}.png')
   stops.resize((stops.width*2,stops.height*2),Image.Resampling.NEAREST).save(folder/f'{heading}-all-stops-native-{theme}.png')
   for strength_index,(strength,_) in enumerate(FOLDERS[heading]):
    page=stops.crop((0,strength_index*2*h,8*w,(strength_index+1)*2*h))
    page.resize((page.width*2,page.height*2),Image.Resampling.NEAREST).save(folder/f'{heading}-strength{strength}-native-{theme}.png')
 mouths=Image.new('RGBA',(2*w,5*h));heads={theme:Image.new('RGB',(480,720),bg) for theme,bg in [('light','#eee8db'),('dark','#25272b')]}
 for i,heading in enumerate(['down','front-right','right','left','front-left']):
  source=HERE/'registered'/f'{heading}.png';pin(source)
  with Image.open(source) as opened:old=opened.convert('RGBA')
  current=pilot.sources(heading)['neutral'] if heading in ['right','left'] else old
  # Reuse the existing source-specific lip geometry only after exact pixels
  # of the actual mouth/face, not a whole-person hash bypass, match the fit.
  assert current.crop((185,85,330,160)).tobytes()==old.crop((185,85,330,160)).tobytes()
  closed=street.export_cell(current,spec);closed_path=folder/f'{heading}-closed.png';closed.save(closed_path);pin(closed_path)
  fit=fits['manualClosedLipFits'][heading];center=pivot+(np.array(fit['centerPx'])-[256,472])*scale;axes=np.array(fit['axesPx'])*scale
  reg={'rect':[center[0]/w,1-center[1]/h,float(np.linalg.norm(axes[:2]))/w,float(np.linalg.norm(axes[2:]))/h],'axes':axes.tolist(),'profile':fit['profile']}
  entry={'input':{'file':closed_path.relative_to(ROOT).as_posix()},'centerPx':center.tolist(),'axesPx':axes.tolist()}
  assert mouth.preview(entry,reg,0).tobytes()==closed.tobytes()
  opened=mouth.preview(entry,reg,1);assert opened.getchannel('A').tobytes()==closed.getchannel('A').tobytes()
  delta=np.asarray(opened)[:,:,:3].astype(int)-np.asarray(closed)[:,:,:3].astype(int);changed=np.any(delta!=0,axis=2);assert changed.any()
  opened_path=folder/f'{heading}-open.png';opened.save(opened_path);pin(opened_path)
  report['mouths'].append({'heading':heading,'originalFaceRgbaExact':True,'closedRgbaExact':True,'openAlphaExact':True,'changedRgbPixels':int(changed.sum()),'maximumRgbDelta':int(abs(delta).max()),'centerPx':center.tolist(),'axesPx':axes.tolist()})
  mouths.paste(closed,(0,i*h));mouths.paste(opened,(w,i*h))
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   for state,im in enumerate([closed,opened]):
    cx,cy=center;cut=im.crop((int(cx)-10,int(cy)-7,int(cx)+10,int(cy)+5))
    cut=Image.alpha_composite(Image.new('RGBA',(20,12),bg),cut).convert('RGB').resize((240,144),Image.Resampling.NEAREST)
    heads[theme].paste(cut,(state*240,i*144))
 mouth_path=folder/'mouth-endpoints.webp';mouths.save(mouth_path,lossless=True,exact=True,method=4)
 with Image.open(mouth_path) as opened:assert opened.convert('RGBA').tobytes()==mouths.tobytes()
 for theme,board in heads.items():board.save(folder/f'lip-pixels-{theme}.png')
 report['mouthEncoded']={'file':mouth_path.relative_to(ROOT).as_posix(),'sha256':sha(mouth_path),'decodedExact':True}
 assert all(sha(ROOT/p)==digest for p,digest in pins.items())
 (folder/'report.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'variant':args.variant,'bodyCells':len(all_sources),'decodedExact':True,'minimumGutter':min(c['minimumGutter'] for r in report['rows'] for c in r['cells']),'mouths':report['mouths']}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--variant',required=True,choices=['desktop','mobile']);run(p.parse_args())
