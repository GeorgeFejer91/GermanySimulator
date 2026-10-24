"""Brigitte's own five manually fitted source creases and endpoint previews.

No source artwork is altered. The existing connected-mouth CPU reference is
reused for inspection only; integration/phase transport is a later gate.
"""
from pathlib import Path
import hashlib, importlib.util, json
import numpy as np
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/bueroklammer-end-to-end/adult-mouth-fit-v4'
HEADINGS=('down','front-right','right','rear-right','up','rear-left','left','front-left')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
def native(center,axes,profile,size):
    return {'rect':[float(center[0]/size[0]),float(1-center[1]/size[1]),float(np.linalg.norm(axes[:2])/size[0]),float(np.linalg.norm(axes[2:])/size[1])],'axes':[float(value) for value in axes],'profile':profile}
def main():
    OUT.mkdir(parents=True,exist_ok=True);fits=json.loads((HERE/'lip-fits.json').read_text())
    assert fits['identity']=='crowd-brigitte-bueroklammer' and set(fits['views'])==set(HEADINGS)
    mouth=load('bueroklammer_own_connected_lips',ROOT/'tools/build-street-mouths.py')
    street=load('bueroklammer_existing_native_export',ROOT/'tools/build-street-character-sprites.py')
    report={'identity':fits['identity'],'status':'SOURCE FIT; actual endpoint board review pending, no family/runtime approval','registrations':{},'checks':{},'pins':{},'endpointFailures':[]}
    for path in (Path(__file__),HERE/'lip-fits.json',ROOT/'tools/build-street-mouths.py',ROOT/'tools/build-street-character-sprites.py'):
        report['pins'][path.relative_to(ROOT).as_posix()]=sha(path)
    for heading in HEADINGS:
        own=fits['views'][heading]
        if own is None:report['registrations'][heading]=None;continue
        source=HERE/'registered'/f'{heading}.png';report['pins'][source.relative_to(ROOT).as_posix()]=sha(source)
        image=Image.open(source).convert('RGBA');center=np.array(own['centerPx']);axes=np.array(own['axesPx']);crease=own['crease']
        profile={'corners':[-.5,.5],'crease':crease,'source_upper':crease,'source_lower':crease,'open_upper':crease,'open_lower':own['openLower'],'width':fits['width'],'teeth':fits['teeth']}
        mouth.validate(profile);reg=native(center,axes,profile,[512,512]);report['registrations'][heading]=reg
        entry={'input':{'file':source.relative_to(ROOT).as_posix(),'sha256':sha(source),'dimensions':[512,512]},'centerPx':center.tolist(),'axesPx':axes.tolist()}
        closed=mouth.preview(entry,reg,0);opened=mouth.preview(entry,reg,1)
        assert closed.tobytes()==image.tobytes(),heading+' closure changed actual source'
        assert opened.getchannel('A').tobytes()==image.getchannel('A').tobytes(),heading+' changed alpha'
        points=np.array([center+axes[:2]*x+axes[2:]*y for x,y in zip(np.linspace(-.5,.5,5),crease)])
        endpoints=[]
        for point in (points[0],points[-1]):
            x,y=np.rint(point).astype(int);rgba=image.getpixel((x,y))
            if rgba[3]<230:report['endpointFailures'].append({'heading':heading,'pointPx':point.tolist(),'nearestPixel':[int(x),int(y)],'rgba':list(rgba),'reason':'Endpoint outside substantive face paint'})
            endpoints.append({'pointPx':point.tolist(),'nearestPixel':[int(x),int(y)],'rgba':list(rgba)})
        annotated=image.copy();draw=ImageDraw.Draw(annotated);draw.line([tuple(p) for p in points],fill='#00ffff',width=1)
        for point in (points[0],points[-1]):draw.ellipse((point[0]-1,point[1]-1,point[0]+1,point[1]+1),outline='#ffff00',width=1)
        box=(int(center[0]-25),int(center[1]-18),int(center[0]+26),int(center[1]+25))
        for theme,bg,ink in [('light','#eee8db','#111'),('dark','#25272b','#eee')]:
            board=Image.new('RGB',(1224,374),bg);bd=ImageDraw.Draw(board)
            for index,(label,picture) in enumerate([('actual closed',image),('own crease/endpoints',annotated),('max open reference',opened)]):
                crop=picture.crop(box);flat=Image.alpha_composite(Image.new('RGBA',crop.size,bg),crop).convert('RGB');zoom=flat.resize((408,344),Image.Resampling.NEAREST)
                board.paste(zoom,(408*index,30));bd.text((408*index+5,5),heading+' '+label,fill=ink);crop.close();flat.close();zoom.close()
            board.save(OUT/f'{heading}-{theme}.png');board.close()
        report['checks'][heading]={'closedExact':True,'openAlphaExact':True,'endpoints':endpoints,'changedRgbPixels':int(np.count_nonzero(np.any(np.array(opened)[:,:,:3]!=np.array(image)[:,:,:3],axis=2)))}
        image.close();closed.close();opened.close();annotated.close()
    with Image.open(HERE/'registered/down.png') as source:front=source.convert('RGBA')
    standing=street.export_cell(front,{'cell':[128,160],'pivot':[64,150],'figureHeight':136,'working':{'figureHeight':400,'baseline':472}});standing.save(OUT/'standing-fit-preview.png');standing.close();front.close()
    own=fits['views']['down'];scale=136/400;center=np.array([64,150])+(np.array(own['centerPx'])-[256,472])*scale
    report['registrations']['standing']=native(center,np.array(own['axesPx'])*scale,report['registrations']['down']['profile'],[128,160])
    report['limits']=['Five source fit previews only; phase/native-mouth/final shader proof pending.','Rear three null because painted mouths are naturally absent.','Exact closure and alpha are mechanical checks; anatomical lip attachment requires actual board inspection.']
    if report['endpointFailures']:report['status']='FAIL substantive endpoint; all five actual per-view diagnostics preserved'
    (OUT/'fit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report['checks']))
    assert not report['endpointFailures'],report['endpointFailures']
if __name__=='__main__':main()
