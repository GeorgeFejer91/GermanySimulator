"""Install only Brigitte assets and an ignored private runtime manifest."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
ID='crowd-brigitte-bueroklammer';WORK=ROOT/'output/street-redesign/bueroklammer-end-to-end';CANDIDATE=WORK/'candidate-v1'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run():
 public=ROOT/'assets/characters/street/manifest.json';manifest=json.loads(public.read_text());before=sha(public)
 old=json.loads((HERE/'pre-admission-person.json').read_text());assert manifest['characters'][ID]==old
 person=json.loads((CANDIDATE/'person.json').read_text());receipt=json.loads((CANDIDATE/'compile-receipt.json').read_text());assert person['id']==ID
 folder=ROOT/'assets/characters/street-speakers'/ID/'delivery-v2';folder.mkdir(parents=True,exist_ok=False)
 (folder/'.gitattributes').write_text('*.json -text\n')
 for name in ['standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json']:
  assert sha(CANDIDATE/name)==receipt['outputs'][name];shutil.copy2(CANDIDATE/name,folder/name)
 manifest['characters'][ID]=person;(WORK/'private-manifest.json').write_text(json.dumps(manifest,separators=(',',':'),ensure_ascii=False)+'\n')
 assert sha(public)==before
 print('Own assets and ignored private registry installed; public registry untouched.')
if __name__=='__main__':run()
