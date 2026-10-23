"""Rebuild this actor in an empty mirror using tracked authoring inputs only.

No prior ignored working paint, registered PNGs, selected atlases or mutable
whole-cast registry enter the build. Expected output hashes and person come
from tracked validation-only rebuild-baseline.json, read after generation.
The initial mirror registry contains only this actor's immutable pre-admission
record. No Git checkout, refs or publication occurs.
"""
from pathlib import Path
import argparse,hashlib,json,os,shutil,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
ID='stadt-klaus-dieter-klein'
WORK=Path('output/street-redesign/klaus-klein-end-to-end')
AUTHOR=HERE.relative_to(ROOT)
SELECTED=Path('assets/characters/residents')/ID/'delivery-v2'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def main(args):
 if os.name=='nt':
  import ctypes
  from ctypes import wintypes
  kernel=ctypes.WinDLL('kernel32',use_last_error=True)
  kernel.GetCurrentProcess.restype=wintypes.HANDLE
  kernel.SetPriorityClass.argtypes=[wintypes.HANDLE,wintypes.DWORD]
  kernel.SetPriorityClass.restype=wintypes.BOOL
  if not kernel.SetPriorityClass(kernel.GetCurrentProcess(),0x4000):raise ctypes.WinError(ctypes.get_last_error())
 destination=args.outdir.resolve()
 assert (destination.is_relative_to(ROOT/WORK) and destination!=ROOT/WORK) or destination in (ROOT/'output/kc1',ROOT/'output/kc2')
 destination.mkdir(parents=True,exist_ok=False)
 mirror=destination/'root'
 if os.name=='nt':mirror=Path('\\\\?\\'+str(mirror))
 mirror.mkdir()
 shutil.copytree(HERE,mirror/AUTHOR,ignore=shutil.ignore_patterns('registered','registration.json','__pycache__'))
 dependencies=[Path('tools')/name for name in
  ['build-street-character-sprites.py','build-street-mouths.py','build-street-motion-delivery.py']]
 dependencies += [Path('.agents/skills/animate-2d-characters/scripts')/name
  for name in ['painted_walk.py','harmonize_material.py']]
 for rel in dependencies:
  target=mirror/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/rel,target)
 immutable=json.loads((HERE/'pre-admission-person.json').read_text())
 manifest=mirror/'assets/characters/street/manifest.json';manifest.parent.mkdir(parents=True)
 manifest.write_bytes((json.dumps({'schemaVersion':1,'characters':{ID:immutable}},separators=(',',':'))+'\n').encode())
 env={**os.environ,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1'}
 commands=[];stage_metrics=[]
 if os.name=='nt':
  class Counters(ctypes.Structure):
   _fields_=[('cb',wintypes.DWORD),('PageFaultCount',wintypes.DWORD),*[(n,ctypes.c_size_t) for n in ('PeakWorkingSetSize','WorkingSetSize','QuotaPeakPagedPoolUsage','QuotaPagedPoolUsage','QuotaPeakNonPagedPoolUsage','QuotaNonPagedPoolUsage','PagefileUsage','PeakPagefileUsage','PrivateUsage')]]
  psapi=ctypes.WinDLL('psapi',use_last_error=True);psapi.GetProcessMemoryInfo.argtypes=[wintypes.HANDLE,ctypes.POINTER(Counters),wintypes.DWORD];psapi.GetProcessMemoryInfo.restype=wintypes.BOOL
 def physical_free():
  if os.name!='nt':return None
  class Memory(ctypes.Structure):
   _fields_=[('dwLength',wintypes.DWORD),('dwMemoryLoad',wintypes.DWORD),*[(n,ctypes.c_ulonglong) for n in ('ullTotalPhys','ullAvailPhys','ullTotalPageFile','ullAvailPageFile','ullTotalVirtual','ullAvailVirtual','ullAvailExtendedVirtual')]]
  m=Memory();m.dwLength=ctypes.sizeof(m);assert kernel.GlobalMemoryStatusEx(ctypes.byref(m));return int(m.ullAvailPhys)
 def run(*command):
  command=list(command)
  if os.name=='nt':
   for index,value in enumerate(command):
    if index>=2 and Path(value).parts and Path(value).parts[0] in ('assets','tools','output'):
     command[index]=str(mirror/Path(value))
  pause_file=Path(os.environ['KLAUS_CLEAN_PAUSE_FILE']) if os.environ.get('KLAUS_CLEAN_PAUSE_FILE') else None
  held=False
  while (pause_file and pause_file.exists()) or (physical_free() is not None and physical_free()<int(os.environ.get('KLAUS_CLEAN_MIN_FREE_BYTES',str(1024**3)))):
   if not held:print('HOLD next clean child: explicit pause marker or physical free below1GiB',flush=True);held=True
   time.sleep(.2)
  commands.append(command);print('CLEAN '+str(command[2] if len(command)>2 else command),flush=True)
  flags=getattr(subprocess,'CREATE_NO_WINDOW',0)|getattr(subprocess,'BELOW_NORMAL_PRIORITY_CLASS',0)
  start=time.time();child=subprocess.Popen(command,cwd=mirror,env=env,creationflags=flags,stdout=sys.stdout,stderr=sys.stderr)
  priority=None
  if os.name=='nt':
   kernel.GetPriorityClass.argtypes=[wintypes.HANDLE];kernel.GetPriorityClass.restype=wintypes.DWORD
   priority=int(kernel.GetPriorityClass(wintypes.HANDLE(child._handle)));assert priority==16384
  print(json.dumps({'cleanChildPid':child.pid,'priorityClass':priority,'physicalFreeBytes':physical_free()}),flush=True)
  peak=0;lowest=physical_free()
  while child.poll() is None:
   if os.name=='nt':
    c=Counters();c.cb=ctypes.sizeof(c)
    if psapi.GetProcessMemoryInfo(wintypes.HANDLE(child._handle),ctypes.byref(c),c.cb):peak=max(peak,int(c.PeakWorkingSetSize))
    lowest=min(lowest,physical_free())
   time.sleep(.2)
  code=child.wait();metric={'cleanChildClosed':child.pid,'exitCode':code,'seconds':time.time()-start,'physicalFreeBytes':physical_free(),'peakWorkingSetBytes':peak,'lowestSampledPhysicalFreeBytes':lowest};stage_metrics.append(metric);print(json.dumps(metric),flush=True)
  assert code==0,(command,code)
 for name in ['prepare-neutrals.py','build-family-source.py','fit-adult-mouths.py','prepare-family-mouths.py']:
  run(sys.executable,'-B',str(AUTHOR/name))
 run(sys.executable,'-B',str(AUTHOR/'build-candidate.py'),'--outdir',str(WORK/'candidate-v1'),'--stride-distance',str(args.stride_distance))
 run(sys.executable,'-B',str(AUTHOR/'install-candidate.py'))
 run(sys.executable,'-B','tools/build-street-motion-delivery.py','--manifest','assets/characters/street/manifest.json',
     '--character',ID,'--outdir',str(SELECTED/'delivery'))
 run(sys.executable,'-B',str(AUTHOR/'bind-delivery.py'))
 run(sys.executable,'-B','tools/build-street-motion-delivery.py','--manifest','assets/characters/street/manifest.json',
     '--character',ID,'--outdir',str(SELECTED/'delivery'),'--check')
 baseline=json.loads((HERE/'rebuild-baseline.json').read_text());assert baseline['actor']==ID
 compared={}
 for rel in [*[(SELECTED/name) for name in ['standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json']],
             *[(SELECTED/'delivery'/name) for name in ['movement-desktop.webp','movement-mobile.webp','reactions-desktop.webp','reactions-mobile.webp','motion-delivery.json']],
             AUTHOR/'registration.json',*[(AUTHOR/'registered'/f'{name}.png') for name in
              ['down','right','up','left','front-right','rear-right','rear-left','front-left']]]:
  digest=sha(mirror/rel);assert digest==baseline['expectedFiles'][rel.as_posix()],str(rel)
  compared[rel.as_posix()]=digest
 for rel in [WORK/'full-working/body-index.json',WORK/'adult-mouth-fit/fit.json',WORK/'family-mouths/mouths-working.json']:
  digest=sha(mirror/rel);assert digest==baseline['expectedFiles'][rel.as_posix()],str(rel)
  compared[rel.as_posix()]=digest
 assert len(compared)==len(baseline['expectedFiles'])==21
 assert json.loads((mirror/WORK/'candidate-v1/person.json').read_text())==baseline['preDeliveryPerson']
 rebuilt=json.loads(manifest.read_text())['characters'][ID]
 assert rebuilt==baseline['selectedPerson'],'Own selected registry object differs from tracked validation baseline'
 report={'status':'PASS','emptyMirror':str(mirror),'initialRegistry':'immutable own pre-admission record only',
  'excludedBuildInputs':['prior ignored working paint','registered PNGs','registration.json','selected source/delivery files','mutable whole-cast registry'],
  'comparedExactBytes':compared,'ownRegistryObjectExact':True,'commands':commands,
  'validationBaseline':str((HERE/'rebuild-baseline.json').relative_to(ROOT)),
  'validationBaselineSha256':sha(HERE/'rebuild-baseline.json'),'stageMetrics':stage_metrics,
  'expectedSource':'Tracked immutable hashes/person only, consumed after generation; no prior ignored output/current registry/candidate read for expectations'}
 (destination/'report.json').write_bytes((json.dumps(report,indent=2)+'\n').encode())
 print(json.dumps({'status':'PASS','exactFiles':len(compared),'ownRegistryObjectExact':True}),flush=True)

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--outdir',type=Path,required=True);parser.add_argument('--stride-distance',type=float,required=True)
 main(parser.parse_args())
