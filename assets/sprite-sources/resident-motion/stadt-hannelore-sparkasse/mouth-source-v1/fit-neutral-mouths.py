"""Hannelore-only neutral lip traces; SOURCE candidate, never motion/runtime output."""
from pathlib import Path
import hashlib, importlib.util, json, math, sys
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/hannelore-sparkasse-neutral-mouths-v1'
ALL=['down','front-right','right','rear-right','up','rear-left','left','front-left']
VISIBLE=['down','front-right','right','rear-right','rear-left','left','front-left']
NAMES=['crease','open_upper','open_lower','source_upper','source_lower']

# Independently traced on each exact input's native enlarged pixels. No other
# identity's profile or cavity is used. Apertures are proposed bounded local lip
# displacement, not a claim that the closed source contains a painted cavity.
MEASURED={
 'down':{'crease':[[246.5,216.5],[256,215.25],[265.5,215.65],[275,215.5],[284.5,216.7]],'normal':5.3,'upper':[0,.45,.75,.5,0],'lower':[0,2.2,3.2,2.25,0],'guard':207},
 'front-right':{'crease':[[281.5,216.5],[287.375,215.1],[293.25,213.8],[299.125,213.15],[305,215.4]],'normal':5.0,'upper':[0,.45,.7,.4,0],'lower':[0,1.9,2.9,1.8,0],'guard':204},
 'right':{'crease':[[298.5,212.6],[302.875,211.65],[307.25,210.4],[311.625,210.3],[316,210.2]],'normal':4.5,'upper':[0,.3,.55,.35,0],'lower':[0,1.5,2.4,1.45,0],'guard':201},
 'rear-right':{'crease':[[305.5,213.6],[308.3,212.2],[311.1,211.8],[313.9,210.8],[316.7,209.5]],'normal':3.7,'upper':[0,.2,.35,.2,0],'lower':[0,1.1,1.8,1.05,0],'guard':201},
 'left':{'crease':[[190,208.7],[195.5,209],[201,210.1],[206.5,211.1],[212,212.3]],'normal':4.5,'upper':[0,.3,.55,.35,0],'lower':[0,1.45,2.3,1.5,0],'guard':200},
 'rear-left':{'crease':[[188.4,209.5],[190.8,210.9],[193.2,212],[195.6,212.5],[198,214.2]],'normal':3.4,'upper':[0,.2,.3,.2,0],'lower':[0,.95,1.55,1,0],'guard':201},
 'front-left':{'crease':[[211,213.1],[218.8,212.5],[226.6,212.6],[234.4,213.8],[242.2,215.3]],'normal':5.2,'upper':[0,.5,.8,.45,0],'lower':[0,2.15,3.15,2,0],'guard':203},
 'standing':{'crease':[[61.5,62.4],[63.525,62.15],[65.55,62.45],[67.575,62.2],[69.6,62.5]],'normal':1.7,'upper':[0,.12,.2,.12,0],'lower':[0,.5,.75,.5,0],'guard':59},
}

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def check_pins():
 rows=json.loads((HERE/'input-pins.json').read_text())['rows']
 for row in rows:
  p=ROOT/row['file']
  if sha(p)!=row['sha256'] or list(Image.open(p).size)!=row['dimensions']:
   raise ValueError('STOP: changed pinned neutral/standing input; rebind requires direct review: '+row['file'])
 return rows
def bound(path):return {'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':list(Image.open(path).size)}
def entry(name,pins):
 row=next(p for p in pins if p['file'].endswith('standing.webp' if name=='standing' else f'/{name}-registered.png'))
 m=MEASURED[name];crease=np.array(m['crease'],float);tangent=crease[-1]-crease[0];normal=np.array([-tangent[1],tangent[0]])/np.linalg.norm(tangent)*m['normal'];centre=(crease[-1]+crease[0])/2
 contours={'crease':crease.tolist(),'source_upper':crease.tolist(),'source_lower':crease.tolist()}
 for key,offset,sign in [('open_upper','upper',-1),('open_lower','lower',1)]:
  contours[key]=(crease+np.array(m[offset])[:,None]*normal[None,:]/np.linalg.norm(normal)*sign).round(6).tolist()
 return {'input':row,'cell':row['dimensions'],'cellOriginPx':[0,0],'registeredView':name,
  'coordinateSystem':'native input pixels; +X right,+Y down; tangent and normal physical pixels',
  'centerPx':centre.tolist(),'axesPx':np.r_[tangent,normal].tolist(),'contoursPx':contours,'width':[0,0],'teeth':0,
  'nativeSource':{'role':'direct original encoded standing' if name=='standing' else 'exact registered neutral; no walking transport',
     'upstreamFile':row['file'] if name=='standing' else 'assets/sprite-sources/street-residents/stadt-hannelore-sparkasse-directions-candidate.png' if name in ['down','right','left'] else 'assets/sprite-sources/resident-motion/stadt-hannelore-sparkasse/frontright-and-leg-components-candidate.png' if name=='front-right' else 'assets/sprite-sources/resident-motion/stadt-hannelore-sparkasse/motion-poses-candidate.png'},
  'fitEvidence':{'status':'SOURCE-only candidate pending independent lip review; accepted neutral body images unchanged',
     'observation':'Own closed dark/red lip crease; no exposed teeth or confirmed pre-open cavity. Rear quarters have a short visible near-side lip, with far-side anatomy hidden and unregistered.',
     'sourceUpperLower':'equal measured own closed crease; no inferred hidden cavity',
     'protectedRowsExclusive':m['guard'],'widthControls':'zero; round/spread/bite visual coverage NOT RUN'}}

