"""Bounded own-source registration and visual-fit board, no full-family bake."""
import ctypes, hashlib, json, os, runpy, time
from pathlib import Path
ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(),0x4000)
assert os.environ['OMP_NUM_THREADS']==os.environ['OPENBLAS_NUM_THREADS']=='1'
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
OUT=ROOT/'output/street-redesign/manfred-din-end-to-end/registration-pilot'
OUT.mkdir(parents=True,exist_ok=False)
from PIL import Image,ImageDraw
started=time.time()
runpy.run_path(str(HERE/'prepare-neutrals.py'),run_name='__main__')
registration=json.loads((HERE/'registration.json').read_text())
for heading,view in registration['views'].items():
    im=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
    for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
        flat=Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
        flat.save(OUT/f'{heading}-{theme}.png')
        flat.crop((180,70,330,180)).resize((600,440)).save(OUT/f'{heading}-face-{theme}.png')
    alpha=im.getchannel('A')
    assert alpha.getbbox() is not None
receipt={'pid':os.getpid(),'priorityClass':ctypes.windll.kernel32.GetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess()),'threads':{'OMP_NUM_THREADS':os.environ['OMP_NUM_THREADS'],'OPENBLAS_NUM_THREADS':os.environ['OPENBLAS_NUM_THREADS']},'elapsedSeconds':time.time()-started,'status':'REGISTRATION PILOT ONLY; actual pixel review pending','registrationSha256':hashlib.sha256((HERE/'registration.json').read_bytes()).hexdigest()}
(OUT/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt))
