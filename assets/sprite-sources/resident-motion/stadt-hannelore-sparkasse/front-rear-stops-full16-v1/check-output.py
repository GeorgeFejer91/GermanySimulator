"""Bounded source/output checks and complete non-overlapping review pages."""
from pathlib import Path
import argparse, hashlib, importlib.util, json, math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.interpolate import PchipInterpolator
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def run(out):
    packet=out/'candidate-v1';old=ROOT/'output/ambient-city-animation/hannelore-sparkasse-front-rear-stop-shared-garment-v1/candidate-v2'
    raw=json.loads((packet/'receipt.json').read_text());gold=json.loads((old/'receipt.json').read_text())
    expected=(HERE.parent/'front-rear-stop-shared-garment-v1/build-pilot.py').read_text()
    for a,b in [('Stop source union: settle torso/skirt/purse together over unchanged leg fields.','All16-entry extension of the approved shared-source stop; no map changes.'),
                ('for phase in (0,4,8,12):','for phase in range(16):'),
                ('EIGHT_SOURCE_STOP_PATHS_PENDING_VISUAL_REVIEW','FULL32_SOURCE_STOP_PATHS_PENDING_INDEPENDENT_REVIEW'),
                ('Only four entry phases per view','All16 entry phases per view; four stop stages; not native timing proof')]:expected=expected.replace(a,b)
    assert (HERE/'build-full16.py').read_text()==expected
    assert len(raw['paths'])==32 and len(raw['files'])==448
    golden=[f for f in gold['files'] if '-stage' in f]
    assert len(golden)==96 and all(sha(packet/f)==sha(old/f) for f in golden)
    for path in gold['paths']:
        assert next(p for p in raw['paths'] if (p['direction'],p['phase'])==(path['direction'],path['phase']))==path
    module=load('full_stop_fields',HERE.parent/'front-rear-loop-v1/source_fields.py');actor=module.FrontRearFields();paint=actor.paint
    witnessPath=ROOT/'output/ambient-city-animation/hannelore-sparkasse-front-rear-extremes-v1/candidate-v3/source-witnesses.json'
    witnesses=json.loads(witnessPath.read_text())['views']
    before=json.loads((out/'input-pins-before.json').read_text());before['pins'][witnessPath.relative_to(ROOT).as_posix()]=sha(witnessPath)
    (out/'input-pins-before-with-witnesses.json').write_text(json.dumps(before,indent=2)+'\n')
    yy,xx=np.mgrid[:512,:512];extractions={};caps={}
    for heading,view in actor.recipe['views'].items():
        calls=[];original=paint.sample
        def capture(layer,sx,sy):calls.append(layer.copy());return original(layer,sx,sy)
        paint.sample=capture
        try:actor.pose(heading,0)
        finally:paint.sample=original
        assert len(calls)==4
        sourcePMA=paint.premul(actor.sources[heading])
        for owned in calls[2:]:assert np.all(np.all(owned==0,axis=2)|np.all(owned==sourcePMA,axis=2))
        extractions[heading]=calls;caps[heading]=[]
        sourceRGBA=np.array(actor.sources[heading])
        for leg in calls[:2]:
            cap=np.zeros_like(sourceRGBA)
            for x in range(512):
                ys=np.where(leg[:,x,3]*255>=20)[0]
                if len(ys) and ys[0]<=view['landmarks']['hip']+2:cap[ys[0],x]=sourceRGBA[ys[0],x]
            caps[heading].append(paint.premul(Image.fromarray(cap)))
    def coords(field):
        fx=PchipInterpolator(field['nodes_y'],field['dx']);fy=PchipInterpolator(field['nodes_y'],field['dy'])
        sy=yy.astype(float)
        for _ in range(10):sy=yy-fy(np.clip(sy,0,511))
        return xx-fx(np.clip(sy,0,511)),sy
    rows=[];maxUnchangedSupport=0.;maxLift=0.;minJ=1.;maxJ=1.;direct=[]
    for path in raw['paths']:
        heading,phase=path['direction'],path['phase'];view=actor.recipe['views'][heading];src=extractions[heading]
        _,entry=actor.pose(heading,math.tau*phase/16)
        for stage,record in enumerate(path['stages']):
            name=f'{heading}-{phase:02}-stage{stage}.png';rgba=np.array(Image.open(packet/name).convert('RGBA'));a=rgba[:,:,3]
            ys,xs=np.where(a>=20);assert ys.max()+1==472
            assert not any(np.any(v) for v in [a[:4],a[-4:],a[:,:4],a[:,-4:]])
            assert not np.any(rgba[a==0,:3]);fields=record['fields'];maps=[coords(f) for f in fields]
            upperPMA=np.maximum(src[2],src[3]) if heading=='down' else src[3]
            upper=paint.unpack(paint.sample(upperPMA,*maps[2]));upperA=np.array(upper)[:,:,3]/255
            if heading=='up':
                waist=view['landmarks']['waist'];mid=view['landmarks']['mid'];hems=max(view['landmarks']['hem'])
                bob=fields[2]['dy'][0];hipShift=fields[2]['dx'][1]
                blend=np.clip((xx-mid+40)/80,0,1);blend=blend*blend*(3-2*blend)
                weight=np.clip((yy-waist)/max(hems-waist,1),0,1);weight=weight*weight*(3-2*weight)
                gx=xx.astype(float)-hipShift-weight*((fields[0]['dx'][3]-hipShift)*(1-blend)+(fields[1]['dx'][3]-hipShift)*blend)
                gy=yy.astype(float)-bob-weight*((fields[0]['dy'][3]-bob)*(1-blend)+(fields[1]['dy'][3]-bob)*blend)
                ga=np.array(paint.unpack(paint.sample(src[2],gx,gy)))[:,:,3]/255
                upperA=upperA+ga*(1-upperA)
            capMiss=[];sole=[];extrema=[]
            for side,f in enumerate(fields[:2]):
                ca=np.array(paint.unpack(paint.sample(caps[heading][side],*maps[side])))[:,:,3]
                mask=(ca>=20)&(upperA*255<200);miss=int(np.count_nonzero(mask))
                opaqueMask=(ca>=200)&(upperA*255<200)
                capMiss.append({'alpha20BelowCover200':miss,'opaque200BelowCover200':int(opaqueMask.sum()),
                    'pixels':[{'target':[int(x),int(y)],'capAlpha':int(ca[y,x]),'coverAlpha':float(upperA[y,x]*255)} for y,x in zip(*np.where(mask))],
                    'qualification':'Extracted leg top includes navy garment side AA, not a wholly hidden anatomical calf cut; source image review decides exposed-contour defects.'})
                if miss:
                    yybad,xxbad=np.where(mask)
                    failure={'file':name,'side':side,'criterion':'Diagnostic first-texel cap alpha>=20 versus cover alpha>=200',
                        'pixels':[{'target':[int(x),int(y)],'capAlpha':int(ca[y,x]),'coverAlpha':float(upperA[y,x]*255),
                            'actualRGBA':rgba[y,x].tolist(),'legSource':[float(maps[side][0][y,x]),float(maps[side][1][y,x])],
                            'upperSource':[float(maps[2][0][y,x]),float(maps[2][1][y,x])]} for y,x in zip(yybad,xxbad)]}
                    failed=out/'initial-cap-guard-failure.json'
                    if not failed.exists():failed.write_text(json.dumps(failure,indent=2)+'\n')
                fx=PchipInterpolator(f['nodes_y'],f['dx']);fy=PchipInterpolator(f['nodes_y'],f['dy'])
                probe=np.unique(np.r_[0.,511.,f['nodes_y'],fy.derivative(2).roots(extrapolate=False)])
                probe=probe[(probe>=0)&(probe<=511)];j=1+fy.derivative()(probe);assert j.min()>.5
                minJ=min(minJ,float(j.min()));maxJ=max(maxJ,float(j.max()));extrema.append([float(j.min()),float(j.max())])
                rigid=np.linspace(f['nodes_y'][-2],511,257)
                assert np.max(abs(fx.derivative()(rigid)))<1e-10 and np.max(abs(fy.derivative()(rigid)))<1e-10
                x,y=witnesses[heading][side]['sourceSolePoint'];sourceRGBA=np.array(actor.sources[heading])[y,x]
                assert y==471 and sourceRGBA[3]>=20
                q=[float(x+fx(y)),float(y+fy(y))];ix,iy=np.rint(q).astype(int);assert a[iy,ix]>=20 and q[1]<=471+1e-10
                held=abs(f['dy'][-1])<1e-10
                if held:assert abs(q[1]-471)<1e-10
                progress,lift=[((.45,7),(0,0)),((1,0),(0,0)),((1,0),(.5,7)),((1,0),(1,0))][stage][0 if side==path['swingScreenSide'] else 1]
                if progress==0 and lift==0:
                    e=entry['fields'][side];prior=[float(x+PchipInterpolator(e['nodes_y'],e['dx'])(y)),float(y+PchipInterpolator(e['nodes_y'],e['dy'])(y))]
                    error=float(np.max(abs(np.array(q)-prior)));maxUnchangedSupport=max(maxUnchangedSupport,error);assert error<1e-10
                sole.append({'screenSide':side,'fixedSource':[x,y],'sourceRGBA':sourceRGBA.tolist(),'transported':q,'nearestAlpha':int(a[iy,ix]),'flatFloorSupport':held,
                             'uncertaintyWorkingPixelCentre':.5,'qualification':'Fixed original source texel, not world floor measurement; no relocation.'})
                maxLift=max(maxLift,-f['dy'][-1])
            assert any(w['flatFloorSupport'] for w in sole)
            if stage==3:assert all(abs(v)<1e-10 for f in fields[:2] for v in f['dx']+f['dy'])
            rows.append({'file':name,'sourceFloor':472,'rootCapsUncovered':capMiss,'fieldDerivativeExtrema':extrema,'fixedSoles':sole})
            for width in (96,64):
                p=packet/f'{heading}-{phase:02}-stage{stage}-{width}.png';cell=np.array(Image.open(p).convert('RGBA'));ca=cell[:,:,3]
                assert cell.shape[:2]==(int(width*1.25),width)
                assert not np.any(cell[ca==0,:3]);assert not any(np.any(v) for v in [ca[:2],ca[-2:],ca[:,:2],ca[:,-2:]])
                bottom=int(np.where(ca>=20)[0].max()+1);assert bottom=={96:113,64:75}[width]
                direct.append({'file':p.name,'alpha20bottom':bottom})
    pages=out/'pages';pages.mkdir(exist_ok=True);font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
    for heading in ('down','up'):
        for start in (0,4,8,12):
            for theme,bg,fg in [('light','#eee8db','#111'),('dark','#25272b','#eee')]:
                native=Image.new('RGB',(1650,4*470),bg)
                for r,phase in enumerate(range(start,start+4)):native.paste(Image.open(packet/f'{heading}-{phase:02}-{theme}.png'),(0,r*470))
                native.save(pages/f'working-{heading}-{start:02}-{theme}.png')
                for width in (96,64):
                    board=Image.new('RGB',(4*250,4*250),bg);draw=ImageDraw.Draw(board)
                    for r,phase in enumerate(range(start,start+4)):
                        for stage in range(4):
                            x,y=stage*250,r*250;im=Image.open(packet/f'{heading}-{phase:02}-stage{stage}-{width}.png').convert('RGBA')
                            draw.text((x+4,y+4),f'{heading} p{phase} s{stage} actual{width}',font=font,fill=fg)
                            flat=Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB');board.paste(flat,(x+8,y+24))
                            crop=flat.crop((round(width*.25),round(im.height*.70),round(width*.80),round(im.height*.98)))
                            board.paste(crop.resize((crop.width*3,crop.height*3),Image.Resampling.NEAREST),(x+8,y+148))
                    board.save(pages/f'direct-{heading}-{start:02}-{width}-{theme}.png')
    pins={**raw['inputPins'],**before['pins']}
    for p,h in pins.items():assert sha(ROOT/p)==h,p
    result={'status':'AUTHOR_CPU_SOURCE_CHECKS_PASS_VISUAL_REVIEW_SEPARATE','paths':32,'working':128,'direct':256,
            'goldenWorkingExact':32,'goldenDirectExact':64,'addedNonkeyWorking':96,'addedNonkeyDirect':192,
            'originalBuilderDeltaOnlyPhaseRangeAndLabels':True,'capDiagnostic':'All alpha20/opaque200 versus cover200 misses retained per pose; initial diagnostic failure preserved; not all-hidden claim.','fixedSolePoints':256,
            'unchangedSupportingFootMaxError':maxUnchangedSupport,'analyticMinimumJ':minJ,'analyticMaximumJ':maxJ,'maxLiftWorking':maxLift,
            'criticalInputPins':pins,'frames':rows,'directFrames':direct,'limits':['Author source candidate, independent review required','No native timing, camera/world, physical stride, mouth or audio claim']}
    (out/'source-checks.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k not in ('criticalInputPins','frames','directFrames')}))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--outdir',type=Path,required=True);args=parser.parse_args()
    out=args.outdir.resolve();assert out.is_relative_to(ROOT/'output');run(out)
