"""Own original resident quiet performances through the existing planted_action.

Legacy settings are read from build-resident-motion.py529-537. The source is
Klaus's own adult down painting; there is no equipment gesture or new rig.
"""
from pathlib import Path
import importlib.util,math,json,hashlib
import numpy as np
ROOT=Path(__file__).resolve().parents[5]
ACTIONS=('idle','look','success','failure')
ROWS={'idle':13,'look':18,'success':19,'failure':20}
LANDMARKS=json.loads((Path(__file__).resolve().parent/'quiet-landmarks.json').read_text())
assert hashlib.sha256((ROOT/LANDMARKS['source']).read_bytes()).hexdigest()==LANDMARKS['sha256']
def settings(action):
 assert action in ACTIONS
 # Original amplitudes; neck154/hip304 measured on own adult source.
 return {'neck_y':LANDMARKS['ownNeckY'],'hip_y':LANDMARKS['ownHipY'],
  'sway_pixels':1.2 if action=='idle' else 2 if action=='success' else 4,
  'nod_pixels':1 if action=='idle' else -3 if action=='success' else 4,
  'lift_pixels':10 if action=='success' else 0}
def sequence(source,action):
 spec=importlib.util.spec_from_file_location('klaus_existing_planted_actions',ROOT/'tools/build-street-character-sprites.py')
 street=importlib.util.module_from_spec(spec);spec.loader.exec_module(street)
 return street.planted_action(source,action,16,settings(action))
def field(action,index,y):
 if index==0 or (action!='idle' and index==15):return np.zeros_like(y,dtype=float),np.zeros_like(y,dtype=float)
 cfg=settings(action);phase=index/16 if action=='idle' else index/15
 wave=math.sin(math.tau*phase) if action=='idle' else math.sin(math.pi/2*min(1,phase/.32))**2*math.sin(math.pi/2*min(1,(1-phase)/.32))**2
 torso=np.clip((cfg['hip_y']-y)/(cfg['hip_y']-cfg['neck_y']),0,1);torso=torso*torso*(3-2*torso)
 head=np.clip((cfg['neck_y']-y)/32,0,1)
 dx=torso*wave*cfg['sway_pixels'];dy=head*wave*cfg['nod_pixels']
 if action=='success':
  flight=np.clip((phase-.18)/.62,0,1);dy=dy-cfg['lift_pixels']*math.sin(math.pi*flight)**2
  if phase<.18:dy+=torso*3*math.sin(math.pi*phase/.18)
 return dx,dy
def transport(action,index,center,axes):
 # Exact forward inverse of existing target-space pullback sx=x-dx(y),
 # sy=y-dy(y), including local Jacobian for the owned lip axes.
 center=np.array(center,dtype=float);axes=np.array(axes,dtype=float);target_y=float(center[1])
 for _ in range(24):target_y=float(center[1]+field(action,index,target_y)[1])
 dx,dy=field(action,index,target_y);eps=.001
 high=field(action,index,target_y+eps);low=field(action,index,target_y-eps)
 dxdy=float((high[0]-low[0])/(2*eps));dydy=float((high[1]-low[1])/(2*eps))
 scale=1/(1-dydy);jac=np.array([[1,dxdy*scale],[0,scale]])
 return np.array([center[0]+dx,target_y]),np.concatenate((jac@axes[:2],jac@axes[2:]))
