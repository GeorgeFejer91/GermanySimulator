"""Own bounded CPU child with root-approved resource and teardown contract."""
from pathlib import Path
import argparse,ctypes,hashlib,json,os,subprocess,time
from ctypes import wintypes as W
p=argparse.ArgumentParser();p.add_argument('stage');p.add_argument('script');p.add_argument('args',nargs=argparse.REMAINDER);a=p.parse_args()
root=Path.cwd();out=root/'output/street-redesign/bueroklammer-end-to-end/resources';out.mkdir(parents=True,exist_ok=True)
assert not (out/(a.stage+'.json')).exists(),'Preserve prior receipts'
k=ctypes.WinDLL('kernel32',use_last_error=True)
class Memory(ctypes.Structure):_fields_=[('length',W.DWORD),('load',W.DWORD),*[(n,ctypes.c_ulonglong) for n in ('total','free','page','pagefree','virtual','virtualfree','extended')]]
class Basic(ctypes.Structure):_fields_=[('processTime',ctypes.c_longlong),('jobTime',ctypes.c_longlong),('flags',W.DWORD),('minWorking',ctypes.c_size_t),('maxWorking',ctypes.c_size_t),('active',W.DWORD),('affinity',ctypes.c_size_t),('priority',W.DWORD),('scheduling',W.DWORD)]
class IO(ctypes.Structure):_fields_=[(n,ctypes.c_ulonglong) for n in ('readOps','writeOps','otherOps','readBytes','writeBytes','otherBytes')]
class Extended(ctypes.Structure):_fields_=[('basic',Basic),('io',IO),('processMemory',ctypes.c_size_t),('jobMemory',ctypes.c_size_t),('peakProcessMemory',ctypes.c_size_t),('peakJobMemory',ctypes.c_size_t)]
class Account(ctypes.Structure):_fields_=[(n,ctypes.c_longlong) for n in ('user','kernel','periodUser','periodKernel')]+[(n,W.DWORD) for n in ('faults','total','active','terminated')]
k.CreateJobObjectW.argtypes=[ctypes.c_void_p,W.LPCWSTR];k.CreateJobObjectW.restype=W.HANDLE
k.SetInformationJobObject.argtypes=[W.HANDLE,ctypes.c_int,ctypes.c_void_p,W.DWORD]
k.AssignProcessToJobObject.argtypes=[W.HANDLE,W.HANDLE]
k.QueryInformationJobObject.argtypes=[W.HANDLE,ctypes.c_int,ctypes.c_void_p,W.DWORD,ctypes.c_void_p]
k.TerminateJobObject.argtypes=[W.HANDLE,W.UINT];k.CloseHandle.argtypes=[W.HANDLE]
k.GetPriorityClass.argtypes=[W.HANDLE];k.GetPriorityClass.restype=W.DWORD
def free():
 m=Memory();m.length=ctypes.sizeof(m);assert k.GlobalMemoryStatusEx(ctypes.byref(m));return m.free/1024**2
