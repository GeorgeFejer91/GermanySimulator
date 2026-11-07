"""Original foreground paint with genuine source-edited hidden Near instep."""
from pathlib import Path
import importlib.util,json
import numpy as np
from PIL import Image

def construct(base,heading):
 base=Path(base);sp=importlib.util.spec_from_file_location('dietmar_original_profile_for_edited_near',base/'profile-source-v2.py');recipe=importlib.util.module_from_spec(sp);sp.loader.exec_module(recipe);s=recipe.construct(base,heading)
 if heading!='right':return s
 c=json.loads((base/'near-instep-edit-v1/fullpart-transform-v1.json').read_text());q=c['directions']['right'];raw=Image.open(base/c['raw']).convert('RGBA');x,y,w,h=q['rawSemanticCellXYWH'];whole=np.asarray(raw.crop((x,y,x+w,y+h)).convert('RGBa').transform((512,512),Image.Transform.AFFINE,q['affineOutputToSource'],Image.Resampling.BICUBIC).convert('RGBA')).copy();old=s['near'];add=(old[:,:,3]==0)&(s['oldfar'][:,:,3]>0)&(whole[:,:,3]>0);near=old.copy();near[add]=whole[add]
 assert int(add.sum())==82 and np.array_equal(near[old[:,:,3]>0],old[old[:,:,3]>0])
 s['near']=near;s['neutral']=np.asarray(Image.alpha_composite(Image.alpha_composite(Image.fromarray(s['far']),Image.fromarray(near)),Image.fromarray(s['fixed']))).copy();s['genuineNearWholeFit']=whole;s['hiddenNearAddedMask']=add
 s['sourceQualification']={'genuineHiddenNearAddedPixels':int(add.sum()),'allOriginalPositiveNearPaintLiteral':True,'outsideOriginalMasterPositiveAdded':int((add&(s['original'][:,:,3]==0)).sum()),'actualFinalNeutralChangedOriginalPositivePixels':int((np.any(s['neutral']!=s['original'],axis=2)&(s['original'][:,:,3]>0)).sum()),'maximumFinalNeutralOriginalChannelDelta':np.abs(s['neutral'].astype(np.int16)-s['original'].astype(np.int16)).max(axis=(0,1)).tolist(),'historicalControlV2Counts':'Historical neutral-v1 values; these metrics are recomputed for the current source. The earlier69pixel patch is a separate held moving branch, not the source of this paint.'}
 return s
