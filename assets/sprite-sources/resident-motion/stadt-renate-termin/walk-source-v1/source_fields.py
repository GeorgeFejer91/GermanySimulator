"""Renate's own 512-pixel walking fields. Source only; no runtime owner."""
from __future__ import annotations

import importlib.util
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.interpolate import PchipInterpolator

ROOT = Path(__file__).resolve().parents[5]
FAMILY = Path(__file__).resolve().parents[1]
SKILL = ROOT / '.agents/skills/animate-2d-characters/scripts'
import sys
sys.path.insert(0, str(SKILL))
import painted_walk as paint


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


SIDE = load('renate_approved_side', FAMILY/'probe-side-gait-v4.py')
BOOT = SIDE.bootfit
FIT = json.loads((FAMILY/'side-gait-fit-v4.json').read_text(encoding='utf8'))
FRONT = json.loads((FAMILY/'front-rear-fit-v1.json').read_text(encoding='utf8'))


def phase_travel(phase):
    """Eight-frame constant-speed stance, eight-frame smooth return swing.

    The four V4 poses approved paint/anatomy, not a physical gait curve.
    Its lifted phase0/8 x anchors are intentionally changed to the crossing
    centre so the planted foot does not suddenly traverse 27 pixels.
    """
    p = float(phase) % 16
    if 4 <= p <= 12:
        return 15 - 3.75*(p-4)
    t = ((p-12)%16)/8
    # Hermite return: endpoint derivative agrees with the -3.75 px/frame
    # stance velocity, avoiding a stopped foot at toe-off/landing.
    return 15*(-1-2*t+12*t*t-8*t*t*t)


def phase_lift(phase, role):
    """Only the swinging shoe rises; approved phase0/8 heights exact."""
    p = (float(phase) + (8 if role == 'near' else 0)) % 16
    if 4 <= p <= 12:
        return 0.0
    return 8*max(0.0, math.cos(math.tau*p/16))


def identity_upper():
    return {'nodes_y':[0,511], 'dx':[0.0,0.0], 'dy':[0.0,0.0], 'sourceSize':[512,512]}


def transport_upper_points(direction, field_record, points_xy):
    """Forward-map source lip points using the exact recorded upper PCHIP field."""
    field = field_record['upper']
    x = np.asarray(points_xy,dtype=float)
    y = np.clip(x[...,1],0,511)
    dx = PchipInterpolator(field['nodes_y'],field['dx'])(y)
    dy = PchipInterpolator(field['nodes_y'],field['dy'])(y)
    return np.stack([x[...,0]+dx,x[...,1]+dy],axis=-1)


