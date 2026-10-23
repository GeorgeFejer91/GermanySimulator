"""Source-bound resident motion candidates; missing turn/hidden-limb paint stays HOLD.

Reuses the project's painted_walk deformation. No pixels are synthesized and no
cardinal view is mirrored. --prepare writes inspectable source registrations;
--character bakes only the selected family. Authoring/QA remains out of runtime.
"""
from pathlib import Path
import argparse
import importlib.util
import io
import json
import math
import hashlib
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint
import assess_walk_speed

module_spec = importlib.util.spec_from_file_location('street_bake', ROOT / 'tools/build-street-character-sprites.py')
street = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(street)
SOURCE = ROOT / 'assets/sprite-sources/street-residents/source-provenance-review.json'
SPEC = ROOT / 'assets/sprite-sources/street-residents/motion-spec.json'
QA = ROOT / 'output/resident-motion'
DEST = ROOT / 'assets/characters/residents'
DIRECTIONS = ['down', 'right', 'up', 'left']
TRAVEL = [(0, 1), (1, 0), (0, -1), (-1, 0)]
CELL = (128, 160)
PIVOT = (64, 148)
HEIGHT = 400
BASELINE = 472
COUNT = 16

# Visually located lower-body bands in each family's own source figure. These
# are initial fitting inputs, not an anatomical approval. Long skirts retain
# their painted coverage. A hidden knee is a flex guide beneath cloth.
# waist, hip, garment-root overlap, knee, ankle, in thousandths of figure height.
BANDS = [
 (680,705,748,820,880), (700,745,820,865,905),
 (650,700,740,820,880), (670,710,755,820,900),
 (655,705,750,815,885), (690,735,820,865,915),
 (650,700,765,810,850), (655,705,755,830,905),
 (650,695,740,820,895), (660,700,745,825,900),
 (690,745,830,875,920), (670,705,750,820,900),
 (670,725,815,865,915), (650,700,745,820,895),
 (715,765,850,885,930), (650,695,740,825,900),
 (675,725,815,865,915), (650,700,750,825,900),
 (650,700,755,810,850), (680,735,800,855,920),
 (650,695,745,825,905), (650,700,745,825,900),
 (675,720,765,835,900), (655,700,745,825,900),
 (675,725,815,865,915), (650,700,750,825,900),
 (690,735,820,865,915), (675,715,755,825,900),
]


def json_write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf8')


