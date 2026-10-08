"""Build compact single-cloud Gaussian action arcs from registered painted keys."""
from pathlib import Path
import json, hashlib, gzip, argparse, math
import numpy as np
from PIL import Image, ImageDraw
from scipy.optimize import linear_sum_assignment
from scipy.spatial.distance import cdist
from scipy.spatial import cKDTree

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/buergeramt/animation'
KEYS=('eye_right','eye_left','nose','chin','shoulder_right','elbow_right','grip_right','stamp_knob','stamp_base','shoulder_left','elbow_left','hand_left','hip_center','skirt_hem_center','foot_screen_left','foot_screen_right')
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def similarity(s,t,q):
 x,y=s.T;m=np.zeros((len(s)*2,4));m[::2]=np.column_stack((x,-y,np.ones(len(x)),np.zeros(len(x))));m[1::2]=np.column_stack((y,x,np.zeros(len(x)),np.ones(len(x))))
 a,b,tx,ty=np.linalg.lstsq(m,t.ravel(),rcond=None)[0]
 return q@np.array([[a,b],[-b,a]])+np.array([tx,ty])
def transport(s,t,q):
 center=s[:2].mean(axis=0);contour=center+np.array([[-90,-65],[-55,-110],[10,-110],[70,-70],[70,10],[45,75],[-15,105],[-70,65]])
 controls=np.vstack((s,contour,[[s[3,0],s[3,1]+40]]));dest=np.vstack((t,similarity(s[:4],t[:4],contour),[[t[3,0],t[3,1]+40]]))
 return deform(controls,dest,q)
def deform(controls,dest,q):
 w=1/(((q[:,None,:]-controls[None,:,:])**2).sum(axis=2)+625)**2;w/=w.sum(axis=1,keepdims=True)
 sc=w@controls;tc=w@dest;sd=controls[None,:,:]-sc[:,None,:];td=dest[None,:,:]-tc[:,None,:];d=(w*(sd**2).sum(axis=2)).sum(axis=1)
 a=(w*(sd*td).sum(axis=2)).sum(axis=1)/d;b=(w*(sd[:,:,0]*td[:,:,1]-sd[:,:,1]*td[:,:,0])).sum(axis=1)/d;v=q-sc
 return tc+np.column_stack((a*v[:,0]-b*v[:,1],b*v[:,0]+a*v[:,1]))
def line_dist(q,a,b):
 v=b-a;f=np.clip((q-a)@v/max(1,float(v@v)),0,1)
 return np.linalg.norm(q-a-f[:,None]*v,axis=1)
def ownership(q,l,stamp_region=True):
 # Coarse anatomical ownership limits matching across face, limbs and props.
 p=np.zeros(len(q),dtype='u1');head=l[:2].mean(axis=0)
 p[((q-head)**2/np.array([105**2,125**2])).sum(axis=1)<1]=1
 ra=np.minimum(line_dist(q,l[4],l[5]),line_dist(q,l[5],l[6]));la=np.minimum(line_dist(q,l[9],l[10]),line_dist(q,l[10],l[11]))
 p[(ra<36)&(ra<la)]=3;p[(la<36)&(la<ra)]=4
 p[q[:,1]>l[12,1]+40]=5
 p[(q[:,1]>l[12,1]+40)&(q[:,0]>l[12,0])]=8
 axis=l[8]-l[7];length=max(1,float(np.linalg.norm(axis)));u=axis/length;along=(q-l[7])@u;across=(q-l[7])@np.array([-u[1],u[0]])
 prop=(((q-l[7])**2).sum(axis=1)<22**2)|((along>18)&(along<length-16)&(abs(across)<7))|((abs(along-length)<17)&(abs(across)<35))
 if stamp_region:p[prop]=2
 return p

