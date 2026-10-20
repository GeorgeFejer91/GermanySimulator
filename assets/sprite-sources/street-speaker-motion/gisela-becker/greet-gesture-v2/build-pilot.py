"""Seven-sample own-source greeting pilot, using existing layered morph paint."""
from pathlib import Path
import hashlib,importlib.util,json,math,sys
import numpy as np
from PIL import Image,ImageDraw
from scipy.spatial import Delaunay
from scipy.ndimage import label,binary_dilation,distance_transform_edt

FOLDER=Path(__file__).resolve().parent
ROOT=FOLDER.parents[4]
OUT=ROOT/'output/ambient-city-animation/gisela-greet-v2'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import morph_frames
spec=importlib.util.spec_from_file_location('family',ROOT/'tools/build-street-speaker-family.py')
family=importlib.util.module_from_spec(spec);spec.loader.exec_module(family)
b,cfg=family.configure(ROOT/'assets/sprite-sources/street-speaker-motion/gisela-becker/motion-spec.json')
person=cfg['characters']['quiz-gisela-becker']
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
OUT.mkdir(parents=True,exist_ok=True)
source_record=json.loads((FOLDER/'source-registration.json').read_text())
assert sha(ROOT/source_record['source'])==source_record['sourceSha256']
neutral=b.neutral(person,'down')
raised=Image.open(FOLDER/'greet-registered.png').convert('RGBA')
neutral.save(FOLDER/'neutral-source.png')

def mask(polygon):
 m=Image.new('L',(512,512));ImageDraw.Draw(m).polygon(polygon,fill=255);return np.array(m)
def layer(im,alpha):
 a=np.array(im);a[:,:,3]=np.minimum(a[:,:,3],alpha);a[a[:,:,3]==0]=0;return Image.fromarray(a)

prop_polygons=[[(128,245),(185,233),(216,326),(174,339),(172,352),(150,353),(137,339),(134,316),(139,297)],
 [(86,160),(148,140),(176,235),(134,247),(134,260),(115,270),(100,253),(95,235),(96,216),(103,207)]]
arm_polygons=[[(198,276),(208,291),(190,312),(181,340),(169,364),(151,373),(133,364),(123,348),(126,330),(137,319),(173,341),(181,307),(189,282)],
 [(202,251),(211,267),(191,295),(168,310),(142,307),(118,296),(105,281),(103,264),(109,253),(107,252),(137,275),(163,255),(187,246)]]
head_polygons=[[(143,65),(385,65),(387,213),(343,265),(315,286),(230,286),(200,260),(162,234),(140,206)],
 [(151,85),(383,85),(383,225),(342,283),(315,300),(224,300),(196,277),(158,247),(148,214)]]
props=[mask(p)for p in prop_polygons];arms=[mask(p)for p in arm_polygons];heads=[mask(p)for p in head_polygons]
book_polygons=[[(306,283),(350,264),(369,268),(367,325),(360,373),(329,381),(300,366),(300,329)],
 [(302,302),(349,282),(369,287),(367,341),(360,384),(329,387),(300,378),(300,342)]]
