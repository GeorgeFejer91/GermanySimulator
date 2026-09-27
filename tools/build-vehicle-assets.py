"""Original vehicle fleet. Blender 5.2+: blender -b -t 4 -P tools/build-vehicle-assets.py.

Metres, Blender Z-up/-Y-front; GLB Y-up/+Z-front. Named empty wheel pivots
survive material batching and quantization. No imported meshes or textures.
"""
import bpy
import bmesh
import math
import json
import hashlib
import sys
from pathlib import Path
from mathutils import Vector, Matrix, Euler

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/models/vehicles'
REVIEW = ROOT / 'output/vehicle-review'
OUT.mkdir(parents=True, exist_ok=True)
REVIEW.mkdir(parents=True, exist_ok=True)
LETTER_FONT=bpy.data.fonts.load(str(ROOT/'assets/fonts/roboto-condensed/RobotoCondensed.ttf'))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
MATS = {}
for name, color, rough, metal in [
    ('BodyPaint', (.62,.53,.36,1), .3,.22),
    ('RoofPaint', (.77,.75,.66,1), .32,.15),
    ('PoliceSilver', (.65,.69,.7,1), .3,.42),
    ('PoliceBlue', (.025,.13,.40,1), .3,.15),
    ('ReflectiveYellow', (.72,.85,.08,1), .4,.05),
    ('Glass', (.065,.12,.16,1), .16,.3),
    ('Rubber', (.023,.026,.029,1), .8,0),
    ('Chrome', (.63,.67,.70,1), .24,.72),
    ('DarkTrim', (.07,.08,.085,1), .6,.2),
    ('WhiteLettering', (.93,.94,.9,1), .5,.05),
    ('PlateWhite', (.93,.94,.90,1), .38,0),
    ('PlateInk', (.009,.012,.014,1), .55,0),
    ('EuroBlue', (.008,.035,.29,1), .45,0),
    ('Headlamp', (.83,.88,.83,1), .2,.3),
    ('Indicator', (.89,.30,.025,1), .25,.05),
    ('BrakeLens', (.48,.018,.015,1), .25,.08),
    ('BeaconLeft', (.015,.18,.8,1), .2,.15),
    ('BeaconRight', (.015,.18,.8,1), .2,.15),
]:
    m=bpy.data.materials.new(name);m.diffuse_color=color;m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=color
    bs.inputs['Roughness'].default_value=rough
    bs.inputs['Metallic'].default_value=metal
    if name.startswith('Beacon'):
        (bs.inputs.get('Emission Color') or bs.inputs.get('Emission')).default_value=color;bs.inputs['Emission Strength'].default_value=.35
    MATS[name]=m


def mesh(name, vertices, faces, material, smooth=True):
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    names=[material] if isinstance(material,str) else list(dict.fromkeys(material))
    for key in names:data.materials.append(MATS[key])
    for i,p in enumerate(data.polygons):
        p.use_smooth=smooth
        if not isinstance(material,str):p.material_index=names.index(material[i])
    return obj


def cube(name, pos, size, material, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos);obj=bpy.context.object;obj.name=name
    obj.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(MATS[material])
    if bevel:
        mod=obj.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=3
        bpy.ops.object.modifier_apply(modifier=mod.name)
        for face in obj.data.polygons:face.use_smooth=True
        mod=obj.modifiers.new('Panel normals','WEIGHTED_NORMAL');mod.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def ellipsoid(name, pos, size, material, segments=24, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=pos)
    obj=bpy.context.object;obj.name=name;obj.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(MATS[material])
    for face in obj.data.polygons:face.use_smooth=True
    return obj


def tube(name, points, radius, material, sides=6):
    vertices=[];faces=[]
    for i,point in enumerate(points):
        p=Vector(point);t=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
        t.normalize();n=t.cross(Vector((0,0,1)))
        if n.length<.01:n=t.cross(Vector((0,1,0)))
        n.normalize();b=t.cross(n)
        vertices.extend(tuple(p+radius*(math.cos(j*math.tau/sides)*n+math.sin(j*math.tau/sides)*b)) for j in range(sides))
    for i in range(len(points)-1):
        for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
    return mesh(name,vertices,faces,material)


def sample(rows, y):
    i=next((i for i in range(len(rows)-1) if y<=rows[i+1][0]),len(rows)-2)
    t=max(0,min(1,(y-rows[i][0])/(rows[i+1][0]-rows[i][0])))
    # Cubic interpolation through authored silhouette sections, with no runtime subdivision.
    out=[]
    for k in range(1,len(rows[0])):
        a,b,c,d=[rows[max(0,min(len(rows)-1,j))][k] for j in (i-1,i,i+1,i+2)]
        out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
    return out


