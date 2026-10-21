"""Renate-only neutral lip traces; SOURCE candidate, never motion/runtime output."""
from pathlib import Path
import hashlib, importlib.util, json, math, sys
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/renate-termin-neutral-mouths-v1'
ALL=['down','front-right','right','rear-right','up','rear-left','left','front-left']
VISIBLE=['down','front-right','right','left','front-left']
NAMES=['crease','open_upper','open_lower','source_upper','source_lower']

# Independently traced on each exact input's native enlarged pixels. No other
# identity's profile or cavity is used. Apertures are proposed bounded local lip
# displacement, not a claim that the closed source contains a painted cavity.
MEASURED={
 'down':{'crease':[[239.5,205],[249.75,202.8],[260,203.4],[270.25,203],[280.5,205]],'normal':5.0,
   'upper':[0,.4,.8,.5,0],'lower':[0,2.1,3.1,2.2,0],'guard':196},
 'front-right':{'crease':[[260,203.7],[268.4,201.3],[276.8,200.5],[285.2,200.4],[293.6,202.6]],'normal':4.5,
   'upper':[0,.35,.7,.45,0],'lower':[0,1.8,2.8,1.9,0],'guard':193},
 'right':{'crease':[[313,207],[317.6,205.9],[322.2,204.6],[326.8,204.3],[331.4,204.1]],'normal':4.4,
   'upper':[0,.4,.65,.4,0],'lower':[0,1.5,2.5,1.5,0],'guard':197},
 'left':{'crease':[[179.6,204.1],[184,204],[188.4,205.2],[192.8,206.1],[197.2,207.5]],'normal':4.4,
   'upper':[0,.3,.6,.4,0],'lower':[0,1.4,2.4,1.6,0],'guard':196},
 'front-left':{'crease':[[199.6,202.9],[205.4,201.7],[211.2,202.7],[217,204.2],[222.8,205.5]],'normal':4.5,
   'upper':[0,.35,.7,.45,0],'lower':[0,1.6,2.4,1.7,0],'guard':194},
 'standing':{'crease':[[59,61.4],[61.75,61.3],[64.5,61.7],[67.25,61.3],[70,61.4]],'normal':1.8,
   'upper':[0,.12,.2,.12,0],'lower':[0,.5,.75,.5,0],'guard':58},
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
     'upstreamFile':row['file'] if name=='standing' else 'assets/sprite-sources/street-residents/stadt-renate-termin-directions-candidate.png' if name in ['down','right','left'] else 'assets/sprite-sources/resident-motion/stadt-renate-termin/turns-and-leg-components-candidate.png'},
  'fitEvidence':{'status':'SOURCE-only candidate pending independent review and body registration acceptance',
     'observation':'Closed dark/red lip crease, compressed downturn; no exposed teeth or confirmed pre-open cavity.',
     'sourceUpperLower':'equal measured own closed crease; no inferred hidden cavity',
     'protectedRowsExclusive':m['guard'],'widthControls':'zero; round/spread/bite visual coverage NOT RUN'}}

