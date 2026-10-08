"""Preview-only bidirectional, landmark-guided splat correspondence. No game atlas edits."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/previews/knick-splats'
SOURCE = ROOT / 'assets/buergeramt/characters/clerk-performance-detail.webp'
# Manually paired pixels on the existing 384x832 registered paintings.
# This is an image warp, not a skeleton or inferred hidden anatomy.
LANDMARKS = [
 ('hair top',(223,42),(251,76)),('hair left',(135,87),(176,125)),
 ('hair right',(305,90),(325,111)),('left eye',(226,125),(254,156)),
 ('right eye',(282,130),(307,167)),('nose',(265,158),(294,193)),
 ('chin',(236,210),(267,247)),('left collar',(183,228),(205,263)),
 ('right collar',(271,236),(295,278)),('left shoulder',(131,260),(156,264)),
 ('left elbow',(90,380),(77,235)),('stamp knob',(176,286),(163,31)),
 ('stamp hand',(151,344),(114,103)),('stamp base',(172,405),(98,159)),
 ('badge',(266,397),(270,391)),('left waist',(120,481),(119,483)),
 ('right shoulder',(311,304),(329,291)),('right elbow',(318,434),(333,350)),
 ('right hand',(321,515),(307,417)),('skirt left',(113,611),(110,611)),
 ('skirt middle',(212,618),(213,618)),('skirt right',(294,607),(297,610)),
 ('left knee',(146,664),(146,663)),('right knee',(236,662),(236,663)),
 ('left ankle',(145,736),(145,736)),('right ankle',(230,728),(230,727)),
 ('left toe',(175,787),(175,787)),('right toe',(306,765),(306,765)),
]

def tps_map(source, target, query):
    """Thin-plate interpolation solved once offline; consumer receives plain floats."""
    s, t, q = source / 832, target / 832, query / 832
    def kernel(a,b):
        r2 = ((a[:,None,:]-b[None,:,:])**2).sum(axis=2)
        return r2 * np.log(np.maximum(r2, 1e-12))
    n = len(s)
    affine = np.column_stack((np.ones(n), s))
    system = np.block([[kernel(s,s)+np.eye(n)*1e-7, affine], [affine.T,np.zeros((3,3))]])
    weights = np.linalg.solve(system, np.vstack((t,np.zeros((3,2)))))
    return (np.column_stack((kernel(q,s),np.ones(len(q)),q)) @ weights) * 832

OUT.mkdir(parents=True,exist_ok=True)
atlas=Image.open(SOURCE).convert('RGBA')
images=[atlas.crop((0,0,384,832)),atlas.crop((768,0,1152,832))]
source=np.array([a for _,a,_ in LANDMARKS],float)
target=np.array([b for _,_,b in LANDMARKS],float)
parts=[]
for group,im in enumerate(images):
    im.save(OUT/f'anchor-{group}.webp','WEBP',lossless=True,method=6)
    pixels=np.asarray(im)
    yy,xx=np.mgrid[1:832:3,1:384:3]
    rgba=pixels[yy,xx].reshape(-1,4)/255
    xy=np.column_stack((xx.ravel(),yy.ravel())).astype(float)
    visible=rgba[:,3]>.025
    xy,rgba=xy[visible],rgba[visible]
    mapped=tps_map(source if group==0 else target,target if group==0 else source,xy)
    # Source cloud carries source paint; target cloud carries target paint.
    # Fading weights sum to one, and exact endpoints retain only their own cloud.
    start,end=(xy,mapped) if group==0 else (mapped,xy)
    for points in (start,end):
        points[:,0]=(points[:,0]-192)/208
        points[:,1]=(416-points[:,1])/208
    parts.append(np.column_stack((start,end,rgba,np.full(len(xy),group))))
records=np.concatenate(parts).astype('<f4')
data=OUT/'correspondence.bin';data.write_bytes(records.tobytes())
manifest={'status':'preview-only; not accepted character animation','character':'Frau Knick','source':str(SOURCE.relative_to(ROOT)).replace('\\','/'),'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'anchor_cells_xywh':[[0,0,384,832],[768,0,384,832]],'anchor_names':['Idle / stamp held','Stamp raised'],'sample_stride_px':3,'sample_count':len(records),'record_floats':9,'record_fields':['startX','startY','endX','endY','sRGB_R','sRGB_G','sRGB_B','alpha','anchorGroup'],'correspondence_sha256':hashlib.sha256(data.read_bytes()).hexdigest(),'landmarks':[{'name':name,'source':a,'target':b} for name,a,b in LANDMARKS],'limits':['No inferred depth or hidden artwork','Visibility and crossing-arm changes may produce smearing or doubled contours','Endpoint images are existing painted cells; correspondence is hand-authored TPS, not learned motion']}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'samples':len(records),'binary_bytes':data.stat().st_size,'source_hash':manifest['source_sha256']}))
