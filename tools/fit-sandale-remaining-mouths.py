"""Source-only final-pixel Sandale lip candidates; never activate or repaint bodies."""
from pathlib import Path
import argparse, copy, hashlib, importlib.util, json, math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import map_coordinates
from scipy.optimize import least_squares
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/ambient-city-animation/sandale-mouth-remaining'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
FONT=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',12)
# Own final-cell measurements: center, visible seam width, tangent angle, own native lip family.
# They are source authoring coordinates, not inferred from angle labels or eye/nose detectors.
MAN_TURNS=[(97,78,14,0,'down'),(102,77.5,14,0,'down'),(109,78.5,13,2,'right'),(116.5,79,9,-8,'right'),(113,80,9,-2,'right'),(75.5,79,6.5,10,'left'),(77.5,78.5,8,3,'left'),(82.5,79,10,3,'left'),(83.5,78.5,12,0,'left'),(87,78,13,0,'left')]
WOMAN_TURNS=[(99,75,12,0,'down'),(104,74,11,0,'down'),(110,75,10,0,'right'),(113,76,6.5,-3,'right'),(110,78,6.5,0,'right'),(75.5,75.5,3.5,0,'left'),(79,75.5,5,0,'left'),(80.5,75,6.5,0,'left'),(82.5,74,8,0,'left'),(86,76,10,0,'left')]
MAN_LOOK=[(97,66,12,0,'down'),(120,71,8,-17,'right'),(119,76,9,-8,'right'),(120,78,10,-4,'right'),(121,80,10,0,'right'),(118,83,10,-5,'right'),(111,87,11,-8,'right'),(101,91,13,0,'down'),(96,97,12,0,'down'),(80,98,9,9,'left'),(80,96,9,8,'left'),(79,90,10,3,'left'),(79,81,10,0,'left'),(80,75,10,10,'left'),(81,68,10,15,'left'),(94,64,12,0,'down')]
WOMAN_LOOK=[(99,61.5,11,0,'down'),(111,66,8,-8,'right'),(113,68.5,8,-5,'right'),(114,71,8,0,'right'),(115,73.5,8,0,'right'),(115,76,9,0,'right'),(113,79,9,0,'right'),(111,83,9,2,'right'),(100,90,10,0,'down'),(90,88,9,-4,'left'),(81,87,8,-4,'left'),(79,82.5,7,0,'left'),(80,76,7,0,'left'),(81,68,7,5,'left'),(83,61.5,8,8,'left'),(99,56,10,0,'down')]
# Direct traces supersede misleading RGB correspondences at strong head pitch.
# Slot 18:0 is intentionally absent: its independently reviewed pilot is retained.
DIRECT_LOOK={
 'towelMan':{0:(97.5,68,14,0,'down'),1:(120,73.5,8,-8,'right'),2:(118.5,76.5,8.5,-5,'right'),3:(118.5,77.5,9,-3,'right'),4:(118,78.5,9.5,0,'right'),5:(113,85,10,0,'right'),6:(104,90,11,-3,'right'),7:(98,93,12,0,'down'),9:(84,97,9,3,'left'),10:(78,96,9,3,'left'),11:(76.5,91,9,0,'left'),12:(73.5,82.5,8.5,0,'left'),13:(76,78.5,8.5,3,'left'),14:(77,76,8,3,'left'),15:(85.5,69.5,11,0,'down')},
 'towelWoman':{0:(99,61.5,10,0,'down'),1:(111,65.5,8,-6,'right'),2:(112,66.5,8,-4,'right'),3:(113,68.5,7,0,'right'),4:(114,69.5,7,0,'right'),5:(114,72.5,8,0,'right'),6:(113,76.5,8,0,'right'),7:(111,79.5,8,2,'right'),9:(82.5,87,8,-3,'left'),10:(82,85.5,8,-3,'left'),11:(77,79.5,7,0,'left'),12:(74,74.5,7,0,'left'),13:(76,65,7,4,'left'),14:(77,60.5,8,5,'left'),15:(98,56,10,0,'down')}
}
# Local reaction search starts are manually bounded by the observed own action/head pose.
MAN_REACTIONS={10:[(97,78),(97,75),(97,81),(97,77),(97,85),(97,79)],11:[(97,82)]*4,12:[(97,91),(97,69),(97,42),(97,69),(97,91)],13:[(97,82),(97,96),(97,104),(97,108),(97,108),(97,104),(97,90),(97,83)],14:[(97,80),(99,78),(97,81),(97,85),(97,81),(97,81)],15:[(97,80),(97,80),(99,78),(97,84),(97,80),(97,80)],16:[(97,86),(103,80),(97,85),(93,81),(97,85),(97,86)]}
WOMAN_REACTIONS={10:[(99,75),(99,72),(99,72),(99,75),(99,76),(99,75)],11:[(99,77)]*4,12:[(99,81),(99,67),(99,52),(99,67),(99,81)],13:[(99,76),(99,78),(99,82),(99,84),(99,82),(99,80),(99,75),(99,76)],14:[(99,76),(101,77),(99,76),(99,77),(99,76),(99,76)],15:[(99,76),(99,76),(100,76),(99,77),(99,76),(99,76)],16:[(99,76),(101,78),(97,78),(99,78),(99,74),(99,75)]}


