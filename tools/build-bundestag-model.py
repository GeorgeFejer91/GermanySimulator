"""Original Blender Reichstag-inspired game landmark. No imported mesh or textures.

Run Blender --background --python tools/build-bundestag-model.py -- --render
Authoring axes: Z-up/-Y-front. Export: grounded Y-up/+Z-front.
Architectural references and deliberate simplifications: adjacent LICENSES.md.
"""
from collections import defaultdict
from pathlib import Path
from math import sin, cos, pi, sqrt
import argparse
import hashlib
import json
import struct
import subprocess
import sys
import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/models/bundestag"
PARTS = defaultdict(lambda: [[], []])
ASSEMBLY = "Historic shell"


def geometry(material, vertices, faces):
    vs, fs = PARTS[(ASSEMBLY, material)]
    offset = len(vs)
    vs.extend(vertices)
    fs.extend(tuple(offset + i for i in face) for face in faces)


def box(material, center, size):
    x, y, z = center
    a, b, c = (v / 2 for v in size)
    geometry(material, [(x+dx*a,y+dy*b,z+dz*c) for dx,dy,dz in
        [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]],
        [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])


def cylinder(material, center, radius, height, n=12, upper=None):
    upper = radius if upper is None else upper
    x,y,z = center
    vertices = [(x+r*cos(i*2*pi/n),y+r*sin(i*2*pi/n),z+dz)
                for r,dz in [(radius,-height/2),(upper,height/2)] for i in range(n)]
    geometry(material, vertices, [tuple(reversed(range(n))),tuple(range(n,2*n))] +
             [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)])


def rod(material, a, b, radius=.1, n=6):
    a,b = Vector(a),Vector(b)
    axis = (b-a).normalized()
    tangent = axis.cross(Vector((0,0,1)))
    if tangent.length < .01: tangent = axis.cross(Vector((0,1,0)))
    tangent.normalize()
    bitangent = axis.cross(tangent)
    vertices = [tuple(p+radius*(tangent*cos(i*2*pi/n)+bitangent*sin(i*2*pi/n)))
                for p in (a,b) for i in range(n)]
    geometry(material,vertices,[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)] +
             [tuple(reversed(range(n))),tuple(range(n,2*n))])


def ring(material,radius,z,thickness=.09,n=48):
    vertices=[((radius+thickness*cos(j*pi/2))*cos(i*2*pi/n),
               (radius+thickness*cos(j*pi/2))*sin(i*2*pi/n),z+thickness*sin(j*pi/2))
              for i in range(n) for j in range(4)]
    geometry(material,vertices,[(i*4+j,((i+1)%n)*4+j,((i+1)%n)*4+(j+1)%4,i*4+(j+1)%4)
                                for i in range(n) for j in range(4)])


def prism(material,points,front,back):
    n=len(points)
    geometry(material,[(x,y,z) for y in (front,back) for x,z in points],
             [tuple(reversed(range(n))),tuple(range(n,2*n))] +
             [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)])


def facade_box(material,origin,u,z,width,height,depth,inset=0,side=False,inward=None):
    x,y=origin
    inset *= inward if inward is not None else (-1 if (x>0 if side else y>0) else 1)
    if side: box(material,(x+inset,y+u,z),(depth,width,height))
    else: box(material,(x+u,y+inset,z),(width,depth,height))