native_mouth_bounded=Path(a.script).name=='audit-native-mouths.py'
small_check=Path(a.script).name in ('check-pilot.py','fit-adult-mouths.py','prepare-family-mouths.py','audit-native.py') or (Path(a.script).name=='measure-sole-cadence.py' and '--pilot' in a.args)
paired_pilot=a.stage=='motion-pilot-v1'
single_pilot=a.stage=='motion-pilot-v2'
endpoint_fit=a.stage in ('mouth-fit-v1','mouth-fit-v2','mouth-fit-v3','mouth-fit-v4')
both_feet_pilot=a.stage=='source-contact-native-pilot-v1'
full_source=a.stage=='source-family-v1'
family_transport=a.stage in ('family-mouths-v1','family-mouths-v2')
candidate_pack=a.stage=='candidate-pack-v1'
native_audit=a.stage in ('native-bodies-v1','native-mouths-v1')
formal_extraction=a.stage=='formal-extraction-v1'
formal_small_checks=a.stage=='formal-small-checks-v1'
focused_contracts=a.stage=='focused-contracts-v2'
raw_only_clean=a.stage=='raw-only-clean-v1'
private_integration=native_audit or formal_extraction or formal_small_checks or focused_contracts or raw_only_clean or a.stage in ('candidate-install-v1','selective-delivery-v1','delivery-bind-v1','delivery-check-v1')
minimum_start=1536 if raw_only_clean else 1152 if focused_contracts else 1408 if formal_small_checks else 1280 if formal_extraction else 2048 if native_audit else 1664 if private_integration else 1536 if a.stage=='family-mouths-v2' else 2048 if full_source else 1792 if a.stage=='mouth-fit-v4' or both_feet_pilot or family_transport or candidate_pack else 1664 if a.stage=='mouth-fit-v3' else 1920 if a.stage=='mouth-fit-v1' else 2304 if paired_pilot else 1536
private_limit_mib=384 if raw_only_clean else 128 if formal_small_checks or focused_contracts else 256 if endpoint_fit or a.stage=='family-mouths-v2' or private_integration else 384 if paired_pilot or single_pilot or both_feet_pilot or full_source or family_transport or candidate_pack else 512
maximum_seconds=360 if raw_only_clean else 30 if focused_contracts else 90 if formal_extraction or formal_small_checks else 360 if full_source else 120 if candidate_pack or a.stage=='selective-delivery-v1' else 60
before=free()
if before<1024:
 (out/'cpu-memory-hold.json').write_text(json.dumps({'stage':a.stage,'reason':'First below1GiB initial sample; explicit root review required','minimumFreeMiB':before}))
if before<minimum_start:
 (out/(a.stage+'-prelaunch-refusal.json')).write_text(json.dumps({'stage':a.stage,'status':'REFUSED before child/job creation','freshMiB':before,'minimumStartMiB':minimum_start,'configuredCapMiB':private_limit_mib,'capQueryExecuted':False,'childCreated':False,'activeProcesses0':True,'persistentHoldPresent':(out/'cpu-memory-hold.json').exists()},indent=2)+'\n')
 raise AssertionError(('HOLD fresh memory',before))
assert not (out/'cpu-memory-hold.json').exists(),'Root must review persistent adverse hold'
job=k.CreateJobObjectW(None,None);assert job
limits=Extended();limits.basic.flags=0x2200;limits.jobMemory=private_limit_mib*1024**2
assert k.SetInformationJobObject(job,9,ctypes.byref(limits),ctypes.sizeof(limits))
installed_limits=Extended();assert k.QueryInformationJobObject(job,9,ctypes.byref(installed_limits),ctypes.sizeof(installed_limits),None)
assert installed_limits.jobMemory==private_limit_mib*1024**2 and installed_limits.basic.flags&0x2200==0x2200
child=None;low=before;aborted=None;closed=False;code=None;peak=0;working_peak=0;priority=None;start=time.monotonic();low_memory_seen=False;consecutive_low=0
class ProcessMemory(ctypes.Structure):_fields_=[('cb',W.DWORD),('faults',W.DWORD),*[(n,ctypes.c_size_t) for n in ('peakWorking','working','peakPaged','paged','peakNonpaged','nonpaged','pagefile','peakPagefile')]]
ps=ctypes.WinDLL('psapi',use_last_error=True);ps.GetProcessMemoryInfo.argtypes=[W.HANDLE,ctypes.c_void_p,W.DWORD]
command=[os.sys.executable,'-B',str((root/a.script).resolve()),*a.args]
if focused_contracts:
 assert Path(a.script).name=='actor-contract.test.mjs' and not a.args,'Four focused contracts only'
 command=['C:/Users/cogpsy-vrlab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe','--test',str((root/a.script).resolve())]
