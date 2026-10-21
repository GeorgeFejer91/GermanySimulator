"""Hannelore family API: joined front garment and pre-landing side candidate.

Only own original pixels are sampled. Nothing here configures runtime stride.
"""
from pathlib import Path
from copy import deepcopy
import importlib.util
import math
import sys

import numpy as np
from scipy.interpolate import PchipInterpolator

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
PLAN = [((.45,7),(0,0)),((1,0),(0,0)),((1,0),(.5,7)),((1,0),(1,0))]
PROGRESS = (.2,.5,.8,1)
SIDE_PLAN = [((q,(0 if q==1 else 28*np.sin(np.pi*q))),(0,0)) for q in PROGRESS]
SIDE_PLAN += [((1,0),(q,(0 if q==1 else 12*np.sin(np.pi*q)))) for q in PROGRESS]


def load(name,path):
    spec = importlib.util.spec_from_file_location(name,path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def identity_upper():
    return {'nodes_y':[0,511],'dx':[0,0],'dy':[0,0],'sourceSize':[512,512]}


class HanneloreFields:
    def __init__(self):
        front = load('hannelore_family_front', HERE.parent/'front-rear-loop-v1/source_fields.py')
        side = load('hannelore_family_side', HERE.parent/'side-loop-v1/source_fields.py')
        self.front = front.FrontRearFields()
        self.side = side.SideFields()

    def neutral(self,direction):
        if direction in ('down','up'):
            return self.front.sources[direction].copy()
        return self.side.render(direction,0,strength=0,diagnostics=False)[0]

    def walk(self,direction,phase):
        if direction in ('down','up'):
            image,record = self.front.pose(direction,math.tau*phase/16)
            return image,{'upper':{**record['fields'][2],'sourceSize':[512,512]},'producer':record}
        image,records,_,_ = self.side.render(direction,phase)
        return image,{'upper':identity_upper(),'limbs':records}

    def stop(self,direction,phase,stage):
        count = 4 if direction in ('down','up') else 8
        if stage not in range(count) or phase not in range(16):
            raise ValueError('Expected an actual gait cell and stop stage')
        return (self._front_stop(direction,phase,stage) if direction in ('down','up')
                else self._side_stop(direction,phase,stage))

    def _front_stop(self,direction,phase,stage):
        actor = self.front
        _,source = actor.pose(direction,math.tau*phase/16)
        parts = source['fields'][:2]
        swing = int(np.argmin([p['dy'][-1] for p in parts]))
        overrides = []
        for side,part in enumerate(parts):
            progress,lift = PLAN[stage][0 if side==swing else 1]
            nodes = part['nodes_y']
            weights = [max(0,min(1,(y-nodes[2])/(nodes[-2]-nodes[2]))) for y in nodes]
            dx = [x*(1-progress) for x in part['dx']]
            dy = [y*(1-progress)-lift*w for y,w in zip(part['dy'],weights)]
            overrides.append((dx,dy))

        def limb(side,nodes,dx,dy):
            assert nodes == parts[side]['nodes_y']
            return overrides[side]

        paint = actor.paint
        calls,samples = [],[]
        original_warp,original_sample = paint.warp_layer,paint.sample
        source_premul = paint.premul(actor.sources[direction])

        def traced(layer,nodes,dx,dy):
            calls.append({'nodes_y':list(nodes),'dx':list(map(float,dx)),'dy':list(map(float,dy)),
                'minJacobianY':float(np.min(1+PchipInterpolator(nodes,dy).derivative()(np.arange(512))))})
            return original_warp(layer,nodes,dx,dy)

        def joined(layer,sx,sy):
            samples.append(layer)
            if direction=='down' and len(samples)==3:
                return np.zeros_like(layer)
            if direction=='down' and len(samples)==4:
                for owned in (layer,samples[2]):
                    assert np.all(np.all(owned==0,axis=2)|np.all(owned==source_premul,axis=2))
                layer = np.maximum(layer,samples[2])
            return original_sample(layer,sx,sy)

        view = actor.recipe['views'][direction]
        strength = (.8,.6,.4,.2)[stage]
        paint.warp_layer,paint.sample = traced,joined
        try:
            images,_ = paint.animate(actor.sources[direction],view['landmarks'],travel=view['travel'],count=16,
                foreground=view['foreground'],strength=strength,phases=[math.tau*phase/16],
                rigid_mask=actor.masks[direction],limb_pose=limb)
        finally:
            paint.warp_layer,paint.sample = original_warp,original_sample
        assert len(calls)==3 and len(samples)==4
        return images[0],{'upper':{**calls[2],'sourceSize':[512,512]},'fields':calls,
            'upperStrength':strength,'swingScreenSide':swing,'garmentUsesUpperSourceUnion':direction=='down'}

    def _side_stop(self,direction,phase,stage):
        actor = self.side
        initial = actor.controls(direction,phase)
        rest = actor.controls(direction,0,strength=0)
        lifts = [p['liftWorking'] for p in initial]
        swing = int(np.argmax(lifts)) if max(lifts)>1e-8 else int(np.argmax([abs(p['dx'][-1]) for p in initial]))
        controls = deepcopy(initial)
        for side,part in enumerate(controls):
            progress,lift = SIDE_PLAN[stage][0 if side==swing else 1]
            source,target = initial[side],rest[side]
            part['dx'] = [float(a+(b-a)*progress) for a,b in zip(source['dx'],target['dx'])]
            nodes = part['nodesY']
            part['dy'] = [float(a+(b-a)*progress-lift) for a,b in zip(source['dy'],target['dy'])]
            tail = max(0,min(1,(progress-.8)/.2))
            angle_factor = 0 if progress == 1 else 1-tail*tail*(3-2*tail)
            part['rotationDegrees'] = float(source['rotationDegrees']*angle_factor)
            part['travelWorking'] = float(source['travelWorking']*(1-progress))
            part['baseX'] = float(source['baseX']*(1-progress))
            part['liftWorking'] = float(source['liftWorking']*(1-progress)+lift)
            part['rootRaiseWorking'] = float(-part['dy'][0])
            part['sourceStrength'] = part.pop('strength')
            part['stopProgress'],part['extraStopLiftWorking'] = progress,lift
            # Actual fixed source sole reaches its own neutral X before landing.
            if side == swing and progress == .8 and abs(source['rotationDegrees']) > 1e-8:
                fx = PchipInterpolator(nodes,part['dx'])
                fy = PchipInterpolator(nodes,part['dy'])
                cap = actor.sources[direction]['capCentroids'][side]
                point = np.array(actor.sources[direction]['witnesses'][side]['support']['sourcePoint'],float)
                pivot = cap+np.array([fx(cap[1]),fy(cap[1])])
                moved = point+np.array([fx(point[1]),fy(point[1])])
                theta = np.deg2rad(part['rotationDegrees'])
                co,si = np.cos(theta),np.sin(theta)
                current_x = pivot[0]+co*(moved[0]-pivot[0])-si*(moved[1]-pivot[1])
                basis = np.array([0,0,.35,1,1],float)
                cap_weight = float(PchipInterpolator(nodes,basis)(cap[1]))
                gain = co+(1-co)*cap_weight
                delta = float((point[0]-current_x)/gain)
                part['dx'] = (np.array(part['dx'])+delta*basis).tolist()
                part['travelWorking'] += delta
                part['preLandingSoleWaypoint'] = {'sourcePoint':point.tolist(),
                    'targetX':float(point[0]),'previousX':float(current_x),
                    'gain':float(gain),'connectedCalfDeltaX':delta}
        original = actor.controls
        actor.controls = lambda *args,**kwargs:deepcopy(controls)
        try:
            image,records,_,_ = actor.render(direction,phase)
        finally:
            actor.controls = original
        for record in records:
            if 'preLandingSoleWaypoint' in record:
                waypoint = record['preLandingSoleWaypoint']
                actual = record['fixedSoleWitnesses']['support']['transportedPoint']
                assert abs(actual[0]-waypoint['targetX']) < 1e-9
                waypoint['actualPoint'] = actual
        assert all(p['rootCapNotCoveredByUpperAlpha200']==0 for p in records)
        assert any(abs(p['dy'][-1])<1e-10 and abs(p['rotationDegrees'])<1e-10 for p in records)
        return image,{'upper':identity_upper(),'limbs':records,'initialSwing':swing}
