"""Build a fourteen-key preview; transport splats only across compatible anatomy."""
from pathlib import Path
import hashlib,json,subprocess
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/previews/knick-splats'
SOURCE=ROOT/'assets/buergeramt/characters/clerk-performance-detail.webp'
KEYS=('eye_right','eye_left','nose','chin','shoulder_right','elbow_right','grip_right','stamp_knob','stamp_base','shoulder_left','elbow_left','hand_left','hip_center','skirt_hem_center','foot_screen_left','foot_screen_right')
# Original 384x832 paintings, ready/raised/contact/refusal; no rescaling.
ORIGINAL=[
 [(226,125),(282,130),(265,158),(236,210),(131,260),(90,380),(151,344),(176,286),(172,405),(311,304),(318,434),(321,515),(200,430),(212,618),(175,787),(306,765)],
 [(254,156),(307,167),(294,193),(267,247),(156,264),(77,235),(114,103),(163,31),(98,159),(329,291),(333,350),(307,417),(200,430),(213,618),(175,787),(306,765)],
 [(209,181),(257,197),(234,211),(221,263),(123,250),(99,355),(194,351),(203,313),(205,398),(298,300),(317,379),(288,421),(200,430),(212,618),(175,787),(306,765)],
 [(220,123),(266,124),(252,151),(224,209),(112,252),(144,351),(287,298),(274,242),(302,336),(313,305),(305,381),(178,319),(200,430),(212,618),(175,787),(306,765)],
]
def sha(path):
 return hashlib.sha256(path.read_bytes()).hexdigest()
def similarity(source,target,query):
 x,y=source.T;system=np.zeros((len(source)*2,4))
 system[0::2]=np.column_stack((x,-y,np.ones(len(x)),np.zeros(len(x))))
 system[1::2]=np.column_stack((y,x,np.zeros(len(x)),np.ones(len(x))))
 a,b,tx,ty=np.linalg.lstsq(system,target.ravel(),rcond=None)[0]
 return query@np.array([[a,b],[-b,a]])+np.array([tx,ty])
def rigid_part(source,target,xy,part):
 indices=[0,1] if part==1 else [7,8]
 a,b=source[indices],target[indices]
 center_a=a.mean(axis=0) if part==1 else a[0]
 center_b=b.mean(axis=0) if part==1 else b[0]
 va,vb=a[1]-a[0],b[1]-b[0]
 angle=float(np.arctan2(vb[1],vb[0])-np.arctan2(va[1],va[0]))
 angle=(angle+np.pi)%(2*np.pi)-np.pi
 c,d=np.cos(angle),np.sin(angle)
 return (xy-center_a)@np.array([[c,d],[-d,c]])+center_b

def parts_for(source,xy):
 center=np.array([(source[2,0]+source[3,0])/2-10,(source[0,1]+source[3,1])/2-35])
 radii=np.array([110,(source[3,1]-source[0,1])/2+78])
 head=(((xy-center)/radii)**2).sum(axis=1)<1
 head &= xy[:,1]<source[3,1]+12
 parts=np.where(head,1,0).astype('u1')
 # Only wood and the stamp foot belong to the prop. The gripping hand,
 # cheek and collar follow the connected body map.
 knob,base=source[7],source[8]
 axis=base-knob; length=np.linalg.norm(axis); unit=axis/length
 along=(xy-knob)@unit; across=(xy-knob)@np.array([-unit[1],unit[0]])
 stamp=((xy-knob)**2).sum(axis=1)<22**2
 stamp |= (along>18)&(along<length-16)&(np.abs(across)<7)
 stamp |= (np.abs(along-length)<17)&(np.abs(across)<35)
 parts[stamp]=2
 return parts

