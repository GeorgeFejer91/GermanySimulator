"""Author the original, texture-free Germany Simulator city kit in Blender.

Run: blender --background --python tools/build-city-assets.py
One editable collection/mesh per model, with material-batched GLB exports.
Blender +Z is up and -Y is front; glTF exports Y-up and +Z-front.
"""
import bpy
import hashlib
import json
import math
from pathlib import Path
import random
import sys
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/models/city-kit"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for collection in list(bpy.data.collections):
    if collection.name != "Collection":
        bpy.data.collections.remove(collection)

# Restrained stone, painted metal, timber and foliage; never a texture download.
PALETTE = {
    "limestone": (0.53, 0.50, 0.44, 1), "stone-trim": (0.68, 0.65, 0.58, 1),
    "concrete": (0.43, 0.44, 0.42, 1), "dark-stone": (0.27, 0.28, 0.27, 1),
    "window-glass": (0.13, 0.21, 0.24, 1), "window-reflection": (0.26, 0.35, 0.37, 1),
    "painted-metal": (0.19, 0.22, 0.21, 1), "galvanized-steel": (0.40, 0.43, 0.42, 1),
    "slate": (0.19, 0.21, 0.22, 1), "brick": (0.41, 0.26, 0.20, 1),
    "brick-highlight": (0.51, 0.36, 0.29, 1), "mortar": (0.48, 0.46, 0.41, 1),
    "wood": (0.36, 0.28, 0.19, 1), "wood-light": (0.48, 0.37, 0.23, 1),
    "off-white": (0.79, 0.77, 0.69, 1), "charcoal": (0.055, 0.065, 0.063, 1),
    "muted-green": (0.25, 0.34, 0.23, 1), "leaf-dark": (0.12, 0.20, 0.105, 1),
    "leaf-mid": (0.22, 0.31, 0.145, 1), "leaf-light": (0.32, 0.39, 0.20, 1),
    "bark": (0.24, 0.20, 0.15, 1), "muted-red": (0.48, 0.16, 0.11, 1),
    "skin": (0.65, 0.43, 0.30, 1), "blue-coat": (0.20, 0.29, 0.36, 1),
    "screen": (0.36, 0.61, 0.56, 1), "lamp-glass": (0.88, 0.84, 0.65, 1),
    "bottle-glass": (0.14, 0.29, 0.16, 1),
}
MATS = {}
for name, color in PALETTE.items():
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = 0.37 if "glass" in name or name == "screen" else 0.84
    bsdf.inputs["Metallic"].default_value = 0.38 if "steel" in name else 0.06
    MATS[name] = material