def check_images(source,closed,opened,guard):
 a=np.asarray(source);z=np.asarray(closed);o=np.asarray(opened);zero=np.count_nonzero(np.any(a!=z,axis=2));alpha=np.count_nonzero(a[:,:,3]!=o[:,:,3]);protected=np.count_nonzero(np.any(a[:guard]!=o[:guard],axis=2));changes=np.any(a!=o,axis=2);ys,xs=np.where(changes)
 if zero or alpha or protected:raise ValueError(f'Closed/alpha/protected change: {zero}/{alpha}/{protected}')
 return {'ownedClosedChangedPixels':int(zero),'openAlphaChangedPixels':int(alpha),'protectedRowsExclusive':guard,'protectedUpperChangedPixels':int(protected),
    'openChangedPixels':int(np.count_nonzero(changes)),'openChangedBoundsXYXY':None if not len(xs) else [int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]}

def crop_board(name,source,closed,opened,e,folder):
 centre=np.array(e['centerPx']);tangent=np.array(e['axesPx'][:2]);normal=np.array(e['axesPx'][2:]);rx=max(7,math.ceil(np.linalg.norm(tangent)*.85));ry=max(6,math.ceil(np.linalg.norm(normal)*2.3));box=(max(0,int(centre[0])-rx),max(0,int(centre[1])-ry),min(source.width,int(centre[0])+rx+1),min(source.height,int(centre[1])+ry+1))
 font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',12)
 for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
  w=box[2]-box[0];h=box[3]-box[1];scale=8;board=Image.new('RGB',((w*scale+12)*3,h*scale+68),bg);d=ImageDraw.Draw(board);ink='#eee8db' if theme=='dark' else '#222'
  d.text((4,3),name+' | SOURCE-only direct-cell CPU candidate',font=font,fill=ink)
  for i,(title,im) in enumerate([('source',source),('owned zero',closed),('max open',opened)]):
   native=im.crop(box);tile=Image.new('RGBA',native.size,bg);tile.alpha_composite(native);tile=tile.resize((w*scale,h*scale),Image.Resampling.NEAREST);x=i*(w*scale+12);board.paste(tile,(x,56));d.text((x,22),title,font=font,fill=ink);d.text((x,39),f'xy{box[0]},{box[1]}',font=font,fill=ink)
  board.save(folder/(name+'-'+theme+'.png'))

