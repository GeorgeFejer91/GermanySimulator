"""First actor-only admission into this isolated Irmgard worktree, never publish."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
ID='stadt-irmgard-aktenstapel';CANDIDATE=ROOT/'output/street-redesign/aktenstapel-end-to-end/candidate-v1'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run():
 manifest_path=ROOT/'assets/characters/street/manifest.json';manifest=json.loads(manifest_path.read_text());before=manifest['characters'].copy()
 old=json.loads((HERE/'pre-admission-person.json').read_text());assert before[ID]==old
 assert old['cell']==[128,160] and old['pivot']==[64,150]
 candidate=json.loads((CANDIDATE/'person.json').read_text());receipt=json.loads((CANDIDATE/'compile-receipt.json').read_text());assert candidate['id']==ID and candidate['figureWorldHeight']==2.33
 folder=ROOT/'assets/characters/residents'/ID/'delivery-v2';folder.mkdir(parents=True,exist_ok=False)
 for name in ['standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json']:
  assert sha(CANDIDATE/name)==receipt['outputs'][name];shutil.copy2(CANDIDATE/name,folder/name)
 manifest['characters'][ID]=candidate
 assert all(manifest['characters'][k]==v for k,v in before.items() if k!=ID)
 manifest_path.write_text(json.dumps(manifest,separators=(',',':'),ensure_ascii=False)+'\n')
 print('Installed Irmgard actor only; selective delivery pointer still required; no publication.')
if __name__=='__main__':run()