def grid(name, fn, nu, nv, material):
    vertices=[fn(i/nu,j/nv) for i in range(nu+1) for j in range(nv+1)]
    faces=[(i*(nv+1)+j,(i+1)*(nv+1)+j,(i+1)*(nv+1)+j+1,i*(nv+1)+j+1) for i in range(nu) for j in range(nv)]
    if callable(material):material=[material([vertices[k] for k in f]) for f in faces]
    return mesh(name,vertices,faces,material)


def pane(name, fn, trim='Rubber', chrome=False, material='Glass', rim=.012):
    # Rounded, body-conforming glazing with a thin continuous gasket, never boxes.
    n=48;rings=6;vertices=[fn(0,0)];faces=[];edge=[]
    for ring in range(1,rings+1):
        for i in range(n):
            a=i*math.tau/n;c,s=math.cos(a),math.sin(a)
            u=math.copysign(abs(c)**.38,c)*ring/rings
            v=math.copysign(abs(s)**.38,s)*ring/rings
            vertices.append(fn(u,v))
            if ring==rings:edge.append(fn(u,v))
    for j in range(n):faces.append((0,1+j,1+(j+1)%n))
    for r in range(rings-1):
        for j in range(n):faces.append((1+r*n+j,1+(r+1)*n+j,1+(r+1)*n+(j+1)%n,1+r*n+(j+1)%n))
    obj=mesh(name,vertices,faces,material)
    if rim:tube(name+' gasket',edge+[edge[0]],rim,trim)
    if chrome:tube(name+' bright surround',edge+[edge[0]],.006,'Chrome')
    return obj


def lower_body(name, rows, police=False, power=.45):
    lo,hi=rows[0][0],rows[-1][0]
    def surface(u,v):
        y=lo+(hi-lo)*u;w,bottom,top=sample(rows,y);a=v*math.tau
        c,s=math.cos(a),math.sin(a)
        return (w*math.copysign(abs(c)**power,c),y,(bottom+top)/2+(top-bottom)/2*math.copysign(abs(s)**power,s))
    def paint(points):
        x,y,z=[sum(p[k] for p in points)/len(points) for k in range(3)]
        if police and abs(x)>.58:
            if .49<z<.57 or .91<z<.965:return 'ReflectiveYellow'
            if .57<=z<=.91:return 'PoliceBlue'
        return 'PoliceSilver' if police else 'BodyPaint'
    obj=grid(name,surface,60,48,paint)
    # Caps and underbody are closed before cutting both actual wheel openings.
    vertices=[tuple(v.co) for v in obj.data.vertices]
    faces=[tuple(p.vertices) for p in obj.data.polygons]
    mats=[obj.data.materials[p.material_index].name for p in obj.data.polygons]
    faces.extend([tuple(range(49)),tuple(60*49+j for j in reversed(range(49)))]);mats.extend(['PoliceSilver' if police else 'BodyPaint','PoliceBlue' if police else 'BodyPaint'])
    bpy.data.objects.remove(obj,do_unlink=True)
    return mesh(name,vertices,faces,mats)


def arches(body, axle, radius, height):
    bm=bmesh.new();bm.from_mesh(body.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(body.data);bm.free()
    for y in axle:
        bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=radius+.045,depth=3,location=(0,y,height),rotation=(0,math.pi/2,0))
        cutter=bpy.context.object
        bpy.context.view_layer.objects.active=body
        modifier=body.modifiers.new('Open wheel wells','BOOLEAN');modifier.operation='DIFFERENCE';modifier.object=cutter
        bpy.ops.object.modifier_apply(modifier=modifier.name);bpy.data.objects.remove(cutter,do_unlink=True)


def cabin(name, rows, base, material):
    lo,hi=rows[0][0],rows[-1][0]
    def roof(y,u):
        width,top=sample(rows,y)
        return (width*.84*u,y,top-.055*u*u)
    grid(name+' roof',lambda u,v:roof(lo+(hi-lo)*u,v*2-1),48,20,material)
    def side(y,h,sign,offset=0):
        width,top=sample(rows,y)
        return (sign*(width*(1-.16*h)+.014*math.sin(math.pi*h)+offset),y,base+(top-.055-base)*h)
    for sign in [-1,1]:grid(name+' side',lambda u,v:side(lo+(hi-lo)*u,v,sign),48,8,material)
    return roof,side


