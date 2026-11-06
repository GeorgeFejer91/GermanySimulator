"""Build own412 layered profile source cells in explicit output stages.

No production delivery/canonical writes. Each explicit section is independently
bounded by the existing resource wrapper; default only describes the plan.
Source art only; selected production fit and acceptance remain separate.
"""
from pathlib import Path
import argparse, hashlib, importlib.util, json, math, sys
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
STAGING=ROOT/'output/street-redesign/hildegard-brotzeit-end-to-end/layered-v2'
SECTIONS=('cardinal-down','cardinal-right','cardinal-up','cardinal-left','turn-actions')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module

def pins():
    # Actual author inputs only. Never read expected/selected/ignored products.
    paths=[HERE/n for n in ('build-family-source-v2.py','build-family-source.py','pilot-motion.py','profile-motion-v2.py','prepare-profile-layers-v2.py','profile-leg-controls-v2.json','new-motion-capability-plan.json','registration.json')]
    paths += list((HERE/'registered').glob('*.png'))
    paths += list((HERE/'profile-leg-repair-v2').glob('*.png'))
    paths += [HERE/'profile-leg-repair-v2'/n for n in ('far-leg-request-v1.json','far-leg-receipt-v1.json','profile-layer-registration.json')]
    paths += [ROOT/'tools'/n for n in ('build-street-character-sprites.py','build-street-mouths.py')]
    paths += [ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py']
    return {p.relative_to(ROOT).as_posix():sha(p) for p in paths}

def run(args):
    inputs=pins()
    out=args.output.resolve()
    assert out.is_relative_to(STAGING.resolve()) and out!=STAGING.resolve(), 'Use a new named ignored staging run'
    assert not out.is_relative_to((ROOT/'assets').resolve())
    if args.section=='plan':
        print(json.dumps({'status':'PREPARED ONLY; no source images generated','sections':SECTIONS,'finalizer':'finalize','output':str(out),'sourcePins':len(inputs),'profileRule':'Own frozen separate-leg renderer; no x-blend or hidden-sole invention','productionWrites':False}))
        return
    if args.section=='finalize':
        records=[json.loads((out/f'section-{name}.json').read_text())for name in SECTIONS]
        assert all(r['inputPins']==inputs for r in records)
        cells=sorted([c for r in records for c in r['cells']],key=lambda c:(c['row'],c['col']))
        assert len(cells)==412 and len({(c['row'],c['col'])for c in cells})==412
        unique={c['source']['file']:c['source']['sha256']for c in cells}
        assert len(unique)==348
        for name,digest in unique.items():assert sha(ROOT/name)==digest
        pixel={k:v for r in records for k,v in r['pixelChecks'].items()}
        assert len(pixel)==348
        recipes={k:v for r in records for k,v in r['recipePins'].items()}
        for name,digest in recipes.items():assert sha(ROOT/name)==digest
        index={'identity':'crowd-hildegard-brotzeit','grid':[21,20],'status':'AUTHORED SOURCE2.33; native/formal/selected fit separate','missingQuarterPaint':[],'selectedCells':412,'sourceFiles':348,'inputPins':{**inputs,**recipes},'cells':cells,'pixelChecks':pixel,'profileRepair':'Own intact near/far legs transported separately by frozen profile-motion-v2.py; complete425+whole-cuff/shoe translation plateau','shippingAndCanonicalUntouched':True}
        target=out/'body-index.json';assert not target.exists(),'Preserve a prior finalizer receipt'
        target.write_text(json.dumps(index,indent=2)+'\n');pins()
        print(json.dumps({'status':index['status'],'selectedCells':412,'sourceFiles':348,'bodyIndexSha256':sha(target)}));return
    # Imports capable of rendering only occur for an explicitly requested source section.
    import numpy as np
    from PIL import Image
    from scipy.ndimage import label
    legacy=load('hildegard_legacy_family_readonly',HERE/'build-family-source.py')
    profile=load('hildegard_intact_profile_readonly',HERE/'profile-motion-v2.py')
    street=load('hildegard_existing_source_tools',ROOT/'tools/build-street-character-sprites.py')
    recipe_paths=[Path(__file__).resolve(),HERE/'build-family-source.py',HERE/'pilot-motion.py',ROOT/'tools/build-street-character-sprites.py',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py']
    recipe_pins={p.relative_to(ROOT).as_posix():sha(p)for p in recipe_paths}
    folder=out/'cells';folder.mkdir(parents=True,exist_ok=True)
    section_path=out/f'section-{args.section}.json';assert not section_path.exists(),'Preserve prior source section'
    slots={};stored={};checks={}
    movement,gestures,stops=legacy.layout()
    def add(row,col,key,image,heading,kind,phase=None,strength=None,mouth_dy=0,action=None,action_frame=None):
        assert (row,col)not in slots
        path=folder/f'{key}.png'
        if key not in stored:
            assert not path.exists(),('Preserve prior source image',path)
            rgba=np.asarray(image)
            assert rgba.shape==(512,512,4)
            assert not np.any(rgba[rgba[:,:,3]==0,:3])
            groups,_=label(rgba[:,:,3]>=21);sizes=np.bincount(groups.ravel())[1:]
            box=image.getchannel('A').getbbox();assert box and min(box)>0 and box[2]<512 and box[3]<512
            image.save(path);stored[key]={'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path)}
            checks[key]={'bounds':list(box),'substantiveComponents':[int(v)for v in sizes if v>=15]}
            assert len(checks[key]['substantiveComponents'])==1,('Detached substantive paint',key,checks[key])
        slots[row,col]={'row':row,'col':col,'heading':heading,'kind':kind,'source':stored[key],'mouthDx':0,'mouthDy':mouth_dy,**({'action':action,'actionFrame':action_frame}if action else{}),**({'entryPhase':phase,'strength':strength}if phase is not None else{})}
    def render(heading,rad,strength):
        # Down/up retain the established own recipe. Profiles use frozen intact
        # near/far layers throughout every walk, stop and start/stop bridge.
        return(profile.render if heading in('right','left')else legacy.pilot.render)(heading,rad,strength)[0]
    def neutral(heading):
        return profile.sources(heading)['neutral'].copy()if heading in('right','left')else Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
    if args.section.startswith('cardinal-'):
        heading=args.section.removeprefix('cardinal-');i=legacy.ORDER.index(heading)
        for phase in range(16):
            rad=math.tau*phase/16;key=f'walk-{heading}-{phase:02}';image=render(heading,rad,1)
            mouth=lambda strength:-3.4*math.cos(2*rad)*strength if heading in('down','up')else 0
            add(i,phase,key,image,heading,'walk',mouth_dy=mouth(1))
            for stage in range(4):
                strength=1-stage/4;row,col=stops[(i*16+phase)*4+stage]
                add(row,col,key if stage==0 else f'stop-{heading}-{phase:02}-{stage}',image if stage==0 else render(heading,rad,strength),heading,'stop',phase,strength,mouth(strength))
        for col,strength in enumerate((.5,.25,0,.5,1)):
            add(i+4,col,f'bridge-{heading}-{col}',neutral(heading)if strength==0 else render(heading,0,strength),heading,'bridge',mouth_dy=-3.4*strength if heading in('down','up')else 0)
        assert len(slots)==85 and len(stored)==69
    else:
        assert args.section=='turn-actions'
        for col,heading in enumerate(legacy.TURN):
            image=neutral(heading)if heading in('right','left')else Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
            add(8,col,f'neutral-{heading}',image,heading,'turn')
        source=Image.open(HERE/'registered/down.png').convert('RGBA')
        for offset,action in enumerate(legacy.ACTION_NAMES):
            for col,image in enumerate(street.planted_action(source,action,16,legacy.settings(action))):
                add(16+offset,col,f'action-{action}-{col:02}',image,'down','action',action=action,action_frame=col)
        assert len(slots)==72 and len(stored)==72
    pins()
    for name,digest in recipe_pins.items():assert sha(ROOT/name)==digest
    section_path.write_text(json.dumps({'section':args.section,'inputPins':inputs,'recipePins':recipe_pins,'cells':[slots[k]for k in sorted(slots)],'pixelChecks':checks,'sourceOnly':True},indent=2)+'\n')
    print(json.dumps({'status':'PRIVATE SOURCE SECTION ONLY','section':args.section,'selectedCells':len(slots),'sourceFiles':len(stored),'sourcePinsStable':True,'productionWrites':False}))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--section',choices=('plan',)+SECTIONS+('finalize',),default='plan')
    parser.add_argument('--output',type=Path,required=True)
    run(parser.parse_args())
