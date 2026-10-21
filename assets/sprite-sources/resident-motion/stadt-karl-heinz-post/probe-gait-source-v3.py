"""Karl-only source probe: side 16-phase loops, front/rear four contacts.

Writes individual working512 and 96x120/64x80 diagnostic PNGs, not an atlas.
No stride distance, runtime manifest, or global fitting is emitted.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
FIT = HERE / 'source-fit-v3.json'
OUT = ROOT / 'output/ambient-city-animation/karl-post-motion-v3'
BUILDER = ROOT / 'tools/build-resident-motion.py'
HELPER = ROOT / '.agents/skills/animate-2d-characters/scripts/painted_walk.py'
ORDER = ('down', 'right', 'up', 'left')
BG = {'light':'#eee8db', 'dark':'#25272b'}
SIZE = {'working':(512,512), 'desktop':(96,120), 'mobile':(64,80)}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def composite_board(frames: list[Image.Image], titles: list[str], color: str, cols: int) -> Image.Image:
    w,h = frames[0].size
    rows = (len(frames)+cols-1)//cols
    result = Image.new('RGB',(w*cols,(h+18)*rows),color)
    draw = ImageDraw.Draw(result)
    ink = '#222' if color == BG['light'] else '#f4f2e9'
    for i,(frame,title) in enumerate(zip(frames,titles)):
        ox=(i%cols)*w;oy=(i//cols)*(h+18)
        result.paste(frame,(ox,oy+18),frame)
        draw.text((ox+2,oy+2),title,fill=ink)
    return result


def adjacent_rms(a: Image.Image, b: Image.Image) -> float:
    left=np.asarray(a).astype(np.float32);right=np.asarray(b).astype(np.float32)
    union=(left[:,:,3]>20)|(right[:,:,3]>20)
    return float(np.sqrt(np.mean((left[union]-right[union])**2)))


def export_compact(builder, image: Image.Image, kind: str) -> Image.Image:
    factor=.75 if kind=='desktop' else .5
    spec={'cell':[int(128*factor),int(160*factor)],'figureHeight':136*factor,
        'pivot':[64*factor,150*factor], 'working':{'figureHeight':400,'baseline':472}}
    cell=builder.street.export_cell(image,spec)
    if cell.size!=SIZE[kind]:raise ValueError('Compact diagnostic size mismatch')
    return cell


def main() -> None:
    doc=json.loads(FIT.read_text(encoding='utf8'))
    if doc['worldContract']!={'standingFigureWorldHeight':1.6,'standingPivot':[64,150],'standingFigureHeight':136,'distancePerCycle':'unmeasured'}:raise ValueError('Standing contract changed')
    if doc['working']!={'canvas':[512,512],'baselineY':472,'figureHeight':400}:raise ValueError('Working registration changed')
    if digest(ROOT/doc['frontRearFittingFrom']['path'])!=doc['frontRearFittingFrom']['sha256AtSnapshot']:raise ValueError('Front/rear historical fit drifted')
    if digest(ROOT/doc['maskBuilder']['path'])!=doc['maskBuilder']['sha256']:raise ValueError('Accepted V2 ownership builder changed')
    person=doc['person']
    bound={person['source']:person['sourceSha256'],doc['originalCardinal']['path']:doc['originalCardinal']['sha256']}
    for view in person['views'].values():
        bound[view['source']]=view['sourceSha256']
        for limb in view.get('leg_sources',[]):bound[limb['source']]=limb['sourceSha256']
    for relative,sha in bound.items():
        if digest(ROOT/relative)!=sha:raise ValueError('Changed Karl paint: '+relative)
    module=importlib.util.spec_from_file_location('karl_source_builder_v3',BUILDER)
    builder=importlib.util.module_from_spec(module)
    assert module.loader is not None
    module.loader.exec_module(builder)
    OUT.mkdir(parents=True,exist_ok=True)
    results={}
    for direction in ORDER:
        source,lm,_=builder.registered(person,direction)
        if source.size!=(512,512):raise ValueError('Source registration not working512')
        source_path=OUT/f'{direction}-registered.png';source.save(source_path)
        count=16 if direction in ('right','left') else 4
        try:frames,fields=builder.motion(person,direction,count=count)
        except ValueError as exc:
            if hasattr(exc,'frame'):exc.frame.save(OUT/f'{direction}-first-failure.png')
            (OUT/'failure.json').write_text(json.dumps({'direction':direction,'error':str(exc),'phase':getattr(exc,'phase',None)},indent=2)+'\n')
            raise
        if len(frames)!=count or len(fields)!=count:raise ValueError('Missing source phases/fields')
        if len({frame.tobytes() for frame in frames})!=count:raise ValueError('Duplicate source phases')
        cells={'working':frames,'desktop':[],'mobile':[]}
        records=[]
        for i,frame in enumerate(frames):
            if frame.size!=(512,512):raise ValueError('Motion frame is not working512')
            groups,_=label(np.asarray(frame)[:,:,3]>=128)
            sizes=np.bincount(groups.ravel())[1:]
            major=int(sum(v>=100 for v in sizes))
            if major!=1:raise ValueError(f'{direction} phase {i}: disconnected substantial alpha')
            entry={'phase':i,'bounds':frame.getbbox(),'majorAlphaComponents':major}
            for kind in SIZE:
                cell=frame if kind=='working' else export_compact(builder,frame,kind)
                path=OUT/f'{direction}-{kind}-{i:02}.png';cell.save(path)
                entry[kind+'Sha256']=digest(path)
                if kind!='working':cells[kind].append(cell)
            records.append(entry)
        boards={}
        for kind,seq in cells.items():
            boards[kind]={}
            for name,color in BG.items():
                board=composite_board(seq,[str(i) for i in range(count)],color,8 if count==16 else 4)
                path=OUT/f'{direction}-{kind}-{name}.png';board.save(path);boards[kind][name]=digest(path)
        # This ordered quartet brackets the last-to-first phase boundary.
        rms=[];join=None
        if count==16:
            rms=[adjacent_rms(frames[i],frames[(i+1)%count]) for i in range(count)]
            join=composite_board([frames[i] for i in (14,15,0,1)],['14','15','0','1'],BG['light'],4)
            join.save(OUT/f'{direction}-loop-join.png')
            preview=[]
            for frame in frames:
                bg=Image.new('RGB',frame.size,BG['light']);bg.paste(frame,(0,0),frame);preview.append(bg)
            preview[0].save(OUT/f'{direction}-working-loop.gif',save_all=True,append_images=preview[1:],duration=60,loop=0)
        results[direction]={'registeredSha256':digest(source_path),'registeredBounds':source.getbbox(),
            'landmarksWorking':{key:lm[key] for key in ('waist','hip','hem','knee','ankle')},
            'frames':records,'boards':boards,'adjacentRms':rms,
            'loopJoinBoardSha256':digest(OUT/f'{direction}-loop-join.png') if join else None,
            'fieldCount':len(fields)}
    for relative,sha in bound.items():
        if digest(ROOT/relative)!=sha:raise ValueError('Karl source changed during probe: '+relative)
    receipt={'status':'source-diagnostic-only','sourceFitSha256':digest(FIT),'v2SourceFitSha256':digest(HERE/'source-fit-v2.json'),
        'builderSha256':digest(BUILDER),'deformationSha256':digest(HELPER),
        'maskBuilderSha256':doc['maskBuilder']['sha256'],'sourceFiles':bound,
        'worldContract':doc['worldContract'],'working':doc['working'],'directions':results,
        'limits':['No complete four-direction atlas','No stride/contact calibration','No turn/gesture/stop/mouth/runtime approval']}
    (OUT/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'status':receipt['status'],'frames':{k:len(v['frames']) for k,v in results.items()},'outdir':str(OUT)}))


if __name__=='__main__':main()