def wheels(root, axle, track, radius, modern=False):
    for front,y in [(True,axle[0]),(False,axle[1])]:
        for sign in [-1,1]:
            suffix=('F' if front else 'R')+('L' if sign<0 else 'R')
            steer=None
            if front:
                steer=bpy.data.objects.new(root.name+'__Steer_'+suffix,None);bpy.context.collection.objects.link(steer);steer['steer']=suffix;steer.parent=root;steer.location=(sign*track,y,radius)
            pivot=bpy.data.objects.new(root.name+'__Wheel_'+suffix,None);bpy.context.collection.objects.link(pivot)
            pivot.parent=steer or root;pivot.location=(0,0,0) if steer else (sign*track,y,radius)
            pivot['radius']=radius;pivot['wheel']=suffix
            before=set(bpy.data.objects)
            # A lathed tyre gives a round shoulder and an inset rim instead of a cylinder cap.
            profile=[(-.106,.70),(-.105,.9),(-.080,.988),(-.045,1),(.045,1),(.08,.988),(.105,.9),(.106,.70)]
            vertices=[(x,radius*r*math.cos(i*math.tau/40),radius*r*math.sin(i*math.tau/40)) for x,r in profile for i in range(40)]
            faces=[(j*40+i,j*40+(i+1)%40,(j+1)*40+(i+1)%40,(j+1)*40+i) for j in range(len(profile)-1) for i in range(40)]
            mesh('Tyre '+suffix,vertices,faces,'Rubber')
            ellipsoid('Rim barrel '+suffix,(sign*.096,0,0),(.021,radius*.72,radius*.72),'DarkTrim')
            if modern:
                for i in range(10):
                    a=i*math.tau/10
                    obj=cube('Alloy spoke',(sign*.112,math.cos(a)*radius*.44,math.sin(a)*radius*.44),(.028,radius*.50,.035),'Chrome',.012);obj.rotation_euler.x=a
                ellipsoid('Alloy hub',(sign*.133,0,0),(.025,.072,.072),'Chrome',20,10)
            else:
                ellipsoid('Pressed steel rim',(sign*.112,0,0),(.026,radius*.72,radius*.72),'Chrome')
                ellipsoid('Domed hubcap',(sign*.13,0,0),(.045,radius*.43,radius*.43),'Chrome')
                for i in range(8):
                    a=i*math.tau/8
                    ellipsoid('Rim vent',(sign*.14,math.cos(a)*radius*.57,math.sin(a)*radius*.57),(.003,.02,.02),'DarkTrim',12,6)
            for i in range(24):
                a=i*math.tau/24
                # Thin tread cuts make rotation legible even on the dark sidewall.
                tube('Tread groove',[(-.058,radius*1.003*math.cos(a-.016),radius*1.003*math.sin(a-.016)),(.058,radius*1.003*math.cos(a+.016),radius*1.003*math.sin(a+.016))],.004,'DarkTrim',4)
            tube('Valve stem',[(sign*.135,0,radius*.64),(sign*.15,0,radius*.68)],.007,'Rubber')
            parts=list(set(bpy.data.objects)-before)
            for obj in parts:obj.parent=pivot


def bumper(y,width,z,modern=False):
    sign=1 if y>0 else -1
    pts=[(width*t,y-sign*.13*t*t,z) for t in [i/16 for i in range(-16,17)]]
    tube('Curved bumper',pts,.052 if not modern else .035,'Chrome' if not modern else 'DarkTrim',10)


def round_lamp(x,y,z,radius,front=True):
    ellipsoid('Lamp bright surround',(x,y,z),(radius*1.09,.043,radius*1.09),'Chrome')
    ellipsoid('Headlamp lens' if front else 'Tail lamp lens',(x,y+(-.025 if front else .025),z),(radius,.027,radius),'Headlamp' if front else 'BrakeLens')


def wipers(points):
    for a,b,c in points:
        tube('Wiper arm',[a,b],.008,'DarkTrim')
        tube('Wiper blade',[b,c],.012,'Rubber')


def label(text,pos,rotation,size=.17,material='WhiteLettering',width=None):
    curve=bpy.data.curves.new(text,'FONT');curve.body=text;curve.font=LETTER_FONT;curve.align_x='CENTER';curve.align_y='CENTER';curve.size=size;curve.extrude=0;curve.resolution_u=2
    obj=bpy.data.objects.new(text,curve);bpy.context.collection.objects.link(obj);obj.location=pos;obj.rotation_euler=rotation;curve.materials.append(MATS[material])
    bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.convert(target='MESH');obj.select_set(False)
    if width:
        span=max(v.co.x for v in obj.data.vertices)-min(v.co.x for v in obj.data.vertices)
        for v in obj.data.vertices:v.co.x*=width/span
    return obj


