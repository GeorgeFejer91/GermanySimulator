"""Verify Sabine's own immutable paint, requests and reference byte bindings."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run():
 folder=ROOT/'assets/sprite-sources/berlin-street-20261022'
 records=json.loads((folder/'provenance.json').read_text())['records'];own=[v for v in records if v['id'].startswith('quiz-sabine-krueger-expressionist-')]
 assert len(own)==3
 for v in own:
  assert sha(folder/v['file'])==v['sha256']
  if v.get('sourceReviewReceiptSha256'):assert sha(ROOT/v['sourceReviewReceipt'])==v['sourceReviewReceiptSha256']
 for prefix in ['quarter','front-right']:
  request=json.loads((HERE/(prefix+'-generation-request.json')).read_text());receipt=json.loads((HERE/(prefix+'-generation-receipt.json')).read_text())
  assert request['request']['prompt']==(HERE/(prefix+'-request-prompt.txt')).read_text().rstrip('\n')
  assert sha(ROOT/receipt['file'])==receipt['sha256']
  assert receipt['originalSourcePath'].endswith('.png')
  for ref in request['references']:assert sha(ROOT/ref['path'])==ref['sha256']
 assert sha(HERE/'pre-admission-person.json')=='97d162ce7ca6f7798b2f02d4468dd218dcf8d28813c7442457bebf55067e754c'
 print(json.dumps({'ownRawRecords':len(own),'exactRequests':2,'immutableBaseline':True}))
if __name__=='__main__':run()
