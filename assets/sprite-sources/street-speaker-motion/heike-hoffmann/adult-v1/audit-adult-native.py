"""Audit every selected Heike native cell and render light/dark row boards."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
ID="quiz-heike-hoffmann"
COLS,ROWS=21,18


def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def read(path):return json.loads(Path(path).read_text(encoding="utf8"))


def audit(output):
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    root=ROOT/"assets/characters/street-speakers/quiz-heike-hoffmann/delivery-v1"
    person=read(ROOT/"assets/characters/street/manifest.json")["characters"][ID]
    mouth=read(root/"mouths-v1.json")
    pack=read(root/"delivery/motion-delivery.json")
    if len(mouth["frames"])!=COLS*ROWS:raise ValueError("Mouth grid changed")
    selected=set(pack["packs"]["movement"]["slots"]+pack["packs"]["reactions"]["slots"])
    selected.discard(None)
    if len(selected)!=364:raise ValueError("Heike body capability lost a selected cell")
    variants={}
    for variant,w,h in (("desktop",96,120),("mobile",64,80)):
        path=root/f"source-{variant}.webp"
        if sha(path)!=person["variants"][variant]["sha256"]:raise ValueError("Selected source hash mismatch")
        atlas=Image.open(path).convert("RGBA")
        if atlas.size!=(w*COLS,h*ROWS):raise ValueError("Native grid changed")
        if mouth["sources"][variant]!=sha(path):raise ValueError("Mouth/native paint binding changed")
        array=np.asarray(atlas)
        if np.any(array[:,:,:3][array[:,:,3]==0]):
            raise ValueError("Heike native atlas has hidden RGB behind zero alpha")
        entries=[];slices=[]
        for row in range(ROWS):
            row_frames=[]
            for col in range(COLS):
                slot=row*COLS+col
                cell=atlas.crop((col*w,row*h,(col+1)*w,(row+1)*h))
                pixels=np.asarray(cell)
                alpha=pixels[:,:,3]
                box=cell.getchannel("A").getbbox()
                if slot not in selected:
                    if box is not None:raise ValueError(f"Heike unused slot {slot} contains paint")
                elif box is None:
                    raise ValueError(f"Heike selected slot {slot} is blank")
                if box is not None:
                    margin=min(box[0],box[1],w-box[2],h-box[3])
                    if margin<2:raise ValueError(f"Heike selected slot {slot} clips native border")
                    n,_,stats,_=cv2.connectedComponentsWithStats((alpha>=20).astype("uint8"),8)
                    pieces=sorted((int(stats[i,cv2.CC_STAT_AREA]) for i in range(1,n)),reverse=True)
                    if not pieces or pieces[0]<300*(w/96)**2:
                        raise ValueError(f"Heike selected slot {slot} lacks whole body")
                else:margin=None;pieces=[]
                fit=mouth["frames"][slot]
                if fit is not None:
                    x=int(round(fit["rect"][0]*w))
                    y=int(round((1-fit["rect"][1])*h))
                    if not 0<=x<w or not 0<=y<h or alpha[y,x]<128:
                        raise ValueError(f"Heike mouth leaves painted face at {variant} slot {slot}")
                entries.append({"slot":slot,"row":row,"col":col,"selected":slot in selected,
                                "alphaBounds":box,"minimumMargin":margin,
                                "alpha20ComponentAreas":pieces,"mouth":fit is not None})
                row_frames.append(cell)
            slices.append(row_frames)
        for start,end in ((0,4),(4,8),(8,13),(13,18)):
            for theme,bg in (("light","#eee8db"),("dark","#25272b")):
                board=Image.new("RGB",(COLS*w,(end-start)*(h+19)),bg)
                draw=ImageDraw.Draw(board)
                ink="#eee8db" if theme=="dark" else "#222222"
                for row in range(start,end):
                    for col,cell in enumerate(slices[row]):
                        x=col*w;y=(row-start)*(h+19)
                        board.paste(cell,(x,y),cell)
                        draw.text((x+2,y+h+2),f"{row}:{col}",fill=ink)
                board.save(output/f"{variant}-rows{start:02d}-{end-1:02d}-{theme}.png")
        variants[variant]={"atlasSha256":sha(path),"imageSize":atlas.size,
                           "decodedBytes":atlas.width*atlas.height*4,
                           "selected":len(selected),"blank":COLS*ROWS-len(selected),
                           "minimumMargin":min(item["minimumMargin"] for item in entries if item["selected"]),
                           "frames":entries}
    result={"status":"exact encoded native and every selected alpha/lip cell audited; visual boards require inspection",
            "id":ID,"personFigureWorldHeight":person["figureWorldHeight"],
            "strideDistanceGameUnits":person["strideDistance"],
            "sourceMouthSha256":sha(root/"mouths-v1.json"),
            "deliverySha256":sha(root/"delivery/motion-delivery.json"),"variants":variants}
    (output/"native-audit.json").write_text(json.dumps(result,indent=2)+"\n",encoding="utf8")
    return result


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,default=ROOT/"output/street-redesign/heike-end-to-end/native-all-cells")
    result=audit(parser.parse_args().output)
    print(json.dumps({name:{k:entry[k] for k in ("selected","blank","minimumMargin")}
                      for name,entry in result["variants"].items()},indent=2))