class Mesh:
    def __init__(self, name):
        self.name = name
        self.vertices, self.faces, self.materials, self.smooth = [], [], [], []
        self.names = []

    def add(self, vertices, faces, material, smooth=False):
        if material not in self.names:
            self.names.append(material)
        start = len(self.vertices)
        self.vertices.extend(vertices)
        self.faces.extend(tuple(start + i for i in face) for face in faces)
        self.materials.extend([self.names.index(material)] * len(faces))
        self.smooth.extend([smooth] * len(faces))

    def box(self, center, size, material, angle=0):
        x, y, z = center
        w, d, h = (v / 2 for v in size)
        c, s = math.cos(angle), math.sin(angle)
        vertices = [(x + u*c-v*s, y + u*s+v*c, z + k)
                    for u, v, k in [(-w,-d,-h),(w,-d,-h),(w,d,-h),(-w,d,-h),
                                    (-w,-d,h),(w,-d,h),(w,d,h),(-w,d,h)]]
        self.add(vertices, [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)], material)

    def cylinder(self, a, b, ra, rb, material, segments=12):
        av, bv = Vector(a), Vector(b)
        normal = (bv-av).normalized()
        tangent = normal.cross(Vector((0,0,1)) if abs(normal.z)<0.9 else Vector((0,1,0))).normalized()
        bitangent = normal.cross(tangent)
        vertices = [tuple(p + radius*(math.cos(i*math.tau/segments)*tangent + math.sin(i*math.tau/segments)*bitangent))
                    for p, radius in [(av,ra),(bv,rb)] for i in range(segments)]
        faces = [(i,(i+1)%segments,(i+1)%segments+segments,i+segments) for i in range(segments)]
        faces += [tuple(reversed(range(segments))),tuple(range(segments,segments*2))]
        self.add(vertices,faces,material,True)

    def ellipsoid(self, center, scale, material, segments=12, rings=7):
        vertices=[]
        for j in range(rings+1):
            theta=math.pi*j/rings
            for i in range(segments):
                phi=math.tau*i/segments
                vertices.append(tuple(center[k]+scale[k]*v for k,v in enumerate((math.sin(theta)*math.cos(phi),math.sin(theta)*math.sin(phi),math.cos(theta)))))
        faces=[(j*segments+i,(j+1)*segments+i,(j+1)*segments+(i+1)%segments,j*segments+(i+1)%segments)
               for j in range(rings) for i in range(segments)]
        self.add(vertices,faces,material,True)

    def torus(self, center, major, minor, material, axis="z", segments=24, sides=8):
        vertices=[]
        for i in range(segments):
            u=math.tau*i/segments
            for j in range(sides):
                v=math.tau*j/sides
                xyz=((major+minor*math.cos(v))*math.cos(u),(major+minor*math.cos(v))*math.sin(u),minor*math.sin(v))
                if axis=="y": xyz=(xyz[0],xyz[2],xyz[1])
                vertices.append(tuple(center[k]+xyz[k] for k in range(3)))
        faces=[(i*sides+j,((i+1)%segments)*sides+j,((i+1)%segments)*sides+(j+1)%sides,i*sides+(j+1)%sides)
               for i in range(segments) for j in range(sides)]
        self.add(vertices,faces,material,True)

    def roof(self,w,d,eave,ridge,material):
        self.add([(-w/2,-d/2,eave),(w/2,-d/2,eave),(w/2,d/2,eave),(-w/2,d/2,eave),(-w/2,0,ridge),(w/2,0,ridge)],
                 [(0,1,5,4),(2,3,4,5),(0,4,3),(1,2,5)],material)

    def finish(self):
        lo=[min(v[i] for v in self.vertices) for i in range(3)]
        hi=[max(v[i] for v in self.vertices) for i in range(3)]
        origin=((lo[0]+hi[0])/2,(lo[1]+hi[1])/2,lo[2])
        self.vertices=[tuple(v[i]-origin[i] for i in range(3)) for v in self.vertices]
        mesh=bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.vertices,[],self.faces)
        mesh.update()
        for name in self.names: mesh.materials.append(MATS[name])
        for polygon,material,smooth in zip(mesh.polygons,self.materials,self.smooth):
            polygon.material_index=material
            polygon.use_smooth=smooth
        obj=bpy.data.objects.new(self.name,mesh)
        collection=bpy.data.collections.new(self.name)
        bpy.context.scene.collection.children.link(collection)
        collection.objects.link(obj)
        # Each source is editable as one mesh; material selection isolates facade details.
        for vertex in mesh.vertices:
            assert all(math.isfinite(c) for c in vertex.co)
        assert min(v.co.z for v in mesh.vertices) >= -0.001, self.name
        return obj


def window(mesh,x,y,z,width=1.0,height=1.2,side=0,ornate=False):
    # Black recess, inner pane, projecting masonry reveal and a narrow mullion.
    def part(xx,yy,zz,w,d,h,material):
        yy *= 1 if y < 0 else -1
        if side: mesh.box((y+yy,x+xx,z+zz),(d,w,h),material)
        else: mesh.box((x+xx,y+yy,z+zz),(w,d,h),material)
    part(0,-.015,0,width+.17,.065,height+.17,"charcoal")
    part(0,-.06,0,width,.04,height,"window-glass")
    for dx in [-width/2-.04,width/2+.04]: part(dx,-.10,0,.085,.14,height+.28,"stone-trim")
    part(0,-.12,-height/2-.07,width+.33,.26,.12,"stone-trim")
    part(0,-.09,height/2+.07,width+.21,.16,.09,"stone-trim")
    part(0,-.11,0,.045,.06,height,"galvanized-steel")
    part(0,-.105,.13,width,.05,.038,"galvanized-steel")
    if ornate: part(0,-.13,height/2+.19,width+.4,.24,.10,"limestone")


