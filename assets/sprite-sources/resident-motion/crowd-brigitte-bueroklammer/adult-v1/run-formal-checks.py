"""One root-leased, report-only sequential formal and four-contract closure.

The outer run-pilot.py owns the inherited128MiB job and total90s deadline.
Each leaf has30s; no source paint, integration, raw replay or browser runs.
"""
from pathlib import Path
import hashlib,json,os,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/bueroklammer-end-to-end';OUT=WORK/'final-frame-analysis'
NODE=Path('C:/Users/cogpsy-vrlab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(OUT/'inspected-boards.json')=='973d8eeae1c681ae9047ba441398bbeb29a2ae50a89d71c5ccf50be6ddb0cba3'
expected=[OUT/name for name in ('desktop-review.json','mobile-review.json','desktop-audit.json','mobile-audit.json')]
assert all(not path.exists() for path in expected),'Preserve previous metadata outputs'
commands=[('acceptance',[sys.executable,'-B',str(HERE/'prepare-final-frame-analysis.py'),'--accept-reviewed'])]
for variant in ('desktop','mobile'):
 commands.append((variant+'-audit',[sys.executable,'-B',str(ROOT/'.agents/skills/animate-2d-characters/scripts/audit_final_frame_analysis.py'),str(OUT/(variant+'-manifest.json')),'--review',str(OUT/(variant+'-review.json')),'--report',str(OUT/(variant+'-audit.json'))]))
commands.append(('four-contracts',[str(NODE),'--test',str(HERE/'actor-contract.test.mjs')]))
receipts=[];start=time.monotonic()
for name,command in commands:
 assert time.monotonic()-start<90,'Total90s scope'
 begun=time.monotonic()
 with (WORK/'resources'/('formal-small-checks-v1-'+name+'.stdout.txt')).open('w') as log,(WORK/'resources'/('formal-small-checks-v1-'+name+'.stderr.txt')).open('w') as err:
  child=subprocess.Popen(command,cwd=ROOT,env={**os.environ,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1','MKL_NUM_THREADS':'1'},creationflags=subprocess.CREATE_NO_WINDOW|subprocess.BELOW_NORMAL_PRIORITY_CLASS,stdout=log,stderr=err)
  try:code=child.wait(timeout=30)
  except subprocess.TimeoutExpired:
   child.kill();child.wait();raise
 receipts.append({'name':name,'pid':child.pid,'command':command,'exitCode':code,'seconds':time.monotonic()-begun})
 (WORK/'resources/formal-small-checks-v1-processes.json').write_text(json.dumps(receipts,indent=2)+'\n')
 assert code==0,receipts[-1]
 if name.endswith('-audit'):
  audit=json.loads((OUT/(name+'.json')).read_text());assert audit['ok'] and audit['frames_analyzed']==412 and not audit['errors']
 print(name+' PASS',flush=True)
report={'status':'PASS','actor':'crowd-brigitte-bueroklammer','actuallyInspectedBodyBoards':116,'actuallyInspectedNativeMouthBoards':4,'encodedFramesAnalyzed':824,'focusedNodeContracts':4,'outputs':{p.relative_to(ROOT).as_posix():sha(p) for p in expected},'processes':receipts,'seconds':time.monotonic()-start,'limitations':'Formal provenance and focused data contracts only; actual game, speech, raw replay and independent reviews remain separate.'}
(WORK/'formal-small-checks-v1-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'status':'PASS','encodedFrames':824,'focusedContracts':4,'seconds':report['seconds']}),flush=True)