def match(a,b,s,t,stride,fixed_parts=(),local_controls=()):
 ax,ac=a[:2];bx,bc=b[:2];ap=a[2] if len(a)>2 else ownership(ax,s);bp=b[2] if len(b)>2 else ownership(bx,t);pred=transport(s,t,ax);back=transport(t,s,bx)
 for part,source,target in local_controls:
  ps,pt=map(lambda p:np.asarray(p,float),(source,target))
  pred[ap==part]=deform(ps,pt,ax[ap==part]);back[bp==part]=deform(pt,ps,bx[bp==part])
 pairs=[];ranges={}
 # One-to-one local proposals preserve a single silhouette rather than two
 # independently warped images. Unmatched border paint is born/dies gradually.
 for part in range(9):
  first=len(pairs)
  ai=np.flatnonzero(ap==part);bi=np.flatnonzero(bp==part)
  if not len(ai):
   pairs.extend((None,int(j)) for j in bi);ranges[part]=[first,len(pairs)];continue
  if not len(bi):
   pairs.extend((int(i),None) for i in ai);ranges[part]=[first,len(pairs)];continue
  if part in fixed_parts:
   assert len(ai)==len(bi)
   pairs.extend((int(i),int(j)) for i,j in zip(ai,bi));ranges[part]=[first,len(pairs)];continue
  # Solve the whole part together. Row-order greedy matching leaves its last
  # face/cloth pixels with remote targets and creates holes at the midpoint.
  cost=cdist(pred[ai],bx[bi],'sqeuclidean')*.5+cdist(ax[ai],back[bi],'sqeuclidean')*.5
  cost+=cdist(ac[ai,:3].astype(float),bc[bi,:3].astype(float),'sqeuclidean')*.001
  rows,cols=linear_sum_assignment(cost)
  used_a=set();used_b=set()
  for r,c in zip(rows,cols):
   i,j=int(ai[r]),int(bi[c]);used_a.add(i);used_b.add(j);pairs.append((i,j))
  pairs.extend((int(i),None) for i in ai if int(i) not in used_a)
  pairs.extend((None,int(j)) for j in bi if int(j) not in used_b)
  ranges[part]=[first,len(pairs)]
 # A newly visible border sample must emerge from its own painted part, not
 # from an unconstrained landmark extrapolation into empty air. Keep all
 # visible key samples exact and only constrain the alpha-zero endpoint.
 for part in range(9):
  born=np.array([j for i,j in pairs if i is None and bp[j]==part],dtype=int)
  dying=np.array([i for i,j in pairs if j is None and ap[i]==part],dtype=int)
  for missing,support,predicted,visible in [(born,ax[ap==part],back,bx),(dying,bx[bp==part],pred,ax)]:
   if not len(missing):continue
   if not len(support):predicted[missing]=visible[missing];continue
   distance,nearest=cKDTree(support).query(predicted[missing])
   outside=distance>stride
   predicted[missing[outside]]=support[nearest[outside]]
 start=np.empty((len(pairs),2));end=np.empty_like(start);c0=np.zeros((len(pairs),4),dtype='u1');c1=np.zeros_like(c0)
 for n,(i,j) in enumerate(pairs):
  start[n]=ax[i] if i is not None else back[j];end[n]=bx[j] if j is not None else pred[i]
  if i is not None:c0[n]=ac[i]
  if j is not None:c1[n]=bc[j]
 return start,end,c0,c1,ranges

def knick():
 old=json.loads((ROOT/'assets/previews/knick-splats/manifest.json').read_text())
 states=[]
 for a,l in zip(old['anchors'],old['landmarks']):
  states.append({'id':a['id'],'file':'assets/previews/knick-splats/'+a['preview'],'landmarks':l,'role':'main' if a['id'] in ('ready','raised','contact','refusal') else 'transition'})
 times=[0,1.3,2.5,3.1,3.45,4.4,5.1,5.35,6.2,6.65,7.1,7.55,8,8.45,9.1]
 handoff=ROOT/'assets/sprite-sources/buergeramt/gaussian-arcs/knick-stamp-handoff.json'
 if handoff.exists():
  extra=json.loads(handoff.read_text())
  states[5:5]=[{**frame,'role':'transition'} for frame in extra['frames']];times[5:5]=[3.75,4.07]
  existing=extra.get('existing_states',{})
  for state in states:
   metadata=existing.get('anchor-contact' if state['id']=='contact' else 'bridge-'+state['id'],{})
   state.update({key:metadata[key] for key in ('paper_polygon_xy','paper_landmarks_xy') if key in metadata})
 breaks=[0,next(i for i,s in enumerate(states) if s['id']=='raised'),next(i for i,s in enumerate(states) if s['id']=='contact'),next(i for i,s in enumerate(states) if s['id']=='refusal'),len(states)]
 arcs=[]
 for name,a,b in zip(('raise','stamp','refuse','return'),breaks,breaks[1:]):
  duration=times[b]-times[a]
  keys=[{'state':states[i%len(states)]['id'],'time':times[i]-times[a]} for i in range(a,b+1)]
  arcs.append({'id':name,'from':keys[0]['state'],'to':keys[-1]['state'],'duration':duration,'keys':keys})
 return {'version':1,'id':'clerk','canvas_xy':[1024,832],'states':states,'arcs':arcs,'source_sha256':old['source_sha256'],'head_paint_source':'ready'}

