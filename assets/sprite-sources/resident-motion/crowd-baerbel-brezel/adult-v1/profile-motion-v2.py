"""Bärbel's two independently painted profile legs, never flattened/re-split.

The existing painted_walk.warp_layer transports each actual limb. One fixed
near/far order, exact original upper body and LEFT bag, independent half-cycle
stance, and a translation plateau ABOVE every shoe pixel avoid the old x-blend
inside one MaryJane. This module does not select production assets.
"""
from pathlib import Path
import importlib.util, json, math, sys
from functools import lru_cache
import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
PARTS=HERE/'profile-leg-repair-v2'
YY,XX=np.mgrid[:512,:512]
# Whole shoe including its upper/strap begins below435. Both field axes are
# constant from431 down, rather than varying across any heel/toe/upper paint.
NODES=[0,350,382,405,431,511]
# The near calf in LEFT profile is genuinely hidden by the LEFT paper bag
# until403. Keep that actual extracted root fixed through406 (three-pixel
# overlap), then bend its visible calf; moving the cutout at the bag boundary
# creates a false transparent slit. No missing near-root paint is fabricated.
LEFT_NEAR_NODES=[0,350,382,406,418,431,511]
def planted_curve(p):
 p=p%1
 if .25<=p<=.75:return 2-4*p
 swing=((p-.75)%1)*2
 return -1-2*swing+12*swing*swing-8*swing*swing*swing
@lru_cache(None)
def sources(heading):
 assert heading in ('right','left')
 return {
  'original':Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA'),
  'near':Image.open(PARTS/f'{heading}-near-leg.png').convert('RGBA'),
  'far':Image.open(PARTS/f'{heading}-far-leg.png').convert('RGBA'),
  'foreground':np.asarray(Image.open(PARTS/f'{heading}-foreground-mask.png').convert('L'))>0,
  'neutral':Image.open(PARTS/f'{heading}-planted.png').convert('RGBA'),
 }
def field(heading,phase,strength=1,foot='near'):
 assert 0<=strength<=1 and foot in ('near','far')
 angle=phase+(math.pi if foot=='far' else 0)
 p=angle/math.tau
 dx=(1 if heading=='right' else -1)*10*planted_curve(p)*strength
 dy=-4*max(0,math.cos(angle))*strength
 nodes=LEFT_NEAR_NODES if heading=='left' and foot=='near' else NODES
 xs=[0,0,0,0,.45*dx,dx,dx] if nodes==LEFT_NEAR_NODES else [0,0,0,.45*dx,dx,dx]
 ys=[0,0,0,0,.45*dy,dy,dy] if nodes==LEFT_NEAR_NODES else [0,0,0,.45*dy,dy,dy]
 vertical=PchipInterpolator(nodes,ys)
 jac=1+vertical.derivative()(np.arange(512))
 assert jac.min()>.5,'Existing painted-leg positive-field gate'
 return {'nodes_y':nodes,'dx':xs,'dy':ys,'footDxDy':[dx,dy],
         'minimumVerticalJacobian':float(jac.min()),'wholeShoeTranslationFromY':431}
def transport(layer,heading,phase,strength=1,foot='near'):
 c=field(heading,phase,strength,foot)
 if strength==0:return layer.copy(),c
 return paint.warp_layer(layer,c['nodes_y'],c['dx'],c['dy']),c
def render(heading,phase,strength=1,return_layers=False):
 s=sources(heading)
 if strength==0:
  result=s['neutral'].copy()
  layers={name:s[name].copy() for name in ('near','far')}
 else:
  layers={name:transport(s[name],heading,phase,strength,name)[0] for name in ('far','near')}
  result=Image.alpha_composite(layers['far'],layers['near'])
  a=np.asarray(result).copy(); original=np.asarray(s['original'])
  a[s['foreground']]=original[s['foreground']]
  result=Image.fromarray(a)
 assert np.array_equal(np.asarray(result)[s['foreground']],np.asarray(s['original'])[s['foreground']])
 records={'phase':phase,'strength':strength,'fixedForegroundLimb':'near',
  'limb_displacement':{name:field(heading,phase,strength,name) for name in ('near','far')},
  'sourceLayersStaySeparate':True,'upperBodyAndLeftBagRgbaExact':True}
 return (result,records,layers) if return_layers else (result,records)
