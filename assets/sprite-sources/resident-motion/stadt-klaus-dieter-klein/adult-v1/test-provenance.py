"""Byte-check the exact own ImageGen inputs/outputs and portable prior closure."""
from pathlib import Path
import hashlib,json,struct
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run():
 archive=ROOT/'assets/sprite-sources/berlin-street-20261022'
 records=json.loads((HERE/'own-provenance.json').read_text());assert len(records)==3
 for record in records:
  source=(archive/record['file']).resolve();assert source.is_relative_to(HERE/'raw')
  assert sha(source)==record['sha256'];assert list(struct.unpack('>II',source.read_bytes()[16:24]))==record['dimensions']
  if 'exactRequestPath' in record:
   request=ROOT/record['exactRequestPath'];receipt=ROOT/record['sourceReviewReceipt']
   assert sha(request)==record['exactRequestSha256'];assert sha(receipt)==record['sourceReviewReceiptSha256']
   document=json.loads(request.read_text());assert document['request']==record['generationRequest']
   assert document['request']['transparent_background'] is True
   for reference in document['references']:
    portable=ROOT/reference['path'];assert portable.resolve().is_relative_to(HERE/'raw');assert sha(portable)==reference['sha256']
  else:
   assert sha(ROOT/record['sourceReviewReceiptPortable'])==record['sourceReviewReceiptPortableSha256']
   assert sha(ROOT/record['sourceReviewReceipt'])==record['sourceReviewReceiptSha256']
   for reference in record['portableReferenceClosure']:
    assert sha(ROOT/reference['portablePath'])==reference['sha256']
 prior=json.loads((HERE/'pre-admission-person.json').read_text());legacy=json.loads((HERE/'pre-admission-family.json').read_text())
 assert prior['id']=='stadt-klaus-dieter-klein' and prior['standingOnly'] is True
 assert set(legacy['interactions']['states'])=={'idle','look','success','failure'}
 assert sha(ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')=='cdb53f4f1291c54a4ac1fbbee7ce7c4acfe5f9069aaa2b4ca21187e73fcc38c8'
 print(json.dumps({'status':'PASS','ownRawImages':3,'exactPreCallRequests':2,'portablePriorReferences':3,'originalFourQuietStates':True,'sharedPaintedWalkImmutable':True}))
if __name__=='__main__':run()
