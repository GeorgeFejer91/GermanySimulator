"""Reproduce Guenther from untouched own input in a new short clean mirror."""
from pathlib import Path
import argparse,hashlib,json,os,shutil,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
ID='stadt-guenther-tuev';AUTHOR=HERE.relative_to(ROOT)
WORK=Path('output/street-redesign/guenther-end-to-end')
SELECTED=Path('assets/characters/residents')/ID/'delivery-v2'
# Authored compiler argument from the accepted own near+far source calibration.
# Python3.12 compensated sum yields a mean2e-15 below the initial external
# naive mean. Recheck the actual source fit, then replay this pinned parameter.
# This generation parameter is independent of the validation-only baseline.
AUTHORED_CYCLE_DISTANCE=13.162098078419474
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
def inherited_job_limit():
 import ctypes
 from ctypes import wintypes as W
 class Basic(ctypes.Structure):_fields_=[('processTime',ctypes.c_longlong),('jobTime',ctypes.c_longlong),('flags',W.DWORD),('minWorking',ctypes.c_size_t),('maxWorking',ctypes.c_size_t),('active',W.DWORD),('affinity',ctypes.c_size_t),('priority',W.DWORD),('scheduling',W.DWORD)]
 class IO(ctypes.Structure):_fields_=[(n,ctypes.c_ulonglong) for n in ('readOps','writeOps','otherOps','readBytes','writeBytes','otherBytes')]
 class Extended(ctypes.Structure):_fields_=[('basic',Basic),('io',IO),('processMemory',ctypes.c_size_t),('jobMemory',ctypes.c_size_t),('peakProcessMemory',ctypes.c_size_t),('peakJobMemory',ctypes.c_size_t)]
 kernel=ctypes.WinDLL('kernel32',use_last_error=True);kernel.QueryInformationJobObject.argtypes=[W.HANDLE,ctypes.c_int,ctypes.c_void_p,W.DWORD,ctypes.c_void_p]
 limits=Extended();assert kernel.QueryInformationJobObject(None,9,ctypes.byref(limits),ctypes.sizeof(limits),None),'Raw replay must inherit its owned kernel job'
 assert limits.jobMemory==384*1024**2 and limits.basic.flags&0x2200==0x2200,'Expected384MiB whole-job cap and kill-on-close'
 return {'queriedWholeJobPrivateCapMiB':limits.jobMemory/1024**2,'queriedJobFlags':limits.basic.flags}
