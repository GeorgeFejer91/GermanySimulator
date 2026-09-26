"""Offline photo-landmark fit used by the Blender sculpture, never by the game.

Run with the authoring venv after obtaining the reference files and MediaPipe
model listed in the adjacent asset provenance. The output is editable geometry
data, not a claim of a metrically accurate scan from historical photographs.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw
import mediapipe as mp

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / "output/kiesinger-references"
OUT = ROOT / "assets/models/kiesinger/portrait-landmarks.json"
canonical = []
faces = []
for line in (REF / "canonical_face_model.obj").read_text().splitlines():
    words = line.split()
    if words and words[0] == "v":
        x,y,z = map(float, words[1:4])
        canonical.append((x,-z,y))
    if words and words[0] == "f":
        faces.append([int(item.split("/")[0])-1 for item in words[1:]])
canonical = np.array(canonical)
assert canonical.shape == (468,3)

# The neutral frontal view dominates the shape. The smiling Anefo view has
# only a five-percent contribution below the eyes to preserve a quiet mouth.
sources = [
    ("kiesinger-1967-kas.jpg", None, .75),
    ("kiesinger-cabinet-1966.jpg", (775,525,1330,1225), .25),
    ("kiesinger-1966-front.jpg", None, 0),
]
options = mp.tasks.vision.FaceLandmarkerOptions(
    base_options=mp.tasks.BaseOptions(model_asset_path=str(REF/"face_landmarker.task")),
    running_mode=mp.tasks.vision.RunningMode.IMAGE,
    num_faces=1,
    min_face_detection_confidence=.35,
    output_facial_transformation_matrixes=True,
)
aligned = []
records = []
with mp.tasks.vision.FaceLandmarker.create_from_options(options) as detector:
    for filename,crop,weight in sources:
        photo = Image.open(REF/filename).convert("RGB")
        if crop: photo=photo.crop(crop)
        photo.thumbnail((1500,1500))
        result=detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=np.array(photo)))
        assert len(result.face_landmarks)==1,filename
        lm=np.array([[p.x,p.y,p.z] for p in result.face_landmarks[0]])[:468]
        width,height=photo.size
        raw=np.column_stack((lm[:,0]*width,lm[:,2]*width,-lm[:,1]*height))
        # A rigid Procrustes alignment removes camera yaw/pitch/roll while
        # retaining each portrait's measured relative facial proportions.
        center=raw.mean(axis=0);refcenter=canonical.mean(axis=0)
        a=raw-center;b=canonical-refcenter
        u,s,vh=np.linalg.svd(a.T@b)
        correction=np.eye(3);correction[2,2]=np.linalg.det(u@vh)
        rotation=u@correction@vh
        a=a@rotation
        a*=.68/(a[10,2]-a[152,2])
        a[:,0]-=(a[234,0]+a[454,0])/2
        a[:,1]-=(a[234,1]+a[454,1])/2
        a[:,2]+=5.16-a[152,2]
        aligned.append(a)
        records.append({"file":filename,"sha256":hashlib.sha256((REF/filename).read_bytes()).hexdigest(),"weight":weight})
        draw=ImageDraw.Draw(photo)
        for x,y,z in lm:
            px=x*width;py=y*height
            draw.ellipse((px-1,py-1,px+1,py+1),fill=(200,35,25))
        photo.save(REF/(Path(filename).stem+"-landmarks.png"))

vertices=sum(a*s[2] for a,s in zip(aligned,sources))
lower=vertices[:,2]<5.54
vertices[lower]=aligned[0][lower]*.95+aligned[1][lower]*.05
vertices[:,1]=vertices[:,1]*.80+aligned[2][:,1]*.20
# Retain visible asymmetry, but suppress opposing yaw/depth estimation error.
# Vertex pairs are determined from the published canonical topology.
mirror=[]
for p in canonical:
    q=p.copy();q[0]*=-1
    mirror.append(int(np.argmin(np.sum((canonical-q)**2,axis=1))))
for i,j in enumerate(mirror):
    if j<=i:continue
    depth=(vertices[i,1]+vertices[j,1])/2
    vertices[i,1]=vertices[i,1]*.25+depth*.75
    vertices[j,1]=vertices[j,1]*.25+depth*.75

# Face connectivity preserves lip rolls, orbital rims and nose wings; the
# Blender authoring stage adds the cranium, eyelids' backing, ears, and hair.
OUT.write_text(json.dumps({
    "method":"MediaPipe landmarks, rigid pose removal, neutral frontal plus CC0 cabinet view; three-quarter depth check; neutral lower-face expression retained",
    "mediapipe_version":mp.__version__,
    "canonical_sha256":hashlib.sha256((REF/"canonical_face_model.obj").read_bytes()).hexdigest(),
    "reference_photos":records,
    "vertices":[[round(float(v),7) for v in p] for p in vertices],
    "faces":faces,
},separators=(",",":"))+"\n",encoding="utf-8")
print(json.dumps({"vertices":len(vertices),"faces":len(faces),"bounds":np.ptp(vertices,axis=0).tolist(),"nose":vertices[1].tolist(),"eyes":[vertices[33].tolist(),vertices[263].tolist()]}))
