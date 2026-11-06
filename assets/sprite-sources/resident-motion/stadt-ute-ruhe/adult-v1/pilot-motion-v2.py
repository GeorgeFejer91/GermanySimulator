"""Ute own source fields: approved separate profile legs and own cardinal rig."""
from pathlib import Path
import importlib.util
from PIL import Image
HERE=Path(__file__).resolve().parent
def load(name,file):
 spec=importlib.util.spec_from_file_location(name,HERE/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
cardinal=load('ute_own_cardinals_v1','pilot-motion.py')
profiles=load('ute_own_separate_profiles_v2','profile-motion-v2.py')
LANDMARKS=cardinal.LANDMARKS
def neutral(heading):
 return profiles.sources(heading)['neutral'].copy() if heading in ('right','left') else Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
def render(heading,phase,strength=1):
 return profiles.render(heading,phase,strength) if heading in ('right','left') else cardinal.render(heading,phase,strength)
