"""Selected source family: original front/rear fields, reviewed separate profiles.

The old pilot remains an immutable historical input for its unchanged down/up
fields. Its failed x-blend profile function is never used by this wrapper.
"""
from pathlib import Path
import importlib.util
from PIL import Image
HERE=Path(__file__).resolve().parent
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
legacy=load('dietmar_original_front_rear_only',HERE/'pilot-motion.py')
profiles=load('dietmar_reviewed_separate_profiles',HERE/'profile-motion-v2.py')
LANDMARKS=legacy.LANDMARKS
paint=legacy.paint
def neutral_path(heading):
 return HERE/'profile-leg-repair-v2'/f'{heading}-planted.png' if heading in ('right','left') else HERE/'registered'/f'{heading}.png'
def neutral(heading):return Image.open(neutral_path(heading)).convert('RGBA')
def render(heading,phase,strength=1):
 if heading in ('right','left'):return profiles.render(heading,phase,strength)
 return legacy.render(heading,phase,strength)
