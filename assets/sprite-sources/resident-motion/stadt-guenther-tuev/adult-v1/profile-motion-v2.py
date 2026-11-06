"""G-own separate intact profile legs; existing connected paint transport only."""
from pathlib import Path
import math,sys
sys.dont_write_bytecode=True
from functools import lru_cache
import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
PARTS=HERE/'profile-leg-repair-v2';YY,XX=np.mgrid[:512,:512]
# Own rolled cuffs start411/415; complete boot upper starts~425. The
# translation plateau begins407, above both complete cuffs and whole shoes.
NODES=[0,290,314,350,380,407,511]
def planted_curve(p):
 p=p%1
 if .25<=p<=.75:return 2-4*p
 swing=((p-.75)%1)*2
 return -1-2*swing+12*swing*swing-8*swing*swing*swing
@lru_cache(None)
def sources(heading):
 assert heading in('right','left')
 return{'original':Image.open(HERE/'registered'/(heading+'.png')).convert('RGBA'),'near':Image.open(PARTS/(heading+'-near-leg.png')).convert('RGBA'),'far':Image.open(PARTS/(heading+'-far-leg.png')).convert('RGBA'),'foreground':np.asarray(Image.open(PARTS/(heading+'-foreground-mask.png')).convert('L'))>0,'neutral':Image.open(PARTS/(heading+'-planted.png')).convert('RGBA')}
def field(heading,phase,strength=1,foot='near'):
 assert 0<=strength<=1 and foot in('near','far')
 angle=phase+(math.pi if foot=='far'else 0);dx=(1 if heading=='right'else -1)*11.5*planted_curve(angle/math.tau)*strength;dy=-4.5*max(0,math.cos(angle))*strength
 xs=[0,0,0,.15*dx,.55*dx,dx,dx];ys=[0,0,0,.20*dy,.55*dy,dy,dy];jac=1+PchipInterpolator(NODES,ys).derivative()(np.arange(512));assert jac.min()>.5
 return{'nodes_y':NODES,'dx':xs,'dy':ys,'footDxDy':[dx,dy],'minimumVerticalJacobian':float(jac.min()),'wholeShoeTranslationFromY':407}
def transport(layer,heading,phase,strength=1,foot='near'):
 c=field(heading,phase,strength,foot);return(layer.copy()if strength==0 else paint.warp_layer(layer,c['nodes_y'],c['dx'],c['dy'])),c
def render(heading,phase,strength=1,return_layers=False):
 s=sources(heading);layers={name:transport(s[name],heading,phase,strength,name)[0]for name in('far','near')};a=np.asarray(Image.alpha_composite(layers['far'],layers['near'])).copy();a[s['foreground']]=np.asarray(s['original'])[s['foreground']];result=Image.fromarray(a)
 assert np.array_equal(np.asarray(result)[s['foreground']],np.asarray(s['original'])[s['foreground']])
 if strength==0:assert np.array_equal(np.asarray(result),np.asarray(s['neutral']))
 record={'phase':phase,'strength':strength,'fixedForegroundLimb':'near','sourceLayersStaySeparate':True,'upperBodyAndOwnedGaugeHoseRgbaExact':True,'limb_displacement':{name:field(heading,phase,strength,name)for name in('near','far')}}
 return(result,record,layers)if return_layers else(result,record)