def window(origin,u,z,width,height,side=False,arched=False,inward=None):
    """Recessed glazing with projecting jambs, sill and narrow mullions."""
    if inward is None: inward=-1 if (origin[0]>0 if side else origin[1]>0) else 1
    fb=lambda mat,du,dz,w,h,d,ins: facade_box(mat,origin,u+du,z+dz,w,h,d,ins,side,inward)
    fb("Window",0,0,width,height,.16,.47)
    for du in (-width/2-.18,width/2+.18): fb("Trim",du,0,.36,height+.35,.68,.08)
    fb("Trim",0,-height/2-.22,width+.9,.42,1.0,-.08)
    fb("Trim",0,height/2+.12,width+.6,.28,.65,.06)
    fb("Metal",0,0,.11,height,.13,.34)
    fb("Metal",0,0,width,.09,.13,.34)
    if arched:
        r=width/2;cz=z+height/2
        pts=[(u,cz)]+[(u+r*cos(i*pi/12),cz+r*sin(i*pi/12)) for i in range(13)]
        raw=[(origin[0]+px,origin[1]+inward*.47,pz) for px,pz in pts]
        if side: raw=[(origin[0]+inward*.47,origin[1]+px,pz) for px,pz in pts]
        geometry("Window",raw,[(0,i,i+1) for i in range(1,13)])
        for i in range(8):
            a,b=i*pi/8,(i+1)*pi/8
            pts=[(u+r*cos(a),cz+r*sin(a)),(u+r*cos(b),cz+r*sin(b)),
                 (u+(r+.42)*cos(b),cz+(r+.42)*sin(b)),(u+(r+.42)*cos(a),cz+(r+.42)*sin(a))]
            vs=[(origin[0]+px,origin[1]+inward*dy,pz) for dy in (-.22,.44) for px,pz in pts]
            if side: vs=[(origin[0]+inward*dy,origin[1]+px,pz) for dy in (-.22,.44) for px,pz in pts]
            geometry("Trim",vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
        fb("Trim",0,height/2+r,.55,.85,.78,-.04)


def wall(origin,width,bays,side=False):
    fb=lambda mat,u,z,w,h,d,ins=0: facade_box(mat,origin,u,z,w,h,d,ins,side)
    fb("Stone",0,12,width,24,1.8,1.8)
    for z,h in [(2.45,4.9),(15.45,2.4),(22.5,3)]: fb("Stone",0,z,width,h,1,.25)
    pitch=width/bays
    for i in range(bays+1):
        u=-width/2+i*pitch
        fb("Stone",u,13.1,1.8,16.4,1.1,.18)
        fb("Trim",u,12.5,.48,15.4,.35,-.5)
        fb("Trim",u,20.5,.85,.45,.55,-.42)
    for i in range(bays):
        u=-width/2+(i+.5)*pitch
        window(origin,u,8.5,3,5.6,side,True)
        window(origin,u,18.45,3,3.4,side)
        window(origin,u,2.15,2.25,1.7,side)
        fb("Trim",u,20.65,3.95,.32,.95,-.14)
        if not side:
            prism("Trim",[(origin[0]+u-2,20.7),(origin[0]+u+2,20.7),(origin[0]+u,21.75)],origin[1]-.5,origin[1]+.1)
    for z,d,h in [(4.7,1.7,.5),(15,1.4,.4),(22,1.7,.48),(23.4,2.1,.65),(24.1,2.7,.4)]: fb("Trim",0,z,width+.9,h,d,-.05)
    for i in range(5): fb("StoneShadow",0,.7+i*.82,width,.065,.035,-.28)
    for i in range(int(width/3.1)): fb("StoneShadow",-width/2+(i+.5)*3.1,2.4,.055,4.5,.035,-.28)


def balustrade(x,y,w,d,z):
    box("Trim",(x,y,z),(w,d,.55))
    box("Trim",(x,y,z+1.8),(w+.4,d+.35,.4))
    n=max(2,int(w/1.85))
    for i in range(n): cylinder("Trim",(x-w/2+.6+i*(w-1.2)/(n-1),y,z+.85),.22,1.5,6,upper=.19)


def statue(x,y,z,s=1):
    # Original abstract draped silhouettes, not reproductions of the actual figures.
    cylinder("Trim",(x,y,z+.85*s),.5*s,1.7*s,8,upper=.34*s)
    cylinder("Trim",(x,y,z+1.95*s),.3*s,.55*s,8,upper=.24*s)
    rod("Trim",(x-.42*s,y,z+1.4*s),(x+.37*s,y-.12*s,z+1.15*s),.19*s)


def tower_windows(origin,side=False,inward=1):
    for u in (-8,-2.6,2.6,8): facade_box("Stone",origin,u,30,2.65,7.2,.85,.65,side,inward)
    for z,h in ((27,1.4),(33.35,1.0)): facade_box("Stone",origin,0,z,18.5,h,.85,.65,side,inward)
    for u in (-5.2,0,5.2): window(origin,u,29.9,2.25,3.6,side,True,inward)


def build():
    global ASSEMBLY
    bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
    specs={"Stone":((.50,.465,.39,1),.91,0),"Trim":((.64,.59,.49,1),.86,0),
           "StoneShadow":((.23,.215,.18,1),.98,0),"Window":((.12,.19,.22,1),.28,.18),
           "Roof":((.24,.27,.27,1),.78,.2),"Metal":((.33,.37,.38,1),.39,.65),
           "DomeGlass":((.36,.57,.61,.22),.16,.08)}
    materials={}
    for name,(color,rough,metal) in specs.items():
        mat=bpy.data.materials.new("Bundestag_"+name);mat.diffuse_color=color;mat.use_nodes=True
        bsdf=mat.node_tree.nodes.get("Principled BSDF")
        for key,value in [("Base Color",color),("Roughness",rough),("Metallic",metal),("Alpha",color[3])]: bsdf.inputs[key].default_value=value
        if name=="DomeGlass": mat.surface_render_method="DITHERED"
        materials[name]=mat
    box("Stone",(0,0,1.1),(137,88,2.2))
    box("Stone",(0,0,12.8),(44,80,23.4));box("Roof",(0,0,24.2),(44,80,.5))
    for x in (-43,43):
        for y in (-31,31):
            box("Stone",(x,y,12.6),(40,18,23.6));box("Roof",(x,y,24.35),(39.5,22,.4))
        box("Stone",(x,0,2.9),(34,40,1.4));box("Roof",(x,0,3.7),(32,35,.25))
        for y in (-17.4,17.4):
            box("Window",(x,y,16),(34,.2,14))
            for j in range(11): box("Trim",(x-16+j*3.2,y-.15,16),(.22,.4,14))
            for z in (9.2,13.8,18.4,23): box("Trim",(x,y-.15,z),(34,.4,.22))
    for x in (-62,62):
        box("Stone",(x,0,12.6),(8,86,23.6));box("Roof",(x,0,24.4),(10.8,85,.35))
    for x in (-35,35): wall((x,-42.5),29,5)
    wall((0,42.4),95,15)
    for x in (-67,67): wall((x,0),65,10,True)
    for x in (-36,36):
        balustrade(x,-42.7,28,.9,24.5)
        for xx in (x-10,x,x+10): statue(xx,-42.7,26.3,.8)
    ASSEMBLY="Four corner towers"
    for x in (-58,58):
        for y in (-33,33):
            box("Stone",(x,y,15),(18.4,21.4,30))
            for z,w,d,h in [(4.8,21.5,24,.7),(24.3,22,24.5,.7),(26,20.9,23.6,.7),(34,22,24.8,.75),(35,23,25.5,.4)]: box("Trim",(x,y,z),(w,d,h))
            box("Stone",(x,y,30),(18.4,21.4,9));box("Roof",(x,y,35.2),(20,22.5,.3))
            for yy in (y-11.7,y+11.7):
                inward=1 if yy<y else -1
                window((x,yy),0,9.2,5.5,7.8,False,True,inward);window((x,yy),0,20,5.5,3.2,False,True,inward)
                tower_windows((x,yy),inward=inward)
                for dx in (-8.4,8.4):
                    box("Trim",(x+dx,yy-.12,14.6),(1,1,17.8));box("Trim",(x+dx,yy-.14,23.5),(1.55,1.2,.7))
            for xx in (x-10.4,x+10.4): tower_windows((xx,y),True,1 if xx<x else -1)
            for dx in (-9,9):
                for dy in (-10.5,10.5):
                    box("Trim",(x+dx,y+dy,35.75),(1.15,1.15,.85));statue(x+dx,y+dy,25.1,1.15)
    ASSEMBLY="West portico and stairs"
    for step in range(16): box("Trim",(0,-48.2-step*.37,(16-step)*.155),(39+step*.3,10.4-step*.43,(16-step)*.31))
    box("Trim",(0,-43.5,4.8),(39,9,1.2));box("Window",(0,-40.65,14.5),(32,.2,18))
    for x in range(-15,16,3): box("Metal",(x,-40.82,14.5),(.1,.13,18))
    for z in (7,11,15,19,23): box("Metal",(0,-40.85,z),(32,.15,.12))
    for x in (-15,-9,-3,3,9,15):
        box("Trim",(x,-45.3,5.8),(2.5,2.5,1.6));cylinder("Trim",(x,-45.3,6.9),1.15,.65,16)
        cylinder("Stone",(x,-45.3,15),.92,15.6,20,upper=.77)
        for z,r in [(7.35,1.06),(22.5,1.08),(22.9,1.25)]: cylinder("Trim",(x,-45.3,z),r,.35,16)
        for dx in (-.78,.78):
            for dy in (-.78,.78): cylinder("Trim",(x+dx,-45.3+dy,23.25),.35,.7,8,upper=.43)
        box("Trim",(x,-45.3,23.8),(2.55,2.55,.55))
    for z,w,d,h in [(24.45,38.4,7.8,.75),(25.4,39,8,1.2),(26.25,40,8.4,.55)]: box("Trim",(0,-43,z),(w,d,h))
    prism("Stone",[(-20,26.4),(20,26.4),(0,33.5)],-47.4,-39.3)
    prism("StoneShadow",[(-16.8,27),(16.8,27),(0,32.7)],-47.47,-47.32)
    rod("Trim",(-20.5,-47.65,26.6),(0,-47.65,33.8),.3,4);rod("Trim",(0,-47.65,33.8),(20.5,-47.65,26.6),.3,4)
    for x in (-11,-8,-5,0,5,8,11): statue(x,-47.78,27.05,1.1 if x else 1.5)
    for x in (-18.4,18.4):
        box("Trim",(x,-41,29),(3.1,4,4.6));box("Trim",(x,-41,31.5),(4,4.5,.55));statue(x,-41,31.8,1.6)
    ASSEMBLY="Modern glass dome"
    cylinder("Roof",(0,0,24.7),20.5,.8,72);ring("Metal",20.1,25.05,.2)
    base=25.05;height=22.4
    profile=[(20*sqrt(max(0,1-(i/18)**2)),base+height*i/18) for i in range(18)]+[(4.5,base+height)]
    segments=72
    vertices=[(r*cos(i*2*pi/segments),r*sin(i*2*pi/segments),z) for r,z in profile for i in range(segments)]
    faces=[(j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i)
           for j in range(3,len(profile)-1) for i in range(segments)]
    geometry("DomeGlass",vertices,faces)
    for i in range(24):
        t=i*2*pi/24
        for (r,z),(rr,zz) in zip(profile,profile[1:]): rod("Metal",(r*cos(t),r*sin(t),z),(rr*cos(t),rr*sin(t),zz),.12,4)
    for r,z in profile[1:18]: ring("Metal",r,z,.085)
    ring("Metal",4.5,base+height,.18)
    cylinder("Metal",(0,0,33),1.8,15.6,36,upper=6.1)
    for z in (27,29,31,33,35,37,39,40.7): ring("Trim",1.8+(z-25.2)/15.6*4.3,z,.075,36)
    for offset in (0,pi):
        path=[]
        for i in range(145):
            f=i/144;z=25.2+15.6*f;r=18.2-4.5*f*f;t=f*2*pi*1.6+offset
            path.extend([(r*cos(t),r*sin(t),z),((r-1.45)*cos(t),(r-1.45)*sin(t),z)])
        geometry("Roof",path,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(144)])
        for i in range(0,144,3): rod("Metal",tuple(Vector(path[i*2])+Vector((0,0,1))),tuple(Vector(path[(i+3)*2])+Vector((0,0,1))),.06,4)
    ASSEMBLY="Roof detail"
    for x in (-60,60):
        for y in (-17,-5,7,19):
            box("Metal",(x,y,24.85),(5.5,7.2,.5));box("Window",(x,y,25.25),(4.8,6.4,.35))
            for yy in (-2,0,2): box("Metal",(x,y+yy,25.5),(5,.09,.1))
    for x in (-36,36):
        for y in (-31,31):
            for xx in range(-15,16,3): box("Metal",(x+xx,y,24.6),(.045,19,.055))
    source=[]
    ys=[v[1] for vs,_ in PARTS.values() for v in vs];center_y=(min(ys)+max(ys))/2
    xs=[v[0] for vs,_ in PARTS.values() for v in vs];center_x=(min(xs)+max(xs))/2
    for (assembly,material),(vs,fs) in PARTS.items():
        mesh=bpy.data.meshes.new(assembly+"_"+material);mesh.from_pydata([(x-center_x,y-center_y,z) for x,y,z in vs],[],fs)
        mesh.validate();mesh.update()
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
        if material in ("DomeGlass","Metal"):
            for polygon in mesh.polygons: polygon.use_smooth=True
        obj=bpy.data.objects.new(assembly+"_"+material,mesh);bpy.context.collection.objects.link(obj)
        obj.data.materials.append(materials[material]);obj["original_project_geometry"]=True;source.append(obj)
    bpy.context.scene["asset_notes"]="Original game landmark informed by modern Reichstag exterior; not a survey, replica or historical reconstruction."
    return source


