"""Corrected validation only, outside all36 immutable raw-generation inputs.

The held driver's literal405 validate branch is deliberately unused. No raw
report, source, recipe, image or original authored output is changed here.
"""
from pathlib import Path
import argparse,hashlib,json
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
ID='crowd-dietmar-din-norm';AUTHOR=HERE.relative_to(ROOT)
WORK=Path('output/street-redesign/dietmar-din-norm-end-to-end')
STAGE=Path('output/dietmar-height/authored-packet-v4')
ASSET=Path('assets/characters/residents')/ID/'delivery-v2'
STEPS=['neutrals','parts','fit','down','right','up','left','extras','finalize','mouths','cycle','compile','packet-init','packet-pack','packet-bind','packet-check']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text())
def source_cycle(root):
 data=read(root/WORK/'source-cycle-v2/report.json')
 world=data['pins'].pop('world3d.js')
 return data,world
def measured_files(root):
 folder=root/STAGE/ASSET;private=sorted(p for p in folder.rglob('*') if p.is_file());assert len(private)==10
 body=read(root/WORK/'full-working-v3/body-index.json');assert body['selectedCells']==len(body['cells'])==412
 sources={root/c['source']['file']:c['source']['sha256'] for c in body['cells']};assert len(sources)==348
 assert all(sha(path)==digest for path,digest in sources.items())
 registered=sorted((root/AUTHOR/'registered').glob('*.png'));assert len(registered)==8
 parts=sorted(p for p in (root/AUTHOR/'profile-leg-repair-v2').glob('*.png') if p.name!='raw-far-leg-parts-v1.png');assert len(parts)==13
 files=private+list(sources)+registered+parts+[root/AUTHOR/'registration.json',root/AUTHOR/'profile-leg-repair-v2/profile-layer-registration.json',
  root/WORK/'full-working-v3/body-index.json',root/WORK/'family-mouths-v4/mouths-working.json',root/WORK/'adult-mouth-fit-v6/fit.json']
 files += [root/WORK/'candidate-v4'/name for name in ['standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json','person.json']]
 paths={p.relative_to(root).as_posix() for p in files};assert len(files)==len(paths)==389
 return paths,{p.relative_to(folder).as_posix() for p in private}
