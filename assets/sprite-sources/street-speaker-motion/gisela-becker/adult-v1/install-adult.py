"""Install only Gisela's own adult art record and its packed delivery."""
from pathlib import Path
import hashlib
import importlib.util
import json

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
ID='quiz-gisela-becker'
ASSETS=ROOT/'assets/characters/street-speakers'/ID/'delivery-adult-v1'
MANIFEST=ROOT/'assets/characters/street/manifest.json'
sha=lambda path:hashlib.sha256(Path(path).read_bytes()).hexdigest()

layout=json.loads((HERE/'assembly-receipt.json').read_text(encoding='utf8'))['layout']
mouth=ASSETS/'mouths-v1.json'
standing=ASSETS/'standing.webp'
desktop=ASSETS/'source-desktop.webp'
mobile=ASSETS/'source-mobile.webp'
for path in (mouth,standing,desktop,mobile):
    if not path.is_file():raise ValueError('Missing own Gisela asset: '+str(path))
definition=json.loads(mouth.read_text(encoding='utf8'))
if definition['id']!=ID or definition['cell']!=[128,160] or definition['grid']!=[21,18]:
    raise ValueError('Wrong adult mouth binding')
if definition['sources']!={'standing':sha(standing),'desktop':sha(desktop),'mobile':sha(mobile)}:
    raise ValueError('Adult mouth references changed body bytes')
data=json.loads(MANIFEST.read_text(encoding='utf8'))
people=data['characters']
old=people[ID]
if old['id']!=ID or old['grid']!=[21,18] or old['cell']!=[128,160] or old['pivot']!=[64,150]:
    raise ValueError('Unexpected prior Gisela record')
other_before={key:json.dumps(value,ensure_ascii=False,sort_keys=True) for key,value in people.items() if key!=ID}
base=json.loads((HERE/'pre-admission-person.json').read_text(encoding='utf8'))
base_hash=hashlib.sha256(json.dumps(base,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode('utf8')).hexdigest()
if base_hash!='a56c09705fde7a441804fe73119650c6084d1a6f7edb9037bf8a73db00f48018':
    raise ValueError('Gisela immutable pre-admission person changed')
if base['id']!=ID or base['grid']!=[21,18] or base['cell']!=[128,160] or base['pivot']!=[64,150] or base['figureWorldHeight']!=1.6:
    raise ValueError('Wrong Gisela pre-admission configuration')
person=dict(base)
person['figureWorldHeight']=2.33
person['strideDistance']=18.64
person['standing']={'file':'./'+standing.relative_to(ROOT).as_posix(),'sha256':sha(standing),'width':128,'height':160}
person['variants']={
    'desktop':{'file':'./'+desktop.relative_to(ROOT).as_posix(),'sha256':sha(desktop),'width':2016,'height':2160},
    'mobile':{'file':'./'+mobile.relative_to(ROOT).as_posix(),'sha256':sha(mobile),'width':1344,'height':1440},
}
person['mouthPaint']={'file':'./'+mouth.relative_to(ROOT).as_posix(),'sha256':sha(mouth)}
person['atlasMotion']={
    'schemaVersion':1,'walks':layout['walks'],'bridges':layout['bridges'],
    'transitions':layout['transitions'],
    'neutral':{'row':layout['bridges']['down']['row'],'col':layout['bridges']['down']['stop_cols'][-1]},
    'settles':layout['settles'],'turns':layout['turns'],
    'interactions':layout['interactions'],
}
if set(person['atlasMotion']['interactions']['states'])!={'greet','work','review','look','wait','success','failure'}:
    raise ValueError('Lost Gisela interaction state')
people[ID]=person
other_after={key:json.dumps(value,ensure_ascii=False,sort_keys=True) for key,value in people.items() if key!=ID}
if other_after!=other_before:raise ValueError('Other street records changed')
MANIFEST.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
if MANIFEST.stat().st_size>262144:raise ValueError('Manifest exceeds 256 KiB')

spec=importlib.util.spec_from_file_location('street_motion_delivery',ROOT/'tools/build-street-motion-delivery.py')
packer=importlib.util.module_from_spec(spec);spec.loader.exec_module(packer)
delivery=ASSETS/'delivery'
record=packer.run(MANIFEST,ID,delivery,root=ROOT)
person['motionDelivery']={'file':'./'+(delivery/'motion-delivery.json').relative_to(ROOT).as_posix(),
                          'sha256':sha(delivery/'motion-delivery.json')}
MANIFEST.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
if MANIFEST.stat().st_size>262144:raise ValueError('Manifest exceeds 256 KiB')
packer.run(MANIFEST,ID,delivery,check=True,root=ROOT)
print(json.dumps({'id':ID,'manifestBytes':MANIFEST.stat().st_size,
                  'mouthSha256':sha(mouth),'deliverySha256':person['motionDelivery']['sha256'],
                  'movementSlots':sum(v is not None for v in record['packs']['movement']['slots']),
                  'reactionSlots':sum(v is not None for v in record['packs']['reactions']['slots'])}))
