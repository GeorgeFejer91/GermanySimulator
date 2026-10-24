"""Reproduce Wolfgang from untouched own input in a new short clean mirror."""
from pathlib import Path
import argparse,hashlib,json,os,shutil,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
ID='stadt-wolfgang-schulz';AUTHOR=HERE.relative_to(ROOT)
WORK=Path('output/street-redesign/wolfgang-end-to-end')
SELECTED=Path('assets/characters/residents')/ID/'delivery-v2'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
SCRIPTS=['prepare-neutrals.py','pilot-motion.py','build-family-source.py','fit-adult-mouths.py',
 'prepare-family-mouths.py','build-candidate.py','install-candidate.py','bind-delivery.py','measure-sole-cadence.py']
DEPENDENCIES=[Path('tools')/n for n in ['build-street-character-sprites.py','build-street-mouths.py','build-street-motion-delivery.py']]
DEPENDENCIES += [Path('.agents/skills/animate-2d-characters/scripts')/n for n in ['painted_walk.py','harmonize_material.py','assess_walk_speed.py']]
def free_mib():
 if os.name!='nt':return None
 import ctypes
 class MemoryStatus(ctypes.Structure):
  _fields_=[('length',ctypes.c_ulong),('load',ctypes.c_ulong),('total',ctypes.c_ulonglong),('available',ctypes.c_ulonglong),('pageTotal',ctypes.c_ulonglong),('pageAvailable',ctypes.c_ulonglong),('virtualTotal',ctypes.c_ulonglong),('virtualAvailable',ctypes.c_ulonglong),('extended',ctypes.c_ulonglong)]
 status=MemoryStatus();status.length=ctypes.sizeof(status)
 if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):raise ctypes.WinError()
 return round(status.available/1024**2)