def entrance(mesh,y,width=1.7,height=2.1):
    mesh.box((0,y-.035,height/2+.06),(width+.3,.12,height+.12),"dark-stone")
    mesh.box((0,y-.11,height/2),(width,.08,height),"window-glass")
    for x in [-width/2,0,width/2]: mesh.box((x,y-.17,height/2),(.055,.07,height),"galvanized-steel")
    mesh.box((0,y-.2,.055),(width+.7,.5,.11),"stone-trim")
    for x in [-.12,.12]: mesh.cylinder((x,y-.23,.85),(x,y-.23,1.22),.018,.018,"galvanized-steel",8)


def municipal():
    m=Mesh("municipal-office")
    m.box((0,0,3.65),(12,8,7.3),"concrete")
    m.box((0,0,.24),(12.12,8.12,.48),"dark-stone")
    for z in [2.55,4.8,7.22]: m.box((0,0,z),(12.25,8.25,.19),"stone-trim")
    for x in [-5.9,-4,-2,2,4,5.9]: m.box((x,-4.055,3.85),(.14,.14,6.85),"limestone")
    for z in [1.48,3.6,5.88]:
        for x in [-5,-3,-1,1,3,5]:
            if z==1.48 and abs(x)<1.1: continue
            window(m,x,-4,z,1.28,1.48)
        for x in [-5,-3,-1,1,3,5]: window(m,x,4.15,z,1.28,1.48)
        for y in [-2.65,-.85,.95,2.75]:
            window(m,y,-6,z,1.0,1.48,side=1)
            window(m,y,6.15,z,1.0,1.48,side=1)
    entrance(m,-4)
    m.box((0,-4.45,2.36),(3.1,1.05,.15),"dark-stone")
    for x in [-1.42,1.42]: m.cylinder((x,-4.73,.02),(x,-4.73,2.28),.04,.04,"galvanized-steel")
    m.box((0,0,7.36),(12.32,8.32,.15),"dark-stone")
    for x in [-6.08,6.08]: m.box((x,0,7.55),(.12,8.24,.3),"stone-trim")
    for y in [-4.08,4.08]: m.box((0,y,7.55),(12.24,.12,.3),"stone-trim")
    m.box((2.6,1.8,7.8),(2.1,1.45,.72),"painted-metal")
    for x in [1.85,2.15,2.45,2.75,3.05,3.35]: m.box((x,1.045,7.8),(.07,.035,.48),"charcoal")
    return m


def berlin():
    m=Mesh("berlin-block")
    m.box((0,0,3.9),(12,8,7.8),"limestone")
    m.box((0,0,.27),(12.14,8.14,.54),"dark-stone")
    for z in [.75,2.65,4.95,7.28,7.72]: m.box((0,0,z),(12.24,8.24,.14),"stone-trim")
    for side in [-1,1]:
        for z in [1.5,3.8,6.1]:
            for x in [-4.9,-2.45,0,2.45,4.9]:
                if z==1.5 and x==0 and side==-1: continue
                window(m,x,side*4+(0.16 if side==1 else 0),z,1.2,1.56,ornate=True)
    for z in [1.5,3.8,6.1]:
        for y in [-2.6,0,2.6]:
            window(m,y,-6,z,1.15,1.56,side=1,ornate=True)
            window(m,y,6.16,z,1.15,1.56,side=1,ornate=True)
    for x in [-5.85,5.85]:
        for z in [i*.37+.85 for i in range(18)]: m.box((x,-4.09,z),(.45,.2,.29),"stone-trim")
    entrance(m,-4,1.6,2.2)
    m.box((0,-4.22,2.38),(2.5,.5,.17),"stone-trim")
    m.roof(12.65,8.5,7.85,10.0,"slate")
    for x in [-3.8,3.8]:
        m.box((x,1.4,9.54),(.54,.66,1.36),"brick")
        m.box((x,1.4,10.22),(.68,.8,.14),"dark-stone")
    # Roof courses and small front dormers read at the game's oblique camera.
    for y in [-3.4,-2.65,-1.9,-1.15]:
        z=10.0-abs(y)/4.25*2.15
        m.box((0,y,z+.015),(12.6,.025,.025),"galvanized-steel")
    for x in [-3.6,0,3.6]:
        m.box((x,-2.7,8.76),(1.1,.8,.82),"limestone")
        window(m,x,-3.11,8.76,.66,.6)
        m.box((x,-2.7,9.2),(1.25,1.03,.12),"slate")
    for x in [-5.95,5.95]: m.cylinder((x,-4.19,.3),(x,-4.19,7.81),.035,.035,"galvanized-steel",8)
    return m


