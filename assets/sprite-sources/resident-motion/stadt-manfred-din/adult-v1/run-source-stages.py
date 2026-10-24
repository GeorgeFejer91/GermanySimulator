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
 assert available()>=1024**3,'Hold before next child: less than1GiB free'
 command=[sys.executable,'-B',str(script),*args]
 record={'command':command,'startFreeBytes':available(),'startedAt':time.time(),'hidden':True,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1'}
 with (folder/'source-stages.log').open('a',encoding='utf-8') as log:
  log.write('RUN '+repr(command)+'\n');log.flush()
  child=subprocess.Popen(command,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW|subprocess.BELOW_NORMAL_PRIORITY_CLASS)
  record['pid']=child.pid;record['priorityClass']=kernel.GetPriorityClass(wt.HANDLE(int(child._handle)));assert record['priorityClass']==16384
  minimum=record['startFreeBytes'];peak=0
  while child.poll() is None:minimum=min(minimum,available());peak=max(peak,process_peak(child));time.sleep(.2)
  record.update(exitCode=child.returncode,peakWorkingSetBytes=peak,minimumFreeBytes=minimum,endFreeBytes=available(),elapsedSeconds=time.time()-record['startedAt']);records.append(record)
  (folder/'source-stages-processes.json').write_text(json.dumps(records,indent=2)+'\n')
  if child.returncode:raise subprocess.CalledProcessError(child.returncode,command)
  assert minimum>=1024**3,'LATCHED HOLD: sampled below1GiB; no future child until root direction'
for name in ['fit-adult-mouths.py','audit-source-contacts.py','build-family-source.py','prepare-family-mouths.py','audit-native.py','audit-native-mouths.py','measure-sole-cadence.py']:execute(OWN/name)
cadence=json.loads((folder/'sole-cadence/report.json').read_text());distance=round(cadence['fittedCycle'],2)
assert distance>0
motion={'actor':'stadt-manfred-din','strideDistance':distance,'sourceCalibration':str(WORK/'sole-cadence/report.json').replace('\\','/'),'purpose':'Own source RGB sole centroid calibrated motion parameter; generation reads no current registry.'}
(HERE/'motion-spec.json').write_text(json.dumps(motion,indent=2)+'\n')
execute(OWN/'build-candidate.py','--outdir',str(WORK/'candidate-v1'),'--stride-distance',str(distance))
execute(OWN/'install-candidate.py')
execute(Path('tools/build-street-motion-delivery.py'),'--manifest','assets/characters/street/manifest.json','--character','stadt-manfred-din','--outdir','assets/characters/residents/stadt-manfred-din/delivery-v2/delivery')
execute(OWN/'bind-delivery.py');execute(OWN/'measure-sole-cadence.py')
print(json.dumps({'status':'SOURCE_STAGES_CLOSED','children':len(records),'minimumFreeBytes':min(r['minimumFreeBytes'] for r in records),'strideDistance':distance}))