def build(spec):
 OUT.mkdir(parents=True,exist_ok=True);w,h=spec['canvas_xy'];states=spec['states'];ids={s['id']:i for i,s in enumerate(states)}
 images=[];landmarks=[]
 for s in states:
  im=Image.open(ROOT/s['file']).convert('RGBA')
  if s.get('crop_xywh'):
   x,y,cw,ch=s['crop_xywh'];im=im.crop((x,y,x+cw,y+ch))
  assert im.size==(w,h),(s['id'],im.size)
  images.append(im)
  lm=s['landmarks'];landmarks.append(np.array([lm[k] for k in KEYS] if isinstance(lm,dict) else lm,float))
 segments=[];lookup={}
 for arc in spec['arcs']:
  arc['segments']=[]
  for a,b in zip(arc['keys'],arc['keys'][1:]):
   pair=(ids[a['state']],ids[b['state']])
   if pair not in lookup:lookup[pair]=len(segments);segments.append(pair)
   arc['segments'].append({'segment':lookup[pair],'start':a['time'],'end':b['time']})
 variants={}
 dtype=np.dtype([('xy','<f4',(4,)),('start','u1',(4,)),('end','u1',(4,))])
 for variant,stride in [('desktop',5),('mobile',8)]:
  samples=[]
  for im in images:
   yy,xx=np.mgrid[1:h:stride,1:w:stride];rgba=np.asarray(im)[yy,xx].reshape(-1,4);xy=np.column_stack((xx.ravel(),yy.ravel())).astype(float);mask=rgba[:,3]>6;samples.append((xy[mask],rgba[mask]))
  for i,(state,lm) in enumerate(zip(states,landmarks)):
   regions=[(3,state.get('arm_polygon_xy')),(6,state.get('paper_polygon_xy')),(2,state.get('prop_polygon_xy'))]
   if any(polygon for part,polygon in regions):
    xy,rgba=samples[i];parts=ownership(xy,lm,stamp_region=bool(spec.get('head_paint_source')) and not state.get('prop_polygon_xy'))
    for part,polygon in regions:
     if not polygon:continue
     region=Image.new('L',(w,h));ImageDraw.Draw(region).polygon([tuple(p) for p in polygon],fill=1)
     parts[np.asarray(region)[xy[:,1].astype(int),xy[:,0].astype(int)]>0]=part
    samples[i]=(xy,rgba,parts)
  if spec.get('head_paint_source'):
   head_index=ids[spec['head_paint_source']];hx,hc=samples[head_index];hl=landmarks[head_index];hp=ownership(hx,hl)==1;hx,hc=hx[hp],hc[hp]
   def face_mask(points,marks):
    eyes=marks[:2].mean(axis=0);center=eyes+(marks[3]-eyes)*.45
    radius=np.array([np.linalg.norm(marks[1]-marks[0])*1.25,max(35.,(marks[3,1]-eyes[1])*.8)])
    return (((points-center)/radius)**2).sum(axis=1)<1
   # Preserve one hair silhouette while retaining each painting's authored
   # pupils, brows and mouth. A reused whole head cannot perform a downcast gaze.
   keep_hair=~face_mask(hx,hl);face_xy=hx[~keep_hair];hx,hc=hx[keep_hair],hc[keep_hair]
   for i,(sample,lm,state) in enumerate(zip(samples,landmarks,states)):
    xy,rgba=sample[:2];parts=sample[2].copy() if len(sample)>2 else ownership(xy,lm);eyes=lm[:2].mean(axis=0)
    # Replace the head with one connected source-paint region; changing the
    # face's paint halfway through a nod created a second hair/eye contour.
    head=(abs(xy[:,0]-eyes[0])<175)&(xy[:,1]<lm[3,1]+15)&~np.isin(parts,(2,3,4))
    body=~head;parts[parts==1]=0
    placed=similarity(hl[:4],lm[:4],hx)
    placed_face=similarity(hl[:4],lm[:4],face_xy)
    # Face slots retain the same identities and sample each key's own gaze.
    # Assignment by colour can exchange eye/skin slots and smear facial features.
    pixel=np.rint(placed_face).astype(int);pixel[:,0]=np.clip(pixel[:,0],0,w-1);pixel[:,1]=np.clip(pixel[:,1],0,h-1)
    face_rgba=np.asarray(images[i])[pixel[:,1],pixel[:,0]]
    xy=np.vstack((xy[body],placed,placed_face));rgba=np.vstack((rgba[body],hc,face_rgba));parts=np.concatenate((parts[body],np.ones(len(hx),dtype='u1'),np.full(len(face_xy),7,dtype='u1')))
    if not state.get('paper_polygon_xy') and state['id'] in ('stamp-1','stamp-2','stamp-3','contact','fold-1','fold-2'):
     center=lm[11]+np.array([-60,5]);paper=((xy-center)**2/np.array([90**2,28**2])).sum(axis=1)<1
     parts[paper]=6
    samples[i]=(xy,rgba,parts)
  blocks=[match(samples[a],samples[b],landmarks[a],landmarks[b],stride,
    fixed_parts=(1,7) if spec.get('head_paint_source') else (),
    local_controls=[(part,states[a][key],states[b][key]) for part,key in [(3,'arm_landmarks_xy'),(2,'prop_landmarks_xy'),(6,'paper_landmarks_xy')] if states[a].get(key) and states[b].get(key)]) for a,b in segments]
  count=((max(len(b[0]) for b in blocks)+255)//256)*256
  assert count<=20000,(spec['id'],count)
  records=np.zeros((len(segments),count),dtype=dtype)
  trajectories=[]
  for i,(a,b,c0,c1,ranges) in enumerate(blocks):
   a=np.column_stack(((a[:,0]-w/2)/h,(h-a[:,1])/h));b=np.column_stack(((b[:,0]-w/2)/h,(h-b[:,1])/h))
   records[i,:len(a)]['xy']=np.column_stack((a,b));records[i,:len(a)]['start']=c0;records[i,:len(a)]['end']=c1
   source,target=map(lambda n:states[n],segments[i])
   for part,key in [(6,'paper_landmarks_xy'),(2,'prop_landmarks_xy')]:
    if not source.get(key) or not target.get(key):continue
    controls=[]
    for state in (source,target):
     p=np.asarray(state[key],float);controls.append(np.column_stack(((p[:,0]-w/2)/h,(h-p[:,1])/h)))
    pa,pb=controls;va=pa[1:]-pa[0];vb=pb[1:]-pb[0]
    angle=math.atan2(float((va[:,0]*vb[:,1]-va[:,1]*vb[:,0]).sum()),float((va*vb).sum()))
    first,last=ranges[part]
    if last>first:trajectories.append({'segment':i,'start_slot':first,'end_slot':last,'pivot_start':pa[0].tolist(),'pivot_end':pb[0].tolist(),'angle_radians':angle})
  data=records.tobytes();path=OUT/(spec['id']+'-'+variant+'.bin.gz');path.write_bytes(gzip.compress(data,mtime=0))
  variants[variant]={'file':path.name,'sha256':sha(path),'decoded_sha256':hashlib.sha256(data).hexdigest(),'bytes':path.stat().st_size,'decoded_bytes':len(data),'sample_count':count,'stride_px':stride,'segment_count':len(segments),'record_bytes':24}
  if trajectories:variants[variant]['trajectories']=trajectories
 manifest={'version':1,'id':spec['id'],'representation':'paired-gaussian-paint','canvas_xy':spec['canvas_xy'],'head_paint_source':spec.get('head_paint_source'),'states':[{**s,'sha256':sha(ROOT/s['file'])} for s in states],'arcs':spec['arcs'],'segments':[{'from':states[a]['id'],'to':states[b]['id']} for a,b in segments],'variants':variants,'limits':['Main and terminal anchors are semantic checkpoints; transition anchors never create scheduled holds','One paired cloud blends position and linear-light paint; no whole-character scatter or midpoint paint swap','A fixed source head paint is similarity-transformed by face landmarks when head_paint_source is set','Main source paintings differ; Gaussian correspondence needs rendered anatomical review','Existing route/gait and dialogue owners remain authoritative']}
 if spec.get('prop_ownership'):manifest['prop_ownership']=spec['prop_ownership']
 if spec.get('compatibility'):manifest['source_notes']=spec['compatibility']
 (OUT/(spec['id']+'.json')).write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8',newline='\n')
 print(json.dumps({'id':spec['id'],'variants':variants}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--spec');args=parser.parse_args()
 build(json.loads((ROOT/args.spec).read_text()) if args.spec else knick())
