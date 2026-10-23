"""Verify Irmgard's own untouched inputs, exact requests and portable chain."""
from pathlib import Path
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def main():
 provenance=json.loads((HERE/'source-provenance.json').read_text())
 original=provenance['ownOriginalRecords']['records']
 assert len(original)==3
 for record in original:
  assert record['id'].startswith('stadt-irmgard-aktenstapel-')
  assert sha(HERE/'raw'/record['file'])==record['sourceSha256']
 mapping=json.loads((HERE/'original-receipt-map.json').read_text())
 for receipt in mapping:
  assert sha(ROOT/receipt['retainedPath'])==receipt['sha256']
  record=next(r for r in original if r['sourceReviewReceipt']==receipt['originalPath'])
  assert receipt['sha256']==record['sourceReviewReceiptSha256']
 for reference in provenance['portableReferenceEquivalents']:
  assert sha(ROOT/reference['file'])==reference['sha256']
 request_path=HERE/'quarter-generation-request.json';request=json.loads(request_path.read_text())
 receipt=json.loads((HERE/'quarter-generation-receipt.json').read_text())
 assert sha(request_path)==receipt['requestSha256']
 assert request['arguments']['transparent_background'] is True
 for rel,digest in request['referenceHashes'].items():assert sha(ROOT/rel)==digest
 assert sha(ROOT/receipt['copiedSourcePath'])==receipt['sha256']
 # Git attributes must retain the SHA-bound bytes, including JSON newlines.
 checked=[]
 for path in [HERE/'pre-admission-person.json',HERE/'registration.json',request_path,
              ROOT/'assets/characters/residents/stadt-irmgard-aktenstapel/delivery-v2/mouths-v1.json',
              ROOT/'assets/characters/residents/stadt-irmgard-aktenstapel/delivery-v2/delivery/motion-delivery.json']:
  rel=path.relative_to(ROOT).as_posix()
  raw=subprocess.check_output(['git','hash-object','--no-filters',str(path)],cwd=ROOT,text=True).strip()
  filtered=subprocess.check_output(['git','hash-object','--path',rel,str(path)],cwd=ROOT,text=True).strip()
  assert raw==filtered,rel
  checked.append(rel)
 print(json.dumps({'originalRawRecords':len(original),'exactOriginalReceipts':len(mapping),
  'portableReferences':len(provenance['portableReferenceEquivalents']),
  'exactQuarterRequest':True,'hashBoundGitFilterChecks':len(checked)}))

if __name__=='__main__':main()
