"""Bounded raw-only reconstruction, one explicitly selected step per owned child.

Expected output/person validation is read only after every generation step.
No source/runtime pixels from other actors or cached/generated Dietmar inputs
seed this mirror. The outer run-stage-v2 guard owns each60s/384MiB job.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,os,shutil,time,traceback
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
ID='crowd-dietmar-din-norm';AUTHOR=HERE.relative_to(ROOT)
WORK=Path('output/street-redesign/dietmar-din-norm-end-to-end')
ASSET=Path('assets/characters/residents')/ID/'delivery-v2'
STAGING=Path('output/dietmar-height/authored-packet-v4')
AUTHORED_CYCLE=11.65
SCRIPTS=['prepare-neutrals.py','prepare-profile-layers-v2.py','pilot-motion.py','pilot-motion-v2.py','pilot-motion-v3.py','profile-motion-v2.py','clean-rebuild-v4.py',
 'build-family-source-v3.py','fit-adult-mouths-v6.py','prepare-family-mouths-v4.py','measure-source-cycle-v2.py',
 'build-candidate-v4.py','stage-private-packet-v4.py']
STEPS=['neutrals','parts','fit','down','right','up','left','extras','finalize','mouths','cycle','compile','packet-init','packet-pack','packet-bind','packet-check']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,data):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,indent=2,allow_nan=False)+'\n')
def load(name,p):
 spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def raw_inputs():
 inputs=[AUTHOR/name for name in SCRIPTS+['pre-admission-person.json','new-motion-capability-plan.json','lip-fits-v6.json','voice-baseline.json','pose-contract.json','front-right-mouth-v6-adoption.json']]
 inputs += [AUTHOR/name for name in ['raw-cardinals-v1.png','raw-quarters-v1.png','identity-mature-front-original.png','reference-soeder-neutral.png','reference-herr-sandale-neutral.png','reference-frau-sandale-neutral.png']]
 inputs += [AUTHOR/'profile-leg-repair-v2'/name for name in ['raw-far-leg-parts-v1.png','controls-proposed-v1.json','far-leg-parts-request-v1.json','far-leg-parts-receipt-v1.json','far-leg-parts-tool-output-v1.json']]
 inputs += [Path('tools')/name for name in ['build-street-character-sprites.py','build-street-mouths.py','build-street-motion-delivery.py']]
 inputs += [Path('.agents/skills/animate-2d-characters/scripts')/name for name in ['painted_walk.py','harmonize_material.py']]
 return inputs+[Path('world3d.js')]
def job_limit():
 import ctypes
 from ctypes import wintypes as W
 class Basic(ctypes.Structure):_fields_=[('processTime',ctypes.c_longlong),('jobTime',ctypes.c_longlong),('flags',W.DWORD),('minWorking',ctypes.c_size_t),('maxWorking',ctypes.c_size_t),('active',W.DWORD),('affinity',ctypes.c_size_t),('priority',W.DWORD),('scheduling',W.DWORD)]
 class IO(ctypes.Structure):_fields_=[(n,ctypes.c_ulonglong) for n in ('readOps','writeOps','otherOps','readBytes','writeBytes','otherBytes')]
 class Extended(ctypes.Structure):_fields_=[('basic',Basic),('io',IO),('processMemory',ctypes.c_size_t),('jobMemory',ctypes.c_size_t),('peakProcessMemory',ctypes.c_size_t),('peakJobMemory',ctypes.c_size_t)]
 k=ctypes.WinDLL('kernel32',use_last_error=True);k.QueryInformationJobObject.argtypes=[W.HANDLE,ctypes.c_int,ctypes.c_void_p,W.DWORD,ctypes.c_void_p]
 limits=Extended();assert k.QueryInformationJobObject(None,9,ctypes.byref(limits),ctypes.sizeof(limits),None),'Raw step requires inherited owned kernel job'
 assert limits.jobMemory==384*1024**2 and limits.basic.flags&0x2200==0x2200
 assert all(os.environ.get(name)=='1' for name in ['OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS'])
 return {'wholeJobPrivateCapMiB':384,'installedFlags':limits.basic.flags,'oneProcessNoNestedChild':True}
def main(args):
 mirror=args.mirror.resolve();report_path=args.report.resolve();limits=job_limit()
 short_parent=Path('C:/Users/cogpsy-vrlab/.codex/tmp').resolve()
 assert mirror.parent==short_parent and mirror.name=='dietmar-v4-r02' and len(str(mirror))<65,'Only explicitly admitted fresh short own mirror'
 assert report_path==ROOT/'output/dietmar-height/clean-raw-v4-r02-report.json','Keep report in owning ignored output'
 if args.mode=='init':
  assert not mirror.exists() and not report_path.exists(),'Use a genuinely absent own mirror and report'
  relative_inputs=raw_inputs()
  mirror.mkdir();pins={}
  for rel in relative_inputs:
   target=mirror/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/rel,target);pins[rel.as_posix()]=sha(target)
  state={'status':'INITIAL_RAW_ONLY_MIRROR_READY','mirrorInitiallyAbsent':True,'mirror':str(mirror),'initialInputs':pins,'steps':[],
   'expectedStepOrder':STEPS,'resourceContract':limits,
   'excludedInputs':['registered paint','registration.json','generated near/far/masks/planted parts','profile-layer-registration.json','working body/mouth paint','selected/runtime images or person','whole-cast current registry','validation-only baseline','old held v2 family/body index','old v3 weakFR mouth metadata','private prior packets','cache'],
   'baselineRole':'Validation only after all generation steps; no expected file enters generation'}
  write(report_path,state);print(json.dumps({'status':state['status'],'initialInputs':len(pins)}));return
 state=json.loads(report_path.read_text());assert state['mirror']==str(mirror)
 assert all(sha(mirror/rel)==digest for rel,digest in state['initialInputs'].items()),'Raw generation input changed'
 if args.mode=='validate':
  assert [s['mode'] for s in state['steps'] if s['status']=='COMPLETE']==STEPS,'All raw generation must finish first'
  baseline=json.loads((HERE/'validation-baseline-v4.json').read_text());assert baseline['id']==ID
  actual={}
  for rel,digest in baseline['expectedHashes'].items():
   target=mirror/rel;actual[rel]=sha(target) if target.exists() else None
   assert actual[rel]==digest,('Actual raw-generated output differs',rel,digest,actual[rel])
  assert len(actual)==405
  cycle=json.loads((mirror/WORK/'source-cycle-v2/report.json').read_text())
  actual_world_pin=cycle['pins'].pop('world3d.js')
  assert actual_world_pin==state['initialInputs']['world3d.js']==sha(mirror/'world3d.js'),'Cycle diagnostic world pin must bind actual raw full module input'
  assert cycle==baseline['expectedCycleReport'],'Actual raw cycle differs in source, code, stance, mapping, cadence or any remaining report field/pin'
  person=json.loads((mirror/STAGING/'private-manifest.json').read_text())['characters'][ID]
  assert person==baseline['person'],'Actual raw-generated authored person differs'
  state.update(status='PASS_RAW_ONLY_RECONSTRUCTION_AND_FINAL_VALIDATION',exactFiles=len(actual),expectedFilesExact=actual,ownAuthoredPersonExact=True,
   completeCycleReportOtherThanWorldDiagnosticPinExact=True,actualCycleWorldPin=actual_world_pin,cycleWorldPinMatchesRawInitialFullModule=True,validationBaselineSha256=sha(HERE/'validation-baseline-v4.json'))
  write(report_path,state);print(json.dumps({'status':state['status'],'exactFiles':len(actual),'personExact':True,'completeCycleSemanticComparisonExact':True,'actualWorldPinMatchesInitialInput':True}));return
 assert args.mode in STEPS and not state['status'].startswith('RED')
 completed=[s['mode'] for s in state['steps'] if s['status']=='COMPLETE'];assert args.mode==STEPS[len(completed)],'Keep actual raw generation order'
 row={'mode':args.mode,'status':'RUNNING','startedUtc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'resourceContract':limits};state['steps'].append(row);write(report_path,state);start=time.monotonic()
 try:
  if args.mode in ('down','right','up','left','extras','finalize'):
   module=load('dietmar_raw_full_section_'+args.mode,mirror/AUTHOR/'build-family-source-v3.py');assert module.ROOT==mirror;module.main(args.mode)
  elif args.mode=='compile':
   measured=json.loads((mirror/WORK/'source-cycle-v2/report.json').read_text())['fittedCycle'];assert measured==AUTHORED_CYCLE
   module=load('dietmar_raw_compile',mirror/AUTHOR/'build-candidate-v4.py');assert module.ROOT==mirror
   module.run(argparse.Namespace(outdir=mirror/WORK/'candidate-v4',stride_distance=AUTHORED_CYCLE))
   state['motionParameter']={'authoredCompilerCycle':AUTHORED_CYCLE,'independentlyMeasuredRawSourceCycle':measured,'role':'Authored parameter verified from actual rebuilt layers; independent of validation baseline'}
  elif args.mode.startswith('packet-'):
   module=load('dietmar_raw_private_packet',mirror/AUTHOR/'stage-private-packet-v4.py');assert module.ROOT==mirror;module.run(args.mode.split('-',1)[1])
  else:
   scripts={'neutrals':'prepare-neutrals.py','parts':'prepare-profile-layers-v2.py','fit':'fit-adult-mouths-v6.py','mouths':'prepare-family-mouths-v4.py','cycle':'measure-source-cycle-v2.py'}
   module=load('dietmar_raw_'+args.mode,mirror/AUTHOR/scripts[args.mode]);assert module.ROOT==mirror;module.run()
  assert all(sha(mirror/rel)==digest for rel,digest in state['initialInputs'].items()),'Actual raw input changed during generation'
  row.update(status='COMPLETE',elapsedSeconds=time.monotonic()-start);state['status']='RAW_GENERATION_STEP_COMPLETE';write(report_path,state)
  print(json.dumps({'mode':args.mode,'status':row['status'],'elapsedSeconds':row['elapsedSeconds'],'remainingSteps':len(STEPS)-len(completed)-1}))
 except BaseException as error:
  row.update(status='RED',elapsedSeconds=time.monotonic()-start,error=repr(error));state['status']='RED_RAW_GENERATION_STEP';write(report_path,state);raise
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--mode',required=True,choices=['init',*STEPS,'validate']);p.add_argument('--mirror',required=True,type=Path);p.add_argument('--report',required=True,type=Path);main(p.parse_args())
