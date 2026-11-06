"""Ute's complete original NEAR and additional FAR legs stay separate.

Uses the existing painted_walk transport with Ute's own measured hem, calf,
whole-loafer plateau and fixed near foreground. No runtime selection here.
"""
from pathlib import Path
from functools import lru_cache
import json, math, sys
import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
CONTROL=json.loads((HERE/'profile-leg-controls-v2.json').read_text())
PARTS=HERE/'profile-leg-repair-v2'
YY,XX=np.mgrid[:512,:512]

def planted_curve(p):
 p=p%1
 if .25<=p<=.75:return 2-4*p
 swing=((p-.75)%1)*2
 return -1-2*swing+12*swing*swing-8*swing*swing*swing

@lru_cache(None)
def sources(heading):
 assert heading in ('right','left')
 return {'original':Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA'),
  'near':Image.open(PARTS/f'{heading}-near-leg.png').convert('RGBA'),
  'far':Image.open(PARTS/f'{heading}-far-leg.png').convert('RGBA'),
  'foreground':np.asarray(Image.open(PARTS/f'{heading}-foreground-mask.png').convert('L'))>0,
  'hem':Image.open(PARTS/f'{heading}-hem-overlap.png').convert('RGBA'),
  'neutral':Image.open(PARTS/f'{heading}-planted.png').convert('RGBA')}

def field(heading,phase,strength=1,foot='near'):
 assert 0<=strength<=1 and foot in ('near','far')
 angle=phase+(math.pi if foot=='far' else 0)
 dx=(1 if heading=='right' else -1)*CONTROL['stepAmplitude']*planted_curve(angle/math.tau)*strength
 dy=-CONTROL['liftAmplitude']*max(0,math.cos(angle))*strength
 nodes=CONTROL['nodesY'];xs=[0,0,0,.45*dx,dx,dx];ys=[0,0,0,.45*dy,dy,dy]
 vertical=PchipInterpolator(nodes,ys)
 jac=1+vertical.derivative()(np.arange(512));assert jac.min()>.5,'Existing positive-field gate'
 return {'nodes_y':nodes,'dx':xs,'dy':ys,'footDxDy':[dx,dy],
  'minimumVerticalJacobian':float(jac.min()),'wholeShoeTranslationFromY':CONTROL['wholeShoeTranslationFromY']}

def transport(layer,heading,phase,strength=1,foot='near'):
 c=field(heading,phase,strength,foot)
 return (layer.copy() if strength==0 else paint.warp_layer(layer,c['nodes_y'],c['dx'],c['dy'])),c

def render(heading,phase,strength=1,return_layers=False):
 s=sources(heading)
 layers={name:transport(s[name],heading,phase,strength,name)[0] for name in ('far','near')}
 if strength==0:result=s['neutral'].copy()
 else:
  result=Image.alpha_composite(Image.alpha_composite(layers['far'],layers['near']),s['hem'])
  a=np.asarray(result).copy();a[s['foreground']]=np.asarray(s['original'])[s['foreground']];result=Image.fromarray(a)
 assert np.array_equal(np.asarray(result)[s['foreground']],np.asarray(s['original'])[s['foreground']])
 record={'phase':phase,'strength':strength,'fixedForegroundLimb':'near',
  'limb_displacement':{name:field(heading,phase,strength,name) for name in ('near','far')},
  'sourceLayersStaySeparate':True,'faceLeftBookAndHandsAbove365RgbaExact':True}
 return (result,record,layers) if return_layers else (result,record)
