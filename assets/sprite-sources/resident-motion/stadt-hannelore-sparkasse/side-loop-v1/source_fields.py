"""Continuous own source controls. No cell cache, source-pose fallback or runtime."""
from pathlib import Path
import hashlib,json,sys,importlib.util
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(name,p):
    s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def travel(p):
    p=float(p)%16
    if p<=8:return 12-3*p
    t=(p-8)/8
    return 12*(-1-2*t+12*t*t-8*t*t*t)
def weights(p):
    a=np.sin(2*np.pi*(float(p)%16)/16)
    return max(0,-a)**2,max(0,a)**2
def bbox(m):
    y,x=np.where(m)
    return None if not len(x) else [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
class SideFields:
    def __init__(self):
        self.recipe=json.loads((HERE/'recipe.json').read_text());sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
        self.paint=load('side_loop_paint',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py');self.yy,self.xx=np.mgrid[:512,:512];self.sources={}
        for h,c in self.recipe['sides'].items():
            parts={k:Image.open(ROOT/v['file']).convert('RGBA') for k,v in c['sources'].items()};ua=np.array(parts['upper-preserved']);edge=np.array(c['garmentCutoffWorking']);cut=(self.xx>=edge[0,0])&(self.xx<=edge[-1,0])&(self.yy>=np.interp(self.xx,edge[:,0],edge[:,1]));ua[cut]=0;ua[ua[:,:,3]==0,:3]=0;parts['upper']=Image.fromarray(ua)
            cap=[];witnesses=[];centroids=[]
            for k,limb in enumerate(['near','far']):
                a=np.array(parts[limb+'-complete']);ca=np.zeros_like(a);points=[]
                for x in range(512):
                    ys=np.where(a[:,x,3]>=20)[0]
                    if len(ys) and ys[0]<=np.ceil(c['rootY'][k])+2:ca[ys[0],x]=a[ys[0],x];points.append([x,int(ys[0]),int(a[ys[0],x,3])])
                cp=np.array(points,float);centroids.append((cp[:,:2]*cp[:,2:3]).sum(0)/cp[:,2].sum());cap.append(Image.fromarray(ca))
                box=c['measuredShoeBoundsAlpha20'][k];centre=c['sourceFootCentresX'][k];bottom=int(np.where(a[:,:,3].max(1)>=20)[0].max());xs=np.where(a[bottom,:,3]==a[bottom,:,3].max())[0];support=int(xs[np.argmin(abs(xs-centre))]);marks={}
                for name,x in [('centre',int(round(centre))),('heel',box[0]+8 if c['travelX']==1 else box[2]-9),('forefoot',box[2]-9 if c['travelX']==1 else box[0]+8),('support',support)]:
                    ys=np.where((a[:,x,3]>=20)&(np.arange(512)>=c['rigidFromY'][k]))[0];y=int(ys.max());marks[name]={'sourcePoint':[x,y],'sourceRgba':a[y,x].tolist(),'pixelCentreUncertaintyWorking':.5}
                witnesses.append(marks)
            self.sources[h]={'parts':parts,'caps':cap,'capCentroids':centroids,'witnesses':witnesses}
    def controls(self,h,p,strength=1):
        assert 0<=strength<=1;p=float(p)%16;c=self.recipe['sides'][h];wn,wf=weights(p);result=[]
        for k in range(2):
            stride=c['travelX']*(travel(p if k==0 else p+8)+(12*wn if k==0 else 0))*strength;lift=(12*wn if k==0 else 7*wf)*strength;raiseY=(5+2*wn*strength) if k==0 else c['rootRaisePerLimb'][k];base=(256-c['sourceFootCentresX'][k])*strength
            root=c['rootY'][k];rigid=c['rigidFromY'][k];nodes=[0,root,root+7,rigid,511];dx=[base,base,base+stride*.35,base+stride,base+stride];dy=[-raiseY,-raiseY,-raiseY+(-lift+raiseY)*.35,-lift,-lift];angle=self.recipe['nearToeUpDegrees'][h]*wn*strength if k==0 else 0
            result.append({'limb':'near' if k==0 else 'far','nodesY':nodes,'dx':dx,'dy':dy,'travelWorking':stride,'baseX':base,'liftWorking':lift,'rootRaiseWorking':raiseY,'rotationDegrees':angle,'phase':p,'strength':strength})
        return result
    def render(self,h,p,strength=1,diagnostics=True):
        c=self.recipe['sides'][h];s=self.sources[h];upper=s['parts']['upper'];ua=np.array(upper)[:,:,3];layers=[];caps=[];records=[];raw=[]
        for k,control in enumerate(self.controls(h,p,strength)):
            src=s['parts'][control['limb']+'-complete'];fx=PchipInterpolator(control['nodesY'],control['dx']);fy=PchipInterpolator(control['nodesY'],control['dy']);j=1+fy.derivative()(np.arange(512));assert j.min()>.5
            pivotSource=s['capCentroids'][k];pivot=pivotSource+np.array([fx(pivotSource[1]),fy(pivotSource[1])]);theta=np.deg2rad(control['rotationDegrees']);co,si=np.cos(theta),np.sin(theta)
            if theta==0:preX=self.xx;preY=self.yy.astype(float)
            else:
                qx,qy=self.xx-pivot[0],self.yy-pivot[1];preX=pivot[0]+co*qx+si*qy;preY=pivot[1]-si*qx+co*qy
            sy=np.array(preY,float)
            for _ in range(10):sy=preY-fy(np.clip(sy,0,511))
            sx=preX-fx(np.clip(sy,0,511));sample=lambda im:self.paint.unpack(self.paint.sample(self.paint.premul(im),sx,sy));im=sample(src);layers.append(im);cap=sample(s['caps'][k]);caps.append(cap);ca=np.array(cap)[:,:,3];uncovered=(ca>=20)&(ua<200);a=np.array(im)
            def forward(x,y,fx=fx,fy=fy,theta=theta,pivot=pivot,co=co,si=si):
                tx,ty=x+fx(y),y+fy(y)
                if theta==0:return tx,ty
                qx,qy=tx-pivot[0],ty-pivot[1];return pivot[0]+co*qx-si*qy,pivot[1]+si*qx+co*qy
            marks={}
            for name,w in s['witnesses'][k].items():
                q=forward(*w['sourcePoint']);marks[name]={**w,'transportedPoint':[float(v) for v in q]}
            record={**control,'sourceSha256':sha(ROOT/c['sources'][control['limb']+'-complete']['file']),'pivotSourceCapCentroid':pivotSource.tolist(),'pivotTarget':pivot.tolist(),'pivotQualification':'Actual own paint cap control, not a hidden anatomical knee','minimumVerticalJacobian':float(j.min()),'maximumVerticalJacobian':float(j.max()),'rootCapNotCoveredByUpperAlpha200':int(uncovered.sum()),'uncoveredRootBounds':bbox(uncovered),'alpha20Bounds':bbox(a[:,:,3]>=20),'fixedSoleWitnesses':marks,'shoeRigidTranslationRotation':True}
            records.append(record);raw.append((forward,fy,np.array(src)[:,:,3]))
        dst=np.zeros((512,512,4),float)
        for im in [layers[1],layers[0],upper]:
            a=self.paint.premul(im);dst=a+dst*(1-a[:,:,3:4])
        frame=self.paint.unpack(dst);fa=np.array(frame);nearA=np.array(layers[0])[:,:,3]
        for k,(record,(forward,fy,sourceA)) in enumerate(zip(records,raw)):
            for w in record['fixedSoleWitnesses'].values():
                x,y=np.rint(w['transportedPoint']).astype(int);w['coveredByUpperAlpha200']=bool(ua[y,x]>=200);w['coveredByNearAlpha200']=bool(k==1 and nearA[y,x]>=200);w['qualification']='Fixed source pixel, never relocated for occlusion.'
            if diagnostics:
                tx,ty=forward(self.xx,self.yy);tx=np.clip(np.rint(tx).astype(int),0,511);ty=np.clip(np.rint(ty).astype(int),0,511);jac=1+fy.derivative()(self.yy);visible=(sourceA>=200)&(ua[ty,tx]<20)
                if k==1:visible&=nearA[ty,tx]<20
                hit=visible&(jac>1.5);record['visibleCalfStretch']={'sourceOpaquePixelsJOver1_5':int(hit.sum()),'visibleMaxJacobian':float(jac[visible].max()) if visible.any() else None,'sourceBounds':bbox(hit),'mappedBounds':None if not hit.any() else [int(tx[hit].min()),int(ty[hit].min()),int(tx[hit].max()+1),int(ty[hit].max()+1)],'qualification':'Partly visible calf deformation; no all-hidden claim or anatomical ratio acceptance.'}
        return frame,records,layers,caps
