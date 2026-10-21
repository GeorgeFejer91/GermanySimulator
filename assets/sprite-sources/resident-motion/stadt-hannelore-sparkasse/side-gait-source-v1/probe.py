"""Hannelore source-only side contact/passing pilot using her own painted limbs."""
from pathlib import Path
import hashlib, importlib.util, json, math, sys
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-gait-source-v1'
NEUTRAL=HERE.parent/'neutral-source-v1'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def module(path):
    spec=importlib.util.spec_from_file_location('hannelore_street',path)
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
street=module(ROOT/'tools/build-street-character-sprites.py')
def rgba(path):return Image.open(path).convert('RGBA')
def premul_export(im,size,paint_h):
    ratio=size[0]/128
    return street.export_cell(im,{'working':{'figureHeight':400,'baseline':472},'cell':list(size),
        'pivot':[64*ratio,150*ratio],'figureHeight':paint_h})
def composite(im,bg):
    out=Image.new('RGBA',im.size,bg);out.alpha_composite(im);return out.convert('RGB')
def sheet(images,labels,theme,crop=None,mag=1):
    bg='#eee8db' if theme=='light' else '#25272b'
    ims=[(im.crop(crop) if crop else im) for im in images]
    w,h=ims[0].size
    canvas=Image.new('RGB',(len(ims)*(w+8)*mag,(h+32)*mag),bg)
    d=ImageDraw.Draw(canvas)
    ink='#111' if theme=='light' else '#eee'
    for i,(im,label) in enumerate(zip(ims,labels)):
        pos=(i*(w+8)*mag,28*mag)
        pic=composite(im,bg).resize((w*mag,h*mag),Image.Resampling.NEAREST)
        canvas.paste(pic,pos);d.text((pos[0]+3,3),label,fill=ink)
    return canvas
def register_component(raw,bounds,scale,pivot,target):
    crop=raw.crop((bounds[0]-2,bounds[1]-2,bounds[2]+2,bounds[3]+2))
    yy,xx=np.mgrid[:512,:512]
    sx=(xx-target[0])/scale+pivot[0]-bounds[0]+2
    sy=(yy-target[1])/scale+pivot[1]-bounds[1]+2
    return paint.unpack(paint.sample(paint.premul(crop),sx,sy))
def masked_far_donor(registered,original):
    a=np.asarray(registered).copy();o=np.asarray(original)
    yy,xx=np.mgrid[:512,:512]
    # Upper stocking root exists but must remain behind the original skirt.
    a[yy<391]=0
    a[(yy<400)&(o[:,:,3]==0)]=0
    return Image.fromarray(a)
def layers(original,donor,near_donor,side,direction):
    src=np.asarray(original)
    far=np.asarray(donor).copy();near=np.asarray(near_donor).copy()
    yy,xx=np.mgrid[:512,:512]
    seam=np.interp(np.arange(512),[p[1] for p in side['sourceSeam']],
        [p[0] for p in side['sourceSeam']])[:,None]
    near_region=(xx<seam) if direction=='right' else (xx>=seam)
    lower=yy>=400
    far_vis=lower&~near_region&(src[:,:,3]>0)
    near_vis=lower&near_region&(src[:,:,3]>0)
    # On the exposed side the original far outline owns the exterior. The
    # complete donor is latent in the near-occluded region, never a second
    # visible outsole beside the original painted toe.
    far_exterior=lower&~near_region&(src[:,:,3]==0)
    far[far_exterior]=0
    near_exterior=lower&near_region&(src[:,:,3]==0)
    near[near_exterior]=0
    far[far_vis]=src[far_vis]
    near[near_vis]=src[near_vis]
    return Image.fromarray(far),Image.fromarray(near),{
        'farOriginalVisiblePixels':int(far_vis.sum()),'nearOriginalVisiblePixels':int(near_vis.sum()),
        'sourceLowerPixelsAllAssigned':bool(np.all(far_vis|near_vis|~(lower&(src[:,:,3]>0))))}
def warp(im,nodes,horizontal,vertical,x,y):
    return paint.warp_layer(im,nodes,[x*f for f in horizontal],[y*f for f in vertical])
def make_frame(original,far,near,field,direction,phase):
    side=field['sides'][direction];g=field['field'];sign=side['directionSign']
    farbase=256-side['farCompleteShoeCentreX']
    nearbase=256-side['nearShoeCentreX']
    if phase==0:travel=0
    elif phase==4:travel=g['travelPx']
    elif phase==8:travel=0
    else:travel=-g['travelPx']
    far_lift=g['swingLiftPx'] if phase==0 else 0
    near_lift=g['swingLiftPx'] if phase==8 else 0
    shifts={'far':{'x':farbase+sign*travel,'y':9-far_lift},
        'near':{'x':nearbase-sign*travel,'y':-near_lift}}
    moved_far=warp(far,g['nodesY'],g['horizontalFractions'],g['verticalFractions'],**shifts['far'])
    moved_near=warp(near,g['nodesY'],g['horizontalFractions'],g['verticalFractions'],**shifts['near'])
    canvas=Image.new('RGBA',(512,512));canvas.alpha_composite(moved_far);canvas.alpha_composite(moved_near)
    a=np.asarray(canvas).copy();source=np.asarray(original)
    a[:401]=source[:401]
    a[a[:,:,3]==0,:3]=0
    return Image.fromarray(a),shifts,moved_far,moved_near
