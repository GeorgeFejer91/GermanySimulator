"""Photo-referenced Kiesinger bronze sculpture, authored in Blender.

Run: blender --background --python tools/sculpt-kiesinger.py
The editable sculpt stays in the .blend; a decimated, material-joined GLB is
exported with shoe-level origin, six-unit height, Y up, and front toward +Z.
"""
from pathlib import Path
import math
import json
import hashlib
import numpy as np
import bmesh
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

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
HAIR = material("Combed bronze hair", (.188, .167, .113), .62, .60)
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
# Six-unit figure: crotch 2.85, sloping shoulders 4.90, collar 5.18. With the
# portrait's 0.86-unit head this is a seven-head adult, rather than a toy body.
def tailored_loft(name, rows, mat, crease=False):
    sides=40;verts=[];faces=[];power=.78
    for z,x,y,rx,ry in rows:
        for i in range(sides):
            a=i*2*math.pi/sides;c=math.cos(a);s=math.sin(a)
            yy=y+ry*math.copysign(abs(s)**power,s)
            if crease and s<0:yy-=.009*math.exp(-((a-1.5*math.pi)/.09)**2)
            verts.append((x+rx*math.copysign(abs(c)**power,c),yy,z))
    for j in range(len(rows)-1):
        for i in range(sides):
            a=j*sides+i;b=j*sides+(i+1)%sides;faces.append((a,b,b+sides,a+sides))
    faces.extend([tuple(reversed(range(sides))),tuple((len(rows)-1)*sides+i for i in range(sides))])
    return mesh(name,verts,faces,mat)


for side,x,y in [("L",-.29,.035),("R",.29,-.10)]:
    tailored_loft(side+" flat Oxford sole",[(0,x,y-.105,.205,.405),(.045,x,y-.105,.205,.405),(.063,x,y-.105,.198,.402)],RECESS)
    tailored_loft(side+" shaped Oxford upper",[(.06,x,y-.105,.195,.397),(.115,x,y-.11,.194,.386),
        (.18,x,y-.07,.181,.345),(.24,x,y+.01,.162,.252),(.30,x,y+.05,.144,.177)],COAT)
    for z,yy in [(.23,-.145),(.25,-.108),(.27,-.074)]:
        tube(side+" Oxford lace",[(x-.06,y+yy,z),(x,y+yy-.01,z+.005),(x+.06,y+yy,z)],.004,COAT,1)
    leg=tailored_loft(side+" draped straight trouser",[(.30,x,y+.025,.187,.218),(.35,x,y+.025,.188,.22),
        (.58,x,y+.035,.194,.225),(1.0,x-.01,y+.045,.211,.229),(1.46,x-.022,y+.043,.205,.222),
        (1.60,x-.025,y+.025,.214,.225),(1.89,x-.026,y+.012,.241,.266),
        (2.25,x*.92,.04,.249,.27),(2.53,x*.86,.063,.243,.252),(2.68,x*.80,.070,.229,.233),
        (2.84,x*.75,.070,.222,.217),(3.10,x*.72,.070,.231,.212)],COAT,True)
    mod=leg.modifiers.new("Cloth continuity", "SUBSURF");mod.levels=1
    bpy.context.view_layer.objects.active=leg;bpy.ops.object.modifier_apply(modifier=mod.name)

BODY_ROWS=[(2.64,0,.045,.502,.302),(2.70,0,.045,.519,.316),(2.90,0,.05,.534,.329),
    (3.20,-.014,.055,.524,.327),(3.58,-.018,.055,.506,.318),(3.93,-.022,.055,.549,.342),
    (4.27,-.025,.055,.606,.351),(4.52,-.025,.065,.639,.337),(4.70,-.022,.075,.623,.305),
    (4.82,-.012,.077,.505,.265),(4.93,0,.073,.326,.233),(5.025,0,.065,.243,.219)]
body=tailored_loft("Tailored torso and sloping trapezius",BODY_ROWS,COAT)
sub=body.modifiers.new("Cloth continuity", "SUBSURF");sub.levels=1
bpy.context.view_layer.objects.active=body;bpy.ops.object.modifier_apply(modifier=sub.name)
neck=loft("Human neck tapering beneath rear jaw",[(4.82,0,.06,.220,.207),(4.95,0,.04,.197,.195),
    (5.06,0,.035,.177,.190),(5.17,0,.027,.156,.172),(5.27,0,.065,.137,.151)],BRONZE)
