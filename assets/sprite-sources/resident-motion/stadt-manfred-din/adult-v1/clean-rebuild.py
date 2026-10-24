"""Rebuild one adult family in an empty ignored mirror from raw authoring inputs.

No selected WebP, registered PNG, old body-index or full-cast manifest is copied.
Requires the integrator's exclusive heavy-CPU lease; never run automatically.
"""
from pathlib import Path
import argparse,hashlib,json,shutil,subprocess,sys,os,ctypes,time
from ctypes import wintypes
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OWN=HERE.relative_to(ROOT);ID='stadt-manfred-din'
WORK=Path('output/street-redesign/manfred-din-end-to-end')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

kernel=ctypes.WinDLL('kernel32',use_last_error=True)
kernel.GetCurrentProcess.restype=wintypes.HANDLE
kernel.SetPriorityClass.argtypes=[wintypes.HANDLE,wintypes.DWORD];kernel.SetPriorityClass.restype=wintypes.BOOL
kernel.GetPriorityClass.argtypes=[wintypes.HANDLE];kernel.GetPriorityClass.restype=wintypes.DWORD
assert kernel.SetPriorityClass(kernel.GetCurrentProcess(),0x4000)
assert kernel.GetPriorityClass(kernel.GetCurrentProcess())==16384
class Memory(ctypes.Structure):
 _fields_=[('length',wintypes.DWORD),('load',wintypes.DWORD),('totalPhys',ctypes.c_ulonglong),('availPhys',ctypes.c_ulonglong),('totalPage',ctypes.c_ulonglong),('availPage',ctypes.c_ulonglong),('totalVirtual',ctypes.c_ulonglong),('availVirtual',ctypes.c_ulonglong),('availExtended',ctypes.c_ulonglong)]
class Counters(ctypes.Structure):
 _fields_=[('cb',wintypes.DWORD),('faults',wintypes.DWORD),*[(name,ctypes.c_size_t) for name in ('peakWorkingSet','workingSet','quotaPeakPaged','quotaPaged','quotaPeakNonPaged','quotaNonPaged','pagefile','peakPagefile')]]
psapi=ctypes.WinDLL('psapi',use_last_error=True)
psapi.GetProcessMemoryInfo.argtypes=[wintypes.HANDLE,ctypes.POINTER(Counters),wintypes.DWORD]
def process_peak(child):
 m=Counters();m.cb=ctypes.sizeof(m)
 return int(m.peakWorkingSet) if psapi.GetProcessMemoryInfo(wintypes.HANDLE(int(child._handle)),ctypes.byref(m),m.cb) else 0

def available():
 m=Memory();m.length=ctypes.sizeof(m);assert kernel.GlobalMemoryStatusEx(ctypes.byref(m));return m.availPhys

