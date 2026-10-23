"""Rebuild this actor in an empty mirror using tracked authoring inputs only.

No prior ignored working paint, registered PNGs, selected atlases or mutable
whole-cast registry enter the build. Selected bytes are read only to compare
the completed result. The initial mirror registry contains only this actor's
immutable pre-admission record. No Git checkout, refs or publication occurs.
"""
from pathlib import Path
import argparse,hashlib,json,os,shutil,subprocess,sys
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
ID='stadt-irmgard-aktenstapel'
WORK=Path('output/street-redesign/aktenstapel-end-to-end')
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
 assert destination.is_relative_to(ROOT/WORK) and destination!=ROOT/WORK
 destination.mkdir(parents=True,exist_ok=False)
 mirror=destination/'root'
 if os.name=='nt':mirror=Path('\\\\?\\'+str(mirror))
 mirror.mkdir()
 shutil.copytree(HERE,mirror/AUTHOR,ignore=shutil.ignore_patterns('registered','registration.json','__pycache__'))
 dependencies=[Path('tools')/name for name in
  ['build-street-character-sprites.py','build-street-mouths.py','build-street-motion-delivery.py']]
 dependencies += [Path('.agents/skills/animate-2d-characters/scripts')/name
  for name in ['painted_walk.py','harmonize_material.py']]
 dependencies += [Path('assets/characters/residents')/ID/'delivery-v1/mouths-v1.json']
 for rel in dependencies:
  target=mirror/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/rel,target)
 immutable=json.loads((HERE/'pre-admission-person.json').read_text())
 manifest=mirror/'assets/characters/street/manifest.json';manifest.parent.mkdir(parents=True)
 manifest.write_bytes((json.dumps({'schemaVersion':1,'characters':{ID:immutable}},separators=(',',':'))+'\n').encode())
 env={**os.environ,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1'}
 commands=[]
 def run(*command):
  command=list(command)
  if os.name=='nt':
   for index,value in enumerate(command):
    if index>=2 and Path(value).parts and Path(value).parts[0] in ('assets','tools','output'):
     command[index]=str(mirror/Path(value))
  commands.append(command);print('CLEAN '+str(command[2] if len(command)>2 else command),flush=True)
  flags=getattr(subprocess,'CREATE_NO_WINDOW',0)|getattr(subprocess,'BELOW_NORMAL_PRIORITY_CLASS',0)
  subprocess.run(command,cwd=mirror,env=env,creationflags=flags,check=True)
 for name in ['prepare-neutrals.py','build-family-source.py','fit-adult-mouths.py','prepare-family-mouths.py']:
  run(sys.executable,'-B',str(AUTHOR/name))
 run(sys.executable,'-B',str(AUTHOR/'build-candidate.py'),'--outdir',str(WORK/'candidate-v1'),'--stride-distance','7.544')
 run(sys.executable,'-B',str(AUTHOR/'install-candidate.py'))
 run(sys.executable,'-B','tools/build-street-motion-delivery.py','--manifest','assets/characters/street/manifest.json',
     '--character',ID,'--outdir',str(SELECTED/'delivery'))
 run(sys.executable,'-B',str(AUTHOR/'bind-delivery.py'))
 run(sys.executable,'-B','tools/build-street-motion-delivery.py','--manifest','assets/characters/street/manifest.json',
     '--character',ID,'--outdir',str(SELECTED/'delivery'),'--check')
 compared={}
 for rel in [*[(SELECTED/name) for name in ['standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json']],
             *[(SELECTED/'delivery'/name) for name in ['movement-desktop.webp','movement-mobile.webp','reactions-desktop.webp','reactions-mobile.webp','motion-delivery.json']],
             AUTHOR/'registration.json',*[(AUTHOR/'registered'/f'{name}.png') for name in
              ['down','right','up','left','front-right','rear-right','rear-left','front-left']]]:
  assert (ROOT/rel).read_bytes()==(mirror/rel).read_bytes(),str(rel)
  compared[rel.as_posix()]=sha(mirror/rel)
 for rel in [WORK/'full-working/body-index.json',WORK/'adult-mouth-fit/fit.json',WORK/'family-mouths/mouths-working.json']:
  assert (ROOT/rel).read_bytes()==(mirror/rel).read_bytes(),str(rel)
  compared[rel.as_posix()]=sha(mirror/rel)
 actual=json.loads((ROOT/'assets/characters/street/manifest.json').read_text())['characters'][ID]
 rebuilt=json.loads(manifest.read_text())['characters'][ID]
 assert rebuilt==actual,'Own selected registry object differs'
 report={'status':'PASS','emptyMirror':str(mirror),'initialRegistry':'immutable own pre-admission record only',
  'excludedBuildInputs':['prior ignored working paint','registered PNGs','registration.json','selected source/delivery files','mutable whole-cast registry'],
  'comparedExactBytes':compared,'ownRegistryObjectExact':True,'commands':commands}
 (destination/'report.json').write_bytes((json.dumps(report,indent=2)+'\n').encode())
 print(json.dumps({'status':'PASS','exactFiles':len(compared),'ownRegistryObjectExact':True}),flush=True)

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--outdir',type=Path,required=True)
 main(parser.parse_args())
