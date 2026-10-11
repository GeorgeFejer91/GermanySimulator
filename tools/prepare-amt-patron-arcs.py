"""Register generated patron bridge sheets beside the original native work paint.

Only crop, alpha cleanup and uniform registration happen here. Painted poses
are imagegen-authored; this tool does not warp or manufacture intermediate art.
"""
from pathlib import Path
import argparse, hashlib, json, shutil
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/sprite-sources/buergeramt/gaussian-arcs'
KEYS=('eye_right','eye_left','nose','chin','shoulder_right','elbow_right','grip_right','stamp_knob','stamp_base','shoulder_left','elbow_left','hand_left','hip_center','skirt_hem_center','foot_screen_left','foot_screen_right')

def prepare(name,sheet):
    dest=SOURCE/name;dest.mkdir(parents=True,exist_ok=True)
    master=dest/'bridge-sheet.png';shutil.copyfile(sheet,master)
    source=ROOT/f'assets/buergeramt/characters/{name}-detail.webp'
    work=Image.open(source).convert('RGBA');assert work.size==(384,832)
    generated=Image.open(master).convert('RGBA');assert generated.width%3==0
    bounds=work.getbbox();assert bounds
    def visible_bounds(image):
        return Image.fromarray((np.asarray(image)[:,:,3]>12).astype('uint8')*255).getbbox()
    first=visible_bounds(generated.crop((0,0,generated.width//3,generated.height)));assert first
    scale=(bounds[3]-bounds[1])/(first[3]-first[1])
    left=round((bounds[0]+bounds[2])/2-(first[0]+first[2])/2*scale)
    def foot_center(image):
        alpha=np.asarray(image)[:,:,3].astype(float)
        alpha[:bounds[3]-60]=0
        return (alpha.sum(axis=0)*np.arange(image.width)).sum()/alpha.sum()
    planted_x=foot_center(work)
    frames=[work]
    for column in range(3):
        crop=generated.crop((column*generated.width//3,0,(column+1)*generated.width//3,generated.height))
        box=visible_bounds(crop);assert box
        # One scale across the sequence: a raised hand must never shrink a body.
        crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.LANCZOS)
        frame=Image.new('RGBA',work.size)
        frame.alpha_composite(crop,(left,round(bounds[3]-box[3]*scale)))
        rgba=np.array(frame);rgba[rgba[:,:,3]<6]=0
        frame=Image.fromarray(rgba)
        if name in ('parent','pensioner'):
            # Register the feet, not a silhouette whose width changes with a hand.
            aligned=Image.new('RGBA',work.size)
            aligned.alpha_composite(frame,(round(planted_x-foot_center(frame)),0))
            frame=aligned
        frames.append(frame)
    states=[]
    for index,frame in enumerate(frames):
        path=dest/f'key-{index}.png';frame.save(path)
        # Measured coarse anatomical controls in the common native canvas.
        face={'renter':(191,104),'parent':(206,103),'pensioner':(212,135)}[name]
        points=[(face[0]-14,face[1]),(face[0]+14,face[1]),(face[0],face[1]+18),(face[0],face[1]+39),
                (137,177),(103,280),(153,300),(175,246),(243,393),(265,177),(283,285),(257,319),
                (194,432),(194,607),(123,762),(259,761)]
        if name=='renter':
            points[6]=[(153,300),(140,304),(116,317),(103,319)][index]
            points[7:9]=[(203,211),(220,379)]
            paper=[(162,202),(284,192),(275,394),(156,393)]
        elif name=='parent':
            # Controls measured on the registered native keys, including the
            # reaching elbow. A stationary elbow created a second hanging hand.
            points=[
                [(225,120),(256,112),(249,141),(239,173),(144,196),(121,316),(258,337),(189,214),(251,413),(292,213),(311,349),(322,464),(224,454),(200,539),(162,759),(277,742)],
                [(204,118),(235,110),(228,139),(220,171),(122,193),(108,314),(238,334),(166,216),(234,406),(276,212),(307,319),(281,310),(201,454),(190,539),(151,759),(267,743)],
                [(212,134),(241,130),(230,150),(221,176),(124,193),(110,316),(234,330),(171,216),(229,406),(274,211),(307,283),(275,239),(202,454),(190,539),(157,759),(270,748)],
                [(212,144),(242,145),(228,158),(220,178),(125,193),(110,316),(232,333),(166,216),(227,405),(278,210),(317,272),(294,223),(202,454),(190,539),(157,759),(270,748)]
            ][index]
            paper=[
                [(189,214),(304,247),(251,413),(162,380)],
                [(166,216),(281,247),(234,406),(144,374)],
                [(171,216),(277,250),(229,406),(149,374)],
                [(166,216),(214,228),(233,207),(289,218),(274,261),(283,264),(227,405),(142,375)]
            ][index]
        else:
            points=[
                [(216,137),(249,147),(235,160),(227,198),(124,224),(110,340),(160,429),(176,452),(145,763),(269,225),(296,320),(270,368),(185,455),(184,543),(139,741),(261,733)],
                [(198,140),(239,149),(225,167),(206,202),(101,224),(82,340),(118,420),(144,442),(120,765),(251,227),(301,349),(303,295),(180,455),(178,544),(116,743),(261,733)],
                [(193,138),(231,133),(220,156),(203,196),(100,228),(82,347),(119,420),(143,440),(120,765),(247,211),(321,280),(300,196),(180,455),(178,544),(116,743),(261,733)],
                [(162,143),(195,137),(199,153),(181,191),(100,237),(82,348),(119,428),(145,447),(122,768),(251,218),(329,222),(307,124),(180,455),(178,544),(116,743),(261,733)]
            ][index]
            paper=[
                [(245,339),(278,336),(268,375),(229,381)],
                [(291,246),(324,247),(308,284),(277,284)],
                [(281,141),(317,142),(303,187),(270,188)],
                [(270,69),(303,56),(311,95),(288,110)]
            ][index]
        cane=[
            [(168,428),(199,437),(177,466),(152,768),(128,768),(164,463)],
            [(136,416),(163,424),(144,453),(129,768),(105,768),(130,452)],
            [(135,415),(163,424),(144,451),(129,768),(105,768),(130,451)],
            [(135,424),(164,431),(146,461),(130,770),(106,770),(132,459)]
        ][index]
        paper_mask=paper
        if name=='pensioner':
            # Include antialiased receipt edges; unowned pale border pixels were
            # matched into face paint and floated above the gripped sheet.
            xs,ys=zip(*paper)
            paper_mask=[(min(xs)-5,min(ys)-5),(max(xs)+5,min(ys)-5),
                        (max(xs)+5,max(ys)+5),(min(xs)-5,max(ys)+5)]
        states.append({'id':['work','bridge-1','bridge-2','gesture'][index],
            'role':'main' if index in (0,3) else 'transition','file':path.relative_to(ROOT).as_posix(),
            'landmarks':dict(zip(KEYS,points)),'paper_polygon_xy':paper_mask,
            'paper_landmarks_xy':[points[6] if name=='parent' else points[11],paper[0],paper[1]],
            **({'prop_polygon_xy':cane,'prop_landmarks_xy':points[7:9]} if name=='pensioner' else {})})
    spec={'version':1,'id':name,'canvas_xy':[384,832],'head_paint_source':None,
        'states':states,'arcs':[{'id':'work-gesture','from':'work','to':'gesture','duration':6,
            'keys':[{'state':state['id'],'time':i*2} for i,state in enumerate(states)]}],
        'paint_warp_gains':[.55,.55,.55],
        'compatibility':['Original native work painting plus imagegen-authored registered bridges; no procedural body wiggle',
            'Work/gesture are main stages; two stable transition paintings; six-second outward arc and six-second reverse',
            'Original cast scale, floor and paper/cane ownership retained; runtime screenshot review required']}
    (SOURCE/f'{name}.json').write_text(json.dumps(spec,indent=2)+'\n',encoding='utf-8')
    receipt={'source':source.relative_to(ROOT).as_posix(),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'bridge_sheet':master.relative_to(ROOT).as_posix(),'bridge_sha256':hashlib.sha256(master.read_bytes()).hexdigest(),
        'authoring':'OpenAI built-in imagegen edit, 2026-10-10; reference original patron source strip; transparent output',
        'registration':'One uniform scale, original floor; parent/pensioner horizontal shoe-alpha centroid registration. Native per-key arm/face/receipt/cane controls; no deformation'}
    (dest/'provenance.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
    out=ROOT/'output/amt-gaussian-arcs/patrons';out.mkdir(parents=True,exist_ok=True)
    contact=Image.new('RGB',(1536,832),'#66685f')
    for i,frame in enumerate(frames):contact.paste(frame,(384*i,0),frame)
    contact.save(out/f'{name}-keys.png')
    print(json.dumps({'name':name,'states':len(states),'sheet_size':generated.size,'source_bounds':bounds}))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('name',choices=['renter','parent','pensioner']);p.add_argument('sheet',type=Path);a=p.parse_args();prepare(a.name,a.sheet)