books=[mask(p)for p in book_polygons]
head_layers=[layer(im,np.where(binary_dilation(props[i]>0,iterations=3)|(books[i]>0),0,heads[i]).astype('uint8'))for i,im in enumerate([neutral,raised])]
arm_layers=[layer(im,np.where(props[i]>0,0,arms[i]).astype('uint8'))for i,im in enumerate([neutral,raised])]
prop=layer(neutral,props[0])
# Only revealed own torso paint fills the vacated arm. Raised arm/head/prop
# cannot remain on the backing and create a second silhouette.
backing=np.array(neutral)
backing_nodes=[0,275,310,350,400,430,511];backing_dx=[0,0,10,14,15,0,0]
own_torso=layer(raised,np.where((arms[1]>0)|(heads[1]>0)|(props[1]>0),0,255).astype('uint8'))
replacement=np.array(b.paint.warp_layer(own_torso,backing_nodes,backing_dx,[0]*7))
reveal=mask([(193,270),(218,285),(224,333),(222,407),(149,407),(160,380),(172,350),(185,318)])
replacement[reveal==0]=0
old=mask([(124,230),(198,230),(221,284),(220,354),(189,378),(120,378),(114,310)])>0
backing[old]=replacement[old]
# Weld only compatible, opaque original torso paint at the revealed-patch rim.
# Paper/hand/sleeve/head pixels cannot leak back through this local coat seam.
original_pixels=np.array(neutral);stationary=(props[0]==0)&(arms[0]==0)&(heads[0]==0)&old&(original_pixels[:,:,3]>=250)&(replacement[:,:,3]>=250)
weight=np.clip(distance_transform_edt(old)/14,0,1);weight=weight*weight*(3-2*weight)
seam=b.paint.unpack(b.paint.premul(neutral)*(1-weight[:,:,None])+b.paint.premul(Image.fromarray(replacement))*weight[:,:,None])
backing[stationary]=np.array(seam)[stationary];backing[(heads[0]>0)&(books[0]==0)]=0
# The source-head removal and shifted revealed-coat exclusion leave a one-pixel
# vertical gap below the moving lapel. This is missing backing alpha, not a black
# painted crease. Give the stationary native coat an explicit underlap only in
# this measured coat-only source region; moving face/arm fields stay unchanged.
collar_underlap=mask([(216,282),(230,286),(230,318),(216,318)])>0
collar_gap=collar_underlap&(backing[:,:,3]==0)&(original_pixels[:,:,3]>0)
backing[collar_gap]=original_pixels[collar_gap]
backing[backing[:,:,3]==0]=0;backing=Image.fromarray(backing)

fixed=[((0,0),(0,0)),((511,0),(511,0)),((511,511),(511,511)),((0,511),(0,511)),
 ((50,60),(50,60)),((440,60),(440,60)),((50,400),(50,400)),((440,400),(440,400)),((256,500),(256,500))]
head_pairs=fixed+[
 ((258,77),(259,98)),((218,111),(220,126)),((313,106),(312,127)),
 ((163,170),(170,182)),((367,171),(359,185)),((197,216),(192,230)),((330,224),(329,237)),
 ((259,182),(249,196.5)),((309,189),(299,207)),((282,213),(272,226)),
 ((239,181),(229,196)),((273,188),(263,204)),((297,188),(287,205)),((321,195),(311,212)),
 ((248,171),(238,184)),((312,177),(302,193)),((234,188),(224,203)),((252,205),(242,219)),
 ((281,195),(271,211)),((312,215),(302,230)),((223,245),(216,258)),((272,266),(262,279)),
 ((224,286),(224,300)),((315,286),(315,300))]
native=json.loads((FOLDER/'native-face-sources.json').read_text())
for index in [0,4]:
 values=[]
 for name in ['down','greet']:
  transform=source_record['registrations'][name];values.append((np.array(native[name]['contoursPx']['crease'][index])*transform['scale']+transform['origin']).tolist())
 head_pairs.append(values)
head_pairs.append([(np.array(native[name]['centerPx'])*source_record['registrations'][name]['scale']+source_record['registrations'][name]['origin']).tolist()for name in ['down','greet']])
arm_fixed=list(fixed);arm_fixed[6]=((50,400),(20,150))
# This outer anchor is transparent sleeve-canvas support. The excluded cuff
# vertex is inside the separately owned rigid paper/grip layer, not arm paint.
arm_pairs=arm_fixed+[pair for i,pair in enumerate(zip(arm_polygons[0],arm_polygons[1]))if i!=9]
def prepare(pairs):
 points=np.array(pairs,dtype=float);tri=Delaunay(points.mean(axis=1)).simplices
 morph_frames.validate_mesh(points[:,0],points[:,1],tri)
 return points,tri
