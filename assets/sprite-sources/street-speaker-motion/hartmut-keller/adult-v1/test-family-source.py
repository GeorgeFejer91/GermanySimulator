"""Meaningful own-source closure/stop/action ownership checks, not art approval."""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
INDEX=ROOT/'output/street-redesign/hartmut-keller-end-to-end/full-working/body-index.json'
def module(p):
 s=importlib.util.spec_from_file_location('hartmut_source_test',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 index=json.loads(INDEX.read_text());assert index['selectedCells']==380 and not index['missingQuarterPaint']
 cells={(c['row'],c['col']):c for c in index['cells']};pilot=module(HERE/'pilot-motion.py');family=module(HERE/'build-family-source.py')
 def read(c):
  p=ROOT/c['source']['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==c['source']['sha256'];return Image.open(p).convert('RGBA')
 results={}
 for i,heading in enumerate(('down','right','up','left')):
  walks=[read(cells[i,c]) for c in range(16)];assert len({x.tobytes() for x in walks})==16
  closure=pilot.render(heading,math.tau,1)[0];assert closure.tobytes()==walks[0].tobytes(),heading
  neutral=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA');assert read(cells[i+4,2]).tobytes()==neutral.tobytes()
  assert read(cells[i+4,4]).tobytes()==walks[0].tobytes()
  for phase in range(16):
   stop=next(c for c in index['cells'] if c['kind']=='stop' and c['heading']==heading and c['entryPhase']==phase and c['strength']==1)
   assert read(stop).tobytes()==walks[phase].tobytes()
  results[heading]={'distinct':16,'loopExact':True,'phaseStopEntriesExact':16,'neutralExact':True}
 source=np.array(Image.open(HERE/'registered/down.png').convert('RGBA'))
 assert all(np.array_equal(np.array(read(cells[18,col])),source) for col in range(16)), 'Neutral duration strip must contain exact own neutral duplicates'
 for col in range(16):
  rgba=np.array(read(cells[13,col]));assert np.array_equal(rgba[72:143,223:285],source[72:143,223:285]);assert np.array_equal(rgba[258:],source[258:])
 assert read(cells[13,8]).tobytes()!=source.tobytes(), 'Own radio/notepad emphasis must actually change paint'
 assert read(cells[13,0]).tobytes()==read(cells[13,15]).tobytes()==source.tobytes()
 print(json.dumps({'movement':results,'actionFaceFeetExact':16,'gestureClosureExact':True}))
if __name__=='__main__':run()
