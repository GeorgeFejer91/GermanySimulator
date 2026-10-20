"""Compile explicitly inspected painted lips; no automatic anatomical detection.

Source registrations are measured in native pixels, positive Y down. This tool
only compiles profiles and writes ignored review previews/candidate metadata.
It never enables runtime paint or changes source artwork.
"""
from pathlib import Path
import argparse, hashlib, json, math
import ast, importlib.util, inspect, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import map_coordinates

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/sprite-sources/street-mouths/registration.json'
OUT=ROOT/'output/ambient-city-animation'
FONT=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
NAMES=['crease','open_upper','open_lower','source_upper','source_lower']

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def validate(p):
 if not all(len(p[n])==5 and all(math.isfinite(v) and abs(v)<=1.5 for v in p[n])for n in NAMES):raise ValueError('Invalid five-point profile')
 if not(p['corners'][0]<0<p['corners'][1] and p['corners'][1]-p['corners'][0]>=.5):raise ValueError('Invalid attached corners')
 if not isinstance(p['width'],list)or len(p['width'])!=2 or not all(math.isfinite(v)for v in p['width'])or not(0<=p['width'][0]<=.2 and 0<=p['width'][1]<=.45):raise ValueError('Invalid horizontal lip style')
 if not math.isfinite(p['teeth'])or not 0<=p['teeth']<=1:raise ValueError('Invalid tooth exposure')
 for i in range(5):
  c=p['crease'][i]
  if p['open_upper'][i]>c or p['source_upper'][i]>c or p['open_lower'][i]<c or p['source_lower'][i]<c:raise ValueError('Crossed contours')
  if i in [0,4] and any(abs(p[n][i]-c)>1e-6 for n in NAMES):raise ValueError('Detached corner')

def compile_registration(entry):
 if entry is None:return None
 path=ROOT/entry['input']['file']
 if digest(path)!=entry['input']['sha256']:raise ValueError('Changed inspected source: '+str(path))
 with Image.open(path)as im:
  if list(im.size)!=entry['input']['dimensions']:raise ValueError('Changed source dimensions')
 center=np.array(entry['centerPx'],float);axes=np.array(entry['axesPx'],float).reshape(2,2).T
 inverse=np.linalg.inv(axes);profile={}
 for name in NAMES:
  points=np.array(entry['contoursPx'][name],float)
  local=(points-center)@inverse.T
  profile[name]=[round(float(v),8)for v in local[:,1]]
 local=(np.array(entry['contoursPx']['crease'])-center)@inverse.T
 profile['corners']=[round(float(local[0,0]),8),round(float(local[-1,0]),8)]
 profile['width']=entry['width'];profile['teeth']=entry['teeth'];validate(profile)
 w,h=entry.get('cell',entry['input']['dimensions']);cx,cy=center-entry.get('cellOriginPx',[0,0])
 return {'rect':[float(cx/w),float(1-cy/h),float(np.linalg.norm(axes[:,0])/w),float(np.linalg.norm(axes[:,1])/h)],
  'axes':entry['axesPx'],'profile':profile,'input':entry['input'],'cell':[w,h],
  'centerPx':entry['centerPx'],'cellOriginPx':entry.get('cellOriginPx',[0,0]),'nativeSource':entry.get('nativeSource'),
  'status':'candidate; direct pixel fit; visual and rendered review pending'}