def brick():
    m=Mesh("brick-utility")
    m.box((0,0,2.2),(10,7,4.4),"brick")
    m.box((0,0,.19),(10.14,7.14,.38),"dark-stone")
    # Projecting brick piers and sparse mortar bonds establish actual masonry scale.
    for x in [-4.85,-2.6,2.6,4.85]: m.box((x,-3.56,2.38),(.31,.2,4.08),"brick-highlight")
    for z in [.8,1.35,1.9,2.45,3.0,3.55,4.1]:
        m.box((0,-3.515,z),(9.8,.022,.022),"mortar")
        m.box((0,3.515,z),(9.8,.022,.022),"mortar")
    for x in [-3.7,3.7]:
        window(m,x,-3.52,2.18,1.55,2.15)
        window(m,x,3.65,2.18,1.55,2.15)
    entrance(m,-3.5,2.6,2.9)
    m.box((0,-3.92,3.16),(3.5,1.0,.15),"painted-metal")
    for x in [-5,5]:
        for y in [-2.15,0,2.15]: window(m,y,x+(0.15 if x>0 else -.015),2.3,1.25,1.6,side=1)
    m.box((0,0,4.44),(10.4,7.4,.2),"dark-stone")
    m.roof(10.4,7.4,4.54,5.6,"slate")
    m.cylinder((3.7,1.6,4.8),(3.7,1.6,6.1),.18,.18,"galvanized-steel")
    m.cylinder((3.7,1.6,6.08),(3.7,1.6,6.18),.28,.28,"dark-stone")
    return m


def shop():
    m=Mesh("neighborhood-shop")
    m.box((0,0,1.65),(8,5,3.3),"limestone")
    m.box((0,0,.19),(8.16,5.12,.38),"dark-stone")
    for x in [-2.5,2.5]: window(m,x,-2.5,1.52,2.3,1.94)
    entrance(m,-2.5,1.35,2.35)
    m.box((0,-2.77,2.89),(8.25,.65,.18),"muted-green")
    m.box((0,-2.52,3.12),(8.1,.14,.32),"stone-trim")
    m.box((0,0,3.43),(8.28,5.28,.22),"slate")
    for x in [-3.2,3.2]: window(m,x,2.65,1.65,1,1.3)
    return m


