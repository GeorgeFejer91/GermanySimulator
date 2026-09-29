"""Build preview-only towel pedestrians from the shared neutral walk poses.

Run with Blender 4.1+: blender -b --factory-startup --python tools/build-towel-3d-preview.py
The pose source is the verified character-independent guide, never a game loader.
"""

import json
import math
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
POSES = json.loads((ROOT / "assets/sprite-sources/reference/neutral-walk/pose-audit.json").read_text())['frames']
OUT = ROOT / "assets/models/towel-pedestrians"
OUT.mkdir(parents=True, exist_ok=True)
FPS = 26


def material(name, color, roughness=0.85, metal=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metal
    return mat


def sphere(name, at, size, mat, parent=None, segments=16, rings=10):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=at)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
        obj.location = at
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def cylinder(name, at, radius, depth, mat, parent=None, vertices=24, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=at)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
        obj.location = at
    if rotation:
        obj.rotation_euler = rotation
    return obj


def ring(name, at, radius, mat, parent=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=24, minor_segments=6,
                                    location=at, major_radius=radius, minor_radius=.006)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.x = math.pi / 2
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
        obj.location = at
    return obj


def box(name, at, size, mat, parent=None, rotation=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
        obj.location = at
    if rotation:
        obj.rotation_euler = rotation
    return obj


def empty(name):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    return obj


def bone(name, mat, width, depth=None):
    obj = sphere(name, (0, 0, 0), (width, depth or width, 1), mat)
    obj.rotation_mode = 'QUATERNION'
    return obj


def pose_bone(obj, a, b, frame, overlap=0.018):
    direction = b - a
    obj.location = (a + b) / 2
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction)
    obj.scale.z = direction.length / 2 + overlap
    for path in ('location', 'rotation_quaternion', 'scale'):
        obj.keyframe_insert(data_path=path, frame=frame, group='Walk')


def place(obj, xyz, frame, rotation=None):
    obj.location = xyz
    obj.keyframe_insert(data_path='location', frame=frame, group='Walk')
    if rotation is not None:
        obj.rotation_quaternion = rotation
        obj.keyframe_insert(data_path='rotation_quaternion', frame=frame, group='Walk')


def merge_walk(path):
    """Blender 4.1 exports each animated object as one clip; combine their channels."""
    data = path.read_bytes()
    json_size, json_type = struct.unpack_from('<II', data, 12)
    assert json_type == 0x4E4F534A
    doc = json.loads(data[20:20 + json_size])
    assert doc['animations'] and all(a['name'].startswith('Walk') for a in doc['animations'])
    clips = doc.pop('animations')
    walk = {'name': 'Walk', 'channels': [], 'samplers': []}
    for clip in clips:
        offset = len(walk['samplers'])
        walk['samplers'].extend(clip['samplers'])
        walk['channels'].extend({**channel, 'sampler': channel['sampler'] + offset}
                                for channel in clip['channels'])
    doc['animations'] = [walk]
    encoded = json.dumps(doc, separators=(',', ':')).encode('utf-8')
    encoded += b' ' * ((-len(encoded)) % 4)
    binary = bytearray(data[20 + json_size:])
    seen = set()
    for sampler in walk['samplers']:
        index = sampler['input']
        if index in seen:
            continue
        seen.add(index)
        accessor = doc['accessors'][index]
        view = doc['bufferViews'][accessor['bufferView']]
        base = 8 + view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
        start = struct.unpack_from('<f', binary, base)[0]
        for i in range(accessor['count']):
            at = base + i * 4
            value = struct.unpack_from('<f', binary, at)[0]
            struct.pack_into('<f', binary, at, value - start)
    header = struct.pack('<III', 0x46546C67, 2, 20 + len(encoded) + len(binary))
    path.write_bytes(header + struct.pack('<II', len(encoded), json_type) + encoded + binary)


