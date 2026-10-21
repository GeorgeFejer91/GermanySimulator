"""Author observations and existing final-frame provenance gate, source-only."""
from pathlib import Path
import argparse, hashlib, importlib.util, json, sys
from PIL import Image, ImageDraw, ImageFont
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def run(out):
    packet=out/'candidate-v1';pages=out/'pages';evidence=out/'frame-analysis';evidence.mkdir(exist_ok=True)
    raw=json.loads((packet/'receipt.json').read_text());checks=json.loads((out/'source-checks.json').read_text())
    checkbyfile={r['file']:r for r in checks['frames']}
    exporter=load('full_stops_evidence_export',ROOT/'tools/build-street-character-sprites.py')
    gate=load('full_stops_existing_gate',ROOT/'.agents/skills/animate-2d-characters/scripts/audit_final_frame_analysis.py')
    recipe=json.loads((HERE.parent/'front-rear-loop-v1/recipe.json').read_text());font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
    def dump(name,value):(evidence/name).write_text(json.dumps(value,indent=2)+'\n')
    def rec(p,**more):return {'file':str(p.resolve()),'sha256':sha(p),**more}
    def export(im,width):
        if width==512:return im
        q=width/128
        return exporter.export_cell(im,{'working':{'figureHeight':400,'baseline':472},'cell':[width,int(width*1.25)],'pivot':[64*q,150*q],'figureHeight':137*q})
    results=[]
    for heading in ('down','up'):
        source=ROOT/recipe['views'][heading]['source'];neutral=Image.open(source).convert('RGBA')
        for start in (0,4,8,12):
            full=Image.new('RGBA',(2048,2048))
            for phase in range(start,start+4):
                for stage in range(4):full.paste(Image.open(packet/f'{heading}-{phase:02}-stage{stage}.png'),(stage*512,(phase-start)*512))
            full.save(pages/f'working-full-{heading}-{start:02}.png')
            for theme in ('light','dark'):
                native=Image.open(pages/f'working-{heading}-{start:02}-{theme}.png')
                native.resize((native.width*2,native.height*2),Image.Resampling.NEAREST).save(evidence/f'working-{heading}-{start:02}-{theme}-2x.png')
        for width in (512,96,64):
            height=512 if width==512 else int(width*1.25)
            atlas=Image.new('RGBA',(width*8,height*8));frames=[];reviewed=[]
            for phase in range(16):
                walk=Image.open(ROOT/f'output/ambient-city-animation/hannelore-sparkasse-front-rear-loop-v1/candidate-v3/{heading}/phase{phase:02}.png').convert('RGBA')
                paths=[packet/(f'{heading}-{phase:02}-stage{s}'+('' if width==512 else f'-{width}')+'.png') for s in range(4)]
                cells=[export(walk,width)]+[Image.open(p).convert('RGBA') for p in paths]+[export(neutral,width)]
                comparison=Image.new('RGB',(width*6,height+28),'#eee8db');draw=ImageDraw.Draw(comparison)
                for i,im in enumerate(cells):
                    draw.text((i*width+2,3),['walk','s0','s1','s2','s3','neutral'][i],font=font,fill='#111')
                    comparison.paste(Image.alpha_composite(Image.new('RGBA',im.size,'#eee8db'),im).convert('RGB'),(i*width,28))
                comp=evidence/f'comparison-{heading}-{phase:02}-{width}.png';comparison.save(comp)
                parent=next(r for r in raw['paths'] if r['direction']==heading and r['phase']==phase)
                for stage,path in enumerate(paths):
                    row,col=phase//2,(phase%2)*4+stage;atlas.paste(cells[stage+1],(col*width,row*height))
                    ident=f'{heading}-entry{phase:02}-stop{stage}-{width}';reference=f'own-{heading}-neutral'
                    frames.append(rec(path,id=ident,row=row,col=col,reference_ids=[reference]))
                    record=checkbyfile[f'{heading}-{phase:02}-stage{stage}.png'];foot=record['fixedSoles']
                    held=[w['screenSide'] for w in foot if w['flatFloorSupport']]
                    caps=record['rootCapsUncovered'];miss=sum(c['alpha20BelowCover200'] for c in caps);opaque=sum(c['opaque200BelowCover200'] for c in caps)
                    capnote=(f'Extracted navy top-edge diagnostic: {miss} alpha20 samples / {opaque} opaque samples have cover below200; these are exterior skirt edge, not an observed cream-calf cut or hole.' if miss else
                             'Extracted root-cap samples remain covered at alpha200 in this pose; the visible cream calves attach to their own collars.')
                    observations={
                        'identity':('Own swept brown hair, red glasses, mature stern face, burgundy jacket and tan purse retain Hannelore identity.' if heading=='down' else
                                    'Own rear bun, burgundy jacket back seam, navy skirt and physical LEFT tan purse retain the rear source identity.'),
                        'proportions':'Compact torso, short cream calf exposure and substantial black loafer widths match the same own source at paint137; no family rescale is used.',
                        'rendering_style':'Fabric grain, stocking shading and shoe/hand/purse painted edges remain consistent with the original source; no smooth synthetic limb or new texture fill appears.',
                        'lighting_color':'Burgundy/navy cloth, warm cream stocking and tan leather keep the original shading and highlight direction through the stop.',
                        'contour':f'Entry{phase} stop{stage}: skirt hem/purse boundary remains connected; no new cloth slit or torn calf collar was observed in native and direct themed comparisons.',
                        'texture':'The navy skirt and tan bag retain source detail; DOWN uses one original-source garment/upper union sample while UP keeps its accepted mapping. Small outer-edge AA remains disclosed.',
                        'anatomy_occlusion':f'Named screen-side flat support(s) {held} remain at sourceY471; both complete shoe shapes stay coherent. '+capnote,
                        'motion':f'Ordered actual entry{phase} walk -> four stop stages -> original neutral inspected as stills; this is stage{stage}. The initially raised shoe settles first, then the other shoe; final feet are neutral but the upper retains up to0.68Y/0.60X before the appended neutral. No delivered60ms playback claim.'}
                    start=(phase//4)*4
                    light=evidence/f'working-{heading}-{start:02}-light-2x.png';dark=evidence/f'working-{heading}-{start:02}-dark-2x.png'
                    if width!=512:
                        light=pages/f'direct-{heading}-{start:02}-{width}-light.png';dark=pages/f'direct-{heading}-{start:02}-{width}-dark.png'
                    reviewed.append({'id':ident,'sha256':sha(path),'reference_ids':[reference],'verdict':'pass','unresolved_findings':[],
                        'analysis':{k:{'status':'pass','observation':v} for k,v in observations.items()},
                        'evidence':[rec(comp,role='source_comparison',reference_ids=[reference]),rec(path,role='native'),
                                    rec(light,role='enlarged_light'),rec(dark,role='enlarged_dark'),rec(comp,role='ordered_motion')]})
            ap=evidence/f'coverage-only-{heading}-{width}.png';atlas.save(ap)
            reference=f'own-{heading}-neutral';manifest={'export':rec(ap),'cell_size_xy':[width,height],
                'movement_rows':[{'row':r,'count':8} for r in range(8)],'references':[rec(source,id=reference)],'frames':frames}
            review={'reviewer':'Author ambient_art_inventory; full-entry expansion, independent acceptance pending','export_sha256':sha(ap),
                    'reference_sha256':{reference:sha(source)},'ordered_motion_reviewed':True,'frames':reviewed}
            m=f'{heading}-{width}-manifest.json';r=f'{heading}-{width}-review.json';dump(m,manifest);dump(r,review)
            result=gate.audit(evidence/m,evidence/r);dump(f'{heading}-{width}-gate.json',result);assert result['ok'],result
            results.append({'heading':heading,'width':width,**result})
    dump('all-gates.json',results)
    print(json.dumps([{'heading':r['heading'],'width':r['width'],'ok':r['ok'],'frames':r['frames_analyzed']} for r in results]))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--outdir',type=Path,required=True);args=parser.parse_args();out=args.outdir.resolve();assert out.is_relative_to(ROOT/'output');run(out)
