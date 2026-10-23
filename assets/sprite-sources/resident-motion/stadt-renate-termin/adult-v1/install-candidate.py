"""Actor-only admission into this isolated Renate worktree, never publish."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
ID='stadt-renate-termin';CANDIDATE=ROOT/'output/street-redesign/renate-end-to-end/candidate-v1'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run():
 manifest_path=ROOT/'assets/characters/street/manifest.json';manifest=json.loads(manifest_path.read_text());before=manifest['characters'].copy()
 old=json.loads((HERE/'pre-admission-person.json').read_text());assert old['id']==ID and old['figureWorldHeight']==1.6
 assert before[ID]==old,'First-admission only: preserve any already changed own entry'
 assert before['crowd-irmgard-aktenordner']['figureWorldHeight']==2.33
 candidate=json.loads((CANDIDATE/'person.json').read_text());receipt=json.loads((CANDIDATE/'compile-receipt.json').read_text());assert candidate['id']==ID and candidate['figureWorldHeight']==2.33
 folder=ROOT/'assets/characters/residents'/ID/'delivery-v2';assert not folder.exists(),'First-admission only: never overwrite selected output';folder.mkdir(parents=True)
 for name in ['standing.webp','source-desktop.webp','source-mobile.webp','mouths-v1.json']:
  assert sha(CANDIDATE/name)==receipt['outputs'][name];shutil.copy2(CANDIDATE/name,folder/name)
 manifest['characters'][ID]=candidate
 assert all(manifest['characters'][k]==v for k,v in before.items() if k!=ID)
 manifest_path.write_text(json.dumps(manifest,separators=(',',':'),ensure_ascii=False)+'\n')
 print('Installed Renate actor only; selective delivery pointer still required; no publication.')
if __name__=='__main__':run()