sub=neck.modifiers.new("Soft anatomical neck transition","SUBSURF");sub.levels=1
bpy.context.view_layer.objects.active=neck;bpy.ops.object.modifier_apply(modifier=sub.name)
# Open front, low nape band: the shirt follows the neck below the chin, rather
# than forming a solid cylindrical tower or a cap across the skin.
collar_verts=[];collar_faces=[];collar_segments=44
for z,rx,ry in [(4.985,.226,.203),(5.035,.223,.201),(5.11,.213,.191)]:
    for i in range(collar_segments):
        a=-math.pi/2+.56+(2*math.pi-1.12)*i/(collar_segments-1)
        collar_verts.append((rx*math.cos(a),.050+ry*math.sin(a),z-.043*max(0,-math.sin(a))))
for j in range(2):
    for i in range(collar_segments-1):
        a=j*collar_segments+i;collar_faces.append((a,a+1,a+1+collar_segments,a+collar_segments))
collar=mesh("Low open fitted shirt collar",collar_verts,collar_faces,HAIR)
solid=collar.modifiers.new("Thin folded collar fabric","SOLIDIFY");solid.thickness=.008;solid.offset=0
bpy.context.view_layer.objects.active=collar;bpy.ops.object.modifier_apply(modifier=solid.name)
collar["preserve_edges"]=True


def suit_front(x,z,lift=.012):
    row=BODY_ROWS[-1]
    for a,b in zip(BODY_ROWS,BODY_ROWS[1:]):
        if a[0]<=z<=b[0]:
            t=(z-a[0])/(b[0]-a[0]);row=[z]+[a[k]*(1-t)+b[k]*t for k in range(1,5)];break
    _,cx,cy,rx,ry=row
    return cy-ry*max(0,1-abs((x-cx)/rx)**(2/.78))**(.78/2)-lift


tailoring_items=[]


def tailoring(name,outline,mat=COAT,lift=.008):
    # Subdivide before contouring: lapels follow the chest instead of becoming
    # flat triangular plaques, while retaining the notched tailored boundary.
    o=mesh(name,[(x,suit_front(x,z,lift),z) for x,z in outline],[tuple(range(len(outline)))],mat)
    sub=o.modifiers.new("Contoured tailoring grid","SUBSURF");sub.subdivision_type="SIMPLE";sub.levels=2
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sub.name)
    for v in o.data.vertices:v.co.y=suit_front(v.co.x,v.co.z,lift)
    o["tailoring_surface"]=True;o["tailoring_lift"]=lift;o["preserve_edges"]=True
    tailoring_items.append((o,lift))
    return smooth(o)


tailoring("Shirt visible within jacket V",[(-.21,5.025),(.21,5.025),(.14,4.45),(0,4.055),(-.13,4.45)],HAIR,.008)
tailoring("Left narrow notched lapel",[(-.23,5.02),(-.414,4.90),(-.53,4.72),(-.415,4.676),
    (-.448,4.608),(-.092,4.043),(-.053,4.107),(-.178,4.76)],COAT,.009)
tailoring("Right narrow notched lapel",[(.23,5.02),(.404,4.90),(.513,4.72),(.398,4.674),
    (.431,4.606),(-.062,4.043),(.005,4.145),(.172,4.76)],COAT,.009)
for side in [-1,1]:
    leaf=patch("Small soft turned shirt collar",[(side*.176,-.075,5.077),(side*.018,-.169,5.045),
        (side*.048,-.187,4.999),(side*.098,-.196,4.919),(side*.124,-.184,4.913),
        (side*.194,-.118,4.971),(side*.21,-.062,5.038)],HAIR,.005)
    leaf["preserve_edges"]=True
loft("Small tapered four-in-hand knot",[(4.939,0,-.195,.030,.021),(4.987,0,-.185,.052,.031),
    (5.04,0,-.169,.044,.026)],RECESS,32)