def source_bindings(person):
    """Bind the exact selected source paint and fitting used by this family."""
    sources={person['source']:person['sourceSha256']}
    for entry in list(person['views'].values())+person.get('turn_sources',[]):
        if 'source' in entry:sources[entry['source']]=entry['sourceSha256']
        for limb in entry.get('leg_sources',[]):sources[limb['source']]=limb['sourceSha256']
    for path,digest in sources.items():
        if paint.digest(ROOT/path)!=digest:raise ValueError('Changed bound source: '+path)
    return {'sources':[{'path':path,'sha256':digest} for path,digest in sorted(sources.items())],
        'fittingSha256':hashlib.sha256(json.dumps(person,sort_keys=True,separators=(',',':')).encode()).hexdigest(),
        'builderSha256':paint.digest(Path(__file__)),
        'deformationSha256':paint.digest(ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')}


def check(key):
    person=json.loads(SPEC.read_text(encoding='utf8'))['characters'][key]
    manifest=json.loads((DEST/key/'manifest.json').read_text())
    if manifest.get('sourceBindings')!=source_bindings(person):raise ValueError('Export source/fitting/builder binding is stale')
    for variant,delivery in manifest['variants'].items():
        path=DEST/key/delivery['image']
        if paint.digest(path)!=delivery['sha256']:raise ValueError('Export hash changed: '+variant)
        atlas=Image.open(path).convert('RGBA');w,h=delivery['frame_size']
        if list(atlas.size)!=delivery['image_size'] or atlas.size!=(w*manifest['cols'],h*manifest['rows']):raise ValueError('Atlas grid mismatch')
        if max(atlas.size)>4096:raise ValueError('Atlas exceeds texture budget')
        def cell(pos):return atlas.crop((pos['col']*w,pos['row']*h,(pos['col']+1)*w,(pos['row']+1)*h))
        for direction,walk in manifest['walks'].items():
            samples=[cell({'row':walk['row'],'col':i}) for i in range(walk['frames'])]
            if len(set(f.tobytes() for f in samples))!=walk['frames']:raise ValueError('Duplicate gait samples: '+direction)
            for f in samples:
                bbox=f.getbbox()
                if bbox is None or min(bbox[0],bbox[1],w-bbox[2],h-bbox[3])<2:raise ValueError('Clipped walk: '+direction)
        if manifest['turns']['pose_count']:
            for direction,anchor in manifest['turns']['anchors'].items():
                bridge=manifest['bridges'][direction]
                turn_row=manifest['turns']['rows'][anchor//manifest['cols']]
                if cell({'row':bridge['row'],'col':bridge['stop_cols'][-1]}).tobytes()!=cell({'row':turn_row,'col':anchor%manifest['cols']}).tobytes():raise ValueError('Turn anchor/stop mismatch')
        for transition in manifest['transitions'].values():
            for pos in transition['frames']:
                if not (0<=pos['row']<manifest['rows'] and 0<=pos['col']<manifest['cols']):raise ValueError('Invalid transition cell')
    print('Source/export structural checks passed: '+key+'; visual/runtime approval remains separate.',flush=True)


def prepare():
    if SPEC.exists():
        raise ValueError('Refusing to overwrite source-specific motion fittings; edit the existing spec in place.')
    roster = json.loads(SOURCE.read_text(encoding='utf8'))['records']
    persons = {}
    for person, band in zip(roster, BANDS):
        image = Image.open(ROOT / person['file']).convert('RGBA')
        if paint.digest(ROOT / person['file']) != person['sha256']:
            raise ValueError('Changed source: ' + person['voiceId'])
        bounds = [v['connectedFigureBoundsXYXY'] for v in person['cellFindings']]
        scale = HEIGHT / max(b[3] - b[1] for b in bounds)
        views = {}
        for direction, box in zip(DIRECTIONS, bounds):
            x0, y0, x1, y1 = box
            width, height = x1 - x0, y1 - y0
            # Ground pivot follows the feet, excluding upper lateral props.
            alpha = np.asarray(image)[y0:y1, x0:x1, 3]
            feet_x = np.where(alpha[round(height*.95):] >= 128)[1]
            pivot_x = x0 + (float(feet_x.min()) + float(feet_x.max())) / 2
            mid = pivot_x
            waist, hip, hem, knee, ankle = [y0 + height*v/1000 for v in band]
            if direction in ('right', 'left'):
                # Follow the observed shoe-overlap seam; unlike a straight
                # column cut this retains the complete near shoe's toe.
                frac = .71 if direction == 'right' else .29
                seam = [[x0+width*frac, hip], [x0+width*frac, ankle],
                        [x0+width*(.91 if direction == 'right' else .09), y0+height*.95],
                        [x0+width*(.96 if direction == 'right' else .04), y1]]
            else:
                seam = [[mid, hip], [mid, y1]]
            views[direction] = {
                'component_bounds': box, 'source_pivot': [pivot_x, y1],
                'landmarks': {'waist':waist, 'hip':hip, 'hem':[hem,hem],
                    'knee':[knee,knee], 'sock':[ankle-3,ankle-3], 'ankle':[ankle,ankle],
                    'mid':mid, 'centres':[mid-width*.18,mid+width*.18],
                    'split_path_xy':seam, 'auto_hand_mask':False,
                    'step_width':12, 'root_overlap':2},
                'foreground':0 if direction == 'right' else 1,
                'protected_polygons': [],
                'fitStatus':'initial-source-inspection-needs-native-extreme-review',
            }
        persons[person['voiceId']] = {'actorId':person['actorId'], 'source':person['file'],
            'sourceSha256':person['sha256'], 'scale':scale, 'views':views,
            'sourceBrief':person['designBrief'], 'status':'candidate-unapproved'}
    json_write(SPEC, {'schemaVersion':1, 'status':'candidate-unapproved',
        'working':{'figureHeight':HEIGHT,'baseline':BASELINE},
        'cell':list(CELL),'figureHeight':128,'pivot':list(PIVOT),'characters':persons})
    for key in persons:
        registered_review(key, persons[key])


def registered(person, direction):
    view = person['views'][direction]
    source_path = ROOT / view.get('source',person['source'])
    if paint.digest(source_path) != view.get('sourceSha256',person['sourceSha256']):
        raise ValueError('Changed direction source: '+direction)
    source = Image.open(source_path).convert('RGBA')
    scale = view.get('scale',person['scale'])
    image, origin = street.register_source(source, view, scale, BASELINE)
    lm = dict(view['landmarks'])
    for key in ['waist', 'hip']:
        lm[key] = lm[key]*scale + origin[1]
    lm['mid'] = lm['mid']*scale + origin[0]
    for key in ['hem', 'knee', 'sock', 'ankle']:
        lm[key] = [v*scale+origin[1] for v in lm[key]]
    lm['centres'] = [v*scale+origin[0] for v in lm['centres']]
    if 'foot_centres' in lm:lm['foot_centres']=[v*scale+origin[0] for v in lm['foot_centres']]
    lm['split_path_xy'] = [[x*scale+origin[0], y*scale+origin[1]] for x,y in lm['split_path_xy']]
    rigid = Image.new('L', image.size)
    for polygon in view['protected_polygons']:
        ImageDraw.Draw(rigid).polygon([(x*scale+origin[0], y*scale+origin[1]) for x,y in polygon], fill=255)
    return image, lm, rigid


def motion(person,direction,count=COUNT,strength=1,phases=None,step_width=None,limb_pose=None):
    """Move complete source legs; retain exact original head, hands and prop.

    A supplemental contact painting can expose cloth hidden in the cardinal
    master. Only its lower-body pixels are used. Original upper pixels occlude
    the moving cloth, instead of punching a hand-shaped hole into each leg.
    """
    index=DIRECTIONS.index(direction)
    source,lm,rigid=registered(person,direction)
    strength*=person['views'][direction].get('gait_strength',1)
    if step_width is not None:lm['step_width']=step_width
    view=person['views'][direction]
    if view.get('rest_centres') or view.get('leg_sources'):
        # Supplemental sources expose whole hidden legs. Keep those layers
        # separate through the rest-pose correction and gait, so one leg's
        # occluded paint is never inferred from the composited standing pose.
        scale=view.get('scale',person['scale'])
        rgba=np.asarray(source);yy,xx=np.mgrid[:512,:512]
        layers=[]
        seam=np.interp(np.arange(512),[p[1] for p in lm['split_path_xy']],[p[0] for p in lm['split_path_xy']])
        for side in range(2):
            owned=xx<seam[:,None] if side==0 else xx>=seam[:,None]
            leg_start=lm['hip']
            if view.get('connected_garment_owns_upper_legs'):
                end=view.get('connected_garment_end_source',view['landmarks']['hem'])[side]
                leg_start=end*scale+BASELINE-view['source_pivot'][1]*scale-lm.get('root_overlap',2)
            pixels=rgba.copy();pixels[(yy<leg_start)|~owned]=0
            layers.append(Image.fromarray(pixels))
        if view.get('leg_sources'):
            layers=[]
            for limb in view['leg_sources']:
                path=ROOT/limb['source']
                if paint.digest(path)!=limb['sourceSha256']:raise ValueError('Changed complete painted limb source')
                layer,_=street.register_source(Image.open(path).convert('RGBA'),limb,limb['scale'],BASELINE)
                placed=Image.new('RGBA',(512,512));placed.alpha_composite(layer,(limb.get('offset_x',0),0));layers.append(placed)
        if view.get('reassign_seam_fragments'):
            # A traced diagonal can put a few antialiased contour pixels on
            # the opposite leg. Transfer these inspected isolated fragments;
            # retain every source pixel rather than erasing the artefact.
            arrays=[np.asarray(layer).copy() for layer in layers]
            transfers=[]
            for side in range(2):
                groups,_=label(arrays[side][:,:,3]>=20)
                sizes=np.bincount(groups.ravel());sizes[0]=0
                largest=int(sizes.argmax())
                mask=(groups!=0)&(groups!=largest)
                if int(mask.sum())>view['reassign_seam_fragments']:
                    raise ValueError('Unreviewed disconnected leg region exceeds fitted seam-fragment allowance')
                transfers.append(mask)
            for side,mask in enumerate(transfers):
                arrays[1-side][mask]=arrays[side][mask];arrays[side][mask]=0
            layers=[Image.fromarray(a) for a in arrays]
        garment=None
        if view.get('connected_garment'):
            # Preserve the continuous painted crotch/hem above the separate
            # limbs. Recentring two disjoint halves alone tears this fabric.
            garment_ends=[y*scale+BASELINE-view['source_pivot'][1]*scale for y in view['connected_garment_end_source']] if 'connected_garment_end_source' in view else lm['hem']
            hems=np.where(xx<lm['mid'],garment_ends[0],garment_ends[1])
            pixels=rgba.copy()
            pixels[(yy<lm['waist']-8)|(yy>hems+lm.get('root_overlap',2))]=0
            garment=paint.premul(Image.fromarray(pixels))
        result=[];records=[]
        for frame_index,phase in enumerate(phases if phases is not None else np.arange(count)*math.tau/count):
            weight=view.get('upper_motion',{})
            bob=(-weight['bob']*(math.cos(2*phase)+1)/2 if weight else -1.2*math.cos(2*phase))*strength
            sway=weight.get('sway',0)*math.sin(2*phase)*strength;moves=[]
            for side in range(2):
                ys=[0,lm['waist'],lm['hip'],*map(lambda k:lm[k][side],['hem','knee','ankle']),511]
                phase_side=phase+side*math.pi
                stride=math.sin(phase_side)
                if view.get('stride_curve')=='planted':
                    # The loaded foot travels at constant ground speed for
                    # the same half-cycle in which lift is zero. The cubic
                    # swing joins with the same velocity at toe-off/contact.
                    p=(phase_side/math.tau)%1
                    if .25<=p<=.75:stride=2-4*p
                    else:
                        t=((p-.75)%1)*2
                        stride=-1-2*t+12*t*t-8*t*t*t
                foot=TRAVEL[index][0]*lm['step_width']*stride*strength
                knee=foot*view.get('knee_follow',7/16);lift=lm.get('lateral_lift',7)*max(0,math.cos(phase_side))*strength
                target=view['landmarks']['mid']+view.get('rest_separation',12)*(side-.5)/scale
                if view.get('leg_sources'):
                    rest=[0,0,0]
                elif 'rest_targets_working' in view:
                    origin_x=256-view['source_pivot'][0]*scale
                    rest=[target_x-(source_x*scale+origin_x) for target_x,source_x in zip(view['rest_targets_working'][side],view['rest_centres'][side])]
                else:rest=[(target-x)*scale for x in view['rest_centres'][side]]
                hip_rest=rest[0] if view.get('rest_root_translation') else 0
                if 'rest_hip_centres' in view and not view.get('leg_sources'):
                    origin_x=256-view['source_pivot'][0]*scale
                    hip_rest=view['rest_hip_targets_working'][side]-(view['rest_hip_centres'][side]*scale+origin_x)
                offsets=[0,0,hip_rest]+rest
                offsets.append(offsets[-1])
                dx=[a+b for a,b in zip(offsets,[0,sway,sway,knee*view.get('hem_follow',.35)+sway*.7,knee+sway*.25,foot,foot])]
                dy=[bob,bob,bob,bob-lift*.15,bob-lift*.4,-lift,-lift]
                if limb_pose is not None:dx,dy=limb_pose(side,ys,dx,dy)
                moves.append((ys,dx,dy,paint.warp_layer(layers[side],ys,dx,dy)))
            canvas=Image.new('RGBA',(512,512));foreground=view['foreground']
            for side in [1-foreground,foreground]:canvas.alpha_composite(moves[side][3])
            if garment is not None:
                sy=yy.astype(float)-bob;sx=xx.astype(float)
                origin_x=256-view['source_pivot'][0]*scale
                centres=[v[0]*scale+origin_x for v in view['rest_centres']]
                span=max(centres[1]-centres[0],abs(moves[1][1][3]-moves[0][1][3])*1.6,80)
                centre=sum(centres)/2
                blend=np.clip((xx-centre+span/2)/span,0,1);blend=blend*blend*(3-2*blend)
                weight=np.clip((yy-lm['waist'])/max(hems.max()-lm['waist'],1),0,1);weight=weight*weight*(3-2*weight)
                if 'connected_garment_end_source' in view:
                    # Cloth coverage and hidden anatomical knee are different
                    # measurements. Follow the actual limb field at each row
                    # rather than extending a constant hem displacement.
                    fields_x=[paint.PchipInterpolator(m[0],m[1])(np.arange(512))[:,None] for m in moves]
                    fields_y=[paint.PchipInterpolator(m[0],m[2])(np.arange(512))[:,None] for m in moves]
                    forward_x=xx+fields_x[0]*(1-blend)+fields_x[1]*blend
                    sy=yy.astype(float)-(fields_y[0]*(1-blend)+fields_y[1]*blend)
                else:
                    forward_x=xx+sway+weight*((moves[0][1][3]-sway)*(1-blend)+(moves[1][1][3]-sway)*blend)
                    sy-=weight*((moves[0][2][3]-bob)*(1-blend)+(moves[1][2][3]-bob)*blend)
                for row in range(512):
                    sx[row]=np.interp(np.arange(512),forward_x[row],np.arange(512),left=-1,right=512)
                canvas.alpha_composite(paint.unpack(paint.sample(garment,sx,sy)))
            result.append(canvas)
            records.append({'phase':frame_index,'foreground_limb':'viewer-right' if foreground else 'viewer-left',
                'limb_displacement':[{'nodes_y':m[0],'dx':m[1],'dy':m[2]} for m in moves]})
    else:
        result,records=paint.animate(source,lm,TRAVEL[index],count=count,
            foreground=view['foreground'],strength=strength,
            phases=phases,rigid_mask=rigid,limb_pose=limb_pose)
    overlay=person['views'][direction].get('originalUpper')
    if not overlay:return result,records
    raw=Image.open(ROOT/person['source']).convert('RGBA')
    if paint.digest(ROOT/person['source'])!=person['sourceSha256']:raise ValueError('Original upper source changed')
    upper,origin=street.register_source(raw,overlay,person['scale'],BASELINE)
    cut=overlay['cutSourceY']*person['scale']+origin[1]
    keep=Image.new('L',(512,512))
    draw=ImageDraw.Draw(keep)
    draw.rectangle((0,0,511,cut),fill=255)
    feather=overlay.get('featherWorkingPixels',0)
    if feather:
        for y in range(max(0,round(cut-feather)),min(512,round(cut)+1)):
            draw.line((0,y,511,y),fill=round(255*(cut-y)/feather))
    for polygon in overlay['protected_polygons']:
        draw.polygon([(x*person['scale']+origin[0],y*person['scale']+origin[1]) for x,y in polygon],fill=255)
    rgba=np.asarray(upper).copy();rgba[:,:,3]=np.rint(rgba[:,:,3].astype(float)*np.asarray(keep)/255).astype('uint8');rgba[rgba[:,:,3]==0]=0;upper=Image.fromarray(rgba)
    for i,(frame,phase) in enumerate(zip(result,phases if phases is not None else np.arange(count)*math.tau/count)):
        weight=view.get('upper_motion',{})
        bob=(-weight['bob']*(math.cos(2*phase)+1)/2 if weight else -1.2*math.cos(2*phase))*strength
        lower_clip=overlay.get('lowerClipSourceY',overlay['cutSourceY'])*person['scale']+origin[1]
        pixels=np.asarray(frame).copy();pixels[:max(0,int(lower_clip+bob-feather)-2)]=0
        excluded=Image.new('L',(512,512))
        for polygon in overlay.get('lowerExcludeWorkingPolygons',[]):
            ImageDraw.Draw(excluded).polygon([(x,y+bob) for x,y in polygon],fill=255)
        pixels[np.asarray(excluded)>0]=0
        frame=Image.fromarray(pixels)
        if weight:
            head=weight['headBaseSourceY']*person['scale']+origin[1]
            waist=weight['waistSourceY']*person['scale']+origin[1]
            sway=weight.get('sway',0)*math.sin(2*phase)*strength
            dx=[-weight.get('head_counter',.25)*sway,-weight.get('head_counter',.25)*sway,sway,sway]
            frame.alpha_composite(paint.warp_layer(upper,[0,head,waist,511],dx,[bob]*4))
        else:frame.alpha_composite(paint.warp_layer(upper,[0,511],[0,0],[bob,bob]))
        components,_=label(np.asarray(frame)[:,:,3]>=128)
        if sum(n>=100 for n in np.bincount(components.ravel())[1:])!=1:
            error=ValueError('Detached source upper/lower composition')
            error.frame=frame;error.phase=i
            raise error
        result[i]=frame
    return result,records


def neutral(person,direction):
    if person['views'][direction].get('originalUpper'):
        return motion(person,direction,count=4,phases=[math.pi/2],step_width=0)[0][0]
    return motion(person,direction,count=4,strength=0,phases=[0])[0][0]


def bridge_frames(person,direction):
    if person['views'][direction].get('originalUpper'):
        # Keep source contact recentering fixed, finish the lifted foot's arc,
        # then lift it smoothly again before phase zero. At pi/2 both source
        # soles are planted; no whole-body crossfade or wide authoring stance.
        return [motion(person,direction,count=4,phases=[p],step_width=0)[0][0]
            for p in [0,math.acos(.5),math.pi/2,math.acos(.4),math.acos(.75)]]
    return [motion(person,direction,count=4,strength=s,phases=[p])[0][0]
        for s,p in [(.75,15/16*math.tau),(.4,15/16*math.tau),(0,0),(.4,0),(.75,0)]]


def registered_review(key, person):
    directory = QA/key
    directory.mkdir(parents=True, exist_ok=True)
    frames = []
    for direction in DIRECTIONS:
        image, lm, _ = registered(person, direction)
        image.save(directory/f'{direction}-registered.png')
        overlay = image.copy()
        draw = ImageDraw.Draw(overlay)
        for name in ['waist','hip','hem','knee','ankle']:
            y = lm[name][0] if isinstance(lm[name],list) else lm[name]
            draw.line((80,y,432,y), fill='red', width=1)
            draw.text((80,y-12), name, fill='red')
        draw.line([tuple(p) for p in lm['split_path_xy']], fill='cyan', width=2)
        frames.append(overlay)
    street.opaque_board(frames,4,'#eee8db').save(directory/'source-registration.png')


def probe(key):
    """Inspect source/opposite-contact/passing extremes before expanding a bake."""
    spec=json.loads(SPEC.read_text(encoding='utf8'))
    person=spec['characters'][key]
    registered_review(key,person)
    directory=QA/key
    for index,direction in enumerate(DIRECTIONS):
        source,lm,rigid=registered(person,direction)
        try:
            frames,_=motion(person,direction,count=4)
        except ValueError as error:
            if hasattr(error,'frame'):error.frame.save(directory/f'{direction}-probe-fail.png')
            raise
        for i,frame in enumerate(frames):frame.save(directory/f'{direction}-probe-{i}.png')
        for color,name in [('#eee8db','light'),('#25272b','dark')]:
            street.opaque_board([source]+frames,5,color).save(directory/f'{direction}-probe-{name}.png')
    print('Probe written: '+key,flush=True)


def calibrate(key):
    """Draw source-bound sole marks on exact exports for visual verification.

    Coordinates are transported with the rigid source shoe, not guessed from a
    universal gait size. Occluded samples must be rejected by the visual reader;
    this diagnostic does not independently certify rendered foot planting.
    """
    person=json.loads(SPEC.read_text(encoding='utf8'))['characters'][key]
    manifest=json.loads((DEST/key/'manifest.json').read_text(encoding='utf8'))
    variant=manifest['variants']['desktop']
    path=DEST/key/variant['image']
    atlas=Image.open(path).convert('RGBA')
    assessments=[]
    for direction in ['right','left']:
        view=person['views'][direction]
        complete=view.get('leg_sources')
        points=([limb.get('sole_point_xy') for limb in complete] if complete else view.get('sole_points_xy'))
        if not points or any(point is None for point in points):continue
        raw=Image.open(ROOT/view.get('source',person['source'])).convert('RGBA')
        scale=view.get('scale',person['scale']);origin=np.array([256,BASELINE])-np.array(view['source_pivot'])*scale
        records=json.loads((QA/key/f'{direction}-deformation.json').read_text())
        contacts=[];marked=[]
        for side,point in enumerate(points):
            if complete:
                limb=complete[side];raw=Image.open(ROOT/limb['source']).convert('RGBA')
                scale=limb['scale'];origin=np.array([256+limb.get('offset_x',0),BASELINE])-np.array(limb['source_pivot'])*scale
            if raw.getpixel(tuple(point))[3]<128:raise ValueError('Sole mark is outside painted source')
            contact=[]
            for frame in range(4 if side==0 else 12,13 if side==0 else 21):
                phase=frame%COUNT;move=records[phase]['limb_displacement'][side]
                x,y=np.array(point)*scale+origin+np.array([move['dx'][-1],move['dy'][-1]])
                x=PIVOT[0]+(x-256)*.32;y=PIVOT[1]+(y-BASELINE)*.32
                contact.append({'frame':frame,'along_pixels':x*(1 if direction=='right' else -1),
                    'cell_xy':[float(x),float(y)]})
                row=manifest['walks'][direction]['row'];cell=atlas.crop((phase*CELL[0],row*CELL[1],(phase+1)*CELL[0],(row+1)*CELL[1]))
                drawing=ImageDraw.Draw(cell);drawing.ellipse((x-1,y-1,x+1,y+1),fill='#ff3050')
                marked.append(cell)
            contacts.append({'foot':'source-left' if side==0 else 'source-right','source_point_xy':point,'samples':contact})
        record={'character':key,'view':direction,'atlas_file':str(path.resolve()),'atlas_sha256':paint.digest(path),
            'frames_per_cycle':COUNT,'game_units_per_pixel':2.5/160/.02,
            'current_cycle_distance':manifest['cycle_distance'],'shoe_length_pixels':(sum(limb['shoe_length_source_px']*limb['scale'] for limb in complete)/len(complete) if complete else view['shoe_length_source_px']*scale)*.32,
            'contacts':contacts,'method':'Source shoe rigid-translation marks transported onto exact encoded atlas; manual visibility review pending.'}
        assessments.append(record)
        street.opaque_board(marked,9,'#eee8db',3).save(QA/key/f'{direction}-sole-marks.png')
    json_write(QA/key/'sole-measurements.json',{'assessments':assessments})
    result=assess_walk_speed.assess_file(QA/key/'sole-measurements.json')
    result['evidenceMode']='source-field-derived diagnostic with exact-atlas annotation; not independent all-contact pixel tracking'
    for entry in result.get('assessments',[]):
        entry['both_feet_observed']=False
        entry['visibilityLimit']='Far shoe heel is occluded in some crossing frames; two source contacts are defined, not both independently visible throughout.'
    json_write(QA/key/'sole-fit.json',result)
    print(json.dumps(result),flush=True)


def build(key):
    spec = json.loads(SPEC.read_text(encoding='utf8'))
    person = spec['characters'][key]
    if paint.digest(ROOT/person['source']) != person['sourceSha256']:
        raise ValueError('Source SHA changed')
    directory = QA/key
    directory.mkdir(parents=True, exist_ok=True)
    frames = []
    walks, bridges, neutrals, failure = {}, {}, {}, []
    for index, direction in enumerate(DIRECTIONS):
        image, lm, rigid = registered(person,direction)
        try:
            phases, records = motion(person,direction)
            walks[direction] = {'row':index,'frames':COUNT,'frame_ms':60,'loop':True}
            frames.extend(phases)
            neutrals[direction] = neutral(person,direction)
            json_write(directory/f'{direction}-deformation.json',records)
            for phase in [0,4,8,12]:
                phases[phase].save(directory/f'{direction}-native-phase-{phase}.png')
        except ValueError as error:
            if hasattr(error,'frame'):
                error.frame.save(directory/f'{direction}-failed-phase-{error.phase}.png')
            failure.append({'direction':direction,'error':str(error)})
    if failure:
        json_write(directory/'build-report.json',{'status':'FAIL','failures':failure,
            'sourceSha256':person['sourceSha256'], 'finding':'Source registration/deformation needs repair before export.'})
        print(json.dumps({'character':key,'failures':failure}),flush=True)
        return False
    # Each row reserves three easing-out samples, the exact planted source,
    # and three easing-in samples. Unused cells remain transparent.
    for index,direction in enumerate(DIRECTIONS):
        image,lm,rigid=registered(person,direction)
        row=4+index
        row_frames=bridge_frames(person,direction)
        if row_frames[2].tobytes()!=neutrals[direction].tobytes():raise ValueError('Planted bridge mismatch')
        frames.extend(row_frames+[Image.new('RGBA',(512,512))]*(COUNT-len(row_frames)))
        bridges[direction]={'row':row,'stop_cols':[0,1,2],'start_cols':[3,4],'frame_ms':70}
    neutral_cells={d:{'row':4+i,'col':2} for i,d in enumerate(DIRECTIONS)}
    turn_cells=[]
    if person.get('turn_sources'):
        for index,entry in enumerate(person['turn_sources']):
            if 'neutral' in entry:
                frame=neutrals[entry['neutral']]
            else:
                path=ROOT/entry['source']
                if paint.digest(path)!=entry['sourceSha256']:raise ValueError('Turn source changed')
                frame,_=street.register_source(Image.open(path).convert('RGBA'),entry,entry['scale'],BASELINE)
            turn_cells.append({'row':8,'col':index})
            frames.append(frame)
        frames.extend([Image.new('RGBA',(512,512))]*(COUNT-len(turn_cells)))
    transitions={}
    for a in DIRECTIONS:
        for b in DIRECTIONS:
            if a==b:continue
            if turn_cells:
                sequence=paint.plan_transition(a,b,walks,bridges,turn_cells,
                    {d:i*2 for i,d in enumerate(DIRECTIONS)},turn_ms=85)
            else:
                sequence=[{'row':bridges[a]['row'],'col':c,'ms':70} for c in [0,1,2]]
                sequence.append({**neutral_cells[b],'ms':85})
                sequence.extend({'row':bridges[b]['row'],'col':c,'ms':70} for c in [3,4])
            transitions[a+'-to-'+b]={'frames':sequence,'visualStatus':
                'candidate-eight-painted-views-awaits-ordered-review' if turn_cells else
                'HOLD-cardinal-change-missing-painted-turn-angles'}
    states={}
    source=neutrals['down']
    _,lm,_=registered(person,'down')
    for action in ['idle','look','success','failure']:
        row=len(frames)//COUNT
        settings={'neck_y':BASELINE-HEIGHT*.55,'hip_y':lm['hip'],
            'sway_pixels': 1.2 if action=='idle' else 2 if action=='success' else 4,
            'nod_pixels':1 if action=='idle' else -3 if action=='success' else 4,
            'lift_pixels':10 if action=='success' else 0}
        action_frames=street.planted_action(source,action,COUNT,settings)
        frames.extend(action_frames)
        states[action]={'row':row,'durations_ms':[80 if action=='idle' else 60]*COUNT,
            'visualStatus':'candidate-source-bound-body-reaction'}
    rows=len(frames)//COUNT
    variants={}
    for variant,factor in [('desktop',1),('mobile',.5)]:
        width,height=[int(v*factor) for v in CELL]
        atlas=Image.new('RGBA',(width*COUNT,height*rows))
        cells=[street.export_cell(f,spec,compact=variant=='mobile') for f in frames]
        for i,cell in enumerate(cells):
            atlas.paste(cell,((i%COUNT)*width,(i//COUNT)*height))
        encoded=street.encoded(atlas,'WEBP',lossless=True,method=4,exact=True)
        exported=Image.open(io.BytesIO(encoded)).convert('RGBA')
        file=DEST/key/f'character-{variant}.webp'
        file.parent.mkdir(parents=True,exist_ok=True)
        file.write_bytes(encoded)
        min_gutter=999
        for i in range(len(frames)):
            cell=exported.crop(((i%COUNT)*width,(i//COUNT)*height,(i%COUNT+1)*width,(i//COUNT+1)*height))
            bbox=cell.getbbox()
            if bbox:min_gutter=min(min_gutter,bbox[0],bbox[1],width-bbox[2],height-bbox[3])
        variants[variant]={'image':file.name,'sha256':paint.digest(file),'bytes':len(encoded),
            'frame_size':[width,height],'pivot':[v*factor for v in PIVOT],'image_size':list(exported.size),'decodedRGBABytes':exported.width*exported.height*4,
            'minimumGutter':min_gutter}
        for index,direction in enumerate(DIRECTIONS):
            exact=[exported.crop((c*width,index*height,(c+1)*width,(index+1)*height)) for c in range(COUNT)]
            for background,name in [('#eee8db','light'),('#25272b','dark')]:
                street.opaque_board(exact,8,background).save(directory/f'{direction}-{variant}-{name}.png')
            gifs=[street.opaque_board([f],1,'#dedace') for f in exact]
            gifs[0].save(directory/f'{direction}-{variant}-motion.gif',save_all=True,append_images=gifs[1:],duration=60,loop=0)
        for action, state in states.items():
            row=state['row']
            exact=[exported.crop((c*width,row*height,(c+1)*width,(row+1)*height)) for c in range(COUNT)]
            street.opaque_board(exact,8,'#eee8db').save(directory/f'{action}-{variant}-light.png')
            street.opaque_board(exact,8,'#25272b').save(directory/f'{action}-{variant}-dark.png')
        if turn_cells:
            exact=cells[8*COUNT:8*COUNT+len(turn_cells)]
            for background,name in [('#eee8db','light'),('#25272b','dark')]:
                street.opaque_board(exact,8,background,2).save(directory/f'turns-{variant}-{name}.png')
            for name,transition in transitions.items():
                ordered=[cells[p['row']*COUNT+p['col']] for p in transition['frames']]
                street.opaque_board(ordered,len(ordered),'#eee8db',2).save(directory/f'{name}-{variant}-transition.png')
                clip=[street.opaque_board([f],1,'#dedace') for f in ordered]
                clip[0].save(directory/f'{name}-{variant}-transition.gif',save_all=True,append_images=clip[1:],
                    duration=[p['ms'] for p in transition['frames']],loop=0)
        street.opaque_board([cells[i] for i in [0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60]],4,'#eee8db',2).save(directory/f'extremes-{variant}.png')
    manifest={'schemaVersion':1,'status':'candidate-unapproved','frame_size':list(CELL),'pivot':list(PIVOT),
        'cols':COUNT,'rows':rows,'walks':walks,'bridges':bridges,'transitions':transitions,
        'turns':{'pose_count':len(turn_cells),'rows':[8] if turn_cells else [],
            'anchors':{d:i*2 for i,d in enumerate(DIRECTIONS)} if turn_cells else {},'frame_ms':85},
        'variants':variants,'delivery':variants['desktop'],'image':variants['desktop']['image'],'sha256':variants['desktop']['sha256'],
        'image_size':variants['desktop']['image_size'],'cycle_distance':person.get('cycle_distance',9.5),
        'cycleDistanceStatus':person.get('cycleDistanceStatus','provisional-unmeasured-native-shoe-tracking-required'),
        'figureWorldHeight':2.0,'billboardWorldHeight':2.5,
        'interactions':{'neutral':neutral_cells['down'],'states':states},
        'source':person['source'],'sourceSha256':person['sourceSha256'],
        'sourceBindings':source_bindings(person),
        'limitations':[('Eight planted painted views; ordered turn review pending.' if turn_cells else 'No painted intermediate turn views; cardinal changes are HOLD.'),
            'Profile hidden-limb coverage and prop masks require native review.',
            'No waving/working/answer-review gesture art or speech articulation supplied.',
            'Browser/game-scale/physical-device review not run by asset builder.']}
    json_write(DEST/key/'manifest.json',manifest)
    json_write(directory/'build-report.json',{'status':'candidate-unapproved','variants':variants,
        'uniqueWalkSamplesPerDirection':COUNT,'limitations':manifest['limitations']})
    print(json.dumps({'character':key,'status':manifest['status'],'variants':variants}),flush=True)
    return True


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepare',action='store_true')
    parser.add_argument('--character')
    parser.add_argument('--probe',action='store_true')
    parser.add_argument('--calibrate',action='store_true')
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    if args.prepare:prepare()
    if args.character:
        if args.check:check(args.character)
        elif args.calibrate:calibrate(args.character)
        elif args.probe:probe(args.character)
        else:raise SystemExit(0 if build(args.character) else 1)
