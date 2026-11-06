"""Ute raw-only replay, one explicitly leased/bounded stage per invocation.

Run through own run-stage.py. Generation never reads validation baseline or
selected/registered/working images. Expected products enter only finalvalidate.
"""
from pathlib import Path
import argparse,hashlib,json,os,shutil,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent;AUTHOR=HERE.relative_to(ROOT)
WORK=Path('output/street-redesign/ute-ruhe-end-to-end');ID='stadt-ute-ruhe'
SCRIPTS=['prepare-neutrals.py','prepare-profile-layers-v2.py','profile-motion-v2.py','pilot-motion.py','pilot-motion-v2.py','fit-adult-mouths.py','build-family-source.py','prepare-family-mouths.py','measure-source-cycle-v2.py','build-candidate.py','build-private-delivery.py','clean-rebuild.py']
DATA=['anatomy-controls-v1.json','profile-leg-controls-v2.json','lip-fits.json','pre-admission-person.json','new-motion-capability-plan.json','raw-cardinals-v1.png','raw-quarters-v1.png','profile-leg-repair-v2/raw-far-leg-parts-v1.png','reference-soeder-neutral.png','reference-herr-sandale-neutral.png','reference-frau-sandale-neutral.png']
DEPENDENCIES=[Path('tools')/n for n in ['build-street-character-sprites.py','build-street-mouths.py','build-street-motion-delivery.py']]+[Path('.agents/skills/animate-2d-characters/scripts')/n for n in ['painted_walk.py','harmonize_material.py']]+[Path('world3d.js')]
STAGES=['init','register','parts','fit','down','right','up','left','extras','merge','cycle','mouths','compile','delivery-init','delivery-build','delivery-bind','delivery-check','validate']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,d):p.write_text(json.dumps(d,indent=2)+'\n')
def main(a):
 mirror=a.mirror.resolve();out=a.outdir.resolve();assert mirror.name.startswith('ute-') and out.is_relative_to(ROOT/'output/ute-height')
 assert not mirror.is_relative_to(ROOT/'assets') and not ROOT.is_relative_to(mirror)
 out.mkdir(parents=True,exist_ok=True);target=out/(a.stage+'.json');assert not target.exists(),'Preserve prior replay stage'
 if a.stage=='init':
  assert not mirror.exists(),'Use an initially absent short own mirror'
  mirror.mkdir(parents=True);paths=[AUTHOR/n for n in SCRIPTS+DATA]+DEPENDENCIES;pins={}
  for p in paths:
   dest=mirror/p;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/p,dest);pins[p.as_posix()]=sha(dest)
  assert not (mirror/AUTHOR/'registered').exists() and not (mirror/WORK).exists()
  assert not (mirror/AUTHOR/'validation-baseline-v1.json').exists()
  write(out/'initial-pins.json',pins);write(target,{'status':'PASS_INIT_RAW_INPUTS_ONLY','mirrorInitiallyAbsent':True,'mirror':str(mirror),'copiedInputs':len(pins),'excluded':['validation baseline','registered','prepared-source','fitted mouth outputs','body cells','compiled/native/selected assets','current whole-cast registry'],'expectedProductsRead':False});print('Ute raw-only mirror initialized');return
 pins=json.loads((out/'initial-pins.json').read_text())
 for p,d in pins.items():assert sha(mirror/p)==d,('Raw input changed',p)
 if a.stage=='validate':
  for prior in STAGES[1:-1]:assert json.loads((out/(prior+'.json')).read_text())['status']=='PASS_GENERATION_STAGE',prior
  # This is the first expected product read in the entire replay.
  baseline=json.loads((HERE/'validation-baseline-v1.json').read_text());assert baseline['id']==ID
  private=mirror/WORK/'private-mirror-v1/assets/characters/residents'/ID/'delivery-v2'
  actual={n:sha(private/n) for n in baseline['files']};assert actual==baseline['files'],'Raw replay runtime bytes differ'
  body=mirror/WORK/'full-working-v1/body-index.json';assert sha(body)==baseline['bodyIndexSha256'],'Raw body/index differs'
  generated=json.loads(body.read_text());assert len(generated['cells'])==412 and generated['sourceFiles']==348
  unique={c['source']['file']:c['source']['sha256'] for c in generated['cells']};assert len(unique)==348
  for p,d in unique.items():assert sha(mirror/p)==d
  write(target,{'status':'PASS_RAW_ONLY_REPLAY','expectedProductsFirstRead':'Finalvalidate after17successful init/generation stages','runtimeAndPersonFiles':len(actual),'sourceCells':412,'uniqueSourceImages':348,'bodyIndexSha256':sha(body),'files':actual,'mirror':str(mirror),'inputPinsStable':True});print(json.dumps({'status':'PASS_RAW_ONLY_REPLAY','files':len(actual),'cells':412,'uniqueSourceImages':348}));return
 previous=STAGES[STAGES.index(a.stage)-1];prior=json.loads((out/(previous+'.json')).read_text())
 assert prior['status'] in ('PASS_INIT_RAW_INPUTS_ONLY','PASS_GENERATION_STAGE'),'Previous replay stage must have passed'
 if a.stage in ('register','parts','fit'):
  file={'register':'prepare-neutrals.py','parts':'prepare-profile-layers-v2.py','fit':'fit-adult-mouths.py'}[a.stage];args=[]
 elif a.stage in ('down','right','up','left','extras','merge'):
  file='build-family-source.py';args=['--section','turn-actions' if a.stage=='extras' else a.stage]
 elif a.stage=='cycle':file='measure-source-cycle-v2.py';args=[]
 elif a.stage=='mouths':file='prepare-family-mouths.py';args=[]
 elif a.stage=='compile':file='build-candidate.py';args=['--outdir',str(mirror/WORK/'compiled-v1'),'--stride-distance','11.65']
 else:
  assert a.stage.startswith('delivery-');file='build-private-delivery.py';args=['--stage',a.stage.split('-',1)[1]]
 command=[sys.executable,'-B',str(mirror/AUTHOR/file),*args];started=time.monotonic()
 write(target,{'status':'RUNNING','command':command,'expectedProductsRead':False})
 flags=getattr(subprocess,'CREATE_NO_WINDOW',0)|getattr(subprocess,'BELOW_NORMAL_PRIORITY_CLASS',0)
 try:
  with (out/(a.stage+'.stdout.txt')).open('w') as stdout,(out/(a.stage+'.stderr.txt')).open('w') as stderr:
   subprocess.run(command,cwd=mirror,env={**os.environ,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1','MKL_NUM_THREADS':'1'},creationflags=flags,stdout=stdout,stderr=stderr,check=True,timeout=55)
  for p,d in pins.items():assert sha(mirror/p)==d,('Raw input changed',p)
 except Exception as exc:
  write(target,{'status':'FAIL_PRESERVED','command':command,'error':repr(exc),'elapsedSeconds':time.monotonic()-started,'expectedProductsRead':False});raise
 write(target,{'status':'PASS_GENERATION_STAGE','command':command,'elapsedSeconds':time.monotonic()-started,'inputPinsStable':True,'expectedProductsRead':False});print(json.dumps({'stage':a.stage,'status':'PASS_GENERATION_STAGE'}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--stage',required=True,choices=STAGES);p.add_argument('--mirror',required=True,type=Path);p.add_argument('--outdir',required=True,type=Path);main(p.parse_args())
