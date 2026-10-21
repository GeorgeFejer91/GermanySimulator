"""One directly sampled16-cell side SOURCE loop; no admission or pose fallback."""
from pathlib import Path
import argparse,json,sys
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from source_fields import SideFields,ROOT,HERE,sha,load,bbox,travel,weights
def write(p,v):p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
def run(out):
    rig=SideFields();r=rig.recipe;pins=r['inputPins'].copy()
    for p in [HERE/'recipe.json',HERE/'source_fields.py',Path(__file__)]:pins[p.relative_to(ROOT).as_posix()]=sha(p)
    def audit():
        for p,h in pins.items():assert sha(ROOT/p)==h,p
    audit();out.mkdir(parents=True,exist_ok=False);write(out/'input-pins-before.json',pins)
    export=load('side_loop_export',ROOT/'tools/build-street-character-sprites.py');font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',13);files={};records={};golden=[];checks={};probes={}
    def save(im,name):
        p=out/name;p.parent.mkdir(parents=True,exist_ok=True);im.save(p);files[name]=sha(p)
    def flat(im,bg):return Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
    def compare(a,b):
        x,y=np.array(a),np.array(b);d=np.abs(x.astype(int)-y.astype(int));m=np.any(d,2)
        return {'rgbaExact':bool(np.array_equal(x,y)),'changedPixels':int(m.sum()),'maxDeltaRgba':d.reshape(-1,4).max(0).tolist(),'changedBounds':bbox(m)}
    for h,c in r['sides'].items():
        upper=rig.sources[h]['parts']['upper'];ua=np.array(upper)[:,:,3];save(upper,f'{h}-moving-upper.png');reference=Image.open(ROOT/c['neutralReference']['file']).convert('RGBA');sourceFrames=[];rows=[]
        # All neutral phases are mathematically the same revised source, not original standing.
        strengthZero=[]
        for p in [0,4,8,12,16,-16,2.5]:
            im,_,_,_=rig.render(h,p,0,False);v=compare(im,reference);assert v['rgbaExact'];strengthZero.append({'phase':p,'rgbaExact':True})
        checks[h]={'strengthZeroVariant':c['neutralReference'],'strengthZeroExact':strengthZero,'upperRgbaExactToAccepted':compare(upper,Image.open(ROOT/f'output/ambient-city-animation/hannelore-sparkasse-side-passing-rotation-v1/{h}-moving-upper.png'))}
        assert checks[h]['upperRgbaExactToAccepted']['rgbaExact']
        save(reference,f'{h}-revised-neutral.png')
        for p in range(16):
            im,limbs,layers,caps=rig.render(h,p);a=np.array(im);ed=np.concatenate([a[0,:,3],a[-1,:,3],a[:,0,3],a[:,-1,3]]);bottom=int(np.where(a[:,:,3].max(1)>=20)[0].max()+1)
            assert bottom==472 and ed.max()==0 and not np.any(a[:,:,:3][a[:,:,3]==0]);assert np.array_equal(a[:380],np.array(reference)[:380]);assert np.array_equal(a[ua==255],np.array(reference)[ua==255])
            save(im,f'{h}-phase-{p:02}.png');sourceFrames.append(im);direct={}
            for k,m in enumerate(limbs):
                save(layers[k],f'isolated/{h}-{p:02}-{m["limb"]}.png');assert m['rootCapNotCoveredByUpperAlpha200']==0,(h,p,m['limb'],'cap',m['uncoveredRootBounds']);assert m['alpha20Bounds'][3]<=472
                # A declared stance uses the same original source point at sourcefloor471.
                if m['liftWorking']<1e-10 and abs(m['rotationDegrees'])<1e-10:assert abs(m['fixedSoleWitnesses']['support']['transportedPoint'][1]-471)<1e-8
            capA=np.maximum(np.array(caps[0])[:,:,3],np.array(caps[1])[:,:,3]);overlay=np.zeros((512,512,4),dtype='uint8');overlay[capA>=20]=[0,210,60,180];diag=Image.alpha_composite(upper,Image.fromarray(overlay));save(flat(diag,'#eee8db').crop((170,375,340,425)).resize((510,150),Image.Resampling.NEAREST),f'caps/{h}-{p:02}.png')
            for w,ht in [(96,120),(64,80)]:
                q=w/128;cell=export.export_cell(im,{'working':{'figureHeight':400,'baseline':472},'cell':[w,ht],'pivot':[64*q,150*q],'figureHeight':137*q});save(cell,f'direct-{w}/{h}-{p:02}.png');d=np.array(cell);de=np.concatenate([d[0,:,3],d[-1,:,3],d[:,0,3],d[:,-1,3]]);assert de.max()==0 and not np.any(d[:,:,:3][d[:,:,3]==0]);b=int(np.where(d[:,:,3].max(1)>=20)[0].max()+1);assert b==(113 if w==96 else 75);direct[str(w)]={'edgeAlphaMax':0,'hiddenRgb':0,'alpha20BottomExclusive':b}
            if p in [0,4,8,12]:
                gold=ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-passing-rotation-v1';v=compare(im,Image.open(gold/f'{h}-phase-{p:02}.png'));v.update({'heading':h,'phase':p,'kind':'working','bytesExact':sha(out/f'{h}-phase-{p:02}.png')==sha(gold/f'{h}-phase-{p:02}.png')});golden.append(v)
                # No key PNG is used as a rendering fallback; report tiny arithmetic deltas.
                assert max(v['maxDeltaRgba'])<=1,(h,p,'golden drift',v)
                for w,ht in [(96,120),(64,80)]:
                    name=f'direct-{w}/{h}-{p:02}.png';g=gold/f'direct-{w}x{ht}/{h}-phase-{p:02}.png';v=compare(Image.open(out/name),Image.open(g));v.update({'heading':h,'phase':p,'kind':str(w),'bytesExact':sha(out/name)==sha(g)});golden.append(v);assert max(v['maxDeltaRgba'])<=1
            rows.append({'phase':p,'timeMs':p*64,'limbs':limbs,'assembledAlpha20BottomExclusive':bottom,'edgeAlpha':0,'hiddenRgb':0,'upperOpaqueAndHeadExact':True,'direct':direct,'headField':{'sourceSize':[512,512],'identityRegion':'actual upper/head above380; no mouth registration here','dx':[0,0],'dy':[0,0],'nodesY':[0,511]}})
        assert len({im.tobytes() for im in sourceFrames})==16
        aliases={}
        for p,at in [(16,0),(-16,0),(-1,15),(32,0)]:
            im,_,_,_=rig.render(h,p,diagnostics=False);v=compare(im,sourceFrames[at]);assert v['rgbaExact'];aliases[str(p)]={'canonicalPhase':at,'rgbaExact':True}
        checks[h]['phaseAliases']=aliases;checks[h]['distinctSourceRgba']=16
        steps=[]
        for p in range(16):
            a=rig.paint.premul(sourceFrames[p]);b=rig.paint.premul(sourceFrames[(p+1)%16]);visible=(a[:,:,3]>0)|(b[:,:,3]>0);d=np.abs(a-b);steps.append({'from':p,'to':(p+1)%16,'visibleMeanPremulLinearChange':float(d[visible].mean()),'rgbaChangedPixels':int(np.any(np.array(sourceFrames[p])!=np.array(sourceFrames[(p+1)%16]),2).sum())})
        checks[h]['adjacentChangeRanking']=sorted(steps,key=lambda v:v['visibleMeanPremulLinearChange'],reverse=True);checks[h]['wrapStep']=steps[-1]
        for theme,bg,ink in [('light','#eee8db','#111'),('dark','#25272b','#eee')]:
            for group in range(4):
                board=Image.new('RGB',(4*300,570),bg);dr=ImageDraw.Draw(board)
                for col in range(4):
                    p=group*4+col;pic=flat(sourceFrames[p],bg);dr.text((col*300+4,4),f'{h} {p:02} {p*64}ms',font=font,fill=ink);board.paste(pic.resize((256,256)),(col*300+4,30));board.paste(pic.crop((165,375,345,480)).resize((360,210),Image.Resampling.NEAREST),(col*300,330))
                save(board,f'{h}-native-{theme}-{group}.png')
            for w,ht in [(96,120),(64,80)]:
                board=Image.new('RGB',(8*220,2*420),bg);dr=ImageDraw.Draw(board)
                for p in range(16):
                    cell=Image.open(out/f'direct-{w}/{h}-{p:02}.png').convert('RGBA');pic=flat(cell,bg);x,y=p%8*220,p//8*420;dr.text((x+4,y+4),f'{h} {w} {p:02}',font=font,fill=ink);board.paste(pic,(x+4,y+30));board.paste(pic.resize((w*2,ht*2),Image.Resampling.NEAREST),(x+4,y+160))
                save(board,f'{h}-direct-{w}-{theme}.png')
            seq=[flat(im,bg) for im in sourceFrames]
            for suffix,duration in [('inspection-slow',160),('inspection',80)]:
                name=f'{h}-{suffix}-{theme}.gif';seq[0].save(out/name,save_all=True,append_images=seq[1:],duration=duration,loop=0);files[name]=sha(out/name)
        # Explicit largest transition and15->0 at native/NN scale, no smoothing.
        step=checks[h]['adjacentChangeRanking'][0];pairs=[step,steps[-1]];board=Image.new('RGB',(4*360,2*270));dr=ImageDraw.Draw(board)
        for row,(bg,ink) in enumerate([('#eee8db','#111'),('#25272b','#eee')]):
            dr.rectangle((0,row*270,1440,(row+1)*270),fill=bg)
            for j,pair in enumerate(pairs):
                for k,p in enumerate([pair['from'],pair['to']]):
                    col=j*2+k;board.paste(flat(sourceFrames[p],bg).crop((165,375,345,480)).resize((360,210),Image.Resampling.NEAREST),(col*360,row*270+40));dr.text((col*360+4,row*270+5),f'{h} '+('largest' if j==0 else 'wrap')+f' phase{p}',font=font,fill=ink)
        save(board,f'{h}-largest-and-wrap.png');records[h]=rows
    audit();write(out/'input-pins-after.json',pins);write(out/'golden-keys.json',golden);write(out/'construction-checks.json',checks)
    receipt={'status':'SOURCE32_SIDE_POSES_PENDING_VISUAL_REVIEW','inputPins':pins,'files':files,'sides':records,'working':r['working'],'paintFigure':137,'nominalFigure':136,'worldHeight':1.6,'frameMs':64,'proposedCycleMs':1024,'inspectionGif':{'frameMs':80,'cycleMs':1280,'slowFrameMs':160,'slowCycleMs':2560,'qualification':'Centisecond exact diagnostic timing, NOT the proposed64ms production phase.'},'stride':'provisional48workingpx/cycle source stance only, not encoded/native/runtime admission','limits':r['limits']};write(out/'source-loop.json',receipt);print(json.dumps({'receipt':sha(out/'source-loop.json'),'poses':32,'direct':64,'files':len(files),'goldenNonExact':[v for v in golden if not v['rgbaExact']]}))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--outdir',type=Path,required=True);a=p.parse_args();out=a.outdir.resolve();assert out.is_relative_to(ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-loop-v1');run(out)
