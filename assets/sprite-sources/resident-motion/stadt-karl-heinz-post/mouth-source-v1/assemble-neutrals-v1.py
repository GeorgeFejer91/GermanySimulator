"""Reproduce the pinned own-neutral lip-fit sheet after the body source export."""
from pathlib import Path
import argparse,hashlib,io,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[5]
SOURCE=Path(__file__).resolve().parent
def sha(data):return hashlib.sha256(data).hexdigest()
def run(write=False):
 receipt=json.loads((SOURCE/'registered-neutrals-v1.json').read_text())
 source_receipt=receipt['sourceReceipt'];assert sha((ROOT/source_receipt['file']).read_bytes())==source_receipt['sha256']
 sheet=Image.new('RGBA',(2048,1024))
 assert len(receipt['inputs'])==8
 for name,item in receipt['inputs'].items():
  path=ROOT/item['file'];assert sha(path.read_bytes())==item['sha256'],name
  im=Image.open(path).convert('RGBA');assert im.size==(512,512)
  sheet.paste(im,tuple(item['cellOriginPx']))
 output=io.BytesIO();sheet.save(output,format='PNG');data=output.getvalue();assert sha(data)==receipt['sha256']
 target=ROOT/receipt['file']
 if write:target.write_bytes(data)
 assert target.read_bytes()==data
 print(json.dumps({'sourceFrames':8,'registeredSheetSha256':sha(data),'mode':'write' if write else 'check'}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');run(parser.parse_args().write)