def machine(kind):
    m=Mesh(kind)
    m.box((0,0,.07),(1.14,.87,.14),"charcoal")
    m.box((0,0,1.09),(1.12,.83,2.04),"off-white")
    m.box((0,-.43,1.12),(1.03,.055,1.96),"painted-metal")
    m.box((0,0,2.14),(1.15,.88,.1),"galvanized-steel")
    for x in [-.52,.52]: m.box((x,-.47,1.1),(.035,.04,1.94),"galvanized-steel")
    if kind=="pfand-machine":
        m.cylinder((-.16,-.47,1.43),(-.16,-.505,1.43),.265,.265,"charcoal",32)
        m.torus((-.16,-.54,1.43),.265,.035,"galvanized-steel","y",32)
        m.torus((-.16,-.548,1.43),.213,.01,"muted-green","y",24)
        m.box((.32,-.481,1.48),(.24,.03,.27),"screen")
        m.box((.29,-.493,1.16),(.26,.04,.09),"charcoal")
        m.box((.29,-.57,1.09),(.31,.19,.035),"galvanized-steel")
        m.box((.27,-.55,1.125),(.12,.1,.012),"off-white")
        m.box((-.07,-.476,.55),(.75,.03,.63),"galvanized-steel")
        for x in [-.37,-.26,-.15,-.04,.07,.18,.29]: m.box((x,-.5,.34),(.055,.02,.12),"charcoal")
    else:
        m.box((-.08,-.48,1.57),(.58,.04,.36),"charcoal")
        m.box((-.08,-.51,1.6),(.43,.02,.2),"screen")
        m.box((-.11,-.485,.94),(.65,.045,.61),"charcoal")
        m.box((-.11,-.59,.64),(.73,.3,.06),"galvanized-steel")
        m.cylinder((-.11,-.48,1.16),(-.11,-.56,1.16),.05,.05,"galvanized-steel",12)
        m.cylinder((-.11,-.57,.685),(-.11,-.57,.87),.085,.105,"off-white",14)
        for z in [1.18,1.31,1.44]: m.cylinder((.36,-.46,z),(.36,-.5,z),.032,.032,"off-white",10)
        m.box((.32,-.487,.81),(.16,.03,.07),"charcoal")
    return m


def fax():
    m=Mesh("fax-kiosk")
    for x in [-.59,.59]: m.box((x,.12,1.24),(.095,.095,2.48),"galvanized-steel")
    m.box((0,.36,1.37),(1.25,.09,2.08),"muted-green")
    for x in [-.63,.63]: m.box((x,-.07,1.65),(.065,.8,1.08),"window-glass")
    m.box((0,-.04,2.53),(1.42,1.08,.13),"painted-metal")
    m.box((0,-.02,1.05),(1.23,.77,.13),"galvanized-steel")
    m.box((0,-.03,1.23),(.83,.55,.26),"off-white")
    m.box((-.07,-.35,1.39),(.29,.035,.09),"screen")
    for x in [.16,.24,.32]:
        for z in [1.31,1.39]: m.box((x,-.346,z),(.038,.03,.038),"charcoal")
    m.box((0,.19,1.55),(.57,.06,.38),"off-white")
    m.box((0,-.41,1.18),(.53,.19,.025),"off-white")
    m.box((0,-.34,1.24),(.6,.02,.025),"charcoal")
    m.box((-.46,-.02,1.28),(.14,.48,.13),"charcoal")
    return m


def gnome():
    m=Mesh("garden-gnome")
    for x in [-.12,.12]:
        m.ellipsoid((x,-.04,.08),(.13,.20,.08),"charcoal")
        m.cylinder((x,.025,.09),(x,.02,.24),.076,.085,"dark-stone")
    m.ellipsoid((0,.015,.35),(.22,.16,.25),"blue-coat",16,10)
    for x in [-.21,.21]:
        m.cylinder((x*.8,.015,.46),(x*1.15,-.04,.28),.075,.057,"blue-coat")
        m.ellipsoid((x*1.15,-.055,.27),(.06,.06,.075),"skin")
    m.ellipsoid((0,-.015,.565),(.157,.139,.17),"skin",16,10)
    # Beard has a tapered silhouette and clustered sculpted locks, not a cone head.
    m.ellipsoid((0,-.127,.467),(.153,.07,.15),"off-white",16,10)
    for x,z in [(-.095,.49),(-.055,.43),(0,.402),(.06,.44),(.102,.485)]:
        m.ellipsoid((x,-.155,z),(.04,.034,.083),"off-white",8,5)
    m.ellipsoid((0,-.171,.567),(.053,.066,.041),"skin")
    for x in [-.065,.065]:
        m.ellipsoid((x,-.14,.61),(.024,.015,.024),"off-white",10,6)
        m.ellipsoid((x,-.155,.611),(.010,.007,.012),"charcoal",8,5)
        m.ellipsoid((x,-.145,.643),(.04,.016,.013),"off-white",10,5)
    m.cylinder((0,.006,.67),(.035,.008,.89),.16,.06,"muted-red",20)
    m.cylinder((.035,.008,.89),(.095,.015,.99),.06,.002,"muted-red",16)
    m.torus((0,.007,.679),.149,.022,"muted-red",segments=20)
    for z in [.30,.365]: m.ellipsoid((0,-.147,z),(.017,.012,.017),"off-white",8,4)
    return m


