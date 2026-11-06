"""Single isotropic own missing-FAR registration; neutral-only, oldFar archived."""
from pathlib import Path
import argparse,hashlib,json,traceback
import numpy as np
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4];CONTROLS=HERE/'quarter-far-v2/registration-trial-v2.json'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def flat(image,bg):
    out=Image.new('RGBA',image.size,bg);out.alpha_composite(image);return out.convert('RGB')
def run(out):
    c=json.loads(CONTROLS.read_text());folder=CONTROLS.parent;raw_path=folder/c['raw'];source_path=(folder/c['original']).resolve();assert sha(raw_path)==c['rawSha256'] and sha(source_path)==c['originalSha256']
    source=Image.open(source_path).convert('RGBA');raw=Image.open(raw_path).convert('RGBA');original=np.asarray(source);yy,xx=np.mgrid[:512,:512]
    d=c['densityReference'];s=d['uniformScalarNumerator']/d['uniformScalarDenominator'];p=c['placement'];tx=p['authoredSourceHeelBackX']-s*p['rawHeelBackX'];ty=p['authoredProjectedFarFullSoleY']-s*p['rawFullSoleY']
    registered=raw.convert('RGBa').transform((512,512),Image.Transform.AFFINE,(1/s,0,-tx/s,0,1/s,-ty/s),Image.Resampling.BICUBIC).convert('RGBA')
    rows=c['originalFarVisiblePartition']['rightBoundaryYx'];edge=np.interp(np.arange(512),[v[0]for v in rows],[v[1]for v in rows])[:,None]
    old_lower_domain=(yy>=c['originalFarVisiblePartition']['startY'])&(xx<edge)
    # Curved root: explicit pixel-centre even-odd rule, including exact polygon border.
    vertices=c['sourceOwnershipV2']['additiveOldFarPolygon'];cx=2*xx+1;cy=2*yy+1
    inside=np.zeros((512,512),dtype=bool);border=inside.copy()
    for i,(ax,ay) in enumerate(vertices):
        bx,by=vertices[(i+1)%len(vertices)];ax*=2;ay*=2;bx*=2;by*=2
        cross=(cx-ax)*(by-ay)-(cy-ay)*(bx-ax)
        border|=(cross==0)&(cx>=min(ax,bx))&(cx<=max(ax,bx))&(cy>=min(ay,by))&(cy<=max(ay,by))
        if ay!=by:inside^=((ay>cy)!=(by>cy))&(cx<(bx-ax)*(cy-ay)/(by-ay)+ax)
    root_domain=inside|border;far_domain=old_lower_domain|root_domain
    old_far=original.copy();old_far[~far_domain]=0
    transferred=original.copy();transferred[~(root_domain&~old_lower_domain)]=0
    foreground=original.copy();foreground[far_domain]=0
    original_foreground=(original[:,:,3]>0)&~far_domain
    # Upper raw is either literally hidden by retained original paint or released by the curved root.
    allowed=original_foreground|root_domain|(yy>=c['originalFarVisiblePartition']['startY'])
    far=np.array(registered);far[~allowed]=0
    body=far.copy();body[original_foreground]=original[original_foreground]
    both_empty=(original[:,:,3]==0)&(body[:,:,3]==0);body[both_empty]=original[both_empty]
    upper=yy<c['originalFarVisiblePartition']['startY']
    exposed_upper=(far[:,:,3]>0)&upper&~root_domain&~original_foreground
    assert not exposed_upper.any(),'No raw top underlap outside real retained silhouette/release'
    assert np.array_equal(body[original_foreground],original[original_foreground]),'Every retained original Near/pocket/coat/hand/key RGBA exact'
    assert np.array_equal(far[yy>=420],np.asarray(registered)[yy>=420]),'Complete new FAR cuff/boot uncut and unwarped'
    rows_out=[]
    for y,x in zip(*np.where((transferred[:,:,3]>0))):rows_out.append([int(x),int(y),*[int(v)for v in original[y,x]]])
    (out/'transferred-original-old-far-rgba.json').write_text(json.dumps({'pixelRule':c['sourceOwnershipV2']['pixelRule'],'pixels':rows_out},indent=2)+'\n')
    images={'original':source,'old-far-archive':Image.fromarray(old_far),'upper-old-far-transfer':Image.fromarray(transferred),'original-near-fixed':Image.fromarray(foreground),'new-far-complete-registered':registered,'new-far-underlap-layer':Image.fromarray(far),'neutral-newfar-only':Image.fromarray(body)};outputs={}
    for name,image in images.items():
        path=out/(name+'.png');image.save(path);outputs[name]={'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path)}
    for theme,bg in [('light',(242,237,225,255)),('dark',(24,29,32,255))]:
        names=['original','new-far-complete-registered','neutral-newfar-only'];board=Image.new('RGB',(1536,532),bg[:3]);draw=ImageDraw.Draw(board)
        detail=Image.new('RGB',(1260,308),bg[:3]);dd=ImageDraw.Draw(detail)
        for i,name in enumerate(names):
            board.paste(flat(images[name],bg),(i*512,20));draw.text((i*512,0),name,fill='white' if theme=='dark' else 'black')
            part=flat(images[name].crop((170,400,310,496)),bg).resize((420,288),Image.Resampling.NEAREST);detail.paste(part,(i*420,20));dd.text((i*420,0),name,fill='white' if theme=='dark' else 'black')
        board.save(out/f'neutral-fullbody-{theme}.png');detail.save(out/f'neutral-wholecuff-boots-explicit3x-{theme}.png')
    for theme,bg in [('light',(242,237,225,255)),('dark',(24,29,32,255))]:
        names=['original','original-near-fixed','upper-old-far-transfer','new-far-underlap-layer','neutral-newfar-only']
        detail=Image.new('RGB',(1700,580),bg[:3]);draw=ImageDraw.Draw(detail)
        for i,name in enumerate(names):
            part=flat(images[name].crop((170,230,255,370)),bg).resize((340,560),Image.Resampling.NEAREST)
            detail.paste(part,(i*340,20));draw.text((i*340,0),name,fill='white' if theme=='dark' else 'black')
        detail.save(out/f'root-ownership-explicit4x-{theme}.png')
    changed=np.any(body!=original,axis=2);a=body[:,:,3];ys,xs=np.where(a>=21)
    report={'status':'NEUTRAL REGISTRATION TRIAL ONLY; semantic/density/wholeleg art review required','controlsSha256':sha(CONTROLS),'sourceSha256':sha(source_path),'rawSha256':sha(raw_path),'uniformScalar':s,'translation':[tx,ty],'sameScalarBothAxes':True,'noRotationMirroringOrSeparateFootFit':True,'completeNearDensityReference':d,'farFullSoleAuthored':p,'nearestSole472Unchanged':True,'originalNearFixedPredicateRgbaExact':True,'retainedOriginalRgbaExact':True,'upperUnderlapOutsideRetainedOrCurvedReleasePixels':int(exposed_upper.sum()),'transferredPositiveOriginalOldFarPixels':len(rows_out),'sourceOwnershipV2':c['sourceOwnershipV2'],'newFarOnlyReplacement':True,'oldFarArchivedNotOverlaid':True,'partitionNeedsActualAnatomyReview':True,'changedBodyRgbaPixels':int(changed.sum()),'newAlpha21Bounds':[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)],'outputs':outputs,'sourceWrites':0,'motionPoses':0,'limits':'Neutral-only; predicate equality does not certify semantic ownership or completeNear geometry. Fullsource actual view/root required before expansion.'}
    assert sha(raw_path)==c['rawSha256'] and sha(source_path)==c['originalSha256'];return report
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,required=True);args=parser.parse_args();out=args.out.resolve();assert not out.exists();out.mkdir(parents=True)
    try:report=run(out);(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='outputs'}))
    except Exception as e:(out/'RED.json').write_text(json.dumps({'status':'STOP semantic/density/material trial error; no retry or automatic fit','error':str(e),'traceback':traceback.format_exc()},indent=2)+'\n');raise
if __name__=='__main__':main()