def compiler_module():
 spec=importlib.util.spec_from_file_location('sandale_lip_compiler',ROOT/'tools/build-street-mouths.py');m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m);return m


class SourceImageCache:
 """Reuse the checked source decode for CPU boards; compiler still owns paint."""
 def __init__(self,path,image):self.path=path.resolve();self.image=image
 def open(self,path,*args,**kwargs):return self.image if Path(path).resolve()==self.path else Image.open(path,*args,**kwargs)
 def __getattr__(self,name):return getattr(Image,name)


def own_seed(native,row,col,measurement,ident,normal=3,aperture=1):
 cx,cy,width,angle,family=measurement;base=copy.deepcopy(native[family]);reference=np.array(base['centerPx']);old=np.array(base['axesPx']).reshape(2,2).T;theta=math.radians(angle);rotation=np.array([[math.cos(theta),-math.sin(theta)],[math.sin(theta),math.cos(theta)]]);transform=rotation@np.diag([width/np.linalg.norm(old[:,0]),normal/np.linalg.norm(old[:,1])]);origin=np.array([col*192,row*208]);center=np.array([cx,cy])+origin
 contours={name:((np.array(points)-reference)@transform.T+center).tolist() for name,points in base['contoursPx'].items()}
 for name in ['open_upper','open_lower']:
  contours[name]=(np.array(contours['crease'])+(np.array(contours[name])-np.array(contours['crease']))*aperture).tolist()
 base.update(cellOriginPx=origin.tolist(),centerPx=center.tolist(),axesPx=(transform@old).T.ravel().tolist(),contoursPx=contours,nativeSource={'pose':f'own-{row}:{col}','referenceCell':[row,col],'lipFamily':family,'measurement':'Own final PNG corner/seam placement; both axes transported in local pixel basis'},sourceAppearance='closed painted seam; no separate pre-open cavity resolved in this own-cell pilot',status='UNREVIEWED own-cell source candidate; no authored deformation replay, GPU, media or runtime binding')
 return base


def align(reference,target,reference_center,guess,angle=0):
 center=np.array(reference_center);guess=np.array(guess,float);yy,xx=np.mgrid[int(center[1])-10:int(center[1])+5,int(center[0])-9:int(center[0])+10];relative=np.stack([xx.ravel(),yy.ravel()],1)-center;values=reference[yy.ravel(),xx.ravel(),:3].astype(float);theta=math.radians(angle);rotation=np.array([[math.cos(theta),-math.sin(theta)],[math.sin(theta),math.cos(theta)]])
 def unpack(p):return rotation@np.array([[p[0],p[1]],[p[2],p[3]]]),guess+p[4:6]
 def residual(p):
  matrix,c=unpack(p);q=relative@matrix.T+c;sample=np.stack([map_coordinates(target[:,:,k],[q[:,1],q[:,0]],order=1,mode='nearest')for k in range(3)],1);return(sample-values).ravel()
 coarse=min((float(np.mean(residual(np.array([1,0,0,1,x,y]))**2)),x,y)for x in range(-4,5)for y in range(-6,7));fit=least_squares(residual,[1,0,0,1,coarse[1],coarse[2]],bounds=([.82,-.15,-.15,.82,-4,-6],[1.18,.15,.15,1.18,4,6]),loss='soft_l1',f_scale=8,max_nfev=80);matrix,c=unpack(fit.x)
 return matrix,c,{'rgbRMSE':float(np.mean(residual(fit.x)**2)**.5),'solverConverged':bool(fit.success),'evaluations':int(fit.nfev),'matrix':matrix.tolist(),'translationFromManualGuess':(c-guess).tolist(),'determinant':float(np.linalg.det(matrix)),'scope':'RGB alignment/convergence diagnostic only, not anatomical acceptance'}