author=Path(__file__).resolve().parent
pin_paths=list(author.glob('*.py'))+[author/name for name in ['pre-admission-person.json','pre-admission-family.json','pre-admission-motion.json','pre-admission-source.json','baseline-hashes.json','voice-baseline.json','reference-neutrals.json','reference-soeder-neutral.png','reference-herr-sandale-neutral.png','reference-frau-sandale-neutral.png','identity-original.png','lip-fits.json','raw-directions-v2.png']]
pin_paths += list((author/'registered').glob('*.png'))+[root/'tools'/name for name in ['build-street-character-sprites.py','build-street-mouths.py']]+[root/'.agents/skills/animate-2d-characters/scripts'/name for name in ['painted_walk.py','harmonize_material.py']]
pin_paths += [root/'output/street-redesign/bueroklammer-end-to-end'/name for name in ['full-working/body-index.json','family-mouths/mouths-working.json']]
if full_source or family_transport or candidate_pack or private_integration:
 proof=root/'output/street-redesign/bueroklammer-end-to-end'
 seal=proof/'source-calibration-actual-image-review.json'
 assert hashlib.sha256(seal.read_bytes()).hexdigest()=='872c97de9c429f493c8eb124bd65686716fe281c9026d2ee009de583c574223e','Actual pilot image-review seal changed'
 reviewed=json.loads(seal.read_text());fit_path=proof/'adult-mouth-fit-v4/fit.json';contact_path=proof/'sole-cadence-pilot/report.json'
 fit=json.loads(fit_path.read_text());contact=json.loads(contact_path.read_text())
 assert len(fit['checks'])==5 and not fit['endpointFailures'],'Five visible endpoint fits must pass'
 assert contact['status'].startswith('PASS'),'Both-foot contact pilot must pass'
 for pins in (reviewed['hashes'],fit['pins'],contact['pins']):
  for relative,digest in pins.items():
   actual=root/relative
   assert hashlib.sha256(actual.read_bytes()).hexdigest()==digest,('Sealed pilot input changed',relative)
   pin_paths.append(actual)
 pin_paths += [seal,fit_path,contact_path]
 if full_source:assert not (proof/'full-working/body-index.json').exists(),'First full source output must be absent'
 else:
  body_path=proof/'full-working/body-index.json'
  assert hashlib.sha256(body_path.read_bytes()).hexdigest()=='433dab228610f3f53a9a68f747222b7952a4f2482e7897975121544459b8d1dd','Reviewed full source index changed'
  body=json.loads(body_path.read_text());assert body['selectedCells']==412 and body['sourceFiles']==348
  for relative,digest in body['inputPins'].items():
   assert hashlib.sha256((root/relative).read_bytes()).hexdigest()==digest,('Full source input changed',relative)
   pin_paths.append(root/relative)
  closure=proof/'resources/source-family-v1.json';state=json.loads(closure.read_text())
  assert state['exitCode']==0 and state['activeProcesses0'] and not state['inputMismatches'] and not state['lowMemorySeen'] and not state['aborted']
  pin_paths += [closure,body_path]
 if candidate_pack or private_integration:
  packet=proof/'family-mouths/mouths-working.json';assert hashlib.sha256(packet.read_bytes()).hexdigest()=='63225ac4126bacd5b939e95e00d7d3007a7a478fd1d15a3e3128d3db66d7c793'
  mouths=json.loads(packet.read_text());assert mouths['visible']==324 and not mouths['missingFits']
  for relative,digest in mouths['inputPins'].items():
   assert hashlib.sha256((root/relative).read_bytes()).hexdigest()==digest,('Transport input changed',relative)
   pin_paths.append(root/relative)
  closure=proof/'resources/family-mouths-v2.json';state=json.loads(closure.read_text())
  assert state['exitCode']==0 and state['activeProcesses0'] and not state['inputMismatches'] and not state['lowMemorySeen'] and not state['aborted']
  motion=author/'motion-spec.json';spec=json.loads(motion.read_text());assert spec['strideDistance']==13.802906358505636
  if candidate_pack:assert '--stride-distance' in a.args and float(a.args[a.args.index('--stride-distance')+1])==spec['strideDistance']
  pin_paths += [packet,closure,motion]
 if private_integration:
  candidate=proof/'candidate-v1';receipt=candidate/'compile-receipt.json';compiled=json.loads(receipt.read_text())
  assert compiled['id']=='crowd-brigitte-bueroklammer'
  for name,digest in compiled['outputs'].items():
   assert hashlib.sha256((candidate/name).read_bytes()).hexdigest()==digest,('Compiled output changed',name)
   pin_paths.append(candidate/name)
  for relative,digest in compiled['inputPins'].items():
   assert hashlib.sha256((root/relative).read_bytes()).hexdigest()==digest,('Compiled source changed',relative)
   pin_paths.append(root/relative)
  person=json.loads((candidate/'person.json').read_text());assert person['strideDistance']==13.802906358505636 and person['figureWorldHeight']==2.33
  pin_paths += [receipt,root/a.script,root/'assets/characters/street/manifest.json',root/'assets/characters/police/manifest.json',root/'tools/build-street-motion-delivery.py']
  selected=root/'assets/characters/street-speakers/crowd-brigitte-bueroklammer/delivery-v2'
  if a.stage!='candidate-install-v1':
   for name in ('standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json'):
    assert hashlib.sha256((selected/name).read_bytes()).hexdigest()==compiled['outputs'][name],('Installed own asset changed',name)
    pin_paths.append(selected/name)
  if native_audit or formal_extraction or formal_small_checks or raw_only_clean:pin_paths += [path for path in selected.rglob('*') if path.is_file()]