def fitted(obj,target,offset=.004):
    bpy.context.view_layer.objects.active=obj
    modifier=obj.modifiers.new('Flush applied vinyl','SHRINKWRAP');modifier.target=target;modifier.wrap_method='NEAREST_SURFACEPOINT';modifier.offset=offset
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def plate(text,pos,rear=False):
    # Standard long German-format plate: black holder, white face, EU band, D and seals.
    before=set(bpy.data.objects)
    cube('Number plate holder',(0,0,0),(.536,.122,.016),'PlateInk',.009)
    cube('Registration plate',(0,0,.009),(.520,.110,.004),'PlateWhite',.006)
    cube('EU blue band',(-.239,0,.012),(.034,.103,.001),'EuroBlue',.001)
    label('D',(-.239,-.024,.014),(0,0,0),.033,'PlateWhite')
    for i in range(12):
        a=i*math.tau/12;cx=-.239+math.cos(a)*.010;cy=.022+math.sin(a)*.010
        verts=[(cx+math.cos(j*math.tau/10)*(.0025 if j%2==0 else .0011),cy+math.sin(j*math.tau/10)*(.0025 if j%2==0 else .0011),.014) for j in range(10)]
        mesh('EU star',verts,[tuple(range(10))],'ReflectiveYellow',False)
    label(text,(.017,-.002,.014),(0,0,0),.098,'PlateInk',.428)
    for x in [-.202,.224]:ellipsoid('Plate fixing screw',(x,.044,.014),(.003,.003,.001),'Chrome',8,4)
    # Plain registration seals preserve the familiar layout without copying an official seal.
    for y in [-.017,.016]:ellipsoid('Registration seal',(-.100,y,.014),(.010,.010,.001),'Chrome',12,4)
    transform=Matrix.Translation(Vector(pos))@Euler((math.pi/2,0,math.pi if rear else 0)).to_matrix().to_4x4()
    for obj in set(bpy.data.objects)-before:obj.matrix_world=transform@obj.matrix_world


def service_badge(sign,body):
    # Original department-08 star, integrated into the rear-door vinyl.
    points=[]
    for i in range(32):
        a=i*math.tau/32;r=.13 if i%4==0 else .10 if i%2==0 else .077
        points.append((sign*.932,.64+math.cos(a)*r,.78+math.sin(a)*r))
    fitted(mesh('Department star',points,[tuple(range(32))],'WhiteLettering',False),body)
    points=[(sign*.94,.64+math.cos(i*math.tau/32)*.060,.78+math.sin(i*math.tau/32)*.066) for i in range(32)]
    fitted(mesh('Department medallion',points,[tuple(range(32))],'PoliceBlue',False),body,.006)
    fitted(label('08',(sign*.95,.64,.78),(math.pi/2,0,sign*math.pi/2),.074),body,.008)


def new_car(name):
    collection=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(collection)
    bpy.context.view_layer.active_layer_collection=bpy.context.view_layer.layer_collection.children[name]
    root=bpy.data.objects.new(name,None);collection.objects.link(root);root['front']='+Z';root['units']='metres'
    return root,collection


