"""Replay Brigitte from original paint in a truly absent mirror; lease required.

Run under the separately approved whole-tree bounded guard. No registered paint,
compiled asset, proof result or validation baseline is copied into the mirror.
"""
from pathlib import Path
import argparse,ctypes,hashlib,json,os,shutil,subprocess,sys,time
from ctypes import wintypes as W
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OWN=HERE.relative_to(ROOT);ID='crowd-brigitte-bueroklammer'
WORK=Path('output/street-redesign/bueroklammer-end-to-end')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
kernel=ctypes.WinDLL('kernel32',use_last_error=True)
kernel.GetPriorityClass.argtypes=[W.HANDLE];kernel.GetPriorityClass.restype=W.DWORD
kernel.IsProcessInJob.argtypes=[W.HANDLE,W.HANDLE,ctypes.POINTER(W.BOOL)]
class Memory(ctypes.Structure):
 _fields_=[('length',W.DWORD),('load',W.DWORD),*[(n,ctypes.c_ulonglong) for n in ('total','free','page','pagefree','virtual','virtualfree','extended')]]
def available():
 m=Memory();m.length=ctypes.sizeof(m);assert kernel.GlobalMemoryStatusEx(ctypes.byref(m));return m.free
def main():
 p=argparse.ArgumentParser();p.add_argument('--name',default='bc-clean-v1');p.add_argument('--mirror',type=Path,required=True);a=p.parse_args()
 assert a.name.startswith('bc-clean-') and all(c.isalnum() or c=='-' for c in a.name)
 mirror=a.mirror.resolve();assert not mirror.exists(),'Fresh absent mirror required; preserve all previous evidence'
 motion=json.loads((HERE/'motion-spec.json').read_text());assert motion['actor']==ID and motion['strideDistance']>0
 assert available()>=1536*1024**2,'Fresh replay floor1536MiB'
 mirror.mkdir(parents=True);copied={};children=[];commands=[]
 def copy(relative):
  source=ROOT/relative;target=mirror/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
  assert sha(source)==sha(target);copied[relative.as_posix()]=sha(target)
 for name in ['prepare-neutrals.py','pilot-motion.py','fit-adult-mouths.py','build-family-source.py','prepare-family-mouths.py','build-candidate.py','install-candidate.py','bind-delivery.py','lip-fits.json','motion-spec.json','pre-admission-person.json','pre-admission-family.json','raw-directions-v2.png']:
  copy(OWN/name)
 for name in ['tools/build-street-character-sprites.py','tools/build-street-mouths.py','tools/build-street-motion-delivery.py','.agents/skills/animate-2d-characters/scripts/painted_walk.py','.agents/skills/animate-2d-characters/scripts/harmonize_material.py']:
  copy(Path(name))
 assert not any('/registered/' in name or name.startswith('output/') or name.endswith('.webp') for name in copied)
 motion=json.loads((mirror/OWN/'motion-spec.json').read_text())
 old=json.loads((mirror/OWN/'pre-admission-person.json').read_text());public=mirror/'assets/characters/street/manifest.json';public.parent.mkdir(parents=True,exist_ok=True)
 public.write_text(json.dumps({'schemaVersion':1,'characters':{ID:old}},separators=(',',':'))+'\n')
 log=ROOT/WORK/(a.name+'-commands.txt');assert not log.exists(),'Preserve earlier command logs'
 env={**os.environ,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1','MKL_NUM_THREADS':'1'}
 def execute(relative,*arguments):
  assert available()>=1024**3,'Stop before next child; outer guard owns persistent first-low latch'
  command=[sys.executable,'-B',str(relative),*arguments];commands.append(command);start=time.monotonic()
  with log.open('a',encoding='utf-8') as handle:
   handle.write('RUN '+repr(command)+'\n');handle.flush()
   child=subprocess.Popen(command,cwd=mirror,env=env,creationflags=subprocess.CREATE_NO_WINDOW|subprocess.BELOW_NORMAL_PRIORITY_CLASS,stdout=handle,stderr=subprocess.STDOUT)
   priority=kernel.GetPriorityClass(W.HANDLE(child._handle));assert priority==16384
   inherited=W.BOOL();assert kernel.IsProcessInJob(W.HANDLE(child._handle),None,ctypes.byref(inherited)) and inherited.value,'Every leaf must inherit the outer bounded job'
   assert all(env[key]=='1' for key in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS'))
   limit=240 if Path(relative).name=='build-family-source.py' else 120 if Path(relative).name=='build-candidate.py' else 60
   try:code=child.wait(timeout=limit)
   except subprocess.TimeoutExpired:
    child.kill();child.wait();raise
   children.append({'pid':child.pid,'command':command,'priorityObserved':priority,'inheritsOuterBoundedJob':True,'threadEnvironment':{key:env[key] for key in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS')},'maximumSeconds':limit,'exitCode':code,'seconds':time.monotonic()-start})
   (ROOT/WORK/(a.name+'-processes.json')).write_text(json.dumps(children,indent=2)+'\n')
   assert code==0,children[-1]
 for script in ['prepare-neutrals.py','fit-adult-mouths.py','build-family-source.py','prepare-family-mouths.py']:execute(OWN/script)
 execute(OWN/'build-candidate.py','--outdir',str(WORK/'candidate-v1'),'--stride-distance',str(motion['strideDistance']))
 execute(OWN/'install-candidate.py')
 selected=Path('assets/characters/street-speakers')/ID/'delivery-v2'
 execute(Path('tools/build-street-motion-delivery.py'),'--manifest',str(WORK/'private-manifest.json'),'--character',ID,'--outdir',str(selected/'delivery'))
 execute(OWN/'bind-delivery.py')
 baseline=json.loads((HERE/'rebuild-baseline.json').read_text());assert baseline['actor']==ID
 comparisons={}
 for name,digest in baseline['expectedFiles'].items():
  assert (mirror/name).is_file() and sha(mirror/name)==digest,('Raw-only output mismatch',name)
  comparisons[name]=digest
 person=json.loads((mirror/WORK/'private-manifest.json').read_text())['characters'][ID];assert person==baseline['selectedPerson']
 report={'status':'PASS','actor':ID,'initialMirrorAbsent':True,'mirror':mirror.as_posix(),'copiedInputPins':copied,'noRegisteredOrCompiledInputs':True,'validationBaselineNotCopied':True,'validationBaselineSha256':sha(HERE/'rebuild-baseline.json'),'exactOutputs':comparisons,'sameSelectedPerson':True,'commands':commands,'children':children,'limits':'Determinism only; actual game and independent reviews separate. Parent guard supplies whole-job cap, first-low latch and closure.'}
 (ROOT/WORK/(a.name+'-report.json')).write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':'PASS','exactOutputs':len(comparisons),'sameSelectedPerson':True}))
if __name__=='__main__':main()
