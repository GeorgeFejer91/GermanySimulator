"""Own canonical412 Horst source in explicit bounded fresh staging sections."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,traceback
import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes,label
from scipy.interpolate import PchipInterpolator
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
SECTIONS=('cardinal-down','cardinal-right','cardinal-up','cardinal-left','turn-actions')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def input_pins():
    names=['build-family-source-v1.py','family-body-v1.py','profile-motion-v2.py','profile-motion-controls-v2.json','prepare-profile-layers-v6.py','profile-leg-controls-v6.json','cardinal-reaction-motion-v2.py','cardinal-reaction-controls-v1.json','prepare-quarter-far-v2.py','quarter-far-v2/registration-trial-v2.json','quarter-far-v1/raw-up-right-far-leg-v1.png','raw/raw-eight-views-v1.png','far-legs-v1/raw-complete-far-legs-v1.png','near-cloth-backing-v1/raw-right-near-cloth-v1.png','profile-layers-v6/parts-manifest.json','register-views-v1.py']
    paths=[HERE/n for n in names]+list((HERE/'registered-v1').glob('*.png'))+list((HERE/'profile-layers-v6').glob('*.png'))
    paths+=[ROOT/'.agents/skills/animate-2d-characters/scripts'/n for n in['painted_walk.py','harmonize_material.py']]
    return{p.relative_to(ROOT).as_posix():sha(p)for p in paths}

def topology(image):
    alpha=np.asarray(image)[:,:,3];support=alpha>=21;labs,_=label(alpha>=128);sizes=np.bincount(labs.ravel())[1:]
    holes=binary_fill_holes(support)&~support
    return holes,{'bounds21':Image.fromarray(support.astype('uint8')*255).getbbox(),'largeComponents128':int(np.count_nonzero(sizes>=100)),'componentSizes128':sorted(sizes.tolist(),reverse=True)[:12],'enclosedPixels21':int(holes.sum()),'alpha0WithNonzeroRgbMetadata':int(np.count_nonzero((alpha==0)&np.any(np.asarray(image)[:,:,:3]!=0,axis=2)))}

def mapped_holes(holes,field):
    yy,xx=np.mgrid[:512,:512];sy=yy.astype(float);dy=PchipInterpolator(field['nodes_y'],field['dy']);dx=PchipInterpolator(field['nodes_y'],field['dx'])
    for _ in range(10):sy=yy-dy(np.clip(sy,0,511))
    sx=xx-dx(np.clip(sy,0,511));xi=np.clip(np.rint(sx).astype(int),0,511);yi=np.clip(np.rint(sy).astype(int),0,511)
    return holes[yi,xi]

def run(args):
    out=args.output.resolve();authority=(ROOT/'output/horst-height/full-family-v1').resolve()
    assert out.is_relative_to(authority)and out!=authority,'New ignored owned source mirror only'
    pins=input_pins();router=load('horst_canonical_family_router',HERE/'family-body-v1.py');movement,gestures,stops=router.layout()
    if args.section=='plan':
        print(json.dumps({'status':'PREP only','sections':SECTIONS,'selectedCells':412,'sourceFiles':348,'sourcePins':len(pins),'output':str(out)}));return
    if args.section=='finalize':
        parts=[json.loads((out/f'section-{name}.json').read_text())for name in SECTIONS];assert all(p['inputPins']==pins for p in parts)
        cells=sorted([c for part in parts for c in part['cells']],key=lambda c:(c['row'],c['col']));assert len(cells)==412 and len({(c['row'],c['col'])for c in cells})==412
        files={c['source']['file']:c['source']['sha256']for c in cells};assert len(files)==348
        for p,h in files.items():assert sha(ROOT/p)==h,p
        pixels={p:v for part in parts for p,v in part['pixelChecks'].items()};assert len(pixels)==348
        for p,h in pins.items():assert sha(ROOT/p)==h,p
        index={'identity':'crowd-horst-hausordnung','grid':[21,20],'status':'AUTHORED OWN SOURCE2.33/13.6305; encoded/native/formal/runtime separate','authoredHeight':2.33,'authoredStride':13.6305,'sourceFigurePixels':400,'groundPivot':[256,472],'selectedCells':412,'sourceFiles':348,'inputPins':pins,'cells':cells,'pixelChecks':pixels,'quarterCapability':'Eight neutral anchors only; no quarterwalk','missingQuarterPaint':[],'runtimeAndCanonicalUntouched':True}
        target=out/'body-index.json';assert not target.exists();target.write_text(json.dumps(index,indent=2)+'\n');print(json.dumps({'status':index['status'],'selectedCells':412,'sourceFiles':348,'bodyIndexSha256':sha(target)}));return
    out.mkdir(parents=True,exist_ok=True);folder=out/'cells';folder.mkdir(exist_ok=True);receipt=out/f'section-{args.section}.json';assert not receipt.exists(),'Preserve source section/RED'
    slots={};stored={};pixel_checks={};baselines={};profile,cardinal=router.modules()
    for heading in router.ORDER:
        original=profile.sources(heading)['assembled-neutral']if heading in('right','left')else cardinal.sources(heading)['source']
        baselines[heading]=topology(original)[0]
    def add(row,col,key,image,heading,kind,record,phase=None,strength=None,action=None,action_frame=None):
        assert(row,col)not in slots
        if key not in stored:
            path=folder/f'{key}.png';assert not path.exists();image.save(path)
            holes,stats=topology(image);original_heading=router.SOURCE_VIEW.get(heading,heading)
            alpha=np.asarray(image)[:,:,3];assert alpha.shape==(512,512)
            assert not np.any(alpha[[0,-1],:]>=21)and not np.any(alpha[:,[0,-1]]>=21),('Clipped actual source support',key)
            assert stats['largeComponents128']==1,('Detached substantive source paint',key,stats)
            if original_heading in baselines:
                allowed=baselines[original_heading].copy()
                if record.get('headField')is not None:allowed=mapped_holes(allowed,record['headField'])
                elif record.get('fields'):
                    # Existing negative spaces may follow either independently
                    # owned leg. No blanket hand/root ROI or new hole waiver.
                    allowed=allowed|np.logical_or.reduce([mapped_holes(baselines[original_heading],f)for f in record['fields'].values()])
                new=holes&~allowed;stats['newEnclosedHolePixels21']=int(new.sum());assert not new.any(),('New enclosed source gap',key,np.argwhere(new).tolist()[:20])
            else:
                # Genuine unchanged quarter source/topology is measured here;
                # UR replacement root was separately accepted with full source.
                stats['newEnclosedHolePixels21']=None
            stored[key]={'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path)};pixel_checks[key]=stats
        slots[row,col]={'row':row,'col':col,'heading':heading,'sourceView':router.SOURCE_VIEW.get(heading,heading),'kind':kind,'source':stored[key],'sourceField':record,'mouthDx':0,'mouthDy':0,**({'entryPhase':phase,'strength':strength}if phase is not None else{}),**({'action':action,'actionFrame':action_frame}if action else{})}
    try:
        if args.section.startswith('cardinal-'):
            heading=args.section.removeprefix('cardinal-');i=router.ORDER.index(heading)
            for phase in range(16):
                image,record=router.render_walk(heading,phase,1);key=f'walk-{heading}-{phase:02d}'
                add(i,phase,key,image,heading,'walk',record)
                for stage in range(4):
                    strength=1-stage/4;row,col=stops[(i*16+phase)*4+stage]
                    if stage==0:add(row,col,key,image,heading,'stop',record,phase,strength)
                    else:
                        stop,stop_record=router.render_walk(heading,phase,strength);add(row,col,f'stop-{heading}-{phase:02d}-{stage}',stop,heading,'stop',stop_record,phase,strength);stop.close()
                image.close()
                (out/f'progress-{args.section}.json').write_text(json.dumps({'completePhases':phase+1,'uniqueSourceFiles':len(stored),'slots':len(slots)})+'\n')
            for col,strength in enumerate((.5,.25,0,.5,1)):
                image,record=router.render_walk(heading,0,strength);add(i+4,col,f'bridge-{heading}-{col}',image,heading,'bridge',record,0,strength);image.close()
            assert len(slots)==85 and len(stored)==69
        else:
            assert args.section=='turn-actions'
            for col,heading in enumerate(router.TURN):
                image,record=router.neutral(heading,out/'parts');add(8,col,f'neutral-{heading}',image,heading,'turn',record);image.close()
            for i,action in enumerate(router.ACTIONS):
                for frame in range(16):
                    image,record=router.render_action(action,frame);add(16+i,frame,f'action-{action}-{frame:02d}',image,'down','action',record,action=action,action_frame=frame);image.close()
            assert len(slots)==72 and len(stored)==72
        for p,h in pins.items():assert sha(ROOT/p)==h,p
        receipt.write_text(json.dumps({'section':args.section,'sourceOnly':True,'inputPins':pins,'cells':[slots[k]for k in sorted(slots)],'pixelChecks':pixel_checks,'bodyAndPropFields':'Exact own source; centres/both mouth axes use headField metadata, never frozen speech body','authoredHeight':2.33,'authoredStride':13.6305},indent=2)+'\n');print(json.dumps({'status':'SOURCE SECTION TERMINAL; actual art review pending','section':args.section,'slots':len(slots),'sourceFiles':len(stored),'inputPins':len(pins)}))
    except Exception as error:
        (out/f'RED-{args.section}.json').write_text(json.dumps({'status':'STOP FIRST NEW SOURCE/FIELD/ART RED','section':args.section,'error':str(error),'traceback':traceback.format_exc(),'completedSourceFiles':stored,'completedSlots':len(slots),'inputPins':pins},indent=2)+'\n');raise

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--section',choices=('plan',)+SECTIONS+('finalize',),default='plan');parser.add_argument('--output',type=Path,required=True);run(parser.parse_args())