tailoring("Narrow hanging silk tie",[(-.039,4.96),(.041,4.96),(.063,4.27),(0,4.18),(-.061,4.27)],RECESS,.023)
for z in [4.037,3.73]:ell("Suit button",(-.055,suit_front(-.055,z,.019),z),(.024,.013,.024),BRONZE,20,12)
tube("Subtle jacket closure",[(-.055,suit_front(-.055,4.04,.007),4.04),(-.068,suit_front(-.068,3.42,.007),3.42),
    (-.126,suit_front(-.126,2.68,.007),2.68)],.0035,RECESS,1)
for x in [-.365,.34]:tailoring("Contoured lower pocket welt",[(x-.12,3.535),(x+.12,3.554),(x+.12,3.529),(x-.12,3.51)],COAT,.006)
tailoring("Quiet breast pocket welt",[(.24,4.44),(.43,4.453),(.43,4.434),(.24,4.421)],COAT,.006)
tailoring("Small folded pocket square",[(.269,4.443),(.287,4.492),(.324,4.471),(.359,4.498),(.4,4.452)],HAIR,.008)


def sleeve_sections(name,points,sections,mat):
    points=[Vector(p) for p in points];sections=list(sections);verts=[];faces=[];sides=28
    if len(points)>2:
        # Preserve the cuff endpoint when subdivision rounds the terminal cap.
        direction=(points[-1]-points[-2]).normalized()
        points.insert(-1,points[-1]-direction*.018);sections.insert(-1,sections[-1])
    for j,(point,(width,depth)) in enumerate(zip(points,sections)):
        tangent=(points[min(j+1,len(points)-1)]-points[max(0,j-1)]).normalized()
        front=Vector((0,-1,0));front=(front-tangent*front.dot(tangent)).normalized();side=tangent.cross(front).normalized()
        for i in range(sides):
            a=i*2*math.pi/sides;verts.append(tuple(point+front*depth*math.cos(a)+side*width*math.sin(a)))
    for j in range(len(points)-1):
        for i in range(sides):
            a=j*sides+i;b=j*sides+(i+1)%sides;faces.append((a,b,b+sides,a+sides))
    faces.extend([tuple(reversed(range(sides))),tuple((len(points)-1)*sides+i for i in range(sides))])
    o=mesh(name,verts,faces,mat)
    if len(points)>2:
        sub=o.modifiers.new("Draped sleeve continuity","SUBSURF");sub.levels=1
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sub.name)
    return o


suit_parts=[body]
for side,points in [("L",[(-.45,.05,4.69),(-.63,.045,4.48),(-.755,.022,4.18),(-.80,.012,3.96),
                          (-.82,-.028,3.83),(-.85,-.09,3.49),(-.84,-.17,3.15)]),
                    ("R",[(.45,.05,4.70),(.64,.045,4.47),(.785,.035,4.14),(.82,.012,3.985),
                          (.78,-.12,3.99),(.64,-.29,4.06),(.43,-.46,4.18)])]:
    radii=[(.223,.232),(.214,.227),(.202,.218),(.196,.206),(.189,.201),(.176,.186),(.145,.158)]
    suit_parts.append(sleeve_sections(side+" shoulder elbow and forearm",points,radii,COAT))
    end=Vector(points[-1]);direction=(end-Vector(points[-2])).normalized()
    sleeve_sections(side+" thin continuous shirt cuff",[end-direction*.04,end+direction*.063],[(.132,.143),(.13,.14)],HAIR)
suit_cast=fuse(suit_parts,"Continuous tailored suit and anatomical sleeves",.018,COAT)
for piece,lift in tailoring_items:
    for v in piece.data.vertices:
        hit,location,normal,_=suit_cast.closest_point_on_mesh(v.co)
        if hit:v.co=location+normal*lift
    piece.data.update()
    solid=piece.modifiers.new("Thin cast cloth edge","SOLIDIFY");solid.thickness=.006;solid.offset=0
    bpy.context.view_layer.objects.active=piece;bpy.ops.object.modifier_apply(modifier=solid.name)