head_points,head_tri=prepare(head_pairs);arm_points,arm_tri=prepare(arm_pairs)
# Neutral's upper sleeve is concealed by its paper. Reuse only this character's
# complete visible raised sleeve through the SAME actual helper map, retaining
# the original neutral sleeve wherever it is visible. This supplies paint before
# blending, avoiding a transparent crossfade from an absent upper-arm surface.
_,raised_at_neutral=morph_frames.coordinate_maps(arm_points[:,0],arm_points[:,1],arm_tri,0,(512,512))
complete=np.array(b.paint.unpack(morph_frames.sample(morph_frames.premultiplied(arm_layers[1]),raised_at_neutral)))
original_arm=np.array(arm_layers[0]);complete[:,:,3]=np.minimum(complete[:,:,3],np.array(neutral)[:,:,3]);complete[original_arm[:,:,3]>0]=original_arm[original_arm[:,:,3]>0];complete[complete[:,:,3]==0]=0
arm_layers[0]=Image.fromarray(complete)
for name,im in [('neutral-head',head_layers[0]),('raised-head',head_layers[1]),('neutral-arm',arm_layers[0]),('raised-arm',arm_layers[1]),('rigid-paper-hand',prop),('own-torso-backing',backing)]:im.save(FOLDER/(name+'.png'))
controls={'status':'candidate source pilot; root review required','action':'paper-raise greeting; paper anatomical RIGHT/book LEFT','sharedRegistration':source_record,
 'head':{'pointsSource':head_points[:,0].tolist(),'pointsTarget':head_points[:,1].tolist(),'triangles':head_tri.tolist(),'mouthTransport':'Actual existing morph_frames mesh; both endpoint native profiles must map through these exact triangles, not a reconstructed approximate rig.'},
 'arm':{'pointsSource':arm_points[:,0].tolist(),'pointsTarget':arm_points[:,1].tolist(),'triangles':arm_tri.tolist(),'hiddenNeutralPaint':'Complete own raised sleeve registered backward by actual morph_frames.coordinate_maps/sample at phase0; original visible neutral sleeve retained. No other family or newly invented paint.'},
 'torsoBacking':{'source':'greet-registered.png','nodesY':backing_nodes,'dx':backing_dx,'dy':[0]*7,'revealPolygon':[(193,270),(218,285),(224,333),(222,407),(149,407),(160,380),(172,350),(185,318)],'purpose':'Own revealed coat registered to the stationary neutral garment edge; no duplicated raised sleeve/head/prop on the backing.'},
 'maskOwnership':{'headPaperExclusionDilation':3,'torsoOpaqueCompatibleSeamPixels':14,'stationaryBookLeftHand':book_polygons[0],'collarNativeCoatUnderlap':[(216,282),(230,286),(230,318),(216,318)],'note':'Actual source mask repair: paper-edge white pixels cannot enter head paint; own opaque coat overlap is locally welded. Measured collar backing alpha gap receives original stationary native coat underlap only. No face/full-body dissolve.'},
 'rigidPaperHand':{'source':'rigid-paper-hand.png','translationAtExtreme':[-38,-82],'scale':1,'rotation':0,'reason':'Single original paper/grip/cuff paint stays rigid; wrist arrives at actual raised sleeve. No paper bending, detached fingers, prop handoff or hidden hand invented.'},
 'fieldOwner':'.agents/skills/animate-2d-characters/scripts/morph_frames.py','fieldOwnerSha256':sha(ROOT/'.agents/skills/animate-2d-characters/scripts/morph_frames.py'),
 'coreBuilderSha256':sha(ROOT/'tools/build-resident-motion.py'),'familyBuilderSha256':sha(ROOT/'tools/build-street-speaker-family.py'),'familyConfigSha256':sha(ROOT/'assets/sprite-sources/street-speaker-motion/gisela-becker/motion-spec.json')}
