#!/usr/bin/env python3
"""Shared, appearance-free 3D walk guide. Never a final character silhouette.

Reuse the existing contact solver/capture, but use uncaricatured MakeHuman
joint proportions and plain mannequin geometry. All appearance stays outside.
"""
import argparse
import importlib.util
import json
import math
from pathlib import Path
import subprocess
import sys

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets/sprite-sources/reference/neutral-walk"
WORK = ROOT / "output/neutral-walk"
VIEWS = ("left", "right", "up", "down")
COUNT, CELL = 32, 128
spec = importlib.util.spec_from_file_location("walk_math", ROOT/"tools/build-merkel-3d-pilot.py")
motion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(motion)


def neutral_fit(points):
    points = np.asarray(points)
    return np.stack((points[..., 0]*.11, -points[..., 2]*.11,
                     (points[..., 1]+8.1676)*.11), axis=-1)


def render():
    import bpy
    from mathutils import Matrix, Vector
    from bpy_extras.object_utils import world_to_camera_view

    _, _, skeleton, joints = motion.load_mesh()
    # Deliberately bypass the old character-specific fit, hair and clothing.
    motion.fit = neutral_fit
    definition = motion.rig_definition(joints, skeleton)
    rest = {name: (Vector(a), Vector(b)) for name, (a,b,_) in definition.items()}
    source = json.loads((WORK/"capture.json").read_text())
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    bpy.context.preferences.filepaths.save_version = 0
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = True
    scene.render.fps = 26
    scene.view_settings.view_transform = "Standard"
    scene.world.color = (.32,.32,.32)

    data = bpy.data.armatures.new("Shared anatomical joints")
    rig = bpy.data.objects.new("Neutral walk rig", data)
    scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for name,(a,b,parent) in definition.items():
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = a,b
        if parent: bone.parent = data.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    material = bpy.data.materials.new("Neutral matte grey")
    material.diffuse_color = (.47,.48,.49,1)
    material.use_nodes = True
    material.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = (.47,.48,.49,1)
    material.node_tree.nodes.get("Principled BSDF").inputs["Roughness"].default_value = .85

    def bind(obj, name, bone):
        obj.name = name
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        obj.data.materials.append(material)
        for face in obj.data.polygons: face.use_smooth = True
        group = obj.vertex_groups.new(name=bone)
        group.add(list(range(len(obj.data.vertices))), 1, "REPLACE")
        mod = obj.modifiers.new("Shared bone", "ARMATURE")
        mod.object = rig
        return obj

    def ellipsoid(name, center, scale, bone, rotation=None):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, location=center)
        obj = bpy.context.object
        obj.scale = scale
        if rotation is not None: obj.rotation_euler = rotation
        return bind(obj, name, bone)

    pelvis = rest["pelvis"][0]
    shoulders = (rest["arm.L"][0]+rest["arm.R"][0])/2
    torso_center = pelvis.lerp(shoulders,.55)
    ellipsoid("Neutral torso", torso_center, (.19,.105,(shoulders.z-pelvis.z)*.53), "chest")
    ellipsoid("Neutral pelvis", pelvis, (.15,.10,.125), "pelvis")
    head_center = rest["head"][0].lerp(rest["head"][1], .55)
    ellipsoid("Featureless head", head_center, (.083,.095,.115), "head")
    for name,(a,b) in rest.items():
        if name in ("pelvis","chest","head") or name.startswith(("foot","toe")): continue
        radius = .06 if name.startswith("thigh") else .045 if name.startswith("shin") else .032
        if name.startswith("hand"): radius = .038
        ellipsoid("Guide "+name, (a+b)/2, (radius,radius,(b-a).length*.55), name,
                  (b-a).to_track_quat("Z","Y").to_euler())
        if name.startswith(("shin","forearm")):
            ellipsoid("Joint "+name,a,(radius,radius,radius),name)
    shoes = {}
    heel, toe = -.06, .19
    for side in "LR":
        ankle = rest["foot."+side][0]
        profiles = [(heel,.012,.025),(heel+.02,.047,.075),(0,.049,.115),(.10,.05,.07),(toe-.02,.043,.048),(toe,.01,.012)]
        vertices = [(ankle.x+width*math.cos(i*math.tau/32), ankle.y-forward,
                     height*(.5+.5*math.sin(i*math.tau/32))) for forward,width,height in profiles for i in range(32)]
        faces = [(r*32+i,r*32+(i+1)%32,(r+1)*32+(i+1)%32,(r+1)*32+i) for r in range(5) for i in range(32)]
        faces += [tuple(reversed(range(32))),tuple(range(160,192))]
        mesh = bpy.data.meshes.new("Contact foot "+side)
        mesh.from_pydata(vertices, [], faces)
        obj = bpy.data.objects.new("Contact foot "+side, mesh)
        scene.collection.objects.link(obj)
        shoes[side] = bind(obj,obj.name,"foot."+side)

    def orient(name, head, rotation):
        rig.pose.bones[name].matrix = Matrix.Translation(head) @ rotation.to_4x4() @ data.bones[name].matrix_local.to_3x3().to_4x4()
        bpy.context.view_layer.update()

    def aim(name,a,b):
        orient(name,a,(rest[name][1]-rest[name][0]).rotation_difference(b-a).to_matrix())

    def ik(hip,ankle,upper,lower):
        axis = ankle-hip
        distance = axis.length
        if distance >= upper+lower: raise ValueError("unreachable neutral ankle")
        axis.normalize()
        forward = Vector((0,-1,0))
        bend = (forward-axis*axis.dot(forward)).normalized()
        along = (upper*upper-lower*lower+distance*distance)/(2*distance)
        return hip+axis*along+bend*math.sqrt(upper*upper-along*along)

    length = sum((rest[n+".L"][1]-rest[n+".L"][0]).length for n in ("thigh","shin"))
    ankle_height = rest["foot.L"][0].z
    audit = {"frames":[],"views":{},"legLength":length,"strideDistance":2*.245*length/.62,
             "capture":source,"bones":{n:[list(a),list(b)] for n,(a,b) in rest.items()},
             "appearanceAuthority":"none; guide silhouettes must not constrain avatar artwork"}
    for bone in rig.pose.bones: bone.rotation_mode = "QUATERNION"
    for frame in range(COUNT+1):
        scene.frame_set(frame+1)
        phase = (frame%COUNT)/COUNT
        root = Vector((.014*math.sin(phase*math.tau),pelvis.y,ankle_height+length*.98-.008*math.cos(phase*math.tau*2)))
        orient("pelvis",root,Matrix.Rotation(.04*math.sin(phase*math.tau),3,"Z"))
        orient("chest",root+rest["chest"][0]-pelvis,Matrix.Rotation(-.035*math.sin(phase*math.tau),3,"Z"))
        for name in ("neck","head"): orient(name,root+rest[name][0]-pelvis,Matrix.Identity(3))
        feet = {}
        for side,offset in (("L",0),("R",.5)):
            u = (phase+offset)%1
            forward,z,pitch,stance,_ = motion.foot_path(u,length,heel,toe,ankle_height)
            hip = root+rest["thigh."+side][0]-pelvis
            ankle = Vector((rest["foot."+side][0].x,rest["foot."+side][0].y-forward,z))
            knee = ik(hip,ankle,(rest["thigh."+side][1]-rest["thigh."+side][0]).length,(rest["shin."+side][1]-rest["shin."+side][0]).length)
            aim("thigh."+side,hip,knee)
            aim("shin."+side,knee,ankle)
            rotation = Matrix.Rotation(pitch,3,"X")
            orient("foot."+side,ankle,rotation)
            orient("toe."+side,ankle+rotation@(rest["toe."+side][0]-rest["foot."+side][0]),rotation)
            shoulder = root+rest["arm."+side][0]-pelvis
            upper = Vector(source["directions"]["arm."+side][frame%COUNT])
            upper.x = .12 if side=="L" else -.12
            upper.normalize()
            lower = Vector(source["directions"]["forearm."+side][frame%COUNT])
            elbow = shoulder+upper*(rest["arm."+side][1]-rest["arm."+side][0]).length
            wrist = elbow+lower*(rest["forearm."+side][1]-rest["forearm."+side][0]).length
            aim("arm."+side,shoulder,elbow)
            aim("forearm."+side,elbow,wrist)
            orient("hand."+side,wrist,(rest["forearm."+side][1]-rest["forearm."+side][0]).rotation_difference(wrist-elbow).to_matrix())
            feet[side] = {"stance":stance,"phase":u,"pitch":pitch}
        for bone in rig.pose.bones:
            for property in ("location","rotation_quaternion","scale"): bone.keyframe_insert(property,frame=frame+1)
        graph = bpy.context.evaluated_depsgraph_get()
        for side in "LR":
            shoe = shoes[side].evaluated_get(graph)
            sole = [list(shoe.matrix_world @ shoe.data.vertices[r*32+24].co) for r in range(6)]
            feet[side].update({"sole":sole,"contact":sole[0 if feet[side]["pitch"]<0 else -1],
                              "minimumZ":min((shoe.matrix_world @ v.co).z for v in shoe.data.vertices)})
        audit["frames"].append({"phase":frame/COUNT,"root":list(root),"feet":feet,
                               "bones":{n:[list(b.head),list(b.tail)] for n,b in rig.pose.bones.items()}})

    for name,position,power in (("Key",(3,-4,5),400),("Fill",(-3,-1,3),250),("Rim",(0,4,4),300)):
        light = bpy.data.lights.new(name,"AREA")
        light.energy,light.shape,light.size = power,"DISK",4
        obj = bpy.data.objects.new(name,light)
        scene.collection.objects.link(obj)
        obj.location = position
        obj.rotation_euler = (Vector((0,0,1))-obj.location).to_track_quat("-Z","Y").to_euler()
    camera = bpy.data.objects.new("Shared orthographic camera",bpy.data.cameras.new("Shared orthographic camera"))
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.data.type,camera.data.ortho_scale = "ORTHO",2.25
    for view,position in zip(VIEWS,((6,0,2.1),(-6,0,2.1),(0,6,2.1),(0,-6,2.1))):
        camera.location = position
        camera.rotation_euler = (Vector((0,0,.95))-camera.location).to_track_quat("-Z","Y").to_euler()
        (WORK/view).mkdir(parents=True,exist_ok=True)
        audit["views"][view] = []
        for frame in range(COUNT+1):
            scene.frame_set(frame+1)
            bpy.context.view_layer.update()
            def project(points):
                return [[float(p.x)*CELL,(1-float(p.y))*CELL] for p in (world_to_camera_view(scene,camera,Vector(v)) for v in points)]
            audit["views"][view].append({"frame":frame,"bones":{n:project(v) for n,v in audit["frames"][frame]["bones"].items()},
                "soles":{s:project(audit["frames"][frame]["feet"][s]["sole"]) for s in "LR"}})
            scene.render.filepath = str(WORK/view/f"{frame:02}.png")
            if view=="left" and frame==0: bpy.ops.render.render(write_still=False)
            bpy.ops.render.render(write_still=True)
        print("RENDERED "+view,flush=True)
    scene.frame_start,scene.frame_end = 1,COUNT
    scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(DEST/"neutral-walk.blend"),compress=True)
    motion.write_json(DEST/"pose-audit.json",audit)


