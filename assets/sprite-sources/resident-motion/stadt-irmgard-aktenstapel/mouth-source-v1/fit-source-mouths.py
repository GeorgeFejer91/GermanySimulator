"""Irmgard's own neutral lip fits; source and CPU previews only."""

from pathlib import Path
import copy
import hashlib
import importlib.util
import json

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
OUT = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-mouth-source-v1'
SHEET = HERE / 'registered-neutrals-v1.png'
ASSEMBLY = HERE / 'registered-neutrals-v1.json'
STANDING = ROOT / 'assets/characters/street/stadt-irmgard-aktenstapel-standing.webp'
HELPER = ROOT / 'tools/build-street-mouths.py'
EXPORTER = ROOT / 'tools/build-street-character-sprites.py'
WALK_RECEIPT = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-walk-source-v1/walk-source.json'
ORDER = ('down', 'front-right', 'right', 'rear-right', 'up', 'rear-left', 'left', 'front-left')
SHEET_SHA = '63084b2c8767bec35df5c97599b1365b0b57f58674ffb884959d45c9cf88b81f'
ASSEMBLY_SHA = 'bb62ccadb4298a21b56f5e77f4248af40e9779b5b18094d5ae533d4f97aba00c'
STANDING_SHA = '3d330a4d8130ab382545596381fda6fbf016929a15fdf17f8703fee23777bc2e'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


# Manually measured on the actual 512 source pixels, except standing, which is
# independently measured on the published 128x160 WebP. Every source is closed:
# the red upper-lip ridge and darker crease contain no painted cavity or teeth.
# Each five-point line meets the same endpoints in all five contour fields.
FITS = {
    'down': {
        'crease': [[244,196.5],[254,195.7],[264,195.4],[274,195.7],[284,196.5]],
        'center': [264,195.8], 'axes': [40,0,0,7],
        'upper': [0,-0.6,-0.8,-0.6,0], 'lower': [0,2.5,3.8,2.5,0],
        'observation': 'Front mouth red ridge above a closed dark crease; attached downturn at both corners.'},
    'front-right': {
        'crease': [[257.5,196.3],[265.5,195.5],[274,195],[282.5,195.3],[291,196.2]],
        'center': [274,195.6], 'axes': [34,-0.4,0,7],
        'upper': [0,-0.5,-0.7,-0.5,0], 'lower': [0,2.2,3.3,2.2,0],
        'observation': 'Three-quarter closed crease under the nose; no separate cavity or teeth.'},
    'right': {
        'crease': [[303.5,192.4],[308,191.8],[312,191.3],[316.5,190.8],[320.5,190.1]],
        'center': [312,191.4], 'axes': [17,-2.3,0,5.5],
        'upper': [0,-0.3,-0.5,-0.4,0], 'lower': [0,1.8,3.0,2.0,0],
        'observation': 'Profile crease ends before the actual facial silhouette; restrained side opening.'},
    'left': {
        'crease': [[198,190.1],[202,190.5],[206,191.1],[210,191.8],[214,192.5]],
        'center': [206,191.2], 'axes': [16,2.4,0,5.5],
        'upper': [0,-0.4,-0.5,-0.3,0], 'lower': [0,2.0,3.0,1.8,0],
        'observation': 'Mirrored facing uses its own asymmetric painted cheek and lip, not a flipped right fit.'},
    'front-left': {
        'crease': [[211,198.8],[216.5,198.4],[222.5,198.1],[229,198.6],[236,199.4]],
        'center': [223,198.5], 'axes': [25,0.6,0,6.5],
        'upper': [0,-0.4,-0.6,-0.4,0], 'lower': [0,1.9,3.0,2.0,0],
        'observation': 'Own front-left downturn and cheek; no visible pre-open cavity or teeth.'},
    'standing': {
        'crease': [[63.5,56],[66.5,55.6],[70,55.4],[73,55.6],[76,56]],
        'center': [70,55.6], 'axes': [12.5,0,0,2.3],
        'upper': [0,-0.15,-0.2,-0.15,0], 'lower': [0,0.9,1.5,0.9,0],
        'observation': 'Direct published 128x160 standing lip pixels; red closed line, no visible teeth.'},
}