def fit_reaction(native,atlas,row,col,guess,ident):
 seed=native['down'];origin0=np.array(seed['cellOriginPx']);center0=np.array(seed['centerPx'])-origin0;sx,sy=origin0.astype(int);reference=atlas[sy:sy+208,sx:sx+192];target=atlas[row*208:(row+1)*208,col*192:(col+1)*192];angle={('towelMan',14,1):-19,('towelMan',15,2):-18,('towelMan',16,1):-16,('towelMan',16,3):17,('towelWoman',14,1):-7,('towelWoman',15,2):-5,('towelWoman',16,1):-7,('towelWoman',16,3):5}.get((ident,row,col),0)
 # Bowed head extrema and hand-near-chin are independently measured action seeds.
 if (row==13 and col in [2,3,4,5]) or (row==15 and col in [0,1,2,3,4]):
  normal=1.8 if row==15 else 2.3;aperture=.55 if row==15 else .8;entry=own_seed(native,row,col,(*guess,14 if ident=='towelMan' else 12,angle,'down'),ident,normal,aperture)
  return entry,{'row':row,'col':col,'method':'manual own action lip seed, no RGB solve','guard':'small opening/normal collar protects nearby hand'if row==15 else 'own bowed source seam'}
 matrix,center,diagnostic=align(reference,target,center0,guess,angle);origin=np.array([col*192,row*208]);entry=copy.deepcopy(seed);entry.update(cellOriginPx=origin.tolist(),centerPx=(center+origin).tolist(),axesPx=(matrix@np.array(seed['axesPx']).reshape(2,2).T).T.ravel().tolist(),contoursPx={k:((np.array(v)-np.array(seed['centerPx']))@matrix.T+center+origin).tolist()for k,v in seed['contoursPx'].items()},nativeSource={'pose':f'action-{row}:{col}','referenceCell':[0,0],'manualTargetGuess':list(guess),'manualHeadTangentDegrees':angle},sourceAppearance='closed source seam; zero preview must reproduce exact own-cell RGBA',status='UNREVIEWED bounded final-pixel alignment; not original authored-field replay')
 return entry,{'row':row,'col':col,'method':'manual bounded own action RGB alignment',**diagnostic}