def make_beetle():
    root,col=new_car('beetle')
    root['license_plates']=2;root['registration']='B  AM 1967'
    rows=[(-1.95,.19,.50),(-1.76,.43,.69),(-1.25,.54,.86),(-.82,.60,1.06),(-.38,.62,1.42),(.10,.61,1.51),(.57,.58,1.40),(1.05,.53,1.10),(1.51,.45,.76),(1.91,.19,.46)]
    def shell(y,t,offset=0):
        w,h=sample(rows,y)
        return ((w+offset)*math.sin(t),y,.36+(h-.36)*max(0,math.cos(t))**.63+offset)
    body=grid('Continuous curved Beetle body',lambda u,v:shell(rows[0][0]+u*(rows[-1][0]-rows[0][0]),(v-.5)*math.pi),80,40,'BodyPaint')
    for y in [rows[0][0],rows[-1][0]]:
        vertices=[shell(y,-math.pi/2+i*math.pi/40) for i in range(41)];mesh('Closed boot end',vertices,[tuple(range(41))],'BodyPaint',False)
    cube('Chassis',(0,0,.28),(1.02,3.47,.17),'DarkTrim',.08)
    for sign in [-1,1]:
        for cy in [-1.19,1.18]:
            def fender(u,v):
                a=-.17+u*(math.pi+.34);r=.348+.17*math.sin(v*math.pi)
                return (sign*(.45+.37*v),cy+r*math.cos(a),.305+r*math.sin(a))
            grid('Swept wing',fender,40,12,'BodyPaint')
        pane('Front side glazing',lambda u,v:shell(-.29+u*.29,sign*(1.06+v*.205),.012),chrome=True)
        pane('Rear quarter glazing',lambda u,v:shell(.40+u*.32,sign*(1.045+v*.215),.012),chrome=True)
        # The quarterlight divider and door seams follow the actual shell.
        tube('Quarterlight divider',[shell(-.48,sign*t,.012) for t in [.90,.98,1.08,1.21]],.008,'Chrome')
        tube('Door shutline',[shell(.066,sign*t,.009) for t in [1.23,1.35,1.47,1.55]],.005,'DarkTrim')
        tube('Beltline bright trim',[shell(y,sign*1.30,.012) for y in [-1.2,-.7,0,.6,1.1]],.009,'Chrome')
        cube('Running board',(sign*.635,0,.29),(.25,1.63,.07),'Rubber',.028)
        tube('Running board edge',[(sign*.768,-.76,.31),(sign*.768,.76,.31)],.013,'Chrome')
        cube('Door handle',(sign*.618,-.02,.79),(.035,.15,.026),'Chrome',.01)
        tube('Mirror stalk',[(sign*.60,-.63,.96),(sign*.77,-.67,1.03)],.015,'Chrome')
        ellipsoid('Oval wing mirror',(sign*.79,-.69,1.07),(.026,.083,.058),'Chrome')
        ellipsoid('Headlight wing housing',(sign*.66,-1.555,.62),(.16,.14,.17),'BodyPaint')
        round_lamp(sign*.66,-1.655,.62,.127)
        ellipsoid('Rear lamp housing',(sign*.665,1.61,.61),(.085,.065,.117),'BodyPaint')
        ellipsoid('Rear lamp lens',(sign*.665,1.66,.62),(.063,.021,.091),'BrakeLens')
        ellipsoid('Wing indicator',(sign*.67,-1.22,.846),(.04,.11,.033),'Indicator',16,8)
        for y in [-1.98,1.98]:cube('Bumper overrider',(sign*.46,y,.41),(.06,.067,.24),'Chrome',.025)
    pane('Raked front windscreen',lambda u,v:shell(-.595+v*.17,u*.78,.014),chrome=True)
    pane('Curved rear windscreen',lambda u,v:shell(.875+v*.19,u*.73,.014),chrome=True)
    for x in [-.31,-.23,-.15,-.07,.07,.15,.23,.31]:
        tube('Rear cooling slot',[shell(y,math.asin(x/sample(rows,y)[0]),.011) for y in [1.11,1.16,1.22,1.27]],.008,'DarkTrim')
    tube('Bonnet centre seam',[shell(y,0,.007) for y in [-1.8,-1.6,-1.3,-1.02,-.88]],.005,'Chrome')
    for y in [-1.98,1.98]:bumper(y,.74,.33)
    for x in [-.22,.22]:tube('Twin exhaust',[(x,1.72,.19),(x,2.02,.19)],.026,'Chrome',10)
    plate('B  AM 1967',(0,-1.965,.453))
    plate('B  AM 1967',(0,1.944,.457),True)
    wheels(root,[-1.19,1.18],.685,.305)
    return root,col