if formal_extraction or formal_small_checks:
 assert Path(a.script).name==('prepare-final-frame-analysis.py' if formal_extraction else 'run-formal-checks.py') and not a.args,'Named formal scope only'
 for folder,count,expected in [('native-source-review',100,'7771b55156119fc24887797de4f69c908a7eaaea03cff4239324b23a9ee868dd'),('native-mouth-review',4,'f9463b2edf71494f759edd35ab645b6daad3cf7aaf9af278d02b160b4128e43f')]:
  visual=proof/folder/'owner-visual-review.json';assert hashlib.sha256(visual.read_bytes()).hexdigest()==expected
  review=json.loads(visual.read_text());assert review['actuallyInspectedBoardCount']==count and review['allListedBoardsActuallyInspected'] is True and len(review['hashes'])==count
  for relative,digest in review['hashes'].items():
   assert hashlib.sha256((root/relative).read_bytes()).hexdigest()==digest,('Actually inspected board changed',relative)
   pin_paths.append(root/relative)
  pin_paths.append(visual)
 for name in ('native-bodies-v1','native-mouths-v1'):
  closure=proof/'resources'/(name+'.json');state=json.loads(closure.read_text())
  assert state['exitCode']==0 and state['activeProcesses0'] and not state['inputMismatches'] and not state['lowMemorySeen'] and not state['aborted']
  pin_paths.append(closure)
 pin_paths += [proof/'native-source-review/receipt.json',proof/'native-mouth-review/report.json']
 if formal_small_checks:
  inspected=proof/'final-frame-analysis/inspected-boards.json';assert hashlib.sha256(inspected.read_bytes()).hexdigest()=='973d8eeae1c681ae9047ba441398bbeb29a2ae50a89d71c5ccf50be6ddb0cba3'
  for relative,digest in json.loads(inspected.read_text())['hashes'].items():
   assert hashlib.sha256((root/relative).read_bytes()).hexdigest()==digest,relative
   pin_paths.append(root/relative)
  closure=proof/'resources/formal-extraction-v1.json';state=json.loads(closure.read_text());assert state['exitCode']==0 and state['activeProcesses0'] and not state['inputMismatches'] and not state['lowMemorySeen'] and not state['aborted']
  pin_paths += [closure,inspected,author/'actor-contract.test.mjs',root/'.agents/skills/animate-2d-characters/scripts/audit_final_frame_analysis.py',proof/'resources/formal-small-checks-v1-preparation.json']
  pin_paths += [path for path in (proof/'final-frame-analysis').rglob('*') if path.is_file()]
  baseline=json.loads((author/'voice-baseline.json').read_text())
  for relative,digest in baseline['hashes'].items():
   assert hashlib.sha256((root/relative).read_bytes()).hexdigest()==digest,relative
   pin_paths.append(root/relative)
