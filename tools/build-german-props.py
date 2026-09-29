"""Build the original German street-detail set with Blender 4.1+.

Run: blender --background --python tools/build-german-props.py
The editable catalog is saved beside its texture-free GLBs. Blender -Y is front.
"""
import bpy
import hashlib
import json
import math
from pathlib import Path
from mathutils import Vector

OUT = Path(__file__).resolve().parents[1] / "assets/models/german-props"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for collection in list(bpy.data.collections):
    if collection.name != "Collection":
        bpy.data.collections.remove(collection)

COLORS = {
    "stone": (0.53, .50, .44, 1), "trim": (.68, .65, .58, 1),
    "dark": (.18, .20, .20, 1), "glass": (.13, .21, .24, 1),
    "steel": (.40, .43, .42, 1), "wood": (.36, .28, .19, 1),
    "pale-wood": (.48, .37, .23, 1), "cream": (.79, .77, .69, 1),
    "red": (.48, .16, .11, 1), "blue": (.20, .29, .36, 1),
    "green": (.25, .34, .23, 1), "yellow": (.72, .59, .27, 1),
    "skin": (.65, .43, .30, 1), "white": (.90, .88, .80, 1),
    "soil": (.24, .20, .15, 1),
    "towel-blue": (.25, .43, .55, 1), "towel-red": (.65, .23, .16, 1),
}
MATS = {}
for name, color in COLORS.items():
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = .38 if name == "glass" else .84
    bsdf.inputs["Metallic"].default_value = .38 if name == "steel" else .04
    MATS[name] = material

catalog = {}
active = None

def begin(name):
    global active
    active = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(active)
    catalog[name] = active

def keep(obj, name, material):
    obj.name = name
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    active.objects.link(obj)
    obj.data.materials.append(MATS[material])
    return obj

def box(name, xyz, size, material, angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz)
    obj = keep(bpy.context.object, name, material)
    obj.dimensions = size
    obj.rotation_euler[0] = angle
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return obj

def cylinder(name, xyz, radius, depth, material, vertices=12, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=xyz)
    obj = keep(bpy.context.object, name, material)
    if rotation:
        obj.rotation_euler = rotation
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return obj

def sphere(name, xyz, size, material, segments=12, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=xyz)
    obj = keep(bpy.context.object, name, material)
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj

def beam(name, a, b, radius, material):
    start, end = Vector(a), Vector(b)
    obj = cylinder(name, (start + end) / 2, radius, (end - start).length, material, 8)
    obj.rotation_euler = (end - start).to_track_quat("Z", "Y").to_euler()
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return obj

def lounger(name, towel):
    begin(name)
    # Low tubular frame, reclining slats and a towel visibly draped over the back.
    for x in [-.55, .55]:
        beam("frame rail", (x,-1.14,.30), (x,.91,.30), .045, "steel")
        for y in [-.88,.75]:
            beam("leg", (x,y,.04), (x,y,.33), .04, "steel")
        beam("raised back", (x,.47,.31), (x,1.28,1.09), .045, "steel")
    for y in [-1.08,-.78,-.48,-.18,.12,.42]:
        box("wood slat", (0,y,.34), (1.05,.24,.055), "pale-wood")
    for i in range(5):
        t=i/4
        box("back slat", (0,.57+t*.61,.45+t*.59), (1.05,.19,.05), "pale-wood", -.77)
    box("reserved towel cloth", (0,.97,.84), (1.02,.86,.045), towel, .77)
    for y,z in [(.72,.60),(1.20,1.06)]:
        box("towel hem", (0,y,z), (1.04,.085,.048), "cream", .77)

