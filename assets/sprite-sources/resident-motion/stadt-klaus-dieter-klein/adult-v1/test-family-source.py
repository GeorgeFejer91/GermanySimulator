"""Own gait/stop continuity and quiet-state pose guards on exact source paint."""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
INDEX=ROOT/'output/street-redesign/klaus-klein-end-to-end/full-working/body-index.json'
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def run():
 index=json.loads(INDEX.read_text());assert index['selectedCells']==412 and not index['missingQuarterPaint']
 cells={(c['row'],c['col']):c for c in index['cells']};pilot=load('klaus_source_check',HERE/'pilot-motion.py')
 def read(c):
  p=ROOT/c['source']['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==c['source']['sha256'];return Image.open(p).convert('RGBA')
 result={}
 for row,heading in enumerate(('down','right','up','left')):
  walk=[read(cells[row,c]) for c in range(16)];assert len({im.tobytes() for im in walk})==16
  assert pilot.render(heading,math.tau)[0].tobytes()==walk[0].tobytes()
  neutral=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
  assert read(cells[row+4,2]).tobytes()==neutral.tobytes();assert read(cells[row+4,4]).tobytes()==walk[0].tobytes()
  for phase in range(16):
   stop=next(c for c in index['cells'] if c['kind']=='stop' and c['heading']==heading and c['entryPhase']==phase and c['strength']==1)
   assert read(stop).tobytes()==walk[phase].tobytes()
  result[heading]={'distinctPhases':16,'loopExact':True,'phaseStopEntriesExact':16,'neutralExact':True}
 markers={}
 for heading,row,point,travel in [('right',1,(232,464),1),('left',3,(296,459),-1)]:
  own=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA');rgba=own.getpixel(point);assert rgba[3]>=200
  markers[heading]=[]
  for phase in (4,8,12):
   x=round(point[0]+travel*10*(2-4*phase/16));actual=read(cells[row,phase]).getpixel((x,point[1]));assert actual==rgba
   markers[heading].append({'phase':phase,'ownSourcePoint':point,'ownSourceRGBA':rgba,'exactOutputPoint':[x,point[1]]})
 source=Image.open(HERE/'registered/down.png').convert('RGBA')
 quiet=load('klaus_original_quiet_check',HERE/'quiet-motion.py');quiet_result={}
 expected_fields={'idle':(1.2,1,0),'look':(4,4,0),'success':(2,-3,10),'failure':(4,4,0)}
 for action,values in expected_fields.items():
  cfg=quiet.settings(action);assert tuple(cfg[k] for k in ['sway_pixels','nod_pixels','lift_pixels'])==values
  assert cfg['neck_y']==154 and cfg['hip_y']==304
 for action,row in quiet.ROWS.items():
  expected=quiet.sequence(source,action);actual=[read(cells[row,c]) for c in range(16)]
  assert all(a.tobytes()==b.tobytes() for a,b in zip(actual,expected)),action
  assert all(cells[row,c]['action']==action for c in range(16))
  assert actual[0].tobytes()==source.tobytes()
  if action!='idle':assert actual[-1].tobytes()==source.tobytes()
  assert any(im.tobytes()!=source.tobytes() for im in actual[1:15])
  quiet_result[action]={'row':row,'exactOriginalPlantedActionFrames':16,'neutralFirst':True,'neutralLast':action!='idle','nativeLipTransportRequired':True}
 assert read(cells[13,7]).tobytes()!=read(cells[18,7]).tobytes()!=read(cells[19,7]).tobytes()
 assert all(read(cells[18,c]).tobytes()==read(cells[20,c]).tobytes() for c in range(16)),'Original look/failure share same positive envelope'
 preserved=json.loads((HERE/'movement-preservation.json').read_text())
 for slot,digest in preserved['sourceCellPins'].items():
  row,col=map(int,slot.split(':'));assert cells[row,col]['source']['sha256']==digest
 print(json.dumps({'movement':result,'actualOwnRGBSoleMarkers':markers,'originalQuietPerformances':quiet_result,'originalLookFailureEnvelopeExact':True,'original348MovementSourcesExact':True}))
if __name__=='__main__':run()