def main(args):
 mirror=args.mirror.resolve();destination=args.outdir.resolve()
 assert not mirror.exists() and len(str(mirror))<65,'Use an initially nonexistent short own-input mirror'
 assert destination.is_relative_to(ROOT/WORK) and not destination.exists()
 baseline=json.loads((HERE/'validation-baseline.json').read_text())
 assert baseline['id']==ID
 destination.mkdir(parents=True);mirror.mkdir()
 inputs=[AUTHOR/name for name in SCRIPTS+['pre-admission-person.json','pre-admission-family.json','lip-fits.json']]
 inputs += [p.relative_to(ROOT) for folder in ['raw','references'] for p in (HERE/folder).iterdir() if p.is_file()]
 inputs += DEPENDENCIES
 initial={}
 for relative in inputs:
  target=mirror/relative;target.parent.mkdir(parents=True,exist_ok=True)
  shutil.copy2(ROOT/relative,target);initial[relative.as_posix()]=sha(target)
 manifest=mirror/'assets/characters/street/manifest.json';manifest.parent.mkdir(parents=True)
 immutable=json.loads((HERE/'pre-admission-person.json').read_text())
 manifest.write_bytes((json.dumps({'schemaVersion':1,'characters':{ID:immutable}},separators=(',',':'))+'\n').encode())
 initial[manifest.relative_to(mirror).as_posix()]=sha(manifest)
 receipt={'status':'RUNNING','mirrorInitiallyAbsent':True,'mirror':str(mirror),'initialInputs':initial,
  'initialRegistry':'one immutable own pre-admission record','baselineRole':'validation-only; no expected file enters generation',
  'excludedInputs':['registered','registration.json','working body/mouth paint','selected assets','current whole-cast registry','cache'],
  'commands':[]}
 report=destination/'report.json'
 def save():report.write_bytes((json.dumps(receipt,indent=2)+'\n').encode())
 def run(relative,*arguments):
  available=free_mib()
  assert available is None or available>=1024,f'HOLD free memory {available}MiB'
  command=[sys.executable,'-B',str(mirror/relative),*arguments]
  flags=getattr(subprocess,'CREATE_NO_WINDOW',0)|getattr(subprocess,'BELOW_NORMAL_PRIORITY_CLASS',0)
  started=time.time();child=subprocess.Popen(command,cwd=mirror,env={**os.environ,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1','MKL_NUM_THREADS':'1'},creationflags=flags)
  priority=None
  if os.name=='nt':
   import ctypes
   from ctypes import wintypes
   kernel=ctypes.WinDLL('kernel32',use_last_error=True);kernel.GetPriorityClass.argtypes=[wintypes.HANDLE];kernel.GetPriorityClass.restype=wintypes.DWORD
   priority=kernel.GetPriorityClass(wintypes.HANDLE(int(child._handle)))
   assert priority==16384,priority
  row={'command':command,'pid':child.pid,'freeMiBBefore':available,'priorityClassObserved':priority,'startedUtc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(started))};receipt['commands'].append(row);save()
  minimum=available;peak=0
  def working_peak():
   if os.name!='nt':return 0
   class ProcessMemory(ctypes.Structure):
    _fields_=[('cb',wintypes.DWORD),('pageFaults',wintypes.DWORD),('peakWorking',ctypes.c_size_t),('working',ctypes.c_size_t),('quotaPeakPaged',ctypes.c_size_t),('quotaPaged',ctypes.c_size_t),('quotaPeakNonPaged',ctypes.c_size_t),('quotaNonPaged',ctypes.c_size_t),('pagefile',ctypes.c_size_t),('peakPagefile',ctypes.c_size_t)]
   memory=ProcessMemory();memory.cb=ctypes.sizeof(memory)
   psapi=ctypes.WinDLL('psapi',use_last_error=True)
   psapi.GetProcessMemoryInfo.argtypes=[wintypes.HANDLE,ctypes.c_void_p,wintypes.DWORD]
   if not psapi.GetProcessMemoryInfo(wintypes.HANDLE(int(child._handle)),ctypes.byref(memory),memory.cb):raise ctypes.WinError()
   return memory.peakWorking
  while True:
   peak=max(peak,working_peak());current=free_mib()
   if current is not None:minimum=min(minimum,current)
   code=child.poll()
   if code is not None:break
   time.sleep(.5)
  row.update(exitCode=code,elapsedSeconds=round(time.time()-started,3),finishedUtc=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),freeMiBAfter=free_mib(),minimumFreeMiB=minimum,peakWorkingMiB=round(peak/1024**2,2));save()
  assert code==0,row
 for name in SCRIPTS[:1]+SCRIPTS[2:5]:run(AUTHOR/name)
 run(AUTHOR/'measure-sole-cadence.py')
 cycle=json.loads((mirror/WORK/'sole-cadence/report.json').read_text())['fittedCycle']
 run(AUTHOR/'build-candidate.py','--outdir',str(mirror/WORK/'candidate-v1'),'--stride-distance',str(cycle))
 run(AUTHOR/'install-candidate.py')
 delivery_args=['--manifest',str(manifest),'--character',ID,'--outdir',str(mirror/SELECTED/'delivery')]
 run(Path('tools/build-street-motion-delivery.py'),*delivery_args)
 run(AUTHOR/'bind-delivery.py')
 run(Path('tools/build-street-motion-delivery.py'),*delivery_args,'--check')
 actual={}
 for relative,digest in baseline['expectedHashes'].items():
  assert sha(mirror/relative)==digest,relative
  actual[relative]=sha(mirror/relative)
 person=json.loads(manifest.read_text())['characters'][ID]
 assert person==baseline['person'],'Rebuilt own person mismatch'
 receipt.update(status='PASS',expectedFilesExact=actual,ownPersonExact=True)
 save();print(json.dumps({'status':'PASS','exactFiles':len(actual),'personExact':True,'report':str(report)}))
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--mirror',type=Path,required=True);p.add_argument('--outdir',type=Path,required=True);main(p.parse_args())
