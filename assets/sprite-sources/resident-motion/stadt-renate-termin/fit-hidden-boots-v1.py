"""Static uniform-scale registration of Renate's own complete far boots.

This is a measurement and occlusion pilot: no leg deformation or gait frames.
The published standing, eight registered neutral files, and earlier HOLD runs
remain untouched.
"""
from pathlib import Path
import hashlib
import importlib.util
import json

import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[4]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/renate-termin-boot-fit-v1'
spec=importlib.util.spec_from_file_location('street',ROOT/'tools/build-street-character-sprites.py')
street=importlib.util.module_from_spec(spec);spec.loader.exec_module(street)


def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def rgba_sha(image):return hashlib.sha256(image.convert('RGBA').tobytes()).hexdigest()


def bound_image(entry):
    path=ROOT/entry['path']
    if sha(path)!=entry['sha256']:raise ValueError(f'Changed source: {path}')
    return Image.open(path).convert('RGBA')


def register(image,bounds,pivot,scale):
    return street.register_source(image,{'component_bounds':bounds,'source_pivot':pivot},scale,472)[0]


def export(image,cell,pivot,paint_height):
    return street.export_cell(image,{'working':{'figureHeight':400,'baseline':472},
        'cell':cell,'pivot':pivot,'figureHeight':paint_height})


def red_support(image,region=None):
    a=np.asarray(image).astype(int)
    yy,xx=np.indices(a.shape[:2])
    mask=(a[:,:,0]>1.22*a[:,:,1])&(a[:,:,0]>1.1*a[:,:,2])&(a[:,:,0]>35)&(a[:,:,3]>150)
    if region:mask &= (xx>=region[0])&(yy>=region[1])&(xx<region[2])&(yy<region[3])
    ys,xs=np.where(mask)
    return [int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1] if len(xs) else None


def panel(items,theme,crop=None,magnify=1):
    bg=(244,239,226,255) if theme=='light' else (27,31,37,255)
    images=[]
    for im in items:
        if crop:im=im.crop(crop)
        if magnify!=1:im=im.resize((im.width*magnify,im.height*magnify),Image.Resampling.NEAREST)
        base=Image.new('RGBA',im.size,bg);base.alpha_composite(im);images.append(base)
    w,h=images[0].size
    result=Image.new('RGBA',(w*len(images),h),bg)
    for i,im in enumerate(images):result.alpha_composite(im,(w*i,0))
    return result


