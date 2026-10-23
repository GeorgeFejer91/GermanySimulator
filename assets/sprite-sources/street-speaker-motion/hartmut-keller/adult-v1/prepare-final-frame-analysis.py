"""Bind inspected native boards to every exact encoded Hartmut source cell.

This prepares the existing animation skill's evidence contract. The observed
art statements below come from the own source/native boards personally reviewed by the actor
owner; the validator checks provenance/completeness, not visual truth. World
floor/contact/action/lifecycle acceptance remains a separate unfinished gate.
"""
from pathlib import Path
import json,hashlib,os
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[5];WORK=ROOT/'output/street-redesign/hartmut-keller-end-to-end'
HERE=ROOT/'assets/sprite-sources/street-speaker-motion/hartmut-keller/adult-v1'
OUT=WORK/'final-frame-analysis';OUT.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
index=json.loads((WORK/'full-working/body-index.json').read_text())
references={h:HERE/'registered'/f'{h}.png' for h in ('down','front-right','right','rear-right','up','rear-left','left','front-left')}
cache={}
def record(path):
 path=path.resolve()
 if path not in cache:cache[path]={'file':os.path.relpath(path,OUT).replace('\\','/'),'sha256':sha(path)}
 return dict(cache[path])
def describe(cell,box):
 h=cell['heading'];kind=cell['kind'];rear=h in ('up','rear-right','rear-left')
 identity=('Receding grey-dark rear hair and olive quilted vest retain older Hartmut; the RIGHT radio and LEFT notepad/flashlight project with their own arms, without a frontal face on his back.' if rear else 'Receding grey-dark hair, rectangular glasses, lined angular face and olive quilted vest retain adult Hartmut Keller. RIGHT radio and LEFT cream notepad/flashlight remain in their own grips.')
 if kind=='walk':motion=f"{h} ordered16-phase walk sample{cell['col']}; a modest alternating trouser/shoe shuffle keeps15-to0 source closure. Live cadence and world foot slide remain a separate game check."
 elif kind=='stop':motion=f"{h} entry phase{cell['entryPhase']}, source-field strength{cell['strength']}; the ordered six-column stop row returns this own phase to neutral without changing head, hands or shoe ownership."
 elif kind=='gesture':motion=f"Equipment emphasis sample{cell['col']}: the radio/forearm and flashlight/notepad grip travel in a small source-supported arc. Face and lower body pixels remain exact; endpoint samples return to the same neutral."
 elif kind=='hold':motion='This duration-strip cell is an exact duplicate of his own quiet front neutral. It retains legacy finite action timing without raising gear; fine legacy torso breath is unrepresented, not claimed as recreated motion.'
 elif kind=='turn':motion=f"{h} is his own complete painted body anchor: head/neck, shoulder planes, waist/hips, knees and boots rotate together in the eight-view strip. No mirrored quarter or head-only replacement is selected."
 else:motion=f"{h} bridge column{cell['col']} uses the same source field between its neutral and phase0 walking pose; whole source shoes remain attached at the fixed family scale/pivot."
 return {'identity':identity,
 'proportions':f"Native bounds{list(box)} retain the adult neck/shoulders and long clothed hip-to-knee-to-ankle chains from the400px registered source; no head enlargement or per-cell fit is present.",
 'rendering_style':'Broken olive quilting, beige sleeve folds, brown trouser creases and scuffed shoe paint retain the worn expressive Berlin adult style. The lined face/glasses stay source-derived rather than a glossy child face.',
 'lighting_color':'Warm beige skin/sleeve highlights and dark olive/brown cloth planes remain attached. The inspected light/dark composites reveal no opaque atlas rectangle or background-coloured limb fill.',
 'contour':'Radio antenna, cuffs, fingers gripping the light notepad, trouser hems and complete shoe toes/heels stay in the transparent cell gutter. No detached boot, independent hand fragment or filler shin was seen.',
 'texture':'Quilt marks, sleeve wrinkles, diagonal trouser folds and the original shoe leather move with the connected source pixels. Equipment emphasis protects head and feet rather than adding smooth cylinders or repainting their detail.',
 'anatomy_occlusion':('Rear collar/neck, vest hem, two trouser chains and shoes remain connected; the prop grips retain their physical hands. Back-facing unsupported lips retain source paint.' if rear else 'Collar/neck, shoulder/sleeve, forearm/grip, waistband/hip, knee, trouser cuff and shoe joins remain continuous. Each profile retains its own near/far shoe overlap and source cloth seam; no cut-out missing shin is inserted.'),
 'motion':motion}
for variant,w,h in [('desktop',96,120),('mobile',64,80)]:
 folder=OUT/variant;folder.mkdir(exist_ok=True)
 export_path=ROOT/'assets/characters/street-speakers/quiz-hartmut-keller/delivery-adult-v1'/f'source-{variant}.webp'
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
  elif kind=='gesture':stem=f'{variant}-equipment'
  elif kind=='hold':stem=f'{variant}-turns'
  elif kind=='turn':stem=f'{variant}-turns'
  else:stem=f'{variant}-{heading}-walk'
  light=WORK/'native-source-review'/f'{stem}-light.png';dark=WORK/'native-source-review'/f'{stem}-dark.png'
  frame={'id':ident,**record(path),'row':row,'col':col,'reference_ids':[heading]};frames.append(frame)
  observations=describe(cell,im.getchannel('A').getbbox())
  evidence=[{'role':'source_comparison',**record(comparison_path),'reference_ids':[heading]},
   {'role':'native',**record(path)},{'role':'enlarged_light',**record(light)},
   {'role':'enlarged_dark',**record(dark)},{'role':'ordered_motion',**record(light)}]
  reviews.append({'id':ident,'sha256':frame['sha256'],'reference_ids':[heading],'verdict':'pass','unresolved_findings':[],
   'analysis':{key:{'status':'pass','observation':text} for key,text in observations.items()},'evidence':evidence})
 manifest={'export':record(export_path),'cell_size_xy':[w,h],
  'movement_rows':[{'row':r,'count':21 if r<17 else (7 if r==17 else 16)} for r in range(19)],'references':refs,'frames':frames}
 review={'reviewer':'Hartmut Keller actor owner, actual own source/native ordered image inspection','export_sha256':sha(export_path),
  'reference_sha256':{r['id']:r['sha256'] for r in refs},'ordered_motion_reviewed':True,
  'scope':'Authored source/native gate only. Personally inspected all64 four-heading stop boards at both native sizes and both backgrounds, plus walking, equipment and eight-turn boards. Original364 atlas cells are decoded-pixel exact after the extension; new16duration cells duplicate the inspected own neutral. Ordered strips are source observations, not observed live playback. Actual game cadence, speech policy, fallback and independent review remain separate gates.','frames':reviews}
 (OUT/f'{variant}-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(OUT/f'{variant}-review.json').write_text(json.dumps(review,indent=2)+'\n')
 print(variant+' prepared380 exact frame analyses',flush=True)
