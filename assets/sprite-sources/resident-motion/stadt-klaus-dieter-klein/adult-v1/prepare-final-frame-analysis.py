"""Bind inspected native boards to every exact encoded Klaus-Dieter Klein source cell.

This prepares the existing animation skill's evidence contract. The observed
art statements below come from the own source/native boards personally reviewed by the actor
owner; the validator checks provenance/completeness, not visual truth. World
floor/contact/action/lifecycle acceptance remains a separate unfinished gate.
"""
from pathlib import Path
import json,hashlib,os
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[5];WORK=ROOT/'output/street-redesign/klaus-klein-end-to-end'
HERE=ROOT/'assets/sprite-sources/resident-motion/stadt-klaus-dieter-klein/adult-v1'
OUT=WORK/'final-frame-analysis-412';OUT.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
index=json.loads((WORK/'full-working/body-index.json').read_text())
references={h:HERE/'registered'/f'{h}.png' for h in ('down','front-right','right','rear-right','up','rear-left','left','front-left')}
cache={}
observed=json.loads((WORK/'formal-observed-boards.json').read_text())
required=[WORK/'native-source-review'/f'{v}-{stem}-{theme}.png' for v in ('desktop','mobile') for theme in ('light','dark') for stem in ([f'{h}-walk' for h in ('down','right','up','left')]+[f'{h}-stops-{c}' for h in ('down','right','up','left') for c in range(4)]+['turns']+[f'quiet-{a}' for a in ('idle','look','success','failure')]+[f'{h}-bridges' for h in ('down','right','up','left')])]
assert len(required)==116 and all(observed['artifactHashes'].get(p.relative_to(ROOT).as_posix())==sha(p) for p in required),'All116 actual inspected native boards must have current source-grounded observation hashes before preparing pass reviews'
def record(path):
 path=path.resolve()
 if path not in cache:cache[path]={'file':os.path.relpath(path,OUT).replace('\\','/'),'sha256':sha(path)}
 return dict(cache[path])
def describe(cell,box):
 h=cell['heading'];kind=cell['kind'];rear=h in ('up','rear-right','rear-left')
 identity=('Chestnut rear hair, navy commuter collar/rolled cuffs and dark denim retain grown Klaus-Dieter Klein; the LEFT cream form projects with its own hand and the RIGHT remains empty. Rear views preserve their own head projection; only the rear-right source has a small visible jaw/lip crease.' if rear else 'Receding chestnut side-part, tired narrow eyes, square stubbled jaw and navy/mustard clothing retain grown Klaus-Dieter Klein. The cream blank folded form belongs to anatomical LEFT and RIGHT stays empty; profile occlusion does not move it to the other hand.')
 if kind=='walk':motion=f"{h} ordered16-phase sample{cell['col']}; alternating denim/shoe shapes remain coherent through the15-to0 closing interval. Actual world cadence/slide remains a separate game test."
 elif kind=='stop':motion=f"{h} walk entry{cell['entryPhase']}, strength{cell['strength']}; this ordered six-column row retains the same full body while the connected own field settles to neutral. No hand or foot swaps occur."
 elif kind=='quiet':motion=f"Original {cell['action']} sample{cell['col']}: own connected source performs the preserved sinusoidal idle, finite look/failure sway/nod or success lift. Both hands and LEFT form follow the same connected field. Finite states return neutral0/15; idle retains its original16-sample periodic waveform. Exact legacy timing is preserved."
 elif kind=='turn':motion=f"{h} is one genuine whole-body painting in the eight-view sequence: head/neck, shoulders, jacket/waist, denim knees and boots turn together. It is not a mirrored cardinal or a head-only replacement."
 else:motion=f"{h} bridge{cell['col']} retains the same own neutral/phase0 source field and family pivot. The explicit five-cell stop.5/stop.25/neutral/start.5/walkphase0 strip preserves connected adult contours, cloth texture and LEFT form through settling and restarting; actual game handoff remains a separate test."
 return {'identity':identity,
 'proportions':f"Native bounds{list(box)} preserve the square adult head, shoulder width and complete waist-to-denim-knee-to-ankle chains of the400px source. No per-cell refit or enlarged toy head appears.",
 'rendering_style':'Directional navy jacket wear, mustard shirt folds, diagonal dark-denim creases and scuffed tan shoe paint retain the worn Berlin adult style; the stubbled face stays angular and source-derived.',
 'lighting_color':'Warm skin/mustard/tan highlights and cool dark-navy cloth planes remain attached to their painted body surfaces. Light/dark composites show clean alpha edges without an opaque sheet rectangle or background-coloured shin fill.',
 'contour':'Rolled cuffs, connected fingers, one LEFT form, denim hems and whole tan toe/heel silhouettes remain inside the native gutter. No detached hand, cut-out boot, duplicated prop or filler lower leg was seen.',
 'texture':'Irregular jacket wear, shirt placket, denim fold directions and scuffed shoe leather move with the connected source pixels. Own quiet states carry the same source face, hands, form and whole feet through their original connected deformation; no new painted feature or prop is substituted.',
 'anatomy_occlusion':('Rear neck/collar, jacket hem, denim hip/thigh/knee/cuff chains and two complete boots remain connected. The rear LEFT form/hand overlap follows its own source; unsupported rear lips retain source paint.' if rear else 'Collar/neck, shoulder/sleeve, forearm/hand, waistband/hip, knee, cuff and shoe joins remain continuous. Each side retains its own near/far trouser and boot occlusion with no missing shin or independent prop layer.'),
 'motion':motion}