if focused_contracts:
 assert hashlib.sha256((proof/'final-frame-analysis/inspected-boards.json').read_bytes()).hexdigest()=='973d8eeae1c681ae9047ba441398bbeb29a2ae50a89d71c5ccf50be6ddb0cba3'
 processes=proof/'resources/formal-small-checks-v1-processes.json';leaves=json.loads(processes.read_text());assert [leaf['name'] for leaf in leaves]==['acceptance','desktop-audit','mobile-audit','four-contracts'] and [leaf['exitCode'] for leaf in leaves]==[0,0,0,1]
 for variant in ('desktop','mobile'):
  audit=proof/'final-frame-analysis'/(variant+'-audit.json');value=json.loads(audit.read_text());assert value['ok'] and value['frames_analyzed']==412 and not value['errors']
 pin_paths += [path for path in (proof/'final-frame-analysis').rglob('*') if path.is_file()]
 pin_paths += [processes,proof/'resources/formal-small-checks-v1.json',proof/'resources/formal-small-checks-v1-four-contracts.stdout.txt',proof/'resources/actor-contract-formal-small-checks-v1-as-run.test.mjs',proof/'resources/focused-contracts-v2-preparation.json']
 baseline=json.loads((author/'voice-baseline.json').read_text())
 for relative,digest in baseline['hashes'].items():
  assert hashlib.sha256((root/relative).read_bytes()).hexdigest()==digest,relative
  pin_paths.append(root/relative)
if raw_only_clean:
 assert Path(a.script).name=='clean-rebuild.py' and a.args==['--name','bc-clean-v1','--mirror','C:/bc1'],'Single raw-only prepared mirror scope'
 assert not Path('C:/bc1').exists(),'True-clean mirror must be absent, never reuse or delete'
 baseline=author/'rebuild-baseline.json';assert hashlib.sha256(baseline.read_bytes()).hexdigest()=='dfc969816a52154f3718293fdcf1139bcab15b81063616e636706531ee594404'
 expected=json.loads(baseline.read_text());assert len(expected['expectedFiles'])==23
 for relative,digest in expected['expectedFiles'].items():
  assert hashlib.sha256((root/relative).read_bytes()).hexdigest()==digest,('Raw validation baseline changed',relative)
  pin_paths.append(root/relative)
 person=json.loads((proof/'private-manifest.json').read_text())['characters']['crowd-brigitte-bueroklammer'];assert person==expected['selectedPerson']
 closure=proof/'resources/focused-contracts-v2.json';state=json.loads(closure.read_text());assert state['exitCode']==0 and state['activeProcesses0'] and not state['inputMismatches'] and not state['lowMemorySeen'] and not state['aborted']
 pin_paths += [baseline,proof/'private-manifest.json',closure,proof/'resources/raw-only-clean-v1-preparation.json']
input_pins={path.relative_to(root).as_posix():hashlib.sha256(path.read_bytes()).hexdigest() for path in pin_paths if path.exists()}
after_pin_free=free()
if after_pin_free<1024:
 (out/'cpu-memory-hold.json').write_text(json.dumps({'stage':a.stage,'reason':'First below1GiB after pin verification; explicit root review required','minimumFreeMiB':after_pin_free}))
if after_pin_free<minimum_start:
 k.CloseHandle(job)
 (out/(a.stage+'-prelaunch-refusal.json')).write_text(json.dumps({'stage':a.stage,'status':'REFUSED after pins before child','freshMiB':after_pin_free,'minimumStartMiB':minimum_start,'configuredCapMiB':private_limit_mib,'capQueryExecuted':True,'installedJobLimitMiB':installed_limits.jobMemory/1024**2,'childCreated':False,'activeProcesses0':True,'persistentHoldPresent':(out/'cpu-memory-hold.json').exists()},indent=2)+'\n')
 raise AssertionError(('HOLD fresh memory after pins',after_pin_free))
