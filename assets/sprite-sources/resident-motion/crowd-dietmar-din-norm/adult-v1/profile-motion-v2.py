"""Dietmar-only separate complete profile legs. Prepared, not yet admitted/run.

Original near trouser/cuff/workshoe and approved new far trouser/cuff/workshoe
remain separate through existing painted_walk.warp_layer. Actual own prop
order differs between profiles; no case/hand ownership is copied from another
actor. Must pass root registration +16phase/native/independent preflight first.
"""
from pathlib import Path
import importlib.util,json,math
from functools import lru_cache
import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator
HERE=Path(__file__).resolve().parent;PARTS=HERE/'profile-leg-repair-v2'
spec=importlib.util.spec_from_file_location('dietmar_own_layer_registration',HERE/'prepare-profile-layers-v2.py')
prep=importlib.util.module_from_spec(spec);spec.loader.exec_module(prep)
paint=prep.paint;YY,XX=prep.YY,prep.XX
def planted_curve(p):
 p=p%1
 if .25<=p<=.75:return 2-4*p
 q=((p-.75)%1)*2
 return -1-2*q+12*q*q-8*q*q*q
@lru_cache(None)
def sources(heading):
 assert heading in ('right','left')
 c=json.loads((PARTS/'controls-proposed-v1.json').read_text())
 original=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
 assert prep.sha(HERE/'registered'/f'{heading}.png')==c['sourceAuthority'][heading]
 return {'controls':c,'original':original,
  'near':Image.open(PARTS/f'{heading}-near-leg.png').convert('RGBA'),
  'far':Image.open(PARTS/f'{heading}-far-leg.png').convert('RGBA'),
  'upper':np.asarray(Image.open(PARTS/f'{heading}-upper-mask.png').convert('L'))>0,
  'farCase':np.asarray(Image.open(PARTS/f'{heading}-far-case-mask.png').convert('L'))>0,
  'nearCase':np.asarray(Image.open(PARTS/f'{heading}-near-case-mask.png').convert('L'))>0,
  'neutral':Image.open(PARTS/f'{heading}-planted.png').convert('RGBA')}
def field(heading,phase,strength=1,foot='near'):
 assert heading in ('right','left') and foot in ('near','far') and 0<=strength<=1
 c=sources(heading)['controls'];plateau=c['wholeShoeCuffPlateauY']
 angle=phase+(math.pi if foot=='far' else 0)
 dx=(1 if heading=='right' else -1)*10*planted_curve(angle/math.tau)*strength
 dy=-4*max(0,math.cos(angle))*strength
 if heading=='left' and foot=='near':
  # Real near root is hidden by its LEFT briefcase through380; keep it
  # stationary through384 before bending the visible calf below the case.
  nodes=[0,270,c['hipRootY'],384,400,plateau,511]
  xs=[0,0,0,0,.45*dx,dx,dx];ys=[0,0,0,0,.45*dy,dy,dy]
 else:
  nodes=[0,270,c['hipRootY'],330,380,plateau,511]
  xs=[0,0,0,.25*dx,.65*dx,dx,dx];ys=[0,0,0,.25*dy,.65*dy,dy,dy]
 assert all(b>a for a,b in zip(nodes,nodes[1:])), 'Actual root/calf/cuff nodes must be ordered'
 vertical=PchipInterpolator(nodes,ys);jacobian=1+vertical.derivative()(np.arange(512))
 assert jacobian.min()>.5,'Unchanged existing leg positive-field gate'
 return {'nodes_y':nodes,'dx':xs,'dy':ys,'footDxDy':[dx,dy],
  'minimumVerticalJacobian':float(jacobian.min()),'wholeShoeCuffTranslationFromY':plateau}
def transport(layer,heading,phase,strength=1,foot='near'):
 f=field(heading,phase,strength,foot)
 return (layer.copy() if strength==0 else paint.warp_layer(layer,f['nodes_y'],f['dx'],f['dy'])),f
def render(heading,phase,strength=1,return_layers=False):
 s=sources(heading)
 if strength==0:
  image=s['neutral'].copy();layers={name:s[name].copy() for name in ('near','far')}
 else:
  layers={name:transport(s[name],heading,phase,strength,name)[0] for name in ('far','near')}
  image=prep.compose(s['original'],layers['far'],layers['near'],s['upper'],s['farCase'],s['nearCase'])
 protected=s['upper']|s['nearCase']
 assert np.array_equal(np.asarray(image)[protected],np.asarray(s['original'])[protected])
 record={'phase':phase,'strength':strength,'profile':heading,'nearFarOrderFixed':True,
  'limb_displacement':{name:field(heading,phase,strength,name) for name in ('near','far')},
  'drawOrder':s['controls']['profiles'][heading]['drawOrder'],
  'sourceLayersNeverFlattenedAndResplit':True,'originalUpperAndNearLeftCaseRgbaExact':True,
  'farRightProfileLeftCaseQualification':'Original far case stays behind near leg; legitimately occluded case paint is not asserted body-visible/exact',
  'admission':'UNVERIFIED_SOURCE_PROTOTYPE_RECIPE; not a game/runtime capability'}
 return (image,record,layers) if return_layers else (image,record)
