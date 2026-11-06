"""Portable raw-only Günther v2 recipe: one bounded step per external owned job.

Run from the repository root. The initially absent short mirror receives only
owned raw paint, author controls and source code. Validation baseline is read
only in the final validate step, after all output generation has completed.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,os,shutil,sys,time
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
AUTHOR=HERE.relative_to(ROOT);WORK=Path('output/street-redesign/guenther-end-to-end/layered-v2/build')
ID='stadt-guenther-tuev'
AUTHOR_INPUTS=('raw-directions-v1.png','raw-directions-v2.png','lip-fits.json','pre-admission-person.json','pre-admission-family.json','prepare-neutrals.py','prepare-profile-layers-v2.py','profile-motion-v2.py','pilot-motion.py','build-family-source.py','fit-adult-mouths.py','prepare-family-mouths.py','build-family-source-v2.py','compile-family-v2.py','clean-rebuild-v2.py','run-layered-v2.py')
DEPS=[Path('tools')/n for n in('build-street-character-sprites.py','build-street-mouths.py','build-street-motion-delivery.py')]+[Path('.agents/skills/animate-2d-characters/scripts')/n for n in('painted_walk.py','harmonize_material.py')]
INPUTS=[AUTHOR/n for n in AUTHOR_INPUTS]+[AUTHOR/'profile-leg-repair-v2'/n for n in('raw-far-leg-parts-v1.png','far-leg-parts-request-v1.json','far-leg-parts-receipt-v1.json')]+DEPS
STEPS=('init','register','parts','fit','body-down','body-right','body-up','body-left','body-turn-actions','body-finalize','mouths','native-desktop','native-mobile','metadata','packet','packet-check','validate')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
    spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def write(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,indent=2)+'\n')
def run(a):
    mirror=a.mirror.resolve();out=a.outdir.resolve();state_path=mirror/'raw-v2-state.json'
    assert len(str(mirror))<65 and mirror!=ROOT and not mirror.is_relative_to(ROOT/'assets')
    assert out.is_relative_to(ROOT/'output')and out!=ROOT/'output'
    if a.step=='init':
        assert not mirror.exists()and not out.exists(),'Preserve prior reconstruction'
        mirror.mkdir(parents=True);out.mkdir(parents=True);initial={}
        for rel in INPUTS:
            target=mirror/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/rel,target);assert sha(target)==sha(ROOT/rel);initial[rel.as_posix()]=sha(target)
        data={'status':'RAW GENERATION; expected products not read','mirrorInitiallyAbsent':True,'initialInputs':initial,'completed':['init'],'steps':[],'excluded':['registered','extractedparts','workingbody/mouthpaint','selectedassets','currentregistry','cache','validationbaseline','expectedruntime hashes'],'authoredParameters':{'figureWorldHeight':2.33,'strideDistance':13.3975,'basis':'Own46sourcepixel stance /400workingheight ×2.33/.02; not a validation-target fit'}}
        write(state_path,data);write(out/'report.json',data);print(json.dumps({'step':'init','rawInputs':len(initial),'expectedProductsRead':False}));return
    data=json.loads(state_path.read_text());assert a.step not in data['completed']
    for rel,h in data['initialInputs'].items():assert sha(ROOT/rel)==sha(mirror/rel)==h
    started=time.monotonic()
    if a.step=='validate':
        assert set(STEPS[1:-1]).issubset(data['completed']),'Finish generation before reading expected products'
        baseline=json.loads((HERE/'validation-baseline-v2.json').read_text())
        generated=mirror/WORK/'private-mirror';exact={}
        for rel,h in baseline['expectedHashes'].items():assert sha(generated/rel)==h,('Reconstructed output mismatch',rel);exact[rel]=h
        person=json.loads((generated/f'assets/characters/residents/{ID}/delivery-v2/person.json').read_text());assert person==baseline['person']
        cells=json.loads((mirror/WORK/'body-index.json').read_text())['cells'];assert len(cells)==412
        expected={(c['row'],c['col']):c for c in baseline['sourceCells']}
        for cell in cells:
            e=expected[cell['row'],cell['col']];assert {k:v for k,v in cell.items()if k!='source'}==e['metadata'];assert sha(mirror/cell['source']['file'])==e['sha256']
        data.update(status='PASS raw-only v2 reconstruction; baseline read only after allgeneration',exactRuntimeAndPersonFiles=exact,ownAuthoredPersonExact=True,sourceCellsExact=412,uniqueSourceImagesExact=348)
    else:
        os.chdir(mirror)
        if a.step=='register':load('g_v2_register',mirror/AUTHOR/'prepare-neutrals.py').main()
        elif a.step=='parts':assert'register'in data['completed'];load('g_v2_parts',mirror/AUTHOR/'prepare-profile-layers-v2.py').run()
        elif a.step=='fit':
            assert'register'in data['completed'];m=load('g_v2_own_lipfit',mirror/AUTHOR/'fit-adult-mouths.py');m.OUT=mirror/WORK/'adult-mouth-fit';m.run()
        elif a.step.startswith('body-'):
            assert'parts'in data['completed'];m=load('g_v2_family',mirror/AUTHOR/'build-family-source-v2.py');s=a.step.removeprefix('body-');s='cardinal-'+s if s in('down','right','up','left')else s;m.run(argparse.Namespace(section=s,output=mirror/WORK))
        elif a.step=='mouths':
            assert'body-finalize'in data['completed']and'fit'in data['completed'];m=load('g_v2_lip_transport',mirror/AUTHOR/'prepare-family-mouths.py');m.BODY=mirror/WORK/'body-index.json';m.FIT=mirror/WORK/'adult-mouth-fit/fit.json';m.OUT=mirror/WORK/'family-mouths';m.run()
        elif a.step in('native-desktop','native-mobile','metadata','packet'):
            assert'mouths'in data['completed'];m=load('g_v2_native',mirror/AUTHOR/'compile-family-v2.py');m.configure(mirror/WORK);m.run(a.step.removeprefix('native-'))
        elif a.step=='packet-check':
            assert'packet'in data['completed'];m=load('g_v2_shared_packer_check',mirror/'tools/build-street-motion-delivery.py');p=mirror/WORK/'private-mirror';m.run(p/'assets/characters/street/manifest.json',ID,p/f'assets/characters/residents/{ID}/delivery-v2/delivery',check=True,root=p)
        else:raise ValueError(a.step)
        os.chdir(ROOT)
    for rel,h in data['initialInputs'].items():assert sha(ROOT/rel)==sha(mirror/rel)==h
    data['completed'].append(a.step);data['steps'].append({'step':a.step,'elapsedSeconds':time.monotonic()-started,'expectedProductsRead':a.step=='validate'});write(state_path,data);write(out/'report.json',data)
    print(json.dumps({'step':a.step,'status':data['status'],'expectedProductsRead':a.step=='validate'}))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--step',choices=STEPS,required=True);p.add_argument('--mirror',type=Path,required=True);p.add_argument('--outdir',type=Path,required=True);run(p.parse_args())
