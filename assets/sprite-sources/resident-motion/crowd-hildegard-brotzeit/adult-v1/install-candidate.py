"""Install only Hildegard assets and an ignored private runtime manifest."""
from pathlib import Path
import argparse,hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
ID='crowd-hildegard-brotzeit';WORK=ROOT/'output/street-redesign/hildegard-brotzeit-end-to-end';CANDIDATE=WORK/'candidate-v1'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run(candidate=CANDIDATE,replace_preserved=False):
 public=ROOT/'assets/characters/street/manifest.json';manifest=json.loads(public.read_text());before=sha(public)
 old=json.loads((HERE/'pre-admission-person.json').read_text());assert manifest['characters'][ID]==old
 candidate=candidate.resolve();assert candidate.is_relative_to(WORK)
 person=json.loads((candidate/'person.json').read_text());receipt=json.loads((candidate/'compile-receipt.json').read_text());assert person['id']==ID
 folder=ROOT/'assets/characters/residents'/ID/'delivery-v2'
 folder.mkdir(parents=True,exist_ok=True)
 (folder/'.gitattributes').write_text('*.json -text\n')
 for name in ['standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json','person.json']:
  assert sha(candidate/name)==receipt['outputs'][name];shutil.copy2(candidate/name,folder/name)
 manifest={'schemaVersion':1,'characters':{ID:person}};(WORK/'private-manifest.json').write_text(json.dumps(manifest,separators=(',',':'),ensure_ascii=False)+'\n')
 assert sha(public)==before
 print('Own assets and ignored private registry installed; public registry untouched.')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--candidate',type=Path,default=CANDIDATE);p.add_argument('--replace-preserved-v1',action='store_true');a=p.parse_args();run(a.candidate,a.replace_preserved_v1)
