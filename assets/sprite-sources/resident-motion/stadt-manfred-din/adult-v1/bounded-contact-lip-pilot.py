"""Own adult contact and source-lip preflight; no full family or game browser."""
import ctypes,ctypes.wintypes as wt,os,time,json,runpy,importlib.util,math,hashlib
from pathlib import Path
k=ctypes.WinDLL('kernel32',use_last_error=True)
k.GetCurrentProcess.restype=wt.HANDLE
k.SetPriorityClass.argtypes=[wt.HANDLE,wt.DWORD];k.SetPriorityClass.restype=wt.BOOL
k.GetPriorityClass.argtypes=[wt.HANDLE];k.GetPriorityClass.restype=wt.DWORD
handle=k.GetCurrentProcess();assert k.SetPriorityClass(handle,0x4000),ctypes.get_last_error()
assert k.GetPriorityClass(handle)==16384
assert os.environ['OMP_NUM_THREADS']==os.environ['OPENBLAS_NUM_THREADS']=='1'
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
OUT=ROOT/'output/street-redesign/manfred-din-end-to-end/contact-lip-pilot'
OUT.mkdir(parents=True,exist_ok=False)
from PIL import Image,ImageDraw
import numpy as np
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
pilot=load('manfred_pilot',HERE/'pilot-motion.py')
mouth=load('manfred_lip_methods',ROOT/'tools/build-street-mouths.py')
started=time.time();checks={};contacts={}
for heading in ['down','right','up','left']:
    contacts[heading]=[]
    for phase in (0,4,8,12):
        im,record=pilot.render(heading,phase*math.tau/16)
        im.save(OUT/f'{heading}-{phase:02}.png')
        contacts[heading].append(record)
        for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
            flat=Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB');flat.save(OUT/f'{heading}-{phase:02}-{theme}.png')
    a=np.array(Image.open(HERE/'registered'/f'{heading}.png'))
    if heading in ('right','left'):
        patch=a[463:470,245:270]
        coords=np.argwhere(patch[:,:,3]>=200)
        assert len(coords)>0
        py,px=coords[len(coords)//2];x,y=int(px+245),int(py+463)
        checks[heading]={'ownSolePoint':[x,y],'ownRGBA':a[y,x].tolist()}
for heading in ['down','front-right','right','left','front-left']:
    im=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
    face=Image.alpha_composite(Image.new('RGBA',im.size,'#eee8db'),im).convert('RGB').crop((220,100,290,145)).resize((700,450),Image.Resampling.NEAREST)
    draw=ImageDraw.Draw(face)
    for x in range(220,291,5):draw.line(((x-220)*10,0,(x-220)*10,450),fill='#888888');draw.text(((x-220)*10+1,1),str(x),fill='#ff0000')
    for y in range(100,146,5):draw.line((0,(y-100)*10,700,(y-100)*10),fill='#888888');draw.text((1,(y-100)*10+1),str(y),fill='#ff0000')
    face.save(OUT/f'{heading}-lip-grid.png')
receipt={'status':'CONTACT AND LIP PIXEL BOARD ONLY; exact contour fit pending real inspection','pid':os.getpid(),'priorityClass':k.GetPriorityClass(handle),'threads':{'OMP_NUM_THREADS':os.environ['OMP_NUM_THREADS'],'OPENBLAS_NUM_THREADS':os.environ['OPENBLAS_NUM_THREADS']},'elapsedSeconds':time.time()-started,'contacts':contacts,'sourceSoles':checks}
(OUT/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({key:receipt[key] for key in ['status','pid','priorityClass','threads','elapsedSeconds','sourceSoles']}))