def make_trabant():
    root,col=new_car('trabant')
    root['license_plates']=2;root['registration']='L  AM 601'
    body=lower_body('Duroplast body',[(-1.72,.59,.30,.70),(-1.60,.72,.28,.91),(-1.08,.75,.26,.99),(-.64,.75,.25,1.01),(.80,.74,.25,1.0),(1.46,.69,.28,.93),(1.72,.59,.32,.75)])
    arches(body,[-1.025,1.025],.30,.30)
    roof,side=cabin('Trabant cabin',[(-.78,.70,1.0),(-.55,.69,1.20),(-.20,.68,1.435),(.50,.68,1.435),(.78,.67,1.32),(1.02,.66,1.0)],.97,'RoofPaint')
    for sign in [-1,1]:
        pane('Trabant front side window',lambda u,v:side(-.19+u*.32,.53+v*.37,sign,.005))
        pane('Trabant rear side window',lambda u,v:side(.525+u*.28,.53+v*.37,sign,.005))
        tube('Door seam',[(sign*.753,.17,.38),(sign*.756,.17,.93)],.005,'DarkTrim')
        tube('Side bright trim',[(sign*.742,-1.41,.95),(sign*.764,-.62,1.0),(sign*.754,.83,.985),(sign*.69,1.45,.92)],.01,'Chrome')
        cube('Door handle',(sign*.758,.04,.865),(.036,.14,.027),'Chrome',.01)
        tube('Mirror support',[(sign*.70,-.59,1.0),(sign*.84,-.63,1.035)],.017,'Chrome')
        cube('Mirror housing',(sign*.86,-.65,1.08),(.052,.17,.10),'Chrome',.025)
        round_lamp(sign*.558,-1.637,.773,.133)
        cube('Front amber indicator',(sign*.56,-1.711,.535),(.19,.036,.07),'Indicator',.022)
        cube('Rear lamp',(sign*.57,1.678,.66),(.10,.045,.235),'BrakeLens',.025)
    pane('Trabant windscreen',lambda u,v:(roof(-.56+v*.19,u*.91)[0],-.56+v*.19,roof(-.56+v*.19,u*.91)[2]+.004))
    pane('Trabant rear glass',lambda u,v:(roof(.825+v*.13,u*.87)[0],.825+v*.13,roof(.825+v*.13,u*.87)[2]+.005))
    cube('Recessed rounded grille',(0,-1.727,.673),(.94,.025,.218),'DarkTrim',.055)
    for z in [.59,.63,.67,.71,.75]:tube('Fine horizontal grille',[(x,-1.745+abs(x)*.014,z) for x in [-.41,-.2,0,.2,.41]],.008,'Chrome',6)
    for x in [-.32,-.16,0,.16,.32]:tube('Grille rib',[(x,-1.748,.595),(x,-1.748,.746)],.004,'Chrome',4)
    for y in [-1.765,1.765]:bumper(y,.69,.377)
    plate('L  AM 601',(0,-1.765,.469))
    plate('L  AM 601',(0,1.787,.525),True)
    wipers([((-.40,-.75,1.01),(-.30,-.54,1.23),(-.07,-.47,1.27)),((.20,-.75,1.01),(.30,-.54,1.23),(.51,-.47,1.25))])
    wheels(root,[-1.025,1.025],.696,.30)
    return root,col


