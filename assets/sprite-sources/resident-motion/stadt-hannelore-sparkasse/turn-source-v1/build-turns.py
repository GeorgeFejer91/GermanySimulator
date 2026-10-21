"""Eight own fixed-scale painted turn anchors. No invented turn inbetweens."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,sys
sys.dont_write_bytecode=True
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
FAMILY=HERE.parent
ORDER=['down','front-right','right','rear-right','up','rear-left','left','front-left']
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(n,p):
 s=importlib.util.spec_from_file_location(n,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def bbox(m):
 y,x=np.where(m);return None if not len(x) else [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
def delta(a,b):
 a,b=np.array(a),np.array(b);d=np.abs(a.astype(int)-b.astype(int));mask=np.any(d,2)
 return {'rgbaExact':bool(np.array_equal(a,b)),'changedPixels':int(mask.sum()),'changedBounds':bbox(mask),'maxRgbaDelta':d.reshape(-1,4).max(0).tolist()}
def run(out,copy_assets=False):
 out=out.resolve();assert out.is_relative_to(ROOT/'output');out.mkdir(parents=True,exist_ok=True);assert not any(out.iterdir()),'Output folder must be empty'
 pins={};files={}
 def pin(p,expected=None):
  p=Path(p).resolve();h=sha(p);assert expected is None or h==expected,(p,h,expected)
  pins[p.relative_to(ROOT).as_posix()]=h;return p
 def write(name,data):
  p=out/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8');files[name]=sha(p)
 def save(im,name):
  p=out/name;p.parent.mkdir(parents=True,exist_ok=True);im.save(p);files[name]=sha(p)
 register=json.loads(pin(FAMILY/'neutral-source-v1/registration-receipt.json','d39077d848b113bace59483453887870f2d96fe8ed345b140dde1c03539879c3').read_text())
 reg=json.loads(pin(FAMILY/'neutral-source-v1/source-registration.json').read_text())
 for view in reg['views'].values():pin(ROOT/view['source'],view['sourceSha256'])
 sr=json.loads(pin(FAMILY/'side-loop-v1/recipe.json').read_text())
 for c in sr['sides'].values():
  for source in [*c['sources'].values(),c['neutralReference']]:pin(ROOT/source['file'],source['sha256'])
 pin(FAMILY/'side-loop-v1/source_fields.py');pin(ROOT/'tools/build-street-character-sprites.py');pin(ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py');pin(Path(__file__))
 pin(ROOT/'output/ambient-city-animation/hannelore-sparkasse-neutral-source-review-v1/REPORT.md')
 pin(ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-loop-v1/review/final-receipt.json')
 side=load('hannelore_turn_side',FAMILY/'side-loop-v1/source_fields.py').SideFields()
 exporter=load('hannelore_turn_export',ROOT/'tools/build-street-character-sprites.py')
 frames=[];metadata=[];direct={96:[],64:[]}
 for i,h in enumerate(ORDER):
  source=register['registered'][h];original=Image.open(pin(ROOT/source['file'],source['sha256'])).convert('RGBA')
  if h in ['right','left']:
   im,fields,_,_=side.render(h,0,strength=0,diagnostics=False)
   assert np.array_equal(np.array(im),np.array(Image.open(ROOT/sr['sides'][h]['neutralReference']['file']).convert('RGBA')))
   origin={'kind':'SideFields.render','direction':h,'phase':0,'strength':0,'fields':fields,'neutralReference':sr['sides'][h]['neutralReference']}
  else:
   im=original.copy();origin={'kind':'exact registered own painting','file':source['file'],'sha256':source['sha256'],'rawPainting':reg['views'][h]}
  a=np.array(im);assert not np.any(a[:,:,:3][a[:,:,3]==0]);assert not np.any(np.r_[a[0,:,3],a[-1,:,3],a[:,0,3],a[:,-1,3]])
  save(im,f'working/{i:02}-{h}.png');frames.append(im)
  row={'index':i,'heading':h,'source':origin,'originalRegisteredDifference':delta(im,original),'alpha20Bounds':bbox(a[:,:,3]>=20),'headAlpha20Bounds':bbox((a[:,:,3]>=20)&(np.indices(a.shape[:2])[0]<270)),'shoeAlpha20Bounds':bbox((a[:,:,3]>=20)&(np.indices(a.shape[:2])[0]>=420)),'hiddenRgb':0,'edgeAlpha':0,'direct':{}}
  for w,ht in [(96,120),(64,80)]:
   q=w/128;cell=exporter.export_cell(im,{'cell':[w,ht],'pivot':[64*q,150*q],'figureHeight':137*q,'working':{'figureHeight':400,'baseline':472}})
   ca=np.array(cell);assert not np.any(ca[:,:,:3][ca[:,:,3]==0]);assert not np.any(np.r_[ca[0,:,3],ca[-1,:,3],ca[:,0,3],ca[:,-1,3]])
   save(cell,f'direct-{w}/{i:02}-{h}.png');direct[w].append(cell);row['direct'][str(w)]={'alpha20Bounds':bbox(ca[:,:,3]>=20),'edgeAlpha':0,'hiddenRgb':0}
  if copy_assets:
   dst=HERE/f'{i:02}-{h}.png';assert not dst.exists();dst.write_bytes((out/f'working/{i:02}-{h}.png').read_bytes())
  metadata.append(row)
 font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',15)
 def flat(im,bg):return Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
 for theme,bg,ink in [('light','#eee8db','#151515'),('dark','#25272b','#eeeeee')]:
  board=Image.new('RGB',(2048,1080),bg);d=ImageDraw.Draw(board)
  foot=Image.new('RGB',(1600,500),bg);fd=ImageDraw.Draw(foot)
  for i,(h,im) in enumerate(zip(ORDER,frames)):
   x,y=i%4*512,i//4*540;d.text((x+5,y+4),f'{i} {h}',font=font,fill=ink);board.paste(flat(im,bg),(x,y+24))
   x,y=i%4*400,i//4*250;fd.text((x+5,y+4),f'{i} {h}',font=font,fill=ink);foot.paste(flat(im,bg).crop((160,370,360,480)).resize((400,220),Image.Resampling.NEAREST),(x,y+26))
  save(board,f'all-native-{theme}.png');save(foot,f'all-feet-{theme}.png')
  for w,ht in [(96,120),(64,80)]:
   board=Image.new('RGB',(8*210,30+ht*3+15),bg);d=ImageDraw.Draw(board)
   for i,(h,im) in enumerate(zip(ORDER,direct[w])):
    x=i*210;d.text((x+3,3),f'{i} {h}',font=font,fill=ink);pic=flat(im,bg);board.paste(pic,(x+3,27));board.paste(pic.resize((w*2,ht*2),Image.Resampling.NEAREST),(x+3,ht+35))
   save(board,f'all-direct-{w}-{theme}.png')
  for i,h in enumerate(ORDER):
   j=(i+1)%8;indices=[i,j,i];board=Image.new('RGB',(1190,730),bg);d=ImageDraw.Draw(board)
   d.text((8,5),f'{i} {h} -> {j} {ORDER[j]} -> {i} {h}; ordered keys, no inbetweens/time claim',font=font,fill=ink)
   for c,k in enumerate(indices):
    pic=flat(frames[k],bg);board.paste(pic.resize((256,256),Image.Resampling.NEAREST),(c*260,30));board.paste(pic.crop((160,370,360,480)).resize((400,220),Image.Resampling.NEAREST),(c*395,310))
    d.text((c*395+4,545),'actual96 +2xNN | actual64 +2xNN',font=font,fill=ink)
    for w,x in [(96,c*395),(64,c*395+240)]:
     im=flat(direct[w][k],bg);board.paste(im,(x,570));y0,y1=(88,120) if w==96 else (58,80)
     board.paste(im.crop((12,y0,w-8,y1)).resize((2*(w-20),2*(y1-y0)),Image.Resampling.NEAREST),(x+100 if w==96 else x+65,600))
   save(board,f'adjacent-{i:02}-{j:02}-{theme}.png')
 # No source renderer is invoked for fallback proposal; retain exact stop source choice pending review.
 recipe={'identity':'stadt-hannelore-sparkasse','scope':'eight planted own turn anchors, source candidate only','working':{'cell':[512,512],'pivot':[256,472],'figureHeight':400},'canonical':{'cell':[128,160],'pivot':[64,150],'figureHeight':136,'figureWorldHeight':1.6},'paintFigure':137,'clockwiseOrder':ORDER,'cardinalAnchors':{'down':0,'right':2,'up':4,'left':6},'interpolation':'none; actual eight paintings only','turnDurationMs':'not selected/native untested','records':metadata}
 write('turn-source.json',recipe)
 assert all(sha(ROOT/p)==h for p,h in pins.items())
 write('input-pins-after.json',{'pins':pins,'exactBeforeAfter':True})
 write('receipt.json',{'status':'SOURCE author candidate pending visual observations/independent review','inputPins':pins,'files':files.copy(),'workingFrames':8,'directFrames':16,'sourceDirections':ORDER,'noInbetweens':True})
 print(json.dumps({'working':8,'direct':16,'inputPins':len(pins),'receipt':sha(out/'receipt.json')}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--outdir',type=Path,required=True);p.add_argument('--copy-assets',action='store_true');a=p.parse_args();run(a.outdir,a.copy_assets)