def curve(x,points,corners):
 t=np.clip((x-corners[0])/(corners[1]-corners[0])*4,0,4);idx=np.minimum(3,np.floor(t).astype(int));u=t-idx
 a=np.array(points)[idx];b=np.array(points)[idx+1];d=b-a
 before=np.where(idx==0,a-d,np.array(points)[np.maximum(0,idx-1)])
 after=np.where(idx==3,b+d,np.array(points)[np.minimum(4,idx+2)])
 def slope(a,b):return np.where(a*b>0,2*a*b/np.where(abs(a+b)>1e-12,a+b,1),0)
 m0=slope(a-before,d);m1=slope(d,after-b)
 return(2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*m0+(-2*u**3+3*u*u)*b+(u**3-u*u)*m1

def preview(entry,reg,opening):
 # CPU reference of the shader's connected vertical skin map at width=1.
 # No browser, timing, perceptual or final shader approval is implied.
 source_image=Image.open(ROOT/entry['input']['file']).convert('RGBA')
 if 'previewCropPx'in entry:source_image=source_image.crop(entry['previewCropPx'])
 im=np.array(source_image,dtype=float)/255
 cx,cy=entry['centerPx'];ax=np.array(entry['axesPx'],float).reshape(2,2).T;inv=np.linalg.inv(ax)
 radius=math.ceil(max(np.linalg.norm(ax[:,0]),np.linalg.norm(ax[:,1]))*2)
 x0=max(0,int(cx)-radius);x1=min(im.shape[1],int(cx)+radius+1);y0=max(0,int(cy)-radius);y1=min(im.shape[0],int(cy)+radius+1)
 yy,xx=np.mgrid[y0:y1,x0:x1];q=np.stack([xx-cx,yy-cy],-1)@inv.T;x=q[:,:,0];y=q[:,:,1];p=reg['profile']
 c=curve(x,p['crease'],p['corners']);st=np.minimum(c,curve(x,p['source_upper'],p['corners']));sb=np.maximum(c,curve(x,p['source_lower'],p['corners']))
 top=c+(np.minimum(c,curve(x,p['open_upper'],p['corners']))-c)*opening;bottom=c+(np.maximum(c,curve(x,p['open_lower'],p['corners']))-c)*opening
 def skin(d,target,source):return d/(1+(target-source)*d/(source*target))
 sy=np.where(y<top,-1.6+skin(y+1.6,top+1.6,st+1.6),np.where(y>bottom,3-skin(3-y,3-bottom,3-sb),c))
 active=(abs(x)<2)&(y>=-1.6)&(y<=3);sy=np.where(active,sy,y)
 source=np.stack([x,sy],-1)@ax.T+np.array([cx,cy]);sample=np.stack([map_coordinates(im[:,:,k],[source[:,:,1],source[:,:,0]],order=1,mode='nearest')for k in range(4)],-1)
 original=im[y0:y1,x0:x1];sample[:,:,:3]=np.where((sample[:,:,3]<original[:,:,3]*.95)[:,:,None],original[:,:,:3],sample[:,:,:3]);sample[:,:,3]=original[:,:,3]
 r=(x-sum(p['corners'])/2)/((p['corners'][1]-p['corners'][0])/2)
 # Pixel-edge antialiasing follows the existing shader; teeth disabled where
 # the inspected source has none. Preserve original alpha in every preview.
 def smooth(a,b,v):
  t=np.clip((v-a)/(b-a),0,1);return t*t*(3-2*t)
 edge=.65/np.linalg.norm(ax[:,1]);inside=smooth(top-edge,top+edge,y)*(1-smooth(bottom-edge,bottom+edge,y))*(1-smooth(.92,1.01,abs(r)))*smooth(.05/np.linalg.norm(ax[:,1]),.8/np.linalg.norm(ax[:,1]),bottom-top)*active
 oral=np.broadcast_to(np.array([.035,.007,.011]),sample[:,:,:3].shape).copy()*(1+.3*abs(r))[:,:,None]
 v=np.clip((y-top)/np.maximum(.0001,bottom-top),0,1)
 tongue=smooth(.5,.85,v)*(1-smooth(.6,.95,abs(r)))*.6
 oral=oral*(1-tongue[:,:,None])+np.array([.17,.035,.04])*tongue[:,:,None]
 teeth=(1-smooth(.16,.30,v))*smooth(.015,.09,v)*(1-smooth(.62,.85,abs(r)))*smooth(2.8/np.linalg.norm(ax[:,1]),5.5/np.linalg.norm(ax[:,1]),bottom-top)*.8*p['teeth']
 oral=oral*(1-teeth[:,:,None])+np.array([.60,.49,.34])*teeth[:,:,None]
 sample[:,:,:3]=sample[:,:,:3]*(1-inside[:,:,None])+oral*inside[:,:,None]
 im[y0:y1,x0:x1]=sample
 return Image.fromarray(np.rint(np.clip(im,0,1)*255).astype('uint8'),'RGBA')

def review_board(ident,key,entry,reg,folder):
 im=Image.open(ROOT/entry['input']['file']).convert('RGBA')
 if entry.get('cellOriginPx')is not None and entry.get('cell')!=entry['input']['dimensions']:
  origin=np.array(entry['cellOriginPx']);w,h=entry['cell'];box=[int(origin[0]),int(origin[1]),int(origin[0]+w),int(origin[1]+h)]
  entry={**entry,'centerPx':(np.array(entry['centerPx'])-origin).tolist(),'contoursPx':{k:(np.array(v)-origin).tolist()for k,v in entry['contoursPx'].items()},'previewCropPx':box};im=im.crop(box)
 cx,cy=entry['centerPx'];ax=np.array(entry['axesPx']).reshape(2,2).T
 rx=max(12,int(np.linalg.norm(ax[:,0])*.9));ry=max(8,int(np.linalg.norm(ax[:,1])*2.1))
 crop=(max(0,int(cx)-rx),max(0,int(cy)-ry),min(im.width,int(cx)+rx+1),min(im.height,int(cy)+ry+1))
 imgs=[('actual source',im),('own contours',im.copy()),('owned closure CPU',preview(entry,reg,0)),('open CPU',preview(entry,reg,1))]
 annotated=imgs[1][1];draw=ImageDraw.Draw(annotated)
 for name,color in [('crease','#00ffff'),('source_upper','#ff00ff'),('source_lower','#ff00ff'),('open_upper','#00ff00'),('open_lower','#00ff00')]:
  pts=[tuple(p)for p in entry['contoursPx'][name]];draw.line(pts,fill=color,width=1)
 for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
  zoom=6 if im.width>512 else 12;cw=(crop[2]-crop[0])*zoom+15;ch=(crop[3]-crop[1])*zoom+65
  board=Image.new('RGB',(cw*4,ch),bg);d=ImageDraw.Draw(board);ink='#eee8db'if theme=='dark'else'#222222'
  for i,(title,pic)in enumerate(imgs):
   tile=pic.crop(crop).resize(((crop[2]-crop[0])*zoom,(crop[3]-crop[1])*zoom),Image.Resampling.NEAREST);board.paste(tile,(i*cw,55),tile);d.text((i*cw,28),title,font=FONT,fill=ink)
  d.text((5,5),ident+'/'+key+' | UNREVIEWED; cyan crease, magenta source cavity, green allowed limits',font=FONT,fill=ink)
  board.save(folder/(key+'-'+theme+'.png'))

def motion_candidate(data,person):
 """Replay the actual existing mouth-bearing fields, never reconstruct a rig.

 The original build function is truncated before its shipping manifest/export
 assignments. All original row construction runs with OUT redirected to ignored
 review storage. The actual morph helper records its existing correspondences.
 """
 owner=person['motionTransport'];builder=ROOT/owner['builder']
 if digest(builder)!=owner['builderSha256']:raise ValueError('Changed mouth transport builder')
 module_spec=importlib.util.spec_from_file_location('mouth_motion_replay',builder);motion=importlib.util.module_from_spec(module_spec);module_spec.loader.exec_module(motion)
 replay=OUT/'source-review/mouth-replay';replay.mkdir(parents=True,exist_ok=True);motion.OUT=replay
 # Original body QA boards do not help inspect lip registration; rowwise
 # mouth diagnostics below use the exact delivered cells instead.
 motion.source_tools.opaque_board=lambda *args,**kwargs:Image.new('RGB',(1,1))
 spec=json.loads(motion.SPEC.read_text());original=json.loads((ROOT/spec['registeredSourceSpec']).read_text())['characters'][spec['id']]
 source=Image.open(ROOT/original['source']).convert('RGBA');scale=416/original['sourceFigureHeight']
 for name,view in original['views'].items():
  image,_=motion.source_tools.register_source(source,view,scale,480);image.save(replay/(name+'-source.png'))
 import morph_frames
 actual_morph=morph_frames.morph;fields=[]
 def recorded_morph(a,b,source_points,target_points,triangles,t):
  caller=inspect.currentframe().f_back;kind=caller.f_code.co_name
  # These morphs own only leg pixels below y388, then are masked below407.
  # They cannot affect any inspected mouth neighborhood (all above y310).
  # Skip that unrelated expensive foot mesh; retain the original upper warp,
  # source/head/gesture fields and the exact encoded mouth equality gate.
  if kind=='authored_vertical':return a.copy()
  if kind in ['reading_head','speaking_trial']:
   fields.append({'kind':caller.f_locals.get('kind',caller.f_locals.get('action','speaking')),'phase':float(t),'source':np.array(source_points),'target':np.array(target_points),'triangles':np.array(triangles)})
  return actual_morph(a,b,source_points,target_points,triangles,t)
 morph_frames.morph=recorded_morph
 try:
  tree=ast.parse(inspect.getsource(motion.build));fn=tree.body[0];body=[]
  for statement in fn.body:
   if isinstance(statement,ast.Assign)and any(isinstance(target,ast.Name)and target.id=='person'for target in statement.targets):break
   body.append(statement)
  fn.body=body+ast.parse('return rows').body;ast.fix_missing_locations(tree);scope=dict(motion.__dict__);exec(compile(tree,str(builder),'exec'),scope);rows=scope['build'](spec)
 finally:morph_frames.morph=actual_morph
 manifest=json.loads((ROOT/'assets/characters/street-speakers/quiz-hartmut-keller/manifest.json').read_text())
 for variant in ['desktop','mobile']:
  record=manifest['variants'][variant]
  if digest(ROOT/record['file'].removeprefix('./'))!=record['sha256']:raise ValueError('Changed declared Hartmut atlas: '+variant)
 atlas_file=manifest['variants']['desktop']['file'].removeprefix('./');atlas=Image.open(ROOT/atlas_file).convert('RGBA');cell=manifest['frame_size'];slot_entries=[None]*256;proof=[];time_values=[.5-.5*math.cos(math.tau*i/15)for i in range(16)]
 def native(name):
  entry=person['registrations'][name]
  if entry is None:return None
  if name in ['front-right','front-left']:
   pivot={'front-right':[359,604],'front-left':[901,1207]}[name];s=416/558
  else:pivot=original['views'][name]['source_pivot'];s=scale
  origin=np.array([256,480])-np.array(pivot)*s
  return {'contours':{k:np.array(v)*s+origin for k,v in entry['contoursPx'].items()},'center':np.array(entry['centerPx'])*s+origin,'axes':np.array(entry['axesPx'])*s,'entry':entry,'name':name}
 def shift(reg,dx,dy,normal_scale=1):
  offset=np.array([dx,dy]);result={**reg,'contours':{k:v+offset for k,v in reg['contours'].items()},'center':reg['center']+offset,'axes':reg['axes'].copy()};result['axes'][2:]*=normal_scale;return result
 def points_map(points,source_points,target_points,triangles):
  result=[]
  for point in np.asarray(points):
   for tri in triangles:
    a=source_points[tri];matrix=np.vstack((a.T,np.ones(3)));weights=np.linalg.solve(matrix,np.append(point,1))
    if min(weights)>=-1e-6:result.append(weights@target_points[tri]);break
   else:raise ValueError('Lip point outside actual morph field')
  return np.array(result)
 def mapped(reg,field,endpoint):
  src=field[endpoint];dst=field['source']*(1-field['phase'])+field['target']*field['phase'];tri=field['triangles']
  transform=lambda points:points_map(points,src,dst,tri)
  center=transform([reg['center']])[0];axis=reg['axes'].reshape(2,2)
  # Local Jacobian carries both painted tangent and normal. Sampling one full
  # mouth-width away can cross a different triangle and lose the head shear.
  epsilon=.001;axes=((transform(reg['center'][None,:]+axis*epsilon)-center)/epsilon).reshape(4)
  return {**reg,'center':center,'axes':axes,'contours':{k:transform(v)for k,v in reg['contours'].items()}}
 def blended(a,b,t):
  return {**a,'name':a['name']+'->'+b['name'],'center':a['center']*(1-t)+b['center']*t,'axes':a['axes']*(1-t)+b['axes']*t,
   'contours':{k:a['contours'][k]*(1-t)+b['contours'][k]*t for k in NAMES}}
 def pose(row,col):
  if row in [0,1,2,3,4,5,6,7]:
   direction=DIRS[row%4];reg=native(direction)
   if reg is None:return None
   phase=math.tau*col/16;factor=1
   if row>=4:
    if col==3:return reg
    phase=math.tau*([15.25/16,15.5/16,15.75/16][col]if col<3 else 0);factor=[.75,.5,.25,0,.25,.5,.75,1][col]
   if direction in ['right','left']:
    strength=.8*factor;return shift(reg,-.6*math.sin(phase)*strength,-3.4*math.cos(2*phase)*strength)
   return shift(reg,0,-3.4*math.cos(2*phase)*factor)
  if row==8:return native(['down','front-right','right','rear-right','up','rear-left','left','front-left'][col])
  if row==10:return native('down')
  if row==12:
   t=time_values[col];reg=native('down');y=reg['center'][1];dy=(-2+y/260)*t
   # Actual upper warp is linear at the mouth (y<260); its normal derivative
   # is retained rather than treating the breathing head as fixed geometry.
   result=shift(reg,.8*t,dy)
   result['contours']={k:v+np.stack([np.full(5,.8*t),(-2+v[:,1]/260)*t],-1)for k,v in reg['contours'].items()};result['axes'][3]*=1+t/260
   return result
  kind={9:'speaking',11:'success',13:'look',14:'failure',15:'work'}[row];t=([0,.25,.6,1,.7,.4,.1,0][col]if row==9 else time_values[col])
  if t<1e-8:return native('down')
  field=next(f for f in fields if f['kind']==kind and abs(f['phase']-t)<1e-8)
  a=native('down');b=native(kind)
  if row in [9,11]:b=shift(b,-12,0)if kind=='success'else shift(b,4,-10)
  return blended(mapped(a,field,'source'),mapped(b,field,'target'),t)
 DIRS=['down','right','up','left'];export_scale=136/416
 for row,frames in enumerate(rows):
  for col,frame in enumerate(frames):
   reg=pose(row,col);slot=row*16+col
   if reg is None:proof.append({'slot':slot,'nullReason':'actual rear or rear-quarter source; no visible mouth'});continue
   # Verify the actual replay at the exact consumer's mouth neighborhood. The
   # later far-shoe-only repair may alter feet, never this head neighborhood.
   encoded=motion.export_cell(frame);actual=atlas.crop((col*cell[0],row*cell[1],(col+1)*cell[0],(row+1)*cell[1]));center=np.array([50,146])+(reg['center']-[256,480])*export_scale;axes=reg['axes']*export_scale
   box=(max(0,int(center[0])-12),max(0,int(center[1])-8),min(cell[0],int(center[0])+13),min(cell[1],int(center[1])+9))
   if encoded.crop(box).tobytes()!=actual.crop(box).tobytes():raise ValueError(f'Actual encoded mouth differs from exact builder replay: slot{slot}')
   contours={k:(v-[256,480])*export_scale+[50,146]for k,v in reg['contours'].items()}
   entry={'input':{'file':atlas_file,'sha256':digest(ROOT/atlas_file),'dimensions':list(atlas.size)},'centerPx':(center+[col*cell[0],row*cell[1]]).tolist(),'axesPx':axes.tolist(),'contoursPx':{k:(v+[col*cell[0],row*cell[1]]).tolist()for k,v in contours.items()},'width':reg['entry']['width'],'teeth':person['registrations']['speaking']['teeth']if row==9 and col not in [0,7]else reg['entry']['teeth'],'cell':cell,'cellOriginPx':[col*cell[0],row*cell[1]],'nativeSource':reg['entry']['input']}
   slot_entries[slot]=entry;proof.append({'slot':slot,'source':reg['name'],'exactEncodedMouthReplay':True,'reviewBoxCellPx':list(box),'centerCellPx':center.tolist(),'axesCellPx':axes.tolist()})
 # Every unused transparent slot is explicitly null in the256-slot map.
 frames=[None if e is None else compile_registration(e)for e in slot_entries]
 candidate_standing=ROOT/'assets/characters/street-speakers/quiz-hartmut-keller/standing-candidate.webp'
 neutral_row=manifest['bridges']['down']['row'];neutral_col=manifest['bridges']['down']['stop_cols'][-1];neutral_slot=neutral_row*16+neutral_col
 standing_im=Image.open(candidate_standing).convert('RGBA');expected=atlas.crop((neutral_col*cell[0],neutral_row*cell[1],(neutral_col+1)*cell[0],(neutral_row+1)*cell[1]))
 if standing_im.tobytes()!=expected.tobytes():raise ValueError('Candidate standing is not exact declared down stop terminal')
 stand=dict(slot_entries[neutral_slot]);stand['input']={'file':str(candidate_standing.relative_to(ROOT)).replace('\\','/'),'sha256':digest(candidate_standing),'dimensions':cell};origin=np.array(stand['cellOriginPx']);stand['centerPx']=(np.array(stand['centerPx'])-origin).tolist();stand['contoursPx']={k:(np.array(v)-origin).tolist()for k,v in stand['contoursPx'].items()};stand['cellOriginPx']=[0,0]
 standing=compile_registration(stand);runtime=lambda r:None if r is None else{k:r[k]for k in ['rect','axes','profile']}
 definition={'schemaVersion':1,'id':'hartmut-keller','cell':cell,'grid':[16,16],'sources':{'standing':digest(candidate_standing),'desktop':manifest['variants']['desktop']['sha256'],'mobile':manifest['variants']['mobile']['sha256']},'standing':runtime(standing),'frames':[runtime(r)for r in frames]}
 target=ROOT/'assets/characters/street/quiz-hartmut-keller/mouths-candidate.json';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(definition,separators=(',',':'))+'\n')
 if target.stat().st_size>262144:raise ValueError('Mouth definition exceeds256KiB')
 review=OUT/'source-review/mouths/quiz-hartmut-keller';(review/'motion-proof.json').write_text(json.dumps({'builder':owner,'excludedUnrelatedLayer':'Leg-only morph below y388 is omitted; full-body replay is not claimed. Original upper/head/face fields retained and actual encoded mouth-neighborhood bytes must match.','fields':[{**f,'source':f['source'].tolist(),'target':f['target'].tolist(),'triangles':f['triangles'].tolist()}for f in fields],'samples':proof,'slotCount':256,'nonNull':sum(r is not None for r in frames),'sourceStandingUnchanged':True,'standingSourceCell':[neutral_row,neutral_col]},indent=2)+'\n')
 (review/'motion-registration.json').write_text(json.dumps({'standingCandidate':stand,'frames':slot_entries},separators=(',',':'))+'\n')
 # Rowwise actual-source, annotated, closed/open preview for every visible cell.
 for row in range(16):
  entries=[(col,slot_entries[row*16+col],frames[row*16+col])for col in range(16)if slot_entries[row*16+col]is not None]
  if not entries:continue
  rowdir=review/f'motion-row-{row:02}';rowdir.mkdir(exist_ok=True)
  for col,entry,reg in entries:review_board('hartmut',f'{row:02}-{col:02}',entry,reg,rowdir)
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   pics=[Image.open(rowdir/(f'{row:02}-{col:02}-'+theme+'.png')).convert('RGB')for col,_,_ in entries];w=max(p.width for p in pics);h=max(p.height for p in pics);sheet=Image.new('RGB',(w*2,h*math.ceil(len(pics)/2)),bg)
   for i,pic in enumerate(pics):sheet.paste(pic,((i%2)*w,(i//2)*h))
   sheet.save(review/(f'motion-row-{row:02}-'+theme+'.png'))
 result_path=OUT/'mouth-paint-candidate.json';result=json.loads(result_path.read_text());result['quiz-hartmut-keller'].update({'standingCandidate':standing,'frames':[runtime(r)for r in frames],'frameCoverage':'Exact existing encoded replay matched every fitted mouth neighborhood; visual/GPU review pending','definition':{'file':'./'+str(target.relative_to(ROOT)).replace('\\','/'),'sha256':digest(target)}});result_path.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({'candidateDefinition':str(target),'sha256':digest(target),'bytes':target.stat().st_size,'slots':256,'nonNull':sum(r is not None for r in frames),'review':str(review)}))

def refresh_static_quarters(person):
 """Refresh only the two already-bound static quarter source keys.

 Their existing exact builder replay supplies the encoded registration. A
 uniform native-to-cell transform is reconstructed from the pinned axes;
 source hash, cell center, source crease/cavity and every other frame stay
 invariant. This path never substitutes a standing pose for a changing head.
 """
 if digest(ROOT/person['motionTransport']['builder'])!=person['motionTransport']['builderSha256']:raise ValueError('Changed original quarter transport builder')
 folder=OUT/'source-review/mouths/quiz-hartmut-keller';path=ROOT/'assets/characters/street/quiz-hartmut-keller/mouths-candidate.json';definition=json.loads(path.read_text());before=json.loads(path.read_text());old_sha=digest(path)
 registration_path=folder/'motion-registration.json';bindings=json.loads(registration_path.read_text());receipt={'priorDefinitionSha256':old_sha,'originalReplayProofSha256':digest(folder/'motion-proof.json'),'changedSlots':[],'unchangedSourceArtwork':True}
 for name,slot in [('front-right',129),('front-left',135)]:
  source=person['registrations'][name];entry=bindings['frames'][slot]
  if entry is None or entry['nativeSource']!=source['input']:raise ValueError('Changed bound own quarter source')
  if digest(ROOT/source['input']['file'])!=source['input']['sha256']:raise ValueError('Quarter source pixels changed')
  native_axes=np.array(source['axesPx']).reshape(2,2).T;encoded_axes=np.array(entry['axesPx']).reshape(2,2).T;transform=encoded_axes@np.linalg.inv(native_axes)
  if not np.allclose(transform,np.eye(2)*transform[0,0],atol=1e-9)or transform[0,0]<=0:raise ValueError('Static quarter registration is no longer the original uniform source transform')
  mapped={k:(np.array(v)-source['centerPx'])@transform.T+entry['centerPx']for k,v in source['contoursPx'].items()}
  for key in ['crease','source_upper','source_lower']:
   if not np.allclose(mapped[key],entry['contoursPx'][key],atol=1e-6):raise ValueError('Quarter repair changed rest crease/cavity: '+key)
  entry={**entry,'contoursPx':{k:v.tolist()for k,v in mapped.items()}};bindings['frames'][slot]=entry;compiled=compile_registration(entry)
  definition['frames'][slot]={k:compiled[k]for k in ['rect','axes','profile']}
  review_board('hartmut',f'08-{slot%16:02}',entry,compiled,folder/'motion-row-08')
  native=compile_registration(source);review_board('quiz-hartmut-keller',name,source,native,folder)
  aperture=max(np.linalg.norm(encoded_axes[:,1])*(b-a)for a,b in zip(compiled['profile']['open_upper'],compiled['profile']['open_lower']))
  receipt['changedSlots'].append({'slot':slot,'source':source['input'],'nativeToCellUniformScale':float(transform[0,0]),'maxAllowedApertureCellPixels':float(aperture),'centerAxesCreaseSourceCavityUnchanged':True})
 for slot in range(256):
  if slot not in [129,135]and definition['frames'][slot]!=before['frames'][slot]:raise ValueError('Unrelated mouth frame changed')
 if definition['standing']!=before['standing']:raise ValueError('Candidate standing changed')
 path.write_text(json.dumps(definition,separators=(',',':'))+'\n');registration_path.write_text(json.dumps(bindings,separators=(',',':'))+'\n')
 receipt['definitionSha256']=digest(path);receipt['bytes']=path.stat().st_size;receipt['unchangedOtherFrames']=254;receipt['status']='source-specific aperture repair candidate; actual GPU review pending';(folder/'quarter-aperture-repair.json').write_text(json.dumps(receipt,indent=2)+'\n')
 candidate_path=OUT/'mouth-paint-candidate.json';candidate=json.loads(candidate_path.read_text());person_candidate=candidate['quiz-hartmut-keller'];person_candidate['frames']=definition['frames'];person_candidate['definition']['sha256']=digest(path)
 for name in ['front-right','front-left']:person_candidate['nativeSources'][name]=compile_registration(person['registrations'][name])
 candidate_path.write_text(json.dumps(candidate,indent=2)+'\n')
 for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
  pics=[Image.open(folder/'motion-row-08'/(f'08-{i:02}-'+theme+'.png')).convert('RGB')for i in [0,1,2,6,7]];w=max(p.width for p in pics);h=max(p.height for p in pics);sheet=Image.new('RGB',(w*2,h*3),bg)
  for i,pic in enumerate(pics):sheet.paste(pic,((i%2)*w,(i//2)*h))
  sheet.save(folder/('motion-row-08-'+theme+'.png'))
 print(json.dumps(receipt))

def gisela_motion_candidate(person, capture_path):
 """Compile this candidate from pinned actual fields, with no alternate rig."""
 from scipy.interpolate import PchipInterpolator
 from scipy.optimize import root
 capture_path=Path(capture_path).resolve();owner=person['motionTransport']
 if digest(ROOT/owner['builder'])!=owner['builderSha256']:raise ValueError('Changed Gisela family builder')
 if digest(ROOT/owner['captureHelper'])!=owner['captureHelperSha256']:raise ValueError('Changed Gisela capture helper')
 if digest(capture_path)!=owner['captureSha256']:raise ValueError('Changed Gisela field capture')
 capture=json.loads(capture_path.read_text())
 def verify_refs(value):
  if isinstance(value,dict):
   if 'path'in value and 'sha256'in value and digest(ROOT/value['path'])!=value['sha256']:raise ValueError('Changed captured dependency: '+value['path'])
   for child in value.values():verify_refs(child)
  elif isinstance(value,list):
   for child in value:verify_refs(child)
 verify_refs(capture)
 for key,path in [('builderSha256','tools/build-resident-motion.py'),('deformationSha256','.agents/skills/animate-2d-characters/scripts/painted_walk.py')]:
  if digest(ROOT/path)!=capture['sourceBindings'][key]:raise ValueError('Changed captured core implementation')
 atlas_file=capture['atlases']['desktop']['path'];atlas=Image.open(ROOT/atlas_file).convert('RGBA');cell=[128,160]
 if atlas.size!=(2048,2080):raise ValueError('Unexpected Gisela candidate grid')
 scale=capture['workingToCell']['scale'];origin=np.array(capture['workingToCell']['origin']);fields=np.load(ROOT/capture['actionInverseFields']['path'])
 entries=[None]*208;proof=[];residuals=[];jacobians=[]
 def native(name,binding):
  entry=person['registrations'][name]
  if entry is None:return None
  if entry['input']['file']!=binding['source']['path']or entry['input']['sha256']!=binding['source']['sha256']:raise ValueError('Native fit belongs to a different painting: '+name)
  compile_registration(entry)
  affine=lambda points:np.asarray(points)*binding['scale']+binding['origin']
  return {'center':affine(entry['centerPx']),'axes':np.array(entry['axesPx']).reshape(2,2).T*binding['scale'],'contours':{k:affine(v)for k,v in entry['contoursPx'].items()},'entry':entry,'name':name}
 def mapped(reg,transform,jacobian):
  center=transform(reg['center'][None,:])[0];matrix=jacobian(reg['center']);det=float(np.linalg.det(matrix))
  if not np.isfinite(det)or det<=0:raise ValueError('Folded mouth-bearing field')
  jacobians.append(det)
  return {**reg,'center':center,'axes':matrix@reg['axes'],'contours':{k:transform(v)for k,v in reg['contours'].items()}}
 def warped(reg,record):
  field=record['actualUpperWarp'];dx=PchipInterpolator(field['nodes_y'],field['dx']);dy=PchipInterpolator(field['nodes_y'],field['dy'])
  transform=lambda points:np.asarray(points)+np.stack([dx(points[:,1]),dy(points[:,1])],-1)
  jacobian=lambda point:np.array([[1,float(dx.derivative()(point[1]))],[0,1+float(dy.derivative()(point[1]))]])
  return mapped(reg,transform,jacobian)
 def action_field(reg,record):
  if record['transform']=='identity-source-copy':return reg
  sx,sy=fields[record['source_x']],fields[record['source_y']]
  def inverse(point):return np.array([map_coordinates(grid,[[point[1]],[point[0]]],order=1,mode='nearest',prefilter=False)[0]for grid in [sx,sy]])
  def inverse_jacobian(point):
   epsilon=.001
   return np.stack([(inverse(point+axis*epsilon)-inverse(point-axis*epsilon))/(2*epsilon)for axis in np.eye(2)],axis=1)
  def forward(points):
   result=[]
   for point in points:
    solved=root(lambda target:inverse(target)-point,point,jac=inverse_jacobian,tol=1e-10);residual=float(np.max(np.abs(inverse(solved.x)-point)));residuals.append(residual)
    if not np.isfinite(residual)or residual>1e-7:raise ValueError('Actual inverse-field mouth transport did not converge')
    result.append(solved.x)
   return np.array(result)
  return mapped(reg,forward,lambda point:np.linalg.inv(inverse_jacobian(forward(point[None,:])[0])))
 def assign(row,col,reg,kind):
  slot=row*16+col
  if reg is None:proof.append({'slot':slot,'nullReason':'actual rear/occluded source; no visible lips'});return
  center=reg['center']*scale+origin;axes=reg['axes']*scale;offset=np.array([col*cell[0],row*cell[1]])
  entry={'input':{'file':atlas_file,'sha256':capture['atlases']['desktop']['sha256'],'dimensions':list(atlas.size)},'cell':cell,'cellOriginPx':offset.tolist(),'centerPx':(center+offset).tolist(),'axesPx':axes.T.reshape(4).tolist(),'contoursPx':{k:(v*scale+origin+offset).tolist()for k,v in reg['contours'].items()},'width':reg['entry']['width'],'teeth':reg['entry']['teeth'],'nativeSource':reg['entry']['input']}
  compile_registration(entry);entries[slot]=entry;proof.append({'slot':slot,'source':reg['name'],'kind':kind,'centerCellPx':center.tolist(),'axesCellPx':entry['axesPx'],'nativeSource':entry['nativeSource']})
 for direction,walk in capture['walks'].items():
  reg=native(direction,capture['cardinalSources'][direction])
  for col,record in enumerate(walk['records']):assign(walk['row'],col,None if reg is None else warped(reg,record),'actual-upper-field')
  bridge=capture['bridges'][direction]
  for col,call in enumerate(bridge['calls']):assign(bridge['row'],col,None if reg is None else warped(reg,call['frames'][0]),'actual-bridge-upper-field')
 for quarter in capture['quarters']:
  if quarter['kind']=='cardinal-neutral':
   direction=quarter['direction'];reg=native(direction,capture['cardinalSources'][direction]);reg=None if reg is None else warped(reg,capture['bridges'][direction]['calls'][2]['frames'][0])
  else:reg=native(quarter['name'],quarter)
  assign(8,quarter['col'],reg,'actual-planted-source')
 front=native('down',capture['cardinalSources']['down']);front=warped(front,capture['bridges']['down']['calls'][2]['frames'][0])
 for action,record in capture['actions'].items():
  for pose in record['records']:assign(record['row'],pose['col'],action_field(front,pose),'actual-action-inverse-sample-field')
 if sum(e is not None for e in entries)!=132:raise ValueError('Missing visible Gisela candidate cells')
 for slot,entry in enumerate(entries):
  x,y=slot%16,slot//16;empty=atlas.crop((x*128,y*160,(x+1)*128,(y+1)*160)).getbbox()is None
  if empty and entry is not None:raise ValueError('Mouth assigned to transparent padding')
  if empty:proof.append({'slot':slot,'nullReason':'transparent logical padding'})
 if len(proof)!=208 or len({p['slot']for p in proof})!=208:raise ValueError('Incomplete logical-slot binding')
 dest=ROOT/'assets/characters/street-speakers/quiz-gisela-becker';standing_path=dest/'standing-candidate.webp'
 standing_image=atlas.crop((2*128,4*160,3*128,5*160));standing_image.save(standing_path,lossless=True,exact=True,method=6)
 if Image.open(standing_path).convert('RGBA').tobytes()!=standing_image.tobytes():raise ValueError('Standing candidate is not exact down neutral')
 standing_entry=dict(entries[66]);standing_entry['input']={'file':standing_path.relative_to(ROOT).as_posix(),'sha256':digest(standing_path),'dimensions':cell};offset=np.array(standing_entry['cellOriginPx']);standing_entry['centerPx']=(np.array(standing_entry['centerPx'])-offset).tolist();standing_entry['contoursPx']={k:(np.array(v)-offset).tolist()for k,v in standing_entry['contoursPx'].items()};standing_entry['cellOriginPx']=[0,0]
 runtime=lambda entry:None if entry is None else{k:compile_registration(entry)[k]for k in ['rect','axes','profile']}
 canonical_id=json.loads((ROOT/'assets/characters/street/manifest.json').read_text())['characters']['quiz-gisela-becker']['id']
 if canonical_id!='quiz-gisela-becker':raise ValueError('Unexpected canonical Gisela street identity')
 definition={'schemaVersion':1,'id':canonical_id,'cell':cell,'grid':[16,13],'sources':{'standing':digest(standing_path),'desktop':capture['atlases']['desktop']['sha256'],'mobile':capture['atlases']['mobile']['sha256']},'standing':runtime(standing_entry),'frames':[runtime(e)for e in entries]}
 target=ROOT/'assets/characters/street/quiz-gisela-becker/mouths-candidate.json';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(definition,separators=(',',':'))+'\n')
 if target.stat().st_size>262144:raise ValueError('Mouth candidate exceeds256KiB')
 folder=OUT/'source-review/mouths/quiz-gisela-becker/moving';folder.mkdir(parents=True,exist_ok=True)
 (folder/'motion-registration.json').write_text(json.dumps({'standingCandidate':standing_entry,'frames':entries},separators=(',',':'))+'\n')
 receipt={'status':'candidate exact-field transport; full visual/GPU/runtime review pending','capture':{'path':capture_path.relative_to(ROOT).as_posix(),'sha256':digest(capture_path)},'sourceBindings':capture['sourceBindings'],'nativeGiselaEntrySha256':hashlib.sha256(json.dumps(person,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'mouthBuilderSha256':digest(Path(__file__)),'definition':{'path':target.relative_to(ROOT).as_posix(),'sha256':digest(target),'bytes':target.stat().st_size},'standing':standing_entry,'slotCount':208,'visibleSlots':132,'nullSlots':76,'maxInverseResidualWorkingPx':max(residuals,default=0),'minimumForwardJacobianDeterminant':min(jacobians),'samples':sorted(proof,key=lambda p:p['slot'])}
 (folder/'motion-proof.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({k:receipt[k]for k in ['definition','slotCount','visibleSlots','nullSlots','maxInverseResidualWorkingPx','minimumForwardJacobianDeterminant']}))
 for row in range(13):
  rowdir=folder/f'row-{row:02}';rowdir.mkdir(exist_ok=True)
  for col in range(16):
   entry=entries[row*16+col]
   if entry is not None:review_board('gisela',f'{row:02}-{col:02}',entry,compile_registration(entry),rowdir)

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--character',default='quiz-hartmut-keller');parser.add_argument('--motion',action='store_true');parser.add_argument('--capture',type=Path,help='Pinned actual field capture for a Gisela motion candidate');parser.add_argument('--refresh-static-quarters',action='store_true');parser.add_argument('--skip-previews',action='store_true',help='Compile only; existing preview images are not regenerated');args=parser.parse_args()
 data=json.loads(SOURCE.read_text());person=data['characters'][args.character];folder=OUT/'source-review/mouths'/args.character;folder.mkdir(parents=True,exist_ok=True)
 if args.character=='quiz-gisela-becker'and args.motion:
  if args.capture is None:
   import subprocess
   if digest(ROOT/person['motionTransport']['captureHelper'])!=person['motionTransport']['captureHelperSha256']:raise ValueError('Changed Gisela capture helper')
   subprocess.run([sys.executable,str(ROOT/'tools/capture-street-speaker-mouth-fields.py')],cwd=ROOT,check=True)
   args.capture=ROOT/'output/street-speaker-motion/quiz-gisela-becker/mouth-source-correspondence.json'
  gisela_motion_candidate(person,args.capture);return
 if args.refresh_static_quarters:refresh_static_quarters(person);return
 compiled={};native={}
 for key,entry in person['registrations'].items():
  reg=compile_registration(entry)
  if key=='standing':compiled['standing']=reg
  else:native[key]=reg
  if reg is not None and not args.skip_previews:review_board(args.character,key,entry,reg,folder)
 compiled['nativeSources']=native;compiled['frames']=None;compiled['frameCoverage']='NOT FITTED: candidate motion cells are not admitted by native source or standing proof'
 if not person.get('motionTransport'):
  manifest=json.loads((ROOT/'assets/characters/street/manifest.json').read_text())['characters'];shipped=next(p for p in manifest.values()if p.get('standing',{}).get('file','').endswith('/'+args.character+'-standing.webp'))
  if shipped.get('standingOnly')is not True:raise ValueError('Native-only mouth export requires exact standing-only consumer')
  standing_path=ROOT/shipped['standing']['file'].removeprefix('./')
  if digest(standing_path)!=shipped['standing']['sha256']:raise ValueError('Standing asset differs from current consumer')
  runtime=lambda r:None if r is None else{k:r[k]for k in ['rect','axes','profile']}
  definition={'schemaVersion':1,'id':shipped['id'],'cell':shipped['cell'],'grid':None,'sources':{'standing':digest(standing_path),'desktop':None,'mobile':None},'standing':runtime(compiled.get('standing')),'frames':[]}
  definition_path=ROOT/'assets/characters/street'/args.character/'mouths-candidate.json';definition_path.parent.mkdir(parents=True,exist_ok=True);definition_path.write_text(json.dumps(definition,separators=(',',':'))+'\n')
  if definition_path.stat().st_size>262144:raise ValueError('Standing mouth definition exceeds256KiB')
  compiled['definition']={'file':'./'+str(definition_path.relative_to(ROOT)).replace('\\','/'),'sha256':digest(definition_path)}
 groups=[['standing','down','right','left'],['greet','wait','work','review'],['success','failure','look','speaking','speaking-emphasis']]
 for page,names in enumerate(groups,1):
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   boards=[Image.open(folder/(name+'-'+theme+'.png')).convert('RGB')for name in names if (folder/(name+'-'+theme+'.png')).exists()]
   if not boards:continue
   sheet=Image.new('RGB',(max(pic.width for pic in boards),sum(pic.height for pic in boards)+12*(len(boards)-1)),bg);y=0
   for pic in boards:sheet.paste(pic,(0,y));y+=pic.height+12
   sheet.save(folder/(f'pilot-page-{page}-'+theme+'.png'))
 target=OUT/'mouth-paint-candidate.json';result=json.loads(target.read_text())if target.exists()else{};result[args.character]=compiled;target.write_text(json.dumps(result,indent=2)+'\n')
 (folder/'compiled-profiles.json').write_text(json.dumps(compiled,indent=2)+'\n')
 print(json.dumps({'character':args.character,'registrations':len(person['registrations']),'candidate':str(target),'review':str(folder),'frameCoverage':'NOT FITTED'}))
 if args.motion:motion_candidate(data,person)

if __name__=='__main__':main()