def main(args):
 mirror=args.mirror.resolve();destination=args.outdir.resolve()
 assert not mirror.exists() and len(str(mirror))<65,'Use an initially nonexistent short own-input mirror'
 assert destination.is_relative_to(ROOT/WORK) and not destination.exists()
 actual_job_limit=inherited_job_limit()
 baseline=json.loads((HERE/'validation-baseline.json').read_text())
 assert baseline['id']==ID
 destination.mkdir(parents=True);mirror.mkdir()
 inputs=[AUTHOR/name for name in SCRIPTS+['pre-admission-person.json','pre-admission-family.json','lip-fits.json']]
 inputs += [AUTHOR/name for name in ['raw-directions-v1.png','raw-directions-v2.png','identity-original.png']]
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
  'commands':[],'inheritedKernelJobLimit':actual_job_limit}
 report=destination/'report.json'
 def save():report.write_bytes((json.dumps(receipt,indent=2)+'\n').encode())
 def run(relative,*arguments):
  actual_job_limit=inherited_job_limit()
  available=free_mib()
  if available is not None and available<1536:
   receipt.update(status='HOLD: fresh child memory below1536MiB',refusedStage=str(relative),actualFreshMiB=available);save();raise RuntimeError(receipt['status'])
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
  minimum=available;peak=0;consecutive_low=0;aborted=None
  maximum=240 if relative.name=='build-family-source.py' else 120 if relative.name in ('build-candidate.py','build-street-motion-delivery.py') and '--check' not in arguments else 60
  row['maximumSeconds']=maximum;row['minimumFreshMiB']=1536;row['inheritedKernelJobPrivateCapMiB']=actual_job_limit['queriedWholeJobPrivateCapMiB'];row['queriedJobFlags']=actual_job_limit['queriedJobFlags'];row['samplingIntervalSeconds']=.25
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
   if current is not None:
    minimum=min(minimum,current)
    if current<1024:
     consecutive_low+=1
     (ROOT/WORK/'resources/cpu-memory-hold.json').write_text(json.dumps({'stage':'true-clean','childPid':child.pid,'reason':'first below1GiB sample; explicit root review required','minimumFreeMiB':minimum})+'\n')
    else:consecutive_low=0
   if consecutive_low>=2 or time.time()-started>maximum:
    aborted='two consecutive below1GiB samples' if consecutive_low>=2 else 'stage timeout'
    child.terminate();child.wait(timeout=15);code=child.returncode;break
   code=child.poll()
   if code is not None:break
   time.sleep(.25)
  row.update(exitCode=code,aborted=aborted,processClosed=child.poll() is not None,elapsedSeconds=round(time.time()-started,3),finishedUtc=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),freeMiBAfter=free_mib(),minimumFreeMiB=minimum,peakWorkingMiB=round(peak/1024**2,2));save()
  if code!=0 or aborted is not None:receipt['status']='RED: owned reconstruction child failed or resource-aborted';save()
  assert code==0 and aborted is None and row['processClosed'],row
  if minimum is not None and minimum<1024:
   receipt['status']='HOLD: below1GiB observed; no next child';save();raise RuntimeError(receipt['status'])
 for name in SCRIPTS[:1]+SCRIPTS[2:5]:run(AUTHOR/name)
 run(AUTHOR/'measure-sole-cadence.py')
 measured_cycle=json.loads((mirror/WORK/'sole-cadence/report.json').read_text())['fittedCycle']
 assert abs(measured_cycle-AUTHORED_CYCLE_DISTANCE)<1e-9,('Own raw-source calibration differs from authored motion parameter',measured_cycle,AUTHORED_CYCLE_DISTANCE)
 receipt['motionParameter']={'authoredCycleDistance':AUTHORED_CYCLE_DISTANCE,'independentlyMeasuredRawSourceCycleDistance':measured_cycle,'agreementTolerance':1e-9,'role':'Pinned authored compiler argument; independent of validation baseline or expected person'};save()
 run(AUTHOR/'build-candidate.py','--outdir',str(mirror/WORK/'candidate-v1'),'--stride-distance',str(AUTHORED_CYCLE_DISTANCE))
 run(AUTHOR/'install-candidate.py')
 private_manifest=mirror/WORK/'private-manifest.json'
 delivery_args=['--manifest',str(private_manifest),'--character',ID,'--outdir',str(mirror/SELECTED/'delivery')]
 run(Path('tools/build-street-motion-delivery.py'),*delivery_args)
 run(AUTHOR/'bind-delivery.py')
 run(Path('tools/build-street-motion-delivery.py'),*delivery_args,'--check')
 actual={};receipt['status']='VALIDATING only after raw reconstruction';save()
 for relative,digest in baseline['expectedHashes'].items():
  actual_digest=sha(mirror/relative) if (mirror/relative).exists() else None
  if actual_digest!=digest:
   receipt.update(status='RED: reconstructed output mismatch',mismatch={'file':relative,'expected':digest,'actual':actual_digest});save();raise AssertionError(relative)
  actual[relative]=sha(mirror/relative)
 person=json.loads(private_manifest.read_text())['characters'][ID]
 if person!=baseline['person']:receipt['status']='RED: rebuilt own person mismatch';save();raise AssertionError(receipt['status'])
 receipt.update(status='PASS',expectedFilesExact=actual,ownPersonExact=True)
 save();print(json.dumps({'status':'PASS','exactFiles':len(actual),'personExact':True,'report':str(report)}))
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--mirror',type=Path,required=True);p.add_argument('--outdir',type=Path,required=True);main(p.parse_args())