def refine_own_seed(entry,native,atlas):
 """Bounded correspondence of the already selected own lip patch, not detection."""
 family=entry['nativeSource'].get('lipFamily','down');base=native[family];origin0=np.array(base['cellOriginPx']);refcenter=np.array(base['centerPx'])-origin0;sx,sy=origin0.astype(int);reference=atlas[sy:sy+208,sx:sx+192];origin=np.array(entry['cellOriginPx']);tx,ty=origin.astype(int);target=atlas[ty:ty+208,tx:tx+192];center=np.array(entry['centerPx'])-origin;old_axes=np.array(entry['axesPx']).reshape(2,2).T;base_axes=np.array(base['axesPx']).reshape(2,2).T;initial=np.column_stack([old_axes[:,0]/np.linalg.norm(base_axes[:,0]),old_axes[:,1]/np.linalg.norm(old_axes[:,1])])
 yy,xx=np.mgrid[int(refcenter[1])-5:int(refcenter[1])+6,int(refcenter[0])-7:int(refcenter[0])+8];relative=np.stack([xx.ravel(),yy.ravel()],1)-refcenter;values=reference[yy.ravel(),xx.ravel(),:3].astype(float)
 def unpack(p):return np.array([[p[0],p[1]],[p[2],p[3]]])@initial,center+p[4:6]
 def residual(p):
  matrix,c=unpack(p);q=relative@matrix.T+c;sample=np.stack([map_coordinates(target[:,:,k],[q[:,1],q[:,0]],order=1,mode='nearest')for k in range(3)],1);return(sample-values).ravel()
 coarse=min((float(np.mean(residual(np.array([1,0,0,1,x,y]))**2)),x,y)for x in range(-4,5)for y in range(-4,5));fit=least_squares(residual,[1,0,0,1,coarse[1],coarse[2]],bounds=([.92,-.1,-.1,.92,-4,-4],[1.08,.1,.1,1.08,4,4]),loss='soft_l1',f_scale=8,max_nfev=70);matrix,c=unpack(fit.x);delta=matrix@np.linalg.inv(initial);previous=np.array(entry['centerPx']);entry=copy.deepcopy(entry);entry['centerPx']=(c+origin).tolist();entry['axesPx']=(delta@old_axes).T.ravel().tolist();entry['contoursPx']={name:((np.array(points)-previous)@delta.T+c+origin).tolist()for name,points in entry['contoursPx'].items()};entry['nativeSource']['finalPixelRefinement']={'referenceCell':[(int(sy)//208),(int(sx)//192)],'scope':'own selected lip patch final-pixel refinement; no deformer replay'}
 return entry,{'rgbRMSE':float(np.mean(residual(fit.x)**2)**.5),'solverConverged':bool(fit.success),'evaluations':int(fit.nfev),'manualCenter':center.tolist(),'fittedCenter':c.tolist(),'forwardMatrix':delta.tolist(),'bothAxesTransported':True,'scope':'alignment diagnostic only; own source/zero/open review required'}


def referenced_cells(manifest):
 used={}
 def add(r,c,label):used.setdefault((r,c),[]).append(label)
 for name,w in manifest['walks'].items():
  for c in range(w['frames']):add(w['row'],c,'walk:'+name)
 for i in range(manifest['turns']['pose_count']):add(manifest['turns']['rows'][i//8],i%8,'turn:'+str(i))
 for name,b in manifest['bridges'].items():
  for c in set(b['stop_cols']+b['start_cols']):add(b['row'],c,'bridge:'+name)
 for name,state in manifest['interactions']['states'].items():
  for c in range(len(state['durations_ms'])):add(state['row'],c,'reaction:'+name)
 for frame in manifest['interactions']['look']['frames']:add(frame['row'],frame['col'],'look:'+str(frame['degrees']))
 return used


def cropped_entry(entry):
 origin=np.array(entry['cellOriginPx']);return{**entry,'centerPx':(np.array(entry['centerPx'])-origin).tolist(),'contoursPx':{k:(np.array(v)-origin).tolist()for k,v in entry['contoursPx'].items()},'previewCropPx':[int(origin[0]),int(origin[1]),int(origin[0]+192),int(origin[1]+208)]}


def build(ident,write_source=False,pilots_only=False):
 compiler=compiler_module();folder=OUT/ident;folder.mkdir(parents=True,exist_ok=True);manifest_path=ROOT/f'assets/tourists/{ident}/manifest.json';manifest=json.loads(manifest_path.read_text());native_path=ROOT/f'assets/sprite-sources/sandale-mouths/{ident}-native-pilot-v1.registration.json';native=json.loads(native_path.read_text())['registrations'];source=ROOT/native['down']['input']['file'];assert sha(source)==manifest['sha256'];image=Image.open(source).convert('RGBA');compiler.Image=SourceImageCache(source,image);atlas=np.array(image);assert image.size==(1536,3952);used=referenced_cells(manifest)
 old_files=[ROOT/f'assets/sprite-sources/sandale-mouths/{ident}-{kind}-v1.registration.json'for kind in ['native-pilot','walk','bridges']];old_pins={str(p.relative_to(ROOT)).replace('\\','/'):sha(p)for p in old_files};old={}
 for file in old_files[1:]:
  for index,e in enumerate(json.loads(file.read_text())['frames']):
   c,r=(np.array(e['cellOriginPx'])//[192,208]).astype(int);old[(int(r),int(c))]=(e,str(file.relative_to(ROOT)).replace('\\','/'),index)
 entries={};diagnostics=[];turn_cells=[(4,c)for c in range(5)]+[(5,c)for c in range(3,8)]
 for (r,c),measurement in zip(turn_cells,MAN_TURNS if ident=='towelMan'else WOMAN_TURNS):entries[(r,c)]=own_seed(native,r,c,measurement,ident);diagnostics.append({'row':r,'col':c,'method':'manual own final turn lip seed, no RGB solve'})
 for i,measurement in enumerate(MAN_LOOK if ident=='towelMan'else WOMAN_LOOK):
  r,c=17+i//8,i%8;entries[(r,c)]=own_seed(native,r,c,measurement,ident);diagnostics.append({'row':r,'col':c,'method':'manual own final head-look lip seed, no RGB solve'})
 for row,guesses in (MAN_REACTIONS if ident=='towelMan'else WOMAN_REACTIONS).items():
  for col,guess in enumerate(guesses):entry,d=fit_reaction(native,atlas,row,col,guess,ident);entries[(row,col)]=entry;diagnostics.append(d)
 if ident=='towelWoman':entries.pop((5,3));diagnostics=[d for d in diagnostics if(d['row'],d['col'])!=(5,3)]
 for rc in sorted(entries):
  if entries[rc]['nativeSource'].get('measurement'):
   entries[rc],fit=refine_own_seed(entries[rc],native,atlas);diagnostics.append({'row':rc[0],'col':rc[1],'method':'own manually selected quarter/action lip patch refinement',**fit})
 for i,measurement in DIRECT_LOOK[ident].items():
  r,c=17+i//8,i%8;entry=own_seed(native,r,c,measurement,ident,normal=2.5,aperture=.68)
  if ident=='towelMan' and i in [0,15]:
   cx,cy=entry['centerPx'];half=measurement[2]/2;ys=[0,-.6,-1,-.6,0] if i==0 else [0,-.5,-.7,-.4,0];crease=[[cx+half*x,cy+y]for x,y in zip([-1,-.5,0,.5,1],ys)];entry['contoursPx'].update(crease=crease,source_upper=copy.deepcopy(crease),source_lower=copy.deepcopy(crease),open_upper=copy.deepcopy(crease),open_lower=[[x,y+d]for (x,y),d in zip(crease,[0,1.1,1.7,1.1,0])])
  entry['nativeSource']['measurement']='Direct own final PNG lip seam and corners after rejecting misleading RGB correspondence; both axes retained in own final pixel basis';entries[(r,c)]=entry;diagnostics.append({'row':r,'col':c,'method':'manual own final lip trace; RGB result rejected, no deformation replay'})
 pilot_cells=[(4,1),(4,3),(5,3),(13,3),(15,2),(18,0)];active=[rc for rc in pilot_cells if rc in entries] if pilots_only else sorted(entries)
 checks=[];rendered={}
 for rc in active:
  entry=entries[rc];reg=compiler.compile_registration(entry);local=cropped_entry(entry);r,c=rc;original=atlas[r*208:(r+1)*208,c*192:(c+1)*192];closed=compiler.preview(local,reg,0);opened=compiler.preview(local,reg,1);zero_exact=np.array_equal(np.array(closed),original);alpha=np.array_equal(np.array(opened)[:,:,3],original[:,:,3]);assert zero_exact,(ident,rc,'closed source mismatch');assert alpha,(ident,rc,'alpha changed');check={'row':r,'col':c,'zeroRGBAExact':zero_exact,'openingAlphaExact':alpha}
  if ident=='towelMan':
   axes=np.array(local['axesPx']).reshape(2,2).T;yy,xx=np.mgrid[:208,:192];q=(np.stack([xx,yy],-1)-local['centerPx'])@np.linalg.inv(axes).T;crease=compiler.curve(q[:,:,0],reg['profile']['crease'],reg['profile']['corners']);protected=q[:,:,1]<crease-1/np.linalg.norm(axes[:,1]);unchanged=np.array_equal(np.array(opened)[protected],original[protected]);assert unchanged,(ident,rc,'protected upper paint changed');check['upperPaintBeyondOnePixelFringeExact']=unchanged
  checks.append(check);rendered[rc]=(Image.fromarray(original),closed,opened);compiler.review_board(ident,f'{r:02}-{c:02}',entry,reg,folder)
 if pilots_only:
  (folder/'pilot-registrations.json').write_text(json.dumps({'id':ident,'sourceSha256':sha(source),'frames':[entries[rc]for rc in active],'checks':checks},indent=2)+'\n');print(json.dumps({'id':ident,'pilots':len(active),'folder':str(folder)}));return
 coverage=[];nulls=[]
 for r in range(19):
  for c in range(8):
   slot=r*8+c;cell=atlas[r*208:(r+1)*208,c*192:(c+1)*192];bbox=Image.fromarray(cell[:,:,3]).getbbox();item={'slot':slot,'row':r,'col':c,'usedBy':used.get((r,c),[]),'alphaBounds':list(bbox)if bbox else None,'rgbaSha256':hashlib.sha256(cell.tobytes()).hexdigest()}
   if (r,c)in old:item.update(registrationFile=old[(r,c)][1],registrationIndex=old[(r,c)][2],reason='Existing separately reviewed gait/bridge source registration retained unchanged')
   elif (r,c)in entries:item.update(registrationIndex=sorted(entries).index((r,c)),reason='Own final-cell candidate in this remaining source file')
   else:
    reason='Transparent unused slot; no source mouth'if bbox is None else 'Rear up body view; no visible lip seam'if r in [2,8] else 'Rear-quarter head/ear occludes the lip seam; no invented mouth';item.update(registration=None,reason=reason);nulls.append({'slot':slot,'row':r,'col':c,'registration':None,'reason':reason})
   coverage.append(item)
 assert len(used)==125 and len(old)==39 and len(entries)+len(nulls)==113
 # Complete source/zero/open boards also include retained old registrations and explicit null cells.
 for rc,(entry,_,_)in old.items():reg=compiler.compile_registration(entry);local=cropped_entry(entry);r,c=rc;rendered[rc]=(Image.fromarray(atlas[r*208:(r+1)*208,c*192:(c+1)*192]),compiler.preview(local,reg,0),compiler.preview(local,reg,1))
 for theme,bg,ink in [('light','#eee8db','#222'),('dark','#25272b','#eee8db')]:
  for r in range(19):
   board=Image.new('RGB',(1280,252),bg);draw=ImageDraw.Draw(board)
   for c in range(8):
    bx=c%4*320;by=c//4*126;entry=entries.get((r,c))or(old.get((r,c))or[None])[0];cell=Image.fromarray(atlas[r*208:(r+1)*208,c*192:(c+1)*192]);pics=rendered.get((r,c),(cell,cell,cell));center=(np.array(entry['centerPx'])-entry['cellOriginPx'])if entry else np.array([96,76]);crop=(int(center[0])-16,int(center[1])-12,int(center[0])+16,int(center[1])+12);draw.text((bx+2,by+1),f'{r}:{c} '+('OWN'if(r,c)in entries else'RETAINED'if(r,c)in old else'NULL'),font=FONT,fill=ink)
    for j,(label,pic)in enumerate(zip(['source','zero','open'],pics)):
     tile=pic.crop(crop).resize((96,72),Image.Resampling.NEAREST);board.paste(tile,(bx+j*106+2,by+38),tile);draw.text((bx+j*106+2,by+19),label,font=FONT,fill=ink)
   board.save(folder/f'all-slots-row-{r:02}-{theme}.png')
 record={'schemaVersion':1,'id':ident,'cell':[192,208],'grid':[8,19],'scope':f'{len(entries)} remaining visible own-cell lip candidates;39 prior gait/bridge registrations retained via reference;{len(nulls)} explicit rear/occluded/transparent nulls. All152 slots inventoried. No runtime/GPU/voice/adoption or authored-field replay claim.','sourceSha256':sha(source),'manifestSha256':sha(manifest_path),'existingSourcePins':old_pins,'frames':[entries[rc]for rc in sorted(entries)],'nullFrames':nulls,'coverage':coverage,'diagnostics':diagnostics,'checks':checks,'reviewStatus':'UNREVIEWED final-pixel source candidates; source/zero/open light/dark boards must pass root review before any compiler/runtime adoption'}
 target=ROOT/f'assets/sprite-sources/sandale-mouths/{ident}-remaining-v1.registration.json'
 (folder/'remaining-registrations.json').write_text(json.dumps(record,indent=2)+'\n')
 if write_source:target.write_text(json.dumps(record,indent=2)+'\n')
 for file,h in old_pins.items():assert sha(ROOT/file)==h
 assert sha(source)==manifest['sha256'];print(json.dumps({'id':ident,'newVisible':len(entries),'retained':len(old),'explicitNull':len(nulls),'slots':len(coverage),'source':str(target)if write_source else'ignored only','notConverged':sum(d.get('solverConverged')is False for d in diagnostics)}))

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--character',required=True,choices=['towelMan','towelWoman']);p.add_argument('--write-source',action='store_true');p.add_argument('--pilots-only',action='store_true');args=p.parse_args();build(args.character,args.write_source,args.pilots_only)
