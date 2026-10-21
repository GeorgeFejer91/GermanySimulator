"""Mark Renate's named planted soles on exact direct physical walk cells."""
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[5]
OUT=ROOT/'output/ambient-city-animation/renate-termin-walk-source-v1'
HERE=Path(__file__).resolve().parent
ASSESS=ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py'

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module

assess=load('renate_speed_method',ASSESS)
source=load('renate_frozen_role_fields',HERE/'source_fields.py')
street=load('renate_stride_export',ROOT/'tools/build-street-character-sprites.py')

def marker(image,role_image,x,y):
    arr=np.asarray(image);role=np.asarray(role_image)
    candidates=[]
    for yy in range(max(0,round(y)-4),min(image.height,round(y)+5)):
        for xx in range(max(0,round(x)-1),min(image.width,round(x)+2)):
            if (abs(xx-x)<=.51 and role[yy,xx,3]>=160 and arr[yy,xx,3]>=160 and
                int(np.max(np.abs(arr[yy,xx].astype(int)-role[yy,xx].astype(int))))<=8):
                candidates.append(((xx-x)**2+(yy-y)**2,-yy,xx,yy))
    if not candidates:return None
    _,_,xx,yy=min(candidates)
    return {'pixel':[xx,yy],'rgba':[int(v) for v in arr[yy,xx]],
        'projectedSourceWitness':[x,y], 'quantizationXErrorPx':xx-x,
        'namedRoleVisibleRgbaMaxDifference':int(np.max(np.abs(arr[yy,xx].astype(int)-role[yy,xx].astype(int))))}

def main():
    receipt=OUT/'walk-source.json'
    walk=json.loads(receipt.read_text(encoding='utf8'))
    if walk['status']!='held Renate full 4x16 source walk and bridge; independent review pending':
        raise ValueError('Source walk receipt changed')
    variants=(('desktop',96,120,99,48,112.5,.78431372549),
              ('mobile',64,80,66,32,75,1.17647058824))
    assessments=[];evidence=[];omissions=[]
    actor=source.RenateFields()
    for direction in ('right','left'):
        signed=1 if direction=='right' else -1
        records=walk['directions'][direction]['walkFields']
        for variant,w,h,paint,px,py,scale in variants:
            cells=[]
            for phase in range(16):
                path=OUT/f'physical/{direction}-walk-{phase:02}-{variant}.png'
                expected=walk['physicalHashes'][path.relative_to(OUT).as_posix()]
                if sha(path)!=expected:raise ValueError('Physical source cell pin changed')
                cells.append(Image.open(path).convert('RGBA'))
            strip=Image.new('RGBA',(w*16,h))
            for phase,cell in enumerate(cells):strip.paste(cell,(phase*w,0))
            strip_path=OUT/f'{direction}-{variant}-speed-source-strip.png'
            strip.save(strip_path)
            contacts=[]
            for role,phase_range in (('near',range(12,21)),('far',range(4,13))):
                samples=[]
                for unwrapped in phase_range:
                    phase=unwrapped%16
                    field=records[phase]['limbs'][role]
                    source_x,source_y=field['sourceSolePoint']
                    x=px+(source_x+field['dx'][-1]-256)*paint/400
                    y=py+(source_y+field['dy'][-1]-472)*paint/400
                    part=actor.side_roles[direction][role]
                    own_warp=source.paint.warp_layer(part,field['nodes_y'],field['dx'],field['dy'])
                    own_cell=street.export_cell(own_warp,{'working':{'figureHeight':400,'baseline':472},
                        'cell':[w,h],'figureHeight':paint,'pivot':[px,py]})
                    found=marker(cells[phase],own_cell,x,y)
                    if found is None:
                        omissions.append({'direction':direction,'variant':variant,'role':role,
                            'unwrappedPhase':unwrapped,'reason':'No visible sole pixel from this named own role near projected source witness'})
                        continue
                    samples.append({'frame':unwrapped,'along_pixels':signed*found['pixel'][0]})
                    evidence.append({'direction':direction,'variant':variant,'role':role,'phase':phase,
                        'unwrappedPhase':unwrapped,
                        'cellSha256':sha(OUT/f'physical/{direction}-walk-{phase:02}-{variant}.png'),
                        'sourceSolePoint':[source_x,source_y],**found})
                if len(samples)<3:raise ValueError('Insufficient visible named-foot stance evidence')
                contacts.append({'foot':role,'samples':samples})
            row={'character':'stadt-renate-termin','view':direction+'-'+variant,
                'atlas_file':strip_path.name,'atlas_sha256':sha(strip_path),
                'frames_per_cycle':16,'game_units_per_pixel':scale,
                'current_cycle_distance':12,
                'shoe_length_pixels':28 if variant=='desktop' else 19,
                'contacts':contacts}
            assessments.append(row)
    data={'assessments':assessments,'witnesses':evidence,'omittedOccludedSoles':omissions,
        'methodSha256':sha(ASSESS),'walkReceiptSha256':sha(receipt),
        'fieldApiSha256':sha(HERE/'source_fields.py'),
        'nominalContinuousFieldCycleDistanceGameUnits':11.6470588235,
        'note':'12 is a diagnostic comparison value, not an admitted game stride. Contacts inspect the full 9-frame planted interval and actual saved 8-bit direct physical cells. A witness is admitted only within 0.51 exported pixels of the same projected own-source sole point and when merged and named-role RGBA match within 8. Occluded markers are omitted; no nearest-other-material relocation is accepted.'}
    path=OUT/'stride-measurements.json';path.write_text(json.dumps(data,indent=2)+'\n',encoding='utf8')
    result=assess.assess_file(path)
    # Pixel centers are quantized. A worst-case independent +/-0.5-pixel
    # placement per marked sole gives this bound on the fitted distance.
    for row,fit in zip(assessments,result['assessments']):
        numerator=denominator=0.0
        for contact in row['contacts']:
            frames=[point['frame'] for point in contact['samples']]
            mean=sum(frames)/len(frames)
            numerator+=sum(abs(frame-mean) for frame in frames)
            denominator+=sum((frame-mean)**2 for frame in frames)
        fit['worstCaseHalfPixelCycleDistanceUncertaintyGameUnits']=.5*numerator/denominator*16*row['game_units_per_pixel']
        fit['oneFrameHoldDisplacementAtFitGameUnits']=fit['fitted_cycle_distance']/16
        fit['halfFramePhaseQuantizationGameUnits']=fit['fitted_cycle_distance']/32
    report=OUT/'stride-assessment.json';report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'measurementsSha256':sha(path),'assessmentSha256':sha(report),
        'fits':[(r['view'],r['fitted_cycle_distance'],r['worstCaseHalfPixelCycleDistanceUncertaintyGameUnits']) for r in result['assessments']],
        'omissions':len(omissions)}))

if __name__=='__main__':main()