def check_images(source,closed,opened,guard):
 a=np.asarray(source);z=np.asarray(closed);o=np.asarray(opened);zero=np.count_nonzero(np.any(a!=z,axis=2));alpha=np.count_nonzero(a[:,:,3]!=o[:,:,3]);protected=np.count_nonzero(np.any(a[:guard]!=o[:guard],axis=2));changes=np.any(a!=o,axis=2);ys,xs=np.where(changes)
 if zero or alpha or protected:raise ValueError(f'Closed/alpha/protected change: {zero}/{alpha}/{protected}')
 return {'ownedClosedChangedPixels':int(zero),'openAlphaChangedPixels':int(alpha),'protectedUpperChangedPixels':int(protected),
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
 pins=check_pins();OUT.mkdir(exist_ok=True);mouths=module('renate_mouth_helper',ROOT/'tools/build-street-mouths.py');street=module('renate_export_helper',ROOT/'tools/build-street-character-sprites.py')
 export_helper={'file':'tools/build-street-character-sprites.py','sha256':sha(ROOT/'tools/build-street-character-sprites.py')}
 # The body recipe may change lower-body masks in parallel. Only the pinned
 # neutral bytes bind these fits; retain its current hash as context, not a new
 # approval or an automatic reason to refit an unchanged face.
 recipe=ROOT/'assets/sprite-sources/resident-motion/stadt-renate-termin/source-fit-v1.json'
 profiles={n:entry(n,pins) if n in VISIBLE else None for n in ALL};profiles['standing']=entry('standing',pins)
 data={'schemaVersion':1,'identity':'stadt-renate-termin','status':'SOURCE-only candidate; independent lip/body registration review pending',
  'inputPinsSha256':sha(HERE/'input-pins.json'),'helper':{'file':'tools/build-street-mouths.py','sha256':sha(ROOT/'tools/build-street-mouths.py')},
  'bodyRecipeContext':{'file':recipe.relative_to(ROOT).as_posix(),'sha256':sha(recipe),'neutralAuthority':'exact input-pins.json; lower moving-body edits are not mouth transport'},
  'directPreviewCalibration':{'file':'output/ambient-city-animation/renate-termin-source-gate-v1/standing-calibration-root.json',
    'sha256':sha(ROOT/'output/ambient-city-animation/renate-termin-source-gate-v1/standing-calibration-root.json'),
    'paintFigureHeightCanonical':132,'logicalFigureHeightCanonical':136,'paintFigureHeightsDirect':{'96x120':99,'64x80':66},
    'status':'root source-size diagnostic; body/source registration acceptance remains separate'},
  'mouthVisible':VISIBLE,'explicitNull':['rear-right','up','rear-left'],'registrations':profiles}
 # Bind upstream original image hashes without copying any source bitmap.
 for e in profiles.values():
  if e:e['nativeSource']['upstreamSha256']=sha(ROOT/e['nativeSource']['upstreamFile'])
 (HERE/'profiles.json').write_text(json.dumps(data,indent=2)+'\n')
 compiled={};checks={};direct={}
 for name,e in profiles.items():
  if e is None:compiled[name]=None;continue
  reg=mouths.compile_registration(e);compiled[name]=reg;im=Image.open(ROOT/e['input']['file']).convert('RGBA');closed=mouths.preview(e,reg,0);opened=mouths.preview(e,reg,1);checks[name]=check_images(im,closed,opened,MEASURED[name]['guard']);mouths.review_board('stadt-renate-termin',name,e,reg,OUT)
  # The shared generic legend calls source contours a cavity. These particular
  # sources are closed lips, so label the generated review evidence accurately.
  for theme,bg,ink in [('light','#eee8db','#222'),('dark','#25272b','#eee8db')]:
   path=OUT/(name+'-'+theme+'.png');board=Image.open(path).convert('RGB');draw=ImageDraw.Draw(board);draw.rectangle((0,0,board.width,24),fill=bg);draw.text((5,5),name+' | SOURCE CANDIDATE | source bounds equal own CLOSED crease; green proposed limits; no teeth',font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',12),fill=ink);board.save(path)
  for label,pic in [('source',im),('closed',closed),('open',opened)]:pic.save(OUT/f'{name}-{label}-native.png')
  if name=='standing':continue
  # Root's separate standing calibration matches source paint132 to the
  # shipped bbox. Logical figure136/pivot150 remains a different contract.
  # Prior direct102/68 files remain untouched historical136-paint evidence.
  for w,h,figure in [(96,120,99),(64,80,66)]:
   target=OUT/f'direct-paint132-{w}x{h}';target.mkdir(exist_ok=True);s=figure/400;origin=np.array([w/2-256*s,h*150/160-472*s]);spec={'working':{'figureHeight':400,'baseline':472},'cell':[w,h],'pivot':[w/2,h*150/160],'figureHeight':figure};cell=street.export_cell(im,spec);path=target/f'{name}-source.png';cell.save(path)
   ce={**e,'input':bound(path),'cell':[w,h],'centerPx':(np.array(e['centerPx'])*s+origin).tolist(),'axesPx':(np.array(e['axesPx'])*s).tolist(),'contoursPx':{k:(np.array(v)*s+origin).tolist()for k,v in e['contoursPx'].items()}}
   cr=mouths.compile_registration(ce);cz=mouths.preview(ce,cr,0);co=mouths.preview(ce,cr,1);key=f'{name}-paint132-{w}x{h}';direct[key]={'registration':cr,'checks':check_images(cell,cz,co,0),'paintFigureHeightCanonical':132,'directPaintFigureHeight':figure,'logicalFigureHeightCanonical':136}
   cz.save(target/f'{name}-closed.png');co.save(target/f'{name}-open.png');crop_board(name,cell,cz,co,ce,target)
 (HERE/'compiled.json').write_text(json.dumps({'status':'SOURCE-only static candidate, not runtime or motion metadata','profilesSha256':sha(HERE/'profiles.json'),'registrations':compiled},indent=2)+'\n')
 (OUT/'direct-size-registrations.json').write_text(json.dumps(direct,indent=2)+'\n')
 after=check_pins();(OUT/'pins-after.json').write_text(json.dumps(after,indent=2)+'\n')
 report={'status':'SOURCE-only candidate; numeric checks are not independent visual acceptance','nativeChecks':checks,'directSizeChecks':{k:v['checks']for k,v in direct.items()},'pinsBeforeAfterExact':True,'neutralInputs':8,'directStandingInputs':1,'visibleRegistrations':6,'explicitNullHeadings':3,
  'helperSha256':sha(ROOT/'tools/build-street-mouths.py'),'exportHelper':export_helper,'notRun':['round/spread/bite cue components (scalar-only offline preview; own width0,teeth0)','GPU/browser/native media','walking/stop/turn/gesture mouth transport','final lossy encoded atlas or runtime manifest','physical device/listening']}
 (OUT/'checks.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))

if __name__=='__main__':main()
