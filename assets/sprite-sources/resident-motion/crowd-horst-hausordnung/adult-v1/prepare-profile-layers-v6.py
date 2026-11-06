"""Portable Horst profiles from three owned raw paintings and semantic controls.

No old extracted/registered parts, ignored overlay, expected pilot or validation
baseline is read. Registration and generation finish before separate comparison.
"""
from pathlib import Path
import argparse, hashlib, json
import numpy as np
from PIL import Image, ImageDraw, ImageChops, ImageFilter

HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def polygon(points):
    mask=Image.new('L',(512,512))
    if points:ImageDraw.Draw(mask).polygon([tuple(p) for p in points],fill=255)
    return mask

def selected(image,mask):
    result=Image.new('RGBA',image.size);result.paste(image,(0,0),mask);return result

def supported(image):return image.getchannel('A').point(lambda a:255 if a>=200 else 0)

def semantic_masks(control,direction):
    own=control['directions'][direction]
    fore=Image.new('L',(512,512));ImageDraw.Draw(fore).rectangle((0,0,511,control['fixedForebodyThroughY']),fill=255)
    hand=polygon(own.get('semanticHandContour'))
    if direction=='right':
        d=ImageDraw.Draw(hand)
        for row in control['semanticForearmEdgeRows']:d.line((row['xStart'],row['y'],row['xEndInclusive'],row['y']),fill=255)
    shadow=polygon(own.get('fixedHandShadowContour'));hand=ImageChops.lighter(hand,shadow)
    keys=polygon(own.get('semanticKeyContour'))
    if direction=='right':
        shaft=Image.new('L',(512,512));d=ImageDraw.Draw(shaft)
        for x,y in control['sourceSemanticTrace']['keyShaftActualPaintPoints']:d.point((x,y),fill=255)
        keys=ImageChops.lighter(keys,shaft.filter(ImageFilter.MaxFilter(3)))
    hand_keys=ImageChops.lighter(hand,keys);fixed=ImageChops.lighter(fore,hand_keys)
    near=Image.new('L',(512,512));ImageDraw.Draw(near).rectangle((0,control['nearRootOverlapY'],511,511),fill=255)
    return {'fixed':fixed,'hand':hand,'keys':keys,'shadow':shadow,'handKeys':hand_keys,'near':ImageChops.subtract(near,hand_keys)}

def register_original(raw,control,direction):
    r=control['rawRegistration'];cell=raw.crop(tuple(r['semanticCells'][direction]));support=supported(cell);bounds=support.getbbox();assert bounds
    sole=bounds[3];band_top=max(bounds[1],sole-r['soleBearingRows'])
    band=support.crop((0,band_top,384,sole)).getbbox();assert band
    pivot=((band[0]+band[2])/2,sole);density=r['densityNumerator']/r['densityDenominator'];target=tuple(r['pivot'])
    affine=(1/density,0,pivot[0]-target[0]/density,0,1/density,pivot[1]-target[1]/density)
    image=cell.convert('RGBa').transform((512,512),Image.Transform.AFFINE,affine,Image.Resampling.BICUBIC).convert('RGBA')
    return image,{'rawCell':r['semanticCells'][direction],'rawPivot':list(pivot),'uniformDensity':density,'affineOutputToRaw':list(affine)}

def roi_bounds(image,roi):
    b=supported(image).crop(tuple(roi)).getbbox();assert b
    return [roi[0]+b[0],roi[1]+b[1],roi[0]+b[2],roi[1]+b[3]]

