"""Horst portable raw-owned profile fields; source/native only, no runtime side effects."""
from pathlib import Path
import hashlib,json,math,sys
from functools import lru_cache
import numpy as np
from PIL import Image,ImageDraw,ImageChops,ImageFilter
from scipy.interpolate import PchipInterpolator
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def planted_curve(p):
    p=p%1
    if .25<=p<=.75:return 2-4*p
    q=((p-.75)%1)*2
    return -1-2*q+12*q*q-8*q*q*q

def polygon(points):
    result=Image.new('L',(512,512))
    if points:ImageDraw.Draw(result).polygon([tuple(p) for p in points],fill=255)
    return result

@lru_cache(None)
def sources(direction):
    import importlib.util
    c=json.loads((HERE/'profile-motion-controls-v2.json').read_text());assert direction in c['profiles']
    semantic_path=HERE/c['sourceControlFile'];assert sha(semantic_path)==c['sourceControlSha256']
    semantic=json.loads(semantic_path.read_text())
    recipe_path=HERE/c['partRecipe'];assert sha(recipe_path)==c['partRecipeSha256']
    spec=importlib.util.spec_from_file_location('horst_portable_v6_parts',recipe_path)
    recipe=importlib.util.module_from_spec(spec);spec.loader.exec_module(recipe)
    manifest=json.loads((HERE/c['partManifest']).read_text())
    assert manifest['controlsSha256']==sha(semantic_path) and manifest['expectedProductsRead'] is False
    for path,digest in manifest['inputPins'].items():assert sha(HERE/path)==digest
    fixed=recipe.semantic_masks(semantic,direction)['fixed'];images={}
    for name,entry in c['layers'][direction].items():
        actual=manifest['directions'][direction]['layers'][name]
        assert actual['file']==entry['file'] and sha(HERE/actual['file'])==actual['sha256']
        images[name]=Image.open(HERE/actual['file']).convert('RGBA')
    entry=manifest['directions'][direction]['original']
    assert entry['file']==c['originals'][direction]['file'] and sha(HERE/entry['file'])==entry['sha256']
    original=Image.open(HERE/entry['file']).convert('RGBA')
    assert c['clockPlan']['calibratedAuthoredStride']==13.6305 and c['sourceFigureWorldHeight']==2.33
    return {'controls':c,'semantic':semantic,'fixedMask':fixed,'original':original,**images}

def field(direction,phase,strength=1,foot='near'):
    s=sources(direction);c=s['controls'];assert 0<=strength<=1 and foot in('near','far')
    own=c['profiles'][direction];root=own['hipRoot'];plateau=c['wholeCuffShoePlateauY']
    angle=phase+(math.pi if foot=='far' else 0)
    dx=(1 if direction=='right' else -1)*c['amplitudeChoice']['horizontal']*planted_curve(angle/math.tau)*strength
    dy=-c['amplitudeChoice']['vertical']*max(0,math.cos(angle))*strength
    nodes=[0,s['semantic']['nearRootOverlapY'],root,own['kneeField'],own['calfField'],plateau,511]
    assert all(b>a for a,b in zip(nodes,nodes[1:]))
    def weight(y):
        t=max(0,min(1,(y-root)/(plateau-root)))
        return t*t*(3-2*t)
    weights=[weight(y) for y in nodes]
    xs=[dx*w for w in weights];ys=[dy*w for w in weights]
    yf=PchipInterpolator(nodes,ys);xf=PchipInterpolator(nodes,xs)
    jac=1+yf.derivative()(np.arange(512));assert jac.min()>.5
    test=np.arange(plateau,512)
    assert np.max(np.abs(xf(test)-dx))<1e-10 and np.max(np.abs(yf(test)-dy))<1e-10,'Complete420+cuff/shoe must translate rigidly'
    return {'nodes_y':nodes,'dx':xs,'dy':ys,'footDxDy':[dx,dy],'minimumVerticalJacobian':float(jac.min()),'wholeCuffShoeRigidFromY':plateau}

def render(direction,phase,strength=1,return_layers=False):
    s=sources(direction);layers={};fields={}
    for foot,role in [('far','far-complete'),('near','near-original')]:
        fields[foot]=field(direction,phase,strength,foot)
        layers[foot]=s[role].copy() if strength==0 else paint.warp_layer(s[role],fields[foot]['nodes_y'],fields[foot]['dx'],fields[foot]['dy'])
    image=Image.alpha_composite(layers['far'],layers['near']);image.paste(s['original'],(0,0),s['fixedMask'])
    mask=np.asarray(s['fixedMask'])>0
    assert np.array_equal(np.asarray(image)[mask],np.asarray(s['original'])[mask]),'Original forebody/hand/keys/clipboard must stay exact'
    record={'direction':direction,'phase':phase,'strength':strength,'fields':fields,'fixedOriginalRgbaExact':True,'separateCompleteLegLayers':True,'sourceClockScope':'Pilot only; actual source stance calibration required beforefinalfamily/runtime'}
    return (image,record,layers) if return_layers else(image,record)

def export_native(image,variant):
    c=sources('right')['controls'];v=c['nativeTargets'][variant];scale=v['figurePixels']/c['sourceFigurePixels'];px,py=v['pivot'];sx,sy=c['groundPivot']
    affine=(1/scale,0,sx-px/scale,0,1/scale,sy-py/scale)
    return image.convert('RGBa').transform(tuple(v['cell']),Image.Transform.AFFINE,affine,Image.Resampling.BICUBIC).convert('RGBA')