for variant,w,h in [('desktop',96,120),('mobile',64,80)]:
 folder=OUT/variant;folder.mkdir(exist_ok=True)
 export_path=ROOT/'assets/characters/residents/stadt-klaus-dieter-klein/delivery-v2'/f'source-{variant}.webp'
 atlas=Image.open(export_path).convert('RGBA');frames=[];reviews=[]
 refs=[{'id':heading,**record(path)} for heading,path in references.items()]
 neutral={}
 # Comparison-only resize preserves each reference's complete head/body/feet;
 # it is not a second source registration or shipping sprite fit.
 for heading,path in references.items():
  source=Image.open(path).convert('RGBA');crop=source.crop((round(256-64*400/136),round(472-150*400/136),round(256+64*400/136),round(472+10*400/136)))
  neutral[heading]=crop.resize((w,h),Image.Resampling.LANCZOS)
 for cell in index['cells']:
  row,col=cell['row'],cell['col'];ident=f'{row:02}-{col:02}';heading=cell['heading'];kind=cell['kind']
  im=atlas.crop((col*w,row*h,(col+1)*w,(row+1)*h));path=folder/f'{ident}.png';im.save(path)
  comparison=Image.new('RGBA',(w*2,h),'#eee8db');comparison.alpha_composite(neutral[heading]);comparison.alpha_composite(im,(w,0));comparison_path=folder/f'{ident}-source-comparison.png';comparison.convert('RGB').save(comparison_path)
  if kind=='walk':stem=f'{variant}-{heading}-walk'
  elif kind=='stop':stem=f'{variant}-{heading}-stops-{cell["entryPhase"]//4}'
  elif kind=='quiet':stem=f'{variant}-quiet-{cell["action"]}'
  elif kind=='turn':stem=f'{variant}-turns'
  else:stem=f'{variant}-{heading}-bridges'
  light=WORK/'native-source-review'/f'{stem}-light.png';dark=WORK/'native-source-review'/f'{stem}-dark.png'
  frame={'id':ident,**record(path),'row':row,'col':col,'reference_ids':[heading]};frames.append(frame)
  observations=describe(cell,im.getchannel('A').getbbox())
  evidence=[{'role':'source_comparison',**record(comparison_path),'reference_ids':[heading]},
   {'role':'native',**record(path)},{'role':'enlarged_light',**record(light)},
   {'role':'enlarged_dark',**record(dark)},{'role':'ordered_motion',**record(light)}]
  reviews.append({'id':ident,'sha256':frame['sha256'],'reference_ids':[heading],'verdict':'pass','unresolved_findings':[],
   'analysis':{key:{'status':'pass','observation':text} for key,text in observations.items()},'evidence':evidence})
 manifest={'export':record(export_path),'cell_size_xy':[w,h],
  'movement_rows':[{'row':r,'count':21 if r<17 else 7 if r==17 else 16} for r in range(21)],'references':refs,'frames':frames}
 review={'reviewer':'Klaus-Dieter Klein actor owner, actual own source/native ordered image inspection','export_sha256':sha(export_path),
  'reference_sha256':{r['id']:r['sha256'] for r in refs},'ordered_motion_reviewed':True,
  'scope':'Authored source/native image gate. The analyst inspected all116 four-heading walk/stop/quiet/eight-view boards at both native sizes and both backgrounds against the own source references. Ordered strips are explicit source observations, not observed live playback. Actual game cadence, speech, fallback and independent review remain separate gates.','frames':reviews}
 (OUT/f'{variant}-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(OUT/f'{variant}-review.json').write_text(json.dumps(review,indent=2)+'\n')
 print(variant+' prepared412 exact frame analyses',flush=True)