def make_police():
    root,col=new_car('police-estate')
    root['license_plates']=2;root['registration']='B   7408'
    root['livery']='Silver-blue-yellow wrap; hood, both doors, rear and roof markings; segmented reflective strips; department-08 stars'
    rows=[(-2.24,.67,.24,.69),(-2.14,.83,.24,.83),(-1.62,.895,.23,.945),(-1.02,.90,.22,1.005),(.82,.91,.22,1.015),(1.64,.895,.24,.987),(2.15,.815,.30,.93),(2.24,.70,.32,.90)]
    body=lower_body('Silver blue estate body',rows,True)
    arches(body,[-1.37,1.36],.335,.335)
    cabin_rows=[(-1.06,.83,1.02),(-.82,.83,1.22),(-.39,.81,1.455),(.35,.82,1.49),(1.23,.80,1.46),(1.64,.79,1.36),(1.95,.77,1.02)]
    roof,side=cabin('Touring cabin',cabin_rows,.99,'PoliceSilver')
    def side_vinyl(y,z,sign,offset=.004):
        w,bottom,top=sample(rows,y);q=max(-.998,min(.998,(z-(bottom+top)/2)/((top-bottom)/2)))
        return (sign*(w*(1-abs(q)**(2/.45))**(.45/2)+offset),y,z)
    def bonnet(x,y,offset=.004):
        w,bottom,top=sample(rows,y)
        return (x,y,(bottom+top)/2+(top-bottom)/2*(1-min(.999,abs(x/w))**(2/.45))**(.45/2)+offset)
    grid('Full bonnet police-blue vinyl',lambda u,v:bonnet((u*2-1)*(.62+.09*v),-2.015+v*.955),22,20,'PoliceBlue')
    for sign in [-1,1]:
        grid('Bonnet fluorescent edge',lambda u,v:bonnet(sign*(.62+.09*v+u*.075),-2.015+v*.955,.006),3,20,'ReflectiveYellow')
    fitted(label('POLIZEI',(0,-1.475,1.04),(0,0,0),.26,width=.98),body,.008)
    # Roof identification sits behind the lightbar and follows the curved roof.
    roof_id=label('B 08-110',(0,.77,1.55),(0,0,0),.26,'PoliceBlue',.91)
    for v in roof_id.data.vertices:
        x,y=v.co.x+roof_id.location.x,v.co.y+roof_id.location.y
        v.co.z=roof(y,x/(sample(cabin_rows,y)[0]*.84))[2]+.005-roof_id.location.z
    for sign in [-1,1]:
        pane('Front door glass',lambda u,v:side(-.255+u*.44,.51+v*.39,sign,.005))
        pane('Rear door glass',lambda u,v:side(.655+u*.39,.51+v*.39,sign,.005))
        pane('Estate quarter glass',lambda u,v:side(1.42+u*.285,.51+v*.36,sign,.005))
        for y in [.21,1.1]:tube('Door shutline',[(sign*.914,y,.35),(sign*.918,y,.95)],.005,'DarkTrim')
        for y in [.02,.98]:cube('Pull handle',(sign*.924,y,.877),(.026,.21,.042),'Chrome',.02)
        tube('Roof rail',[(sign*.66,-.38,1.475),(sign*.68,.25,1.53),(sign*.66,1.25,1.51),(sign*.63,1.57,1.42)],.023,'Chrome',8)
        cube('Mirror arm',(sign*.876,-.72,1.05),(.20,.095,.05),'DarkTrim',.02)
        ellipsoid('Mirror fairing',(sign*1.0,-.75,1.09),(.085,.15,.07),'PoliceSilver',20,10)
        cube('Swept headlight',(sign*.615,-2.235,.752),(.365,.062,.105),'Glass',.04)
        for x in [.50,.68]:ellipsoid('Projector lens',(sign*x,-2.268,.753),(.036,.009,.034),'Headlamp',16,8)
        cube('Tail lamp',(sign*.63,2.256,.802),(.32,.033,.123),'BrakeLens',.035)
        for i in range(22):
            y=-2.04+i*.192;z=min(.881,sample(rows,y)[2]-.052)
            grid('Segmented shoulder reflector',lambda u,v:side_vinyl(y+(u-.5)*.137,z+(v-.5)*.033,sign,.006),2,2,'WhiteLettering')
        for i in range(10):
            y=-.86+i*.192
            grid('Lower door reflector',lambda u,v:side_vinyl(y+(u-.5)*.137,.602+(v-.5)*.027,sign,.006),2,2,'WhiteLettering')
        # The door lettering, unit star and emergency number are applied to the actual shell.
        fitted(label('POLIZEI',(sign*.94,-.37,.782),(math.pi/2,0,sign*math.pi/2),.24,width=1.02),body,.007)
        fitted(label('ABSCHNITT 08',(sign*.94,-.35,.668),(math.pi/2,0,sign*math.pi/2),.061,width=.65),body,.007)
        service_badge(sign,body)
        fitted(label('NOTRUF',(sign*.94,1.78,.831),(math.pi/2,0,sign*math.pi/2),.074,width=.34),body,.018)
        fitted(label('110',(sign*.94,1.78,.753),(math.pi/2,0,sign*math.pi/2),.098,width=.26),body,.012)
    pane('Estate front windscreen',lambda u,v:(roof(-.795+v*.21,u*.91)[0],-.795+v*.21,roof(-.795+v*.21,u*.91)[2]+.005))
    pane('Estate rear glass',lambda u,v:(roof(1.755+v*.16,u*.90)[0],1.755+v*.16,roof(1.755+v*.16,u*.90)[2]+.005))
    cube('Rear spoiler',(0,1.685,1.39),(1.36,.19,.047),'PoliceSilver',.026)
    for x in [-.19,.19]:
        cube('Paired grille surround',(x,-2.258,.735),(.30,.035,.166),'Chrome',.06)
        cube('Paired grille inlet',(x,-2.281,.735),(.262,.02,.127),'DarkTrim',.045)
        for dx in [-.08,-.04,0,.04,.08]:tube('Grille slat',[(x+dx,-2.298,.69),(x+dx,-2.298,.78)],.004,'Chrome',4)
    cube('Lower air intake',(0,-2.255,.435),(1.35,.03,.15),'DarkTrim',.065)
    rear_panel=[(-.68,2.246,.432),(-.68,2.246,.61),(-.48,2.246,.738),(.48,2.246,.738),(.68,2.246,.61),(.68,2.246,.432)]
    fitted(mesh('Rear fluorescent visibility field',rear_panel,[tuple(range(6))],'ReflectiveYellow',False),body,.004)
    for sign in [-1,1]:
        fitted(mesh('Rear diagonal blue foil',[(sign*x,2.251,z) for x,z in [(.31,.44),(.46,.44),(.66,.68),(.51,.73)]],[(0,1,2,3)],'PoliceBlue',False),body,.007)
        for i in range(4):
            x=sign*(.14+i*.145)
            cube('Rear upper fluorescent segment',(x,2.250,.887),(.116,.005,.024),'ReflectiveYellow',.004)
    plate('B   7408',(0,-2.294,.562))
    plate('B   7408',(0,2.262,.622),True)
    fitted(label('POLIZEI',(0,2.266,.814),(math.pi/2,0,math.pi),.177,width=.75),body,.009)
    for sign in [-1,1]:
        cube('Front bumper yellow reflector',(sign*.63,-2.272,.555),(.19,.008,.047),'ReflectiveYellow',.01)
    # One correctly proportioned transverse lightbar with two integrated LED banks.
    for x in [-.43,.43]:cube('Lightbar mounting foot',(x,-.06,1.525),(.09,.14,.085),'DarkTrim',.02)
    cube('Lightbar base',(0,-.06,1.57),(1.16,.26,.07),'DarkTrim',.032)
    cube('Lightbar centre',(0,-.06,1.643),(.56,.237,.115),'Chrome',.027)
    for sign in [-1,1]:
        material='BeaconLeft' if sign<0 else 'BeaconRight'
        cube('Integrated blue LED bank',(sign*.431,-.06,1.651),(.303,.248,.13),material,.044)
        for y in [-.183,.063]:
            for x in [.34,.40,.46,.52]:cube('LED optic',(sign*x,y,1.65),(.028,.004,.056),material,.006)
    wipers([((-.51,-1.01,1.025),(-.35,-.79,1.26),(-.06,-.68,1.325)),((.18,-1.01,1.025),(.29,-.79,1.26),(.55,-.69,1.30))])
    wheels(root,[-1.37,1.36],.84,.335,True)
    return root,col


