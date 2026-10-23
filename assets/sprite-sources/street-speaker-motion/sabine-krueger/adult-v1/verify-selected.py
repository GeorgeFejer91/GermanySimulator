"""Compare a fresh Sabine compile with her selected production source assets."""
from pathlib import Path
import json,hashlib,argparse
ROOT=Path(__file__).resolve().parents[5]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run(folder):
 person=json.loads((ROOT/'assets/characters/street/manifest.json').read_text())['characters']['quiz-sabine-krueger']
 assert person['figureWorldHeight']==2.33 and not person['standingOnly']
 for name,value in [('standing.webp',person['standing']),('source-desktop.webp',person['variants']['desktop']),('source-mobile.webp',person['variants']['mobile']),('mouths-v1.json',person['mouthPaint'])]:
  assert sha(folder/name)==sha(ROOT/value['file'])==value['sha256'],name
 rebuilt=json.loads((folder/'person.json').read_text());current={k:v for k,v in person.items() if k!='motionDelivery'};assert rebuilt==current
 print('Fresh five-file compile equals selected Sabine source assets and actor record.')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('candidate',type=Path);run(p.parse_args().candidate)
