"""Portable LEFT original cuff correction; accepted RIGHT source remains literal."""
from pathlib import Path
import importlib.util,json
import numpy as np
from PIL import Image,ImageDraw

def construct(base,heading):
 base=Path(base);sp=importlib.util.spec_from_file_location('dietmar_accepted_right_and_original_left',base/'profile-source-v4.py');recipe=importlib.util.module_from_spec(sp);sp.loader.exec_module(recipe);s=recipe.construct(base,heading)
 if heading!='left':return s
 p=json.loads((base/'left-foreground-cuff-trace-v1.json').read_text());mask=Image.new('1',(512,512));ImageDraw.Draw(mask).polygon([tuple(q) for q in p['polygonIntegerCentreXY']],fill=1);original_near=s['near'];old=s['oldfar'].copy();take=np.asarray(mask,dtype=bool)&np.any(old!=0,axis=2);near=original_near.copy();near[take]=old[take];old[take]=0
 assert int(take.sum())==37 and np.array_equal(s['fixed'].astype(np.uint16)+near.astype(np.uint16)+old.astype(np.uint16),s['original']) and np.array_equal(near[original_near[:,:,3]>0],original_near[original_near[:,:,3]>0])
 s['near']=near;s['oldfar']=old;s['priorOpposingToeOccluder']=old[:,:,3]>0;s['returnedOwnCuffMask']=take;s['neutral']=np.asarray(Image.alpha_composite(Image.alpha_composite(Image.fromarray(s['far']),Image.fromarray(near)),Image.fromarray(s['fixed']))).copy()
 return s
