"""Dr Dietmar Schulz raw8 registration: one common isotropic source density and own soles.
Preserves original RGBA source paint; no chroma key, per-view fit, mirror or warp.
"""
from pathlib import Path
import hashlib,json
from PIL import Image,ImageDraw

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
OUT=ROOT/'output/dietmar-schulz-height/registered-v1'
REGISTERED=HERE/'registered-v1'
assert not OUT.exists() and not REGISTERED.exists(),'Preserve registered candidate'
OUT.mkdir(parents=True,exist_ok=True);REGISTERED.mkdir(parents=True,exist_ok=True)
RAW=HERE/'raw/raw-eight-views-v1.png'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(RAW)=='f2c048e65ae72ca98cc7fbde562a532d15ec424e8bd7c39919dcb7a55efb4839'
im=Image.open(RAW).convert('RGBA');assert im.size==(1536,1024)
DIRECTIONS=['down','right','up','left','down-right','up-right','up-left','down-left']
DENSITY=400/468
CANVAS=(512,512);PIVOT=(256,472)
records={};registered=[]
for i,direction in enumerate(DIRECTIONS):
    col,row=i%4,i//4
    raw_box=(384*col,512*row,384*(col+1),512*(row+1))
    cell=im.crop(raw_box)
    alpha=cell.getchannel('A')
    support=alpha.point(lambda a:255 if a>=200 else 0)
    bounds=support.getbbox();assert bounds
    # Ground anchor is the lower, exclusive edge of actual own painted soles.
    sole=bounds[3]
    band_top=max(bounds[1],sole-8)
    sole_bounds=support.crop((0,band_top,384,sole)).getbbox();assert sole_bounds
    foot_pivot_x=(sole_bounds[0]+sole_bounds[2])/2
    source_pivot=(foot_pivot_x,sole)
    # Inverse affine applies the SAME density in both axes and to every view.
    affine=(1/DENSITY,0,source_pivot[0]-PIVOT[0]/DENSITY,
            0,1/DENSITY,source_pivot[1]-PIVOT[1]/DENSITY)
    output=cell.convert('RGBa').transform(CANVAS,Image.Transform.AFFINE,affine,Image.Resampling.BICUBIC).convert('RGBA')
    assert output.getpixel((0,0))[3]==0
    path=REGISTERED/f'{direction}.png';output.save(path)
    oa=output.getchannel('A');ob=oa.point(lambda a:255 if a>=200 else 0).getbbox()
    records[direction]={'rawSemanticCell':list(raw_box),'rawInteriorAlpha200Bounds':list(bounds),
      'rawFigureHeight':bounds[3]-bounds[1],'rawSoleBand':[0,band_top,384,sole],
      'rawSoleBandInteriorBounds':[sole_bounds[0],band_top+sole_bounds[1],sole_bounds[2],band_top+sole_bounds[3]],
      'rawGroundPivot':list(source_pivot),'isotropicDensity':DENSITY,
      'registeredCanvas':list(CANVAS),'registeredGroundPivot':list(PIVOT),
      'affineOutputToSource':list(affine),'registeredAlphaBounds':oa.getbbox(),
      'registeredInteriorAlpha200Bounds':ob,'registeredInteriorFigureHeight':ob[3]-ob[1],
      'file':f'registered-v1/{direction}.png','sha256':sha(path)}
    registered.append((direction,output))
    for name,colour in [('light',(242,237,225,255)),('dark',(24,29,32,255))]:
        composite=Image.new('RGBA',CANVAS,colour);composite.alpha_composite(output)
        composite.convert('RGB').save(OUT/f'{direction}-native-{name}.png')

for name,colour in [('light',(242,237,225,255)),('dark',(24,29,32,255))]:
    board=Image.new('RGBA',(2048,1024),colour)
    for i,(direction,image) in enumerate(registered):board.alpha_composite(image,((i%4)*512,(i//4)*512))
    board.convert('RGB').save(OUT/f'all-eight-registered-native-{name}.png')
    profiles=Image.new('RGBA',(1024,512),colour)
    profiles.alpha_composite(registered[1][1],(0,0));profiles.alpha_composite(registered[3][1],(512,0))
    profiles.convert('RGB').save(OUT/f'right-left-registered-native-{name}.png')
    feet=Image.new('RGBA',(1024,260),colour)
    for x,index in [(0,1),(512,3)]:feet.alpha_composite(registered[index][1].crop((0,252,512,512)),(x,0))
    feet.convert('RGB').save(OUT/f'right-left-lower-native-{name}.png')

record={'schemaVersion':1,'registryId':'quiz-dietmar-schulz','source':'raw/raw-eight-views-v1.png',
 'sourceSha256':sha(RAW),'nominalSourceFigureHeight':400,'referenceRawFigureHeight':468,
 'commonIsotropicDensity':DENSITY,'canvas':list(CANVAS),'groundPivot':list(PIVOT),
 'method':'One common400/468 isotropic source-sheet density; each own lower-exclusive sole edge maps to472 and actual last8row sole-bearing centre maps to256. No independent quarter shrinking, whole-cell stretch, mirror or deformation. RGBa premultiplied resampling clears hidden alpha-zero RGB without a chroma key.',
 'matteCleanup':'None. Exact semantic-cell RGBA retained before common resampling, including low-alpha tails; no visible composited matte defect justified paint cleanup.',
 'quarterPostureLimit':'Raw quarters478–481px retain their genuine taller posture (~409–411continuous working pixels) at the same density. Source review, not independent per-cell refitting, decides acceptability.',
 'directions':records,'status':'REGISTERED SOURCE CANDIDATE; root neutral/turn review and complete profile far-leg source gate required before animation',
 'notProven':['Complete hidden far-leg/shoe paint','Source motion/cadence or stop extrema','Mouth fitting/native speech','Encoded family or world height acceptance']}
(HERE/'registration-v1.json').write_text(json.dumps(record,indent=2)+'\n')
(OUT/'report.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps({'source':sha(RAW),'density':DENSITY,'height':400,'pivot':PIVOT,'actualRegisteredInteriorHeights':{k:v['registeredInteriorFigureHeight'] for k,v in records.items()},'status':record['status']}))
