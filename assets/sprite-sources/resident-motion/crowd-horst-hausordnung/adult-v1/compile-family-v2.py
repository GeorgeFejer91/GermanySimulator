"""Bounded Horst native/metadata packing with the admitted own affine sampler."""
from pathlib import Path
from copy import deepcopy
import argparse,hashlib,importlib.util,json
import numpy as np
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4];ID='crowd-horst-hausordnung'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def write(path,data):
    assert not path.exists(),('Preserve old compiled product',path)
    path.write_text(json.dumps(data,separators=(',',':'),allow_nan=False)+'\n')

def native_gutter(image):
    alpha = np.asarray(image)[:, :, 3]
    height, width = alpha.shape
    bounds_alpha1 = image.getchannel('A').getbbox()
    bounds_alpha21 = Image.fromarray((alpha >= 21).astype('uint8') * 255).getbbox()
    assert bounds_alpha21, 'Actual alpha21 body support required'
    gutter = min(bounds_alpha21[0], bounds_alpha21[1], width - bounds_alpha21[2], height - bounds_alpha21[3])
    border = np.concatenate([alpha[:2, :].ravel(), alpha[-2:, :].ravel(), alpha[:, :2].ravel(), alpha[:, -2:].ravel()])
    outer_maximum = int(border.max())
    assert gutter >= 2, ('Actual alpha21 gutter', bounds_alpha21, gutter)
    assert outer_maximum <= 20, ('Actual outer2 alpha maximum', outer_maximum)
    return {'boundsAlpha1': list(bounds_alpha1), 'boundsAlpha21': list(bounds_alpha21), 'effectiveGutter21': gutter, 'outer2AlphaMaximum': outer_maximum, 'pixelsUnaltered': True, 'alphaTestUnchanged': .08}

