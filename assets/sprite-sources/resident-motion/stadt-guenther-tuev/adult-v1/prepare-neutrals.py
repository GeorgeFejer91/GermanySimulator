"""Register Guenther's eight genuinely painted views at one source scale."""
from pathlib import Path
import hashlib,importlib.util,json
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import label,find_objects,distance_transform_edt
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
RAW=HERE/'raw-directions-v2.png'
ORDER=('down','front-right','right','rear-right','up','rear-left','left','front-left')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 assert sha(RAW)=='2d372ae604b708dd213e4dd16d80f49e75d246d708ce25591d48484255c0d8c8'
 spec=importlib.util.spec_from_file_location('guenther_shared_registration',ROOT/'tools/build-street-character-sprites.py');street=importlib.util.module_from_spec(spec);spec.loader.exec_module(street)
 source=Image.open(RAW).convert('RGBA');rgba=np.array(source);groups,_=label(rgba[:,:,3]>=20)
 figures=[]
 for index,region in enumerate(find_objects(groups),1):
  if region is None:continue
  count=np.count_nonzero(groups[region]==index)
  if count>10000:figures.append((index,[region[1].start,region[0].start,region[1].stop,region[0].stop]))
 figures.sort(key=lambda item:(item[1][1]//(source.height//2),item[1][0]));assert len(figures)==8,figures
 scale=400/(figures[0][1][3]-figures[0][1][1]);out=HERE/'registered';out.mkdir(exist_ok=True)
 dist,nearest=distance_transform_edt(groups==0,return_indices=True)
 receipt={'identity':'stadt-guenther-tuev','raw':RAW.relative_to(ROOT).as_posix(),'rawSha256':sha(RAW),'oneScalePerRawSheet':scale,'working':{'cell':[512,512],'centerX':256,'baselineY':472},'views':{}}
 board=Image.new('RGB',(2048,1024),'#eee8db')
 for n,(heading,(index,bounds)) in enumerate(zip(ORDER,figures)):
  own=rgba.copy();owned=(groups==index)|((rgba[:,:,3]<20)&(dist<=2)&(groups[tuple(nearest)]==index));own[~owned]=0
  l,t,r,b=bounds;alpha=own[:,:,3];yy,xx=np.nonzero(alpha[max(t,b-50):b,l:r]>=20)
  assert len(xx)>100
  # Both complete work boots own the support centre; no per-view rescaling.
  pivot=[float((xx.min()+xx.max())/2+l),b]
  registered,origin=street.register_source(Image.fromarray(own),{'component_bounds':bounds,'source_pivot':pivot},scale,472)
  result=np.array(registered);result[result[:,:,3]<20]=0;registered=Image.fromarray(result)
  path=out/(heading+'.png');registered.save(path)
  receipt['views'][heading]={'source':RAW.relative_to(ROOT).as_posix(),'sourceBoundsAlpha20':bounds,'sourcePivot':pivot,'workingOrigin':origin.tolist(),'workingBoundsAlpha20':list(registered.getchannel('A').getbbox()),'registered':path.relative_to(ROOT).as_posix(),'registeredSha256':sha(path)}
  flat=Image.alpha_composite(Image.new('RGBA',(512,512),'#eee8db'),registered).convert('RGB');board.paste(flat,((n%4)*512,(n//4)*512));ImageDraw.Draw(board).text(((n%4)*512+8,(n//4)*512+8),heading,fill='#111')
 (HERE/'registration.json').write_text(json.dumps(receipt,indent=2)+'\n')
 work=ROOT/'output/street-redesign/guenther-end-to-end';work.mkdir(parents=True,exist_ok=True);board.save(work/'registered-adult-light.png')
 print(json.dumps({'views':8,'scale':scale,'bounds':{k:v['workingBoundsAlpha20'] for k,v in receipt['views'].items()}}))
if __name__=='__main__':main()