def gnome(name, watering=False):
    begin(name)
    for x in [-.13,.13]:
        sphere("boot", (x,-.045,.09), (.14,.19,.09), "dark")
    sphere("coat", (0,.015,.39), (.24,.17,.28), "green" if watering else "blue")
    for x in [-.23,.23]:
        beam("sleeve", (x*.72,0,.49), (x*1.18,-.045,.30), .07, "green" if watering else "blue")
        sphere("hand", (x*1.18,-.05,.30), (.055,.055,.06), "skin")
    sphere("head", (0,-.03,.64), (.17,.15,.18), "skin")
    sphere("beard", (0,-.16,.53), (.16,.07,.16), "white")
    sphere("nose", (0,-.225,.65), (.05,.05,.045), "skin")
    for x in [-.07,.07]:
        sphere("eye", (x,-.17,.70), (.016,.012,.014), "dark", 8, 5)
    cylinder("hat brim", (0,.01,.79), .22, .07, "red" if watering else "yellow", 16)
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=.20, radius2=.015, depth=.48, location=(.035,.02,1.02))
    keep(bpy.context.object, "pointed hat", "red" if watering else "yellow")
    if watering:
        cylinder("watering can", (.39,-.12,.25), .15, .26, "steel", 12)
        beam("spout", (.45,-.22,.27), (.69,-.30,.35), .035, "steel")
        beam("handle", (.28,-.12,.36), (.32,-.12,.53), .025, "steel")
    else:
        beam("placard pole", (.38,-.09,.05), (.38,-.09,.78), .025, "wood")
        box("blank placard", (.38,-.12,.70), (.48,.06,.30), "cream")

def storefront(name, kind):
    begin(name)
    color = "red" if kind == "sandal" else "blue"
    box("masonry shell", (0,0,1.68), (7.8,4.8,3.36), "stone")
    box("dark plinth", (0,0,.19), (8,5,.38), "dark")
    box("flat cornice", (0,0,3.43), (8.1,5.1,.20), "dark")
    box("fascia", (0,-2.52,2.93), (7.95,.19,.54), color)
    box("awning", (0,-2.89,2.60), (8.0,.75,.16), "cream")
    for x in [-3.0,-1.8,-.6,.6,1.8,3.0]:
        box("awning stripe", (x,-2.89,2.51), (.42,.74,.025), color)
    for x in [-2.35,2.35]:
        box("window reveal", (x,-2.49,1.52), (2.45,.12,2.05), "dark")
        box("shop glass", (x,-2.57,1.53), (2.30,.06,1.90), "glass")
        box("sill", (x,-2.65,.54), (2.53,.19,.13), "trim")
    box("entrance", (0,-2.57,1.20), (1.45,.11,2.33), "dark")
    box("door glass", (0,-2.64,1.32), (1.23,.07,1.92), "glass")
    sphere("door handle", (.48,-2.71,1.08), (.05,.03,.05), "steel")
    for x in [-2.4,2.4]:
        box("display shelf", (x,-2.68,.85), (2.15,.20,.08), "pale-wood")
        for dx in [-.7,0,.7]:
            if kind == "sandal":
                sphere("sandal sole", (x+dx,-2.75,.98), (.23,.11,.045), "wood")
                beam("sandal strap", (x+dx-.12,-2.80,1.0), (x+dx+.12,-2.80,1.0), .025, "red")
            else:
                box("folded sock", (x+dx,-2.78,1.02), (.22,.08,.27), "cream")
                box("sock cuff", (x+dx,-2.83,1.16), (.24,.09,.07), "blue")
    # Raised facade symbols are legible at oblique game camera angles.
    if kind == "sandal":
        sphere("sandal sign sole", (0,-2.68,3.0), (.32,.045,.11), "cream")
        beam("sandal sign strap", (-.12,-2.73,3.01), (.12,-2.73,3.01), .035, "yellow")
    else:
        box("sock sign leg", (-.04,-2.68,3.04), (.18,.06,.23), "cream")
        box("sock sign foot", (.07,-2.68,2.94), (.37,.06,.11), "cream")

def beer_crate():
    begin("beer-crate")
    box("crate bottom", (0,0,.055), (.74,.53,.11), "red")
    for x in [-.35,.35]:
        box("crate side", (x,0,.22), (.05,.53,.34), "red")
    for y in [-.245,.245]:
        box("crate side", (0,y,.22), (.74,.05,.34), "red")
    for x in [-.23,0,.23]:
        for y in [-.12,.12]:
            cylinder("returnable bottle", (x,y,.31), .055, .47, "soil", 10)
            cylinder("bottle cap", (x,y,.56), .061, .04, "steel", 10)