def mapped_pixels(source,target,xy,parts):
 # Extra contour controls keep the skull and collar together while a
 # distant wrist travels. One continuous map avoids a cut at the jaw.
 center=source[:2].mean(axis=0)
 contour=center+np.array([[-90,-65],[-55,-110],[10,-110],[70,-70],[70,10],[45,75],[-15,105],[-70,65]])
 mapped_contour=similarity(source[:4],target[:4],contour)
 collar=np.array([[source[3,0],source[3,1]+40]])
 target_collar=np.array([[target[3,0],target[3,1]+40]])
 controls=np.vstack((source,contour,collar));dest=np.vstack((target,mapped_contour,target_collar))
 # Weighted local similarity limits the far-field distortion observed with
 # the global spline. Head/collar guides still need rendered review.
 weights=1/(((xy[:,None,:]-controls[None,:,:])**2).sum(axis=2)+25**2)**2
 weights/=weights.sum(axis=1,keepdims=True)
 sc=weights@controls;tc=weights@dest
 sd=controls[None,:,:]-sc[:,None,:];td=dest[None,:,:]-tc[:,None,:]
 denom=(weights*(sd**2).sum(axis=2)).sum(axis=1)
 aa=(weights*(sd*td).sum(axis=2)).sum(axis=1)/denom
 bb=(weights*(sd[:,:,0]*td[:,:,1]-sd[:,:,1]*td[:,:,0])).sum(axis=1)/denom
 q=xy-sc
 mapped=tc+np.column_stack((aa*q[:,0]-bb*q[:,1],bb*q[:,0]+aa*q[:,1]))
 stamp=parts==2
 mapped[stamp]=rigid_part(source,target,xy[stamp],2)
 # Far-reaching hand constraints must never stretch skirt, thighs or feet.
 weight=np.clip((xy[:,1]-source[12,1])/70,0,1)[:,None]
 return mapped*(1-weight)+xy*weight

def curve_controls(points,times,pair,duration):
 # Monotone cubic tangents: no overshoot outside registered source bounds.
 n=len(points);durations=np.diff(np.r_[times,duration])
 secants=(np.roll(points,-1,axis=0)-points)/durations[:,None]
 slopes=np.zeros_like(points)
 for i in range(n):
  left,right=secants[(i-1)%n],secants[i]
  same=left*right>0
  dl,dr=durations[(i-1)%n],durations[i]
  w1,w2=2*dr+dl,dr+2*dl
  slopes[i,same]=(w1+w2)/(w1/left[same]+w2/right[same])
 a,b=pair,(pair+1)%n
 return [points[a].tolist(),points[b].tolist(),(slopes[a]*durations[a]).tolist(),(slopes[b]*durations[a]).tolist()]

def world(xy):
 return np.column_stack(((xy[:,0]-512)/208,(416-xy[:,1])/208))