# Palms, four separately articulated fingers, and one opposable thumb per hand.
# Fingertips reach mid-thigh / the jacket, with a full adult hand-to-head ratio.
def palm_volume(name,rows,along_x=False):
    verts=[];faces=[];sides=32;power=.62
    for axis,c1,c2,r1,r2 in rows:
        for i in range(sides):
            a=i*2*math.pi/sides;c=math.cos(a);s=math.sin(a)
            u=c1+r1*math.copysign(abs(c)**power,c);v=c2+r2*math.copysign(abs(s)**power,s)
            verts.append((axis,u,v) if along_x else (u,v,axis))
    for j in range(len(rows)-1):
        for i in range(sides):
            a=j*sides+i;b=j*sides+(i+1)%sides;faces.append((a,b,b+sides,a+sides))
    faces.extend([tuple(reversed(range(sides))),tuple((len(rows)-1)*sides+i for i in range(sides))])
    o=mesh(name,verts,faces,BRONZE)
    sub=o.modifiers.new("Continuous broad palm and wrist","SUBSURF");sub.levels=1
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sub.name)
    return o


palm_volume("Left broad flat palm flowing into wrist",[(2.812,-.846,-.194,.130,.058),(2.84,-.846,-.194,.130,.058),
    (2.94,-.845,-.192,.123,.063),(3.02,-.843,-.188,.107,.072),(3.09,-.84,-.18,.095,.080),
    (3.145,-.84,-.176,.09,.082)])
# Keep the closed digit volumes separate at their roots: whole-hand voxel
# remeshing bridges the inter-finger spaces and turns the cast into a mitten.
for i,length in enumerate([.23,.278,.292,.255]):
    x=-.95+i*.071;start=2.855
    sleeve_sections("Left relaxed anatomical finger",[(x,-.228,start),(x,-.257,start-length*.58),
        (x+.012,-.265,start-length)],[(.030,.027),(.028,.026),(.024,.022)],BRONZE)
sleeve_sections("Left opposable anatomical thumb",[(-.740,-.219,3.015),(-.696,-.272,2.907),(-.758,-.314,2.847)],
    [(.038,.035),(.034,.031),(.026,.024)],BRONZE)
palm_volume("Right broad flat palm flowing into wrist",[(.062,-.513,4.225,.043,.120),(.090,-.513,4.225,.047,.127),
    (.21,-.509,4.233,.049,.126),(.30,-.512,4.222,.060,.112),(.385,-.499,4.20,.073,.092),
    (.45,-.448,4.175,.080,.086)],True)
for i,length in enumerate([.213,.239,.223,.177]):
    z=4.318-i*.062;start=.107
    sleeve_sections("Right relaxed anatomical finger",[(start,-.532,z),(start-length*.60,-.445,z-.012),
        (start-length,suit_front(start-length,z-.035,.014),z-.035)],[(.027,.025),(.026,.024),(.021,.019)],BRONZE)
sleeve_sections("Right opposable anatomical thumb",[(.269,-.542,4.115),(.15,-.577,4.075),(.077,-.474,4.133)],
    [(.035,.031),(.032,.029),(.026,.023)],BRONZE)
patch("Thin folded statesman's dossier",[(-.755,-.293,2.821),(-.404,-.293,2.691),
    (-.479,-.293,2.171),(-.824,-.293,2.276)],COAT,.025)
for d in [0,.011,.022]:tube("Subtle dossier paper edge",[(-.814,-.313+d,2.285),(-.485,-.313+d,2.183),(-.413,-.313+d,2.686)],.003,HAIR,1)

