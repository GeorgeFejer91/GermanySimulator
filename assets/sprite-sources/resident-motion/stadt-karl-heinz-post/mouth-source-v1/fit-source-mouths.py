"""Karl's measured own neutral lip pilot; source/CPU evidence only, no runtime writes."""
from pathlib import Path
import copy, hashlib, importlib.util, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[5]
SOURCE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/karl-post-mouth-source-v1'
SHEET=SOURCE/'registered-neutrals-v1.png'
ASSEMBLY=SOURCE/'registered-neutrals-v1.json'
HELPER=ROOT/'tools/build-street-mouths.py'
STANDING=ROOT/'assets/characters/street/stadt-karl-heinz-post-standing.webp'
ORDER=['down','front-right','right','rear-right','up','rear-left','left','front-left']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
# Five-point creases inspected on actual own neutral pixels. The moustache stays
# above the fixed upper contour; only the lower lip/jaw opens. No teeth invented.
FITS={
 'down':([[258,208],[264,207.5],[270,208],[276,208],[282,208.5]],[270,208],[24,0,0,8],[0,3.5,5.5,3.5,0]),
 'front-right':([[284,204],[290,203.5],[296,203.5],[302,204.5],[307,205.5]],[295,204.2],[23,0,0,7],[0,3,5,3,0]),
 'right':([[328.5,207],[331,206.5],[333.5,206],[335.5,205],[337,204.5]],[333,206],[14,-3,0,6],[0,1.8,3.2,2.2,0]),
 'left':([[173.5,205],[176,205.5],[178.5,206],[181,207],[183.5,207.5]],[178.5,206],[14,3.5,0,6],[0,2,3.2,1.8,0]),
 'front-left':([[199,204.5],[204.5,203.5],[210.5,203.5],[216.5,204.5],[221,205.5]],[210,204],[24,1.5,0,8],[0,3,5,3,0]),
 'standing':([[65.8,61.3],[67.8,60.9],[69.7,61.1],[71.7,61.3],[73.4,61.8]],[69.6,61.2],[7.6,.5,0,2.5],[0,1.1,1.65,1.1,0]),
}
def entry(name):
 points,center,axes,opening=FITS[name];standing=name=='standing';i=0 if standing else ORDER.index(name)
 origin=np.array([0,0] if standing else [(i%4)*512,(i//4)*512],float)
 points=np.array(points,float);lower=points+np.array([[0,d] for d in opening])
 path=STANDING if standing else SHEET;dims=[128,160] if standing else [2048,1024]
 global_points=lambda p:(np.array(p)+origin).round(6).tolist()
 return{'input':{'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':dims},
  'centerPx':global_points(center),'axesPx':axes,'cell':dims if standing else [512,512],
  'cellOriginPx':origin.astype(int).tolist(),'coordinateSystem':'Own source pixels, +X right and +Y down',
  'contoursPx':{k:global_points(v) for k,v in {'crease':points,'source_upper':points,'source_lower':points,'open_upper':points,'open_lower':lower}.items()},
  'width':[.015,.09] if name in ['left','right'] else [.025,.14],'teeth':0,
  'fitEvidence':{'status':'Manually inspected own painted lip beneath moustache; CPU candidate',
   'observation':'Fixed upper lip protects moustache; closed source and attached corners preserved. No pre-open cavity or teeth.'}}
def run():
 OUT.mkdir(parents=True,exist_ok=True)
 assert sha(SHEET)=='dab825e967d9b424db4b208a2c3bf87f5f1619b8553a67c99e58795e0ba99894'
 assert sha(STANDING)=='6c5a8a033a432a9cbac17df85bb2322a4b88a7edc54c870d818433a925900877'
 assembly=json.loads(ASSEMBLY.read_text())
 with Image.open(SHEET) as sheet:
  for name,record in assembly['inputs'].items():
   source=ROOT/record['file'];assert sha(source)==record['sha256'];x,y=record['cellOriginPx']
   assert np.array_equal(np.asarray(sheet.crop((x,y,x+512,y+512))),np.asarray(Image.open(source).convert('RGBA')))
 module=importlib.util.spec_from_file_location('karl_mouth_helper',HELPER);helper=importlib.util.module_from_spec(module);module.loader.exec_module(helper)
 registrations={name:entry(name) if name in FITS else None for name in ORDER};compiled={};checks={};font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',12)
 for name in [*ORDER,'standing']:
  e=entry(name) if name=='standing' else registrations[name]
  if e is None:compiled[name]=None;continue
  reg=helper.compile_registration(e);compiled[name]={k:reg[k] for k in ['rect','axes','profile']}
  original=Image.open(ROOT/e['input']['file']).convert('RGBA');x,y=e['cellOriginPx'];w,h=e['cell'];box=[x,y,x+w,y+h];cell=original.crop(box)
  local=copy.deepcopy(e);local['centerPx']=(np.array(e['centerPx'])-[x,y]).tolist();local['contoursPx']={k:(np.array(v)-[x,y]).tolist() for k,v in e['contoursPx'].items()};local['previewCropPx']=box
  cues={'inactive':cell,'owned-closed':helper.preview(local,reg,0),'open':helper.preview(local,reg,1)}
  for label,factor in [('round-lower-only',.5),('bite-lower-only',.15)]:
   variant=copy.deepcopy(reg);v=variant['profile'];v['open_lower']=[c+(d-c)*factor for c,d in zip(v['crease'],v['open_lower'])];cues[label]=helper.preview(local,variant,1)
  checks[name]={};base=np.asarray(cell)
  for label,im in cues.items():
   pixels=np.asarray(im);alpha=bool(np.array_equal(pixels[:,:,3],base[:,:,3]));changed=int(np.count_nonzero(np.any(pixels[:,:,:3]!=base[:,:,:3],axis=2)))
   assert alpha,(name,label);assert changed==0 if label in ['inactive','owned-closed'] else changed>0,(name,label,changed)
   checks[name][label]={'alphaExact':alpha,'changedRgbPixels':changed};im.save(OUT/f'{name}-{label}.png')
  cx,cy=local['centerPx'];radius=12 if name=='standing' else 36;crop=(max(0,int(cx)-radius),max(0,int(cy)-radius//2),min(w,int(cx)+radius+1),min(h,int(cy)+radius//2+2));zoom=12 if name=='standing' else 6
  tw,th=(crop[2]-crop[0])*zoom,(crop[3]-crop[1])*zoom
  for theme,color in [('light','#eee8db'),('dark','#25272b')]:
   board=Image.new('RGB',(tw*len(cues),th+26),color);draw=ImageDraw.Draw(board)
   for i,(label,im) in enumerate(cues.items()):
    part=im.crop(crop).resize((tw,th),Image.Resampling.NEAREST);board.paste(part,(i*tw,26),part);draw.text((i*tw+3,5),label,font=font,fill='#eee8db' if theme=='dark' else '#222')
   board.save(OUT/f'{name}-all-cues-{theme}.png')
 record={'schemaVersion':1,'status':'Own source lip pilot, CPU only; no runtime or GPU acceptance',
  'inputHashes':{p.relative_to(ROOT).as_posix():sha(p) for p in [SHEET,ASSEMBLY,STANDING,HELPER,Path(__file__)]},
  'registrations':registrations,'standingRegistration':entry('standing'),'compiledSourceCells':{k:v for k,v in compiled.items() if k!='standing'},'compiledStanding':compiled['standing'],'cpuChecks':checks,
  'nullReasons':{k:'Rear or rear-quarter source has no visible mouth' for k in ['rear-right','up','rear-left']},
  'limits':['Direct own-source painted creases; CPU opening approximations only.','Lower-only round/bite previews do not certify actual runtime multi-axis shader.','Moving transport, encoded variants, full gestures, media clocks and physical/listening checks remain unrun.']}
 (SOURCE/'source-mouth-profiles-v1.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8',newline='\n')
 print(json.dumps({'profiles':len(FITS),'rearNulls':3,'compiledSha256':sha(SOURCE/'source-mouth-profiles-v1.json'),'cpuChecks':checks}))
if __name__=='__main__':run()
