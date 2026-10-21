"""ONE phase12 whole-NEAR toe-up rotation, composed with inverse PCHIP; one source sample."""
from pathlib import Path
import sys, json, hashlib, importlib.util, shutil, argparse
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.interpolate import PchipInterpolator
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-passing-rotation-v1'
OLD=ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-walk-extremes-floor-v2'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(name,p):
    s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def write(p,o):p.write_text(json.dumps(o,indent=2)+'\n',encoding='utf-8')
def bounds(mask):
    ys,xs=np.where(mask)
    return [int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)] if len(xs) else None
def main():
    global OUT
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--fore-aft',type=int,choices=[12],default=12);parser.add_argument('--outdir');args=parser.parse_args()
    if args.outdir:
        trial=(ROOT/args.outdir).resolve();assert trial.is_relative_to(OUT.resolve());OUT=trial
    OUT.mkdir(parents=True,exist_ok=False)
    recipe=json.loads((HERE/'recipe.json').read_text())
    recipe['nearPassingForeAftWorking']=args.fore_aft
    inherited=json.loads((OLD/'review/pins.json').read_text())
    pins={**recipe['inputs'],str((HERE/'recipe.json').relative_to(ROOT)).replace('\\','/'):sha(HERE/'recipe.json'),str(Path(__file__).relative_to(ROOT)).replace('\\','/'):sha(__file__)}
    def audit():
        for p,h in {**inherited,**pins}.items():assert sha(ROOT/p)==h,p
    audit();write(OUT/'input-pins-before.json',{'inputs':pins,'inheritedPinMap':recipe['inheritedPinMap'],'inheritedCount':len(inherited),'allExact':True})
    sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
    paint=load('side_passing_paint',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')
    street=load('side_passing_export',ROOT/'tools/build-street-character-sprites.py')
    oldRecipe=json.loads((ROOT/recipe['parentRecipe']).read_text());old=json.loads((OLD/'receipt.json').read_text())
    yy,xx=np.mgrid[:512,:512];font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',13);records={};files={}
    def save(im,name):
        p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True);im.save(p);files[name]=sha(p)
    def copy(name):
        p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(OLD/name,p);files[name]=sha(p)
    def over(layers):
        dst=np.zeros((512,512,4),float)
        for im in layers:
            src=paint.premul(im);dst=src+dst*(1-src[:,:,3:4])
        return paint.unpack(dst)
    def flat(im,bg):return Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
    for h,cfg in oldRecipe['sides'].items():
        sign=cfg['travelX'];m=old['sides'][h]['phases']['phase-12']['limbs'][0]
        near=Image.open(ROOT/oldRecipe['renderSources']['components'][h]['near-complete']['file']).convert('RGBA')
        far=Image.open(OLD/f'isolated/{h}-phase-12-far.png').convert('RGBA');upper=Image.open(OLD/f'{h}-moving-upper.png').convert('RGBA')
        nodes=m['nodesY'];base=m['dx'][0];delta=sign*recipe['nearPassingForeAftWorking']
        dx=[base,base,base+delta*.35,base+delta,base+delta];dy=[-7,-7,-8.75,-12,-12]
        fx=PchipInterpolator(nodes,dx);fy=PchipInterpolator(nodes,dy);jac=1+fy.derivative()(np.arange(512))
        assert jac.min()>.5 and np.max(np.abs(fx.derivative()(np.arange(nodes[-2],512))))<1e-10 and np.max(np.abs(fy.derivative()(np.arange(nodes[-2],512))))<1e-10
        # Same owned source and one whole-limb field, not a translated composite crop.
        oldNear=paint.warp_layer(near,nodes,m['dx'],m['dy'])
        assert np.array_equal(np.array(oldNear),np.array(Image.open(OLD/f'isolated/{h}-phase-12-near.png')))
        # Root pivot is the alpha-weighted centre of this source's actual cut cap.
        sourceA=np.array(near);capPoints=[]
        for cx in range(512):
            hits=np.where(sourceA[:,cx,3]>=20)[0]
            if len(hits) and hits[0]<=np.ceil(nodes[1])+2:capPoints.append([cx,int(hits[0]),int(sourceA[hits[0],cx,3])])
        cp=np.array(capPoints,float);sourcePivot=np.sum(cp[:,:2]*cp[:,2:3],axis=0)/cp[:,2].sum()
        targetPivot=sourcePivot+np.array([fx(sourcePivot[1]),fy(sourcePivot[1])])
        angle=recipe['toeUpDegrees'][h];theta=np.deg2rad(angle);co,si=np.cos(theta),np.sin(theta)
        def forward_rotate(x,y):
            qx,qy=x-targetPivot[0],y-targetPivot[1]
            return targetPivot[0]+co*qx-si*qy,targetPivot[1]+si*qx+co*qy
        # Inverse rigid rotation, then the SAME ten-step PCHIP inverse as warp_layer.
        qx,qy=xx-targetPivot[0],yy-targetPivot[1]
        preX=targetPivot[0]+co*qx+si*qy;preY=targetPivot[1]-si*qx+co*qy
        sourceY=preY.copy()
        for _ in range(10):sourceY=preY-fy(np.clip(sourceY,0,511))
        sourceX=preX-fx(np.clip(sourceY,0,511))
        def composed_sample(primary):return paint.unpack(paint.sample(paint.premul(primary),sourceX,sourceY))
        # Never sample a previously warped/quantized NEAR image for this final paint.
        moved=composed_sample(near);frame=over([far,moved,upper])
        save(moved,f'isolated/{h}-phase-12-near.png');copy(f'isolated/{h}-phase-12-far.png');copy(f'{h}-moving-upper.png')
        poses={}
        for ident in ['neutral','phase-00','phase-04','phase-08','phase-12']:
            if ident=='phase-12':save(frame,f'{h}-{ident}.png');poses[ident]=frame
            else:copy(f'{h}-{ident}.png');poses[ident]=Image.open(OLD/f'{h}-{ident}.png').convert('RGBA')
            for w,ht in [(96,120),(64,80)]:
                name=f'direct-{w}x{ht}/{h}-{ident}.png'
                if ident!='phase-12':copy(name)
                else:
                    q=w/128;spec={'working':{'figureHeight':400,'baseline':472},'cell':[w,ht],'pivot':[64*q,150*q],'figureHeight':137*q}
                    save(street.export_cell(frame,spec),name)
        # Exact original cut-cap check: the moved source edge must remain behind real upper.
        a=np.array(near);cap=np.zeros_like(a)
        for x in range(512):
            hits=np.where(a[:,x,3]>=20)[0]
            if len(hits) and hits[0]<=np.ceil(nodes[1])+2:cap[hits[0],x]=a[hits[0],x]
        capIm=composed_sample(Image.fromarray(cap));ca=np.array(capIm)[:,:,3];ua=np.array(upper)[:,:,3];uncovered=(ca>=20)&(ua<200)
        capBoard=upper.copy();color=np.zeros((512,512,4),dtype='uint8');color[ca>=20]=[0,210,60,180];capBoard=Image.alpha_composite(capBoard,Image.fromarray(color));save(flat(capBoard,'#eee8db').crop((175,375,335,425)).resize((640,200),Image.Resampling.NEAREST),f'{h}-near-cap-coverage.png')
        if uncovered.any():write(OUT/f'{h}-cap-failure.json',{'uncoveredAlpha20Pixels':int(uncovered.sum()),'bounds':bounds(uncovered),'thresholdUpperAlpha':200,'status':'FAIL_SOURCE_CAP_NOT_HIDDEN'})
        limbs=[];visible=[]
        for k,(limb,image) in enumerate([('near',moved),('far',far)]):
            original=old['sides'][h]['phases']['phase-12']['limbs'][k]
            xs=dx if k==0 else original['dx'];ys=dy if k==0 else original['dy'];ns=nodes if k==0 else original['nodesY']
            fieldX=PchipInterpolator(ns,xs);fieldY=PchipInterpolator(ns,ys)
            witnesses={}
            for name,w in original['paintedSoleWitnesses'].items():
                px,py=w['point'];prePoint=[float(px+fieldX(py)),float(py+fieldY(py))];targetPoint=forward_rotate(*prePoint) if k==0 else prePoint;witnesses[name]={'sourcePoint':w['point'],'sourceRgba':w['rgba'],'pixelCentreUncertaintyWorking':.5,'preRotationPoint':prePoint,'transportedPoint':[float(v) for v in targetPoint]}
            ia=np.array(image);bottom=int(np.where(ia[:,:,3].max(1)>=20)[0].max()+1)
            assert bottom<=472 if k==0 else bottom==472
            if k==1:
                assert abs(witnesses['support']['transportedPoint'][1]-471)<1e-8
                assert np.linalg.norm(np.array(witnesses['support']['transportedPoint'])-original['paintedSoleWitnesses']['support']['transportedPoint'])<1e-8
                wx,wy=np.rint(witnesses['support']['transportedPoint']).astype(int)
                assert np.array(moved)[wy,wx,3]<20 and np.array(upper)[wy,wx,3]<20
            else:
                for one,two in [('heel','forefoot'),('centre','support')]:
                    distanceSource=np.linalg.norm(np.array(witnesses[one]['sourcePoint'])-witnesses[two]['sourcePoint'])
                    distanceTarget=np.linalg.norm(np.array(witnesses[one]['transportedPoint'])-witnesses[two]['transportedPoint'])
                    assert abs(distanceTarget-distanceSource)<1e-8
            limbs.append({'limb':limb,'role':'swing' if k==0 else 'stance','nodesY':ns,'dx':xs,'dy':ys,'sourceFixedSoleWitnesses':witnesses,'alpha20Bounds':bounds(ia[:,:,3]>=20),'alpha20BottomExclusive':bottom,'minimumVerticalJacobian':float((1+fieldY.derivative()(np.arange(512))).min()),'maximumVerticalJacobian':float((1+fieldY.derivative()(np.arange(512))).max()),'rigidShoe':True,'shoeTransform':'PCHIP rigid translation then whole-limb rotation' if k==0 else 'unchanged stance translation','rotationDegrees':angle if k==0 else 0})
            src=np.asarray(Image.open(ROOT/oldRecipe['renderSources']['components'][h][limb+'-complete']['file']))[:,:,3]
            targetX,targetY=xx+fieldX(yy),yy+fieldY(yy)
            if k==0:targetX,targetY=forward_rotate(targetX,targetY)
            tx=np.clip(np.rint(targetX).astype(int),0,511);ty=np.clip(np.rint(targetY).astype(int),0,511);j=1+fieldY.derivative()(yy)
            vis=(src>=200)&(ua[ty,tx]<20)
            if k==1:vis&=np.array(moved)[ty,tx,3]<20
            hits=vis&(j>1.5)
            visible.append({'limb':limb,'visibleAlpha200SourcePixelsOverJacobian1_5':int(hits.sum()),'visibleMaxJacobian':float(j[vis].max()) if vis.any() else None,'sourceBoundsOver1_5':bounds(hits),'mappedBoundsOver1_5':bounds(np.zeros((512,512),bool)) if not hits.any() else [int(tx[hits].min()),int(ty[hits].min()),int(tx[hits].max()+1),int(ty[hits].max()+1)],'qualification':'Source-forward nearest projection; calf extension can be visible, not an all-hidden claim or universal art threshold.'})
        checks={}
        for ident,image in poses.items():
            ia=np.array(image);ed=np.concatenate([ia[0,:,3],ia[-1,:,3],ia[:,0,3],ia[:,-1,3]])
            olda=np.array(Image.open(OLD/f'{h}-{ident}.png'));changed=np.any(ia!=olda,2)
            assert ed.max()==0 and not np.any(ia[:,:,:3][ia[:,:,3]==0])
            assert int(np.where(ia[:,:,3].max(1)>=20)[0].max()+1)==472
            # Exact upper layer is retained; opaque paint and y<380 composite remain exact.
            # Root rotation can change source-over AA backing under the unchanged garment.
            assert np.array_equal(ia[:380],olda[:380])
            assert np.array_equal(ia[ua==255],olda[ua==255])
            direct={}
            for w,ht in [(96,120),(64,80)]:
                da=np.array(Image.open(OUT/f'direct-{w}x{ht}/{h}-{ident}.png'));de=np.concatenate([da[0,:,3],da[-1,:,3],da[:,0,3],da[:,-1,3]])
                assert de.max()==0 and not np.any(da[:,:,:3][da[:,:,3]==0])
                bottom=int(np.where(da[:,:,3].max(1)>=20)[0].max()+1);assert bottom==(113 if w==96 else 75)
                direct[str(w)]={'alpha20BottomExclusive':bottom,'edgeAlphaMax':int(de.max()),'hiddenRgbAtAlphaZero':0,'oldBytesExact':sha(OUT/f'direct-{w}x{ht}/{h}-{ident}.png')==sha(OLD/f'direct-{w}x{ht}/{h}-{ident}.png')}
            checks[ident]={'oldBytesExact':sha(OUT/f'{h}-{ident}.png')==sha(OLD/f'{h}-{ident}.png'),'changedPixels':int(changed.sum()),'changedBounds':bounds(changed),'upperYBelow380Exact':True,'opaqueUpperExact':True,'changedUnderUpperAAAbove394':int((changed&(yy<394)&(ua<255)).sum()),'assembledAlpha20BottomExclusive':472,'edgeAlphaMax':0,'hiddenRgbAtAlphaZero':0,'direct':direct}
            assert checks[ident]['oldBytesExact']==(ident!='phase-12')
        # Compact source+old/revised+isolated comparison, same scale on two themes.
        footItems=[('old passing12',Image.open(OLD/f'{h}-phase-12.png').convert('RGBA')),(f'near TOE UP {angle:+}deg',frame),('NEAR swing',moved),('FAR unchanged',far)]
        board=Image.new('RGB',(4*360,2*280));draw=ImageDraw.Draw(board)
        for row,(bg,ink) in enumerate([('#eee8db','#111'),('#25272b','#eee')]):
            draw.rectangle((0,row*280,board.width,(row+1)*280),fill=bg)
            for col,(label,image) in enumerate(footItems):
                pic=flat(image,bg).crop((160,375,340,480)).resize((360,210),Image.Resampling.NEAREST)
                board.paste(pic,(col*360,row*280+40));draw.text((col*360+5,row*280+5),h+' '+label,font=font,fill=ink)
        save(board,f'{h}-passing12-native-light-dark.png')
        for theme,bg,ink in [('light','#eee8db','#111'),('dark','#25272b','#eee')]:
            board=Image.new('RGB',(5*512,544),bg);dr=ImageDraw.Draw(board)
            for col,ident in enumerate(poses):board.paste(flat(poses[ident],bg),(col*512,32));dr.text((col*512+6,5),h+' '+ident,font=font,fill=ink)
            save(board,f'{h}-all-keys-native-{theme}.png')
            preview=[flat(poses[f'phase-{p:02d}'],bg).crop((150,40,370,485)) for p in [0,4,8,12]]
            name=f'{h}-four-held-extremes-{theme}.gif';preview[0].save(OUT/name,save_all=True,append_images=preview[1:],duration=200,loop=0);files[name]=sha(OUT/name)
        board=Image.new('RGB',(4*300,4*288));dr=ImageDraw.Draw(board)
        for row,(w,ht,bg,ink) in enumerate([(96,120,'#eee8db','#111'),(96,120,'#25272b','#eee'),(64,80,'#eee8db','#111'),(64,80,'#25272b','#eee')]):
            dr.rectangle((0,row*288,board.width,(row+1)*288),fill=bg)
            for col,ident in enumerate(['phase-00','phase-04','phase-08','phase-12']):
                im=Image.open(OUT/f'direct-{w}x{ht}/{h}-{ident}.png').convert('RGBA');board.paste(flat(im,bg),(col*300+4,row*288+35));board.paste(flat(im,bg).resize((w*2,ht*2),Image.Resampling.NEAREST),(col*300+102,row*288+35));dr.text((col*300+4,row*288+5),f'{h} {w} {ident}',font=font,fill=ink)
        save(board,f'{h}-direct-native-and-2x-light-dark.png')
        records[h]={'phase12NearForeAftWorking':delta,'nearRootBaseUnchanged':base,'nearSwingLiftWorking':12,'nearRootRaiseWorking':7,'wholeNearRotationDegrees':angle,'rotationPivot':{'sourceCapAlpha20Points':capPoints,'sourceCapAlphaWeightedCentroid':sourcePivot.tolist(),'targetPchipMappedCapCentroid':targetPivot.tolist(),'anatomicalClaim':'Actual cut-cap source-control centre only; not a hidden knee'},'singleSampleComposition':True,'farStanceBytesExact':sha(OUT/f'isolated/{h}-phase-12-far.png')==sha(OLD/f'isolated/{h}-phase-12-far.png'),'upperBytesExact':sha(OUT/f'{h}-moving-upper.png')==sha(OLD/f'{h}-moving-upper.png'),'capNotCoveredByUpperAlpha200':int(uncovered.sum()),'nearCapAlpha20Pixels':int((ca>=20).sum()),'limbs':limbs,'visibleStretch':visible,'poses':checks}
    audit();write(OUT/'input-pins-after.json',{'inputs':pins,'inheritedPinMap':recipe['inheritedPinMap'],'inheritedCount':len(inherited),'allExact':True})
    write(OUT/'receipt.json',{'scope':recipe['scope'],'sourceOnly':True,'trialArguments':{'nearPassingForeAftWorking':args.fore_aft,'nearSwingLiftWorking':12,'nearRootRaiseWorking':7,'wholeNearToeUpDegrees':recipe['toeUpDegrees'],'outputRelativeToRoot':OUT.relative_to(ROOT).as_posix()},'inputs':pins,'inheritedPinMap':recipe['inheritedPinMap'],'inheritedPinsCheckedExactBeforeAfter':len(inherited),'sides':records,'files':files,'limits':recipe['limits']})
    print(json.dumps({'receiptSha256':sha(OUT/'receipt.json'),'oldPinsExact':len(inherited),'sides':{h:{'capUncovered':v['capNotCoveredByUpperAlpha200'],'changedPixels':v['poses']['phase-12']['changedPixels'],'farExact':v['farStanceBytesExact']} for h,v in records.items()}}))
if __name__=='__main__':main()
