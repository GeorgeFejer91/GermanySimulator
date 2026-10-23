"""Own immutable source closure; no duplicate source archive or private paths needed."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run():
 records=json.loads((HERE/'provenance-union.json').read_text());checks=[]
 for record in records:
  raw=(ROOT/'assets/sprite-sources/berlin-street-20261022'/record['file']).resolve();assert raw.is_relative_to((ROOT/'assets/sprite-sources').resolve());assert sha(raw)==record['sha256']==record['sourceSha256']
  receipt=ROOT/record['sourceReviewReceipt'];assert sha(receipt)==record['sourceReviewReceiptSha256'];r=json.loads(receipt.read_text());request=r['generationRequest'];assert request==record['generationRequest']
  for ref in request['referenced_image_paths']:assert sha(ROOT/ref['path'])==ref['sha256']
  checks.append(record['id'])
 assert sha(ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')=='cdb53f4f1291c54a4ac1fbbee7ce7c4acfe5f9069aaa2b4ca21187e73fcc38c8'
 ancestry=json.loads((HERE/'historical-reference-pins.json').read_text());assert sha(HERE/'standing-v3-historical-receipt.json')==ancestry['historicalRecordSha256']
 for path,ref in ancestry['references'].items():assert sha(ROOT/path)==ref['sha256']
 historical=json.loads((HERE/'standing-v3-historical-receipt.json').read_text());assert sha(ROOT/'assets/sprite-sources/berlin-street-20261022'/historical['file'])==historical['sha256']
 print(json.dumps({'ownRawSourcesChecked':checks,'exactReferences':True,'singleSourceAuthority':True,'historicalIdentityUnchanged':True,'sharedDeformationUnchanged':True}))
if __name__=='__main__':run()
