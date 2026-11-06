"""Validation snapshot only after all sixteen raw-generation steps close."""
from pathlib import Path
import argparse,hashlib,json
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4];ID='crowd-dietmar-din-norm'
WORK=ROOT/'output/street-redesign/dietmar-din-norm-end-to-end'
STAGE=ROOT/'output/dietmar-height/authored-packet-v4';FOLDER=STAGE/'assets/characters/residents'/ID/'delivery-v2'
STEPS=['neutrals','parts','fit','down','right','up','left','extras','finalize','mouths','cycle','compile','packet-init','packet-pack','packet-bind','packet-check']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(raw_report):
 out=HERE/'validation-baseline-v4.json';assert not out.exists(),'Preserve every baseline'
 state=json.loads(raw_report.read_text())
 assert state['expectedStepOrder']==STEPS and [s['mode'] for s in state['steps'] if s['status']=='COMPLETE']==STEPS
 assert all(sha(ROOT/rel)==digest for rel,digest in state['initialInputs'].items()),'Authoring inputs changed after raw generation'
 person=json.loads((STAGE/'private-manifest.json').read_text())['characters'][ID]
 assert person['figureWorldHeight']==2.33 and person['strideDistance']==11.65
 assert json.loads((FOLDER/'person.json').read_text())==person
 files=sorted(p for p in FOLDER.rglob('*') if p.is_file())
 packet=json.loads((FOLDER/'delivery/motion-delivery.json').read_text())
 private_names={'mouths-v1.json','person.json','source-desktop.webp','source-mobile.webp','standing.webp','delivery/motion-delivery.json'}
 for pack in packet['packs'].values():
  for variant in pack['variants'].values():private_names.add((STAGE/variant['file'][2:]).relative_to(FOLDER).as_posix())
 assert {p.relative_to(FOLDER).as_posix() for p in files}==private_names and len(files)==len(private_names)==10
 body_path=WORK/'full-working-v3/body-index.json';body=json.loads(body_path.read_text())
 assert len(body['cells'])==412
 sources={ROOT/c['source']['file']:c['source']['sha256'] for c in body['cells']};assert len(sources)==348
 assert all(sha(path)==digest for path,digest in sources.items())
 files+=list(sources)
 registered=sorted((HERE/'registered').glob('*.png'));assert len(registered)==8;files+=registered
 generated_parts=sorted(p for p in (HERE/'profile-leg-repair-v2').glob('*.png') if p.name!='raw-far-leg-parts-v1.png');assert len(generated_parts)==13;files+=generated_parts
 files += [HERE/'registration.json',HERE/'profile-leg-repair-v2/profile-layer-registration.json',body_path,
  WORK/'family-mouths-v4/mouths-working.json',WORK/'adult-mouth-fit-v6/fit.json']
 files += [WORK/'candidate-v4'/name for name in ['standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json','person.json']]
 expected={p.relative_to(ROOT).as_posix():sha(p) for p in files};assert len(files)==len(expected)==389,'Actual ten-file package plus complete measured source/metadata union, no duplicates'
 cycle_path=WORK/'source-cycle-v2/report.json';cycle=json.loads(cycle_path.read_text())
 diagnostic_world_pin=cycle['pins'].pop('world3d.js')
 data={'id':ID,'role':'VALIDATION_ONLY_AFTER_ALL_RAW_GENERATION; never copied to generation mirror','authoredHeight':2.33,'authoredStride':11.65,
  'expectedHashes':expected,'expectedCycleReport':cycle,'excludedCycleDiagnosticOnly':{'field':"pins['world3d.js']",'originalAuthoredFullModulePin':diagnostic_world_pin,'validationRule':'Actual raw cycle full world pin must exactly equal raw initialInputs world3d.js; all other cycle fields/pins compare exact'},'person':person,'currentCanonicalUsed':False,'generationSeedAllowed':False,'baselineOrigin':{'originalAuthoredRoot':str(ROOT),'originalAuthoredPrivateStage':str(STAGE)},'privateFileNames':sorted(private_names),'generationReportAlreadyComplete':{'file':raw_report.relative_to(ROOT).as_posix(),'sha256':sha(raw_report)},
  'coverage':{'uniqueBodySourceImages':348,'registeredViews':8,'generatedProfileParts':13,'sourceMetadataFiles':5,'compiledFiles':5,'privateDeliveryFiles':10,'exactFiles':389,'duplicatePaths':0,'completeCycleReportOtherThanWorldDiagnosticPinExact':True}}
 out.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n');print(json.dumps({'expectedFiles':len(expected),'authoredHeight':2.33,'authoredStride':11.65,'baselineSha256':sha(out)}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--raw-report',type=Path,required=True);run(p.parse_args().raw_report.resolve())