def batch(root,col):
    for obj in list(col.objects):
        if obj!=root and obj.parent is None:obj.parent=root
    # Merge only within a rigid owner; never merge wheels into the body.
    owners=[root]+[obj for obj in col.objects if '__Wheel_' in obj.name]
    for owner in owners:
        parts=[obj for obj in col.objects if obj.type=='MESH' and obj.parent==owner]
        if not parts:continue
        bpy.ops.object.select_all(action='DESELECT')
        for obj in parts:obj.select_set(True)
        bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join()
        obj=bpy.context.object;obj.name=owner.name+'_mesh'
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        # Recalculate outward normals after mirrored procedural surfaces and booleans.
        bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()


cars=[make_beetle(),make_trabant(),make_police()]
manifest={'author':'Original project-authored Blender geometry; no imported meshes or textures','source':'vehicles.blend','script':'../../../tools/build-vehicle-assets.py','axes':'Y-up, +Z-front, ground-centred; wheel pivots rotate about local X; front steering about Y','models':{}}
for root,col in cars:
    batch(root,col)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in col.objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=root
    path=OUT/(root.name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_texcoords=False,export_normals=True,export_cameras=False,export_lights=False,export_extras=True)
    tris=sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in col.objects if obj.type=='MESH')
    points=[obj.matrix_world@Vector(p) for obj in col.objects if obj.type=='MESH' for p in obj.bound_box]
    dimensions=[max(p[i] for p in points)-min(p[i] for p in points) for i in [0,2,1]]
    manifest['models'][root.name]={'file':path.name,'triangles':tris,'dimensions_xyz':[round(v,4) for v in dimensions],'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}

# Editable source and multi-angle studio review, excluded from all game requests.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=1500;scene.render.resolution_y=980;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.world.color=(.36,.36,.36)
bpy.context.view_layer.active_layer_collection=bpy.context.view_layer.layer_collection
ground=cube('Studio floor',(0,0,-.08),(22,18,.1),'RoofPaint',0)
for loc,energy,size in [((0,-5,8),1600,7),((4,4,6),1200,6),((-6,0,4),900,5)]:
    bpy.ops.object.light_add(type='AREA',location=loc);lamp=bpy.context.object;lamp.data.energy=energy;lamp.data.shape='DISK';lamp.data.size=size;lamp.rotation_euler=(-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(9,-12,9));camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=12.8;camera.rotation_euler=(Vector((0,0,.7))-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
for i,(root,col) in enumerate(cars):root.location.x=(i-1)*3.65
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'vehicles.blend'),compress=True)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
if '--no-render' not in sys.argv:
    scene.render.filepath=str(REVIEW/'fleet-front.png');bpy.ops.render.render(write_still=True)
    camera.location=(8,12,7);camera.rotation_euler=(Vector((0,0,.7))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(REVIEW/'fleet-rear.png');bpy.ops.render.render(write_still=True)
print('VEHICLE_EXPORT',json.dumps(manifest))