# Portrait surface from source-photo landmarks. Anatomical connectivity is
# MediaPipe's Apache-2.0 canonical topology; positions come from Kiesinger.
portrait=json.loads((DEST/"portrait-landmarks.json").read_text(encoding="utf-8"))
pv=[Vector(p) for p in portrait["vertices"]]
left_eye=[33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246]
right_eye=[263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466]
holes=[set(left_eye),set(right_eye)]
faces=[f for f in portrait["faces"] if not any(set(f)<=h for h in holes)]
# The measured facial oval extends into a rounded cranium and underside of jaw.
# This closes the head as a volume while preserving the reference silhouette.
oval=[132,93,234,127,162,21,54,103,67,109,10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58]
verts=[tuple(p) for p in pv]
previous=oval
for stage in range(1,5):
    ring=[]
    for i in oval:
        p=pv[i];upper=max(0,(p.z-5.54)/.30)
        if stage==1:
            q=(p.x*1.025,p.y*.36+.085,p.z+.105*upper+.01)
        elif stage==2:
            q=(p.x*.90,.245,5.59+(p.z-5.53)*.89)
        elif stage==3:
            q=(p.x*.52,.328,5.61+(p.z-5.53)*.55)
        else:q=(p.x*.08,.350,5.63+(p.z-5.53)*.09)
        ring.append(len(verts));verts.append(q)
    for j in range(len(oval)):
        k=(j+1)%len(oval);faces.append((previous[j],previous[k],ring[k],ring[j]))
    previous=ring
