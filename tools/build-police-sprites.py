"""Bake police paint using the project's existing intact-painted-limb helper.

Run from the repository root. Pillow/NumPy/SciPy are authoring dependencies only.
Source sheets are immutable ImageGen paint; no generative upscaling is used.
"""
from pathlib import Path
from io import BytesIO
import hashlib
import json
import sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label
label_components=label

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
from painted_walk import animate

SOURCE = ROOT/'assets/sprite-sources/police'
OUT = ROOT/'assets/characters/police'
QA = ROOT/'output/police-art'
TIERS = ['patrol', 'protective', 'riot', 'heavy']

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def extract(sheet, col, row, columns, rows):
    # One sheet-wide transform. Never independently fit generated cells/frames.
    w,h=sheet.size
    im=sheet.crop((round(col*w/columns),round(row*h/rows),round((col+1)*w/columns),round((row+1)*h/rows)))
    a=np.array(im.convert('RGBA')); a[a[:,:,3]<20]=0
    components,count=label(a[:,:,3]>=20)
    sizes=np.bincount(components.ravel());sizes[0]=0
    a[components!=int(sizes.argmax())]=0
    im=Image.fromarray(a)
    factor=1.1
    size=(round(im.width*factor),round(im.height*factor))
    im=im.resize(size,Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(512,512))
    canvas.alpha_composite(im,(round(256-size[0]/2),round(480-size[1])))
    return canvas

def pack_cell(frame, size):
    # Fixed crop/registration across the entire family, with 8px output gutters.
    return frame.crop((0,0,512,614.4)).resize(size,Image.Resampling.LANCZOS)

def interaction_keys(sheet,row):
    w,h=sheet.size
    # Native-pixel source registrations: the generator's rows are uneven.
    # Boundaries are in genuine transparent gaps, not an assumed equal grid.
    bounds=[0,242,471,702,927,1156,1382,1588,1774]
    cells=[]
    neutral=sheet.crop((0,bounds[row],round(w/4),bounds[row+1]))
    a=np.array(neutral)[:,:,3]; lab,n=label(a>=20);sizes=np.bincount(lab.ravel());sizes[0]=0
    actor_y=np.where(lab==sizes.argmax())[0];sole=actor_y.max()+1
    # One transform for this actor's entire four-pose row, never per frame.
    factor=396/(sole-actor_y.min())
    for col in range(4):
        im=sheet.crop((round(col*w/4),bounds[row],round((col+1)*w/4),bounds[row+1])).convert('RGBA')
        a=np.array(im);lab,n=label(a[:,:,3]>=20);sizes=np.bincount(lab.ravel());sizes[0]=0;a[lab!=sizes.argmax()]=0
        im=Image.fromarray(a);im=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',(512,512));canvas.alpha_composite(im,(round(256-im.width/2),round(472-sole*factor)))
        cells.append(canvas)
    return cells

