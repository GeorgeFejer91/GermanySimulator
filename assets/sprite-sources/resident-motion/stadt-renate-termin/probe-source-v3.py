"""One bounded Renate side successor: original visible boot, hidden shin only."""
from pathlib import Path
import importlib.util
import json

import numpy as np
from PIL import Image

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
OUT=ROOT/'output/ambient-city-animation/renate-termin-source-gate-v1/original-contour-v3'
spec=importlib.util.spec_from_file_location('renate_v2',HERE/'probe-source-v2.py')
v2=importlib.util.module_from_spec(spec)
spec.loader.exec_module(v2)


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    cfg_path=HERE/'source-fit-v3.json'
    cfg=json.loads(cfg_path.read_text(encoding='utf8'))
    for key in ('baseFitV2','baseDriverV2'):
        if v2.sha(ROOT/cfg[key]['path'])!=cfg[key]['sha256']:
            raise ValueError(f'{key} changed')
    prev=ROOT/'output/ambient-city-animation/renate-termin-source-gate-v1/original-contour-v2/pilot-source.json'
    if v2.sha(prev)!=cfg['previousReceiptSha256']:
        raise ValueError('Prior HOLD evidence changed')
    fit=json.loads((ROOT/cfg['baseFitV2']['path']).read_text(encoding='utf8'))
    base=json.loads((ROOT/fit['baseFit']['path']).read_text(encoding='utf8'))
    card=v2.checked_image(base['cardinals']['source'],base['cardinals']['sha256'])
    companion=v2.checked_image(base['companion']['source'],base['companion']['sha256'])
    findings={}
    for direction in ('right','left'):
        view=base['cardinals']['views'][direction]
        scale=400/(view['bounds'][3]-view['bounds'][1])
        original=v2.register(card,view['bounds'],view['pivot'],scale)
        if v2.rgba_sha(original)!=fit['neutralRgbaSha256'][direction]:
            raise ValueError('Neutral cardinal changed')
        side=fit['sideFit'][direction]
        leg=base['companion']['legs'][side['farHiddenLegComponentIndex']]
        x0,y0,x1,y1=leg['bounds']
        px=(x0+x1)/2-(leg['targetCenterX']-256)/scale
        donor=v2.register(companion,leg['bounds'],[px,962],scale)
        far,near,ownership=v2.own_layers(original,donor,side['seamWorkingXY'],direction,
            fit['sideFit']['sourceLowerBeginWorkingY'])
        # The v2 half-donor boot toe made a triangular paint seam when revealed.
        # Keep only hidden own shin paint above the measured cuff/boot boundary;
        # original visible far boot and near whole boot stay authoritative.
        arr=np.asarray(far).copy()
        xx=np.arange(512)[None,:]
        seam=np.interp(np.arange(512),[p[1] for p in side['seamWorkingXY']],
            [p[0] for p in side['seamWorkingXY']])[:,None]
        hidden=xx>=seam if direction=='right' else xx<=seam
        cut=int(cfg['hiddenDonorBelowWorkingY'])
        arr[cut:][hidden[cut:]]=0
        far=Image.fromarray(arr)
        far.save(OUT/f'{direction}-far-source-layer.png')
        near.save(OUT/f'{direction}-near-source-layer.png')
        pose_fit=dict(fit['sideFit'])
        pose_fit['stepWorkingPx']*=cfg['travelSign'][direction]
        frames=[];gaps=[]
        for index in pose_fit['phaseIndices']:
            frame,missing=v2.pose(original,far,near,pose_fit,index)
            frame.save(OUT/f'{direction}-phase-{index:02}.png')
            frames.append(frame);gaps.append(missing)
        findings[direction]={'ownership':ownership,'rootGapFillByPhase':gaps,
            'hiddenDonorRemovedFromWorkingY':cut,'travelSign':cfg['travelSign'][direction]}
        for theme in ('light','dark'):
            v2.board([original,*frames],theme).save(OUT/f'{direction}-source-and-phases-{theme}.png')
            v2.board([original,*frames],theme,(140,330,380,490)).save(OUT/f'{direction}-boot-hip-crops-{theme}.png')
            for cell,pivot,paint_height in [
                (fit['output']['standingCell'],fit['output']['standingPivot'],fit['output']['standingPaintFigure']),
                (fit['output']['desktopCell'],fit['output']['desktopPivot'],fit['output']['desktopPaintFigure']),
                (fit['output']['mobileCell'],fit['output']['mobilePivot'],fit['output']['mobilePaintFigure'])]:
                exports=[v2.export(im,cell,pivot,paint_height) for im in [original,*frames]]
                v2.board(exports,theme).save(OUT/f'{direction}-{cell[0]}x{cell[1]}-{theme}.png')
    receipt={'schemaVersion':1,'status':'candidate-unapproved','scope':'four right + four left original-contour side anchors',
        'fit':{'path':str(cfg_path.relative_to(ROOT)).replace('\\','/'),'sha256':v2.sha(cfg_path)},
        'driver':{'path':str(Path(__file__).relative_to(ROOT)).replace('\\','/'),'sha256':v2.sha(Path(__file__))},
        'baseFitV2':cfg['baseFitV2'],'baseDriverV2':cfg['baseDriverV2'],
        'previousReceiptSha256':cfg['previousReceiptSha256'],
        'cardinalSourceSha256':base['cardinals']['sha256'],
        'companionSourceSha256':base['companion']['sha256'],
        'standingSha256':base['standing']['sha256'],
        'neutralRgbaSha256':fit['neutralRgbaSha256'],
        'paintFigureByCell':{'128x160':132,'96x120':99,'64x80':66},
        'logicalFigureHeight':136,'figureWorldHeight':1.6,'findings':findings,
        'outputs':{p.name:v2.sha(p) for p in sorted(OUT.glob('*.png'))}}
    (OUT/'pilot-source.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'receipt':str(OUT/'pilot-source.json'),'sha256':v2.sha(OUT/'pilot-source.json'),
        'pngCount':len(receipt['outputs'])}))


if __name__=='__main__':main()
