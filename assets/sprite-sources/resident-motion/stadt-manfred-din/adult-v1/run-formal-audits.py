"""Root-leased serial source stages with actual child priority and memory receipts."""
from pathlib import Path
import ctypes,ctypes.wintypes as wt,os,subprocess,sys,time,json
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
WORK=Path('output/street-redesign/manfred-din-end-to-end');OWN=HERE.relative_to(ROOT)
kernel=ctypes.WinDLL('kernel32',use_last_error=True)
kernel.GetCurrentProcess.restype=wt.HANDLE
kernel.SetPriorityClass.argtypes=[wt.HANDLE,wt.DWORD];kernel.SetPriorityClass.restype=wt.BOOL
kernel.GetPriorityClass.argtypes=[wt.HANDLE];kernel.GetPriorityClass.restype=wt.DWORD
assert kernel.SetPriorityClass(kernel.GetCurrentProcess(),0x4000)
assert kernel.GetPriorityClass(kernel.GetCurrentProcess())==16384
class Memory(ctypes.Structure):
 _fields_=[('length',wt.DWORD),('load',wt.DWORD),('totalPhys',ctypes.c_ulonglong),('availPhys',ctypes.c_ulonglong),('totalPage',ctypes.c_ulonglong),('availPage',ctypes.c_ulonglong),('totalVirtual',ctypes.c_ulonglong),('availVirtual',ctypes.c_ulonglong),('availExtended',ctypes.c_ulonglong)]
class Counters(ctypes.Structure):
 _fields_=[('cb',wt.DWORD),('faults',wt.DWORD),*[(name,ctypes.c_size_t) for name in ('peakWorkingSet','workingSet','quotaPeakPaged','quotaPaged','quotaPeakNonPaged','quotaNonPaged','pagefile','peakPagefile')]]
psapi=ctypes.WinDLL('psapi',use_last_error=True)
psapi.GetProcessMemoryInfo.argtypes=[wt.HANDLE,ctypes.POINTER(Counters),wt.DWORD]
def process_peak(child):
 m=Counters();m.cb=ctypes.sizeof(m)
 return int(m.peakWorkingSet) if psapi.GetProcessMemoryInfo(wt.HANDLE(int(child._handle)),ctypes.byref(m),m.cb) else 0

def available():
 m=Memory();m.length=ctypes.sizeof(m);assert kernel.GlobalMemoryStatusEx(ctypes.byref(m));return m.availPhys
env={**os.environ,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1'}
records=[];folder=ROOT/WORK;folder.mkdir(parents=True,exist_ok=True)
assert available()>=2.5*1024**3,'Hold: less than2.5GiB free before source batch'
def execute(script,*args):
 assert available()>=2.5*1024**3,'Hold before audit child: less than2.5GiB free'
 command=[sys.executable,'-B',str(script),*args]
 record={'command':command,'startFreeBytes':available(),'startedAt':time.time(),'hidden':True,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1'}
 with (folder/'formal-audits-certified.log').open('a',encoding='utf-8') as log:
  log.write('RUN '+repr(command)+'\n');log.flush()
  child=subprocess.Popen(command,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW|subprocess.BELOW_NORMAL_PRIORITY_CLASS)
  record['pid']=child.pid;record['priorityClass']=kernel.GetPriorityClass(wt.HANDLE(int(child._handle)));assert record['priorityClass']==16384
  minimum=record['startFreeBytes'];peak=0
  while child.poll() is None:minimum=min(minimum,available());peak=max(peak,process_peak(child));time.sleep(.2)
  record.update(exitCode=child.returncode,peakWorkingSetBytes=peak,minimumFreeBytes=minimum,endFreeBytes=available(),elapsedSeconds=time.time()-record['startedAt']);records.append(record)
  (folder/'formal-audits-certified-processes.json').write_text(json.dumps(records,indent=2)+'\n')
  if child.returncode:raise subprocess.CalledProcessError(child.returncode,command)
  assert minimum>=1024**3,'LATCHED HOLD: sampled below1GiB; no future child until root direction'
for variant in ('desktop','mobile'):
 base=WORK/'final-frame-analysis'
 execute(Path('.agents/skills/animate-2d-characters/scripts/audit_final_frame_analysis.py'),str(base/f'{variant}-manifest.json'),'--review',str(base/f'{variant}-review.json'),'--report',str(base/f'{variant}-audit.json'))
print(json.dumps({'status':'TWO_FORMAL_AUDITS_CLOSED','children':len(records),'minimumFreeBytes':min(r['minimumFreeBytes'] for r in records)}))