def run(output=None):
    control_path=HERE/'profile-leg-controls-v6.json';control=json.loads(control_path.read_text())
    out=(output or HERE/'profile-layers-v6').resolve()
    assert out.is_relative_to(HERE.resolve()) and out.name.startswith('profile-layers-v6')
    assert not out.exists(),'Preserve every existing source generation'
    inputs={}
    for p in [control_path,Path(__file__).resolve()]:inputs[p.relative_to(HERE).as_posix()]=sha(p)
    raw_images={}
    for role,entry in control['rawPaint'].items():
        p=HERE/entry['file'];assert sha(p)==entry['sha256'];inputs[entry['file']]=sha(p);raw_images[role]=Image.open(p).convert('RGBA')
    assert raw_images['eight'].size==(1536,1024) and raw_images['far'].size==(1536,1024)
    originals={};parts={};measurements={};registrations={}
    for direction,c in control['directions'].items():
        originals[direction],registrations[direction]=register_original(raw_images['eight'],control,direction)
        parts[direction]=raw_images['far'].crop(tuple(c['rawFarPanel']))
        nb=roi_bounds(originals[direction],c['nearBootMeasureRoi']);fb=roi_bounds(parts[direction],c['rawFarBootMeasureRoi'])
        measurements[direction]={'nearBootBounds':nb,'rawFarBootBounds':fb,'nearWidth':nb[2]-nb[0],'rawFarWidth':fb[2]-fb[0]}
    density=sum(v['nearWidth'] for v in measurements.values())/sum(v['rawFarWidth'] for v in measurements.values())
    assert density==195/687
    # Cloth placement is an authored correspondence, not an expected-image fit.
    c=control['hiddenCloth'];r0,r1=c['rawLandmarks'];t0,t1=c['registeredLandmarks']
    cloth_density=(t1[0]-t0[0])/(r1[0]-r0[0]);tx=t0[0]-cloth_density*r0[0];ty=t0[1]-cloth_density*r0[1]
    cloth_affine=(1/cloth_density,0,-tx/cloth_density,0,1/cloth_density,-ty/cloth_density)
    cloth=raw_images['cloth'].convert('RGBa').transform((512,512),Image.Transform.AFFINE,cloth_affine,Image.Resampling.BICUBIC).convert('RGBA')
    out.mkdir(parents=True);records={};all_outputs={}
    def emit(name,image):
        path=out/name;image.save(path);entry={'file':path.relative_to(HERE).as_posix(),'sha256':sha(path)};all_outputs[name]=entry;return entry
    for direction,c in control['directions'].items():
        original=originals[direction];part=parts[direction];support=supported(part);box=support.getbbox();assert box
        sole=box[3];band=support.crop((0,sole-8,768,sole)).getbbox();assert band
        far_pivot=((band[0]+band[2])/2,sole);target=(control['registeredFootBearingPivotX'],control['registeredSoleY'])
        affine=(1/density,0,far_pivot[0]-target[0]/density,0,1/density,far_pivot[1]-target[1]/density)
        far=part.convert('RGBa').transform((512,512),Image.Transform.AFFINE,affine,Image.Resampling.BICUBIC).convert('RGBA')
        masks=semantic_masks(control,direction);base_near=selected(original,masks['near']);near=base_near.copy();fixed=selected(original,masks['fixed'])
        oa=np.asarray(original);before=np.asarray(base_near);inserted=0
        if direction=='right':
            a=np.asarray(cloth);yy,xx=np.indices((512,512));h=control['hiddenCloth']
            allowed=(before[:,:,3]==0)&(np.asarray(masks['fixed'])>0)&(oa[:,:,3]>=h['originalOccluderMinimumAlpha'])&(yy>=h['firstY'])&(yy<=h['lastYInclusive'])
            assert int(allowed.sum())==h['insertedPixelCount']==1008
            assert np.all(a[:,:,3][allowed]>=200)
            new=before.copy();new[allowed]=a[allowed];changed=np.any(new!=before,axis=2)
            assert np.array_equal(changed,allowed) and not np.any(changed&(before[:,:,3]>0))
            assert np.array_equal(new[~allowed],before[~allowed]) and np.array_equal(new[410:],before[410:])
            backing=np.zeros_like(before);backing[allowed]=a[allowed];near=Image.fromarray(new);inserted=int(allowed.sum())
            emit('right-hidden-cloth-backing.png',Image.fromarray(backing));emit('right-hidden-cloth-allowed.png',Image.fromarray(allowed.astype(np.uint8)*255))
            emit('right-cloth-registered-context-only.png',cloth)
            for sample in control['semanticForearmOriginalRgba']:
                x,y=sample['xy'];assert list(original.getpixel((x,y)))==sample['rgba']
            for x,y in control['actualLowerKeyTipWitnesses']:
                assert original.getpixel((x,y))[3]>=200 and base_near.getpixel((x,y))[3]==0
        assembled=Image.alpha_composite(far,near);assembled.paste(original,(0,0),masks['fixed'])
        base_assembled=Image.alpha_composite(far,base_near);base_assembled.paste(original,(0,0),masks['fixed'])
        assert assembled.tobytes()==base_assembled.tobytes(),'Hidden cloth changed neutral visibleRGBA'
        assert near.crop((0,410,512,512)).tobytes()==original.crop((0,410,512,512)).tobytes()
        assert np.array_equal(np.asarray(assembled)[np.asarray(masks['fixed'])>0],oa[np.asarray(masks['fixed'])>0])
        roles={'far-complete':far,'near-original':near,'fixed-foreground':fixed,'fixed-hand-keys':selected(original,masks['handKeys']),'fixed-hand-shadow':selected(original,masks['shadow']),'fixed-keys':selected(original,masks['keys']),'assembled-neutral':assembled}
        outputs={name:emit(direction+'-'+name+'.png',image) for name,image in roles.items()}
        registered_entry=emit(direction+'-source-registered.png',original);emit(direction+'-near-before-backing.png',base_near);emit(direction+'-fixed-semantic-mask.png',masks['fixed'])
        records[direction]={'original':registered_entry,'layers':outputs,'registeredFromRaw':registrations[direction],'farRawPivot':list(far_pivot),'farAffineOutputToRaw':list(affine),'insertedHiddenClothPixels':inserted,'fixedOriginalRgbaExact':True,'neutralBeforeAfterBackingExact':True,'originalSupportedNearRetained':True}
    for p,h in inputs.items():assert sha(HERE/p)==h
    receipt={'status':'GENERATED_FROM_OWN_RAW_ONLY; expected pilot products not read','actor':control['actor'],'controls':control_path.name,'controlsSha256':sha(control_path),'inputPins':inputs,'farDensity':density,'measurements':measurements,'clothRegistration':{'uniformDensity':cloth_density,'translation':[tx,ty],'affineOutputToRaw':list(cloth_affine)},'directions':records,'outputs':all_outputs,'expectedProductsRead':False,'generationDependencyScope':'Three owned raw PNGs, semantic controls and this source recipe only; no ignored overlay, registered cache, oldparts or validation baseline.'}
    (out/'parts-manifest.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'status':receipt['status'],'output':out.relative_to(HERE).as_posix(),'parts':len(all_outputs),'farDensity':density,'rightInserted':1008,'manifestSha256':sha(out/'parts-manifest.json')}))
    return receipt

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path);a=p.parse_args();run(a.output)