faces.append(tuple(reversed(previous)))
head=mesh("Kiesinger photo fitted portrait",verts,faces,BRONZE)
bm=bmesh.new();bm.from_mesh(head.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(head.data);bm.free()
uv=head.data.uv_layers.new(name="Archival reference projection")
for loop in head.data.loops:
    if loop.vertex_index<468:uv.data[loop.index].uv=portrait["neutral_photo_uv"][loop.vertex_index]
sub=head.modifiers.new("Sculpt facial planes and lip topology", "SUBSURF");sub.levels=4
bpy.context.view_layer.objects.active=head;bpy.ops.object.modifier_apply(modifier=sub.name)

# The landmark cage supplies primary proportions. The elderly portrait also
# needs secondary volumes: hooded lids, orbital fat, creases and soft jowls.
coords=np.empty(len(head.data.vertices)*3,dtype=np.float64)
head.data.vertices.foreach_get("co",coords);coords=coords.reshape((-1,3))
x,y,z=coords.T
depth=np.zeros(len(coords))
front=np.clip((-y-.10)/.08,0,1)
def mound(cx,cz,wx,wz,amount):
    depth[:]+=amount*np.exp(-((x-cx)/wx)**2-((z-cz)/wz)**2)
def crease(points,amount,width,roll=0):
    amount*=.35;roll*=.4;width*=1.4
    path=np.asarray(points);distance=np.full(len(coords),10.);fraction=np.zeros(len(coords))
    signed=np.zeros(len(coords))
    for j,(a,b) in enumerate(zip(path,path[1:])):
        dx,dz=b-a;length2=dx*dx+dz*dz
        t=np.clip(((x-a[0])*dx+(z-a[1])*dz)/length2,0,1)
        ex=x-a[0]-t*dx;ez=z-a[1]-t*dz;d=np.sqrt(ex*ex+ez*ez)
        selected=d<distance;distance[selected]=d[selected]
        fraction[selected]=(j+t[selected])/(len(path)-1)
        signed[selected]=(ex[selected]*dz-ez[selected]*dx)/math.sqrt(length2)
    fade=np.sin(np.pi*fraction)**.6
    depth[:]+=fade*(amount*np.exp(-(distance/width)**2)-roll*np.exp(-((signed-width*2)/(width*1.6))**2))
for side in [-1,1]:
    mound(side*.137,5.663,.070,.025,-.011)
    mound(side*.140,5.589,.065,.021,-.009)
    mound(side*.208,5.516,.055,.055,-.008)
    mound(side*.219,5.388,.054,.069,-.009)
    crease([(side*.056,5.610),(side*.097,5.585),(side*.156,5.578),(side*.212,5.603)],.0045,.0035,.002)
    crease([(side*.060,5.648),(side*.117,5.670),(side*.171,5.664),(side*.206,5.634)],.0035,.0028,.0015)
    crease([(side*.074,5.471),(side*.088,5.420),(side*.117,5.378),(side*.129,5.337)],.0045,.0045,.003)
    crease([(side*.117,5.359),(side*.138,5.335),(side*.140,5.311)],.0025,.003,.001)
    for j in range(3):
        crease([(side*.203,5.617-j*.007),(side*.227,5.620-j*.012),(side*.251,5.624-j*.019)],.0022,.002,0)
    crease([(side*.023,5.680),(side*.028,5.713),(side*.040,5.739)],.0025,.003,.001)
for j,height in enumerate([5.743,5.771,5.801]):
    crease([(-.206,height-.009),(-.126,height+.002),(-.03,height),(.072,height+.003),(.158,height-.004),(.219,height-.016)],.0016,.0022,.0007)
crease([(-.086,5.282),(-.032,5.272),(.033,5.273),(.079,5.284)],.0024,.003,.0008)
# Fine, irregular cast surface rather than the optically smooth plastic finish.
grain=(np.sin(x*937+np.sin(z*87))*np.sin(z*883+y*337)+.4*np.sin(x*1673-z*1381))*.00010

# Sample the licensed neutral portrait onto the fitted face. Local contrast
# supplies very shallow relief and restrained bronze patina. Broad lighting is
# normalized before sampling; no image texture is needed by the game model.
reference_path=ROOT/"output/kiesinger-references/kiesinger-1967-kas.jpg"
assert hashlib.sha256(reference_path.read_bytes()).hexdigest()==portrait["reference_photos"][0]["sha256"]
reference=bpy.data.images.load(str(reference_path),check_existing=True)
width,height=reference.size
pixels=np.empty(width*height*4,dtype=np.float32);reference.pixels.foreach_get(pixels)
gray=pixels.reshape((height,width,4))[:,:,:3]@np.array([.2126,.7152,.0722])
def blur(field,sigma):
    axis=np.arange(-int(sigma*3),int(sigma*3)+1);kernel=np.exp(-.5*(axis/sigma)**2);kernel/=kernel.sum()
    return np.apply_along_axis(lambda a:np.convolve(a,kernel,mode="same"),0,
        np.apply_along_axis(lambda a:np.convolve(a,kernel,mode="same"),1,field))
uvs=np.zeros((len(coords),2));counts=np.zeros(len(coords))
for loop in head.data.loops:
    uvs[loop.vertex_index]+=head.data.uv_layers.active.data[loop.index].uv;counts[loop.vertex_index]+=1
uvs/=np.maximum(counts[:,None],1)
sx=np.clip(uvs[:,0]*(width-1),0,width-1);sy=np.clip(uvs[:,1]*(height-1),0,height-1)
ix=sx.astype(int);iy=sy.astype(int);fx=sx-ix;fy=sy-iy
def sample(field):
    jx=np.minimum(ix+1,width-1);jy=np.minimum(iy+1,height-1)
    return (field[iy,ix]*(1-fx)+field[iy,jx]*fx)*(1-fy)+(field[jy,ix]*(1-fx)+field[jy,jx]*fx)*fy
lum=sample(gray);local=sample(blur(gray,5));illumination=sample(blur(gray,32))
relief=np.clip(lum-local,-.16,.16)*.006
photo_mask=front*np.clip((z-5.18)/.04,0,1)*np.clip((5.845-z)/.025,0,1)
coords[:,1]+=(depth+grain)*front-relief*photo_mask
coords[:,0]+=np.sign(x)*.006*np.exp(-((np.abs(x)-.232)/.046)**2-((z-5.364)/.078)**2)*front
head.data.vertices.foreach_set("co",coords.ravel());head.data.update()
tone=np.clip(1+.34*(lum/np.maximum(illumination,.04)-1)+.35*(lum-local),.62,1.18)
tone=1+(tone-1)*photo_mask
colors=np.ones((len(coords),4));colors[:,:3]=tone[:,None]*np.array(BRONZE.diffuse_color[:3])
patina=head.data.color_attributes.new(name="Cast patina",type="FLOAT_COLOR",domain="POINT")
patina.data.foreach_set("color",colors.ravel())
bpy.data.images.remove(reference)
# Eyebrow shape is carried by the photographed patina and the underlying brow
# ridge, avoiding a separate strip sitting above the skin.

# Eyeballs are seated behind real eyelid openings, with same-metal irises.
for loop in [left_eye,right_eye]:
    points=[pv[i] for i in loop]
    center=sum(points,Vector())/len(points)
    radius=(max(p.x for p in points)-min(p.x for p in points))*.54
    eye=ell("Inset anatomical eyeball",(center.x,center.y+radius*.94,center.z),(radius,radius,radius*.91),BRONZE,96,64)
    front=center.y-radius*.06
    # Engrave the iris into the cast eye instead of attaching a flat pupil disc.
    for v in eye.data.vertices:
        dx=v.co.x;dz=v.co.z;rr=math.sqrt(dx*dx+dz*dz)
        if v.co.y<0:
            v.co.y+=.0026*math.exp(-((rr-.020)/.0020)**2)+.0055*math.exp(-(rr/.007)**4)
    ell("Oxidation inside carved pupil",(center.x,front+.0045,center.z),(.004,.001,.004),RECESS,24,16)
# Adult ear anatomy: continuous bowl, rolled helix, branching antihelix and
# separate tragus/lobe. The helix spans eyebrow to the bottom of the nose.
for side in [-1,1]:
    root=ell("Ear attachment",(side*.285,.019,5.539),(.038,.041,.097),BRONZE,32,20)
    bowl=ell("Rounded auricle",(side*.304,.017,5.560),(.036,.049,.109),BRONZE,40,28)
    lobe=ell("Ear lobe",(side*.300,.003,5.458),(.029,.031,.038),BRONZE,32,20)
    ear=fuse([root,bowl,lobe],"Attached anatomical auricle",.003,BRONZE)
    cut=ell("Concha carving tool",(side*.339,.011,5.560),(.023,.032,.079),BRONZE,40,28)
    bpy.context.view_layer.objects.active=ear
    carving=ear.modifiers.new("Carved concha and rolled helix","BOOLEAN");carving.operation="DIFFERENCE";carving.object=cut
    bpy.ops.object.modifier_apply(modifier=carving.name);bpy.data.objects.remove(cut,do_unlink=True)
    tube("Seated ear antihelix",[(side*.324,.009,5.492),(side*.324,.026,5.548),(side*.327,.024,5.602)],.005,BRONZE,2)
    ell("Ear tragus",(side*.322,-.021,5.539),(.011,.013,.018),BRONZE,24,16)

# Asymmetric swept-back hair, with an offset part and a feathered hairline.
# Low-frequency locks shape the silhouette; fine grooves follow those locks.
forehead=[21,54,103,67,109,10,338,297,332,284,251]
boundary=[(-math.pi,Vector((-.307,.015,5.58)))]
for i in forehead:
    p=pv[i].copy();p.z-=.008+.010*math.exp(-((p.x+.18)/.05)**2)
    boundary.append((math.atan2((p.y-.02)/.33,p.x/.31),p))
boundary.extend([(0,Vector((.309,.015,5.58))),(math.pi*.25,Vector((.25,.235,5.51))),
                 (math.pi*.5,Vector((0,.345,5.505))),(math.pi*.75,Vector((-.25,.235,5.51))),
                 (math.pi,Vector((-.307,.015,5.58)))])
boundary.sort(key=lambda x:x[0])

def hair_edge(a):
    for j in range(len(boundary)-1):
        aa,pa=boundary[j];bb,pb=boundary[j+1]
        if aa<=a<=bb:return pa.lerp(pb,(a-aa)/(bb-aa))
    return boundary[0][1]

bm=bmesh.new();bm.from_mesh(head.data);skull=BVHTree.FromBMesh(bm);bm.free()
skull_center=Vector((0,.03,5.58))
verts=[];faces=[];hs=288;hl=80
for j in range(hl):
    r=.003+.997*j/(hl-1)
    for i in range(hs):
        a=-math.pi+i*2*math.pi/hs;b=hair_edge(a)
        edge=.005*math.sin(a*31)+.003*math.sin(a*67+1.3)
        rr=min(1.012,r+edge*r**8)
        x=b.x*rr-.027*(1-r)**2;y=.025+(b.y-.025)*rr
        z=b.z+(6.007-b.z)*math.sqrt(max(0,1-r*r))
        ray=(Vector((x,y,z))-skull_center).normalized()
        hit,normal,_,_=skull.ray_cast(skull_center,ray)
        if hit is not None:
            x,y,z=hit
            part_x=-.175+.21*(y+.26)
            big_side=x>part_x
            flow=x-(.27 if big_side else -.16)*(y+.27)-(.073 if big_side else -.045)*math.sin((y+.27)*6)
            phase=flow*245+.35*math.sin(flow*52)+.20*math.sin(y*14)
            lock=.0035*(.5+.5*math.cos(phase))**1.8
            strand=.00065*math.cos(phase*2.07+.25*math.sin(flow*71))
            wave=.071*math.exp(-((x+.015)/.21)**2-((y+.17)/.24)**2)
            wave+=.023*math.exp(-((x+.25)/.063)**2-((y+.12)/.19)**2)
            part=.008*math.exp(-((x-part_x)/.007)**2)
            feather=min(1,max(0,(1-r)/.12));feather=feather*feather*(3-2*feather)
            volume=(1-r*r)**1.15
            lift=-.0004+wave*volume*1.4+feather*(.003+lock+strand-part)
            x,y,z=hit+normal*lift
        verts.append((x,y,z))
for j in range(hl-1):
    for i in range(hs):
        a=j*hs+i;b=j*hs+(i+1)%hs;faces.append((a,b,b+hs,a+hs))
faces.append(tuple(reversed(range(hs))))
hair=mesh("Photo matched swept hair",verts,[tuple(reversed(f)) for f in faces],BRONZE)

# Normalize sculpt once in authoring space. No model fitting is needed in game.
bpy.context.view_layer.update()
parts=list(sculpt.objects)
for o in parts:
    if o.data.materials[0]==BRONZE and not o.data.color_attributes.get("Cast patina"):
        attr=o.data.color_attributes.new(name="Cast patina",type="FLOAT_COLOR",domain="POINT")
        rgba=np.tile(np.array(BRONZE.diffuse_color),(len(o.data.vertices),1));attr.data.foreach_set("color",rgba.ravel())
color_node=BRONZE.node_tree.nodes.new("ShaderNodeVertexColor");color_node.layer_name="Cast patina"
BRONZE.node_tree.links.new(color_node.outputs["Color"],BRONZE.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])
coords=[o.matrix_world@v.co for o in parts for v in o.data.vertices]
minz=min(v.z for v in coords);maxz=max(v.z for v in coords)
factor=6/(maxz-minz)
for o in parts:
    for v in o.data.vertices:
        world=o.matrix_world@v.co
        v.co=Vector((world.x*factor,world.y*factor,(world.z-minz)*factor))
    o.matrix_world.identity()
    o["authorship"]="Photo-referenced Blender sculpture; MediaPipe canonical facial connectivity, Apache-2.0; see PROVENANCE.md"

