"""Offline joint portrait fit: one neutral head, separate cameras/expressions.
Monocular depth is a regularized starting estimate, never measured anatomy.
The browser only loads the resulting GLB; diagnostics stay under output/.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw
import mediapipe as mp
from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation
from scipy.sparse import lil_matrix, csr_matrix

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / "output/kiesinger-references"
OUT = ROOT / "assets/models/kiesinger/portrait-landmarks.json"
EVIDENCE = ROOT / "output/kiesinger-fit"
EVIDENCE.mkdir(parents=True, exist_ok=True)
CANONICAL_HASH = "8bac80443397e113f41a8b565ea72c59390bc031d9defab289dba7bc0c54e618"
TASK_HASH = "64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff"
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
assert sha(REF / "canonical_face_model.obj") == CANONICAL_HASH
assert sha(REF / "face_landmarker.task") == TASK_HASH
canonical, faces = [], []
for line in (REF / "canonical_face_model.obj").read_text().splitlines():
    words = line.split()
    if words and words[0] == "v":
        x,y,z=map(float,words[1:4]);canonical.append((x,-z,y))
    if words and words[0] == "f":
        faces.append([int(item.split("/")[0])-1 for item in words[1:]])
canonical=np.asarray(canonical)
assert canonical.shape==(468,3)
N=len(canonical)
# KAS fixes the neutral expression. Speaking/smiling photos have independent
# expression parameters. Oberhausen is withheld from shared-shape fitting.
sources=[
    ("kiesinger-1967-kas.jpg",None,3.0),
    ("kiesinger-cabinet-1966.jpg",(775,525,1330,1225),.6),
    ("kiesinger-1966-front.jpg",None,1.0),
    ("kiesinger-1969-profile.jpg",(90,65,310,330),.2),
    ("kiesinger-1967-oberhausen.jpg",(335,150,635,490),0.0),
]
aligned,views,records=[],[],[]
options=mp.tasks.vision.FaceLandmarkerOptions(
    base_options=mp.tasks.BaseOptions(model_asset_path=str(REF/"face_landmarker.task")),
    running_mode=mp.tasks.vision.RunningMode.IMAGE,num_faces=1,
    min_face_detection_confidence=.25)
with mp.tasks.vision.FaceLandmarker.create_from_options(options) as detector:
    for filename,crop,weight in sources:
        photo=Image.open(REF/filename).convert("RGB")
        if crop:photo=photo.crop(crop)
        if min(photo.size)<450:
            photo=photo.resize(tuple(round(s*450/min(photo.size)) for s in photo.size))
        photo.thumbnail((1500,1500))
        result=detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=np.asarray(photo)))
        assert len(result.face_landmarks)==1,filename
        lm=np.array([[p.x,p.y,p.z] for p in result.face_landmarks[0]])[:N]
        width,height=photo.size;pixels=lm[:,:2]*[width,height]
        raw=np.column_stack((pixels[:,0],lm[:,2]*width,-pixels[:,1]))
        a=raw-raw.mean(axis=0);b=canonical-canonical.mean(axis=0)
        u,_,vh=np.linalg.svd(a.T@b)
        correction=np.eye(3);correction[2,2]=np.linalg.det(u@vh)
        rotation=u@correction@vh;a=a@rotation
        a*=.68/(a[10,2]-a[152,2])
        a[:,0]-=(a[234,0]+a[454,0])/2
        a[:,1]-=(a[234,1]+a[454,1])/2
        a[:,2]+=5.16-a[152,2];aligned.append(a)
        center=pixels.mean(axis=0)
        unit=np.linalg.norm(pixels[10]-pixels[152])/.68
        views.append(dict(photo=photo,pixels=pixels,target=(pixels-center)/unit*[1,-1],
                          unit=unit,center=center,rotation=rotation.T,weight=weight))
        records.append(dict(file=filename,sha256=sha(REF/filename),crop=crop,
                            weight=weight,role="fit" if weight else "withheld"))

# Reproduce the former blending rule as a fixed prior and baseline.
prior=aligned[0]*.75+aligned[1]*.25
lower=prior[:,2]<5.54
prior[lower]=aligned[0][lower]*.95+aligned[1][lower]*.05
prior[:,1]=prior[:,1]*.80+aligned[2][:,1]*.20
mirror=np.array([np.argmin(np.sum((canonical-p*[-1,1,1])**2,axis=1)) for p in canonical])
prior[:,1]=.625*prior[:,1]+.375*prior[mirror,1]
origin=np.array([0.,0.,5.5]);prior-=origin
# Bounded photo-only expression fields: smile, jaw opening, lip press, squint.
x,y,z=prior.T;az=z+5.5
modes=np.zeros((4,N,3))
mouth=np.exp(-(x/.16)**4-((az-5.36)/.075)**2)
corners=np.exp(-((np.abs(x)-.10)/.075)**2-((az-5.37)/.095)**2)
modes[0,:,0]=np.sign(x)*.026*corners;modes[0,:,2]=.023*corners
modes[1,:,2]=-.045*np.clip((5.40-az)/.20,0,1)
modes[1,:,1]=.016*np.clip((5.40-az)/.20,0,1)
modes[2,:,2]=-(az-5.355)*.35*mouth
for side in [-1,1]:
    mask=np.exp(-((x-side*.133)/.073)**4-((az-5.635)/.04)**2)
    modes[3,:,2]+=-(az-5.635)*.6*mask
adj=[set() for _ in range(N)]
for face in faces:
    for a,b in zip(face,face[1:]+face[:1]):adj[a].add(b);adj[b].add(a)
lap=lil_matrix((N,N))
for i,neighbors in enumerate(adj):
    lap[i,i]=1
    for j in neighbors:lap[i,j]=-1/len(neighbors)
lap=csr_matrix(lap)

def project(shape,p):
    rotation=Rotation.from_rotvec(p[:3]).as_matrix()
    deformed=shape+np.einsum('k,kij->ij',p[6:],modes)
    return (deformed@rotation)[:,[0,2]]*np.exp(p[3])+p[4:6]

def fit_camera(shape,view,neutral=False):
    start=np.zeros(10);start[:3]=Rotation.from_matrix(view['rotation']).as_rotvec()
    rotated=(shape@view['rotation'])[:,[0,2]]
    start[3]=np.log(np.linalg.norm(view['target'])/np.linalg.norm(rotated-rotated.mean(axis=0)))
    start[4:6]=view['target'].mean(axis=0)-rotated.mean(axis=0)*np.exp(start[3])
    def residual(p):
        return np.r_[((project(shape,p)-view['target'])*view['confidence'][:,None]/.006).ravel(),p[6:]*.8]
    lower=np.r_[np.full(6,-np.inf),np.full(4,-1.8)];upper=-lower
    if neutral:lower[6:]=-1e-10;upper[6:]=1e-10
    return least_squares(residual,start,bounds=(lower,upper),loss='soft_l1',max_nfev=180).x

for index,view in enumerate(views):
    confidence=np.ones(N)
    if index:
        confidence*=1-.65*mouth
        confidence*=1-.35*np.exp(-((az-5.635)/.055)**2)
        # Hidden-side detector predictions do not measure the hidden surface.
        yaw=view['rotation'][0,1]
        if abs(yaw)>.35:confidence[np.sign(yaw)*x>0]*=.15
    view['confidence']=confidence
    view['camera']=fit_camera(prior,view,index==0)
training=views[:4]
start=np.r_[np.zeros(N*3),np.concatenate([v['camera'] for v in training])]

def residual(parameters):
    delta=parameters[:N*3].reshape(N,3);shape=prior+delta
    cameras=parameters[N*3:].reshape(4,10);result=[]
    for view,p in zip(training,cameras):
        result.append(((project(shape,p)-view['target'])*view['confidence'][:,None]*np.sqrt(view['weight'])/.006).ravel())
    result.extend([(delta/.045*.8).ravel(),(lap@delta/.008*.8).ravel(),
                   ((delta[:,1]-delta[mirror,1])/.04*.3).ravel(),
                   ((delta[:,0]+delta[mirror,0])/.012).ravel(),
                   ((delta[:,2]-delta[mirror,2])/.025*.6).ravel(),
                   (cameras[:,6:]*.8).ravel()])
    return np.concatenate(result)

# Sparse numerical derivatives keep the offline solve bounded and local.
rows=4*N*2+N*9+16
sparsity=lil_matrix((rows,len(start)),dtype=int)
for k in range(4):
    for i in range(N):
        r=k*N*2+i*2;sparsity[r:r+2,i*3:i*3+3]=1
        sparsity[r:r+2,N*3+k*10:N*3+(k+1)*10]=1
offset=4*N*2
for i in range(N):
    for axis in range(3):
        sparsity[offset+i*3+axis,i*3+axis]=1
        for j in adj[i]|{i}:sparsity[offset+N*3+i*3+axis,j*3+axis]=1
    sparsity[offset+N*6+i,[i*3+1,mirror[i]*3+1]]=1
    sparsity[offset+N*7+i,[i*3,mirror[i]*3]]=1
    sparsity[offset+N*8+i,[i*3+2,mirror[i]*3+2]]=1
for k in range(4):
    for j in range(4):sparsity[offset+N*9+k*4+j,N*3+k*10+6+j]=1
lo=np.r_[np.full(N*3,-.09),np.tile(np.r_[np.full(6,-np.inf),np.full(4,-1.8)],4)]
hi=-lo;lo[N*3+6:N*3+10]=-1e-10;hi[N*3+6:N*3+10]=1e-10
fit=least_squares(residual,start,jac_sparsity=sparsity.tocsr(),bounds=(lo,hi),
                  loss='soft_l1',f_scale=1,max_nfev=250,ftol=2e-5,xtol=2e-5,gtol=2e-5)
assert fit.success,fit.message
shape=prior+fit.x[:N*3].reshape(N,3)
assert np.isfinite(shape).all()
assert np.max(np.linalg.norm(shape-prior,axis=1))<.12
report=dict(method='shared neutral shape, scaled-orthographic per-photo cameras, four bounded expression modes',
            success=bool(fit.success),evaluations=fit.nfev,cost=float(fit.cost),views=[])
for index,view in enumerate(views):
    camera=fit.x[N*3:].reshape(4,10)[index] if index<4 else fit_camera(shape,view)
    before=project(prior,view['camera']);after=project(shape,camera)
    iod=np.linalg.norm(view['target'][33]-view['target'][263])
    error=lambda p:float(np.mean(np.linalg.norm(p-view['target'],axis=1)*view['confidence'])/np.mean(view['confidence'])/iod)
    overlay=view['photo'].copy();draw=ImageDraw.Draw(overlay)
    for target,prediction in zip(view['pixels'],after*[1,-1]*view['unit']+view['center']):
        draw.ellipse((target[0]-1,target[1]-1,target[0]+1,target[1]+1),fill=(220,50,40))
        draw.ellipse((prediction[0]-1,prediction[1]-1,prediction[0]+1,prediction[1]+1),fill=(40,210,80))
    overlay.save(EVIDENCE/(Path(sources[index][0]).stem+'-overlay.png'))
    report['views'].append(dict(file=sources[index][0],role=records[index]['role'],
        before_normalized_error=error(before),after_normalized_error=error(after),
        camera=camera.tolist(),rotation=Rotation.from_rotvec(camera[:3]).as_matrix().tolist(),
        image_size=list(view['photo'].size),pixel_unit=view['unit'],pixel_center=view['center'].tolist()))

# Maintain the established body interface, with chin 5.16 and forehead 5.84.
vertices=shape+origin;scale=.68/(vertices[10,2]-vertices[152,2])
vertices*=scale;vertices[:,2]+=5.16-vertices[152,2]
vertices[:,0]-=(vertices[234,0]+vertices[454,0])/2
vertices[:,1]-=(vertices[234,1]+vertices[454,1])/2
report['authoring_transform']=dict(scale=float(scale),translation=(vertices[0]-shape[0]*scale).tolist())
neutral=views[0];projection=project(shape,fit.x[N*3:].reshape(4,10)[0])
pixels=projection*[1,-1]*neutral['unit']+neutral['center']
uv=pixels/neutral['photo'].size;uv[:,1]=1-uv[:,1]
summary=[{k:v for k,v in r.items() if k in ('file','role','before_normalized_error','after_normalized_error')} for r in report['views']]
OUT.write_text(json.dumps(dict(method=report['method'],mediapipe_version=mp.__version__,
    canonical_sha256=CANONICAL_HASH,task_sha256=TASK_HASH,reference_photos=records,fit_summary=summary,
    neutral_photo_uv=np.round(uv,7).tolist(),vertices=np.round(vertices,7).tolist(),faces=faces),separators=(',',':'))+'\n')
(EVIDENCE/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='views'}))
for item in summary:print(json.dumps(item))
