"""Artifact-only extraction/audit under root's explicit1.8GiB stage allowance."""
from pathlib import Path
import ctypes,ctypes.wintypes as wt,os,sys,time,threading,json,runpy,gc
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4];WORK=ROOT/'output/street-redesign/manfred-din-end-to-end'
audit='--audit-reviewed' in sys.argv
k=ctypes.WinDLL('kernel32',use_last_error=True);k.GetCurrentProcess.restype=wt.HANDLE
k.SetPriorityClass.argtypes=[wt.HANDLE,wt.DWORD];k.GetPriorityClass.argtypes=[wt.HANDLE];k.GetPriorityClass.restype=wt.DWORD
handle=k.GetCurrentProcess();assert k.SetPriorityClass(handle,16384);assert k.GetPriorityClass(handle)==16384
assert os.environ['OMP_NUM_THREADS']==os.environ['OPENBLAS_NUM_THREADS']=='1'
class Memory(ctypes.Structure):
 _fields_=[('length',wt.DWORD),('load',wt.DWORD),*[(n,ctypes.c_ulonglong) for n in ['totalPhys','availPhys','totalPage','availPage','totalVirtual','availVirtual','availExtended']]]
def available():
 m=Memory();m.length=ctypes.sizeof(m);assert k.GlobalMemoryStatusEx(ctypes.byref(m));return m.availPhys
minimum=available();active=True;records=[]
def monitor():
 global minimum
 while active:minimum=min(minimum,available());time.sleep(.15)
thread=threading.Thread(target=monitor,daemon=True);thread.start()
def execute(path,*args):
 assert minimum>=1024**3,'LATCHED sampled<1GiB; stop future artifact stages'
 before=available();assert before>=1.8*1024**3,'Hold: below root-authorized1.8GiB artifact minimum'
 start=time.time();sys.argv=[str(path),*args];runpy.run_path(str(path),run_name='__main__');gc.collect()
 records.append({'command':[sys.executable,'-B',str(path),*args],'pid':os.getpid(),'priorityClass':k.GetPriorityClass(handle),'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1','startFreeBytes':before,'minimumFreeBytes':minimum,'endFreeBytes':available(),'elapsedSeconds':time.time()-start})
 (WORK/('formal-audits-processes.json' if audit else 'artifact-prepare-processes.json')).write_text(json.dumps(records,indent=2)+'\n')
try:
 if not audit:
  execute(ROOT/'tools/build-street-motion-delivery.py','--manifest','assets/characters/street/manifest.json','--character','stadt-manfred-din','--outdir','assets/characters/residents/stadt-manfred-din/delivery-v2/delivery','--check')
  execute(HERE/'prepare-final-frame-analysis.py');execute(HERE/'prepare-review-montages.py')
 else:
  execute(HERE/'prepare-final-frame-analysis.py','--accept-reviewed')
  for variant in ('desktop','mobile'):
   base=WORK/'final-frame-analysis'
   execute(ROOT/'.agents/skills/animate-2d-characters/scripts/audit_final_frame_analysis.py',str(base/f'{variant}-manifest.json'),'--review',str(base/f'{variant}-review.json'),'--report',str(base/f'{variant}-audit.json'))
 print(json.dumps({'status':'FORMAL_AUDITS_CLOSED' if audit else 'ARTIFACT_PREPARATION_CLOSED','pid':os.getpid(),'minimumFreeBytes':minimum,'stages':len(records),'actualReviewRequired':not audit}))
finally:active=False;thread.join()
