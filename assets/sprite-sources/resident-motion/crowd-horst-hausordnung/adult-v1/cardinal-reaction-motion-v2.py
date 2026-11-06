"""Own Horst limited cardinal/reaction fields v2; alpha-zero neutral metadata only."""
from pathlib import Path
from functools import lru_cache
import hashlib,json,math,sys
import numpy as np
from PIL import Image,ImageDraw
from scipy.interpolate import PchipInterpolator

HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

@lru_cache(None)
def controls():
    c=json.loads((HERE/'cardinal-reaction-controls-v1.json').read_text())
    assert c['authoredStride']==13.6305 and c['authoredWorldHeight']==2.33
    assert sha(HERE/c['raw']['file'])==c['raw']['sha256']
    return c

@lru_cache(None)
def sources(direction):
    c=controls();d=c['directions'][direction];path=HERE/d['file'];assert sha(path)==d['sha256']
    source=Image.open(path).convert('RGBA');a=np.array(source);yy,xx=np.mgrid[:512,:512]
    hand=Image.new('L',(512,512));ImageDraw.Draw(hand).polygon([tuple(p) for p in d['freeHandPolygon']],fill=255)
    fixed=(yy<=d['fixedCrotchThroughY'])|(np.asarray(hand)>0)
    layers={}
    for i,foot in enumerate(['viewer-left','viewer-right']):
        own=xx<d['innerLegSeamX'] if i==0 else xx>=d['innerLegSeamX']
        mask=(yy>=d['rootOverlapY'])&own&~(np.asarray(hand)>0)
        layer=a.copy();layer[~mask]=0;layers[foot]=Image.fromarray(layer)
    fixed_paint=a.copy();fixed_paint[~fixed]=0
    neutral=Image.alpha_composite(layers['viewer-left'],layers['viewer-right']);neutral.paste(source,(0,0),Image.fromarray(fixed.astype('uint8')*255))
    assembled=np.array(neutral);source_alpha=a[:,:,3];assembled_alpha=assembled[:,:,3]
    assert np.array_equal(source_alpha,assembled_alpha),'Every original alpha byte must reconstruct before metadata restore'
    assert np.array_equal(assembled[source_alpha>0],a[source_alpha>0]),'Every alpha1..255 originalRGBA byte must reconstruct before metadata restore'
    moving_union=np.maximum(np.asarray(layers['viewer-left'])[:,:,3],np.asarray(layers['viewer-right'])[:,:,3])
    assert not np.any((source_alpha>0)&~fixed&(moving_union==0)),'No original supported source may be omitted'
    for layer in layers.values():assert not np.any(np.asarray(layer)[np.asarray(hand)>0,3]),'No source hand may be moving-owned'
    empty=(source_alpha==0)&(assembled_alpha==0);metadata=int(np.count_nonzero(empty&np.any(assembled!=a,axis=2)))
    assembled[empty]=a[empty];neutral=Image.fromarray(assembled)
    assert np.array_equal(np.asarray(neutral),a),'Literal neutral everyRGBA equality after proved alpha-zero RGB bookkeeping'
    return {'controls':c,'directionControls':d,'source':source,'fixedMask':fixed,'handMask':np.asarray(hand)>0,'neutralAlphaZeroRgbMetadataRestored':metadata,'fixed':Image.fromarray(fixed_paint),**layers}

def planted_curve(p):
    p=p%1
    if .25<=p<=.75:return 2-4*p
    q=((p-.75)%1)*2
    return -1-2*q+12*q*q-8*q*q*q

def verify_field(nodes,dxs,dys,plateau,constant):
    xf=PchipInterpolator(nodes,dxs);yf=PchipInterpolator(nodes,dys)
    jac=1+yf.derivative()(np.arange(512));assert jac.min()>.5,'Own field must remain orientation-preserving'
    below=np.arange(plateau,512)
    assert np.max(np.abs(xf(below)-constant[0]))<1e-10 and np.max(np.abs(yf(below)-constant[1]))<1e-10,'Whole cuff/boot must be one rigid translation'
    return {'nodes_y':nodes,'dx':dxs,'dy':dys,'minimumVerticalJacobian':float(jac.min()),'wholeCuffBootRigidFromY':plateau,'footDxDy':list(constant)}

