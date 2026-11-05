"""Bounded own CPU child; every invocation still requires an explicit root lease."""
from pathlib import Path
import argparse,ctypes,hashlib,json,os,subprocess,time
from ctypes import wintypes as W
p=argparse.ArgumentParser();p.add_argument('stage');p.add_argument('script');p.add_argument('args',nargs=argparse.REMAINDER);a=p.parse_args()
root=Path.cwd();out=root/'output/street-redesign/hildegard-brotzeit-end-to-end/resources';out.mkdir(parents=True,exist_ok=True)
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
two_sample_abort=True
minimum_start=1664
private_limit_mib=384
maximum_seconds=360 if Path(a.script).name in ('build-family-source.py','clean-rebuild.py') else 240
before=free()
if before<minimum_start:
 refusal={'stage':a.stage,'status':'REFUSED_BEFORE_JOB_OR_CHILD','freshMiB':before,'minimumStartMiB':minimum_start,'privateCommitLimitMiB':private_limit_mib,'maximumSeconds':maximum_seconds,'childCreated':False,'jobCreated':False}
 (out/(a.stage+'-admission-refusal.json')).write_text(json.dumps(refusal,indent=2)+'\n')
 raise RuntimeError(('HOLD fresh memory; explicit root review before another invocation',before))
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
author=Path(__file__).resolve().parent
pin_paths=list(author.glob('*.py'))+[author/name for name in ['lip-fits.json','registration.json','pre-admission-person.json','voice-baseline.json','pose-contract.json','new-motion-capability-plan.json']]
pin_paths += list(author.glob('raw-*.png'))+list(author.glob('reference-*.png'))+list((author/'registered').glob('*.png'))+[root/'tools'/name for name in ['build-street-character-sprites.py','build-street-mouths.py']]+[root/'.agents/skills/animate-2d-characters/scripts'/name for name in ['painted_walk.py','harmonize_material.py']]
pin_paths += [root/'output/street-redesign/hildegard-brotzeit-end-to-end'/name for name in ['full-working/body-index.json','family-mouths/mouths-working.json']]
input_pins={path.relative_to(root).as_posix():hashlib.sha256(path.read_bytes()).hexdigest() for path in pin_paths if path.exists()}
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
   if consecutive_low>=(2 if two_sample_abort else 1) or time.monotonic()-start>maximum_seconds:
    aborted='two consecutive below1GiB samples' if two_sample_abort and consecutive_low>=2 else 'first below1GiB' if consecutive_low else f'{maximum_seconds}second child bound';assert k.TerminateJobObject(job,1);break
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
 row['installedJobLimitMiB']=installed_limits.jobMemory/1024**2;row['installedJobFlags']=installed_limits.basic.flags;row['lowMemorySeen']=low_memory_seen;row['consecutiveLowAbortThreshold']=2 if two_sample_abort else 1;row['samplingIntervalSeconds']=.25
 row['inputPinsBefore']=input_pins;row['inputMismatches']=[path for path,digest in input_pins.items() if hashlib.sha256((root/path).read_bytes()).hexdigest()!=digest]
 (out/(a.stage+'.json')).write_text(json.dumps(row,indent=2)+'\n');print(json.dumps(row))
 if (out/(a.stage+'.stdout.txt')).exists():print((out/(a.stage+'.stdout.txt')).read_text())
 if (out/(a.stage+'.stderr.txt')).exists():print((out/(a.stage+'.stderr.txt')).read_text())
assert code==0 and not aborted and not low_memory_seen and closed and not row['inputMismatches'],row




