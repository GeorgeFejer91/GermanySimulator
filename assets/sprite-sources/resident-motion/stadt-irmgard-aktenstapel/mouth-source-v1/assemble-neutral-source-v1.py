"""Pin Irmgard's eight exact registered 512 turn cells for own lip fitting."""

from pathlib import Path
import hashlib
import json

from PIL import Image


ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
WALK = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-walk-source-v1'
RECEIPT = WALK / 'walk-source.json'
STANDING = ROOT / 'assets/characters/street/stadt-irmgard-aktenstapel-standing.webp'
SHEET = HERE / 'registered-neutrals-v1.png'
ASSEMBLY = HERE / 'registered-neutrals-v1.json'
ORDER = ('down', 'front-right', 'right', 'rear-right', 'up', 'rear-left', 'left', 'front-left')
WALK_SHA = '98e7f1a541ca231dab39bd64f11273e5736124954a4c921ea94f613103029e7b'
STANDING_SHA = '3d330a4d8130ab382545596381fda6fbf016929a15fdf17f8703fee23777bc2e'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run():
    if sha(RECEIPT) != WALK_SHA or sha(STANDING) != STANDING_SHA:
        raise ValueError('Irmgard reviewed source or published standing changed')
    receipt = json.loads(RECEIPT.read_text(encoding='utf8'))
    if (receipt['id'] != 'stadt-irmgard-aktenstapel' or receipt['selectedCells'] != 92 or
            receipt['cell'] != [128, 160] or receipt['pivot'] != [64, 150] or
            receipt['figureHeight'] != 136 or receipt['figureWorldHeight'] != 1.6 or
            receipt['grid'] != [16, 9] or receipt['turns']['row'] != 8 or
            receipt['turns']['count'] != 8):
        raise ValueError('Irmgard source layout/standing changed')
    sheet = Image.new('RGBA', (2048, 1024))
    inputs = {}
    for index, name in enumerate(ORDER):
        item = receipt['turns']['sources'][index]
        path = WALK / 'working' / f'turn-{index}.png'
        if item['col'] != index or item['heading'] != name or sha(path) != item['sourceSha256']:
            raise ValueError('Own turn order or exact source pixels changed: ' + name)
        with Image.open(path) as source:
            tile = source.convert('RGBA')
        if tile.size != (512, 512):
            raise ValueError('Irmgard working turn dimensions changed')
        origin = [(index % 4) * 512, (index // 4) * 512]
        sheet.paste(tile, tuple(origin))
        inputs[name] = {'file': path.relative_to(ROOT).as_posix(),
                        'sha256': item['sourceSha256'], 'cellOriginPx': origin}
    sheet.save(SHEET)
    with Image.open(SHEET) as saved:
        for record in inputs.values():
            x, y = record['cellOriginPx']
            own = Image.open(ROOT / record['file']).convert('RGBA')
            if saved.crop((x, y, x + 512, y + 512)).tobytes() != own.tobytes():
                raise ValueError('Assembled sheet changed own turn paint')
    result = {'schemaVersion': 1,
              'purpose': 'Exact own full-body eight-heading source lips; no runtime adoption',
              'file': SHEET.relative_to(ROOT).as_posix(), 'sha256': sha(SHEET),
              'walkReceipt': {'file': RECEIPT.relative_to(ROOT).as_posix(), 'sha256': WALK_SHA},
              'standing': {'file': STANDING.relative_to(ROOT).as_posix(), 'sha256': STANDING_SHA},
              'inputs': inputs, 'driverSha256': sha(Path(__file__))}
    ASSEMBLY.write_text(json.dumps(result, indent=2) + '\n', encoding='utf8', newline='\n')
    print(json.dumps({'sheetSha256': sha(SHEET), 'receiptSha256': sha(ASSEMBLY), 'cells': 8}))


if __name__ == '__main__':
    run()
