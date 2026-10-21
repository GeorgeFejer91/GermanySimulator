"""Hannelore front/rear four-key source pilot. No runtime edits."""
from pathlib import Path
import sys,json,math,hashlib,importlib.util,argparse
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from scipy.ndimage import label
from scipy.interpolate import PchipInterpolator
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def run(out):
 out.mkdir(parents=True,exist_ok=True);r=json.loads((HERE/'recipe.json').read_text());pins=dict(r['inputPins'])
 for v in r['views'].values():pins[v['source']]=v['sha256']
 for p in [HERE/'recipe.json',Path(__file__)]:pins[p.relative_to(ROOT).as_posix()]=sha(p)
 for p,h in pins.items():assert sha(ROOT/p)==h,p
 (out/'input-pins-before.json').write_text(json.dumps(pins,indent=2)+'\n')
 sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
 paint=load('hannelore_front_rear_paint',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')
 street=load('hannelore_front_rear_export',ROOT/'tools/build-street-character-sprites.py')
 files={};rows={};font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
 def save(im,name):
  p=out/name;p.parent.mkdir(exist_ok=True,parents=True);im.save(p);files[name]=sha(p)
 def flat(im,bg):return Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
 def export(im,w):
  q=w/128
  return street.export_cell(im,{'working':r['working'],'cell':[w,int(w*1.25)],'pivot':[64*q,150*q],'figureHeight':r['paintHeight']*q})
 for direction,v in r['views'].items():
  source=Image.open(ROOT/v['source']).convert('RGBA');assert source.size==(512,512)
  mask=Image.new('L',source.size);ImageDraw.Draw(mask).polygon([tuple(p) for p in v['propPolygon']],fill=255)
  save(mask,direction+'-prop-mask.png');poses=[(source,'neutral')];records=[];phaseImages=[]
  for phase in r['phases']:
   rad=math.tau*phase/16;calls=[];original=paint.warp_layer
   def traced(layer,nodes,dx,dy):
    calls.append({'nodes_y':list(nodes),'dx':[float(x) for x in dx],'dy':[float(x) for x in dy],'minJacobianY':float(np.min(1+PchipInterpolator(nodes,dy).derivative()(np.arange(512))))})
    return original(layer,nodes,dx,dy)
   def limb(side,nodes,dx,dy):
    t=rad+side*math.pi;bob=-3.4*math.cos(2*rad);lift=r['liftWorking']*max(0,math.cos(t))
    depth=min(0,v['travel'][1]*r['depthWorking']*math.sin(t))
    root_dy=bob-lift*.22+depth*.22;foot_dy=depth-lift
    # The short visible calf is one continuous paint span. Spread flex by its
    # actual source distances; this control is not an anatomical knee.
    blend=(nodes[4]-nodes[3])/(nodes[5]-nodes[3])
    calf_dy=root_dy+(foot_dy-root_dy)*blend
    return dx,[bob,bob,bob,root_dy,calf_dy,foot_dy,foot_dy]
   paint.warp_layer=traced
   try:
    frames,meta=paint.animate(source,v['landmarks'],travel=v['travel'],count=16,foreground=v['foreground'],phases=[rad],rigid_mask=mask,limb_pose=limb)
   except Exception as error:
    (out/(direction+'-phase'+str(phase)+'-failure-fields.json')).write_text(json.dumps({'phase':phase,'direction':direction,'error':str(error),'calls':calls},indent=2))
    if hasattr(error,'frame'):save(error.frame,direction+'-phase'+str(phase)+'-failure.png')
    raise
   finally:paint.warp_layer=original
   im=frames[0];assert len(calls)==3
   a=np.array(im);edge=np.concatenate([a[0,:,3],a[-1,:,3],a[:,0,3],a[:,-1,3]])
   assert edge.max()==0 and not np.any(a[a[:,:,3]==0,:3])
   yy,xx=np.where(a[:,:,3]>=20);assert yy.max()<472,'No source foot extends below original source floor'
   save(im,direction+'-phase'+str(phase)+'.png');poses.append((im,'phase'+str(phase)));phaseImages.append(im)
   records.append({'phase':phase,'fields':calls,'helperRecord':meta[0],'alpha20Bounds':[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]})
  # Four-key preview intentionally holds each extreme for a quarter-cycle.
  for bg,name in [('#eee8db','light'),('#25272b','dark')]:
   board=Image.new('RGB',(5*300,590),bg);d=ImageDraw.Draw(board);ink='#111' if name=='light' else '#eee'
   for i,(im,caption) in enumerate(poses):
    d.text((i*300+5,5),direction+' '+caption,font=font,fill=ink)
    board.paste(flat(im,bg).resize((256,256)),(i*300+5,30))
    board.paste(flat(im,bg).crop((135,330,380,480)).resize((245,150),Image.Resampling.NEAREST),(i*300+5,320))
    d.text((i*300+5,492),'four-key source proposal',font=font,fill=ink)
   save(board,direction+'-keys-'+name+'.png')
   seq=[flat(im,bg) for im in phaseImages];p=out/(direction+'-four-key-'+name+'.gif');seq[0].save(p,save_all=True,append_images=seq[1:],duration=r['proposedCycleMs']//4,loop=0);files[p.name]=sha(p)
  for w in [96,64]:
   for im,caption in poses:save(export(im,w),f'direct-{w}/{direction}-{caption}.png')
   for bg,name in [('#eee8db','light'),('#25272b','dark')]:
    board=Image.new('RGB',(5*220,420),bg);d=ImageDraw.Draw(board)
    for i,(im,caption) in enumerate(poses):
     cell=export(im,w);a=np.array(cell);assert not np.any(a[a[:,:,3]==0,:3])
     assert max(a[0,:,3].max(),a[-1,:,3].max(),a[:,0,3].max(),a[:,-1,3].max())==0
     d.text((i*220+4,5),direction+' '+str(w)+' '+caption,font=font,fill='#111' if name=='light' else '#eee')
     board.paste(flat(cell,bg),(i*220+4,34));board.paste(flat(cell,bg).resize((cell.width*2,cell.height*2),Image.Resampling.NEAREST),(i*220+4,165))
    save(board,f'{direction}-direct-{w}-{name}.png')
  # Existing helper guarantees exact input at strength zero.
  zero,_=paint.animate(source,v['landmarks'],travel=v['travel'],count=16,strength=0,phases=[0],rigid_mask=mask,limb_pose=limb)
  assert np.array_equal(np.array(zero[0]),np.array(source))
  rows[direction]={'status':'PROPOSED four extremes awaiting visual review','controlsAreNotAnatomicalKneeMeasurements':True,'strengthZeroExact':True,'phases':records}
 for p,h in pins.items():assert sha(ROOT/p)==h,p
 (out/'input-pins-after.json').write_text(json.dumps(pins,indent=2)+'\n')
 receipt={'status':'PROPOSED four front/rear keys, no full gait/runtime approval','inputPinsBeforeAfterExact':True,'inputPins':pins,'views':rows,'files':files}
 (out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'status':receipt['status'],'inputs':len(pins),'files':len(files),'receiptSha256':sha(out/'receipt.json')}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--outdir',type=Path,default=ROOT/'output/ambient-city-animation/hannelore-sparkasse-front-rear-extremes-v1');args=parser.parse_args();out=args.outdir.resolve()
 if not out.is_relative_to(ROOT/'output'):raise ValueError('Proofs stay ignored')
 run(out)
