"""Check Hartmut's own immutable request, raw output and reference closure."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text())
def run():
 cardinal=read(HERE/'cardinal-original-record.json')
 assert cardinal['id']=='quiz-hartmut-keller-expressionist-directions-v1'
 raw=ROOT/'assets/sprite-sources/berlin-street-20261022'/cardinal['file']
 assert sha(raw)==cardinal['sha256']=='041c21c07d75c80ea7fdd9de3f654dba1778b9553a4ac3bdbf535224386a499e'
 for ref in cardinal['generationRequest']['referenced_image_paths']:assert sha(ROOT/ref['path'])==ref['sha256']
 assert cardinal['source'] and read(HERE/'source-history-note.json')['metadataError']
 for kind in ['quarter','front-right']:
  request=read(HERE/f'{kind}-generation-request.json');receipt=read(HERE/f'{kind}-generation-receipt.json')
  assert request['tool']==receipt['tool']=='built-in image_gen.imagegen'
  assert request['request']['transparent_background'] is True
  assert receipt['originalSourcePath'] and receipt['requestFile']==(HERE/f'{kind}-generation-request.json').relative_to(ROOT).as_posix()
  assert sha(ROOT/receipt['file'])==receipt['sha256']
  assert len(request['references'])==len(request['request']['referenced_image_paths'])
  for ref in request['references']:assert sha(ROOT/ref['path'])==ref['sha256']
 note=read(HERE/'source-history-note.json')
 assert sha(HERE/'pre-admission-person.json')==note['preAdmissionSha256']
 assert sha(HERE/'legacy-family.json')==note['legacyFamilySha256']
 legacy=read(HERE/'legacy-family.json');assert legacy['voiceId']=='quiz-hartmut-keller'
 assert {'greet','wait','work','review','success','failure','look'}<=set(legacy['interactions']['states'])
 print('Own adult cardinal +2 generation requests/raw receipts/reference closure and immutable actor/legacy baseline PASS.')
if __name__=='__main__':run()