# Game copy: consolidate by bronze material and decimate the dense sculpt.
game=bpy.data.collections.new("GAME EXPORT — optimized bronze statue")
bpy.context.scene.collection.children.link(game)
gameparts=[]
for source in parts:
    copy=source.copy();copy.data=source.data.copy();game.objects.link(copy)
    copy.name=source.name+" game"
    if len(copy.data.polygons)>200 and not source.get("preserve_edges"):
        bpy.context.view_layer.objects.active=copy
        d=copy.modifiers.new("Game sculpt reduction", "DECIMATE")
        d.ratio=.073 if "photo fitted portrait" in source.name else (.30 if "Photo matched swept hair" in source.name else (.18 if "Continuous tailored suit" in source.name else (.12 if len(copy.data.polygons)>1500 else .55)))
        bpy.ops.object.modifier_apply(modifier=d.name)
    gameparts.append(copy)
export_suit=next(o for o in gameparts if "Continuous tailored suit" in o.name)
for piece in gameparts:
    if not piece.get("tailoring_surface"):continue
    for v in piece.data.vertices:
        hit,base,normal,_=suit_cast.closest_point_on_mesh(v.co)
        offset=max(.003,(v.co-base).dot(normal)) if hit else .008
        hit,target,normal,_=export_suit.closest_point_on_mesh(v.co)
        if hit:v.co=target+normal*offset
    piece.data.update()
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
shot("portrait-front",(0,-12,5.57),(0,0,5.57),1.30,1100,1100)
shot("portrait-three-quarter",(7,-12,5.60),(0,0,5.57),1.36,1100,1100)
shot("portrait-profile",(12,0,5.58),(0,0,5.57),1.42,1100,1100)
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