def registration(name):
    fit = FITS[name]
    standing = name == 'standing'
    index = 0 if standing else ORDER.index(name)
    origin = np.array([0,0] if standing else [(index % 4)*512,(index//4)*512], float)
    points = np.asarray(fit['crease'],float)
    upper = points + np.array([[0, delta] for delta in fit['upper']])
    lower = points + np.array([[0, delta] for delta in fit['lower']])
    global_points = lambda p:(np.asarray(p)+origin).round(6).tolist()
    path = STANDING if standing else SHEET
    dims = [128,160] if standing else [2048,1024]
    return {'input': {'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':dims},
            'centerPx':global_points(fit['center']),'axesPx':fit['axes'],
            'cell':dims if standing else [512,512], 'cellOriginPx':origin.astype(int).tolist(),
            'coordinateSystem':'Own native source pixels, +X right, +Y down',
            'contoursPx':{key:global_points(value) for key,value in {
                'crease':points, 'source_upper':points, 'source_lower':points,
                'open_upper':upper, 'open_lower':lower}.items()},
            'width':[.012,.10] if name in ('right','left') else [.02,.13],
            'teeth':0,
            'fitEvidence':{'status':'Manually inspected own painted lip; CPU source candidate',
                           'observation':fit['observation']}}


def local_entry(entry):
    local = copy.deepcopy(entry)
    x,y = entry['cellOriginPx'];w,h=entry['cell']
    local['centerPx']=(np.asarray(entry['centerPx'])-[x,y]).tolist()
    local['contoursPx']={name:(np.asarray(points)-[x,y]).tolist()
                          for name,points in entry['contoursPx'].items()}
    local['previewCropPx']=[x,y,x+w,y+h]
    return local


def run():
    OUT.mkdir(parents=True,exist_ok=True)
    if sha(SHEET)!=SHEET_SHA or sha(ASSEMBLY)!=ASSEMBLY_SHA or sha(STANDING)!=STANDING_SHA:
        raise ValueError('Irmgard neutral sheet or published standing changed')
    assembly=json.loads(ASSEMBLY.read_text(encoding='utf8'))
    for index,name in enumerate(ORDER):
        record=assembly['inputs'][name]
        if record['cellOriginPx']!=[(index%4)*512,(index//4)*512] or sha(ROOT/record['file'])!=record['sha256']:
            raise ValueError('Changed own registered neutral: '+name)
        x,y=record['cellOriginPx']
        with Image.open(SHEET) as sheet, Image.open(ROOT/record['file']) as own:
            if sheet.crop((x,y,x+512,y+512)).tobytes()!=own.convert('RGBA').tobytes():
                raise ValueError('Irmgard sheet differs from own source pixels: '+name)
    spec=importlib.util.spec_from_file_location('irmgard_connected_lips',HELPER)
    helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
    export_spec=importlib.util.spec_from_file_location('irmgard_existing_cell_exporter',EXPORTER)
    exporter=importlib.util.module_from_spec(export_spec);export_spec.loader.exec_module(exporter)
    walk=json.loads(WALK_RECEIPT.read_text(encoding='utf8'))
    atlas_path=WALK_RECEIPT.parent/walk['variants']['mobile']['file']
    if sha(atlas_path)!=walk['variants']['mobile']['sha256']:
        raise ValueError('Irmgard native-size source atlas changed')
    mobile_atlas=Image.open(atlas_path).convert('RGBA')
    regs={name:registration(name) if name in FITS else None for name in ORDER}
    compiled={};checks={};physical_checks={}
    font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',12)
    for name in (*ORDER,'standing'):
        entry=registration(name) if name=='standing' else regs[name]
        if entry is None:
            compiled[name]=None
            continue
        native=helper.compile_registration(entry)
        compiled[name]={key:native[key] for key in ('rect','axes','profile')}
        local=local_entry(entry)
        x,y=entry['cellOriginPx'];w,h=entry['cell']
        original=Image.open(ROOT/entry['input']['file']).convert('RGBA').crop((x,y,x+w,y+h))
        cues={'inactive':original,'owned-closed':helper.preview(local,native,0),
              'max-open':helper.preview(local,native,1)}
        for label,factor in (('round-approx',.55),('bite-approx',.18)):
            variant=copy.deepcopy(native)
            profile=variant['profile']
            profile['open_lower']=[c+(v-c)*factor for c,v in zip(profile['crease'],profile['open_lower'])]
            cues[label]=helper.preview(local,variant,1)
        reference=np.asarray(original)
        checks[name]={}
        for label,image in cues.items():
            pixels=np.asarray(image)
            alpha_exact=bool(np.array_equal(pixels[:,:,3],reference[:,:,3]))
            changes=int(np.count_nonzero(np.any(pixels[:,:,:3]!=reference[:,:,:3],axis=2)))
            if not alpha_exact or (changes==0)!=(label in ('inactive','owned-closed')):
                raise ValueError(f'Irmgard cue changed alpha or source closure: {name}/{label}, {changes}')
            checks[name][label]={'alphaExact':alpha_exact,'changedRgbPixels':changes}
            image.save(OUT/f'{name}-{label}.png')
        mobile={}
        for label,image in cues.items():
            if name=='standing':
                # Diagnostic display size only. Published standing is 128x160,
                # separate from the 512 working-source cell exporter.
                sample=image.resize((64,80),Image.Resampling.LANCZOS)
            else:
                sample=exporter.export_cell(image,{'cell':[64,80],'figureHeight':68,
                    'pivot':[32,75],'working':{'figureHeight':400,'baseline':472}})
            mobile[label]=sample
            sample.save(OUT/f'{name}-{label}-mobile64-diagnostic.png')
        if name!='standing':
            x=ORDER.index(name)*64;y=8*80
            if mobile['inactive'].tobytes()!=mobile_atlas.crop((x,y,x+64,y+80)).tobytes():
                raise ValueError('Mobile neutral pixels differ from exact reviewed atlas: '+name)
        baseline=np.asarray(mobile['inactive'])
        physical_checks[name]={label:{'changedRgbPixels':int(np.count_nonzero(np.any(
            np.asarray(image)[:,:,:3]!=baseline[:,:,:3],axis=2))),
            'alphaExact':bool(np.array_equal(np.asarray(image)[:,:,3],baseline[:,:,3]))}
            for label,image in mobile.items()}
        mobile_cx,mobile_cy=(np.asarray(local['centerPx'])*.5 if name=='standing'
            else np.array([32+(local['centerPx'][0]-256)*.17,75+(local['centerPx'][1]-472)*.17]))
        mobile_crop=(max(0,int(mobile_cx)-12),max(0,int(mobile_cy)-7),
                     min(64,int(mobile_cx)+13),min(80,int(mobile_cy)+8))
        mw,mh=(mobile_crop[2]-mobile_crop[0])*10,(mobile_crop[3]-mobile_crop[1])*10
        for theme,color in (('light','#eee8db'),('dark','#25272b')):
            board=Image.new('RGB',(mw*len(mobile),mh+28),color)
            pen=ImageDraw.Draw(board)
            for index,(label,image) in enumerate(mobile.items()):
                region=image.crop(mobile_crop).resize((mw,mh),Image.Resampling.NEAREST)
                board.paste(region,(index*mw,28),region)
                pen.text((index*mw+3,5),label,font=font,
                         fill='#eee8db' if theme=='dark' else '#222222')
            board.save(OUT/f'{name}-mobile64-all-cues-{theme}.png')
        cx,cy=local['centerPx']
        radius=10 if name=='standing' else (20 if name in ('right','left') else 28)
        crop=(max(0,int(cx)-radius),max(0,int(cy)-radius//2),
              min(w,int(cx)+radius+1),min(h,int(cy)+radius//2+2))
        zoom=18 if name=='standing' else 9
        cw,ch=(crop[2]-crop[0])*zoom,(crop[3]-crop[1])*zoom
        for theme,color in (('light','#eee8db'),('dark','#25272b')):
            board=Image.new('RGB',(cw*len(cues),ch+28),color)
            pen=ImageDraw.Draw(board)
            for index,(label,image) in enumerate(cues.items()):
                region=image.crop(crop).resize((cw,ch),Image.Resampling.NEAREST)
                board.paste(region,(index*cw,28),region)
                pen.text((index*cw+3,5),label,font=font,
                         fill='#eee8db' if theme=='dark' else '#222222')
            board.save(OUT/f'{name}-all-cues-{theme}.png')
    inputs={path.relative_to(ROOT).as_posix():sha(path)
            for path in (SHEET,ASSEMBLY,STANDING,HELPER,EXPORTER,WALK_RECEIPT,atlas_path,Path(__file__))}
    for record in assembly['inputs'].values():
        inputs[record['file']]=record['sha256']
    if any(sha(ROOT/name)!=digest for name,digest in inputs.items()):
        raise ValueError('Irmgard lip source changed during preview')
    result={'schemaVersion':1,'status':'Own neutral source lip candidate; CPU only, independent review pending',
            'inputHashes':inputs,'registrations':regs,'standingRegistration':registration('standing'),
            'compiledSourceCells':{name:compiled[name] for name in ORDER},
            'compiledStanding':compiled['standing'],'cpuChecks':checks,
            'physicalPreviewChecks':physical_checks,
            'nullReasons':{name:'Rear or rear-quarter source has no visible mouth'
                           for name in ('rear-right','up','rear-left')},
            'limits':['Original mouths are closed creases without a visible source cavity or teeth; owned closure preserves the painted line.',
                      'Round and bite CPU previews approximate lower-aperture changes; width and contact shader cues remain unrun.',
                      'Mobile64 preview resamples 512 source with the existing exporter; standing64 is diagnostic LANCZOS from published 128. Neither is a GPU speech pass.',
                      'Working 512 fits and direct standing WebP are not transported through gait, GPU or media.']}
    target=HERE/'source-mouth-profiles-v1.json'
    target.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8',newline='\n')
    print(json.dumps({'profiles':len(FITS),'rearNulls':3,'profileSha256':sha(target),
                      'changedOpen':{name:checks[name]['max-open']['changedRgbPixels'] for name in checks}}))


if __name__=='__main__':
    run()