class RenateFields:
    def __init__(self):
        ownership = SIDE.pinned_json(FIT['ownershipReceipt'])
        base = SIDE.pinned_json(FIT['baseFit'])
        measured = SIDE.pinned_json(ownership['measuredBootFit'])
        card = BOOT.bound_image({'path':base['cardinals']['source'],'sha256':base['cardinals']['sha256']})
        own = BOOT.bound_image({'path':base['companion']['source'],'sha256':base['companion']['sha256']})
        self.sources = {}
        self.side_roles = {}
        for direction in ('right','left'):
            view = base['cardinals']['views'][direction]
            source = BOOT.register(card,view['bounds'],view['pivot'],400/(view['bounds'][3]-view['bounds'][1]))
            if BOOT.rgba_sha(source) != measured['neutralRgbaSha256'][direction]:
                raise ValueError('Renate registered side source changed')
            own_entry={'path':f'output/ambient-city-animation/renate-termin-leg-ownership-v1/{direction}-masked-own-far-registered.png',
                'sha256':ownership['output'][f'{direction}-masked-own-far-registered.png']}
            far_complete = BOOT.bound_image(own_entry)
            _, near_complete = SIDE.own_complete_near_boot(own,FIT['sides'][direction]['ownCompleteNearBoot'])
            far,near,_=SIDE.original_role_layers(source,far_complete,near_complete,FIT['sides'][direction],FIT['geometry']['roleSourceBeginsWorkingY'])
            self.sources[direction]=source
            self.side_roles[direction]={'far':far,'near':near}
        for direction in ('down','up'):
            view=FRONT['views'][direction]
            source=BOOT.bound_image({'path':view['file'],'sha256':view['sha256']})
            mask=Image.new('L',(512,512))
            draw=ImageDraw.Draw(mask)
            for polygon in view['protectedPolygons']:
                draw.polygon([tuple(point) for point in polygon],fill=255)
            self.sources[direction]=source
            self.side_roles[direction]={'mask':mask}

    def side(self,direction,phase,strength=1.0,limb_override=None):
        source=self.sources[direction]
        if strength==0 and limb_override is None:
            return source.copy(),{'upper':identity_upper(),'limbs':{},'phase':phase,'strength':0,'neutralExact':True}
        geo=FIT['geometry']; side=FIT['sides'][direction]
        roles={}; fields={}
        for role in ('far','near'):
            image=self.side_roles[direction][role]
            measured=SIDE.shoe_measure(image)
            centre_shift=geo['bodyFootCentreWorkingX']-measured['redCentreX']
            role_phase=phase+(8 if role=='near' else 0)
            travel=phase_travel(role_phase)*side['directionalTravelSign']
            dx=(centre_shift+travel)*strength
            dy=((side['farOnlySoleRegistrationWorkingY'] if role=='far' else 0)-phase_lift(phase,role))*strength
            default={'nodesY':geo['fieldNodesWorkingY'],
                'dx':[dx*k for k in geo['horizontalFieldFractions']],
                'dy':[dy*k for k in geo['verticalFieldFractions']]}
            if limb_override and role in limb_override:
                override=limb_override[role]
                default['dx']=override['dx'];default['dy']=override['dy']
                roles[role]=paint.warp_layer(image,default['nodesY'],default['dx'],default['dy'])
            else:
                roles[role]=paint.warp_layer(image,default['nodesY'],default['dx'],default['dy'])
            fields[role]={'nodes_y':default['nodesY'],'dx':default['dx'],'dy':default['dy'],
                'sourceSolePoint':[measured['redCentreX'],measured['opaqueSoleLastRowY']]}
        frame,protected=SIDE.compose(source,roles['far'],roles['near'],geo,direction)
        return frame,{'upper':identity_upper(),'limbs':fields,'phase':phase,'strength':strength,
            'sourceBody':direction,'protected':protected,'neutralExact':False}

    def vertical(self,direction,phase,strength=1.0,limb_override=None):
        view=FRONT['views'][direction]
        source=self.sources[direction]
        if strength==0 and limb_override is None:
            return source.copy(),{'upper':identity_upper(),'limbs':{},'phase':phase,'strength':0,'neutralExact':True}
        calls=[]
        original=paint.warp_layer
        def traced(layer,nodes,dx,dy):
            calls.append({'nodes_y':list(nodes),'dx':[float(v) for v in dx],
                'dy':[float(v) for v in dy],'sourceSize':[512,512]})
            return original(layer,nodes,dx,dy)
        def corrected(side,nodes,dx,dy):
            if limb_override is not None:
                field=limb_override[side]
                return field['dx'],field['dy']
            # The historical pilot added signed depth below the source sole.
            # Remove the downward half from this limb's shoe while preserving
            # its own upper/root and opposite-foot depth separation.
            t=math.tau*phase/16+side*math.pi
            signed_depth=view['travel'][1]*view['landmarks']['depth_amplitude']*math.sin(t)*strength
            depth=max(0.0,signed_depth)
            # Keep the short knee/cuff span from compressing while raising
            # only the positive-depth shoe. The root remains under the hem.
            weights=(0,0,0,.62,.90,1,1)
            result=[value-depth*weight for value,weight in zip(dy,weights)]
            # A short cloth/calf interval in the rear original requires its
            # own raised-shoe displacement spread through the painted knee.
            # Search the smallest bounded source-field adjustment that keeps
            # the existing warp's Jacobian guard intact; never lower guard.
            samples=np.arange(512)
            def margin(values):
                return float(np.min(1+PchipInterpolator(nodes,values).derivative()(samples)))
            if margin(result)<=.52:
                candidates=[]
                for h in range(13):
                    for k in range(17):
                        changed=list(result);changed[3]-=.25*h;changed[4]-=.25*k
                        if margin(changed)>.53:
                            candidates.append((h*h+k*k,h+k,changed))
                if not candidates:raise ValueError('Renate knee field has no bounded nonfolding paint transport')
                result=min(candidates,key=lambda item:(item[0],item[1]))[2]
            return dx,result
        paint.warp_layer=traced
        try:
            frames,records=paint.animate(source,view['landmarks'],travel=view['travel'],
                count=16,foreground=view['foreground'],strength=strength,
                phases=[math.tau*phase/16],rigid_mask=self.side_roles[direction]['mask'],
                limb_pose=corrected)
        finally:
            paint.warp_layer=original
        if len(calls)!=3:
            raise ValueError('Unexpected own vertical warp calls')
        upper=calls[2]
        return frames[0],{'upper':upper,'limbs':calls[:2],
            'phase':phase,'strength':strength,'sourceBody':direction,
            'neutralExact':False,'helperRecord':records[0]}

    def frame(self,direction,phase,strength=1.0,limb_override=None):
        if direction in ('right','left'):
            return self.side(direction,phase,strength,limb_override)
        return self.vertical(direction,phase,strength,limb_override)