before=after_pin_free;low=before
try:
 with (out/(a.stage+'.stdout.txt')).open('w') as log,(out/(a.stage+'.stderr.txt')).open('w') as err:
  child=subprocess.Popen(command,cwd=root,env={**os.environ,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1','MKL_NUM_THREADS':'1'},creationflags=subprocess.CREATE_NO_WINDOW|subprocess.BELOW_NORMAL_PRIORITY_CLASS,stdout=log,stderr=err)
  assert k.AssignProcessToJobObject(job,W.HANDLE(child._handle));priority=k.GetPriorityClass(W.HANDLE(child._handle));assert priority==16384
  print(json.dumps({'stage':a.stage,'childPid':child.pid,'priorityObserved':priority,'freshMiB':before,'inputPins':len(input_pins)}),flush=True)
  while child.poll() is None:
   memory=ProcessMemory();memory.cb=ctypes.sizeof(memory)
   if ps.GetProcessMemoryInfo(W.HANDLE(child._handle),ctypes.byref(memory),memory.cb):working_peak=max(working_peak,memory.peakWorking)
   current=free();low=min(low,current)
   if current<1024:
    low_memory_seen=True;consecutive_low+=1
    (out/'cpu-memory-hold.json').write_text(json.dumps({'stage':a.stage,'reason':'first below1GiB sample; explicit root review required even after recovery','minimumFreeMiB':low}))
   else:consecutive_low=0
   if consecutive_low>=2 or time.monotonic()-start>maximum_seconds:
    aborted='two consecutive below1GiB samples' if consecutive_low>=2 else f'{maximum_seconds}second child bound';assert k.TerminateJobObject(job,1);break
   time.sleep(.25)
  code=child.wait(timeout=15)
finally:
 assert k.TerminateJobObject(job,1)
 if child and child.poll() is None:child.wait(timeout=15)
 deadline=time.monotonic()+10
 while time.monotonic()<deadline:
  account=Account();assert k.QueryInformationJobObject(job,1,ctypes.byref(account),ctypes.sizeof(account),None)
  if account.active==0:closed=True;break
  time.sleep(.1)
 usage=Extended();assert k.QueryInformationJobObject(job,9,ctypes.byref(usage),ctypes.sizeof(usage),None);peak=usage.peakJobMemory
 k.CloseHandle(job)
 row={'stage':a.stage,'command':command,'pid':child.pid if child else None,'priorityObserved':priority,'threadEnvironment':{'OMP':1,'OPENBLAS':1,'MKL':1},'freshMiB':before,'minimumFreeMiB':low,'freeAfterMiB':free(),'wholeJobPeakMiB':peak/1024**2,'childPeakWorkingMiB':working_peak/1024**2,'elapsedSeconds':time.monotonic()-start,'exitCode':code,'aborted':aborted,'activeProcesses0':closed}
 row['minimumStartMiB']=minimum_start;row['privateCommitLimitMiB']=private_limit_mib;row['maximumSeconds']=maximum_seconds
 row['installedJobLimitMiB']=installed_limits.jobMemory/1024**2;row['installedJobFlags']=installed_limits.basic.flags;row['lowMemorySeen']=low_memory_seen;row['consecutiveLowAbortThreshold']=2;row['samplingIntervalSeconds']=.25
 row['inputPinsBefore']=input_pins;row['inputMismatches']=[path for path,digest in input_pins.items() if hashlib.sha256((root/path).read_bytes()).hexdigest()!=digest]
 (out/(a.stage+'.json')).write_text(json.dumps(row,indent=2)+'\n');print(json.dumps({key:value for key,value in row.items() if key!='inputPinsBefore'}))
 if (out/(a.stage+'.stdout.txt')).exists():print((out/(a.stage+'.stdout.txt')).read_text())
 if (out/(a.stage+'.stderr.txt')).exists():print((out/(a.stage+'.stderr.txt')).read_text())
assert code==0 and not aborted and not low_memory_seen and closed and not row['inputMismatches'],{key:value for key,value in row.items() if key!='inputPinsBefore'}