def run(a):
    source=a.source.resolve();out=a.output.resolve();assert source.is_relative_to(ROOT/'output/horst-height/full-family-v1')and out.is_relative_to(ROOT/'output/horst-height/full-family-v1')
    body_path=source/'body-index.json';mouth_path=source/'family-mouths-v3/mouths-working.json';body=json.loads(body_path.read_text());mouth=json.loads(mouth_path.read_text())
    assert body['identity']==mouth['identity']==ID and body['selectedCells']==412 and body['sourceFiles']==348 and mouth['visible']==324
    assert body['authoredHeight']==2.33 and body['authoredStride']==13.6305 and not mouth['missingFits']
    old=json.loads((HERE/'pre-admission-person-v1.json').read_text());capability=json.loads((HERE/'capability-plan-v1.json').read_text());assert old['id']==capability['id']==ID
    assert old['cell']==[128,160]and old['pivot']==[64,150]and old['figureHeight']==136
    inputs={p.relative_to(ROOT).as_posix():sha(p)for p in [Path(__file__),HERE/'pre-admission-person-v1.json',HERE/'capability-plan-v1.json',HERE/'profile-motion-v2.py',HERE/'profile-motion-controls-v2.json',body_path,mouth_path]}
    for doc in[body,mouth]:
        for p,h in doc['inputPins'].items():assert sha(ROOT/p)==h,p;inputs[p]=h
    cells={(c['row'],c['col']):c for c in body['cells']};assert len(cells)==412
    for c in cells.values():assert sha(ROOT/c['source']['file'])==c['source']['sha256']
    profile=load('horst_admitted_native_affine',HERE/'profile-motion-v2.py');router=load('horst_canonical_native_layout',HERE/'family-body-v1.py');out.mkdir(parents=True,exist_ok=True);base='./assets/characters/residents/'+ID+'/delivery-v2/'
    if a.stage in('desktop','mobile'):
        target=profile.sources('right')['controls']['nativeTargets'][a.stage];w,h=target['cell'];sheet=Image.new('RGBA',(21*w,20*h));checks=[]
        path=out/f'source-{a.stage}.webp';assert not path.exists()
        for(row,col),cell in cells.items():
            image=Image.open(ROOT/cell['source']['file']).convert('RGBA');native=profile.export_native(image,a.stage)
            alpha=np.asarray(native)[:,:,3];gutter_check=native_gutter(native);bounds=native.getchannel('A').getbbox()
            checks.append({'slot':row*21+col,'row':row,'col':col,'source':cell['source'],'rawRgbaSha256':hashlib.sha256(native.tobytes()).hexdigest(),'boundsAlpha1':list(bounds),'boundsAlpha21':Image.fromarray((alpha>=21).astype('uint8')*255).getbbox(),'gutterGuard':gutter_check});sheet.paste(native,(col*w,row*h));image.close();native.close()
        sheet.save(path,lossless=True,exact=True,method=4)
        assert Image.open(path).convert('RGBA').tobytes()==sheet.tobytes(),'Actual WebP decoded body atlas everyRGBA exact'
        write(out/f'native-{a.stage}-receipt.json',{'stage':a.stage,'sourcePins':inputs,'nativeTarget':target,'sampler':'Exact existing own profile-motion-v2.export_native premultRGBa/PillowBICUBIC affine; common400source/256472pivot','samplerFile':(HERE/'profile-motion-v2.py').relative_to(ROOT).as_posix(),'samplerSha256':sha(HERE/'profile-motion-v2.py'),'selectedCells':412,'decodedExact':True,'variant':{'file':base+path.name,'sha256':sha(path),'width':sheet.width,'height':sheet.height},'cells':checks});print(json.dumps({'stage':a.stage,'selectedCells':412,'bytes':path.stat().st_size,'sha256':sha(path),'decodedExact':True}));return
    if a.stage=='standing':
        cell=cells[8,0];image=Image.open(ROOT/cell['source']['file']).convert('RGBA');s=136/400
        # Same admitted fixed-affine sampler, logical128 target only. No new
        # fit, halftexel adjustment, colour transform or sharpening.
        standing=image.convert('RGBa').transform((128,160),Image.Transform.AFFINE,(1/s,0,256-64/s,0,1/s,472-150/s),Image.Resampling.BICUBIC).convert('RGBA')
        gutter_check=native_gutter(standing)
        path=out/'standing.webp';assert not path.exists();standing.save(path,lossless=True,exact=True,method=4);assert Image.open(path).convert('RGBA').tobytes()==standing.tobytes()
        write(out/'standing-receipt.json',{'stage':'standing','sourcePins':inputs,'source':cell['source'],'sameAdmittedAffineSampler':True,'gutterGuard':gutter_check,'metadata':{'file':base+'standing.webp','sha256':sha(path),'width':128,'height':160},'rawRgbaSha256':hashlib.sha256(standing.tobytes()).hexdigest()});print(json.dumps({'stage':'standing','bytes':path.stat().st_size,'sha256':sha(path)}));return
    assert a.stage=='metadata';native={v:json.loads((out/f'native-{v}-receipt.json').read_text())for v in['desktop','mobile']};stand=json.loads((out/'standing-receipt.json').read_text());assert all(r['sourcePins']==inputs for r in[*native.values(),stand])
    variants={v:r['variant']for v,r in native.items()};standing=stand['metadata'];mouths={'schemaVersion':1,'id':ID,'cell':[128,160],'grid':[21,20],'sources':{'standing':standing['sha256'],**{v:r['sha256']for v,r in variants.items()}},'standing':mouth['standing'],'frames':mouth['frames']};write(out/'mouths-v1.json',mouths)
    walks={d:{'row':i,'frames':16,'frame_ms':60,'loop':True}for i,d in enumerate(router.ORDER)};bridges={d:{'row':i+4,'stop_cols':[0,1,2],'start_cols':[3,4],'frame_ms':70}for i,d in enumerate(router.ORDER)};turns=[{'row':8,'col':i}for i in range(8)];anchors={d:i*2 for i,d in enumerate(router.ORDER)}
    transitions={a+'-to-'+b:{'frames':profile.paint.plan_transition(a,b,walks,bridges,turns,anchors,turn_ms=85)}for a in router.ORDER for b in router.ORDER if a!=b};_,_,stops=router.layout()
    settles={d:{str(phase):{'frames':[{'row':r,'col':c,'ms':70}for r,c in stops[(i*16+phase)*4:(i*16+phase+1)*4]]+[{'row':i+4,'col':2,'ms':70}]}for phase in range(16)}for i,d in enumerate(router.ORDER)}
    assert set(capability['states'])==set(router.ACTIONS)
    states={name:{'row':16+i,'col':0,'durations_ms':deepcopy(capability['states'][name]['durations_ms'])}for i,name in enumerate(router.ACTIONS)};states['wait']=deepcopy(states['idle'])
    person={k:deepcopy(old[k])for k in['id','aliases','cell','pivot','figureHeight']};person.update(figureWorldHeight=2.33,strideDistance=13.6305,standing=standing,standingOnly=False,grid=[21,20],variants=variants,clips={d:{'offset':i*21,'count':16,'seconds':.96}for i,d in enumerate(router.ORDER)},atlasMotion={'schemaVersion':1,'walks':walks,'bridges':bridges,'transitions':transitions,'settles':settles,'neutral':{'row':4,'col':2},'interactions':{'neutral':{'row':4,'col':2},'states':states}},mouthPaint={'file':base+'mouths-v1.json','sha256':sha(out/'mouths-v1.json')});person['clips']['idle']={'offset':4*21+2,'count':1,'seconds':1};write(out/'person.json',person)
    for p,h in inputs.items():assert sha(ROOT/p)==h,p
    write(out/'compile-receipt.json',{'status':'PRIVATE AUTHORED NATIVE/METADATA; owner/formal/raw/worldreview separate','id':ID,'authoredHeight':2.33,'authoredStride':13.6305,'sourcePins':inputs,'nativeBodyCells':824,'visibleMouthPairsStillToReview':648,'samplerAuthority':'Existing admitted Horst PillowBICUBIC fixed affine','outputs':{n:sha(out/n)for n in['standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json','person.json']}});print(json.dumps({'stage':'metadata','id':ID,'height':2.33,'stride':13.6305,'nativeBodyCells':824,'visibleFrameRegistrations':sum(f is not None for f in mouths['frames'])}))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--stage',choices=['desktop','mobile','standing','metadata'],required=True);run(parser.parse_args())