(FOLDER/'controls.json').write_text(json.dumps(controls,indent=2)+'\n')
times=[0,.30,.65,1,.65,.30,0];frames=[];records=[]
original_morph=morph_frames.morph
for i,t in enumerate(times):
 frame=backing.copy();frame.alpha_composite(original_morph(arm_layers[0],arm_layers[1],arm_points[:,0],arm_points[:,1],arm_tri,t));frame.alpha_composite(original_morph(head_layers[0],head_layers[1],head_points[:,0],head_points[:,1],head_tri,t))
 yy,xx=np.mgrid[:512,:512];frame.alpha_composite(b.paint.unpack(b.paint.sample(b.paint.premul(prop),xx+38*t,yy+82*t)))
 # The held book/left hand own their source pixels over the moving head/neck.
 pixels=np.array(frame);original=np.array(neutral);pixels[books[0]>0]=original[books[0]>0];frame=Image.fromarray(pixels)
 if t==0:frame=neutral.copy()
 frames.append(frame);frame.save(OUT/f'working-{i:02}.png');records.append({'frame':i,'t':t,'headField':{'pointsSource':head_points[:,0].tolist(),'pointsTarget':head_points[:,1].tolist(),'triangles':head_tri.tolist(),'phase':t},'rigidPropInverse':{'dx':38*t,'dy':82*t}})
for variant,compact in [('desktop',False),('mobile',True)]:
 encoded=[b.street.export_cell(f,cfg,compact=compact)for f in frames];w,h=encoded[0].size;atlas=Image.new('RGBA',(w*len(encoded),h))
 for i,im in enumerate(encoded):atlas.alpha_composite(im,(w*i,0))
 target=OUT/(variant+'-pilot.webp');atlas.save(target,lossless=True,exact=True,method=6);actual=Image.open(target).convert('RGBA');assert actual.tobytes()==atlas.tobytes()
 for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
  b.street.opaque_board(encoded,7,bg,3 if not compact else 6).save(OUT/(variant+'-'+theme+'.png'))
 for speed,ms in [('normal',110),('slow',220)]:
  display=[b.street.opaque_board([im],1,'#eee8db',3 if not compact else 6)for im in encoded];display[0].save(OUT/(variant+'-'+speed+'.gif'),save_all=True,append_images=display[1:],duration=ms,loop=0,disposal=2)
 assert encoded[0].tobytes()==encoded[-1].tobytes()
reference=np.array(neutral);checks=[]
for i,f in enumerate(frames):
 pixels=np.array(f);assert np.array_equal(pixels[420:],reference[420:]),'Planted feet/lower garment changed'
 assert np.array_equal(pixels[books[0]>0],reference[books[0]>0]),'Owned book/left hand changed'
 # Row300 x300..303 is moving scarf, not the prop. The entire authored book
 # mask above and the remaining broad stationary region must stay exact.
 assert np.array_equal(pixels[301:385,300:390],reference[301:385,300:390]),'Book/left-hand region changed'
 labels,count=label(pixels[:,:,3]>=128);sizes=np.bincount(labels.ravel());body=int(sizes[1:].max());total=int(sizes[1:].sum());checks.append({'frame':i,'t':times[i],'opaqueBodyFraction':body/total,'lowerBodyExact':True,'bookLeftHandExact':True})
 assert body/total>.995,'Detached opaque limb/prop component'
(OUT/'actual-field-capture.json').write_text(json.dumps({'driverSha256':sha(Path(__file__)),'fieldOwnerSha256':controls['fieldOwnerSha256'],'samples':records},indent=2)+'\n')
(OUT/'structural-checks.json').write_text(json.dumps({'status':'structural only; visual review outstanding','samples':checks,'zeroEndExact':True,'distinctSamples':len(set(f.tobytes()for f in frames)),'wholeBodyDissolve':False,'runtimeEdited':False},indent=2)+'\n')
print(json.dumps({'samples':len(frames),'distinct':len(set(f.tobytes()for f in frames)),'controls':str(FOLDER/'controls.json'),'review':str(OUT)}))