def preview():
    scene=bpy.context.scene;scene.render.engine="CYCLES";scene.cycles.samples=8;scene.cycles.use_denoising=True
    scene.render.resolution_x=1200;scene.render.resolution_y=840;scene.render.resolution_percentage=100
    scene.world.color=(.45,.45,.45);scene.view_settings.view_transform="AgX"
    scene.world.use_nodes=True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value=(.35,.35,.35,1)
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value=.5
    for pos,energy,size in [((-65,-95,160),1000000,95),((80,30,105),500000,85)]:
        bpy.ops.object.light_add(type="AREA",location=pos);bpy.context.object.data.energy=energy;bpy.context.object.data.size=size
    bpy.ops.object.camera_add(location=(145,-188,139));cam=bpy.context.object;scene.camera=cam;cam.data.type="ORTHO";cam.data.ortho_scale=184
    cam.rotation_euler=(Vector((0,0,17))-cam.location).to_track_quat("-Z","Y").to_euler()
    scene.render.image_settings.file_format="PNG";scene.render.filepath=str(OUT/"preview.png");bpy.ops.render.render(write_still=True)
    cam.location=(0,-205,58);cam.rotation_euler=(Vector((0,0,18))-cam.location).to_track_quat("-Z","Y").to_euler();cam.data.ortho_scale=155
    scene.render.filepath=str(OUT/"preview-front.png");bpy.ops.render.render(write_still=True)


