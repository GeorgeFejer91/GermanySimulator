"""Four-extreme Renate side gait source pilot from own measured role layers.

No atlas, full16, world stride/contact or runtime output. The raw-space far
ownership matte is already bound to its complete own limb before deformation.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import math
import sys

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
OUT = ROOT / 'output/ambient-city-animation/renate-termin-side-gait-v4'
sys.path.insert(0, str(ROOT / '.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
spec = importlib.util.spec_from_file_location('bootfit', HERE / 'fit-hidden-boots-v1.py')
bootfit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bootfit)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pinned_json(entry):
    path=ROOT/entry['path']
    if sha(path)!=entry['sha256']:
        raise ValueError(f'Input pin changed: {path}')
    return json.loads(path.read_text(encoding='utf8'))


def original_role_layers(original, complete_far, complete_near_boot, side, begin):
    """Assign original visible pixels by the anatomical near/far source seam.

    This splits the source roles once; moving frames warp whole owned layers.
    It is not a screen-space cut applied to moving feet or final frames.
    """
    source=np.asarray(original)
    far=np.asarray(complete_far).copy()
    near=np.asarray(complete_near_boot).copy()
    ys,xs=np.mgrid[:512,:512]
    points=side['originalRoleSeamWorkingXY']
    seam=np.interp(np.arange(512),[p[1] for p in points],[p[0] for p in points])[:,None]
    near_side=xs>=seam if side['farRole'].startswith('viewer-left') else xs<seam
    active=ys>=begin
    visible=source[:,:,3]>0
    far_owned=active&~near_side&visible
    near_owned=active&near_side&visible
    far[far_owned]=source[far_owned]
    near[near_owned]=source[near_owned]
    return Image.fromarray(far),Image.fromarray(near),{
        'originalFarVisiblePixels':int(far_owned.sum()),
        'originalNearVisiblePixels':int(near_owned.sum()),
        'originalVisibleOverlap':int((far_owned&near_owned).sum()),
        'allOriginalLowerVisibleAssigned':bool(np.all(far_owned|near_owned|~(active&visible))),
        'nearVisibleOriginalRgbaExact':bool(np.array_equal(near[near_owned],source[near_owned]))}


def own_complete_near_boot(own, near_fit):
    """Retain the own complete shoe under the original near-visible paint.

    The source-space cap removes the companion upper trouser, which the
    cardinal near leg already supplies. Red leather begins below the cap and
    is fully retained. This mask travels with the same near-limb warp.
    """
    arr=np.asarray(own).copy()
    x0,y0,x1,y1=near_fit['rawComponentBoundsXYXY']
    yy=np.arange(y0-2,y1+2,dtype=float)
    coverage=np.clip((yy-near_fit['sourceBootCapY'])/6.0,0.0,1.0)
    roi=arr[y0-2:y1+2,x0-2:x1+2]
    roi[:,:,3]=np.rint(roi[:,:,3].astype(float)*coverage[:,None]).astype(np.uint8)
    roi[roi[:,:,3]==0,:3]=0
    masked=Image.fromarray(arr)
    registered=bootfit.register(masked,near_fit['rawComponentBoundsXYXY'],
        near_fit['sourcePivotXY'],near_fit['uniformSourceScale'])
    return masked,registered


def shoe_measure(image):
    a=np.asarray(image).astype(int)
    yy,xx=np.mgrid[:512,:512]
    red=(a[:,:,0]>1.22*a[:,:,1])&(a[:,:,0]>1.1*a[:,:,2])&(a[:,:,0]>35)&(a[:,:,3]>150)&(yy>=415)
    ry,rx=np.where(red)
    if not len(rx):raise ValueError('Missing own burgundy shoe paint')
    support=(a[:,:,3]>=128)&(yy>=425)
    sy,sx=np.where(support)
    return {'redBBoxXYXY':[int(rx.min()),int(ry.min()),int(rx.max()+1),int(ry.max()+1)],
        'redCentreX':float((rx.min()+rx.max()+1)/2),
        'opaqueSoleLastRowY':int(sy.max()),
        'opaqueShoeBBoxXYXY':[int(sx.min()),int(sy.min()),int(sx.max()+1),int(sy.max()+1)]}


def warp_role(image,geo,shift_x,shift_y):
    nodes=geo['fieldNodesWorkingY']
    dx=[shift_x*k for k in geo['horizontalFieldFractions']]
    dy=[shift_y*k for k in geo['verticalFieldFractions']]
    return paint.warp_layer(image,nodes,dx,dy),{'nodesY':nodes,'dx':dx,'dy':dy,
        'footShiftX':shift_x,'footShiftY':shift_y}


def protected_patch(direction):
    yy,xx=np.mgrid[:512,:512]
    if direction=='right':
        # Own anatomical-RIGHT ticket and gripping fingers extend below the
        # vest line to about y376; the lower cloth elsewhere remains mobile.
        return (xx>=218)&(xx<=286)&(yy>=327)&(yy<=377)
    # Opposite profile hides the ticket; retain the actual near hand/fingers.
    return (xx>=241)&(xx<=287)&(yy>=327)&(yy<=377)


def compose(original,far,near,geo,direction):
    out=Image.new('RGBA',(512,512))
    out.alpha_composite(far)
    out.alpha_composite(near)
    a=np.asarray(out).copy()
    source=np.asarray(original)
    held=geo['heldOriginalThroughWorkingY']
    a[:held+1]=source[:held+1]
    protected=protected_patch(direction)
    a[protected]=source[protected]
    a[a[:,:,3]==0]=0
    return Image.fromarray(a),{
        'headAndUpperRowsExact':bool(np.array_equal(a[:held+1],source[:held+1])),
        'actualHandTicketPatchExact':bool(np.array_equal(a[protected],source[protected]))}


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    fit_path=HERE/'side-gait-fit-v4.json'
    fit=json.loads(fit_path.read_text(encoding='utf8'))
    ownership=pinned_json(fit['ownershipReceipt'])
    base=pinned_json(fit['baseFit'])
    measured_fit=pinned_json(ownership['measuredBootFit'])
    if sha(ROOT/fit['independentOwnershipReview']['path'])!=fit['independentOwnershipReview']['sha256']:
        raise ValueError('Independent static ownership report changed')
    card=bootfit.bound_image({'path':base['cardinals']['source'],'sha256':base['cardinals']['sha256']})
    own=bootfit.bound_image({'path':base['companion']['source'],'sha256':base['companion']['sha256']})
    geo=fit['geometry']
    results={}
    for direction in ('right','left'):
        view=base['cardinals']['views'][direction]
        original=bootfit.register(card,view['bounds'],view['pivot'],400/(view['bounds'][3]-view['bounds'][1]))
        if bootfit.rgba_sha(original)!=measured_fit['neutralRgbaSha256'][direction]:
            raise ValueError('Unexpected neutral registration')
        own_entry={'path':f'output/ambient-city-animation/renate-termin-leg-ownership-v1/{direction}-masked-own-far-registered.png',
            'sha256':ownership['output'][f'{direction}-masked-own-far-registered.png']}
        complete_far=bootfit.bound_image(own_entry)
        side=fit['sides'][direction]
        near_source,complete_near=own_complete_near_boot(own,side['ownCompleteNearBoot'])
        nb=side['ownCompleteNearBoot']['rawComponentBoundsXYXY']
        near_source.crop((nb[0]-2,nb[1]-2,nb[2]+2,nb[3]+2)).save(OUT/f'{direction}-near-complete-boot-source.png')
        complete_near.save(OUT/f'{direction}-near-complete-boot-registered.png')
        if shoe_measure(complete_near)['redBBoxXYXY']!=side['ownCompleteNearBoot']['registeredRedShoeBBoxWorkingXYXY']:
            raise ValueError(f'{direction}: own near complete boot registration changed')
        far,near,owner=original_role_layers(original,complete_far,complete_near,side,geo['roleSourceBeginsWorkingY'])
        initial={'far':shoe_measure(far),'near':shoe_measure(near)}
        for role in ('far','near'):
            expected_bbox=side[f'measured{role.title()}RedShoeBBoxWorkingXYXY']
            if initial[role]['redBBoxXYXY']!=expected_bbox:
                raise ValueError(f'{direction} {role} measured red source changed: {initial[role]["redBBoxXYXY"]}')
        if initial['far']['opaqueSoleLastRowY']+side['farOnlySoleRegistrationWorkingY']!=initial['near']['opaqueSoleLastRowY']:
            raise ValueError('Per-limb source sole registration no longer agrees with own source')
        far.save(OUT/f'{direction}-far-complete-source-role.png')
        near.save(OUT/f'{direction}-near-original-source-role.png')
        base_x={role:geo['bodyFootCentreWorkingX']-initial[role]['redCentreX'] for role in ('far','near')}
        frames=[];fields=[]
        for index in geo['pilotPhases']:
            phase=math.tau*index/geo['phaseCount']
            role_images={};role_fields={};role_shoes={}
            for role,source in (('far',far),('near',near)):
                opposite=0 if role=='far' else math.pi
                far_anchor_travel=geo['pilotFarTravelByPhaseWorkingPx'][str(index)]
                travel=side['directionalTravelSign']*far_anchor_travel*(1 if role=='far' else -1)
                lift=geo['swingLiftWorkingPx']*max(0.0,math.cos(phase+opposite))
                shift_x=base_x[role]+travel
                shift_y=(side['farOnlySoleRegistrationWorkingY'] if role=='far' else 0)-lift
                role_images[role],role_fields[role]=warp_role(source,geo,shift_x,shift_y)
                role_fields[role].update({'baseCentreShiftX':base_x[role],'travelX':travel,
                    'swingLiftY':lift,'sourceSoleLastRowY':initial[role]['opaqueSoleLastRowY']})
                role_shoes[role]=shoe_measure(role_images[role])
                role_images[role].save(OUT/f'{direction}-phase-{index:02}-{role}-warped.png')
            frame,protection=compose(original,role_images['far'],role_images['near'],geo,direction)
            frame.save(OUT/f'{direction}-phase-{index:02}.png')
            frames.append(frame)
            fields.append({'phase':index,'roles':role_fields,'observedRoleShoes':role_shoes,
                'protection':protection})
            for theme in ('light','dark'):
                bootfit.panel([frame],theme,(145,330,365,490),3).save(OUT/f'{direction}-phase-{index:02}-hip-sole-{theme}.png')
            for cell,pivot,height in [([96,120],[48,112.5],99),([64,80],[32,75],66)]:
                bootfit.export(frame,cell,pivot,height).save(OUT/f'{direction}-phase-{index:02}-{cell[0]}x{cell[1]}-alpha.png')
        for theme in ('light','dark'):
            bootfit.panel([original,*frames],theme).save(OUT/f'{direction}-source-and-phases-{theme}.png')
            bootfit.panel([original,*frames],theme,(145,330,365,490),2).save(OUT/f'{direction}-hips-cuffs-soles-{theme}.png')
            for cell,pivot,height in [([96,120],[48,112.5],99),([64,80],[32,75],66)]:
                native=[bootfit.export(im,cell,pivot,height) for im in [original,*frames]]
                bootfit.panel(native,theme).save(OUT/f'{direction}-{cell[0]}x{cell[1]}-{theme}.png')
        results[direction]={'ownership':owner,'initialRoleShoes':initial,
            'baseCentreShiftWorkingX':base_x,'perLimbFarSoleRegistrationWorkingY':side['farOnlySoleRegistrationWorkingY'],
            'phases':fields}
    receipt={'schemaVersion':1,'status':'candidate-four-side-extremes-only',
        'fit':{'path':str(fit_path.relative_to(ROOT)).replace('\\','/'),'sha256':sha(fit_path)},
        'driver':{'path':str(Path(__file__).relative_to(ROOT)).replace('\\','/'),'sha256':sha(Path(__file__))},
        'ownershipReceipt':fit['ownershipReceipt'],'independentOwnershipReview':fit['independentOwnershipReview'],
        'baseFit':fit['baseFit'],
        'sourcePins':{'cardinal':base['cardinals']['sha256'],
            'ownCompanion':base['companion']['sha256'],'standing':base['standing']['sha256']},
        'helpers':{'paintedWalk':sha(ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py'),
            'street':sha(ROOT/'tools/build-street-character-sprites.py')},
        'geometry':geo,'findings':results,
        'outputs':{p.name:sha(p) for p in sorted(OUT.glob('*.png'))}}
    (OUT/'pilot-source.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'receiptSha256':sha(OUT/'pilot-source.json'),'pngCount':len(receipt['outputs']),
        'sourceShoes':{d:v['initialRoleShoes'] for d,v in results.items()}}))


if __name__=='__main__':main()
