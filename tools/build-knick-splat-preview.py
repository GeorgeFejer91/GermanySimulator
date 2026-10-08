"""Four original paintings -> a bounded, preview-only Gaussian animation cycle."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/previews/knick-splats'
SOURCE = ROOT / 'assets/buergeramt/characters/clerk-performance-detail.webp'
# Named landmarks in idle, raised, contact, refusal order, in 384x832 cells.
LANDMARKS = [
 ('hair top', (223,42),(251,76),(233,74),(218,40)),
 ('hair left',(135,87),(176,125),(141,118),(128,80)),
 ('hair right',(305,90),(325,111),(296,114),(293,81)),
 ('left eye',(226,125),(254,156),(209,181),(220,123)),
 ('right eye',(282,130),(307,167),(257,197),(266,124)),
 ('nose',(265,158),(294,193),(234,211),(252,151)),
 ('chin',(236,210),(267,247),(221,263),(224,209)),
 ('left collar',(183,228),(205,263),(174,250),(173,223)),
 ('right collar',(271,236),(295,278),(263,275),(265,246)),
 ('left shoulder',(131,260),(156,264),(123,250),(112,252)),
 ('left elbow',(90,380),(77,235),(99,355),(144,351)),
 ('stamp knob',(176,286),(163,31),(207,353),(274,242)),
 ('stamp hand',(151,344),(114,103),(194,351),(287,298)),
 ('stamp base',(172,405),(98,159),(205,398),(302,336)),
 ('badge',(266,397),(270,391),(239,382),(260,394)),
 ('left waist',(120,481),(119,483),(118,483),(120,481)),
 ('right shoulder',(311,304),(329,291),(298,300),(313,305)),
 ('right elbow',(318,434),(333,350),(317,379),(305,381)),
 ('right hand',(321,515),(307,417),(288,421),(178,319)),
 ('skirt left',(113,611),(110,611),(110,611),(111,611)),
 ('skirt middle',(212,618),(213,618),(212,618),(212,618)),
 ('skirt right',(294,607),(297,610),(298,610),(297,610)),
 ('left knee',(146,664),(146,663),(146,664),(146,664)),
 ('right knee',(236,662),(236,663),(236,662),(236,662)),
 ('left ankle',(145,736),(145,736),(145,736),(145,736)),
 ('right ankle',(230,728),(230,727),(230,728),(230,728)),
 ('left toe',(175,787),(175,787),(175,787),(175,787)),
 ('right toe',(306,765),(306,765),(306,765),(306,765)),
]
# Protect the head from arm-driven spline distortion with a local similarity.
HEADS = [
 [(230,36),(279,44),(310,77),(319,149),(297,199),(278,227),(221,229),(169,210),(136,191),(113,164),(113,128),(129,91),(178,58)],
 [(253,68),(310,69),(332,102),(338,171),(327,211),(304,249),(271,270),(225,252),(185,234),(166,205),(163,161),(182,116),(215,90)],
 [(232,70),(285,81),(310,111),(314,158),(295,212),(263,249),(230,269),(184,258),(157,227),(131,191),(127,151),(144,117),(180,89)],
 [(217,36),(267,42),(295,72),(304,151),(279,204),(258,227),(199,224),(148,200),(110,174),(94,130),(115,83),(170,51)],
]
STAMPS = [
 [(150,264),(196,265),(202,318),(204,372),(216,382),(218,418),(139,436),(134,390),(142,369),(144,318)],
 [(146,0),(192,0),(203,58),(169,90),(155,122),(158,178),(126,205),(39,168),(47,127),(91,105),(120,69)],
 [(188,364),(216,364),(220,379),(238,380),(240,405),(173,419),(169,388),(187,380)],
 [(256,218),(291,218),(299,253),(296,282),(310,319),(330,321),(332,344),(283,360),(265,337),(271,309),(267,268)],
]
# Two points define each visible stamp's axis and preserve rigid shape.
STAMP_AXES = [
 [(176,286),(172,405)],[(163,31),(98,159)],
 [(203,313),(205,398)],[(274,242),(302,336)],
]

def tps_map(source, target, query):
    s, t, q = source / 832, target / 832, query / 832
    def kernel(a,b):
        r2 = ((a[:,None,:]-b[None,:,:])**2).sum(axis=2)
        return r2 * np.log(np.maximum(r2, 1e-12))
    affine = np.column_stack((np.ones(len(s)), s))
    system = np.block([[kernel(s,s)+np.eye(len(s))*1e-7, affine], [affine.T,np.zeros((3,3))]])
    weights = np.linalg.solve(system, np.vstack((t,np.zeros((3,2)))))
    return (np.column_stack((kernel(q,s),np.ones(len(q)),q)) @ weights) * 832

def similarity(source, target, query):
    # x'=a*x-b*y+tx, y'=b*x+a*y+ty: no shear or reflection.
    x,y=source.T
    system=np.zeros((len(source)*2,4))
    system[0::2]=np.column_stack((x,-y,np.ones(len(x)),np.zeros(len(x))))
    system[1::2]=np.column_stack((y,x,np.zeros(len(x)),np.ones(len(x))))
    a,b,tx,ty=np.linalg.lstsq(system,target.ravel(),rcond=None)[0]
    return query @ np.array([[a,b],[-b,a]])+np.array([tx,ty])

def mapped_pixels(a,b,xy):
    source=np.array([row[a+1] for row in LANDMARKS],float)
    target=np.array([row[b+1] for row in LANDMARKS],float)
    mapped=tps_map(source,target,xy)
    mask=Image.new('L',(384,832));ImageDraw.Draw(mask).polygon(HEADS[a],fill=255)
    head=np.asarray(mask)[xy[:,1].astype(int),xy[:,0].astype(int)]/255
    rigid=similarity(source[3:7],target[3:7],xy)
    mapped=mapped*(1-head[:,None])+rigid*head[:,None]
    stamp_mask=Image.new('L',(384,832));ImageDraw.Draw(stamp_mask).polygon(STAMPS[a],fill=255)
    stamp=np.asarray(stamp_mask)[xy[:,1].astype(int),xy[:,0].astype(int)]/255
    rigid_stamp=similarity(np.array(STAMP_AXES[a],float),np.array(STAMP_AXES[b],float),xy)
    mapped=mapped*(1-stamp[:,None])+rigid_stamp*stamp[:,None]
    # Feet stay planted: eliminate residual spline drift below the knees.
    weight=np.clip((xy[:,1]-620)/80,0,1)[:,None]
    return mapped*(1-weight)+xy*weight

def world(xy):
    return np.column_stack(((xy[:,0]-192)/208,(416-xy[:,1])/208))

OUT.mkdir(parents=True,exist_ok=True)
atlas=Image.open(SOURCE).convert('RGBA')
cells=[0,2,3,1]
samples=[]
for i,col in enumerate(cells):
    im=atlas.crop((col*384,0,(col+1)*384,832))
    im.save(OUT/f'anchor-{i}.webp','WEBP',lossless=True,method=6)
    yy,xx=np.mgrid[1:832:3,1:384:3]
    rgba=np.asarray(im)[yy,xx].reshape(-1,4)
    xy=np.column_stack((xx.ravel(),yy.ravel())).astype(float)
    visible=rgba[:,3]>6
    samples.append((xy[visible],rgba[visible]))

# Fixed slots share one GPU allocation and shader across all transitions.
slots=((max(len(xy) for xy,_ in samples)+255)//256)*256
dtype=np.dtype([('mapping','<f4',(4,)),('rgba','u1',(4,))])
records=np.zeros((4,slots*2),dtype=dtype)
for pair in range(4):
    a,b=pair,(pair+1)%4
    for group,index,other in [(0,a,b),(1,b,a)]:
        xy,rgba=samples[index]
        mapped=mapped_pixels(index,other,xy)
        start,end=(xy,mapped) if group==0 else (mapped,xy)
        chunk=records[pair,group*slots:group*slots+len(xy)]
        chunk['mapping']=np.column_stack((world(start),world(end)))
        chunk['rgba']=rgba

data=OUT/'correspondence.bin';data.write_bytes(records.tobytes())
manifest={
 'status':'preview-only; not accepted character animation',
 'character':'Frau Knick','source':SOURCE.relative_to(ROOT).as_posix(),
 'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
 'anchor_cells_xywh':[[col*384,0,384,832] for col in cells],
 'anchor_names':['Ready','Stamp raised','Stamp contact','Refusal'],
 'sample_stride_px':3,'anchor_sample_counts':[len(xy) for xy,_ in samples],
 'slots_per_anchor':slots,'sample_count':slots*2,'segment_count':4,
 'record_bytes':20,'record_fields':['startX:f32le','startY:f32le','endX:f32le','endY:f32le','sRGB_R:u8','sRGB_G:u8','sRGB_B:u8','alpha:u8'],
 'layout':'4 segment blocks; source slots then target slots; unused slots have zero alpha',
 'correspondence_sha256':hashlib.sha256(data.read_bytes()).hexdigest(),
 'landmarks':[{'name':row[0],'anchors':row[1:]} for row in LANDMARKS],
 'head_polygons':HEADS,'stamp_polygons':STAMPS,'stamp_axes':STAMP_AXES,
 'limits':['No inferred depth, skeleton or hidden artwork','Paper exists only in the contact painting; visibility changes use an opacity handoff','Changing arm occlusion and face angle still soften intermediate poses','Head and stamp use local similarity; body uses landmark TPS; below-knee samples stay planted'],
}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'active_slots':slots*2,'binary_bytes':data.stat().st_size,'anchor_samples':manifest['anchor_sample_counts']}))