def occluded_composite(original,boot):
    oa=np.asarray(original)
    ba=np.asarray(boot)
    output=ba.copy()
    visible=oa[:,:,3]>0
    output[visible]=oa[visible]
    # Never trim the boot at a screen-space side seam. Exposed paint outside
    # the original silhouette is left visible as a diagnostic, not hidden by
    # an acceptance mask.
    extra=(ba[:,:,3]>=128)&(oa[:,:,3]<20)
    return Image.fromarray(output),int(extra.sum()),bool(np.array_equal(output[visible],oa[visible]))


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    fit_path=HERE/'boot-fit-v1.json'
    fit=json.loads(fit_path.read_text(encoding='utf8'))
    base_path=ROOT/fit['baseFit']['path']
    if sha(base_path)!=fit['baseFit']['sha256']:raise ValueError('Base own source fit changed')
    base=json.loads(base_path.read_text(encoding='utf8'))
    card=bound_image(fit['sources']['cardinals'])
    own=bound_image(fit['sources']['ownCompleteLegs'])
    standing=bound_image(fit['sources']['standing'])
    if standing.size!=(128,160):raise ValueError('Standing contract size changed')

    # Check all eight neutral source registrations, never write or regenerate
    # their held files; mouth fitting can remain bound to the same RGBA bytes.
    for direction,view in base['cardinals']['views'].items():
        im=register(card,view['bounds'],view['pivot'],400/(view['bounds'][3]-view['bounds'][1]))
        if rgba_sha(im)!=fit['neutralRgbaSha256'][direction]:raise ValueError('Cardinal neutral changed')
    for turn in base['companion']['turns']:
        im=register(own,turn['bounds'],turn['pivot'],400/(turn['bounds'][3]-turn['bounds'][1]))
        if rgba_sha(im)!=fit['neutralRgbaSha256'][turn['heading']]:raise ValueError('Turn neutral changed')

    measurements={}
    for direction,entry in fit['sides'].items():
        view=base['cardinals']['views'][direction]
        body_scale=400/(view['bounds'][3]-view['bounds'][1])
        original=register(card,view['bounds'],view['pivot'],body_scale)
        leg=next(x for x in base['companion']['legs'] if x['bounds']==entry['rawOwnFarComponentBoundsXYXY'])
        bounds=leg['bounds'];source_centre=(bounds[0]+bounds[2])/2
        old_pivot_x=source_centre-(leg['targetCenterX']-256)/body_scale
        old_origin_x=256-old_pivot_x*body_scale
        old_origin_y=472-962*body_scale
        anchor_body=entry['bodyScaleFarHeelSoleAnchorWorkingXY']
        raw_anchor=[(anchor_body[0]-old_origin_x)/body_scale,
            (anchor_body[1]-old_origin_y)/body_scale]
        target=entry['targetFarHeelSoleAnchorWorkingXY']
        uniform=entry['uniformScaleRelativeToCardinal']
        scale=body_scale*uniform
        pivot=[raw_anchor[0]+(256-target[0])/scale,
            raw_anchor[1]+(472-target[1])/scale]
        boot=register(own,bounds,pivot,scale)
        combined,extra,visible_exact=occluded_composite(original,boot)
        boot.save(OUT/f'{direction}-uniform-own-far.png')
        combined.save(OUT/f'{direction}-occluded-original-visible.png')
        measurements[direction]={
            'bodyScale':body_scale,'relativeUniformScale':uniform,'rawSourceAnchorXY':raw_anchor,
            'targetAnchorWorkingXY':target,'effectiveSourceScale':scale,'sourcePivotXY':pivot,
            'bodyScaleBootRedBBoxWorking':entry['bodyScaleRedSupportWorkingXYXY'],
            'uniformBootRedBBoxWorking':red_support(boot,(140,400,370,480)),
            'originalNearRedBBoxWorking':entry['originalNearRedSupportWorkingXYXY'],
            'originalVisibleFarRedBBoxWorking':entry['originalFarVisibleRedSupportWorkingXYXY'],
            'donorOpaqueExteriorPixels':extra,
            'allOriginalVisibleRgbaExactInComposite':visible_exact
        }
        # Work in actual source colour. Blend is diagnostic only and is never
        # saved as a production layer or a returned source cell.
        overlay=Image.blend(original,boot,.5)
        for theme in ('light','dark'):
            panel([original,boot,overlay,combined],theme).save(OUT/f'{direction}-comparison-{theme}.png')
            panel([original,boot,overlay,combined],theme,(145,390,365,480),3).save(OUT/f'{direction}-boot-cuff-sole-{theme}.png')
            for cell,pivot,paint_height in [([128,160],[64,150],132),([96,120],[48,112.5],99),([64,80],[32,75],66)]:
                pair=[export(im,cell,pivot,paint_height) for im in (original,combined)]
                panel(pair,theme).save(OUT/f'{direction}-{cell[0]}x{cell[1]}-{theme}.png')
        raw_crop=own.crop((bounds[0]-3,830,bounds[2]+3,966))
        for theme in ('light','dark'):
            panel([raw_crop],theme,magnify=2).save(OUT/f'{direction}-raw-own-boot-{theme}.png')
    receipt={'schemaVersion':1,'status':'candidate-static-boot-registration-only',
        'fit':{'path':str(fit_path.relative_to(ROOT)).replace('\\','/'),'sha256':sha(fit_path)},
        'driver':{'path':str(Path(__file__).relative_to(ROOT)).replace('\\','/'),'sha256':sha(Path(__file__))},
        'baseFit':fit['baseFit'],'sources':fit['sources'],
        'helper':{'street':sha(ROOT/'tools/build-street-character-sprites.py'),
            'paintedWalk':sha(ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')},
        'neutralRgbaSha256':fit['neutralRgbaSha256'],'measurement':measurements,
        'output':{p.name:sha(p) for p in sorted(OUT.glob('*.png'))}}
    (OUT/'boot-fit.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'receipt':str(OUT/'boot-fit.json'),'sha256':sha(OUT/'boot-fit.json'),
        'pngCount':len(receipt['output']),'measurement':measurements}))


if __name__=='__main__':main()
