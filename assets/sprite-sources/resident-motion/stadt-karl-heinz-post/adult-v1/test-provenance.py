"""Verify immutable raw paint and exact review-receipt byte bindings."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
FOLDER=ROOT/'assets/sprite-sources/berlin-street-20261022'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run():
 records=json.loads((FOLDER/'provenance.json').read_text())['records'];checks=[]
 for record in records:
  path=FOLDER/record['file'];expected=record.get('sourceSha256',record.get('sha256'))
  if expected:assert sha(path)==expected,record['file']
  review=record.get('sourceReviewReceipt')
  if review and record.get('sourceReviewReceiptSha256'):assert sha(ROOT/review)==record['sourceReviewReceiptSha256'],review
  checks.append(record['file'])
 request=json.loads((HERE/'quarter-generation-request.json').read_text());receipt=json.loads((HERE/'quarter-generation-receipt.json').read_text())
 assert request['arguments']==receipt['arguments']
 assert request['arguments']['prompt']==(HERE/'quarter-request-prompt.txt').read_text()
 for rel,digest in request['referenceHashes'].items():assert sha(ROOT/rel)==digest,rel
 print(json.dumps({'immutableRawRecordsChecked':len(checks),'quarterExactRequestPreserved':True,'quarterReferenceHashesExact':len(request['referenceHashes'])}))
if __name__=='__main__':run()