def main():
    OUT.mkdir(parents=True,exist_ok=True)
    fit=json.loads((HERE/'fit.json').read_text())
    rec=json.loads((NEUTRAL/'registration-receipt.json').read_text())
    if sha(NEUTRAL/'registration-receipt.json')!=fit['neutralReceiptSha256']:raise ValueError('Neutral receipt changed')
    raw_master=ROOT/'assets/sprite-sources/resident-motion/stadt-hannelore-sparkasse/frontright-and-leg-components-candidate.png'
    source_hash='651f81205040dc47d934d3b5ac195bd127111a5a45e56874ae86ef16cbbeea90'
    if sha(raw_master)!=source_hash:raise ValueError('Own leg source changed')
    raw=rgba(raw_master);results={};outputs={};neutrals={}
    for direction in ('right','left'):
        original_file=NEUTRAL/f'{direction}-registered.png'
        if sha(original_file)!=rec['registered'][direction]['sha256']:raise ValueError('Registered neutral changed')
        original=rgba(original_file);neutrals[direction]=sha(original_file)
        side=fit['sides'][direction]
        component=next(x for x in json.loads((NEUTRAL/'source-registration.json').read_text())['completeLegSourceComponents']
            if x['name']==side['component'])
        far_raw=register_component(raw,component['component_bounds'],side['scale'],side['donorSole'],side['targetSole'])
        far_masked=masked_far_donor(far_raw,original)
        near_component=next(x for x in json.loads((NEUTRAL/'source-registration.json').read_text())['completeLegSourceComponents']
            if x['name']==side['nearComponent'])
        near_raw=register_component(raw,near_component['component_bounds'],side['nearScale'],
            [side['nearDonorToe'][0],side['nearDonorSoleY']],
            [side['nearTargetToeX'],side['nearTargetSoleY']])
        near_masked=masked_far_donor(near_raw,original)
        # The cardinal foreground loafer is the authoritative complete near
        # shoe; keep its donor only as a comparative registration diagnostic.
        far,near,ownership=layers(original,far_masked,Image.new('RGBA',(512,512)),side,direction)
        far_raw.save(OUT/f'{direction}-far-complete-registered.png')
        far_masked.save(OUT/f'{direction}-far-hidden-under-skirt.png')
        near_raw.save(OUT/f'{direction}-near-complete-registered.png')
        near_masked.save(OUT/f'{direction}-near-hidden-under-skirt.png')
        far.save(OUT/f'{direction}-far-role.png');near.save(OUT/f'{direction}-near-role.png')
        neutral_composite=Image.new('RGBA',(512,512));neutral_composite.alpha_composite(far);neutral_composite.alpha_composite(near)
        n=np.asarray(neutral_composite).copy();o=np.asarray(original);n[:401]=o[:401];n[n[:,:,3]==0,:3]=0
        neutral_composite=Image.fromarray(n);neutral_composite.save(OUT/f'{direction}-neutral-layer-composite.png')
        phases=[];shifts={};stills=[original,far_raw,far_masked,neutral_composite]
        for phase in (0,4,8,12):
            im,transform,far_m,near_m=make_frame(original,far,near,fit,direction,phase)
            im.save(OUT/f'{direction}-phase-{phase:02}.png')
            far_m.save(OUT/f'{direction}-phase-{phase:02}-far.png')
            near_m.save(OUT/f'{direction}-phase-{phase:02}-near.png')
            for size,height in [((96,120),102.75),((64,80),68.5)]:
                premul_export(im,size,height).save(OUT/f'{direction}-phase-{phase:02}-{size[0]}x{size[1]}.png')
            phases.append(im);shifts[str(phase)]=transform
        stills.extend(phases)
        labels=['original','complete far','concealed far','neutral composite','p0','p4','p8','p12']
        for theme in ('light','dark'):
            sheet(stills,labels,theme,(160,388,340,480),3).save(OUT/f'{direction}-lower-{theme}.png')
            sheet([original,neutral_composite,*phases],['original','neutral composite','p0','p4','p8','p12'],theme).save(OUT/f'{direction}-full-{theme}.png')
            for size,height in [((96,120),102.75),((64,80),68.5)]:
                ims=[premul_export(x,size,height) for x in [original,*phases]]
                sheet(ims,['original','p0','p4','p8','p12'],theme).save(OUT/f'{direction}-{size[0]}x{size[1]}-{theme}.png')
        results[direction]={'neutral':neutrals[direction], 'ownership':ownership,'scale':side['scale'],
            'sourceFarSole':side['donorSole'],'targetFarSole':side['targetSole'],'sourceFarToe':side['donorToe'],
            'predictedFarToe':[side['targetSole'][0]+side['scale']*(side['donorToe'][0]-side['donorSole'][0]),
                side['targetSole'][1]+side['scale']*(side['donorToe'][1]-side['donorSole'][1])],
            'shifts':shifts,'neutralCompositeAlphaAddedPixels':int(np.count_nonzero((n[:,:,3]>0)&(o[:,:,3]==0))),
            'neutralOriginalOpaqueRgbaExact':bool(np.array_equal(n[o[:,:,3]>0],o[o[:,:,3]>0]))}
    for p in OUT.glob('*.png'):outputs[p.name]=sha(p)
    receipt={'schemaVersion':1,'status':'source-pilot-unreviewed','recipeSha256':sha(HERE/'fit.json'),
        'driverSha256':sha(Path(__file__)),'neutralReceiptSha256':sha(NEUTRAL/'registration-receipt.json'),
        'legMasterSha256':source_hash,'helperHashes':{'street':sha(ROOT/'tools/build-street-character-sprites.py'),
            'paintedWalk':sha(ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')},
        'results':results,'outputs':outputs}
    (OUT/'pilot-source.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'receipt':sha(OUT/'pilot-source.json'),'results':results},indent=2))
if __name__=='__main__':main()