def walk_field(direction,index,foot):
    s=sources(direction);c=s['controls'];d=s['directionControls'];p=c['projection'];phase=index*math.tau/16
    offset=0 if foot=='viewer-left' else math.pi
    angle=phase+offset;orientation=1 if direction=='down' else -1
    ground=[orientation*p['depthAmplitude']*planted_curve((phase+t)/math.tau) for t in [0,math.pi]]
    dx=p['lateralAmplitude']*math.sin(angle)
    dy=orientation*p['depthAmplitude']*planted_curve(angle/math.tau)-max(ground)-p['swingLift']*max(0,math.cos(angle))
    root=d['fixedCrotchThroughY'];plateau=d['wholeCuffBootRigidFromY']
    nodes=[0,d['rootOverlapY'],root,d['kneeY'],d['calfY'],plateau,511]
    weights=[]
    for y in nodes:
        t=max(0,min(1,(y-root)/(plateau-root)));weights.append(t*t*(3-2*t))
    field=verify_field(nodes,[dx*w for w in weights],[dy*w for w in weights],plateau,(dx,dy))
    field.update({'projectedGroundDy':ground[0 if foot=='viewer-left' else 1]-max(ground),'independentLegPhase':angle,'clockAuthored':13.6305})
    return field

def render_walk(direction,index):
    s=sources(direction);fields={};layers={}
    for foot in ['viewer-left','viewer-right']:
        f=walk_field(direction,index,foot);fields[foot]=f
        layers[foot]=paint.warp_layer(s[foot],f['nodes_y'],f['dx'],f['dy'])
    body=Image.alpha_composite(layers['viewer-left'],layers['viewer-right']);body.paste(s['source'],(0,0),Image.fromarray(s['fixedMask'].astype('uint8')*255))
    assert np.array_equal(np.asarray(body)[s['fixedMask']],np.asarray(s['source'])[s['fixedMask']]),'Own full upper/hand/key/clipboardRGBA must stay exact'
    return body,{'kind':'walk','direction':direction,'phaseIndex':index,'fields':fields,'originalFixedRgbaExact':True,'constantForeground':'viewer-right'},layers

def action_field(action,index):
    c=controls();r=c['reactions'];assert action in r['samples'] and index in r['samples'][action]
    envelope=math.sin(index*math.tau/16) if action=='idle' else math.sin(math.pi*index/15)**2
    if index in (0,16) or (action!='idle' and index==15):envelope=0.0
    head=np.asarray(r[action]['headDxDy'])*envelope;body=np.asarray(r[action]['forebodyDxDy'])*envelope
    nodes=r['nodesY'];dx=[head[0],head[0],body[0],body[0],0,0,0];dy=[head[1],head[1],body[1],body[1],0,0,0]
    f=verify_field(nodes,dx,dy,r['completeBootsRigidAndStationaryFromY'],(0,0))
    for values in [dx,dy]:
        fn=PchipInterpolator(nodes,values);assert np.ptp(fn(np.arange(161,335)))<1e-10,'Whole own forebody/props must translate rigidly together'
    f.update({'headDxDy':head.tolist(),'forebodyDxDy':body.tolist(),'envelope':envelope})
    return f

def render_action(action,index):
    source=sources('down')['source'];f=action_field(action,index)
    body=source.copy() if f['envelope']==0 else paint.warp_layer(source,f['nodes_y'],f['dx'],f['dy'])
    body.paste(source.crop((0,400,512,512)),(0,400))
    assert np.array_equal(np.asarray(body)[400:],np.asarray(source)[400:]),'Own complete lower cuffs/boots must stay source-exact in reactions'
    return body,{'kind':'action','action':action,'phaseIndex':index,'field':f,'originalWholeBootRgbaExact':True},{'whole-source':body}

def export_native(image,variant):
    c=controls();v=c['nativeTargets'][variant];scale=v['figurePixels']/c['sourceFigurePixels'];px,py=v['pivot'];sx,sy=c['groundPivot']
    return image.convert('RGBa').transform(tuple(v['cell']),Image.Transform.AFFINE,(1/scale,0,sx-px/scale,0,1/scale,sy-py/scale),Image.Resampling.BICUBIC).convert('RGBA')

