"""Private actual-source free-right-hand gesture sample."""
from pathlib import Path
import importlib.util
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/hannelore-end-to-end/gesture-pilot'
spec=importlib.util.spec_from_file_location('hannelore_street_helper',ROOT/'tools/build-street-character-sprites.py')
street=importlib.util.module_from_spec(spec);spec.loader.exec_module(street)
source=Image.open(HERE/'registered/down.png').convert('RGBA')
action={'neck_y':168,'hip_y':274,'sway_pixels':2,'nod_pixels':7}
OUT.mkdir(parents=True,exist_ok=True)
frames=street.planted_action(source,'greet',16,action)
board=Image.new('RGB',(4*512,512),'#eee8db')
for column,index in enumerate([0,4,8,15]):
 frame=frames[index]
 frame.save(OUT/f'phase-{index:02}.png')
 flat=Image.alpha_composite(Image.new('RGBA',frame.size,'#eee8db'),frame)
 board.paste(flat.convert('RGB'),(column*512,0))
 ImageDraw.Draw(board).text((column*512+7,8),f'gesture {index}',fill='#111')
 a=np.asarray(frame.getchannel('A'))>=21
 groups,_=label(a)
 print(index,[int(v) for v in np.bincount(groups.ravel())[1:] if v>=15])
board.save(OUT/'light.png')
