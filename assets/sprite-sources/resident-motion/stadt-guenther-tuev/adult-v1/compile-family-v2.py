"""Bounded per-tier wrapper around the existing shared native exporter/packer.

Only ignored mirror paths are writable. Source2.33/13.3975 is not selected
production2.77; root's fitter performs that proportional metadata handoff later.
"""
from pathlib import Path
from copy import deepcopy
import argparse,hashlib,importlib.util,json,sys
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/guenther-end-to-end/layered-v2/build'
STAGE=WORK
MIRROR=STAGE/'private-mirror';ID='stadt-guenther-tuev';BASE='./assets/characters/residents/'+ID+'/delivery-v2/'
OUT=MIRROR/BASE.removeprefix('./');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
    spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def write(p,v):
    p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,separators=(',',':'),allow_nan=False)+'\n')
def pins():
    return load('g_v2_actual_source_inputs',HERE/'build-family-source-v2.py').pins()
def configure(workdir):
    global STAGE,WORK,MIRROR,OUT
    workdir=workdir.resolve();assert workdir.is_relative_to(ROOT/'output')
    STAGE=WORK=workdir;MIRROR=workdir/'private-mirror';OUT=MIRROR/BASE.removeprefix('./')

def run(section):
    frozen=pins();body_path=STAGE/'body-index.json';body=json.loads(body_path.read_text())
    # Pure generation: comparative validation is deferred until alloutputs.
    assert body['selectedCells']==412
    for name,digest in body['inputPins'].items():assert sha(ROOT/name)==digest
    OUT.mkdir(parents=True,exist_ok=True)
    if section in('desktop','mobile'):
        from PIL import Image
        street=load('g_shared_native_exporter',ROOT/'tools/build-street-character-sprites.py')
        w,h=(96,120)if section=='desktop'else(64,80);q=w/128
        target=OUT/f'source-{section}.webp';assert not target.exists(),'Preserve prior native tier'
        sheet=Image.new('RGBA',(21*w,20*h));gutters=[]
        for cell in body['cells']:
            path=ROOT/cell['source']['file'];assert sha(path)==cell['source']['sha256']
            with Image.open(path)as source:
                im=street.export_cell(source.convert('RGBA'),{'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}})
            b=im.getchannel('A').getbbox();assert b
            gutters.append(min(b[0],b[1],w-b[2],h-b[3]));sheet.paste(im,(cell['col']*w,cell['row']*h))
        assert min(gutters)>=2
        sheet.save(target,lossless=True,exact=True,method=4)
        with Image.open(target)as decoded:assert decoded.convert('RGBA').tobytes()==sheet.tobytes()
        pins();write(STAGE/f'native-{section}-receipt.json',{'status':'PRIVATE NATIVE ONLY','section':section,'selectedCells':412,'minimumGutter':min(gutters),'decodedExact':True,'sourceBodyIndexSha256':sha(body_path),'variant':{'file':BASE+target.name,'sha256':sha(target),'width':sheet.width,'height':sheet.height},'privatePath':target.relative_to(ROOT).as_posix(),'bytes':target.stat().st_size})
        print(json.dumps({'tier':section,'selectedCells':412,'minimumGutter':min(gutters),'decodedExact':True,'bytes':target.stat().st_size}));return
    if section=='packet':
        assert (OUT/'person.json').exists()
        tool=load('g_existing_delivery_packer',ROOT/'tools/build-street-motion-delivery.py')
        manifest=MIRROR/'assets/characters/street/manifest.json';outdir=OUT/'delivery'
        assert not outdir.exists(),'Preserve previous packet attempt'
        record=tool.run(manifest,ID,outdir,root=MIRROR)
        person=json.loads((OUT/'person.json').read_text());person['motionDelivery']={'file':BASE+'delivery/motion-delivery.json','sha256':sha(outdir/'motion-delivery.json')}
        write(OUT/'person.json',person);write(manifest,{'schemaVersion':1,'characters':{ID:person}})
        pins();print(json.dumps({'status':'PRIVATE PACKET ONLY','id':ID,'sourceHeight':2.33,'sourceStride':13.3975,'packetSha256':person['motionDelivery']['sha256'],'packs':{k:v['grid']for k,v in record['packs'].items()}}));return
    assert section=='metadata'
    from PIL import Image
    variants={name:json.loads((STAGE/f'native-{name}-receipt.json').read_text())['variant']for name in('desktop','mobile')}
    for v in variants.values():assert sha(MIRROR/v['file'].removeprefix('./'))==v['sha256']
    source_standing=WORK/'adult-mouth-fit/standing-candidate.png'
    with Image.open(source_standing)as im:
        standing=im.convert('RGBA');assert standing.size==(128,160);standing.save(OUT/'standing.webp',lossless=True,exact=True,method=4)
        with Image.open(OUT/'standing.webp')as decoded:assert decoded.convert('RGBA').tobytes()==standing.tobytes()
    standing_meta={'file':BASE+'standing.webp','sha256':sha(OUT/'standing.webp'),'width':128,'height':160}
    mouth_path=WORK/'family-mouths/mouths-working.json';mouth=json.loads(mouth_path.read_text());assert mouth['identity']==ID and mouth['selectedCells']==412 and not mouth['missingFits']
    write(OUT/'mouths-v1.json',{'schemaVersion':1,'id':ID,'cell':[128,160],'grid':[21,20],'sources':{'standing':standing_meta['sha256'],**{n:v['sha256']for n,v in variants.items()}},'standing':mouth['standing'],'frames':mouth['frames']})
    family=load('g_existing_layout_metadata',HERE/'build-family-source.py');street=load('g_existing_transition_metadata',ROOT/'tools/build-street-character-sprites.py');movement,gestures,stops=family.layout()
    order=('down','right','up','left');walks={d:{'row':i,'frames':16,'frame_ms':60,'loop':True}for i,d in enumerate(order)};bridges={d:{'row':i+4,'stop_cols':[0,1,2],'start_cols':[3,4],'frame_ms':70}for i,d in enumerate(order)}
    turns=[{'row':8,'col':i}for i in range(8)];anchors={d:i*2 for i,d in enumerate(order)}
    transitions={a+'-to-'+b:{'frames':street.paint.plan_transition(a,b,walks,bridges,turns,anchors,turn_ms=85)}for a in order for b in order if a!=b}
    settles={d:{str(phase):{'frames':[{'row':r,'col':c,'ms':70}for r,c in stops[(i*16+phase)*4:(i*16+phase+1)*4]]+[{'row':i+4,'col':2,'ms':70}]}for phase in range(16)}for i,d in enumerate(order)}
    legacy=json.loads((HERE/'pre-admission-family.json').read_text())['interactions']['states'];assert set(legacy)==set(family.ACTION_NAMES)
    states={name:{'row':16+i,'col':0,'durations_ms':deepcopy(old['durations_ms']),**{k:deepcopy(old[k])for k in('loop','next')if k in old}}for i,name in enumerate(family.ACTION_NAMES)for old in[legacy[name]]};states['wait']=deepcopy(states['idle'])
    original=json.loads((HERE/'pre-admission-person.json').read_text());assert original['id']==ID
    person={k:deepcopy(original[k])for k in('id','aliases','cell','pivot','figureHeight')}
    person.update(figureWorldHeight=2.33,standing=standing_meta,standingOnly=False,grid=[21,20],strideDistance=13.3975,variants=variants,clips={d:{'offset':i*21,'count':16,'seconds':.96}for i,d in enumerate(order)},atlasMotion={'schemaVersion':1,'walks':walks,'bridges':bridges,'transitions':transitions,'settles':settles,'neutral':{'row':4,'col':2},'interactions':{'neutral':{'row':4,'col':2},'states':states}},mouthPaint={'file':BASE+'mouths-v1.json','sha256':sha(OUT/'mouths-v1.json')})
    person['clips']['idle']={'offset':4*21+2,'count':1,'seconds':1};assert not(OUT/'person.json').exists(),'Preserve prior metadata'
    write(OUT/'person.json',person);write(MIRROR/'assets/characters/street/manifest.json',{'schemaVersion':1,'characters':{ID:person}})
    pins();write(STAGE/'private-metadata-receipt.json',{'status':'PRIVATE SOURCE2.33 metadata only; native/world review and root selected2.77 fit pending','sourceStrideDerivation':'46 own source pixels /400 workingfigure ×2.33 worldfigure /.02 worldpergamepixel =13.3975','sourceHeight':2.33,'sourceStride':13.3975,'bodyIndexSha256':sha(body_path),'existingOwnMouthWorkingSha256':sha(mouth_path),'mouthFitSupport':'Own raw fit/transport regenerated; expected-output validation is separate','outputs':{n:sha(OUT/n)for n in('standing.webp','mouths-v1.json','person.json')}})
    print(json.dumps({'status':'PRIVATE SOURCE METADATA ONLY','sourceHeight':2.33,'sourceStride':13.3975,'productionWrites':False}))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--section',choices=('desktop','mobile','metadata','packet'),required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args();configure(a.workdir);run(a.section)
