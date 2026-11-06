"""Rebuild Hildegard's intact-shoe family from raw paint, one guarded step.

Expected products are first read by the baseline/validate steps after every
generation step. The existing run-stage wrapper owns each bounded kernel job.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,os,shutil,time
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
AUTHOR=HERE.relative_to(ROOT);ID='crowd-hildegard-brotzeit'
WORK=Path('output/street-redesign/hildegard-brotzeit-end-to-end/layered-v2/source01')
PRIVATE=Path('output/hil-v2-private-r01');ASSET=Path('assets/characters/residents')/ID/'delivery-v2'
SCRIPTS=('prepare-neutrals.py','prepare-profile-layers-v2.py','profile-motion-v2.py','pilot-motion.py',
 'build-family-source.py','fit-adult-mouths.py','prepare-family-mouths-v2.py','build-family-source-v2.py',
 'measure-source-cycle-v2.py','build-candidate-v2.py','build-private-delivery-v3.py','clean-rebuild-v2.py')
INPUTS=[AUTHOR/n for n in (*SCRIPTS,'lip-fits.json','pre-admission-person.json','new-motion-capability-plan.json','profile-leg-controls-v2.json',
 'raw-cardinals-v3.png','raw-quarters-v3.png','reference-soeder-neutral.png','reference-herr-sandale-neutral.png','reference-frau-sandale-neutral.png')]
INPUTS += [AUTHOR/'profile-leg-repair-v2'/n for n in ('raw-far-leg-parts-v1.png','far-leg-request-v1.json','far-leg-receipt-v1.json')]
INPUTS += [Path('tools')/n for n in ('build-street-character-sprites.py','build-street-mouths.py','build-street-motion-delivery.py')]
INPUTS += [Path('.agents/skills/animate-2d-characters/scripts')/n for n in ('painted_walk.py','harmonize_material.py')]+[Path('world3d.js')]
STEPS=('register','parts','fit','body-down','body-right','body-up','body-left','body-turn-actions','body-finalize','mouths','cycle','compile','packet-init','packet-build','packet-bind','packet-check')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def write(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,indent=2,allow_nan=False)+'\n')
def load(name,p):
 spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def cycle_semantics(report):
 result=json.loads(json.dumps(report));del result['pins']['world3d.js'];return result
def job_limit():
 import ctypes
 from ctypes import wintypes as W
 class Basic(ctypes.Structure):_fields_=[('processTime',ctypes.c_longlong),('jobTime',ctypes.c_longlong),('flags',W.DWORD),('minWorking',ctypes.c_size_t),('maxWorking',ctypes.c_size_t),('active',W.DWORD),('affinity',ctypes.c_size_t),('priority',W.DWORD),('scheduling',W.DWORD)]
 class IO(ctypes.Structure):_fields_=[(n,ctypes.c_ulonglong) for n in ('readOps','writeOps','otherOps','readBytes','writeBytes','otherBytes')]
 class Extended(ctypes.Structure):_fields_=[('basic',Basic),('io',IO),('processMemory',ctypes.c_size_t),('jobMemory',ctypes.c_size_t),('peakProcessMemory',ctypes.c_size_t),('peakJobMemory',ctypes.c_size_t)]
 kernel=ctypes.WinDLL('kernel32',use_last_error=True);kernel.QueryInformationJobObject.argtypes=[W.HANDLE,ctypes.c_int,ctypes.c_void_p,W.DWORD,ctypes.c_void_p]
 limits=Extended();assert kernel.QueryInformationJobObject(None,9,ctypes.byref(limits),ctypes.sizeof(limits),None)
 assert limits.jobMemory==384*1024**2 and limits.basic.flags&0x2200==0x2200
 assert all(os.environ.get(n)=='1' for n in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS'))
 return {'wholeJobPrivateCapMiB':384,'installedJobFlags':limits.basic.flags,'oneProcessNoNestedChild':True}

def main(a):
 mirror=a.mirror.resolve();out=a.outdir.resolve();state_path=out/'report.json';limits=job_limit()
 assert len(str(mirror))<65 and mirror.is_relative_to(Path('C:/Users/cogpsy-vrlab/.codex/tmp'))
 assert out.is_relative_to(ROOT/'output/hildegard-height') and out!=ROOT/'output/hildegard-height'
 if a.step=='init':
  assert not mirror.exists() and not out.exists(),'Preserve previous raw replays'
  mirror.mkdir(parents=True);pins={}
  for rel in INPUTS:
   target=mirror/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/rel,target);pins[rel.as_posix()]=sha(target)
  state={'status':'RAW_ONLY_MIRROR_READY','mirror':str(mirror),'mirrorInitiallyAbsent':True,'initialInputs':pins,'steps':[],
   'expectedStepOrder':STEPS,'resourceContract':limits,'authoredHeight':2.33,'authoredStride':11.65,
   'excluded':['registered paint','extracted profile parts','working body/mouth paint','selected/runtime images/person','current registry','expected products','validation baseline','cache'],
   'baselineRole':'Read original authored products only after all raw-generation steps close; never seed generation'}
  write(state_path,state);print(json.dumps({'step':'init','rawInputs':len(pins)}));return
 state=json.loads(state_path.read_text());assert state['mirror']==str(mirror)
 assert all(sha(ROOT/rel)==sha(mirror/rel)==digest for rel,digest in state['initialInputs'].items())
 completed=[s['step'] for s in state['steps'] if s['status']=='COMPLETE']
 if a.step in ('baseline','validate'):
  assert completed==list(STEPS),'Finish all actual generation before expected products are read'
  baseline_path=HERE/'validation-baseline-v2.json'
  if a.step=='baseline':
   assert not baseline_path.exists(),'Preserve prior validation baselines'
   body_path=ROOT/WORK/'body-index.json';body=json.loads(body_path.read_text());assert len(body['cells'])==412
   source={ROOT/c['source']['file']:c['source']['sha256'] for c in body['cells']};assert len(source)==348 and all(sha(p)==h for p,h in source.items())
   files=sorted(p for p in (ROOT/PRIVATE/ASSET).rglob('*') if p.is_file())+list(source)
   assert len(files)==358  # Ten delivery/person files plus348 unique source PNGs.
   files += sorted((HERE/'registered').glob('*.png'))
   files += sorted(p for p in (HERE/'profile-leg-repair-v2').glob('*.png') if not p.name.startswith('raw-'))
   files += [body_path,HERE/'registration.json',HERE/'profile-leg-repair-v2/profile-layer-registration.json',ROOT/WORK/'family-mouths/mouths-working.json',ROOT/'output/street-redesign/hildegard-brotzeit-end-to-end/adult-mouth-fit-v5/fit.json']
   files += [ROOT/WORK/'compiled'/n for n in ('standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json','person.json')]
   person=json.loads((ROOT/PRIVATE/ASSET/'person.json').read_text());assert person['figureWorldHeight']==2.33 and person['strideDistance']==11.65
   data={'id':ID,'role':'VALIDATION_ONLY_AFTER_ALL_RAW_GENERATION','expectedHashes':{p.relative_to(ROOT).as_posix():sha(p) for p in files},'person':person,
    'expectedCycleReport':cycle_semantics(json.loads((ROOT/WORK/'source-cycle/report.json').read_text())),
    'cycleModuleHashRole':'Actual raw input fully pinned; cache-version changes are not part of the physical-cycle semantic comparison',
    'completedRawReportSha256':sha(state_path),'currentCanonicalUsed':False,'generationSeedAllowed':False}
   write(baseline_path,data);print(json.dumps({'step':'baseline','expectedFiles':len(data['expectedHashes'])}));return
  baseline=json.loads(baseline_path.read_text());assert baseline['id']==ID
  for rel,digest in baseline['expectedHashes'].items():assert sha(mirror/rel)==digest,('Raw-generated output differs',rel)
  person=json.loads((mirror/PRIVATE/ASSET/'person.json').read_text());assert person==baseline['person']
  cycle=json.loads((mirror/WORK/'source-cycle/report.json').read_text())
  assert cycle['pins']['world3d.js']==state['initialInputs']['world3d.js']==sha(mirror/'world3d.js')
  assert cycle_semantics(cycle)==baseline['expectedCycleReport']
  state.update(status='PASS_RAW_ONLY_RECONSTRUCTION_AND_FINAL_VALIDATION',exactFiles=len(baseline['expectedHashes']),ownAuthoredPersonExact=True,cycleSemanticsExact=True,validationBaselineSha256=sha(baseline_path))
  write(state_path,state);print(json.dumps({'step':'validate','status':state['status'],'exactFiles':state['exactFiles']}));return
 assert a.step==STEPS[len(completed)] and not state['status'].startswith('RED')
 row={'step':a.step,'status':'RUNNING','resourceContract':limits};state['steps'].append(row);write(state_path,state);start=time.monotonic()
 try:
  if a.step.startswith('body-'):
   section=a.step.removeprefix('body-');section='cardinal-'+section if section in ('down','right','up','left') else section
   load('hildegard_raw_body',mirror/AUTHOR/'build-family-source-v2.py').run(argparse.Namespace(section=section,output=mirror/WORK))
  elif a.step=='compile':
   assert json.loads((mirror/WORK/'source-cycle/report.json').read_text())['fittedCycle']==11.65
   load('hildegard_raw_compile',mirror/AUTHOR/'build-candidate-v2.py').run(argparse.Namespace(outdir=mirror/WORK/'compiled',stride_distance=11.65))
  elif a.step.startswith('packet-'):load('hildegard_raw_packet',mirror/AUTHOR/'build-private-delivery-v3.py').main(a.step.removeprefix('packet-'))
  else:
   scripts={'register':('prepare-neutrals.py','run'),'parts':('prepare-profile-layers-v2.py','run'),'fit':('fit-adult-mouths.py','run'),
    'mouths':('prepare-family-mouths-v2.py','run'),'cycle':('measure-source-cycle-v2.py','run')}
   script,function=scripts[a.step];m=load('hildegard_raw_'+a.step,mirror/AUTHOR/script);assert m.ROOT==mirror;getattr(m,function)()
  assert all(sha(ROOT/rel)==sha(mirror/rel)==h for rel,h in state['initialInputs'].items())
  row.update(status='COMPLETE',elapsedSeconds=time.monotonic()-start);state['status']='RAW_GENERATION_STEP_COMPLETE';write(state_path,state)
  print(json.dumps({'step':a.step,'status':'COMPLETE','elapsedSeconds':row['elapsedSeconds']}))
 except BaseException as error:
  row.update(status='RED',elapsedSeconds=time.monotonic()-start,error=repr(error));state['status']='RED_RAW_GENERATION_STEP';write(state_path,state);raise
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--step',choices=('init',*STEPS,'baseline','validate'),required=True);p.add_argument('--mirror',type=Path,required=True);p.add_argument('--outdir',type=Path,required=True);main(p.parse_args())