def make_actor(kind):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)
    man = kind == 'man'
    prefix = 'Liegenreservierer' if man else 'Handtuchhoheit'
    skin = material('warm skin', (0.70, 0.43, 0.29) if man else (0.78, 0.51, 0.38))
    shadow = material('face shadow', (0.47, 0.27, 0.20))
    hair = material('brown hair', (0.24, 0.16, 0.11)) if man else material('silver hair', (0.63, 0.62, 0.61))
    shirt = material('blue polo' if man else 'coral polo', (0.035, 0.28, 0.50) if man else (0.67, 0.20, 0.17))
    shirt_dark = material('polo trim', (0.02, 0.14, 0.27) if man else (0.47, 0.10, 0.10))
    shorts = material('sand cotton shorts', (0.54, 0.39, 0.24) if man else (0.58, 0.43, 0.32))
    socks = material('thick white socks', (0.84, 0.82, 0.75))
    sole = material('sandal rubber', (0.13, 0.095, 0.077) if man else (0.045, 0.072, 0.13))
    straps = material('sandal leather', (0.34, 0.21, 0.14) if man else (0.08, 0.14, 0.26))
    metal = material('buckle brass', (0.70, 0.53, 0.24), 0.34, 0.55)
    ink = material('dark ink', (0.055, 0.052, 0.048))
    towel_a = material('towel blue' if man else 'towel red', (0.035, 0.32, 0.68) if man else (0.74, 0.055, 0.10))
    towel_b = material('towel yellow' if man else 'towel white', (0.86, 0.67, 0.10) if man else (0.91, 0.87, 0.80))

    pieces = {}
    pieces['pelvis'] = bone('Pelvis', shorts, .20 if man else .18, .135)
    pieces['torso'] = bone('Polo torso', shirt, .245 if man else .21, .145)
    pieces['belly'] = sphere('Round belly' if man else 'Waist', (0, 0, 0), (.27, .18, .17) if man else (.19, .15, .15), shirt)
    pieces['neck'] = bone('Neck', skin, .066)
    for side in ('L', 'R'):
        pieces[f'thigh.{side}'] = bone(f'Shorts and thigh {side}', skin, .095 if man else .082)
        pieces[f'short.{side}'] = bone(f'Shorts cuff {side}', shorts, .108 if man else .093)
        pieces[f'shin.{side}'] = bone(f'Lower leg {side}', skin, .068 if man else .059)
        pieces[f'sock.{side}'] = bone(f'Calf sock {side}', socks, .072 if man else .063)
        pieces[f'knee.{side}'] = sphere(f'Knee {side}', (0, 0, 0), (.082, .075, .082), skin)
        pieces[f'arm.{side}'] = bone(f'Upper arm {side}', shirt, .085 if man else .072)
        pieces[f'forearm.{side}'] = bone(f'Forearm {side}', skin, .060 if man else .052)
        pieces[f'elbow.{side}'] = sphere(f'Elbow {side}', (0, 0, 0), (.064, .063, .064), skin)
        pieces[f'hand.{side}'] = sphere(f'Hand {side}', (0, 0, 0), (.072, .042, .092), skin)
        foot = empty(f'Foot.{side}')
        foot.rotation_mode = 'QUATERNION'
        pieces[f'foot.{side}'] = foot
        sphere(f'White sock toe {side}', (0, -.125, -.014), (.082, .142, .055), socks, foot)
        sphere(f'Sandal sole {side}', (0, -.137, -.070), (.093, .161, .027), sole, foot)
        for y in (-.075, -.19):
            box(f'Sandal strap {side} {y}', (0, y, .027), (.18, .044, .032), straps, foot)
        box(f'Heel strap {side}', (0, .006, -.006), (.17, .027, .045), straps, foot)
        box(f'Buckle {side}', (.091, -.08, .04), (.018, .038, .018), metal, foot)

    head = empty('Head and headwear')
    pieces['head'] = head
    sphere('Face', (0, -.004, .105), (.17 if man else .151, .149, .205), skin, head)
    sphere('Back hair', (0, .068, .13), (.163 if man else .155, .125, .18), hair, head)
    for sign in (-1, 1):
        sphere('Ear', (sign*.166, -.005, .065), (.037, .034, .065), skin, head)
        sphere('Brow', (sign*.071, -.145, .173), (.065, .022, .023), hair, head)
        sphere('Eye', (sign*.07, -.151, .128), (.035, .017, .023), ink, head)
    sphere('Nose', (0, -.178, .070), (.043, .056, .065), skin, head)
    if man:
        for sign in (-1, 1):
            sphere('Moustache', (sign*.046, -.173, .018), (.060, .025, .026), hair, head)
            sphere('Sunglass lens', (sign*.076, -.163, .135), (.075, .018, .048), ink, head)
        box('Sunglass bridge', (0, -.173, .15), (.055, .018, .014), metal, head)
        straw = material('straw hat', (0.67, 0.51, 0.27))
        hatband = material('black hatband', (0.13, 0.11, 0.09))
        cylinder('Straw brim', (0, 0, .293), .275, .024, straw, head)
        cylinder('Straw crown', (0, .016, .369), .184, .15, straw, head)
        cylinder('Dark hat band', (0, .016, .321), .187, .032, hatband, head)
    else:
        for sign in (-1, 1):
            ring('Glasses rim', (sign*.074, -.169, .137), .062, ink, head)
            sphere('Silver side curl', (sign*.119, .04, .215), (.058, .076, .073), hair, head)
        box('Glasses bridge', (0, -.173, .144), (.038, .014, .013), ink, head)
        sphere('Lips', (0, -.152, -.018), (.049, .018, .015), shirt_dark, head)
        cap = material('patterned sun cap', (0.33, 0.32, 0.31))
        sphere('Sun cap crown', (0, .014, .306), (.181, .152, .100), cap, head)
        sphere('Sun cap visor', (0, -.137, .272), (.17, .105, .019), cap, head)
        for i in range(11):
            a = i * 2.39996
            sphere('Cap fabric fleck', (.12*math.cos(a), -.01+.09*math.sin(a), .341), (.014, .009, .006), socks, head, segments=8, rings=6)

    # Shirt placket and collar keep the polo recognizable from the original pixels.
    chest_detail = empty('Polo details')
    pieces['detail'] = chest_detail
    for sign in (-1, 1):
        box('Open polo collar', (sign*.074, -.158, .287), (.10, .025, .08), shirt_dark, chest_detail, rotation=(0, 0, sign*.25))
    box('Polo placket', (0, -.159, .24), (.023, .012, .105), socks, chest_detail)
    box('Shorts belt', (0, -.125, .006), (.36 if man else .32, .03, .029), straps, chest_detail)
    if man:
        box('Shorts pocket flap', (-.22, -.08, -.11), (.12, .035, .10), shorts, chest_detail)
    else:
        # Small tan side pouch echoes the source sprite without hiding the towel.
        sphere('Hip pouch', (-.225, -.015, -.105), (.10, .075, .115), shorts, chest_detail)

    towel = empty('Rolled reservation towel')
    pieces['towel'] = towel
    # Its cylinder points forward, exposing a visible rolled end from the front.
    for i in range(6):
        y = -.15 + i*.066
        cylinder('Towel stripe', (0, y, 0), .109, .068, towel_a if i%3 else towel_b, towel, rotation=(math.pi/2, 0, 0))
    for radius, mat, y in ((.107, towel_a, -.189), (.077, towel_b, -.195), (.048, towel_a, -.201), (.022, towel_b, -.207)):
        cylinder('Rolled towel spiral', (0, y, 0), radius, .011, mat, towel, rotation=(math.pi/2, 0, 0))
    box('Towel securing band', (0, -.035, .112), (.18, .065, .015), straps, towel)

    # Similarity retarget: one fixed character scale preserves the guide's IK
    # segment lengths and grounded contact trajectory at every pose.
    scale = .93 if man else .88

    def point(v):
        return Vector(v) * scale

    for fi, frame_data in enumerate(POSES):
        frame = fi + 1
        bpy.context.scene.frame_set(frame)
        raw = frame_data['bones']
        b = {name: (point(pair[0]), point(pair[1])) for name, pair in raw.items()}
        root = point(frame_data['root'])
        # The torso and head use the guide's root movement; clothing proportions remain character-owned.
        pose_bone(pieces['pelvis'], *b['pelvis'], frame, .025)
        pose_bone(pieces['torso'], b['pelvis'][1], b['chest'][1], frame, .04)
        place(pieces['belly'], root + Vector((0, -.037, .255*scale)), frame)
        pose_bone(pieces['neck'], *b['neck'], frame, .012)
        place(head, (b['head'][0] + b['head'][1])/2 - Vector((0, 0, .067*scale)), frame)
        place(chest_detail, root + Vector((0, 0, .18*scale)), frame)
        place(towel, root + Vector((.23 if man else .205, -.28, .22*scale)), frame)
        for side in ('L', 'R'):
            thigh_a, thigh_b = b[f'thigh.{side}']
            shin_a, shin_b = b[f'shin.{side}']
            pose_bone(pieces[f'thigh.{side}'], thigh_a, thigh_b, frame)
            pose_bone(pieces[f'short.{side}'], thigh_a, thigh_a.lerp(thigh_b, .37), frame)
            pose_bone(pieces[f'shin.{side}'], shin_a, shin_b, frame)
            pose_bone(pieces[f'sock.{side}'], shin_a.lerp(shin_b, .52), shin_b, frame)
            place(pieces[f'knee.{side}'], shin_a, frame)
            arm_a, arm_b = b[f'arm.{side}']
            forearm_a, forearm_b = b[f'forearm.{side}']
            if side == 'R':
                # Towel hand is carried close to the trunk while the free arm swings.
                arm_b = arm_a + Vector((-.20*scale, -.07, -.20*scale))
                forearm_a = arm_b
                forearm_b = root + Vector((.10, -.49, .17*scale))
            pose_bone(pieces[f'arm.{side}'], arm_a, arm_b, frame)
            pose_bone(pieces[f'forearm.{side}'], forearm_a, forearm_b, frame)
            place(pieces[f'elbow.{side}'], forearm_a, frame)
            place(pieces[f'hand.{side}'], forearm_b, frame)
            foot = pieces[f'foot.{side}']
            ankle = b[f'foot.{side}'][0]
            toe = b[f'toe.{side}'][1]
            direction = toe - ankle
            place(foot, ankle, frame, Vector((0, -1, 0)).rotation_difference(direction))

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = len(POSES)
    scene.render.fps = FPS
    for obj in bpy.data.objects:
        if obj.animation_data and obj.animation_data.action:
            obj.animation_data.action.name = 'Walk'
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / f'{kind}.glb'), export_format='GLB',
        export_yup=True, export_animations=True, export_frame_range=True,
        export_force_sampling=False, export_nla_strips=False,
        export_image_format='NONE',
    )
    merge_walk(OUT / f'{kind}.glb')
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / f'{kind}.blend'))
    print(f'{prefix}: {len(bpy.data.objects)} objects, {len(POSES)} poses')


if __name__ == '__main__':
    assert len(POSES) == 33 and all(len(f['bones']) == 18 for f in POSES)
    # Blender 4.1's glTF exporter caches datablocks across exports; use one process per actor.
    kind = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'man'
    assert kind in ('man', 'woman')
    make_actor(kind)