def main():
    OUT.mkdir(parents=True,exist_ok=True); QA.mkdir(parents=True,exist_ok=True)
    action=Image.open(SOURCE/'interaction-keys.png').convert('RGBA')
    manifest={'version':1,'method':'existing intact-painted-limbs; genuine authored neutral/half/raised and ticket gesture keys',
      'columns':8,'rows':7,'desktopCell':[160,192],'mobileCell':[120,144],
      'pivot':[.5,472/614.4],'figureHeightWorld':1.56,'cycleDistance':1.56/.02/422*96,
      'clips':{'down':0,'right':1,'up':2,'left':3,'idle':4,'warning':5,'ticket':6},
      'mirroring':'left derives from whole right view; equipment hand changes with screen direction',
      'sources':{p.name:sha(p) for p in SOURCE.glob('*.png')},
      'builderSha256':sha(Path(__file__)),
      'animationHelperSha256':sha(ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py'),
      'variants':{}}
    refresh='--actions-only' in sys.argv
    selected=[arg for arg in sys.argv[1:] if not arg.startswith('--')]
    if selected and (OUT/'manifest.json').exists():manifest['variants']=json.loads((OUT/'manifest.json').read_text())['variants']
    all_contacts=[]
    for gender in ['male','female']:
        sheet=Image.open(SOURCE/f'{gender}-directions.png').convert('RGBA')
        for tier,row in zip(TIERS,range(4)):
            name=f'{tier}-{gender}'; frames=[]; sources=[]; audit=[]
            if selected and name not in selected:continue
            for col,travel in ([] if refresh else enumerate([(0,1),(1,0),(0,-1)])):
                source=extract(sheet,col,row,3,4); sources.append(source)
                c={'waist':335,'hip':355,'mid':256,'hem':[389,389],
                  'knee':[424,424],'ankle':[449,449],'centres':[222,286],
                  'root_overlap':8,'step_width':24,'stride_curve':'planted',
                  'auto_hand_mask':True,'depth_amplitude':6,'depth_knee_follow':.55}
                # Keep hands, baton and shield out of the trouser deformation.
                mask=Image.new('L',(512,512)); d=ImageDraw.Draw(mask)
                d.rectangle((0,0,140,445),fill=255);d.rectangle((382,0,511,445),fill=255)
                if tier=='heavy':
                    if col==2:d.rectangle((0,180,190,425),fill=255)
                    elif col==1:d.polygon([(291,210),(394,188),(405,414),(311,434)],fill=255)
                    else:d.polygon([(315,175),(440,175),(440,458),(325,458)],fill=255)
                try:walk,records=animate(source,c,travel,count=8,rigid_mask=mask)
                except ValueError as error:
                    if hasattr(error,'frame'):error.frame.save(QA/f'FAIL-{name}-{col}-{error.phase}.png')
                    raise
                frames.append(walk); audit.append(records)
            if refresh:frames=[[],[],[],[],[]]
            else:
                frames.append([im.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for im in frames[1]])
                sources.append(sources[1].transpose(Image.Transpose.FLIP_LEFT_RIGHT))
                frames.append(sources+sources)
            keys=interaction_keys(action,row*2+(1 if gender=='female' else 0))
            # Genuine authored entry/half raise/hold/return, not eight fake poses.
            frames.append([keys[i] for i in [0,1,2,2,2,1,0,0]])
            frames.append([keys[i] for i in [0,1,3,3,3,1,0,0]])
            variants={}
            for label,size in [('desktop',(160,192)),('mobile',(120,144))]:
                path=OUT/f'{name}{"-mobile" if label=="mobile" else ""}.webp'
                atlas=Image.open(path).convert('RGBA') if refresh else Image.new('RGBA',(size[0]*8,size[1]*7))
                for r,strip in enumerate(frames):
                    if strip:atlas.paste((0,0,0,0),(0,r*size[1],atlas.width,(r+1)*size[1]))
                    for f,im in enumerate(strip):atlas.alpha_composite(pack_cell(im,size),(f*size[0],r*size[1]))
                # WebP lossless keeps zero hidden RGB and true alpha; no mipmaps.
                a=np.array(atlas);a[a[:,:,3]<12]=0;atlas=Image.fromarray(a)
                encoded=BytesIO();atlas.save(encoded,format='WEBP',lossless=True,method=6)
                pending=path.with_suffix('.webp.pending');pending.write_bytes(encoded.getvalue());pending.replace(path)
                decoded=Image.open(path).convert('RGBA')
                for r in range(7):
                    for f in range(8):
                        cell=decoded.crop((f*size[0],r*size[1],(f+1)*size[0],(r+1)*size[1]))
                        aa=np.array(cell)[:,:,3]
                        if any([aa[:2].max(),aa[-2:].max(),aa[:,:2].max(),aa[:,-2:].max()]):
                            raise ValueError(f'Nontransparent gutter {name}/{label}/{r}/{f}')
                        labels,count=label_components(aa>=128)
                        if sum(area>max(4,size[0]*size[1]*.001) for area in np.bincount(labels.ravel())[1:])!=1:
                            raise ValueError(f'Detached encoded paint {name}/{label}/{r}/{f}')
                variants[label]={'file':path.name,'sha256':sha(path),'bytes':path.stat().st_size,
                                 'width':atlas.width,'height':atlas.height,'decodedRGBA':atlas.width*atlas.height*4}
                if label=='desktop':
                    board=Image.new('RGB',atlas.size,(235,231,220)); board.paste(decoded,(0,0),decoded)
                    board.save(QA/f'{name}-all-encoded.jpg',quality=92)
                    contact=Image.new('RGB',(160*6,192),(35,38,44))
                    for i,(r,f) in enumerate([(0,0),(1,0),(1,2),(1,4),(2,0),(6,4)]):
                        cell=decoded.crop((f*160,r*192,(f+1)*160,(r+1)*192));contact.paste(cell,(i*160,0),cell)
                    all_contacts.append(contact)
                    ordered=[]
                    for r in [0,1,2,3,5,6]:
                        for f in range(8):
                            cell=decoded.crop((f*160,r*192,(f+1)*160,(r+1)*192))
                            bg=Image.new('RGB',cell.size,(226,225,220));bg.paste(cell,(0,0),cell);ordered.append(bg)
                    ordered[0].save(QA/f'{name}-ordered.gif',save_all=True,append_images=ordered[1:],duration=100,loop=0)
            manifest['variants'][name]=variants
            if not refresh:(QA/f'{name}-joint-records.json').write_text(json.dumps(audit),encoding='utf8')
    combined=Image.new('RGB',(960,192*len(all_contacts)),(35,38,44))
    for i,im in enumerate(all_contacts):combined.paste(im,(0,i*192))
    combined.save(QA/('selected-contacts.jpg' if selected else 'all-variants-contacts.jpg'),quality=94)
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'variants':len(manifest['variants']),'desktopBytes':sum(v['desktop']['bytes'] for v in manifest['variants'].values()),'mobileBytes':sum(v['mobile']['bytes'] for v in manifest['variants'].values()),'review':str(QA)}))

if __name__=='__main__':main()
