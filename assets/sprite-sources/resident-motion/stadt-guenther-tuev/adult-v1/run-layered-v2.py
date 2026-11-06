"""Own bounded CPU child with root-approved resource and teardown contract."""
from pathlib import Path
import argparse,ctypes,hashlib,json,os,subprocess,time
from ctypes import wintypes as W
p=argparse.ArgumentParser();p.add_argument('stage');p.add_argument('script');p.add_argument('args',nargs=argparse.REMAINDER);a=p.parse_args()
root=Path.cwd();out=root/'output/guenther-shoe-repair/resources';out.mkdir(parents=True,exist_ok=True)
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
far_pilot_bounded=Path(a.script).name=='audit-both-feet-v2.py'
targeted_source_bounded=Path(a.script).name=='build-family-source.py' and '--repair-profile-far' in a.args
clean_bounded=Path(a.script).name=='clean-rebuild.py'
metadata_bounded=(Path(a.script).name=='prepare-final-frame-analysis.py' and '--accept-reviewed' in a.args) or Path(a.script).name in ('audit_final_frame_analysis.py','freeze-voice.mjs','guenther-tuev-adult.test.mjs')
metadata_small=a.stage in ('formal-mobile-v3-cap256','voice-freeze-v1-cap256','own-actor-tests-v1-cap256','own-actor-tests-v2-cap256') and Path(a.script).name in ('audit_final_frame_analysis.py','freeze-voice.mjs','guenther-tuev-adult.test.mjs')
replay_formal_bounded=Path(a.script).name=='measure-sole-cadence.py' and '--pilot' not in a.args or Path(a.script).name=='prepare-final-frame-analysis.py' and '--accept-reviewed' not in a.args
v2_compile_batch=a.stage in ('v2-mouth-transport','v2-compile','v2-install','v2-delivery','v2-bind','v2-delivery-check','v2-encoded-both-feet','v2-native-profile-boards')
v2_resume_batch=a.stage in ('v2-delivery-resume1','v2-bind-resume1','v2-delivery-check-resume1','v2-encoded-both-feet-resume1','v2-native-profile-boards-resume1','v2-native-profile-boards-resume2')
v2_native_small=a.stage=='v2-native-profile-boards-resume3' and Path(a.script).name=='audit-native.py' and '--profile-far-v2' in a.args
v2_formal_batch=a.stage in ('v2-formal-extract','v2-formal-owner','v2-formal-desktop','v2-formal-mobile','v2-own4tests')
v2_mobile_own4_small=a.stage in ('v2-formal-mobile-resume1','v2-own4tests-resume1') and Path(a.script).name in ('audit_final_frame_analysis.py','guenther-tuev-adult.test.mjs')
v2_clean_bounded=a.stage=='true-clean-v2-cap384' and Path(a.script).name=='clean-rebuild.py'
two_low_bounded=native_mouth_bounded or replay_formal_bounded or clean_bounded or metadata_bounded or far_pilot_bounded or targeted_source_bounded or v2_compile_batch or v2_resume_batch or v2_native_small or v2_formal_batch or v2_mobile_own4_small
small_check=Path(a.script).name in ('check-pilot.py','fit-adult-mouths.py','prepare-family-mouths.py','audit-native.py') or (Path(a.script).name=='measure-sole-cadence.py' and '--pilot' in a.args)
minimum_start=1792 if targeted_source_bounded else 1664 if far_pilot_bounded else 1280 if metadata_small else 1536 if metadata_bounded or replay_formal_bounded or clean_bounded else 2816 if native_mouth_bounded and a.stage=='native-mouths-v3-2816' else 1280 if native_mouth_bounded else 2048 if small_check else 2560
if v2_compile_batch:minimum_start=2048
if v2_resume_batch:minimum_start=1792
if v2_native_small:minimum_start=1536
if v2_formal_batch:minimum_start=1792
if v2_mobile_own4_small:minimum_start=1664
if v2_clean_bounded:minimum_start=1920
private_limit_mib=128 if v2_mobile_own4_small else 256 if v2_native_small or v2_formal_batch else 384 if far_pilot_bounded or targeted_source_bounded or v2_compile_batch or v2_resume_batch or v2_clean_bounded else 256 if native_mouth_bounded or metadata_small else 512
maximum_seconds=180 if targeted_source_bounded else 360 if clean_bounded else 240 if Path(a.script).name=='build-family-source.py' else 120 if Path(a.script).name in ('build-candidate.py','build-street-motion-delivery.py') and '--check' not in a.args else 60
private_limit_mib=384
maximum_seconds=60
before=free();assert before>=minimum_start,('HOLD fresh memory',before)
assert not (out/'cpu-memory-hold.json').exists(),'Root must review persistent adverse hold'
job=k.CreateJobObjectW(None,None);assert job
limits=Extended();limits.basic.flags=0x2200;limits.jobMemory=private_limit_mib*1024**2
assert k.SetInformationJobObject(job,9,ctypes.byref(limits),ctypes.sizeof(limits))
installed_limits=Extended();assert k.QueryInformationJobObject(job,9,ctypes.byref(installed_limits),ctypes.sizeof(installed_limits),None)
assert installed_limits.jobMemory==private_limit_mib*1024**2 and installed_limits.basic.flags&0x2200==0x2200
child=None;low=before;aborted=None;closed=False;code=None;peak=0;working_peak=0;priority=None;start=time.monotonic();low_memory_seen=False;consecutive_low=0
class ProcessMemory(ctypes.Structure):_fields_=[('cb',W.DWORD),('faults',W.DWORD),*[(n,ctypes.c_size_t) for n in ('peakWorking','working','peakPaged','paged','peakNonpaged','nonpaged','pagefile','peakPagefile')]]
ps=ctypes.WinDLL('psapi',use_last_error=True);ps.GetProcessMemoryInfo.argtypes=[W.HANDLE,ctypes.c_void_p,W.DWORD]
node='C:/Users/cogpsy-vrlab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
command=([node,str((root/a.script).resolve()),*a.args] if Path(a.script).suffix=='.mjs' else [os.sys.executable,'-B',str((root/a.script).resolve()),*a.args])
author=root/'assets/sprite-sources/resident-motion/stadt-guenther-tuev/adult-v1'
pin_paths=list(author.glob('*.py'))+[author/name for name in ['pre-admission-person.json','pre-admission-family.json','pre-admission-motion.json','lip-fits.json','raw-directions-v2.png','validation-baseline.json']]
pin_paths += list((author/'registered').glob('*.png'))+[root/'tools'/name for name in ['build-street-character-sprites.py','build-street-mouths.py']]+[root/'.agents/skills/animate-2d-characters/scripts'/name for name in ['painted_walk.py','harmonize_material.py']]
pin_paths += [root/'output/street-redesign/guenther-end-to-end'/name for name in ['full-working/body-index.json','family-mouths/mouths-working.json']]
pin_paths += list(author.glob('*.mjs'))+[root/'tests/guenther-tuev-adult.test.mjs',root/'.agents/skills/animate-2d-characters/scripts/audit_final_frame_analysis.py',root/'For-AI/AUDIO-TEXT-LIBRARY.js',root/'For-AI/VOICE-CAST.json']
pin_paths += list((root/'assets/voices/city-dialogue').glob('stadt-guenther-tuev-*'))
pin_paths += [root/a.script]
declared_output_paths=[]
if targeted_source_bounded:declared_output_paths.append(root/'output/street-redesign/guenther-end-to-end/full-working/body-index.json')
if Path(a.script).name=='prepare-family-mouths.py':declared_output_paths.append(root/'output/street-redesign/guenther-end-to-end/family-mouths/mouths-working.json')
pin_paths=[path for path in pin_paths if path not in declared_output_paths]
input_pins={path.relative_to(root).as_posix():hashlib.sha256(path.read_bytes()).hexdigest() for path in pin_paths if path.exists()}
if metadata_bounded or far_pilot_bounded or targeted_source_bounded or v2_compile_batch or v2_resume_batch or v2_native_small or v2_formal_batch or v2_mobile_own4_small or v2_clean_bounded:
 before=free();assert before>=minimum_start,('HOLD final fresh memory after pins',before)
 low=before
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
   if consecutive_low>=(2 if two_low_bounded else 1) or time.monotonic()-start>maximum_seconds:
    aborted='two consecutive below1GiB samples' if two_low_bounded and consecutive_low>=2 else 'first below1GiB' if consecutive_low else f'{maximum_seconds}second child bound'
    if not (out/'cpu-memory-hold.json').exists():(out/'cpu-memory-hold.json').write_text(json.dumps({'stage':a.stage,'reason':aborted,'minimumFreeMiB':low}))
    assert k.TerminateJobObject(job,1);break
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
 row['installedJobLimitMiB']=installed_limits.jobMemory/1024**2;row['installedJobFlags']=installed_limits.basic.flags;row['lowMemorySeen']=low_memory_seen;row['consecutiveLowAbortThreshold']=2 if two_low_bounded else 1;row['samplingIntervalSeconds']=.25
 row['inputPinsBefore']=input_pins;row['inputMismatches']=[path for path,digest in input_pins.items() if hashlib.sha256((root/path).read_bytes()).hexdigest()!=digest]
 row['declaredMutableOutputs']=[path.relative_to(root).as_posix() for path in declared_output_paths]
 (out/(a.stage+'.json')).write_text(json.dumps(row,indent=2)+'\n');print(json.dumps(row))
 if (out/(a.stage+'.stdout.txt')).exists():print((out/(a.stage+'.stdout.txt')).read_text())
 if (out/(a.stage+'.stderr.txt')).exists():print((out/(a.stage+'.stderr.txt')).read_text())
assert code==0 and not aborted and not low_memory_seen and closed and not row['inputMismatches'],row