def run():
 parser=argparse.ArgumentParser();parser.add_argument('--name',default='md-clean-v1');parser.add_argument('--mirror',type=Path,default=Path('C:/gs-md-clean-v1'));args=parser.parse_args()
 assert args.name.startswith('md-clean-') and all(c.isalnum() or c=='-' for c in args.name)
 mirror=args.mirror.resolve();assert not mirror.exists(),'Fresh directory required, prior evidence is retained'
 motion=json.loads((HERE/'motion-spec.json').read_text())
 assert motion['actor']==ID and motion['strideDistance']>0
 assert available()>=1.5*1024**3,'Hold: raw replay start below1.5GiB'
 mirror.mkdir(parents=True)
 copied=[]
 def copy(relative):
  source=ROOT/relative;target=mirror/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target);assert sha(source)==sha(target);copied.append(relative.as_posix())
 for relative in ['prepare-neutrals.py','pilot-motion.py','fit-adult-mouths.py','build-family-source.py','prepare-family-mouths.py','measure-sole-cadence.py','build-candidate.py','install-candidate.py','bind-delivery.py','motion-spec.json','pre-admission-person.json','pre-admission-family.json','raw/cardinals-v3.png','raw/quarters-v1.png']:copy(OWN/relative)
 for relative in ['tools/build-street-character-sprites.py','tools/build-street-mouths.py','tools/build-street-motion-delivery.py','.agents/skills/animate-2d-characters/scripts/painted_walk.py','.agents/skills/animate-2d-characters/scripts/harmonize_material.py','.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py']:copy(Path(relative))
 assert not any('/registered/' in p for p in copied)
 old=json.loads((HERE/'pre-admission-person.json').read_text());manifest=mirror/'assets/characters/street/manifest.json';manifest.parent.mkdir(parents=True,exist_ok=True);manifest.write_text(json.dumps({'schemaVersion':1,'characters':{ID:old}},separators=(',',':'))+'\n')
 env={**os.environ,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1'};log=ROOT/WORK/(args.name+'-commands.txt');commands=[];child_records=[]
 def execute(relative,*arguments):
  assert available()>=1.5*1024**3,'Hold before raw child below root-required1.5GiB'
  command=[sys.executable,'-B',str(relative),*arguments];commands.append(command)
  started=time.time();freeBefore=available()
  with log.open('a',encoding='utf-8') as handle:
   handle.write('RUN '+repr(command)+'\n');handle.flush()
   flags=(subprocess.CREATE_NO_WINDOW|subprocess.BELOW_NORMAL_PRIORITY_CLASS) if os.name=='nt' else 0
   child=subprocess.Popen(command,cwd=mirror,env=env,stdout=handle,stderr=subprocess.STDOUT,creationflags=flags)
   record={'pid':child.pid,'command':command,'OMP_NUM_THREADS':env['OMP_NUM_THREADS'],'OPENBLAS_NUM_THREADS':env['OPENBLAS_NUM_THREADS'],'hidden':bool(flags),'actualPriorityClass':None}
   if os.name=='nt':
    import ctypes
    from ctypes import wintypes
    kernel=ctypes.WinDLL('kernel32',use_last_error=True);kernel.GetPriorityClass.argtypes=[wintypes.HANDLE];kernel.GetPriorityClass.restype=wintypes.DWORD
    record['actualPriorityClass']=kernel.GetPriorityClass(wintypes.HANDLE(int(child._handle)))
    assert record['actualPriorityClass']==0x4000,record
   child_records.append(record);handle.write(json.dumps(record)+'\n');handle.flush()
   minimum=freeBefore;peak=0
   while child.poll() is None:minimum=min(minimum,available());peak=max(peak,process_peak(child));time.sleep(.2)
   code=child.wait();record.update(exitCode=code,startFreeBytes=freeBefore,minimumFreeBytes=minimum,peakWorkingSetBytes=peak,endFreeBytes=available(),elapsedSeconds=time.time()-started)
   (ROOT/WORK/(args.name+'-processes.json')).write_text(json.dumps(child_records,indent=2)+'\n')
   if code:raise subprocess.CalledProcessError(code,command)
   assert minimum>=1024**3,'LATCHED sampled<1GiB; no future raw child until root direction'
 for script in ['prepare-neutrals.py','fit-adult-mouths.py','build-family-source.py','prepare-family-mouths.py','measure-sole-cadence.py']:execute(OWN/script)
 execute(OWN/'build-candidate.py','--outdir',str(WORK/'candidate-v1'),'--stride-distance',str(motion['strideDistance']))
 execute(OWN/'install-candidate.py')
 delivery=Path('assets/characters/residents')/ID/'delivery-v2/delivery'
 execute(Path('tools/build-street-motion-delivery.py'),'--manifest','assets/characters/street/manifest.json','--character',ID,'--outdir',str(delivery))
 execute(OWN/'bind-delivery.py');execute(OWN/'measure-sole-cadence.py')
 baseline=json.loads((HERE/'rebuild-baseline.json').read_text())
 assert baseline['actor']==ID
 expected=[Path(p) for p in baseline['expectedFiles']]
 comparisons=[]
 for relative in expected:
  assert (mirror/relative).is_file(),relative
  actual=sha(mirror/relative);wanted=baseline['expectedFiles'][relative.as_posix()];assert actual==wanted,(str(relative),wanted,actual);comparisons.append({'path':relative.as_posix(),'sha256':actual})
 selected=baseline['selectedPerson']
 reproduced=json.loads(manifest.read_text())['characters'][ID];assert reproduced==selected
 report={'status':'PASS','emptyMirror':mirror.as_posix(),'copiedInputs':copied,'copiedInputPins':{p:sha(mirror/p) for p in copied},'validationBaselineNotCopied':True,'initialMirrorAbsent':True,'noRegisteredOrCompiledInputs':True,'sameSelectedPerson':True,'exactOutputs':comparisons,'commands':commands,'children':child_records,'limits':'Authoring determinism only; not browser/perceptual/physical-device approval.'}
 (ROOT/WORK/(args.name+'-report.json')).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','exactOutputs':len(comparisons),'sameSelectedPerson':True}))
if __name__=='__main__':run()
