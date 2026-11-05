"""Bind fresh412 family to unchanged held rows and reviewed profile pilot."""
from pathlib import Path
import hashlib,importlib.util,json
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
WORK=ROOT/'output/street-redesign/baerbel-brezel-end-to-end'
OUT=ROOT/'output/baerbel-height/profile-leg-repair-v2/full-family-comparison-v2.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 assert not OUT.exists();config=load('baerbel_reviewed_pilot_cases',HERE/'native-profile-repair-v2.py')
 old_path=WORK/'full-working/body-index.json';new_path=WORK/'full-working-v2/body-index.json'
 old=json.loads(old_path.read_text());new=json.loads(new_path.read_text());assert len(old['cells'])==len(new['cells'])==412
 previous={(c['row'],c['col']):c for c in old['cells']};checked=[]
 for c in new['cells']:
  key=(c['row'],c['col']);prior=previous[key]
  assert {k:v for k,v in c.items() if k!='source'}=={k:v for k,v in prior.items() if k!='source'},'Layout/quiet phase metadata changed'
  path=ROOT/c['source']['file'];assert sha(path)==c['source']['sha256']
  with Image.open(path) as im:actual=im.convert('RGBA')
  if c['heading'] not in ('right','left'):
   expected=ROOT/prior['source']['file'];assert sha(expected)==prior['source']['sha256'];mode='ORIGINAL_NONPROFILE_EXACT'
   assert c['source']['sha256']==prior['source']['sha256']
  else:
   if c['kind']=='walk':phase=c['col'];strength=1
   elif c['kind']=='stop':phase=c['entryPhase'];strength=c['strength']
   elif c['kind']=='bridge':phase=0;strength=(.5,.25,0,.5,1)[c['col']]
   elif c['kind']=='turn':phase=0;strength=0
   else:raise AssertionError('Unsupported profile family cell')
   folder=next(folder for s,folder in config.FOLDERS[c['heading']] if s==strength)
   expected=ROOT/'output/baerbel-height/profile-leg-repair-v2'/folder/f"{c['heading']}-{phase:02}.png";mode='REVIEWED_SEPARATE_PROFILE_EXACT'
  with Image.open(expected) as im:assert actual.tobytes()==im.convert('RGBA').tobytes()
  checked.append({'row':key[0],'col':key[1],'heading':c['heading'],'kind':c['kind'],'mode':mode,'source':c['source'],'comparison':expected.relative_to(ROOT).as_posix(),'comparisonSha256':sha(expected),'rgbaExact':True})
 result={'status':'PASS412SOURCE_BINDING_ONLY; native/raw/formal/runtime pending','bodyIndexSha256':sha(new_path),'heldBodyIndexSha256':sha(old_path),'cells':checked,
  'originalNonprofileExact':sum(c['mode']=='ORIGINAL_NONPROFILE_EXACT' for c in checked),'reviewedProfilesExact':sum(c['mode']=='REVIEWED_SEPARATE_PROFILE_EXACT' for c in checked)}
 OUT.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['status','originalNonprofileExact','reviewedProfilesExact']}))
if __name__=='__main__':run()
