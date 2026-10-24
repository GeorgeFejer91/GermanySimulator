"""Record the exact selected standing paint's crown and floor oracle."""
from pathlib import Path
import json,hashlib,math
from PIL import Image
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/wolfgang-end-to-end'
person=json.loads((ROOT/'assets/characters/street/manifest.json').read_text())['characters']['stadt-wolfgang-schulz']
path=ROOT/person['standing']['file']
assert hashlib.sha256(path.read_bytes()).hexdigest()==person['standing']['sha256']
paint=Image.open(path).convert('RGBA');threshold=math.ceil(.08*255)
bounds=paint.getchannel('A').point(lambda value:255 if value>=threshold else 0).getbbox()
record={'character':person['id'],'standingSha256':person['standing']['sha256'],'dimensions':list(paint.size),'alphaThreshold':threshold,'alphaBounds':bounds,'nominalPixels':person['figureHeight'],'pivot':person['pivot'],'figureWorldHeight':person['figureWorldHeight'],'paintedCrownWorldHeight':(person['pivot'][1]-bounds[1])*person['figureWorldHeight']/person['figureHeight']}
(WORK/'standing-raster.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record))
