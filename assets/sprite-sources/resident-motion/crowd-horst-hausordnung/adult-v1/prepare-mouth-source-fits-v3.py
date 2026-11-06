"""Portable own final rest-mouth definitions; explicit private compiler override only.

Generation reads owned source controls/paint, never ignored expected products.
Default official compiler must receive the root-owned two-predicate integration.
"""
from pathlib import Path
import argparse,copy,hashlib,importlib.util,json,traceback
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates

HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
FITS=HERE/'mouth-source-fits-v3.json';BASELINE=HERE/'mouth-source-fits-v2.json'
BASELINE_SHA='4028bc2d949c12f7320002f936b0fb037f492ff2e19f95f92d9745da1df98a62'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
FINAL_LOWER={'down-right':[0,2.3,3,2,0],'left':[0,2.1,2.95,2,0],'down-left':[0,2.8,3.75,3,0]}

def generate(compiler):
    assert sha(BASELINE)==BASELINE_SHA,'Immutable owned v2 source controls changed'
    baseline=json.loads(BASELINE.read_text());c=json.loads(FITS.read_text())
    assert c['authoredHeight']==2.33 and c['authoredStride']==13.6305 and c['width']==[0,0] and c['teeth']==0
    spec=importlib.util.spec_from_file_location('horst_v3_selected_mouth_compiler',compiler);mouth=importlib.util.module_from_spec(spec);spec.loader.exec_module(mouth);mouth.ROOT=ROOT
    records={}
    for direction,own in c['views'].items():
        old=baseline['views'][direction]
        if own is None:
            assert old is None and direction in ['up-right','up','up-left'];path=HERE/f'registered-v1/{direction}.png'
            records[direction]={'registration':None,'sourceSha256':sha(path),'newMouthImages':0};continue
        if direction not in FINAL_LOWER:assert own==old,'DOWN/approvedRIGHT source record must remain exact'
        else:
            keep={k:v for k,v in own.items() if k not in ['openingLowerOffsetsPx','trace']};previous={k:v for k,v in old.items() if k not in ['openingLowerOffsetsPx','trace']}
            assert keep==previous,'Only the three approved lower envelopes/explanatory trace may differ'
            assert own['openingLowerOffsetsPx']==FINAL_LOWER[direction]
        path=HERE/own['source'];assert sha(path)==own['sha256'];image=Image.open(path).convert('RGBA');alpha=np.asarray(image)[:,:,3]
        center=np.asarray(old['centerPx'],float);tangent=np.asarray(old['tangentAxisPx'],float)
        normal=np.asarray([-tangent[1],tangent[0]])/np.linalg.norm(tangent)*old['normalLengthPx']
        # Preserve v2 crease/upper construction literally. Only new lower targets
        # use the exact normal/declared-length construction accepted in trials.
        old_unit=normal/np.linalg.norm(normal)
        crease=center+np.linspace(-.5,.5,5)[:,None]*tangent+np.asarray(old['creaseOffsetsPx'])[:,None]*old_unit
        contours={'crease':crease,'source_upper':crease.copy(),'source_lower':crease.copy(),'open_upper':crease+np.asarray(old['openingUpperOffsetsPx'])[:,None]*old_unit,'open_lower':crease+np.asarray(old['openingLowerOffsetsPx'])[:,None]*old_unit}
        if direction in FINAL_LOWER:contours['open_lower']=crease+np.asarray(own['openingLowerOffsetsPx'])[:,None]*(normal/old['normalLengthPx'])
        entry={'input':{'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':[512,512]},'centerPx':center.tolist(),'axesPx':[*tangent.tolist(),*normal.tolist()],'contoursPx':{k:v.tolist() for k,v in contours.items()},'width':c['width'],'teeth':0}
        registration=mouth.compile_registration(entry)
        assert max(registration['profile']['open_lower'])<=2.9
        support={}
        for key,points in contours.items():
            values=map_coordinates(alpha.astype(float),np.stack([points[:,1],points[:,0]]),order=1,mode='constant',cval=0,prefilter=False)
            assert values.min()>=200,('Own source contour support',direction,key,float(values.min()))
            support[key]={'minimumOriginalAlpha':float(values.min()),'samples':5}
        assert np.linalg.det(np.column_stack([tangent,normal]))>0
        records[direction]={'own':own,'entry':entry,'registration':registration,'sourceControlSupport':support}
    assert sum(r['registration'] is not None for r in records.values())==5
    assert [d for d,r in records.items() if r['registration'] is None]==['up-right','up','up-left']
    return {'status':'OWNED V3 REST DEFINITIONS GENERATED; replay comparison separate','sourceFitsSha256':sha(FITS),'sourceHelperSha256':sha(Path(__file__)),'baselineOwnedControls':{'file':BASELINE.relative_to(ROOT).as_posix(),'sha256':BASELINE_SHA,'role':'Raw author control geometry, not expected generated artifacts'},'compiler':{'file':str(compiler),'sha256':sha(compiler),'official':compiler==(ROOT/'tools/build-street-mouths.py').resolve()},'visibleFits':5,'rearNulls':3,'newMouthImages':0,'generationReadsExpectedProducts':False,'records':records,'limits':'Rest-source definitions only. Final changing-pose/native/GLSL/media and landscape clarity obligations remain; no nativePNG speech activity claim.'}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,required=True);parser.add_argument('--compiler',type=Path);parser.add_argument('--compiler-sha');args=parser.parse_args()
    compiler=(args.compiler or ROOT/'tools/build-street-mouths.py').resolve()
    if args.compiler:
        if not args.compiler_sha:parser.error('--compiler requires exact --compiler-sha')
        assert sha(compiler)==args.compiler_sha,'Explicit private compiler bytes differ'
    else:assert args.compiler_sha is None,'No implicit candidate or default hash override'
    out=args.out.resolve();assert not out.exists(),'Preserve previous products/RED';out.mkdir(parents=True)
    try:
        report=generate(compiler);(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['status','visibleFits','rearNulls','newMouthImages']}))
    except Exception as error:
        (out/'RED.json').write_text(json.dumps({'status':'STOP source/compile RED; no automatic fallback','error':str(error),'traceback':traceback.format_exc(),'compiler':str(compiler),'requiredRootIntegration':'Official Python and JS open_lower-only2.9 predicates; no mouth-normal/profile cap/refit workaround'},indent=2)+'\n');raise
if __name__=='__main__':main()
