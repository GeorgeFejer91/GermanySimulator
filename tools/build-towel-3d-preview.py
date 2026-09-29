"""Preview-only human towel pedestrians built from the pinned MakeHuman body."""
import importlib.util
import json
import math
import struct
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/sprite-sources/reference/makehuman-walk'
POSES = json.loads((ROOT / 'assets/sprite-sources/reference/neutral-walk/pose-audit.json').read_text())['frames']
OUT = ROOT / 'assets/models/towel-pedestrians'
OUT.mkdir(parents=True, exist_ok=True)
spec = importlib.util.spec_from_file_location('walk_math', ROOT / 'tools/build-merkel-3d-pilot.py')
motion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(motion)


def fit(points, scale):
    points = np.asarray(points)
    return np.stack((points[..., 0]*.11*scale, -points[..., 2]*.11*scale,
                     (points[..., 1]+8.1676)*.11*scale), axis=-1)


def material(name, color, roughness=.82, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return mat


def merge_walk(path):
    """Blender 4.1 exports object actions separately; combine and zero times."""
    data = path.read_bytes()
    size, chunk_type = struct.unpack_from('<II', data, 12)
    assert chunk_type == 0x4E4F534A
    doc = json.loads(data[20:20+size])
    clips = doc.pop('animations')
    assert clips and all(c['name'].startswith('Walk') for c in clips)
    walk = {'name':'Walk', 'channels':[], 'samplers':[]}
    for clip in clips:
        offset = len(walk['samplers'])
        walk['samplers'].extend(clip['samplers'])
        walk['channels'].extend({**ch, 'sampler':ch['sampler']+offset} for ch in clip['channels'])
    doc['animations'] = [walk]
    for mat in doc['materials']:
        if mat['name'] == 'aged human skin texture':
            pbr = mat['pbrMetallicRoughness']
            assert 'baseColorTexture' in pbr
            pbr['baseColorFactor'] = [.66,.66,.66,1]
    encoded = json.dumps(doc,separators=(',',':')).encode()
    encoded += b' '*(-len(encoded)%4)
    binary = bytearray(data[20+size:])
    for accessor_id in {s['input'] for s in walk['samplers']}:
        accessor = doc['accessors'][accessor_id]
        view = doc['bufferViews'][accessor['bufferView']]
        base = 8+view.get('byteOffset',0)+accessor.get('byteOffset',0)
        first = struct.unpack_from('<f',binary,base)[0]
        for i in range(accessor['count']):
            at = base+i*4
            struct.pack_into('<f',binary,at,struct.unpack_from('<f',binary,at)[0]-first)
    path.write_bytes(struct.pack('<III',0x46546C67,2,20+len(encoded)+len(binary))+
                     struct.pack('<II',len(encoded),chunk_type)+encoded+binary)


def make_actor(kind):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    man = kind == 'man'
    scale = .98 if man else .93
    vertices, faces, skeleton, joints = motion.load_mesh()
    # MakeHuman's own CC0 older male/female target reshapes the visible body.
    # Keep the neutral joint locations so the verified contact walk remains
    # grounded; the original vertex weights deform each character's new shape.
    target = SOURCE/'targets'/('caucasian-male-old.target' if man else 'caucasian-female-old.target')
    for line in target.read_text().splitlines():
        if line and not line.startswith('#'):
            parts = line.split()
            vertices[int(parts[0])] += [float(value) for value in parts[1:4]]
    motion.fit = lambda value: fit(value, scale)
    definition = motion.rig_definition(joints, skeleton)
    fitted = fit(vertices,scale)
    used = sorted({i for face in faces for i in face})
    index = {old:new for new,old in enumerate(used)}
    rest = {name:(Vector(a),Vector(b)) for name,(a,b,_) in definition.items()}

    skin = material('aged human skin texture',(1,1,1))
    image_name = ('old_lightskinned_male_diffuse.png' if man else
                  'old_lightskinned_female_diffuse.png')
    image = bpy.data.images.load(str(SOURCE/'skins'/image_name))
    image.pack()
    texture = skin.node_tree.nodes.new('ShaderNodeTexImage')
    texture.image = image
    skin.node_tree.links.new(texture.outputs['Color'],
                             skin.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    shirt = material('blue cotton polo' if man else 'coral cotton polo',
                     (.045,.23,.42) if man else (.64,.20,.16))
    trim = material('polo collar',(.025,.13,.25) if man else (.42,.105,.10))
    shorts = material('sand walking shorts',(.47,.35,.24) if man else (.52,.39,.28))
    socks = material('white walking socks',(.81,.79,.72))
    sole = material('sandal rubber sole',(.11,.09,.075) if man else (.055,.075,.12))
    strap = material('sandal leather',(.30,.19,.11) if man else (.075,.13,.22))
    brass = material('small brass buckle',(.61,.48,.28),.38,.45)
    dark = material('eyewear',(.045,.045,.043))
    hair = material('brown hair' if man else 'silver grey hair',
                    (.23,.16,.105) if man else (.51,.51,.49))
    towel_a = material('blue beach towel' if man else 'red beach towel',
                       (.035,.29,.60) if man else (.68,.05,.09))
    towel_b = material('yellow towel stripe' if man else 'white towel stripe',
                       (.80,.62,.10) if man else (.90,.86,.78))

    armature = bpy.data.armatures.new('Human anatomical skeleton')
    rig = bpy.data.objects.new('Human walk rig',armature)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for name,(a,b,parent) in definition.items():
        bone = armature.edit_bones.new(name)
        bone.head,bone.tail = a,b
        if parent: bone.parent = armature.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')

    mesh = bpy.data.meshes.new('Continuous MakeHuman basemesh topology')
    mesh.from_pydata(fitted[used].tolist(),[],[[index[i] for i in face] for face in faces])
    mesh.update()
    uv_coords, face_uv, reading_body = [], [], False
    for line in (SOURCE/'base.obj').read_text().splitlines():
        if line.startswith('vt '):
            uv_coords.append([float(value) for value in line.split()[1:3]])
        elif line.startswith('g '):
            reading_body = line.strip() == 'g body'
        elif reading_body and line.startswith('f '):
            face_uv.append([int(value.split('/')[1])-1 for value in line.split()[1:]])
    assert len(face_uv) == len(mesh.polygons)
    uv_layer = mesh.uv_layers.new(name='MakeHuman anatomical UV')
    for poly, ids in zip(mesh.polygons,face_uv):
        for loop, uv_id in zip(poly.loop_indices,ids):
            uv_layer.data[loop].uv = uv_coords[uv_id]
    body = bpy.data.objects.new('Continuous human body, face and hands',mesh)
    bpy.context.collection.objects.link(body)
    for mat in (skin,shirt,shorts,socks): mesh.materials.append(mat)
    weights = json.loads((SOURCE/'default_weights.mhw').read_text())['weights']
    combined = {name:{} for name in definition}
    for source_name,rows in weights.items():
        dest = combined[motion.remap_weight(source_name)]
        for old,weight in rows:
            if old in index:
                vertex=index[old]
                dest[vertex]=dest.get(vertex,0)+weight
    for name,values in combined.items():
        group=body.vertex_groups.new(name=name)
        for vertex,weight in values.items(): group.add([vertex],weight,'REPLACE')
    for poly in mesh.polygons:
        ids=list(poly.vertices)
        z=sum(mesh.vertices[i].co.z for i in ids)/len(ids)/scale
        dominant=max(definition,key=lambda name:sum(combined[name].get(i,0) for i in ids))
        mat=0
        if dominant in ('chest','pelvis') and .99<z<1.59: mat=1
        elif dominant.startswith('arm.') and z>1.29: mat=1
        elif dominant=='pelvis' and z<=.99: mat=2
        elif dominant.startswith('thigh.') and z>.65: mat=2
        elif dominant.startswith(('shin.','foot.','toe.')) and z<.31: mat=3
        poly.material_index=mat
        poly.use_smooth=True
    deform=body.modifiers.new('Continuous weighted human skin','ARMATURE')
    deform.object=rig
    deform.use_deform_preserve_volume=True

    def bind(obj,name,mat,bone):
        obj.name=name
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
        obj.data.materials.append(mat)
        for poly in obj.data.polygons: poly.use_smooth=True
        group=obj.vertex_groups.new(name=bone)
        group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
        mod=obj.modifiers.new('Follow anatomical bone','ARMATURE')
        mod.object=rig
        return obj

    def ellipsoid(name,at,radii,mat,bone):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=Vector(at)*scale)
        obj=bpy.context.object
        obj.scale=Vector(radii)*scale
        return bind(obj,name,mat,bone)

    def cyl(name,at,radius,depth,mat,bone,rotation=None):
        bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=radius*scale,depth=depth*scale,
                                            location=Vector(at)*scale)
        obj=bpy.context.object
        if rotation: obj.rotation_euler=rotation
        return bind(obj,name,mat,bone)

    def cube(name,at,dimensions,mat,bone,rotation=None):
        bpy.ops.mesh.primitive_cube_add(size=1,location=Vector(at)*scale)
        obj=bpy.context.object
        obj.dimensions=Vector(dimensions)*scale
        if rotation: obj.rotation_euler=rotation
        return bind(obj,name,mat,bone)

    cube('Polo placket',(0,-.112,1.46),(.017,.014,.09),socks,'chest')
    for sign in (-1,1):
        cube('Polo collar',(sign*.055,-.092,1.535),(.09,.023,.042),trim,'chest',
             (0,0,sign*.26))
        hip=rest['thigh.L' if sign>0 else 'thigh.R'][0]/scale
        ellipsoid('Shorts pocket seam',(hip.x*1.42,-.04,.88),(.012,.035,.065),shorts,'pelvis')

    for side in 'LR':
        ankle=rest['foot.'+side][0]/scale
        x,y=ankle.x,ankle.y
        ellipsoid('Sandal sole '+side,(x,y-.075,.032),(.092,.167,.022),sole,'foot.'+side)
        for j,forward in enumerate((-.105,-.185)):
            cube('Sandal upper strap '+side+str(j),(x,y+forward,.074),(.17,.034,.018),strap,'foot.'+side)
        cube('Sandal heel strap '+side,(x,y+.02,.105),(.15,.023,.018),strap,'foot.'+side)
        cube('Sandal buckle '+side,(x+.087,y-.105,.082),(.014,.028,.014),brass,'foot.'+side)

    if man:
        straw=material('straw sun hat',(.60,.47,.27))
        band=material('dark hat band',(.13,.10,.075))
        cyl('Straw brim',(0,-.008,1.825),.192,.013,straw,'head')
        cyl('Straw crown',(0,.002,1.871),.115,.096,straw,'head')
        cyl('Hat band',(0,.002,1.843),.117,.021,band,'head')
        for sign in (-1,1):
            ellipsoid('Moustache half',(sign*.026,-.170,1.672),(.038,.016,.010),hair,'head')
            ellipsoid('Sunglasses lens',(sign*.052,-.178,1.744),(.048,.011,.029),dark,'head')
        cube('Sunglasses bridge',(0,-.184,1.748),(.026,.012,.009),brass,'head')
    else:
        cap=material('patterned travel cap',(.32,.32,.31))
        ellipsoid('Silver hair behind ears',(0,.024,1.785),(.094,.058,.059),hair,'head')
        ellipsoid('Sun cap crown',(0,0,1.831),(.107,.092,.049),cap,'head')
        ellipsoid('Sun cap visor',(0,-.121,1.808),(.105,.078,.009),cap,'head')
        for sign in (-1,1):
            bpy.ops.mesh.primitive_torus_add(major_segments=24,minor_segments=6,
                major_radius=.040*scale,minor_radius=.004*scale,
                location=Vector((sign*.052,-.185,1.738))*scale)
            obj=bpy.context.object
            obj.rotation_euler.x=math.pi/2
            bind(obj,'Glasses rim',dark,'head')
            ellipsoid('Silver temple hair',(sign*.088,-.004,1.762),(.020,.041,.034),hair,'head')
        cube('Glasses bridge',(0,-.188,1.741),(.027,.010,.008),dark,'head')
        for i in range(9):
            angle=i*2.39996
            ellipsoid('Cap woven fleck',(.075*math.cos(angle),-.006+.06*math.sin(angle),1.861),
                      (.007,.004,.003),socks,'head')

    hand=rest['hand.R'][1]/scale
    tx,ty,tz=hand.x,hand.y-.05,hand.z+.025
    for i in range(5):
        cyl('Rolled reservation towel',(tx,ty+i*.038,tz),.066,.039,
            towel_a if i%2 else towel_b,'hand.R',(math.pi/2,0,0))
    for radius,mat,offset in ((.065,towel_a,-.032),(.048,towel_b,-.038),(.027,towel_a,-.044)):
        cyl('Rolled towel end',(tx,ty+offset,tz),radius,.008,mat,'hand.R',(math.pi/2,0,0))
    cube('Towel retaining band',(tx,ty+.045,tz+.066),(.11,.028,.010),strap,'hand.R')

    for bone in rig.pose.bones: bone.rotation_mode='QUATERNION'
    for fi,pose in enumerate(POSES):
        bpy.context.scene.frame_set(fi+1)
        for name in definition:
            head=Vector(pose['bones'][name][0])*scale
            tail=Vector(pose['bones'][name][1])*scale
            rot=(rest[name][1]-rest[name][0]).rotation_difference(tail-head).to_matrix()
            rig.pose.bones[name].matrix=(Matrix.Translation(head)@rot.to_4x4()@
                                         armature.bones[name].matrix_local.to_3x3().to_4x4())
            bpy.context.view_layer.update()
        for bone in rig.pose.bones:
            bone.keyframe_insert('location',frame=fi+1)
            bone.keyframe_insert('rotation_quaternion',frame=fi+1)
            bone.keyframe_insert('scale',frame=fi+1)
    rig.animation_data.action.name='Walk'
    scene=bpy.context.scene
    scene.frame_start,scene.frame_end,scene.render.fps=1,33,26
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'{kind}.glb'),export_format='GLB',
                              export_yup=True,export_animations=True,export_frame_range=True,
                              export_force_sampling=False,export_nla_strips=False,
                              export_image_format='AUTO')
    merge_walk(OUT/f'{kind}.glb')
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'{kind}.blend'),compress=True)
    print(f'{kind}: {len(used)} body vertices, {len(faces)} body faces, {len(POSES)} poses')


if __name__=='__main__':
    assert len(POSES)==33 and all(len(f['bones'])==18 for f in POSES)
    kind=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'man'
    assert kind in ('man','woman')
    make_actor(kind)