def run(args):
 mirror=args.mirror.resolve();report=args.report.resolve();generation=args.generation_report.resolve();baseline_path=HERE/'validation-baseline-v4.json'
 assert mirror==Path('C:/Users/cogpsy-vrlab/.codex/tmp/dietmar-v4-r02').resolve() and len(str(mirror))<65
 assert generation==ROOT/'output/dietmar-height/clean-raw-v4-r02-report.json'
 assert report.is_relative_to(ROOT/'output/dietmar-height') and not report.exists(),'Preserve every validation attempt'
 assert sha(generation)==args.generation_report_sha256
 immutable=ROOT/'output/dietmar-height/clean-raw-v4-r02-generation-complete.json'
 assert sha(immutable)==sha(generation)==args.generation_report_sha256
 state=read(generation)
 assert state['mirror']==str(mirror) and state['mirrorInitiallyAbsent'] is True
 assert state['expectedStepOrder']==STEPS and len(state['steps'])==16
 assert [s['mode'] for s in state['steps'] if s['status']=='COMPLETE']==STEPS
 inputs=state['initialInputs'];assert len(inputs)==36
 assert (AUTHOR/'clean-rebuild-v4.py').as_posix() in inputs and (AUTHOR/'lip-fits-v6.json').as_posix() in inputs
 assert all('validation-baseline' not in p and not p.startswith('output/') for p in inputs)
 for relative,digest in inputs.items():
  assert sha(ROOT/relative)==sha(mirror/relative)==digest,('Generation input changed',relative)
 baseline=read(baseline_path)
 assert baseline['id']==ID and baseline['role'].startswith('VALIDATION_ONLY_AFTER_ALL_RAW_GENERATION')
 assert baseline['generationSeedAllowed'] is False and baseline['currentCanonicalUsed'] is False
 assert baseline['generationReportAlreadyComplete']=={'file':immutable.relative_to(ROOT).as_posix(),'sha256':sha(immutable)}
 assert baseline_path.stat().st_mtime_ns>=immutable.stat().st_mtime_ns,'Baseline must first be created after terminal generation'
 assert baseline['baselineOrigin']=={'originalAuthoredRoot':str(ROOT),'originalAuthoredPrivateStage':str(ROOT/STAGE)}
 expected=baseline['expectedHashes'];assert len(expected)==389 and baseline['coverage']['exactFiles']==389 and baseline['coverage']['privateDeliveryFiles']==10
 original_paths,original_private=measured_files(ROOT);raw_paths,raw_private=measured_files(mirror)
 assert original_paths==raw_paths==set(expected),'Measured source/metadata/delivery inventory must be complete'
 assert original_private==raw_private==set(baseline['privateFileNames'])
 actual={}
 for relative,digest in expected.items():
  target=(mirror/relative).resolve();assert target.is_relative_to(mirror)
  assert sha(ROOT/relative)==digest,'Baseline must bind original authored output, not raw-generated expected data'
  actual[relative]=sha(target);assert actual[relative]==digest,('Actual rebuilt file differs',relative)
 cycle,actual_world_pin=source_cycle(mirror);authored_cycle,authored_world_pin=source_cycle(ROOT)
 assert cycle==authored_cycle==baseline['expectedCycleReport'],'Every stance/source/code/mapping/cadence field and all remaining pins must be exact'
 assert baseline['excludedCycleDiagnosticOnly']['field']=="pins['world3d.js']" and baseline['excludedCycleDiagnosticOnly']['originalAuthoredFullModulePin']==authored_world_pin
 assert actual_world_pin==inputs['world3d.js']==sha(mirror/'world3d.js')
 assert 'const S=.02,H=.038' in (mirror/'world3d.js').read_text(),'Retain original map assertion'
 assert cycle['familySourceHeight']==400 and cycle['authoredHeight']==2.33 and cycle['mapWorldUnitsPerGameUnit']==.02 and cycle['fittedCycle']==11.65
 assert len(cycle['stances'])==4 and all(len(s['phases'])==5 and s['slope']==-40 and s['maximumResidual']==0 for s in cycle['stances'])
 person=read(mirror/STAGE/'private-manifest.json')['characters'][ID]
 assert person==baseline['person']==read(ROOT/STAGE/'private-manifest.json')['characters'][ID]
 assert person==read(mirror/STAGE/ASSET/'person.json')==read(ROOT/STAGE/ASSET/'person.json')
 assert person['figureWorldHeight']==2.33 and person['strideDistance']==11.65
 resources=[]
 for mode in ['init',*STEPS]:
  path=ROOT/'output/street-redesign/dietmar-din-norm-end-to-end/resources'/f'raw-v4-r02-{mode}.json';row=read(path)
  assert row['exitCode']==0 and row['activeProcesses0'] is True and not row['aborted'] and not row['lowMemorySeen'] and not row['inputMismatches']
  assert row['privateCommitLimitMiB']==384 and row['maximumSeconds']==60 and row['priorityObserved']==16384
  resources.append({'mode':mode,'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'elapsedSeconds':row['elapsedSeconds'],'wholeJobPeakMiB':row['wholeJobPeakMiB'],'minimumFreeMiB':row['minimumFreeMiB'],'activeProcesses0':True})
 assert sha(generation)==sha(immutable)==args.generation_report_sha256,'Original generation report must remain immutable'
 result={'status':'PASS_RAW_ONLY_RECONSTRUCTION_AND_FINAL_VALIDATION','mirror':str(mirror),'exactFiles':len(actual),'expectedFilesExact':actual,
  'ownAuthoredPersonExact':True,'cycleSemanticsExact':True,'actualCycleWorldPin':actual_world_pin,'cycleWorldPinMatchesRawInitialFullModule':True,
  'originalGenerationReport':{'file':generation.relative_to(ROOT).as_posix(),'sha256':sha(generation)},'immutableGenerationCompleteCopy':{'file':immutable.relative_to(ROOT).as_posix(),'sha256':sha(immutable)},
  'generationReportUnchanged':True,'initial36OriginalAndMirrorInputsExact':True,'generationInputs':inputs,
  'validationBaseline':{'file':baseline_path.relative_to(ROOT).as_posix(),'sha256':sha(baseline_path),'firstCreatedAfterAll16GenerationComplete':True,'originalAuthoredOutputsOnly':True},
  'coverage':baseline['coverage'],'generationResources':resources,'validationAuditorOutsideGenerationInputs':True,
  'heldUnusedDriverValidationBranch':'Original immutable clean-rebuild-v4.py modevalidate literal405 branch was not invoked; separate exact measured389-file validator used only after allgeneration.',
  'countRedRetained':'output/street-redesign/dietmar-din-norm-end-to-end/resources/raw-v4-r02-baseline.json','rawDriverOrArtChangedForValidation':False,'canonicalOrRuntimeWritten':False,'finalHeightOrWorldAcceptance':False}
 report.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['status','mirror','exactFiles','ownAuthoredPersonExact','cycleSemanticsExact','generationReportUnchanged']}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--mirror',required=True,type=Path);p.add_argument('--generation-report',required=True,type=Path);p.add_argument('--generation-report-sha256',required=True);p.add_argument('--report',required=True,type=Path);run(p.parse_args())
