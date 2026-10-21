"""Extract intact own foreground legs; reuse own paint for a held far-leg pilot."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[4]
FOLDER=Path(__file__).resolve().parent
OUT=FOLDER/'original-profile-legs-v1'
QA=ROOT/'output/ambient-city-animation/heike-original-leg-extraction-pilot'
SOURCE=FOLDER/'registered-cardinals-v3-candidate.png'
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
POLYGONS={
 'right':[(175,380),(264,380),(263,403),(252,424),(255,432),(265,437),
          (271,444),(273,452),(273,460),(269,467),(257,473),(160,473),(160,427),(176,411)],
 'left':[(248,380),(346,380),(346,479),(250,479),(241,467),(238,459),(238,451),
         (241,440),(250,433),(258,430),(255,419),(249,408)]}


def build():
    OUT.mkdir(exist_ok=True);QA.mkdir(parents=True,exist_ok=True)
    if sha(SOURCE)!='bfe0660b663a96ac545dfa3da55e37851b16a64a95cb60d9eff66855915badfc':
        raise ValueError('Changed own cardinal paint')
    source=Image.open(SOURCE).convert('RGBA');views={}
    for direction,x in [('right',512),('left',1536)]:
        original=source.crop((x,0,x+512,512))
        mask=Image.new('L',(512,512));ImageDraw.Draw(mask).polygon(POLYGONS[direction],fill=255)
        pixels=np.asarray(original).copy();pixels[np.asarray(mask)==0]=0
        selected=np.asarray(mask)>0
        if not np.array_equal(pixels[selected],np.asarray(original)[selected]):raise ValueError('Original paint modified')
        layer=Image.fromarray(pixels);path=OUT/(direction+'-foreground-original.png');layer.save(path)
        for theme,color in [('light','#eee8db'),('dark','#25272b')]:
            board=Image.new('RGBA',(1024,512),color);board.alpha_composite(original);board.alpha_composite(layer,(512,0))
            board.convert('RGB').save(QA/(direction+'-original-extraction-'+theme+'.png'))
        views[direction]=dict(source=SOURCE.relative_to(ROOT).as_posix(),sourceSha256=sha(SOURCE),
            sourceCell=[x,0,x+512,512],maskPolygon=POLYGONS[direction],
            layer=dict(file=path.relative_to(ROOT).as_posix(),sha256=sha(path)),
            alphaBounds=layer.getchannel('A').getbbox(),retainedPaintExact=True)
    receipt=dict(status='held extraction/method pilot; original source pixels only, no new shoe art',
        driverSha256=sha(Path(__file__)),views=views,
        method='One complete original near leg per profile can supply matching own near/far shoe paint; fixed near draw order and connected original crotch backing remain required.',
        limitations=['The far leg is a reused same-character profile component, not a claim of recovered original hidden far pixels.',
                     'Mask edge, duplicated shoe details, rest geometry, contact/pass and neutral/turn continuity need visual proof.'])
    (OUT/'extraction.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'status':receipt['status'],'views':views}))


if __name__=='__main__':build()