def pack():
    from PIL import Image,ImageDraw
    audit = json.loads((DEST/"pose-audit.json").read_text())
    atlas = Image.new("RGBA",(COUNT*CELL,4*CELL))
    bones = Image.new("RGBA",atlas.size)
    closure = Image.new("RGBA",((COUNT+1)*CELL,4*CELL))
    for row,view in enumerate(VIEWS):
        for i in range(COUNT+1):
            source = Image.open(WORK/view/f"{i:02}.png").convert("RGBa")
            tile = source.resize((CELL,CELL),Image.Resampling.LANCZOS).convert("RGBA")
            pixels = np.array(tile)
            pixels[pixels[:,:,3]==0,:3] = 0
            tile = Image.fromarray(pixels)
            closure.paste(tile,(i*CELL,row*CELL))
            if i<COUNT:
                atlas.paste(tile,(i*CELL,row*CELL))
                draw = ImageDraw.Draw(tile)
                projection = audit["views"][view][i]
                for name,points in projection["bones"].items():
                    color = "#ff7166" if name.endswith(".L") else "#53c8ff" if name.endswith(".R") else "#ffd462"
                    draw.line([tuple(v) for v in points],fill=color,width=1)
                for side in "LR":
                    points = projection["soles"][side]
                    color = "#ff7166" if side=="L" else "#53c8ff"
                    draw.line([tuple(v) for v in points],fill=color,width=1)
                    for x,y in (points[0],points[-1]): draw.ellipse((x-1,y-1,x+1,y+1),fill=color)
                bones.paste(tile,(i*CELL,row*CELL))
    atlas.save(DEST/"guide.png",optimize=True)
    bones.save(DEST/"guide-bones.png",optimize=True)
    closure.save(DEST/"guide-closure.png",optimize=True)
    Image.open(WORK/"left/00.png").save(DEST/"pose-left.png")
    sheet = Image.new("RGB",(8*CELL,4*(CELL+20)),"#e9e3d5")
    draw = ImageDraw.Draw(sheet)
    for row,view in enumerate(VIEWS):
        for col,i in enumerate(range(0,COUNT,4)):
            tile = atlas.crop((i*CELL,row*CELL,(i+1)*CELL,(row+1)*CELL))
            sheet.paste(tile,(col*CELL,row*(CELL+20)+20),tile)
            draw.text((col*CELL+4,row*(CELL+20)+4),f"{view} {i:02}",fill="#1d1c19")
    sheet.save(DEST/"contact-sheet.png")
    artifacts = ["guide.png","guide-bones.png","guide-closure.png","pose-left.png","neutral-walk.blend","pose-audit.json","contact-sheet.png"]
    motion.write_json(DEST/"manifest.json",{"schemaVersion":1,"status":"motion-guide-not-avatar-art","avatarIndependent":True,
        "appearanceAuthority":"original character artwork; never the neutral mannequin silhouette",
        "skeleton":"uniformly scaled uncaricatured MakeHuman joints", "playbackFrames":COUNT,"inspectionPoints":COUNT+1,
        "cellSize":CELL,"recommendedFps":26,"durationSeconds":audit["capture"]["duration"],"directions":list(VIEWS),
        "rows":{v:i for i,v in enumerate(VIEWS)},"sourceHashes":motion.SOURCE_HASHES,"bvhSha256":audit["capture"]["bvhSha256"],
        "movementAuthority":"shared analytic contact-constrained leg IK plus filtered CMU arm swing; not full-body mocap",
        "runtimeIsolation":"offline shared reference, preview PNG only; no game integration",
        "artifacts":{n:motion.digest(DEST/n) for n in artifacts}})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--render",action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else None)
    WORK.mkdir(parents=True,exist_ok=True)
    DEST.mkdir(parents=True,exist_ok=True)
    for name,expected in motion.SOURCE_HASHES.items():
        if motion.digest(motion.REFERENCE/name)!=expected: raise ValueError("changed source "+name)
    if args.render: render()
    else:
        motion.write_json(WORK/"capture.json",motion.capture())
        subprocess.run(["C:/Program Files/Blender Foundation/Blender 5.2/blender.exe","-b","--factory-startup","--python-exit-code","1","--python",str(Path(__file__).resolve()),"--","--render"],check=True)
        pack()


if __name__ == "__main__": main()
