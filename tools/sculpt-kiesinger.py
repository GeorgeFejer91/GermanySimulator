"""Original Kiesinger bronze sculpture, authored in Blender; no imported mesh.

Run: blender --background --python tools/sculpt-kiesinger.py
The editable sculpt stays in the .blend; a decimated, material-joined GLB is
exported with shoe-level origin, six-unit height, Y up, and front toward +Z.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets/models/kiesinger"
PREVIEW = ROOT / "output/kiesinger-sculpt"
DEST.mkdir(parents=True, exist_ok=True)
PREVIEW.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
sculpt = bpy.data.collections.new("Kiesinger — editable original sculpture")
bpy.context.scene.collection.children.link(sculpt)


def material(name, color, metallic=.7, roughness=.47):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Metallic"].default_value = metallic
    p.inputs["Roughness"].default_value = roughness
    return m


BRONZE = material("Warm weathered bronze", (.20, .174, .118), .55, .63)
COAT = material("Bronze with green patina", (.156, .17, .126), .55, .65)
HAIR = material("Combed bronze hair", (.217, .205, .150), .56, .64)
RECESS = material("Oxidized bronze recesses", (.071, .084, .066), .56, .61)


def collect(o, name, mat):
    o.name = name
    for c in list(o.users_collection):
        c.objects.unlink(o)
    sculpt.objects.link(o)
    o.data.materials.clear()
    o.data.materials.append(mat)
    return o


def smooth(o):
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def ell(name, pos, scale, mat=BRONZE, segments=32, rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=pos)
    o = collect(bpy.context.object, name, mat)
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return smooth(o)


def mesh(name, verts, faces, mat):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    o = bpy.data.objects.new(name, data)
    sculpt.objects.link(o)
    o.data.materials.append(mat)
    return smooth(o)


def tube(name, points, radius, mat, resolution=3):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.resolution_u = 10
    data.bevel_depth = radius
    data.bevel_resolution = resolution
    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(points)-1)
    for bp, pt in zip(spline.bezier_points, points):
        bp.co = pt
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    o = bpy.data.objects.new(name, data)
    sculpt.objects.link(o)
    o.data.materials.append(mat)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target="MESH")
    o.select_set(False)
    return smooth(o)


def loft(name, rows, mat, sides=40):
    # Rows: z, x-center, y-center, horizontal radius, depth radius.
    verts = []
    for z, x, y, rx, ry in rows:
        for i in range(sides):
            a = i*2*math.pi/sides
            verts.append((x+rx*math.cos(a), y+ry*math.sin(a), z))
    faces = []
    for j in range(len(rows)-1):
        for i in range(sides):
            a = j*sides+i
            b = j*sides+(i+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces.extend([tuple(reversed(range(sides))), tuple((len(rows)-1)*sides+i for i in range(sides))])
    return mesh(name, verts, faces, mat)


def join(parts, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in parts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    bpy.context.object.name = name
    return bpy.context.object


def fuse(parts, name, voxel, mat):
    o = join(parts, name)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    mod = o.modifiers.new("Sculpt volumes fused", "REMESH")
    mod.mode = "VOXEL"
    mod.voxel_size = voxel
    mod.use_smooth_shade = True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod = o.modifiers.new("Sculpt surface relaxation", "SMOOTH")
    mod.factor = .56
    mod.iterations = 4
    bpy.ops.object.modifier_apply(modifier=mod.name)
    o.data.materials.clear()
    o.data.materials.append(mat)
    return smooth(o)


def patch(name, points, mat, thickness=.012):
    o = mesh(name, points, [tuple(range(len(points)))], mat)
    mod = o.modifiers.new("Cast thickness", "SOLIDIFY")
    mod.thickness = thickness
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod = o.modifiers.new("Soft cast edge", "BEVEL")
    mod.width = .008
    mod.segments = 3
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return o


# A quiet contrapposto: right foot forward, left hand carrying a folded dossier,
# right hand bent at the jacket button. The pose is original, not photo-traced.
for side, x, y in [("L", -.29, .025), ("R", .29, -.10)]:
    shoe = ell(side+" polished Oxford shoe", (x,y-.13,.145), (.24,.43,.145), COAT)
    tube(side+" welt", [(x-.18,y-.34,.075),(x,y-.51,.075),(x+.18,y-.34,.075)],.017,RECESS)
    leg = loft(side+" tailored trouser", [(.22,x,y,.185,.23),(.50,x,y,.20,.225),
        (1.12,x-.025,y+.045,.23,.215),(1.6,x-.01,y+.015,.22,.235),
        (2.14,x*.9,.02,.27,.29),(2.66,x*.75,.02,.285,.31),(2.85,x*.7,.02,.25,.27)],COAT)
    mod=leg.modifiers.new("Tailoring", "SUBSURF");mod.levels=2
    bpy.context.view_layer.objects.active=leg;bpy.ops.object.modifier_apply(modifier=mod.name)
    tube(side+" pressed front crease",[(x,y-.21,.35),(x-.012,y-.213,1.15),(x*.87,-.257,2.33)],.009,BRONZE)

body = loft("Single breasted suit sculpt",[(2.57,0,.03,.49,.29),(2.70,0,.03,.54,.32),
    (3.07,-.015,.025,.51,.31),(3.42,-.025,.035,.47,.28),
    (3.82,-.035,.035,.53,.325),(4.18,-.04,.05,.64,.335),
    (4.42,-.025,.065,.66,.31),(4.58,0,.07,.52,.255),
    (4.68,0,.065,.23,.21)],COAT)
sub=body.modifiers.new("Sculpted suit silhouette", "SUBSURF");sub.levels=2
bpy.context.view_layer.objects.active=body;bpy.ops.object.modifier_apply(modifier=sub.name)
neck=ell("Neck",(0,.065,4.78),(.212,.21,.235))

patch("Shirt front",[(-.23,-.186,4.66),(.23,-.186,4.66),(.26,-.29,4.32),(.04,-.326,3.7),(-.27,-.27,4.28)],HAIR)
patch("Left notched lapel",[(-.21,-.225,4.65),(-.56,-.22,4.46),(-.43,-.29,4.26),(-.49,-.298,4.22),(-.04,-.344,3.55),(-.16,-.32,4.16)],COAT)
patch("Right notched lapel",[(.19,-.22,4.65),(.51,-.23,4.46),(.39,-.306,4.27),(.46,-.305,4.23),(-.04,-.344,3.55),(.13,-.322,4.16)],COAT)
patch("Left shirt collar",[(-.19,-.228,4.7),(-.02,-.253,4.58),(-.15,-.309,4.36),(-.26,-.238,4.58)],HAIR)
patch("Right shirt collar",[(.19,-.228,4.7),(.02,-.253,4.58),(.14,-.309,4.36),(.25,-.238,4.58)],HAIR)
ell("Tie knot",(0,-.295,4.51),(.065,.04,.085),RECESS)
patch("Narrow 1960s necktie",[(-.04,-.316,4.45),(.047,-.316,4.45),(.071,-.35,3.96),(0,-.36,3.87),(-.055,-.35,3.97)],RECESS)
for z in [3.53,3.25]:
    ell("Suit button",(-.04,-.307,z),(.038,.021,.038),BRONZE,20,12)
tube("Jacket opening",[(-.04,-.307,3.56),(-.07,-.303,3.16),(-.17,-.287,2.63)],.01,RECESS)
for x in [-.365,.35]:
    tube("Slanted welt pocket",[(x-.105,-.266,3.10),(x+.115,-.266,3.13)],.019,BRONZE)
tube("Breast pocket welt",[(.25,-.306,4.16),(.45,-.266,4.19)],.015,BRONZE)
patch("Folded pocket square",[(.29,-.302,4.18),(.315,-.307,4.27),(.355,-.295,4.23),(.39,-.288,4.28),(.43,-.277,4.19)],HAIR)

# Sleeves join the torso as one cast, smoothly draped garment.
suit_parts=[body]
for side, points in [("L",[(-.59,.025,4.37),(-.76,-.01,3.88),(-.82,-.09,3.36),(-.80,-.16,2.96)]),
                     ("R",[(.60,.04,4.36),(.83,-.01,3.86),(.75,-.30,3.48),(.34,-.53,3.71)])]:
    data=bpy.data.curves.new(side+" draped sleeve", "CURVE")
    data.dimensions="3D";data.resolution_u=20;data.bevel_depth=.235;data.bevel_resolution=6;data.use_fill_caps=True
    spline=data.splines.new("BEZIER");spline.bezier_points.add(len(points)-1)
    for bp,pt,r in zip(spline.bezier_points,points,[1.08,.95,.84,.74]):
        bp.co=pt;bp.radius=r;bp.handle_left_type=bp.handle_right_type="AUTO"
    sleeve=bpy.data.objects.new(side+" uninterrupted sleeve",data);sculpt.objects.link(sleeve);data.materials.append(COAT)
    bpy.ops.object.select_all(action="DESELECT");sleeve.select_set(True);bpy.context.view_layer.objects.active=sleeve;bpy.ops.object.convert(target="MESH");smooth(sleeve)
    suit_parts.extend([sleeve,ell(side+" shoulder cap",points[0],(.252,.239,.245),COAT)])
    end=Vector(points[-1])
    direction=(end-Vector(points[-2])).normalized()
    cuff=ell(side+" shirt cuff",end+direction*.02,(.168,.171,.045),HAIR)
    cuff.rotation_euler=direction.to_track_quat("Z","Y").to_euler()
fuse(suit_parts,"Continuous cast suit and sleeves",.018,COAT)

# Relaxed articulated hands with visible fingers, sized to the figure.
left=[ell("Left palm",(-.79,-.17,2.79),(.145,.105,.21))]
for i in range(4):
    x=-.90+i*.065
    left.append(tube("Left finger",[(x,-.18,2.75),(x,-.235,2.57),(x+.018,-.30,2.56)],.041,BRONZE))
left.append(tube("Left thumb",[(-.66,-.18,2.85),(-.63,-.27,2.73),(-.69,-.31,2.66)],.052,BRONZE))
fuse(left,"Left hand sculpt",.013,BRONZE)
right=[ell("Right palm",(.22,-.56,3.75),(.19,.09,.115))]
for i in range(4):
    z=3.81-i*.053
    right.append(tube("Right finger",[(.19,-.566,z),(.03,-.57,z+.017),(-.015,-.51,z+.03)],.029,BRONZE))
right.append(tube("Right thumb",[(.25,-.56,3.66),(.11,-.62,3.64),(.04,-.60,3.70)],.042,BRONZE))
fuse(right,"Right hand at jacket sculpt",.010,BRONZE)
patch("Folded statesman's dossier",[(-.73,-.235,2.78),(-.39,-.235,2.63),(-.50,-.235,2.09),(-.86,-.235,2.20)],COAT,.08)
for d in [0,.027,.054]:
    tube("Document leaf edge",[(-.85,-.282+d,2.21),(-.50,-.282+d,2.1),(-.397,-.282+d,2.62)],.007,HAIR,1)

# Portrait head: a single continuous surface, shaped with broad anatomical
# displacements. The face is sculpted into the skin, not assembled as beads.
head_start=set(sculpt.objects)
rows=[(4.96,.085,.024,.095),(5.005,.19,.012,.184),(5.08,.261,.012,.224),
      (5.20,.310,.031,.251),(5.33,.347,.04,.262),(5.46,.349,.032,.271),
      (5.59,.350,.035,.265),(5.72,.352,.046,.274),(5.84,.322,.062,.257),
      (5.94,.231,.071,.19),(5.985,.10,.07,.085),(6.00,.002,.07,.004)]


def profile(z):
    for j in range(len(rows)-1):
        if rows[j][0]<=z<=rows[j+1][0]:
            t=(z-rows[j][0])/(rows[j+1][0]-rows[j][0])
            vals=[]
            for k in range(1,4):
                p0=rows[max(0,j-1)][k];p1=rows[j][k];p2=rows[j+1][k];p3=rows[min(len(rows)-1,j+2)][k]
                vals.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t))
            return vals
    return rows[-1][1:]


def gauss(x,z,cx,cz,wx,wz):
    return math.exp(-((x-cx)/wx)**2-((z-cz)/wz)**2)


def face_y(x,z):
    rx,cy,ry=profile(z)
    rim=max(0,1-(x/max(.001,rx))**2)
    y=cy-ry*rim**.39
    # Recessed heavy-lidded eyes, sloping brows, broad cheek planes, and chin.
    y+=.036*gauss(abs(x),z,.158,5.574,.095,.047)
    y-=.024*gauss(abs(x),z,.168,5.632+(abs(x)-.12)*.20,.135,.024)
    y-=.013*gauss(abs(x),z,.23,5.417,.145,.115)
    y+=.010*gauss(abs(x),z,.264,5.279,.08,.077)
    y-=.036*gauss(x,z,0,5.10,.205,.094)
    y-=.021*gauss(x,z,0,5.264,.18,.078)
    # Long straight bridge, rounded projecting tip, and shallow alar wings.
    y-=.093*gauss(x,z,0,5.508,.049,.133)
    y-=.195*gauss(x,z,0,5.382,.075,.051)
    y-=.047*gauss(abs(x),z,.074,5.378,.029,.024)
    # Lips and nasolabial furrows are embedded relief on the continuous face.
    y-=.012*gauss(x,z,0,5.258,.117,.010)
    y-=.012*gauss(x,z,0,5.226,.109,.012)
    y+=.007*gauss(x,z,0,5.243,.132,.005)
    curve=.105+(5.37-z)*.34
    y+=.006*gauss(abs(x),z,curve,5.287,.008,.084)
    for zz in [5.741,5.787]:
        y+=.0028*gauss(x,z,0,zz+.014*(1-(x/.3)**2),.246,.0035)
    return y


verts=[];faces=[];sides=144;levels=132
for j in range(levels):
    z=rows[0][0]+(rows[-1][0]-rows[0][0])*j/(levels-1)
    rx,cy,ry=profile(z)
    for i in range(sides):
        a=i*2*math.pi/sides;x=rx*math.cos(a)
        y=face_y(x,z) if math.sin(a)<0 else cy+ry*math.sin(a)
        verts.append((x,y,z))
for j in range(levels-1):
    for i in range(sides):
        a=j*sides+i;b=j*sides+(i+1)%sides
        faces.append((a,b,b+sides,a+sides))
faces.extend([tuple(reversed(range(sides))),tuple((levels-1)*sides+i for i in range(sides))])
head=mesh("Kiesinger continuous portrait sculpt",verts,faces,BRONZE)
# Ears retain a hollow helix; the small eyes sit in the sculpted orbital recess.
for side in [-1,1]:
    eyeX=side*.152
    center_y=face_y(eyeX,5.573)
    ell("Inset bronze eye",(eyeX,center_y+.020,5.573),(.084,.032,.025),BRONZE,32,16)
    for name,sign in [("Upper lid",1),("Lower lid",-1)]:
        pts=[]
        for i in range(9):
            t=i/8;xx=eyeX+(t-.5)*.178;zz=5.57+sign*.018*math.sin(math.pi*t)
            yy=face_y(xx,zz)-.005
            pts.append((xx,yy,zz))
        tube(name,pts,.003,BRONZE,2)
    ell("Shallow iris engraving",(eyeX,center_y-.0125,5.574),(.013,.0015,.013),RECESS,20,12)
    # Brow direction follows the archival front portrait: inner ends low.
    pts=[(side*x,face_y(side*x,z)-.006,z) for x,z in [(.065,5.621),(.14,5.641),(.235,5.673)]]
    tube("Slanting brow relief",pts,.0035,BRONZE,2)
    tube("Lower orbital fold",[(side*x,face_y(side*x,z)-.002,z) for x,z in [(.078,5.527),(.157,5.509),(.25,5.529)]],.002,BRONZE,2)
    ear=ell("Ear shell",(side*.355,.029,5.44),(.065,.070,.134),BRONZE)
    tube("Ear helix",[(side*.359,-.029,5.322),(side*.399,-.026,5.401),(side*.393,.008,5.545),(side*.351,.019,5.551)],.012,BRONZE,2)
    ell("Ear concha",(side*.393,-.036,5.445),(.012,.006,.057),RECESS,20,12)
    xx=side*.065;zz=5.366
    ell("Nostril recess",(xx,face_y(xx,zz)-.002,zz),(.015,.005,.007),RECESS,20,12)
# A narrow lip division supports the closed, unsmiling reference expression.
pts=[(x,face_y(x,5.242)-.001,5.242) for x in [-.12,-.06,0,.06,.12]]
tube("Quiet mouth line",pts,.0025,RECESS,1)

# Continuous hair shell with hundreds of carved directional flutes. Ridges
# follow a swept-back flow around the side part; no image texture is shipped.
verts=[];faces=[];hs=160;hl=64
for j in range(hl):
    for i in range(hs):
        theta=2*math.pi*i/hs
        limit=1.15-.14*abs(math.cos(theta))**2+.80*abs(math.cos(theta))**10+.80*max(0,math.sin(theta))+.09*math.cos(theta)*max(0,-math.sin(theta))
        phi=.006+(limit-.006)*j/(hl-1)
        x=.366*math.sin(phi)*math.cos(theta)-.045*math.cos(phi)
        y=.067+.306*math.sin(phi)*math.sin(theta)
        z=5.642+.393*math.cos(phi)+.045*gauss(x,y,-.14,-.05,.17,.25)
        flow=x+.12*math.sin((y+.23)*4.9)+.030*(z-5.7)
        relief=.0024*math.cos(flow*180)+.0006*math.cos(flow*360)
        # A narrow offset part, swept continuously back from the right temple.
        relief-=.007*math.exp(-((flow-.205)/.006)**2)
        n=Vector((x/.366,(y-.067)/.306,(z-5.642)/.393)).normalized()
        verts.append((x+n.x*relief,y+n.y*relief,z+n.z*relief))
for j in range(hl-1):
    for i in range(hs):
        a=j*hs+i;b=j*hs+(i+1)%hs
        faces.append((a,b,b+hs,a+hs))
hair=mesh("Swept back carved hair",verts,faces,HAIR)
# The boundary is tucked into the skull, providing a natural cast hairline.
solid=hair.modifiers.new("Hair cast edge", "SOLIDIFY");solid.thickness=.014
bpy.context.view_layer.objects.active=hair;bpy.ops.object.modifier_apply(modifier=solid.name)
for o in set(sculpt.objects)-head_start:
    o.location.z-=.14

# Normalize sculpt once in authoring space. No model fitting is needed in game.
bpy.context.view_layer.update()
parts=list(sculpt.objects)
coords=[o.matrix_world@v.co for o in parts for v in o.data.vertices]
minz=min(v.z for v in coords);maxz=max(v.z for v in coords)
factor=6/(maxz-minz)
for o in parts:
    for v in o.data.vertices:
        world=o.matrix_world@v.co
        v.co=Vector((world.x*factor,world.y*factor,(world.z-minz)*factor))
    o.matrix_world.identity()
    o["authorship"]="Original Blender sculpture for Germany Simulator; no imported mesh"

# Game copy: consolidate by bronze material and decimate the dense sculpt.
game=bpy.data.collections.new("GAME EXPORT — optimized bronze statue")
bpy.context.scene.collection.children.link(game)
gameparts=[]
for source in parts:
    copy=source.copy();copy.data=source.data.copy();game.objects.link(copy)
    copy.name=source.name+" game"
    if len(copy.data.polygons)>200:
        bpy.context.view_layer.objects.active=copy
        d=copy.modifiers.new("Game sculpt reduction", "DECIMATE")
        d.ratio=.64 if "continuous portrait" in source.name else (.58 if "carved hair" in source.name else (.13 if len(copy.data.polygons)>1500 else .55))
        bpy.ops.object.modifier_apply(modifier=d.name)
    gameparts.append(copy)
for m in [BRONZE,COAT,HAIR,RECESS]:
    members=[o for o in game.objects if o.data.materials[0]==m]
    o=join(members,m.name+" — game mesh")
    o.data.validate(clean_customdata=True)
    o.data.update()
    bpy.context.scene.cursor.location=(0,0,0)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
sculpt.hide_render=True
sculpt.hide_viewport=True
bpy.ops.object.select_all(action="DESELECT")
for o in game.objects:o.select_set(True)
bpy.context.view_layer.objects.active=list(game.objects)[0]
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in game.objects)
assert 0 < triangles < 85000, triangles
bpy.ops.export_scene.gltf(filepath=str(DEST/"kiesinger-statue.glb"),export_format="GLB",use_selection=True,export_yup=True,export_apply=True,export_animations=False,export_texcoords=False,export_normals=True,export_materials="EXPORT",export_extras=False)

# An honest studio inspection scene in the editable Blender file.
scene=bpy.context.scene
scene.render.engine="CYCLES"
scene.cycles.samples=40
scene.cycles.use_denoising=True
scene.world.color=(.20,.20,.20)
scene.view_settings.view_transform="AgX"
scene.render.resolution_x=1000;scene.render.resolution_y=1200
scene.render.resolution_percentage=100
stage=material("Preview only limestone",(.18,.17,.145),0,.8)
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=1.25,depth=.15,location=(0,0,-.075))
base=bpy.context.object;base.name="Preview plinth — not exported";base.data.materials.append(stage)
bevel=base.modifiers.new("Stone edge", "BEVEL");bevel.width=.04;bevel.segments=3
for name,pos,energy,size,color in [
    ("Broad warm key",(-4,-6,9),1150,5,(1,.88,.72)),
    ("Cool fill",(4,-2,6),850,4,(.74,.85,1)),
    ("Bronze rim",(1,4,8),1550,3,(1,.93,.79))]:
    data=bpy.data.lights.new(name,"AREA");data.energy=energy;data.shape="DISK";data.size=size;data.color=color
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=pos
    o.rotation_euler=(Vector((0,0,3.3))-o.location).to_track_quat("-Z","Y").to_euler()
data=bpy.data.cameras.new("Portrait inspection camera");cam=bpy.data.objects.new("Portrait inspection camera",data);scene.collection.objects.link(cam);scene.camera=cam
data.type="ORTHO"


def shot(name, position, target, scale, width=1000,height=1200):
    cam.location=position;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat("-Z","Y").to_euler();data.ortho_scale=scale
    scene.render.resolution_x=width;scene.render.resolution_y=height
    scene.render.filepath=str(PREVIEW/(name+".png"))
    bpy.ops.render.render(write_still=True)


shot("full-three-quarter",(8,-17,8),(0,0,3.03),7.2)
shot("portrait-front",(0,-12,6.15),(0,0,5.44),1.68,1100,1100)
shot("portrait-three-quarter",(7,-12,6.3),(0,0,5.40),1.82,1100,1100)
cam.location=(8,-17,8);cam.rotation_euler=(Vector((0,0,3.03))-cam.location).to_track_quat("-Z","Y").to_euler();data.ortho_scale=7.2
scene.render.resolution_x=1000;scene.render.resolution_y=1200
scene["sculpt_notes"]="Original portrait sculpture based on archival Kiesinger photographs, with swept side-parted hair, long nose, aging cheeks, tailored suit and an invented monumental pose. Unhide editable sculpture collection and hide GAME EXPORT to edit full-resolution volumes."
bpy.ops.object.select_all(action="DESELECT")
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=="VIEW_3D":
            space=area.spaces.active
            space.shading.type="SOLID";space.shading.color_type="MATERIAL"
            space.overlay.show_extras=False
            space.region_3d.view_location=(0,0,3)
            space.region_3d.view_distance=10
            space.region_3d.view_rotation=cam.rotation_euler.to_quaternion()
bpy.ops.wm.save_as_mainfile(filepath=str(DEST/"kiesinger-statue.blend"),compress=True)
print(f"KIESINGER_SCULPT triangles={triangles} bytes={(DEST/'kiesinger-statue.glb').stat().st_size}")
