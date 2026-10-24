"""Both Brigitte profile feet: actual source-RGBA witnesses/native cadence.

Five samples per distinct planted shoe are transported by the exact displayed
source field. Sampling-footprint membership is independent of painted alpha.
Native witness centroids, not rounded arbitrary shoe centres, fit cadence.
"""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/bueroklammer-end-to-end/sole-cadence-pilot'
MARKS={
    'right':{'travel':1,'shoeLength':104,'feet':{'near':[225,461],'far':[309,444]}},
    'left':{'travel':-1,'shoeLength':104,'feet':{'near':[289,461],'far':[203,443]}}
}
PHASES={'near':(4,6,8,10,12),'far':(12,14,16,18,20)}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
def main():
    OUT.mkdir(parents=True,exist_ok=True)
    pilot=load('bueroklammer_own_profile_field',HERE/'pilot-motion.py')
    street=load('bueroklammer_existing_cell_export',ROOT/'tools/build-street-character-sprites.py')
    method=load('bueroklammer_existing_stance_fit',ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py')
    report={'identity':'crowd-brigitte-bueroklammer','status':'RUNNING','pilotOnly':True,'comparisonCycleRole':'Legacy unselected provisional9.5 only; published actor was standingOnly, not a selected locomotion baseline.','sourcePatchInputs':[],'sourceWitnesses':[],'assessments':[],'observations':[],'pins':{}}
    for path in (Path(__file__),HERE/'pilot-motion.py',ROOT/'tools/build-street-character-sprites.py',ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py'):
        report['pins'][path.relative_to(ROOT).as_posix()]=sha(path)
    def save(): (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
    save()
    for heading,mark in MARKS.items():
        path=HERE/'registered'/f'{heading}.png';report['pins'][path.relative_to(ROOT).as_posix()]=sha(path)
        with Image.open(path) as raw:source=raw.convert('RGBA')
        rgba=np.array(source);cache={};source_marks=source.copy();draw=ImageDraw.Draw(source_marks)
        invalid=[]
        for foot,(x,y) in mark['feet'].items():
            minimum=int(rgba[y-2:y+3,x-2:x+3,3].min())
            report['sourcePatchInputs'].append({'heading':heading,'foot':foot,'point':[x,y],'sourceRGBA':rgba[y,x].tolist(),'patchMinimumAlpha':minimum,'registeredSha256':sha(path)})
            if minimum<200:invalid.append(foot)
            draw.rectangle((x-3,y-3,x+3,y+3),outline='#ff3050',width=1);draw.text((x-5,y-13),foot,fill='#ff3050')
        crop=source_marks.crop((170,416,345,477));flat=Image.alpha_composite(Image.new('RGBA',crop.size,'#eee8db'),crop).convert('RGB');zoom=flat.resize((1400,488),Image.Resampling.NEAREST)
        zoom.save(OUT/f'{heading}-actual-source-shoe-marks.png');zoom.close();flat.close();crop.close();source_marks.close();source.close();save()
        assert not invalid,(heading,invalid,'Own source patches not substantive; all source input diagnostics preserved')
        for phase in range(0,16,2):
            image,_=pilot.render(heading,math.tau*phase/16);sx,sy,_=pilot.side_field(heading,math.tau*phase/16)
            cache[phase]=(image,sx,sy)
        variant_contacts={'desktop':[],'mobile':[]}
        for foot,(x,y) in mark['feet'].items():
            patch=np.zeros_like(rgba);patch[y-2:y+3,x-2:x+3]=rgba[y-2:y+3,x-2:x+3]
            assert patch[y-2:y+3,x-2:x+3,3].min()>=200,(heading,foot,[x,y],rgba[y,x].tolist(),'Own sole patch is not substantive paint')
            coverage=np.zeros((512,512),float);coverage[y-2:y+3,x-2:x+3]=1
            patch_image=Image.fromarray(patch);packed=pilot.paint.premul(patch_image);patch_image.close()
            native_samples={'desktop':[],'mobile':[]};source_samples=[]
            boards={name:Image.new('RGB',(width*5,height),'#eee8db') for name,width,height in [('desktop',96,120),('mobile',64,80)]}
            for index,phase in enumerate(PHASES[foot]):
                image,sx,sy=cache[phase%16]
                witness=pilot.paint.unpack(pilot.paint.sample(packed,sx,sy));witness_rgba=np.array(witness)
                support=pilot.map_coordinates(coverage,[sy,sx],order=1,mode='constant');owned=support>=1-1e-8
                assert owned.any(),(heading,foot,phase,'No full own-source sampling footprint')
                actual=np.array(image);error=int(np.max(abs(witness_rgba[owned,:3].astype(int)-actual[owned,:3].astype(int))))
                assert error<=1,(heading,foot,phase,'Source witness not actual full paint',error)
                weight=witness_rgba[:,:,3].astype(float);cx=float((weight*pilot.XX).sum()/weight.sum());cy=float((weight*pilot.YY).sum()/weight.sum())
                source_samples.append({'frame':phase,'pointPx':[cx,cy],'alongTravel':mark['travel']*cx,'actualSourceRgbMaxError':error,'fullyOwnedPixels':int(owned.sum())})
                for name,width,height in [('desktop',96,120),('mobile',64,80)]:
                    q=width/128;geometry={'cell':[width,height],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}}
                    native=street.export_cell(image,geometry);mask=np.array(street.export_cell(witness,geometry))[:,:,3].astype(float)
                    yy,xx=np.mgrid[:height,:width];assert mask.sum()>0,(heading,foot,phase,name,'Lost own witness')
                    nx=float((xx*mask).sum()/mask.sum());ny=float((yy*mask).sum()/mask.sum())
                    native_samples[name].append({'frame':phase,'along_pixels':mark['travel']*nx,'pointPx':[nx,ny],'sourcePoint':[x,y],'sourceRGBA':rgba[y,x].tolist(),'witnessAlphaMass':float(mask.sum())})
                    flat=Image.alpha_composite(Image.new('RGBA',native.size,'#eee8db'),native).convert('RGB');draw=ImageDraw.Draw(flat);draw.ellipse((nx-1,ny-1,nx+1,ny+1),fill='#ff3050');draw.text((1,1),str(phase),fill='#111')
                    boards[name].paste(flat,(index*width,0));flat.close();native.close()
                witness.close()
            along=[entry['alongTravel'] for entry in source_samples];assert all(a>b for a,b in zip(along,along[1:])),(heading,foot,'Shoe not backward in stance',along)
            # Constant resolved root speed requires constant backward stance
            # velocity and constant planted height, independently of cadence.
            # This invariant rejects a far shoe accidentally using swing ease.
            phase=np.array(PHASES[foot],float)/16;fit=np.polyfit(phase,np.array(along),1)
            residual=float(np.max(abs(np.polyval(fit,phase)-along)))
            vertical_span=float(np.ptp([entry['pointPx'][1] for entry in source_samples]))
            source_record={'heading':heading,'foot':foot,'point':[x,y],'rgba':rgba[y,x].tolist(),'registeredSha256':sha(path),'samples':source_samples,'backwardSourcePxPerCycle':float(-fit[0]),'constantStanceResidualSourcePx':residual,'plantedHeightSpanSourcePx':vertical_span}
            report['sourceWitnesses'].append(source_record);save()
            assert residual<.01 and vertical_span<.01,(heading,foot,'Actual source stance eases or rises; one fixed-speed root cannot plant this shoe',source_record)
            for name in boards:
                board=boards[name];zoom=board.resize((board.width*4,board.height*4),Image.Resampling.NEAREST);zoom.save(OUT/f'{heading}-{foot}-{name}-witness.png');zoom.close();board.close()
                variant_contacts[name].append({'foot':heading+' actual '+foot+' shoe','samples':native_samples[name]})
            save()
        for name,width,height in [('desktop',96,120),('mobile',64,80)]:
            q=width/128;data={'character':report['identity'],'view':heading,'variant':name,'atlas_sha256':None,'frames_per_cycle':16,'game_units_per_pixel':2.33/(136*q*.02),'current_cycle_distance':json.loads((HERE/'pre-admission-family.json').read_text())['legacyUnselectedCycleDistance'],'shoe_length_pixels':mark['shoeLength']*136*q/400,'contacts':variant_contacts[name]}
            result=method.assess(data);assert result['both_feet_observed'];result['variant']=name
            result['fittedSlipNativePixels']={key:value/data['game_units_per_pixel'] for key,value in result['fitted_slip'].items() if key in ('rms_game_units','max_game_units')}
            report['assessments'].append(result);report['observations'].append(data)
        for image,_,_ in cache.values():image.close()
        cache.clear();save()
    distances=[case['fitted_cycle_distance'] for case in report['assessments']]
    report['status']='PASS source/native witness calibration; actual image review and rendered ground/root proof pending'
    report['fittedCycle']=sum(distances)/len(distances);report['fitRange']=[min(distances),max(distances)]
    report['limits']=['Both actually visible profile shoes tracked separately; no hidden-foot certification.','Source patch coordinates are provisional until first execution confirms substantive alpha and actual RGB correspondence.','Source .01px constant-stance check is specific to these pure translated witness patches; it is not a universal native slide threshold. Actual native residual is reported in pixels and shoe units for visual assessment.','Shoe-length104 source pixels is visually measured normalization only; stance slope uses actual native centroid.','Working world height2.33 is proposed; final selected height/runtime/root proof pending.','No encoded full-family atlas or renderer/city cadence acceptance.']
    save();print(json.dumps({key:report[key] for key in ['status','fittedCycle','fitRange']}))
if __name__=='__main__':main()
