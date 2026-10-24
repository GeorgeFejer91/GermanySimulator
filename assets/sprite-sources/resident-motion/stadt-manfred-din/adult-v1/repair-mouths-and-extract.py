"""Root-leased mouth-only correction; preserve every existing body pack byte."""
from pathlib import Path
import ctypes,ctypes.wintypes as wt,os,sys,threading,time,json,runpy,hashlib,shutil,gc
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4];WORK=ROOT/'output/street-redesign/manfred-din-end-to-end'
k=ctypes.WinDLL('kernel32',use_last_error=True);k.GetCurrentProcess.restype=wt.HANDLE
k.SetPriorityClass.argtypes=[wt.HANDLE,wt.DWORD];k.GetPriorityClass.argtypes=[wt.HANDLE];k.GetPriorityClass.restype=wt.DWORD
handle=k.GetCurrentProcess();assert k.SetPriorityClass(handle,16384);assert k.GetPriorityClass(handle)==16384
assert os.environ['OMP_NUM_THREADS']==os.environ['OPENBLAS_NUM_THREADS']=='1'
class Memory(ctypes.Structure):
 _fields_=[('length',wt.DWORD),('load',wt.DWORD),*[(n,ctypes.c_ulonglong) for n in ['totalPhys','availPhys','totalPage','availPage','totalVirtual','availVirtual','availExtended']]]
def available():
 m=Memory();m.length=ctypes.sizeof(m);assert k.GlobalMemoryStatusEx(ctypes.byref(m));return m.availPhys
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
manifest=ROOT/'assets/characters/street/manifest.json';old=json.loads(manifest.read_text());ID='stadt-manfred-din';person=old['characters'][ID]
bodyfiles=[WORK/'full-working/body-index.json',*[ROOT/m['file'].removeprefix('./') for m in [person['standing'],*person['variants'].values()]],*sorted((ROOT/'assets/characters/residents'/ID/'delivery-v2/delivery').glob('*.webp'))]
pins={p.relative_to(ROOT).as_posix():sha(p) for p in bodyfiles}
records=[];active=True;minimum=available();assert minimum>=2.5*1024**3
def monitor():
 global minimum
 while active:minimum=min(minimum,available());time.sleep(.15)
thread=threading.Thread(target=monitor,daemon=True);thread.start()
def execute(path,*args):
 assert minimum>=1024**3,'LATCHED sampled<1GiB; no future stage'
 before=available();assert before>=2.5*1024**3,'Hold: less than2.5GiB free at stage start'
 start=time.time();sys.argv=[str(path),*args];runpy.run_path(str(path),run_name='__main__');gc.collect()
 records.append({'command':[sys.executable,'-B',str(path),*args],'pid':os.getpid(),'priorityClass':k.GetPriorityClass(handle),'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1','startFreeBytes':before,'minimumFreeBytes':minimum,'endFreeBytes':available(),'elapsedSeconds':time.time()-start})
 (WORK/'mouth-repair-processes.json').write_text(json.dumps(records,indent=2)+'\n')
try:
 for name in ['fit-adult-mouths.py','prepare-family-mouths.py','audit-native-mouths.py']:execute(HERE/name)
 distance=json.loads((HERE/'motion-spec.json').read_text())['strideDistance']
 candidate=WORK/'candidate-lips-v2';execute(HERE/'build-candidate.py','--outdir',str(candidate),'--stride-distance',str(distance))
 updated=json.loads((candidate/'person.json').read_text())
 assert updated['variants']==person['variants'] and updated['standing']==person['standing']
 for relative,digest in pins.items():assert sha(ROOT/relative)==digest,relative
 prior_mouth=person['mouthPaint'].copy();shutil.copyfile(candidate/'mouths-v1.json',ROOT/person['mouthPaint']['file'].removeprefix('./'))
 person['mouthPaint']=updated['mouthPaint'];jsonText=json.dumps(old,separators=(',',':'),ensure_ascii=False)+'\n';manifest.write_text(jsonText)
 assert all(json.loads(manifest.read_text())['characters'][key]==value for key,value in old['characters'].items() if key!=ID)
 execute(ROOT/'tools/build-street-motion-delivery.py','--manifest','assets/characters/street/manifest.json','--character',ID,'--outdir',f'assets/characters/residents/{ID}/delivery-v2/delivery','--check')
 execute(HERE/'prepare-final-frame-analysis.py');execute(HERE/'prepare-review-montages.py')
 for relative,digest in pins.items():assert sha(ROOT/relative)==digest,relative
 report={'status':'MOUTH_ONLY_REPAIR_AND_ENCODED_EXTRACTION_CLOSED','pid':os.getpid(),'priorityClass':k.GetPriorityClass(handle),'minimumFreeBytes':minimum,'unchangedBodyMovementPins':pins,'oldMouth':prior_mouth,'newMouth':person['mouthPaint'],'stages':records,'actual116boardInspection':'PENDING; prepared lossless four-board pages, no automatic visual claim'}
 (WORK/'mouth-repair-report.json').write_text(json.dumps(report,indent=2)+'\n');(WORK/'final-person.json').write_text(json.dumps(person,indent=2)+'\n');print(json.dumps({key:report[key] for key in ['status','pid','priorityClass','minimumFreeBytes','oldMouth','newMouth']}))
finally:active=False;thread.join()