def tree():
    m=Mesh("deciduous-tree")
    rng=random.Random(271828)
    def spray(center,size,material):
        vertices=[]
        for q in range(7):
            phi=math.tau*q/7
            vertices.append(tuple(center+Vector((math.cos(phi)*size,math.sin(phi)*size,.025*rng.random()))))
        vertices.append(tuple(center+Vector((0,0,.19))))
        vertices.append(tuple(center-Vector((0,0,.13))))
        faces=[(q,(q+1)%7,7) for q in range(7)]+[((q+1)%7,q,8) for q in range(7)]
        m.add(vertices,faces,material)
    trunk=[(0,0,0),(.03,.02,1.1),(-.05,.04,2.3),(.08,-.015,3.3),(.14,.025,4.8)]
    for i in range(len(trunk)-1): m.cylinder(trunk[i],trunk[i+1],.18-i*.032,.15-i*.032,"bark",12)
    for i in range(7):
        a=i*2.399
        m.cylinder((math.cos(a)*.35,math.sin(a)*.35,.015),(0,0,.52),.055,.085,"bark",7)
    for i in range(14):
        a=i*2.399
        start=(.04,0,2.0+i*.16)
        reach=1.1+(.25 if i%3==0 else 0)
        end=(math.cos(a)*reach,math.sin(a)*reach,3.8+i*.105)
        m.cylinder(start,end,.073-i*.002,.018,"bark",8)
        for j in range(2):
            aa=a+(.6 if j else -.4)
            tip=(end[0]+math.cos(aa)*.68,end[1]+math.sin(aa)*.68,end[2]+.65)
            m.cylinder(end,tip,.023,.007,"bark",6)
            # Irregular faceted crown lobes carry hundreds of small leaf sprays.
            center=Vector(tip)
            for k in range(8):
                direction=Vector((rng.uniform(-1,1),rng.uniform(-1,1),rng.uniform(-.7,1)))
                position=center+direction*.55
                size=rng.uniform(.27,.40)
                spray(position,size,["leaf-dark","leaf-mid","leaf-light"][(i+j+k)%3])
    for i in range(54):
        angle=i*2.399
        radius=.95*math.sqrt((i%18)/18)
        center=Vector((math.cos(angle)*radius,math.sin(angle)*radius,4.9+(i//18)*.54+rng.uniform(-.12,.12)))
        spray(center,rng.uniform(.29,.42),["leaf-dark","leaf-mid","leaf-light"][i%3])
    return m


def shed():
    m=Mesh("garden-shed")
    m.box((0,0,.1),(3.02,2.52,.2),"dark-stone")
    m.box((0,0,1.1),(3,2.5,2),"wood")
    for z in [.35+i*.2 for i in range(9)]:
        for y in [-1.256,1.256]: m.box((0,y,z),(3.0,.024,.018),"charcoal")
        for x in [-1.506,1.506]: m.box((x,0,z),(.024,2.5,.018),"charcoal")
    m.roof(3.26,2.82,2.16,2.85,"slate")
    for x in [-1.47,1.47]: m.box((x,-1.285,1.15),(.10,.07,2.1),"wood-light")
    m.box((-.48,-1.28,.94),(.85,.09,1.66),"wood-light")
    for x in [-.88,-.65,-.42,-.19]: m.box((x,-1.34,.94),(.019,.025,1.57),"wood")
    m.box((-.48,-1.354,.45),(.79,.025,.08),"wood")
    m.box((-.48,-1.354,1.45),(.79,.025,.08),"wood")
    m.ellipsoid((-.18,-1.385,.98),(.025,.035,.025),"charcoal",8,4)
    window(m,.72,-1.28,1.3,.63,.72)
    return m


def bench():
    m=Mesh("bench")
    for x in [-.73,.73]:
        for y in [-.2,.2]: m.cylinder((x,y,0),(x,y*.8,.47),.033,.033,"painted-metal",8)
        m.cylinder((x,.20,.3),(x,.30,1.0),.028,.028,"painted-metal",8)
        m.cylinder((x,-.28,.46),(x,.28,.46),.029,.029,"painted-metal",8)
    for y in [-.23,-.10,.03,.16]: m.box((0,y,.50),(2,.10,.07),"wood-light")
    for z in [.70,.84,.98]: m.box((0,.275,z),(2,.06,.10),"wood-light")
    for x in [-.92,.92]:
        m.cylinder((x,-.23,.52),(x,-.23,.73),.025,.025,"painted-metal",8)
        m.cylinder((x,-.25,.73),(x,.27,.73),.026,.026,"painted-metal",8)
    return m


def lamp():
    m=Mesh("streetlamp")
    m.cylinder((0,0,0),(0,0,.23),.16,.11,"painted-metal",16)
    m.cylinder((0,0,.2),(0,0,4.6),.073,.037,"galvanized-steel",12)
    m.cylinder((0,0,4.5),(0,-.58,4.75),.034,.034,"galvanized-steel",10)
    m.box((0,-.62,4.78),(.34,.64,.09),"painted-metal")
    m.box((0,-.62,4.728),(.27,.53,.025),"lamp-glass")
    m.box((0,-.075,.67),(.085,.024,.26),"dark-stone")
    return m


def bin_model():
    m=Mesh("litter-bin")
    m.cylinder((0,0,.025),(0,0,.10),.21,.21,"charcoal",16)
    m.cylinder((0,0,.10),(0,0,.77),.22,.235,"painted-metal",20)
    for i in range(20):
        a=i*math.tau/20
        m.cylinder((math.cos(a)*.23,math.sin(a)*.23,.15),(math.cos(a)*.239,math.sin(a)*.239,.73),.008,.008,"galvanized-steel",5)
    m.cylinder((0,0,.77),(0,0,.82),.255,.255,"galvanized-steel",20)
    m.cylinder((0,0,.824),(0,0,.83),.185,.185,"charcoal",20)
    m.cylinder((0,0,.025),(0,0,0),.19,.19,"charcoal",16)
    return m


def bollard():
    m=Mesh("bollard")
    m.cylinder((0,0,0),(0,0,.045),.115,.115,"dark-stone",12)
    m.cylinder((0,0,.04),(0,0,.85),.072,.072,"painted-metal",12)
    m.cylinder((0,0,.63),(0,0,.71),.074,.074,"off-white",12)
    m.ellipsoid((0,0,.85),(.073,.073,.045),"painted-metal",12,6)
    return m


def rack():
    m=Mesh("bicycle-rack")
    for x in [-.73,0,.73]:
        for y in [-.31,.31]: m.cylinder((x,y,0),(x,y,.65),.027,.027,"galvanized-steel",10)
        m.cylinder((x,-.31,.65),(x,-.2,.79),.027,.027,"galvanized-steel",10)
        m.cylinder((x,-.2,.79),(x,.2,.79),.027,.027,"galvanized-steel",10)
        m.cylinder((x,.2,.79),(x,.31,.65),.027,.027,"galvanized-steel",10)
    for y in [-.31,.31]: m.cylinder((-.86,y,.07),(.86,y,.07),.025,.025,"painted-metal",10)
    return m


def bottle():
    m=Mesh("pfand-bottle")
    profile=[(.057,0),(.064,.022),(.067,.07),(.065,.32),(.056,.37),(.026,.413),(.024,.474),(.029,.48),(.029,.50)]
    for (r0,z0),(r1,z1) in zip(profile,profile[1:]): m.cylinder((0,0,z0),(0,0,z1),r0,r1,"bottle-glass",16)
    m.cylinder((0,0,.12),(0,0,.26),.068,.068,"off-white",16)
    m.cylinder((0,0,.176),(0,0,.211),.069,.069,"muted-green",16)
    m.cylinder((0,0,.485),(0,0,.509),.03,.03,"galvanized-steel",16)
    return m


makers=[municipal,berlin,brick,shop,lambda:machine("pfand-machine"),lambda:machine("coffee-machine"),fax,gnome,tree,shed,bench,lamp,bin_model,bollard,rack,bottle]
objects=[make().finish() for make in makers]
manifest={"author":"Original project geometry authored with Blender Python; no imported models or textures", "source":"city-kit.blend", "script":"../../../tools/build-city-assets.py", "axis":"Y-up / +Z-front in GLB; ground-centered pivot", "models":{}}
for obj in objects:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active=obj
    path=OUT/(obj.name+".glb")
    bpy.ops.export_scene.gltf(filepath=str(path),export_format="GLB",use_selection=True,export_yup=True,export_apply=True,export_texcoords=False,export_normals=True,export_materials="EXPORT",export_cameras=False,export_lights=False)
    vertices=[v.co for v in obj.data.vertices]
    lo=[min(v[i] for v in vertices) for i in range(3)]
    hi=[max(v[i] for v in vertices) for i in range(3)]
    # Front-heavy details are intentionally included in the exact measured bounds.
    manifest["models"][obj.name]={"file":path.name,"dimensions_xyz":[round(hi[0]-lo[0],4),round(hi[2]-lo[2],4),round(hi[1]-lo[1],4)],"triangles":sum(len(p.vertices)-2 for p in obj.data.polygons),"materials":len(obj.data.materials),"bytes":path.stat().st_size,"sha256":hashlib.sha256(path.read_bytes()).hexdigest()}

# Source opens as a laid-out, labeled catalog. Per-asset exports above retain origin.
scene=bpy.context.scene
scene.render.engine="CYCLES"
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.threads_mode="FIXED"
scene.render.threads=4
scene.view_settings.view_transform="Standard"
scene.view_settings.look="Medium High Contrast"
scene.world.color=(.55,.55,.55)
scene.render.resolution_x=1600
scene.render.resolution_y=1150
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.render.film_transparent=False
for i,obj in enumerate(objects):
    if i<4: obj.location=(i*15-22.5,8,0)
    else:
        j=i-4
        obj.location=((j%6)*4.5-11.25,-4-(j//6)*6,0)
        if obj.name=="deciduous-tree": obj.location=(18,-7,0)
    curve=bpy.data.curves.new(obj.name+"-caption","FONT")
    curve.body=obj.name
    curve.align_x="CENTER"
    curve.size=.38 if i<4 else .25
    text=bpy.data.objects.new(curve.name,curve)
    scene.collection.objects.link(text)
    text.location=(obj.location.x,obj.location.y-(5.5 if i<4 else 1.4),.03)
    curve.materials.append(MATS["charcoal"])
ground=Mesh("preview-ground")
ground.box((0,3,-.13),(65,39,.2),"off-white")
# Preview ground is excluded from the runtime contract and its source collection.
mesh=bpy.data.meshes.new("preview-ground")
mesh.from_pydata(ground.vertices,[],ground.faces)
mesh.materials.append(MATS["off-white"])
plane=bpy.data.objects.new("preview-ground",mesh)
scene.collection.objects.link(plane)
bpy.ops.object.light_add(type="AREA", location=(-12,-15,25))
bpy.context.object.data.energy=3600
bpy.context.object.data.size=20
bpy.ops.object.light_add(type="SUN",location=(0,0,15))
bpy.context.object.rotation_euler=(.45,-.4,-.5)
bpy.context.object.data.energy=2.0
bpy.ops.object.camera_add(location=(28,-42,35))
camera=bpy.context.object
camera.rotation_euler=(Vector((0,4,1.5))-camera.location).to_track_quat("-Z","Y").to_euler()
camera.data.type="ORTHO"
camera.data.ortho_scale=62
scene.camera=camera
scene.render.filepath=str(OUT/"city-kit-preview.png")
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"city-kit.blend"),compress=True)
if "--no-render" not in sys.argv:
    bpy.ops.render.render(write_still=True)
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
print("CITY_KIT_EXPORT",json.dumps(manifest))