def main():
 pins=check_pins();OUT.mkdir(parents=True,exist_ok=True);(OUT/'pins-before.json').write_text(json.dumps(pins,indent=2)+'\n');mouths=module('hannelore_mouth_helper',ROOT/'tools/build-street-mouths.py');street=module('hannelore_export_helper',ROOT/'tools/build-street-character-sprites.py')
 export_helper={'file':'tools/build-street-character-sprites.py','sha256':sha(ROOT/'tools/build-street-character-sprites.py')}
 profiles={n:entry(n,pins) if n in VISIBLE else None for n in ALL};profiles['standing']=entry('standing',pins)
 calibration=ROOT/'assets/sprite-sources/resident-motion/stadt-hannelore-sparkasse/neutral-source-v1/registration-receipt.json'
 data={'schemaVersion':1,'identity':'stadt-hannelore-sparkasse','status':'SOURCE-only mouth candidate; independent lip review pending; leg components remain held',
  'inputPinsSha256':sha(HERE/'input-pins.json'),'helper':{'file':'tools/build-street-mouths.py','sha256':sha(ROOT/'tools/build-street-mouths.py')},
  'neutralPacket':{'file':calibration.relative_to(ROOT).as_posix(),'sha256':sha(calibration),'authority':'accepted eight exact neutral image bytes; no walking or head transport'},
  'directPreviewCalibration':{'paintFigureHeightCanonical':137,'logicalFigureHeightCanonical':136,'paintFigureHeightsDirect':{'96x120':102.75,'64x80':68.5},'figureWorldHeight':1.6,'status':'own accepted neutral paint137 calibration; no world scale change'},
  'mouthVisible':VISIBLE,'explicitNull':['up'],'nullReason':{'up':'actual rear hair/head; no painted lip visible'},'registrations':profiles}
 # Bind upstream original image hashes without copying any source bitmap.
 for e in profiles.values():
  if e:e['nativeSource']['upstreamSha256']=sha(ROOT/e['nativeSource']['upstreamFile'])
 (HERE/'profiles.json').write_text(json.dumps(data,indent=2)+'\n')
 compiled={};checks={};direct={}
 for name,e in profiles.items():
  if e is None:compiled[name]=None;continue
  reg=mouths.compile_registration(e);compiled[name]=reg;im=Image.open(ROOT/e['input']['file']).convert('RGBA');closed=mouths.preview(e,reg,0);opened=mouths.preview(e,reg,1);checks[name]=check_images(im,closed,opened,MEASURED[name]['guard']);mouths.review_board('stadt-hannelore-sparkasse',name,e,reg,OUT)
  # The shared generic legend calls source contours a cavity. These particular
  # sources are closed lips, so label the generated review evidence accurately.
  for theme,bg,ink in [('light','#eee8db','#222'),('dark','#25272b','#eee8db')]:
   path=OUT/(name+'-'+theme+'.png');board=Image.open(path).convert('RGB');draw=ImageDraw.Draw(board);draw.rectangle((0,0,board.width,24),fill=bg);draw.text((5,5),name+' | SOURCE CANDIDATE | source bounds equal own CLOSED crease; green proposed limits; no teeth',font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',12),fill=ink);board.save(path)
  for label,pic in [('source',im),('closed',closed),('open',opened)]:pic.save(OUT/f'{name}-{label}-native.png')
  native_crops=OUT/'native-crops';native_crops.mkdir(exist_ok=True);crop_board(name,im,closed,opened,e,native_crops)
  if name=='standing':continue
  # Own accepted neutral paint137 export, distinct from nominal136/world1.6.
  for w,h,figure in [(96,120,102.75),(64,80,68.5)]:
   target=OUT/f'direct-paint137-{w}x{h}';target.mkdir(exist_ok=True);s=figure/400;origin=np.array([w/2-256*s,h*150/160-472*s]);spec={'working':{'figureHeight':400,'baseline':472},'cell':[w,h],'pivot':[w/2,h*150/160],'figureHeight':figure};cell=street.export_cell(im,spec);path=target/f'{name}-source.png';cell.save(path)
   ce={**e,'input':bound(path),'cell':[w,h],'centerPx':(np.array(e['centerPx'])*s+origin).tolist(),'axesPx':(np.array(e['axesPx'])*s).tolist(),'contoursPx':{k:(np.array(v)*s+origin).tolist()for k,v in e['contoursPx'].items()}}
   cr=mouths.compile_registration(ce);cz=mouths.preview(ce,cr,0);co=mouths.preview(ce,cr,1);key=f'{name}-paint137-{w}x{h}';direct[key]={'registration':cr,'checks':check_images(cell,cz,co,max(0,math.floor(MEASURED[name]['guard']*s+origin[1]))),'paintFigureHeightCanonical':137,'directPaintFigureHeight':figure,'logicalFigureHeightCanonical':136}
   cz.save(target/f'{name}-closed.png');co.save(target/f'{name}-open.png');crop_board(name,cell,cz,co,ce,target)
 for folder,names in [(OUT/'native-crops',VISIBLE+['standing'])]+[(OUT/f'direct-paint137-{w}x{h}',VISIBLE)for w,h in [(96,120),(64,80)]]:
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   panels=[Image.open(folder/f'{n}-{theme}.png').convert('RGB')for n in names];board=Image.new('RGB',(max(p.width for p in panels),sum(p.height+8 for p in panels)),bg);y=0
   for panel in panels:board.paste(panel,(0,y));y+=panel.height+8
   board.save(folder/f'all-mouth-crops-{theme}.png')
 (HERE/'compiled.json').write_text(json.dumps({'status':'SOURCE-only static candidate, not runtime or motion metadata','profilesSha256':sha(HERE/'profiles.json'),'registrations':compiled},indent=2)+'\n')
 (OUT/'direct-size-registrations.json').write_text(json.dumps(direct,indent=2)+'\n')
 after=check_pins();(OUT/'pins-after.json').write_text(json.dumps(after,indent=2)+'\n')
 report={'status':'SOURCE-only candidate; numeric checks are not independent visual acceptance','nativeChecks':checks,'directSizeChecks':{k:v['checks']for k,v in direct.items()},'pinsBeforeAfterExact':True,'neutralInputs':8,'directStandingInputs':1,'visibleRegistrations':8,'explicitNullHeadings':1,
  'helperSha256':sha(ROOT/'tools/build-street-mouths.py'),'exportHelper':export_helper,'notRun':['round/spread/bite cue components (scalar-only offline preview; own width0,teeth0)','GPU/browser/native media','walking/stop/turn/gesture mouth transport','final lossy encoded atlas or runtime manifest','physical device/listening']}
 (OUT/'checks.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))

if __name__=='__main__':main()
