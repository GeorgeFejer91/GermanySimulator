"""Build a fourteen-key preview; transport splats only across compatible anatomy."""
from pathlib import Path
import hashlib,json,subprocess
import numpy as np
from PIL import Image,ImageDraw

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
def tps_map(source,target,query):
 s,t,q=source/832,target/832,query/832
 def kernel(a,b):
  r2=((a[:,None,:]-b[None,:,:])**2).sum(axis=2)
  return r2*np.log(np.maximum(r2,1e-12))
 affine=np.column_stack((np.ones(len(s)),s))
 system=np.block([[kernel(s,s)+np.eye(len(s))*1e-7,affine],[affine.T,np.zeros((3,3))]])
 weights=np.linalg.solve(system,np.vstack((t,np.zeros((3,2)))))
 return np.column_stack((kernel(q,s),np.ones(len(q)),q))@weights*832
def similarity(source,target,query):
 x,y=source.T;system=np.zeros((len(source)*2,4))
 system[0::2]=np.column_stack((x,-y,np.ones(len(x)),np.zeros(len(x))))
 system[1::2]=np.column_stack((y,x,np.zeros(len(x)),np.ones(len(x))))
 a,b,tx,ty=np.linalg.lstsq(system,target.ravel(),rcond=None)[0]
 return query@np.array([[a,b],[-b,a]])+np.array([tx,ty])
def mapped_pixels(source,target,xy):
 mapped=tps_map(source,target,xy)
 # Head and the stamp/gripping hand each retain local rigid structure.
 head=xy[:,1]<source[3,1]+12
 mapped[head]=similarity(source[:4],target[:4],xy[head])
 mask=Image.new('L',(1024,832));draw=ImageDraw.Draw(mask)
 draw.line([tuple(p) for p in source[[7,6,8]]],fill=255,width=70)
 for x,y in source[[7,8]]:
  draw.ellipse((x-35,y-24,x+35,y+24),fill=255)
 stamp=np.asarray(mask)[xy[:,1].astype(int),xy[:,0].astype(int)]>0
 mapped[stamp]=similarity(source[[7,8]],target[[7,8]],xy[stamp])
 weight=np.clip((xy[:,1]-620)/80,0,1)[:,None]
 return mapped*(1-weight)+xy*weight
def world(xy):
 return np.column_stack(((xy[:,0]-512)/208,(416-xy[:,1])/208))
def main():
 cycle=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {ANCHORS,SPLAT_CANDIDATES} from './spark-preview-cycle.mjs';console.log(JSON.stringify({anchors:ANCHORS,candidates:SPLAT_CANDIDATES}))"],cwd=ROOT,text=True))
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
 records=np.zeros((len(anchors),slots*2),dtype=dtype);policies=[]
 for pair in range(len(anchors)):
  a,b=pair,(pair+1)%len(anchors);s,t=landmarks[a],landmarks[b]
  ratio=float(np.linalg.norm(t[8]-t[7])/np.linalg.norm(s[8]-s[7]))
  compatible=pair in cycle['candidates'] and .85<=ratio<=1.15
  reason='same-side stamp approach' if compatible else ('prop proportions differ' if pair in cycle['candidates'] else 'occlusion, grip or paper handoff')
  policies.append({'from':anchors[a]['id'],'to':anchors[b]['id'],'mode':'splat' if compatible else 'pose','reason':reason,'stamp_axis_ratio':round(ratio,4)})
  for group,index,other in [(0,a,b),(1,b,a)]:
   xy,rgba=samples[index]
   mapped=mapped_pixels(landmarks[index],landmarks[other],xy) if compatible else xy
   start,end=(xy,mapped) if group==0 else (mapped,xy)
   chunk=records[pair,group*slots:group*slots+len(xy)]
   chunk['mapping']=np.column_stack((world(start),world(end)));chunk['rgba']=rgba
 data=OUT/'correspondence.bin';data.write_bytes(records.tobytes())
 manifest={
  'status':'preview-only; authored bridge study, not accepted production character animation',
  'character':'Frau Knick','source':SOURCE.relative_to(ROOT).as_posix(),'source_sha256':sha(SOURCE),
  'registration_sha256':sha(OUT/'bridge-registration.json'),'canvas_xy':[1024,832],
  'anchors':anchors,'transitions':policies,'sample_stride_px':3,
  'anchor_sample_counts':[len(xy) for xy,_ in samples],'slots_per_anchor':slots,
  'sample_count':slots*2,'segment_count':len(anchors),'record_bytes':20,
  'record_fields':['startX:f32le','startY:f32le','endX:f32le','endY:f32le','sRGB_R:u8','sRGB_G:u8','sRGB_B:u8','alpha:u8'],
  'layout':'One block per transition; source slots then target slots; unused slots have zero alpha',
  'correspondence_sha256':sha(data),'landmark_keys':KEYS,'landmarks':[x.tolist() for x in landmarks],
  'limits':['Intact held drawings at occlusion, grip, paper and proportion changes; no cross-body morph','Only compatible same-side stamp approach uses transported splats','Painted pose changes remain stepped; drawings differ slightly in proportions','No inferred depth, skeleton or hidden artwork; original anchor pixels unchanged'],
 }
 (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8',newline='\n')
 print(json.dumps({'active_slots':slots*2,'binary_bytes':data.stat().st_size,'modes':[p['mode'] for p in policies]}))
if __name__=='__main__':
 main()
