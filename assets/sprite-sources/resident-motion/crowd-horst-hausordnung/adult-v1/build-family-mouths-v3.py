"""Own per-cell mouth centre/dual-axis transport; candidate compiler explicit."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,sys
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates
from scipy.interpolate import PchipInterpolator
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
SECTIONS=('cardinal-down','cardinal-right','cardinal-left','turn-actions')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def run(a):
    body_path=a.body.resolve();out=a.output.resolve();assert out.is_relative_to(ROOT/'output/horst-height/full-family-v1')
    body=json.loads(body_path.read_text());assert body['identity']=='crowd-horst-hausordnung'and body['selectedCells']==412 and body['sourceFiles']==348
    assert body['authoredHeight']==2.33 and body['authoredStride']==13.6305
    compiler=(a.compiler or ROOT/'tools/build-street-mouths.py').resolve()
    if a.compiler:assert a.compiler_sha and sha(compiler)==a.compiler_sha,'Explicit candidate bytes required'
    else:assert a.compiler_sha is None
    transport=load('horst_complete_mouth_transport',HERE/'prepare-family-mouths-v1.py');mouth=load('horst_explicit_complete_mouth_compiler',compiler);mouth.ROOT=ROOT
    compiler_content_sha=sha(compiler);rest=transport.rest_definitions(compiler,compiler_content_sha);fits=json.loads((HERE/'mouth-source-fits-v3.json').read_text())
    inputs={p.relative_to(ROOT).as_posix():sha(p)for p in[Path(__file__),HERE/'prepare-family-mouths-v1.py',HERE/'prepare-mouth-source-fits-v3.py',HERE/'mouth-source-fits-v3.json',HERE/'mouth-source-fits-v2.json',body_path]}
    inputs.update({path:sha(ROOT/path)for path in body['inputPins']});assert all(inputs[p]==h for p,h in body['inputPins'].items())
    for cell in body['cells']:assert sha(ROOT/cell['source']['file'])==cell['source']['sha256']
    out.mkdir(parents=True,exist_ok=True)
    if a.section=='finalize':
        docs=[json.loads((out/(s+'.json')).read_text())for s in SECTIONS];assert all(d['inputPins']==inputs and d['compilerContentSha256']==compiler_content_sha for d in docs);assert sha(compiler)==compiler_content_sha
        frames=[None]*420;proof=[];assigned=set()
        for doc in docs:
            for record in doc['cells']:
                slot=record['slot'];assert slot not in assigned;assigned.add(slot);frames[slot]=record['logicalRegistration'];proof.append(record)
        selected={c['row']*21+c['col']:c for c in body['cells']};assert len(assigned)==327 and sum(r is not None for r in frames)==324
        nulls=[]
        for slot,cell in selected.items():
            if cell['sourceView']in['up','up-right','up-left']:
                assert rest['records'][cell['sourceView']]['registration']is None and frames[slot]is None;nulls.append(slot)
            else:assert slot in assigned and frames[slot]is not None
        assert len(nulls)==88 and len(set(range(420))-set(selected))==8
        # Standing uses the actual own DOWN neutral source/shape at logical128.
        r=rest['records']['down'];center=np.array([64,150])+(np.asarray(r['entry']['centerPx'])-[256,472])*(136/400);axes=np.asarray(r['entry']['axesPx'])*(136/400)
        standing={'rect':[float(center[0]/128),float(1-center[1]/160),float(np.linalg.norm(axes[:2])/128),float(np.linalg.norm(axes[2:])/160)],'axes':axes.tolist(),'profile':r['registration']['profile']}
        data={'identity':body['identity'],'grid':[21,20],'selectedCells':412,'visible':324,'rearNullSelectedCells':88,'paddingNullCells':8,'frames':frames,'standing':standing,'missingFits':[],'inputPins':inputs,'compilerAdmission':{'sha256':compiler_content_sha,'official':compiler==(ROOT/'tools/build-street-mouths.py').resolve()},'sourceProof':proof,'roundedBite':'Real production shader authority; CPU scalar PNG reference is a separate oracle','readability':'Existing RIGHT mobile CPU zero /weakbite/tinylandscape qualifications retained'}
        target=out/'mouths-working.json';assert not target.exists();target.write_text(json.dumps(data,indent=2,allow_nan=False)+'\n');print(json.dumps({'status':'FULL OWN MOUTH METADATA SOURCE TERMINAL','visible':324,'rearNull':88,'paddingNull':8,'sha256':sha(target)}));return
    receipt=out/(a.section+'.json');assert not receipt.exists();cells=[]
    selection=[c for c in body['cells']if (a.section=='turn-actions'and c['kind']in['turn','action'])or(a.section=='cardinal-'+c['heading']and c['kind']in['walk','stop','bridge'])]
    assert len(selection)==(72 if a.section=='turn-actions'else 85)
    for c in selection:
        direction=c['sourceView'];slot=c['row']*21+c['col'];base=rest['records'][direction]
        if base['registration']is None:
            cells.append({'slot':slot,'sourceView':direction,'logicalRegistration':None,'nullReason':'Actual own rear face; no mouth paint emitted'});continue
        path=ROOT/c['source']['file'];entry,jac=transport.posed_entry(base,path,c['sourceField'].get('headField'));reg=mouth.compile_registration(entry)
        assert reg['profile']==base['registration']['profile'],'Accepted local own profile must stay exact'
        image=Image.open(path).convert('RGBA');alpha=np.asarray(image)[:,:,3];axes=np.asarray(entry['axesPx']).reshape(2,2).T;center=np.asarray(entry['centerPx']);p=reg['profile'];x=np.linspace(p['corners'][0],p['corners'][1],1001)
        curves={k:mouth.curve(x,p[k],p['corners'])for k in mouth.NAMES};support={}
        for k,y in curves.items():
            pts=np.stack([x,y],-1)@axes.T+center;v=map_coordinates(alpha.astype(float),[pts[:,1],pts[:,0]],order=1,mode='constant',cval=0,prefilter=False);support[k]=float(v.min());assert v.min()>=200,('Actual posed source contour leaves own supported face',slot,k,float(v.min()))
        fraction=np.linspace(0,1,81)[:,None];y=curves['open_upper']+(curves['open_lower']-curves['open_upper'])*fraction;pts=np.stack([np.broadcast_to(x,y.shape),y],-1)@axes.T+center;v=map_coordinates(alpha.astype(float),[pts[:,:,1],pts[:,:,0]],order=1,mode='constant',cval=0,prefilter=False);assert v.min()>=200,('Actual posed entire oral interior lacks source paint',slot,float(v.min()))
        field=c['sourceField'].get('headField');original=Image.open(HERE/f'registered-v1/{direction}.png').convert('RGBA');yy,xx=np.mgrid[:512,:512];q=np.stack([xx-center[0],yy-center[1]],-1)@np.linalg.inv(axes).T;collar=(q[:,:,0]>=p['corners'][0])&(q[:,:,0]<=p['corners'][1])&(q[:,:,1]>=-1.6)&(q[:,:,1]<=3)
        if field is None:assert np.array_equal(np.asarray(image)[collar],np.asarray(original)[collar]),'Actual fixed owning head originalRGBA exact'
        else:
            # Current admitted head is rigid through139; actual full PCHIP and
            # both-axis Jacobian are nevertheless used above. Independent ROI
            # sample replays the real body warp, never a copied y-bob.
            paint=load('horst_source_replay_painter',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')
            sy=yy[collar].astype(float);dy=PchipInterpolator(field['nodes_y'],field['dy']);dx=PchipInterpolator(field['nodes_y'],field['dx'])
            for _ in range(10):sy=yy[collar]-dy(np.clip(sy,0,511))
            sx=xx[collar]-dx(np.clip(sy,0,511));expected=np.asarray(paint.unpack(paint.sample(paint.premul(original),sx[None,:],sy[None,:])))[0]
            assert np.array_equal(np.asarray(image)[collar],expected),'Actual reaction oral region differs from owning field/source replay'
        s=136/400;lc=np.array([64,150])+(center-[256,472])*s;la=np.asarray(entry['axesPx'])*s
        logical={'rect':[float(lc[0]/128),float(1-lc[1]/160),float(np.linalg.norm(la[:2])/128),float(np.linalg.norm(la[2:])/160)],'axes':la.tolist(),'profile':base['registration']['profile']}
        cells.append({'slot':slot,'row':c['row'],'col':c['col'],'sourceView':direction,'source':c['source'],'logicalRegistration':logical,'sourceEntry':entry,'sourceRegistration':reg,'transport':jac,'denseContourAlphaMin':support,'denseInteriorAlphaMin':float(v.min()),'actualOwningBodyMouthRgbaReplay':True})
    for p,h in inputs.items():assert sha(ROOT/p)==h,p
    assert sha(compiler)==compiler_content_sha,'Actual supplied compiler bytes changed during generation'
    receipt.write_text(json.dumps({'section':a.section,'inputPins':inputs,'compilerContentSha256':compiler_content_sha,'cells':cells,'sourceOnly':True,'mouthSourceShapeUnchanged':True,'noNewImages':True},indent=2,allow_nan=False)+'\n');print(json.dumps({'status':'OWN MOUTH SOURCE SECTION TERMINAL','section':a.section,'selectedCells':len(cells),'visible':sum(c['logicalRegistration']is not None for c in cells)}))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--body',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--section',choices=SECTIONS+('finalize',),required=True);parser.add_argument('--compiler',type=Path);parser.add_argument('--compiler-sha');run(parser.parse_args())
