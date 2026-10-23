"""Reproducibly pack Sabine's complete adult source family; no registry write."""
from pathlib import Path
from copy import deepcopy
import hashlib,importlib.util,json,argparse,math
from PIL import Image
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/sabine-end-to-end'
ID='quiz-sabine-krueger';ORDER=('down','right','up','left')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def write(p,d):p.write_text(json.dumps(d,separators=(',',':'),allow_nan=False)+'\n')
def run(args):
 body_path=WORK/'full-working/body-index.json';mouth_path=WORK/'family-mouths/mouths-working.json'
 body=json.loads(body_path.read_text());mouth=json.loads(mouth_path.read_text())
 assert body['identity']==mouth['identity']==ID
 assert not body['missingQuarterPaint'] and not mouth['missingFits']
 assert body['grid']==mouth['grid']==[21,18] and len(body['cells'])==mouth['selectedCells']==364
 assert args.stride_distance>0 and math.isfinite(args.stride_distance)
 family=load('sabine_adult_family_layout',HERE/'build-family-source.py');street=load('sabine_adult_packer',ROOT/'tools/build-street-character-sprites.py')
 inputs={}
 def pin(p,expected=None):
  digest=sha(p);assert expected is None or expected==digest,str(p)
  inputs[p.relative_to(ROOT).as_posix()]=digest
 for path in [Path(__file__),body_path,mouth_path,HERE/'pre-admission-person.json',ROOT/'tools/build-street-character-sprites.py']:pin(path)
 for document in [body,mouth]:
  for rel,digest in document['inputPins'].items():pin(ROOT/rel,digest)
 sources={}
 for cell in body['cells']:
  slot=(cell['row'],cell['col']);assert slot not in sources
  pin(ROOT/cell['source']['file'],cell['source']['sha256']);sources[slot]=cell
 movement,gestures,stops=family.layout();assert set(sources)==movement|gestures|set(stops)
 out=args.outdir.resolve();assert out.is_relative_to(ROOT/'output');out.mkdir(parents=True,exist_ok=False)
 base='./assets/characters/street-speakers/'+ID+'/delivery-v2/';variants={};checks={}
 for name,w,h in [('desktop',96,120),('mobile',64,80)]:
  q=w/128;sheet=Image.new('RGBA',(21*w,18*h));gutters=[]
  for (row,col),cell in sources.items():
   source=Image.open(ROOT/cell['source']['file']).convert('RGBA')
   im=street.export_cell(source,{'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}})
   box=im.getchannel('A').getbbox();assert box
   gutters.append(min(box[0],box[1],w-box[2],h-box[3]));sheet.paste(im,(col*w,row*h))
  assert min(gutters)>=2
  path=out/f'source-{name}.webp';sheet.save(path,lossless=True,exact=True,method=4)
  assert Image.open(path).convert('RGBA').tobytes()==sheet.tobytes()
  variants[name]={'file':base+path.name,'sha256':sha(path),'width':sheet.width,'height':sheet.height}
  checks[name]={'minimumGutter':min(gutters),'selectedCells':364,'decodedExact':True,'bytes':path.stat().st_size}
 standing_path=WORK/'adult-mouth-fit/standing-candidate.png';pin(standing_path)
 standing=Image.open(standing_path).convert('RGBA');standing.save(out/'standing.webp',lossless=True,exact=True,method=4)
 assert Image.open(out/'standing.webp').convert('RGBA').tobytes()==standing.tobytes()
 standing_meta={'file':base+'standing.webp','sha256':sha(out/'standing.webp'),'width':128,'height':160}
 write(out/'mouths-v1.json',{'schemaVersion':1,'id':ID,'cell':[128,160],'grid':[21,18],'sources':{'standing':standing_meta['sha256'],**{n:v['sha256'] for n,v in variants.items()}},'standing':mouth['standing'],'frames':mouth['frames']})
 walks={d:{'row':i,'frames':16,'frame_ms':60,'loop':True} for i,d in enumerate(ORDER)}
 bridges={d:{'row':i+4,'stop_cols':[0,1,2],'start_cols':[3,4],'frame_ms':70} for i,d in enumerate(ORDER)}
 turns=[{'row':8,'col':i} for i in range(8)];anchors={d:i*2 for i,d in enumerate(ORDER)}
 transitions={a+'-to-'+b:{'frames':street.paint.plan_transition(a,b,walks,bridges,turns,anchors,turn_ms=85)} for a in ORDER for b in ORDER if a!=b}
 settles={d:{str(phase):{'frames':[{'row':r,'col':c,'ms':70} for r,c in stops[(i*16+phase)*4:(i*16+phase+1)*4]]+[{'row':i+4,'col':2,'ms':70}]} for phase in range(16)} for i,d in enumerate(ORDER)}
 states={n:{'row':13,'col':0,'durations_ms':[80]*16,'loop':False,'next':'neutral'} for n in ('greet','work','review')}
 states.update({n:{'row':4,'col':2,'durations_ms':[ms],'loop':False,'next':'neutral'} for n,ms in [('look',80),('wait',600),('success',300),('failure',300)]})
 assert sha(HERE/'pre-admission-person.json')=='97d162ce7ca6f7798b2f02d4468dd218dcf8d28813c7442457bebf55067e754c'
 old=json.loads((HERE/'pre-admission-person.json').read_text());assert old['id']==ID
 person={k:deepcopy(old[k]) for k in ('id','aliases','cell','pivot','figureHeight')}
 person.update(figureWorldHeight=2.33,standing=standing_meta,standingOnly=False,grid=[21,18],strideDistance=args.stride_distance,variants=variants,
  clips={d:{'offset':i*21,'count':16,'seconds':.96} for i,d in enumerate(ORDER)},
  atlasMotion={'schemaVersion':1,'walks':walks,'bridges':bridges,'transitions':transitions,'settles':settles,'neutral':{'row':4,'col':2},'interactions':{'neutral':{'row':4,'col':2},'states':states}},
  mouthPaint={'file':base+'mouths-v1.json','sha256':sha(out/'mouths-v1.json')})
 person['clips']['idle']={'offset':4*21+2,'count':1,'seconds':1};write(out/'person.json',person)
 for rel,digest in inputs.items():assert sha(ROOT/rel)==digest,rel
 receipt={'status':'PRIVATE PACKED CANDIDATE native and game pending','id':ID,'inputPins':inputs,'nativeChecks':checks,'outputs':{n:sha(out/n) for n in ['standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json','person.json']}}
 write(out/'compile-receipt.json',receipt);print(json.dumps(checks))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--outdir',type=Path,required=True);p.add_argument('--stride-distance',type=float,required=True);run(p.parse_args())
