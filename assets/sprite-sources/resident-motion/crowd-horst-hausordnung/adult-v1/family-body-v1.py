"""PREP: canonical Horst family routes only; source bake separately authorized.

Own anatomical fields/paint only. No quarter gait, output cache or expected-image
generation dependency. Callers provide a fresh owned staging root for UR parts.
"""
from pathlib import Path
from functools import lru_cache
import importlib.util,math
import numpy as np
from PIL import Image
HERE=Path(__file__).resolve().parent
ORDER=('down','right','up','left')
TURN=('down','front-right','right','rear-right','up','rear-left','left','front-left')
SOURCE_VIEW={'front-right':'down-right','rear-right':'up-right','rear-left':'up-left','front-left':'down-left'}
ACTIONS=('idle','look','success','failure')

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

@lru_cache(None)
def modules():
    return load('horst_family_profiles',HERE/'profile-motion-v2.py'),load('horst_family_cardinals',HERE/'cardinal-reaction-motion-v2.py')

def layout():
    # Existing canonical capability layout mechanics, no actor anatomy imported.
    movement={(r,c)for r in range(4)for c in range(16)}|{(r,c)for r in range(4,8)for c in range(5)}|{(8,c)for c in range(8)}
    gestures={(r,c)for r in range(16,20)for c in range(16)}
    free=((r,c)for r in range(20)for c in range(21)if(r,c)not in movement|gestures)
    return movement,gestures,[next(free)for _ in range(256)]

def render_walk(heading,index,strength=1):
    assert heading in ORDER and 0<=index<16 and 0<=strength<=1
    profile,cardinal=modules()
    if heading in('right','left'):
        body,record=profile.render(heading,index*math.tau/16,strength)
        return body,{**record,'kind':'walk-scaled-own-profile','phaseIndex':index,'headField':None}
    s=cardinal.sources(heading)
    if strength==0:
        # Original neutral ownership reconstruction was independently proved;
        # source copy here is the actual zero-strength pose, not a gap bypass.
        return s['source'].copy(),{'kind':'neutral-own-cardinal','direction':heading,'phaseIndex':index,'strength':0,'headField':None,'ownershipProof':'Accepted task2 strict alpha1..255 reconstruction plus explicit A0RGB bookkeeping'}
    fields={};layers={}
    for foot in['viewer-left','viewer-right']:
        full=cardinal.walk_field(heading,index,foot)
        f=cardinal.verify_field(full['nodes_y'],[v*strength for v in full['dx']],[v*strength for v in full['dy']],full['wholeCuffBootRigidFromY'],[v*strength for v in full['footDxDy']])
        f.update(projectedGroundDy=full['projectedGroundDy']*strength,independentLegPhase=full['independentLegPhase'],clockAuthored=13.6305)
        fields[foot]=f;layers[foot]=cardinal.paint.warp_layer(s[foot],f['nodes_y'],f['dx'],f['dy'])
    body=Image.alpha_composite(layers['viewer-left'],layers['viewer-right']);body.paste(s['source'],(0,0),Image.fromarray(s['fixedMask'].astype('uint8')*255))
    assert np.array_equal(np.asarray(body)[s['fixedMask']],np.asarray(s['source'])[s['fixedMask']]),'Every original fixed upper/hand/keys/clipboardRGBA exact'
    return body,{'kind':'walk-scaled-own-cardinal','direction':heading,'phaseIndex':index,'strength':strength,'fields':fields,'headField':None,'foreground':'viewer-right','authoredStride':13.6305}

def action_field(action,index):
    assert action in ACTIONS and 0<=index<16
    _,cardinal=modules();r=cardinal.controls()['reactions']
    # Exact accepted own formula; only sampler domain expands to all16 slots.
    envelope=math.sin(index*math.tau/16)if action=='idle'else math.sin(math.pi*index/15)**2
    if index==0 or(action!='idle'and index==15):envelope=0.0
    head=np.asarray(r[action]['headDxDy'])*envelope;body=np.asarray(r[action]['forebodyDxDy'])*envelope
    dx=[head[0],head[0],body[0],body[0],0,0,0];dy=[head[1],head[1],body[1],body[1],0,0,0]
    f=cardinal.verify_field(r['nodesY'],dx,dy,r['completeBootsRigidAndStationaryFromY'],(0,0))
    from scipy.interpolate import PchipInterpolator
    for values in[dx,dy]:assert np.ptp(PchipInterpolator(r['nodesY'],values)(np.arange(161,335)))<1e-10,'Rigid complete own forebody/prop attachment band'
    f.update(headDxDy=head.tolist(),forebodyDxDy=body.tolist(),envelope=envelope)
    return f

def render_action(action,index):
    _,cardinal=modules();source=cardinal.sources('down')['source'];f=action_field(action,index)
    body=source.copy()if f['envelope']==0 else cardinal.paint.warp_layer(source,f['nodes_y'],f['dx'],f['dy'])
    body.paste(source.crop((0,400,512,512)),(0,400));assert np.array_equal(np.asarray(body)[400:],np.asarray(source)[400:])
    return body,{'kind':'action','action':action,'phaseIndex':index,'field':f,'headField':f,'originalWholeBootRgbaExact':True,'authoredStride':13.6305}

def neutral(heading,parts_out):
    profile,cardinal=modules();source=SOURCE_VIEW.get(heading,heading)
    if source in('right','left'):
        return profile.sources(source)['assembled-neutral'].copy(),{'kind':'turn','heading':heading,'sourceView':source,'headField':None,'wholeLegSource':'Approved own v6 assembly'}
    if source=='up-right':
        # Rebuild actual raw/contour recipe in fresh staging, not an ignored
        # expected neutral image. No motion or separate per-boot transform.
        recipe=load('horst_family_curved_ur_neutral',HERE/'prepare-quarter-far-v2.py')
        folder=Path(parts_out)/'up-right-neutral-v2';assert not folder.exists();folder.mkdir(parents=True)
        report=recipe.run(folder)
        return Image.open(folder/'neutral-newfar-only.png').convert('RGBA'),{'kind':'turn','heading':heading,'sourceView':source,'headField':None,'wholeFarRegistration':{'controlsSha256':report['controlsSha256'],'uniformScalar':report['uniformScalar'],'translation':report['translation'],'oldFarTransferredPositivePixels':report['transferredPositiveOriginalOldFarPixels']}}
    path=HERE/f'registered-v1/{source}.png'
    return Image.open(path).convert('RGBA'),{'kind':'turn','heading':heading,'sourceView':source,'headField':None,'wholeLegSource':'Exact own genuine registered painting'}
