"""Append Heiko's bounded notebook performance, preserving existing atlas cells.

The existing neighbor bake owns registration and sampling. This extension uses
reference-derived explicit connected action keys and readable holds;
head and planted legs stay identical to Heiko's original front painting.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('neighbors', ROOT/'tools/build-neighbor-sprites.py')
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)
OUT = ROOT/'output/neighbors-checklist'
DEST = ROOT/'assets/characters/neighbors'
KEYS = ROOT/'assets/sprite-sources/neighbors/heiko-notebook-keys.png'
W, H = b.CELL


def registered_keys():
    _, (front, _, _) = b.source_views('heiko', 0)
    sheet = Image.open(KEYS).convert('RGBA')
    poses = []
    panels = [sheet.crop((c*sheet.width//4, r*sheet.height//3, (c+1)*sheet.width//4, (r+1)*sheet.height//3)) for r in range(3) for c in range(4)]
    boxes = [p.getbbox() for p in panels]
    scale = 170/max(box[3]-box[1] for box in boxes)
    for panel, box in zip(panels, boxes):
        cut = panel.crop(box)
        cut = cut.resize((round(cut.width*scale), round(cut.height*scale)), Image.Resampling.LANCZOS)
        pose = Image.new('RGBA', (W,H))
        pose.alpha_composite(cut, ((W-cut.width)//2, b.BASELINE-cut.height))
        # One original head and planted lower body across the full performance.
        # The cardigan joins at the neck and below its hem, not across hands.
        original, pixels = np.array(front), np.array(pose)
        pixels[:88] = original[:88]
        pixels[145:] = original[145:]
        poses.append(b.body_matte(Image.fromarray(pixels)))
    return [front, *poses]


def build():
    OUT.mkdir(parents=True,exist_ok=True)
    keys=registered_keys()
    for i,key in enumerate(keys):key.save(OUT/f'notebook-key-{i}.png')
    # Six genuine drawn take-out poses, four pencil/contact poses and four
    # return poses. Explicit holds preserve the drawing; never dissolve arms.
    take=[keys[[0,0,1,1,2,2,2,3,3,3,4,4,5,5,6,6][i]] for i in range(16)]
    read=b.performance(keys[6],'heiko','listen',16)
    write=[keys[[6,6,7,7,8,8,9,9,9,9,9,9,10,10,9,9][i]] for i in range(16)]
    put=[keys[[9,9,9,9,11,11,11,11,12,12,12,2,2,1,0,0][i]] for i in range(16)]
    clips=[take,read,write,put]
    old=Image.open(DEST/'heiko.webp').convert('RGBA')
    atlas=Image.new('RGBA',(2048,3840));atlas.paste(old.crop((0,0,2048,3072)),(0,0))
    for r,frames in enumerate(clips):
        board=Image.new('RGBA',(W*8,H*2),(230,230,226,255))
        dark=Image.new('RGBA',board.size,(28,30,33,255))
        for f,frame in enumerate(frames):
            atlas.alpha_composite(frame,(f*W,(16+r)*H))
            board.alpha_composite(frame,((f%8)*W,(f//8)*H));dark.alpha_composite(frame,((f%8)*W,(f//8)*H))
        board.save(OUT/f'notebook-{r}-ordered.png');dark.save(OUT/f'notebook-{r}-dark.png')
    for suffix,factor in [('',1),('-mobile',2)]:
        encoded=atlas if factor==1 else atlas.resize((1024,1920),Image.Resampling.LANCZOS)
        p=np.array(encoded);p[p[:,:,3]<12]=0
        Image.fromarray(p).save(DEST/f'heiko{suffix}.webp',lossless=True,exact=True,method=6)
    path=DEST/'manifest.json';manifest=json.loads(path.read_text());record=manifest['heiko']
    record.update(grid=[16,20],sha256=hashlib.sha256((DEST/'heiko.webp').read_bytes()).hexdigest(),bytes=(DEST/'heiko.webp').stat().st_size,mobileBytes=(DEST/'heiko-mobile.webp').stat().st_size,decodedRgbaBytes=2048*3840*4,mobileDecodedRgbaBytes=1024*1920*4)
    names=['notebook-take','notebook-read','notebook-write','notebook-put']
    record['rows']=record['rows'][:12]+names
    for i,name in enumerate(names):record['clips'][name]={'offset':256+i*16,'count':16}
    record['notebook']={'source':'assets/sprite-sources/neighbors/heiko-notebook-keys.png','sourceSha256':hashlib.sha256(KEYS.read_bytes()).hexdigest(),'encodedSamplesPerClip':16,'drawnTakePoses':6,'drawnWritePoses':4,'notebookHand':'left','pencilHand':'right','method':'explicit painted action keys and holds; continuous reading head field; fixed original head and legs'}
    record['encodedFrameChecks']=[c for c in record['encodedFrameChecks'] if c['row']<12]
    for suffix,factor in [('',1),('-mobile',2)]:
        encoded=Image.open(DEST/f'heiko{suffix}.webp').convert('RGBA');cw,ch=W//factor,H//factor
        for row in range(12,16):
            frames=[encoded.crop((i*cw,(row+4)*ch,(i+1)*cw,(row+5)*ch)) for i in range(16)]
            decoded=[b.premul(f) for f in frames]
            changes=[float(np.abs(decoded[(i+1)%16]-f).mean()) for i,f in enumerate(decoded)]
            record['encodedFrameChecks'].append({'variant':suffix or 'desktop','row':row,'distinctDecodedFrames':len({hashlib.sha256(f.tobytes()).hexdigest() for f in frames}),'maxChange':max(changes),'seamChange':changes[-1]})
    path.write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({k:record[k] for k in ['grid','bytes','mobileBytes','decodedRgbaBytes']}))

if __name__=='__main__':build()
