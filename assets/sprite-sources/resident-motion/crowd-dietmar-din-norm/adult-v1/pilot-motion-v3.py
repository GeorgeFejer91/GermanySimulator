"""Successor DOWN handle ownership only; previous pilot/family bytes stay held.

The real LEFT briefcase handle arch was split between upper and leg/garment
layers by the previous own rigid mask. Transfer its existing original paint
with the same connected hand/case upper layer. No paint is added or removed.
All other views/fields use the reviewed v2 authority unchanged.
"""
from pathlib import Path
import importlib.util
from PIL import ImageDraw
HERE=Path(__file__).resolve().parent
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
previous=load('dietmar_held_source_v2',HERE/'pilot-motion-v2.py')
legacy=previous.legacy
paint=previous.paint
LANDMARKS=previous.LANDMARKS
# Measured own LEFT cuff/grip/upper handle continuation in registered DOWN.
# Existing old polygon stops nearX329/Y303, omitting the outside arch.
# This mask selects existing RGBA paint for the upper layer; it paints nothing.
LEFT_HANDLE_CLOSURE=[(318,280),(339,280),(348,294),(355,300),(355,322),(328,322),(323,308)]
def hand_mask(heading):
 mask=legacy.hand_mask(heading)
 if heading=='down':ImageDraw.Draw(mask).polygon(LEFT_HANDLE_CLOSURE,fill=255)
 return mask
def neutral_path(heading):return previous.neutral_path(heading)
def neutral(heading):return previous.neutral(heading)
def render(heading,phase,strength=1):
 if heading!='down' or strength==0:return previous.render(heading,phase,strength)
 source=neutral('down');mask=hand_mask('down')
 try:
  images,records=paint.animate(source,LANDMARKS['down'],travel=legacy.TRAVEL['down'],count=16,
   foreground=1,strength=strength,phases=[phase],limb_pose=legacy.planted_floor,rigid_mask=mask)
  record=records[0]
  record['sourceAuthority']='Existing own registered DOWN; same original painted pixels, local LEFT grip/handle layer-ownership correction only'
  record['leftHandleMaskClosure']=LEFT_HANDLE_CLOSURE
  record['oldHeldModuleUnmodified']=True
  return images[0],record
 finally:source.close();mask.close()
