#!/usr/bin/env python3
"""Bake a preview-only, skinned 3D walk. Blender is an offline authoring tool."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import subprocess
import sys

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / "assets/sprite-sources/reference/makehuman-walk"
DEST = ROOT / "assets/sprite-sources/candidates/merkel-3d"
WORK = ROOT / "output/merkel-3d"
COUNT = 32
CELL = 128
RENDER_SIZE = 512
VIEWS = ("left", "right", "up", "down")
SOURCE_HASHES = {
    "base.obj": "8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c",
    "default.mhskel": "99f179bce0aa850b45d4191a1d0d234c5851f881c057439470ded3bddf729a24",
    "default_weights.mhw": "0f3641d651ae3d00ad6b4ccee43142edb109d3bd909d27d9e4139ef1beed8625",
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, value):
    # Hashes must survive this repository's LF normalization on Windows.
    path.write_text(json.dumps(value,indent=2)+"\n",encoding="utf-8",newline="\n")


def load_mesh():
    vertices, faces = [], []
    body = False
    for line in (REFERENCE / "base.obj").read_text().splitlines():
        if line.startswith("v "):
            vertices.append([float(v) for v in line.split()[1:4]])
        elif line.startswith("g "):
            body = line.strip() == "g body"
        elif body and line.startswith("f "):
            faces.append([int(v.split("/")[0]) - 1 for v in line.split()[1:]])
    skeleton = json.loads((REFERENCE / "default.mhskel").read_text())
    vertices = np.array(vertices)
    joints = {name: vertices[indices].mean(axis=0) for name, indices in skeleton["joints"].items()}
    return vertices, faces, skeleton, joints


def inspect():
    vertices, faces, skeleton, joints = load_mesh()
    used = sorted({i for face in faces for i in face})
    print("body", len(used), "vertices; bounds", vertices[used].min(axis=0), vertices[used].max(axis=0))
    for name in ("root", "spine05", "spine01", "neck01", "neck03", "head", "upperleg01.L", "lowerleg01.L", "foot.L", "toe3-1.L", "toe3-3.L", "upperarm01.L", "lowerarm01.L", "wrist.L"):
        b = skeleton["bones"][name]
        print(name, "head", joints[b["head"]], "tail", joints[b["tail"]])
    for name in SOURCE_HASHES:
        print(name, digest(REFERENCE / name))


def fit(points):
    """One rest-space fitting, applied to mesh AND joints, never per image."""
    points = np.asarray(points)
    h = (points[..., 1] + 8.1676) / 16.6589
    height = np.interp(h, [0, .0432, .2685, .5195, .8052, .8438, .909, 1],
                       [0, .13, .65, 1.21, 1.93, 2.00, 2.30, 2.82])
    width = np.interp(h, [0, .48, .80, .85, .91, 1], [1.25, 1.45, 1.45, 1.5, 2.30, 2.30])
    depth = np.interp(h, [0, .48, .67, .82, .91, 1], [1.35, 1.60, 1.85, 1.5, 2.15, 2.15])
    return np.stack((points[..., 0] * .1693 * width,
                     -(points[..., 2] - .1) * .1693 * depth, height), axis=-1)


def rig_definition(joints, skeleton):
    def point(name, end="head"):
        return fit(joints[skeleton["bones"][name][end]])
    hips = {s: point("upperleg01." + s) for s in "LR"}
    shoulders = {s: point("upperarm01." + s) for s in "LR"}
    pelvis = (hips["L"] + hips["R"]) / 2
    shoulder = (shoulders["L"] + shoulders["R"]) / 2
    neck = point("neck01")
    head = point("head")
    bones = {
        "pelvis": (pelvis, pelvis + [0, 0, .22], None),
        "chest": (pelvis + [0, 0, .22], shoulder, "pelvis"),
        "neck": (neck, head, "chest"),
        "head": (head, point("head", "tail"), "neck"),
    }
    for s in "LR":
        knee, ankle = point("lowerleg01." + s), point("foot." + s)
        toe = point("toe3-1." + s)
        elbow, wrist = point("lowerarm01." + s), point("wrist." + s)
        bones.update({
            "thigh." + s: (hips[s], knee, "pelvis"),
            "shin." + s: (knee, ankle, "thigh." + s),
            "foot." + s: (ankle, toe, "shin." + s),
            "toe." + s: (toe, point("toe3-3." + s, "tail"), "foot." + s),
            "arm." + s: (shoulders[s], elbow, "chest"),
            "forearm." + s: (elbow, wrist, "arm." + s),
            "hand." + s: (wrist, point("wrist." + s, "tail"), "forearm." + s),
        })
    return bones


def remap_weight(name):
    s = name[-1]
    if name.startswith("upperleg"): return "thigh." + s
    if name.startswith("lowerleg"): return "shin." + s
    if name.startswith("foot"): return "foot." + s
    if name.startswith("toe"): return "toe." + s
    if name.startswith("upperarm"): return "arm." + s
    if name.startswith("lowerarm"): return "forearm." + s
    if name.startswith(("wrist", "finger", "metacarpal")): return "hand." + s
    if name.startswith("neck"): return "neck"
    if name.startswith(("spine01", "spine02", "spine03", "clavicle", "breast")): return "chest"
    if name.startswith(("root", "pelvis", "spine04", "spine05")): return "pelvis"
    return "head"


def capture():
    # Reuse the pinned BVH parser, but retain all three spatial coordinates.
    spec = importlib.util.spec_from_file_location("walk_reference", ROOT / "tools/build-cmu-walk-reference.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    assert digest(module.SOURCE) == module.EXPECTED_SHA256
    nodes, frames, dt = module.parse_bvh(module.SOURCE)
    positions = module.forward_kinematics(nodes, frames)
    start, end, forward, lateral = module.choose_cycle(positions)
    # MakeHuman left is positive X. Determine capture lateral sign from its hips.
    if np.mean((positions["LeftUpLeg"] - positions["RightUpLeg"]) @ lateral) < 0:
        lateral = -lateral
    samples = {}
    for side in ("Left",):
        for label, a, b in (("arm", "Arm", "ForeArm"), ("forearm", "ForeArm", "Hand")):
            vectors = positions[side + b][start:end] - positions[side + a][start:end]
            vectors = np.column_stack((vectors @ lateral, -(vectors @ forward), vectors[:, 1]))
            vectors = module.periodic_fit(vectors, COUNT, 3)
            vectors /= np.linalg.norm(vectors, axis=1)[:, None]
            samples[label + "." + side[0]] = vectors.tolist()
            # The source's right arm barely swings in this segment. Mirror the
            # captured left-arm gesture at the opposite half-cycle, not per view.
            opposite = np.roll(vectors, -COUNT//2, axis=0).copy()
            opposite[:, 0] *= -1
            samples[label + ".R"] = opposite.tolist()
    return {"sourceFrames": [start, end], "duration": (end-start)*dt,
            "bvhSha256": digest(module.SOURCE), "directions": samples}


def smooth(t):
    t = max(0., min(1., t))
    return t*t*(3-2*t)


def foot_path(phase, length, heel, toe, ankle_height):
    """World-planted heel/forefoot during 62% stance, C1 periodic swing."""
    stance, amplitude = .62, .245 * length
    speed = 2 * amplitude / stance
    if phase < .12:
        pitch = math.radians(-12) * (1-smooth(phase/.12))
    elif phase < .40:
        pitch = 0.
    elif phase < stance:
        pitch = math.radians(28) * smooth((phase-.40)/(stance-.40))
    else:
        q = (phase-stance)/(1-stance)
        pitch = math.radians(28 - 40*smooth(q))

    def rotated(forward, z, angle):
        return forward*math.cos(angle) + z*math.sin(angle), -forward*math.sin(angle) + z*math.cos(angle)

    heel_initial = rotated(heel, -ankle_height, math.radians(-12))[0]
    contact = heel if pitch < 0 else toe
    roll_f, roll_z = rotated(contact, -ankle_height, pitch)
    correction = heel_initial - heel + contact - roll_f
    if phase <= stance:
        travel = amplitude-speed*phase
        lift = 0.
    else:
        q = (phase-stance)/(1-stance)
        # Cubic Hermite endpoint velocities match the backwards stance velocity.
        a, b = -amplitude, amplitude
        m = -speed*(1-stance)
        travel = (2*q**3-3*q*q+1)*a + (q**3-2*q*q+q)*m + (-2*q**3+3*q*q)*b + (q**3-q*q)*m
        lift = .085*length * math.sin(math.pi*q)**2
    return travel+correction, -roll_z+lift, pitch, phase <= stance, speed


def render_blender(args):
    import bpy
    from mathutils import Matrix, Vector
    from bpy_extras.object_utils import world_to_camera_view

    vertices, faces, skeleton, joints = load_mesh()
    definition = rig_definition(joints, skeleton)
    used = sorted({i for face in faces for i in face})
    indices = {old: new for new, old in enumerate(used)}
    fitted = fit(vertices)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    bpy.context.preferences.filepaths.save_version = 0
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = scene.render.resolution_y = RENDER_SIZE
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = True
    scene.render.fps = 26
    scene.view_settings.view_transform = "Standard"
    scene.world.color = (.32, .32, .32)

    def material(name, color):
        mat = bpy.data.materials.new(name)
        mat.diffuse_color = (*color, 1)
        mat.use_nodes = True
        node = mat.node_tree.nodes.get("Principled BSDF")
        node.inputs["Base Color"].default_value = (*color, 1)
        node.inputs["Roughness"].default_value = .83
        return mat

    clay = material("Grey clay", (.48, .49, .48))
    trousers = material("Trouser clay", (.25, .27, .28))
    hair_mat = material("Hair clay", (.34, .35, .34))
    sole_mat = material("Shoe clay", (.12, .14, .15))
    mesh = bpy.data.meshes.new("MakeHuman fitted topology")
    mesh.from_pydata(fitted[used].tolist(), [], [[indices[i] for i in face] for face in faces])
    mesh.update()
    body = bpy.data.objects.new("Merkel proportion study", mesh)
    scene.collection.objects.link(body)
    for mat in (clay, trousers, sole_mat): mesh.materials.append(mat)
    for poly in mesh.polygons:
        height = sum(mesh.vertices[i].co.z for i in poly.vertices)/len(poly.vertices)
        poly.material_index = 2 if height < .17 else 1 if height < 1.17 else 0
        poly.use_smooth = True
    armature = bpy.data.armatures.new("Anatomical rig")
    rig = bpy.data.objects.new("Walk rig", armature)
    scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for name, (head, tail, parent) in definition.items():
        bone = armature.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        if parent: bone.parent = armature.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    weights = json.loads((REFERENCE / "default_weights.mhw").read_text())["weights"]
    combined = {name: {} for name in definition}
    for source, rows in weights.items():
        target = combined[remap_weight(source)]
        for index, value in rows:
            if index in indices:
                index = indices[index]
                target[index] = target.get(index, 0) + value
    for name, values in combined.items():
        group = body.vertex_groups.new(name=name)
        for index, weight in values.items(): group.add([index], weight, "REPLACE")
    # The anatomical source supplies the face/neck and hands. Closed garments
    # replace the torso and legs, so no unclothed body can poke through them.
    visible_faces = []
    for face in faces:
        ids = [indices[i] for i in face]
        if min(fitted[i,2] for i in face) > 1.99 or all(
            max(combined["hand.L"].get(i,0),combined["hand.R"].get(i,0)) > .35 for i in ids
        ):
            visible_faces.append(ids)
    mesh.clear_geometry()
    mesh.from_pydata(fitted[used].tolist(), [], visible_faces)
    mesh.update()
    for poly in mesh.polygons: poly.use_smooth = True
    # clear_geometry replaces vertex data, so restore the anatomical weights.
    for name, values in combined.items():
        group = body.vertex_groups.get(name) or body.vertex_groups.new(name=name)
        for index, weight in values.items(): group.add([index],weight,"REPLACE")
    modifier = body.modifiers.new("Continuous weighted skin", "ARMATURE")
    modifier.object = rig
    modifier.use_deform_preserve_volume = True
    subdivision = body.modifiers.new("Surface continuity", "SUBSURF")
    subdivision.levels = subdivision.render_levels = 1

    def bound_mesh(name, verts, quads, mat, weights_for):
        data = bpy.data.meshes.new(name)
        data.from_pydata(verts, [], quads)
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        data.materials.append(mat)
        for face in data.polygons: face.use_smooth = True
        groups = {n: obj.vertex_groups.new(name=n) for n in definition}
        for i, v in enumerate(verts):
            for n, w in weights_for(v).items():
                if w > 0: groups[n].add([i], w, "REPLACE")
        mod = obj.modifiers.new("Same anatomical rig", "ARMATURE")
        mod.object = rig
        mod.use_deform_preserve_volume = True
        return obj

    # Closed, full jacket silhouette; fitted once and skinned with the torso.
    rings = [(1.07,.405,.32),(1.16,.44,.34),(1.35,.46,.35),(1.55,.445,.35),
             (1.76,.46,.33),(1.88,.46,.28),(1.96,.34,.21),(2.04,.15,.14)]
    jacket_v = [(rx*math.cos(i*math.tau/48), ry*math.sin(i*math.tau/48)-.015, z)
                for z,rx,ry in rings for i in range(48)]
    jacket_f = [(r*48+i,r*48+(i+1)%48,(r+1)*48+(i+1)%48,(r+1)*48+i)
                for r in range(len(rings)-1) for i in range(48)]
    jacket_f += [tuple(reversed(range(48))), tuple(range((len(rings)-1)*48,len(rings)*48))]
    bound_mesh("Full jacket", jacket_v, jacket_f, clay,
               lambda v: {"pelvis": 1-smooth((v[2]-1.18)/.50), "chest": smooth((v[2]-1.18)/.50)})
    hair_v = []
    for r in range(17):
        for i in range(64):
            angle = i*math.tau/64
            front = max(0., -math.sin(angle))
            end = 2.08 - .88*front**2
            theta = .015 + end*r/16
            hair_v.append((.445*math.sin(theta)*math.cos(angle),
                           .50*math.sin(theta)*math.sin(angle)-.03,
                           2.49+.395*math.cos(theta)))
    hair_f = [(r*64+i,r*64+(i+1)%64,(r+1)*64+(i+1)%64,(r+1)*64+i) for r in range(16) for i in range(64)]
    bound_mesh("Bob silhouette", hair_v, hair_f, hair_mat, lambda _: {"head": 1})

    def sleeve_or_trouser(side, first, second, radii, mat):
        a,b = [Vector(v) for v in definition[first+"."+side][:2]]
        c = Vector(definition[second+"."+side][1])
        vertices, weights = [], []
        for r in range(17):
            t = r/8
            u = min(1.,t) if t<=1 else t-1
            center = a.lerp(b,u) if t<=1 else b.lerp(c,u)
            axis = (b-a).lerp(c-b,smooth((t-.75)/.5)).normalized()
            cross = axis.cross(Vector((0,1,0))).normalized()
            other = axis.cross(cross).normalized()
            radius = float(np.interp(t,[0,.5,1,1.5,2],radii))
            blend = smooth((t-.7)/.6)
            for i in range(32):
                angle = i*math.tau/32
                vertices.append(list(center+radius*(cross*math.cos(angle)+other*math.sin(angle))))
                weights.append({first+"."+side:1-blend,second+"."+side:blend})
        quads = [(r*32+i,r*32+(i+1)%32,(r+1)*32+(i+1)%32,(r+1)*32+i) for r in range(16) for i in range(32)]
        # A rounded, skinned shoulder cap, not an open cylinder/socket.
        cap = len(vertices)
        vertices.append(list(a-(b-a).normalized()*radii[0]*.65))
        weights.append({first+"."+side:1})
        quads += [(cap,(i+1)%32,i) for i in range(32)]
        iterator = iter(weights)
        obj = bound_mesh(first+" garment "+side,vertices,quads,mat,lambda _: next(iterator))
        mod = obj.modifiers.new("Soft cloth surface","SUBSURF")
        mod.levels = mod.render_levels = 1
        return obj

    shoes = {}
    for side in "LR":
        sleeve_or_trouser(side,"arm","forearm",[.155,.145,.125,.11,.08],clay)
        sleeve_or_trouser(side,"thigh","shin",[.205,.205,.17,.15,.12],trousers)
        ankle = Vector(definition["foot."+side][0])
        foot_ids = [i for i in range(len(used)) if sum(combined[n+"."+side].get(i,0) for n in ("foot","toe"))>.95]
        foot_points = fitted[used][foot_ids]
        heel, toe = -float(foot_points[:,1].max()-ankle.y), -float(foot_points[:,1].min()-ankle.y)
        profiles = [(heel,.025,.055),(heel+.04,.10,.14),(0,.112,.21),(.15,.115,.13),(toe-.045,.105,.095),(toe,.01,.018)]
        shoe_v = [(ankle.x+width*math.cos(i*math.tau/32),ankle.y-forward,
                   height*(.5+.5*math.sin(i*math.tau/32)))
                  for forward,width,height in profiles for i in range(32)]
        shoe_f = [(r*32+i,r*32+(i+1)%32,(r+1)*32+(i+1)%32,(r+1)*32+i) for r in range(len(profiles)-1) for i in range(32)]
        shoe_f += [tuple(reversed(range(32))),tuple(range((len(profiles)-1)*32,len(profiles)*32))]
        shoes[side] = bound_mesh("Loafer "+side,shoe_v,shoe_f,sole_mat,lambda _: {"foot."+side:1})

    def area(name, position, power, size):
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.shape, data.size = power, "DISK", size
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.location = position
        obj.rotation_euler = (Vector((0,0,1.5))-obj.location).to_track_quat("-Z","Y").to_euler()
    area("Soft key", (4,-6,7), 650, 5)
    area("Fill", (-5,-1,4), 400, 5)
    area("Rim", (0,5,5), 500, 4)
    camera_data = bpy.data.cameras.new("Fixed orthographic camera")
    camera = bpy.data.objects.new("Fixed orthographic camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 3.40
    source = json.loads((WORK / "capture.json").read_text())
    rest = {n: (Vector(a), Vector(b)) for n,(a,b,_) in definition.items()}
    pelvis_rest = rest["pelvis"][0]
    length = sum((rest[n+".L"][1]-rest[n+".L"][0]).length for n in ("thigh","shin"))
    foot_vertices = {s: [i for i in range(len(used)) if sum(combined[n+"."+s].get(i,0) for n in ("foot","toe")) > .95] for s in "LR"}
    foot_bounds = {}
    for s in "LR":
        ankle = rest["foot."+s][0]
        points = fitted[used][foot_vertices[s]]
        foot_bounds[s] = (-float(points[:,1].max()-ankle.y), -float(points[:,1].min()-ankle.y), ankle.z)

    def orient(name, head, rotation):
        bone = rig.pose.bones[name]
        matrix = Matrix.Translation(head) @ rotation.to_4x4() @ armature.bones[name].matrix_local.to_3x3().to_4x4()
        bone.matrix = matrix
        bpy.context.view_layer.update()

    def aim(name, head, tail):
        rotation = (rest[name][1]-rest[name][0]).rotation_difference(tail-head).to_matrix()
        orient(name, head, rotation)

    def ik(hip, ankle, upper, lower):
        vector = ankle-hip
        d = vector.length
        if d >= upper+lower: raise ValueError(f"unreachable foot {d} >= {upper+lower}")
        axis = vector.normalized()
        pole = Vector((0,-1,0))
        bend = (pole-axis*pole.dot(axis)).normalized()
        along = (upper*upper-lower*lower+d*d)/(2*d)
        return hip+axis*along+bend*math.sqrt(max(0,upper*upper-along*along))

    def pose(phase, frame):
        root = pelvis_rest.copy()
        root.x += .018*math.sin(math.tau*phase)
        root.z = .13+length*.980 - .012*math.cos(2*math.tau*phase)
        pelvis_rot = Matrix.Rotation(.04*math.sin(math.tau*phase),3,"Z")
        chest_rot = Matrix.Rotation(-.035*math.sin(math.tau*phase),3,"Z")
        orient("pelvis", root, pelvis_rot)
        for name in ("chest","neck","head"):
            offset = rest[name][0]-pelvis_rest
            orient(name, root+offset, chest_rot if name=="chest" else Matrix.Identity(3))
        contacts = {}
        for side, offset in (("L",0),("R",.5)):
            u = (phase+offset)%1
            forward, height, pitch, stance, travel = foot_path(u,length,*foot_bounds[side])
            hip = root+pelvis_rot@(rest["thigh."+side][0]-pelvis_rest)
            ankle = Vector((rest["thigh."+side][0].x, -forward, height))
            knee = ik(hip,ankle,(rest["thigh."+side][1]-rest["thigh."+side][0]).length,
                      (rest["shin."+side][1]-rest["shin."+side][0]).length)
            aim("thigh."+side,hip,knee)
            aim("shin."+side,knee,ankle)
            foot_rotation = Matrix.Rotation(pitch,3,"X")
            orient("foot."+side,ankle,foot_rotation)
            toe = ankle+foot_rotation@(rest["toe."+side][0]-rest["foot."+side][0])
            orient("toe."+side,toe,foot_rotation)
            shoulder = root+chest_rot@(rest["arm."+side][0]-pelvis_rest)
            arm_direction = Vector(source["directions"]["arm."+side][frame%COUNT])
            forearm_direction = Vector(source["directions"]["forearm."+side][frame%COUNT])
            # Keep the captured swing while clearing the fitted wider jacket.
            arm_direction.x = (.20 if side=="L" else -.20)
            arm_direction.normalize()
            elbow = shoulder+arm_direction*(rest["arm."+side][1]-rest["arm."+side][0]).length
            wrist = elbow+forearm_direction*(rest["forearm."+side][1]-rest["forearm."+side][0]).length
            aim("arm."+side,shoulder,elbow)
            aim("forearm."+side,elbow,wrist)
            hand_rotation = (rest["forearm."+side][1]-rest["forearm."+side][0]).rotation_difference(wrist-elbow).to_matrix()
            orient("hand."+side,wrist,hand_rotation)
            contacts[side] = {"stance":stance,"phase":u,"pitch":pitch,"ankle":list(ankle),"toe":list(toe)}
        for bone in rig.pose.bones:
            bone.keyframe_insert("location",frame=frame+1)
            bone.keyframe_insert("rotation_quaternion",frame=frame+1)
            bone.keyframe_insert("scale",frame=frame+1)
        bpy.context.view_layer.update()
        # Audit the evaluated shoe mesh, not only the requested IK targets.
        graph = bpy.context.evaluated_depsgraph_get()
        for side in "LR":
            obj = shoes[side].evaluated_get(graph)
            sole = [list(obj.matrix_world @ obj.data.vertices[r*32+24].co) for r in range(6)]
            contacts[side]["sole"] = sole
            contacts[side]["contact"] = sole[0 if contacts[side]["pitch"]<0 else -1]
            contacts[side]["minimumZ"] = min((obj.matrix_world @ v.co).z for v in obj.data.vertices)
        return contacts, root

    for bone in rig.pose.bones: bone.rotation_mode = "QUATERNION"
    cameras = {"left":(8,0,3.1),"right":(-8,0,3.1),"up":(0,8,3.1),"down":(0,-8,3.1)}
    audit = {"frames": [], "views": {}, "strideDistance": 2*.245*length/.62,
             "legLength":length,"capture":source,"bones":{n:[list(a),list(b)] for n,(a,b) in rest.items()}}
    selected_frames = [0,8,16,24] if args.draft else range(COUNT+1)
    for frame in range(COUNT+1):
        scene.frame_set(frame+1)
        contacts, root = pose((frame%COUNT)/COUNT,frame)
        audit["frames"].append({"phase":frame/COUNT,"root":list(root),"feet":contacts,
            "bones":{n:[list(b.head),list(b.tail)] for n,b in rig.pose.bones.items()}})
    scene.frame_start, scene.frame_end = 1, COUNT
    DEST.mkdir(parents=True,exist_ok=True)
    for view, position in cameras.items():
        camera.location = position
        camera.rotation_euler = (Vector((0,0,1.40))-camera.location).to_track_quat("-Z","Y").to_euler()
        audit["views"][view] = []
        folder = WORK / view
        folder.mkdir(parents=True,exist_ok=True)
        for frame in selected_frames:
            scene.frame_set(frame+1)
            bpy.context.view_layer.update()
            points = {n:[[float(v.x)*CELL,(1-float(v.y))*CELL] for v in
                         [world_to_camera_view(scene,camera,Vector(p)) for p in endpoints]]
                      for n,endpoints in audit["frames"][frame]["bones"].items()}
            soles = {s:[[float(v.x)*CELL,(1-float(v.y))*CELL] for v in
                       [world_to_camera_view(scene,camera,Vector(p)) for p in audit["frames"][frame]["feet"][s]["sole"]]]
                     for s in "LR"}
            audit["views"][view].append({"frame":frame,"bones":points,"soles":soles})
            scene.render.filepath = str(folder / f"{frame:02}.png")
            if view=="left" and frame==0:
                # EEVEE initializes its lighting cache on the first render.
                # Warm it before recording any frame (including the seam pair).
                bpy.ops.render.render(write_still=False)
            bpy.ops.render.render(write_still=True)
            print(f"RENDERED {view} {frame+1}/{COUNT}",flush=True)
    scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(DEST / "merkel-walk.blend"),compress=True)
    write_json(WORK/"pose-audit.json",audit)


def pack():
    """Fixed-camera renders to transparent atlases; no per-frame registration."""
    from PIL import Image, ImageDraw

    audit = json.loads((WORK/"pose-audit.json").read_text())
    atlases = {name:Image.new("RGBA",(frames*CELL,4*CELL)) for name,frames in
               (("merkel-sprite.png",COUNT),("merkel-bones.png",COUNT),("merkel-audit.png",COUNT+1))}
    def downsample(image):
        # Premultiplied alpha avoids dark RGB bleeding from transparent edges.
        image = image.convert("RGBa").resize((CELL,CELL),Image.Resampling.LANCZOS).convert("RGBA")
        pixels = np.array(image)
        pixels[pixels[:,:,3]==0,:3] = 0
        return Image.fromarray(pixels)

    for row,view in enumerate(VIEWS):
        for frame in range(COUNT+1):
            original = Image.open(WORK/view/f"{frame:02}.png").convert("RGBA")
            tile = downsample(original)
            atlases["merkel-audit.png"].paste(tile,(frame*CELL,row*CELL))
            if frame==COUNT: continue
            atlases["merkel-sprite.png"].paste(tile,(frame*CELL,row*CELL))
            painter = ImageDraw.Draw(original)
            projection = audit["views"][view][frame]
            def scaled(points): return [(x*RENDER_SIZE/CELL,y*RENDER_SIZE/CELL) for x,y in points]
            for bone,points in projection["bones"].items():
                color = "#ff7166" if bone.endswith(".L") else "#53c8ff" if bone.endswith(".R") else "#ffd462"
                painter.line(scaled(points),fill=color,width=5)
                x,y = scaled(points)[0]
                painter.ellipse((x-4,y-4,x+4,y+4),fill=color)
            for side in "LR":
                points = scaled(projection["soles"][side])
                color = "#ff7166" if side=="L" else "#53c8ff"
                painter.line(points,fill=color,width=6)
                for x,y in (points[0],points[-1]):
                    painter.ellipse((x-6,y-6,x+6,y+6),outline=color,width=3)
            atlases["merkel-bones.png"].paste(downsample(original),(frame*CELL,row*CELL))
    for name,atlas in atlases.items(): atlas.save(DEST/name,optimize=True)
    sheet=Image.new("RGB",(8*CELL,4*(CELL+20)),"#e9e3d5")
    painter=ImageDraw.Draw(sheet)
    for row,view in enumerate(VIEWS):
        for column,frame in enumerate(range(0,COUNT,4)):
            tile=atlases["merkel-sprite.png"].crop((frame*CELL,row*CELL,(frame+1)*CELL,(row+1)*CELL))
            sheet.paste(tile,(column*CELL,row*(CELL+20)+20),tile)
            painter.text((column*CELL+5,row*(CELL+20)+4),f"{view} {frame:02}",fill="#1d1c19")
    sheet.save(WORK/"contact-sheet.png")
    write_json(DEST/"pose-audit.json",audit)
    artifacts = [*atlases,"pose-audit.json","merkel-walk.blend"]
    manifest = {
        "schemaVersion":1,"status":"candidate-unapproved","scope":"merkel-four-view-3d-motion-study",
        "movementAuthority":"one weighted 3D rig; analytic contact-constrained leg IK; periodic CMU left-arm swing mirrored at half-cycle",
        "appearance":"grey proportion study, not a finished or approved Merkel likeness",
        "playbackFrames":COUNT,"inspectionPoints":COUNT+1,"cellSize":CELL,
        "durationSeconds":audit["capture"]["duration"],"recommendedFps":26,
        "directions":list(VIEWS),"rows":{view:i for i,view in enumerate(VIEWS)},
        "runtimeIsolation":"preview-only; game continues using archived stable sprites",
        "sourceHashes":SOURCE_HASHES,"bvhSha256":audit["capture"]["bvhSha256"],
        "artifacts":{name:digest(DEST/name) for name in artifacts},
    }
    write_json(DEST/"manifest.json",manifest)
    print(f"Baked {COUNT} unique frames + independently rendered closure, four views -> {DEST}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inspect",action="store_true")
    parser.add_argument("--blender",default="C:/Program Files/Blender Foundation/Blender 5.2/blender.exe")
    parser.add_argument("--render",action="store_true")
    parser.add_argument("--draft",action="store_true")
    parser.add_argument("--pack-only",action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else None)
    for name,expected in SOURCE_HASHES.items():
        if digest(REFERENCE/name)!=expected: raise ValueError(f"source changed: {name}")
    WORK.mkdir(parents=True,exist_ok=True)
    if args.inspect: inspect()
    elif args.render: render_blender(args)
    elif args.pack_only: pack()
    else:
        write_json(WORK/"capture.json",capture())
        command = [args.blender,"-b","--factory-startup","--python-exit-code","1","--python",str(Path(__file__).resolve()),"--","--render"]
        if args.draft: command.append("--draft")
        subprocess.run(command,check=True)
        if not args.draft: pack()


if __name__ == "__main__":
    main()