def wheelbarrow():
    begin("allotment-wheelbarrow")
    box("barrow tray", (0,0,.58), (.93,.58,.20), "green")
    for x in [-.43,.43]:
        box("tray lip", (x,0,.70), (.06,.65,.10), "steel")
    for y in [-.29,.29]:
        box("tray lip", (0,y,.70), (.98,.06,.10), "steel")
        beam("support", (-.36,y,.46), (.25,y,.08), .035, "steel")
        beam("handle", (.23,y,.36), (.86,y,.48), .035, "wood")
    cylinder("rubber wheel", (-.47,0,.22), .22, .11, "dark", 16, (math.pi/2,0,0))
    cylinder("hub", (-.47,-.065,.22), .075, .02, "steel", 12, (math.pi/2,0,0))
    box("soil", (0,0,.70), (.74,.42,.05), "soil")

def recycling():
    begin("recycling-containers")
    for x, color in [(-.63,"blue"),(0,"green"),(.63,"yellow")]:
        box("container body", (x,0,.58), (.54,.57,1.13), color)
        box("lid", (x,0,1.17), (.61,.65,.11), "dark")
        box("paper slot", (x,-.34,.88), (.34,.03,.09), "dark")
        box("front instruction panel", (x,-.31,.58), (.32,.025,.18), "cream")

def picnic():
    begin("allotment-picnic-table")
    for x in [-.76,.76]:
        for y in [-.32,.32]:
            beam("table leg", (x,y,.02), (x*.72,y,.76), .045, "steel")
    for y in [-.24,0,.24]:
        box("table plank", (0,y,.79), (2.3,.20,.08), "pale-wood")
    for y in [-.85,.85]:
        box("bench plank", (0,y,.46), (2.3,.28,.08), "pale-wood")
        for x in [-.72,.72]:
            beam("bench leg", (x,y,.02), (x,y,.42), .04, "steel")

lounger("reserved-lounger-blue", "towel-blue")
lounger("reserved-lounger-red", "towel-red")
gnome("garden-gnome-watering", True)
gnome("garden-gnome-placard")
storefront("sandal-shop", "sandal")
storefront("sock-shop", "sock")
beer_crate()
wheelbarrow()
recycling()
picnic()

manifest = {"author": "Original Blender geometry; no external mesh or texture", "source": "german-props.blend", "script": "../../../tools/build-german-props.py", "axis": "Y-up / +Z-front in GLB; ground pivot", "models": {}}
for name, collection in catalog.items():
    # Keep the editable source grouped by material, and bound repeated props to a few draws.
    for material in MATS.values():
        pieces = [obj for obj in collection.objects if obj.data.materials[0] == material]
        if len(pieces) < 2:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for obj in pieces:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = pieces[0]
        bpy.ops.object.join()
        bpy.context.scene.cursor.location = (0, 0, 0)
        bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in collection.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next(iter(collection.objects))
    path = OUT / (name + ".glb")
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True,
                              export_yup=True, export_apply=True, export_texcoords=False,
                              export_normals=True, export_materials="EXPORT",
                              export_cameras=False, export_lights=False)
    corners = [obj.matrix_world @ Vector(corner) for obj in collection.objects for corner in obj.bound_box]
    lo = [min(p[i] for p in corners) for i in range(3)]
    hi = [max(p[i] for p in corners) for i in range(3)]
    assert all(math.isfinite(v) for point in corners for v in point)
    assert lo[2] >= -.005, (name, lo)
    manifest["models"][name] = {
        "file": path.name,
        "dimensions_xyz": [round(hi[0]-lo[0], 4), round(hi[2]-lo[2], 4), round(hi[1]-lo[1], 4)],
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }

bpy.ops.object.select_all(action="DESELECT")
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "german-props.blend"), compress=True)
manifest["total_glb_bytes"] = sum(model["bytes"] for model in manifest["models"].values())
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print("GERMAN_PROPS_EXPORT", json.dumps(manifest))