def main():
    parser=argparse.ArgumentParser();parser.add_argument("--render",action="store_true")
    parser.add_argument("--gltf-transform",help="Path to glTF Transform 4.2.1 CLI JavaScript entry point; requires Node")
    opts=parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    OUT.mkdir(parents=True,exist_ok=True);source=build()
    if opts.render: preview()
    bpy.ops.object.select_all(action="DESELECT")
    for obj in source: obj.select_set(True)
    bpy.context.view_layer.objects.active=source[0]
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"bundestag.blend"),compress=True)
    # ponytail: seven batches cover this single landmark; no decoder or LOD framework.
    groups=[(mat,[o for o in source if o.data.materials[0]==mat]) for mat in list(bpy.data.materials)]
    for mat,members in groups:
        if not members: continue
        bpy.ops.object.select_all(action="DESELECT")
        for obj in members: obj.select_set(True)
        bpy.context.view_layer.objects.active=members[0]
        if len(members)>1: bpy.ops.object.join()
        members[0].name=mat.name
    bpy.ops.object.select_all(action="DESELECT")
    export_objects=[o for o in bpy.context.scene.objects if o.type=="MESH"]
    for obj in export_objects: obj.select_set(True)
    points=[obj.matrix_world@Vector(v) for obj in export_objects for v in obj.bound_box]
    lo=[min(p[i] for p in points) for i in range(3)];hi=[max(p[i] for p in points) for i in range(3)]
    assert abs(lo[2])<.001 and abs(lo[0]+hi[0])<.001 and abs(lo[1]+hi[1])<.001,(lo,hi)
    assert 130<hi[0]-lo[0]<145 and 90<hi[1]-lo[1]<110 and 45<hi[2]<50,(lo,hi)
    bpy.ops.export_scene.gltf(filepath=str(OUT/"bundestag.glb"),export_format="GLB",use_selection=True,
        export_yup=True,export_texcoords=False,export_normals=True,export_animations=False,export_cameras=False,export_lights=False)
    if opts.gltf_transform:
        optimized=OUT/"bundestag-optimized.glb"
        subprocess.run(["node",opts.gltf_transform,"optimize",str(OUT/"bundestag.glb"),str(optimized),
            "--compress","quantize","--flatten","false","--join","false","--instance","false",
            "--palette","false","--simplify","false","--texture-compress","false"],check=True)
        optimized.replace(OUT/"bundestag.glb")
    data=(OUT/"bundestag.glb").read_bytes();n=struct.unpack_from("<I",data,12)[0];gltf=json.loads(data[20:20+n])
    triangles=sum(gltf["accessors"][p["indices"]]["count"]//3 for m in gltf["meshes"] for p in m["primitives"])
    assert len(gltf["materials"])==7 and not gltf.get("images") and triangles<70000
    stats={"generator":"Blender "+bpy.app.version_string,"source":"tools/build-bundestag-model.py","original":True,
        "axis":"Y-up / +Z entrance","pivot":"ground-centered bounds","bounds":{"min":[lo[0],lo[2],-hi[1]],"max":[hi[0],hi[2],-lo[1]]},
        "triangles":triangles,"meshes":len(gltf["meshes"]),"materials":len(gltf["materials"]),"textures":0,"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest(),
        "optimization":"glTF Transform 4.2.1: dedup, weld, prune, quantize; no simplification or decoder" if opts.gltf_transform else "raw Blender export"}
    (OUT/"model-info.json").write_text(json.dumps(stats,indent=2)+"\n",encoding="utf-8");print(json.dumps(stats))


if __name__=="__main__": main()