def main():
 cycle=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {ANCHORS,ANCHOR_TIMES,SPLAT_CANDIDATES,CYCLE_DURATION} from './spark-preview-cycle.mjs';console.log(JSON.stringify({anchors:ANCHORS,times:ANCHOR_TIMES,duration:CYCLE_DURATION,candidates:SPLAT_CANDIDATES}))"],cwd=ROOT,text=True))
 registration=json.loads((OUT/'bridge-registration.json').read_text())
 bridges={row['id']:row for row in registration['bridges']}
 atlas=Image.open(SOURCE).convert('RGBA')
 samples=[];landmarks=[];anchors=[]
 for anchor in cycle['anchors']:
  path=OUT/anchor['file'];im=Image.open(path).convert('RGBA')
  if anchor['file'].startswith('anchor-'):
   index=int(anchor['file'][7]);col=[0,2,3,1][index]
   source=np.asarray(atlas.crop((col*384,0,(col+1)*384,832)));encoded=np.asarray(im)
   assert np.array_equal(source[:,:,3],encoded[:,:,3])
   assert np.array_equal(source[source[:,:,3]>0],encoded[source[:,:,3]>0])
   padded=Image.new('RGBA',(1024,832))
   padded.paste(im,(320,0));im=padded
   points=np.array(ORIGINAL[index],float)+[320,0]
   preview='registered-'+anchor['file'];im.save(OUT/preview,'WEBP',lossless=True,exact=True,method=6)
  else:
   row=bridges[anchor['file'][:-5]]
   assert sha(path)==row['sha256']
   points=np.array([row['landmarks'][key]['target_xy'] for key in KEYS],float)
   preview=anchor['file']
  assert im.size==(1024,832)
  yy,xx=np.mgrid[1:832:3,1:1024:3]
  rgba=np.asarray(im)[yy,xx].reshape(-1,4)
  xy=np.column_stack((xx.ravel(),yy.ravel())).astype(float)
  visible=rgba[:,3]>6;samples.append((xy[visible],rgba[visible]));landmarks.append(points)
  anchors.append({**anchor,'preview':preview,'sha256':sha(path),'preview_sha256':sha(OUT/preview)})
 slots=((max(len(xy) for xy,_ in samples)+255)//256)*256
 dtype=np.dtype([('mapping','<f4',(4,)),('rgba','u1',(4,))])
 records=np.zeros((len(anchors),slots*2),dtype=dtype);part_records=np.zeros((len(anchors),slots*2),dtype='u1');policies=[]
 head_centers=world(np.array([x[:2].mean(axis=0) for x in landmarks]));stamp_centers=world(np.array([x[7] for x in landmarks]))
 for pair in range(len(anchors)):
  a,b=pair,(pair+1)%len(anchors);s,t=landmarks[a],landmarks[b]
  ratio=float(np.linalg.norm(t[8]-t[7])/np.linalg.norm(s[8]-s[7]))
  compatible=pair in cycle['candidates']
  reason='local similarity paint transport with connected collar and rigid stamp' if compatible else 'brief protected occlusion, grip or paper handoff'
  policy={'from':anchors[a]['id'],'to':anchors[b]['id'],'mode':'splat' if compatible else 'pose','reason':reason,'stamp_axis_ratio':round(ratio,4)}
  policy['head_curve']=curve_controls(head_centers,cycle['times'],pair,cycle['duration']);policy['stamp_curve']=curve_controls(stamp_centers,cycle['times'],pair,cycle['duration'])
  angles=[]
  for indices in [[0,1],[7,8]]:
   va,vb=s[indices[1]]-s[indices[0]],t[indices[1]]-t[indices[0]]
   delta=float(np.arctan2(vb[1],vb[0])-np.arctan2(va[1],va[0]))
   angles.append(-((delta+np.pi)%(2*np.pi)-np.pi))
  policy['rigid_angles']=angles;policies.append(policy)
  for group,index,other in [(0,a,b),(1,b,a)]:
   xy,rgba=samples[index]
   parts=parts_for(landmarks[index],xy)
   part_records[pair,group*slots:group*slots+len(xy)]=parts
   mapped=mapped_pixels(landmarks[index],landmarks[other],xy,parts) if compatible else xy
   start,end=(xy,mapped) if group==0 else (mapped,xy)
   chunk=records[pair,group*slots:group*slots+len(xy)]
   chunk['mapping']=np.column_stack((world(start),world(end)));chunk['rgba']=rgba
 data=OUT/'correspondence.bin';data.write_bytes(records.tobytes())
 part_file=OUT/'parts.bin';part_file.write_bytes(part_records.tobytes())
 manifest={
  'status':'preview-only; authored bridge study, not accepted production character animation',
  'character':'Frau Knick','source':SOURCE.relative_to(ROOT).as_posix(),'source_sha256':sha(SOURCE),
  'registration_sha256':sha(OUT/'bridge-registration.json'),'canvas_xy':[1024,832],
  'anchors':anchors,'transitions':policies,'sample_stride_px':3,
  'anchor_sample_counts':[len(xy) for xy,_ in samples],'slots_per_anchor':slots,
  'sample_count':slots*2,'segment_count':len(anchors),'record_bytes':20,
  'record_fields':['startX:f32le','startY:f32le','endX:f32le','endY:f32le','sRGB_R:u8','sRGB_G:u8','sRGB_B:u8','alpha:u8'],
  'layout':'One block per transition; source slots then target slots; unused slots have zero alpha',
  'parts_sha256':sha(part_file),'part_codes':{'body':0,'head':1,'stamp_and_grip':2},'correspondence_sha256':sha(data),'landmark_keys':KEYS,'landmarks':[x.tolist() for x in landmarks],
  'limits':['Continuous transported body across compatible poses; brief protected switches only at crossings and paper handoffs','Narrow prop ownership preserves source stamp size; opaque paint handoffs avoid translucent duplicate limbs','Fourteen original/new paintings still differ in detail; no intermediate holds','No inferred depth, skeleton or hidden artwork; original anchor pixels unchanged'],
 }
 (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8',newline='\n')
 print(json.dumps({'active_slots':slots*2,'binary_bytes':data.stat().st_size,'modes':[p['mode'] for p in policies]}))
if __name__=='__main__':
 main()
