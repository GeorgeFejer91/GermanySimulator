#!/usr/bin/env python3
"""Bind one ImageGen paint-over to the existing 3D walk; bake a left-only pilot.

No AI calls at build time, no frame-dependent UV fitting, and no game changes.
The raw ImageGen output is immutable. Projection is an offline material binding.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "assets/sprite-sources/candidates/merkel-3d"
DEST = ROOT / "assets/sprite-sources/candidates/merkel-painted-left"
WORK = ROOT / "output/merkel-painted-left"
COUNT, CELL = 32, 128


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2)+"\n", encoding="utf-8", newline="\n")


def registration():
    from PIL import Image
    result = {}
    for name in ("pose-guide.png", "paint-over.png"):
        with Image.open(DEST/name) as image:
            alpha = image.convert("RGBA").getchannel("A")
            result[name] = {"size": list(image.size), "bounds": list(alpha.point(lambda a: 255 if a>16 else 0).getbbox())}
    write_json(WORK/"registration.json", result)


def render(args):
    import bpy
    from mathutils import Vector
    from bpy_extras.object_utils import world_to_camera_view

    bpy.ops.wm.open_mainfile(filepath=str(BASE/"merkel-walk.blend"))
    bpy.context.preferences.filepaths.save_version = 0
    scene = bpy.context.scene
    camera = scene.camera
    camera.location = (8, 0, 3.1)
    camera.rotation_euler = (Vector((0, 0, 1.40))-camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.frame_set(1)
    bpy.context.view_layer.update()
    rig = bpy.data.objects["Walk rig"]
    painting = bpy.data.images.load(str(DEST/"paint-over.png"))
    painting.pack()
    bounds = json.loads((WORK/"registration.json").read_text())
    g, p = bounds["pose-guide.png"], bounds["paint-over.png"]
    gx, gy, gr, gb = g["bounds"]
    px, py, pr, pb = p["bounds"]

    def uv(point, head=False):
        projected = world_to_camera_view(scene, camera, point)
        x, y = projected.x*g["size"][0], (1-projected.y)*g["size"][1]
        if head:
            # One source-pose landmark registration: ImageGen displaced the
            # profile nose ~14 guide pixels inward. Fix the material binding,
            # not the anatomy or any individual animation frame.
            clamp = lambda value: max(0., min(1., value))
            x += 14*clamp((260-x)/70)*clamp((y-80)/25)*clamp((185-y)/20)
        return ((px+(x-gx)/(gr-gx)*(pr-px))/p["size"][0],
                1-(py+(y-gy)/(gb-gy)*(pb-py))/p["size"][1])

    def material(name, fallback, kind, shade=1):
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        tree = mat.node_tree
        tree.nodes.clear()
        image = tree.nodes.new("ShaderNodeTexImage")
        image.image = painting
        image.extension = "EXTEND"
        image.interpolation = "Linear"
        split = tree.nodes.new("ShaderNodeSeparateColor")
        tree.links.new(image.outputs["Color"], split.inputs["Color"])

        def operation(op, a, b):
            node = tree.nodes.new("ShaderNodeMath")
            node.operation = op
            for i, value in enumerate((a, b)):
                if isinstance(value, (int, float)): node.inputs[i].default_value = value
                else: tree.links.new(value, node.inputs[i])
            return node.outputs[0]

        # Unseen/occluded texels use the part's own base colour, never another
        # limb's skin/jacket colour. This affects materials, not the source PNG.
        valid = image.outputs["Alpha"]
        if kind == "blue":
            valid = operation("MULTIPLY", valid, operation("GREATER_THAN", operation("SUBTRACT", split.outputs["Blue"], split.outputs["Red"]), .025))
        elif kind == "dark":
            maximum = operation("MAXIMUM", split.outputs["Red"], operation("MAXIMUM", split.outputs["Green"], split.outputs["Blue"]))
            valid = operation("MULTIPLY", valid, operation("LESS_THAN", maximum, .18))
        elif kind == "skin":
            valid = operation("MULTIPLY", valid, operation("GREATER_THAN", operation("SUBTRACT", split.outputs["Red"], split.outputs["Blue"]), .07))
        mix = tree.nodes.new("ShaderNodeMixRGB")
        mix.inputs[1].default_value = (*fallback, 1)
        tree.links.new(valid, mix.inputs[0])
        tree.links.new(image.outputs["Color"], mix.inputs[2])
        emission = tree.nodes.new("ShaderNodeEmission")
        emission.inputs["Strength"].default_value = shade
        tree.links.new(mix.outputs[0], emission.inputs["Color"])
        out = tree.nodes.new("ShaderNodeOutputMaterial")
        tree.links.new(emission.outputs[0], out.inputs["Surface"])
        return mat

    bindings = {}
    meshes = [obj for obj in scene.objects if obj.type == "MESH"]
    for obj in meshes:
        # Evaluate the authored weighted positions without changing topology.
        subs = [mod for mod in obj.modifiers if mod.type == "SUBSURF"]
        for mod in subs: mod.show_viewport = False
        bpy.context.view_layer.update()
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        positions = [obj.matrix_world @ vertex.co for vertex in evaluated.data.vertices]
        if len(positions) != len(obj.data.vertices): raise ValueError("projection topology changed")
        group_names = {group.index: group.name for group in obj.vertex_groups}
        for vertex in obj.data.vertices:
            # Reuse the visible left limb's paint for the homologous far limb.
            # It is a one-time rest-space correspondence, NOT frame mirroring.
            weights = [(group_names[w.group], w.weight) for w in vertex.groups if w.weight > .00001]
            if sum(w for name, w in weights if name.endswith(".R")) > .5:
                point = vertex.co.copy()
                point.x *= -1
                total = sum(w for _, w in weights)
                mapped = Vector((0, 0, 0))
                for name, weight in weights:
                    target = name[:-1]+"L" if name.endswith(".R") else name
                    mapped += (rig.pose.bones[target].matrix @ rig.data.bones[target].matrix_local.inverted() @ point)*(weight/total)
                positions[vertex.index] = mapped
        coordinates = [uv(point, obj.name in ("Bob silhouette", "Merkel proportion study") and obj.data.vertices[i].co.z > 1.99) for i, point in enumerate(positions)]
        layer = obj.data.uv_layers.new(name="Fixed ImageGen projection")
        for loop in obj.data.loops: layer.data[loop.index].uv = coordinates[loop.vertex_index]
        for mod in subs: mod.show_viewport = True
        if "jacket" in obj.name or "arm garment" in obj.name:
            color, kind = (.018, .12, .34), "blue"
        elif "thigh" in obj.name:
            color, kind = (.025, .028, .033), "dark"
        elif "Loafer" in obj.name:
            color, kind = (.012, .014, .018), "dark"
        elif "Bob" in obj.name:
            color, kind = (.50, .27, .09), "any"
        else:
            color, kind = (.66, .35, .19), "any"
        obj.data.materials.clear()
        obj.data.materials.append(material(obj.name+" paint", color, kind, .86 if obj.name.endswith(" R") else 1))
        for polygon in obj.data.polygons: polygon.material_index = 0
        if obj.name == "Merkel proportion study":
            obj.data.materials.append(material("Hands paint", color, "skin"))
            for polygon in obj.data.polygons:
                if max(obj.data.vertices[i].co.z for i in polygon.vertices) < 1.99: polygon.material_index = 1
        bindings[obj.name] = {"vertices": len(obj.data.vertices), "uvSha256": hashlib.sha256(str([tuple(v.uv) for v in layer.data]).encode()).hexdigest()}
    bpy.context.view_layer.update()

    frames = []
    for i in range(COUNT+1):
        scene.frame_set(i+1)
        bpy.context.view_layer.update()
        frames.append({"bones": {name: [list(bone.head), list(bone.tail)] for name, bone in rig.pose.bones.items()}})
        for obj in meshes:
            current = hashlib.sha256(str([tuple(v.uv) for v in obj.data.uv_layers.active.data]).encode()).hexdigest()
            if current != bindings[obj.name]["uvSha256"]: raise ValueError("frame-dependent UV drift")
        if args.draft and i not in (0, 8, 16, 24, 32): continue
        scene.render.filepath = str(WORK/f"{i:02}.png")
        if i == 0: bpy.ops.render.render(write_still=False)
        bpy.ops.render.render(write_still=True)
        print(f"PAINTED {i+1}/33", flush=True)
    scene.frame_set(1)
    if not args.draft:
        bpy.ops.wm.save_as_mainfile(filepath=str(DEST/"merkel-painted.blend"), compress=True)
        write_json(DEST/"binding-audit.json", {"projection": bounds, "headRegistration": "fixed source-pose profile correction, maximum 14 guide pixels; see builder uv()", "bindings": bindings, "frames": frames,
            "textureRule": "one fixed UV binding per vertex; material colors and paint image do not animate"})


def pack():
    import numpy as np
    from PIL import Image, ImageDraw

    base_manifest = json.loads((BASE/"manifest.json").read_text())
    audit = json.loads((BASE/"pose-audit.json").read_text())
    atlases = {name: Image.new("RGBA", (frames*CELL, CELL)) for name, frames in
               (("merkel-sprite.png", COUNT), ("merkel-bones.png", COUNT), ("merkel-audit.png", COUNT+1))}
    def downsample(image):
        image = image.convert("RGBa").resize((CELL, CELL), Image.Resampling.LANCZOS).convert("RGBA")
        pixels = np.array(image)
        pixels[pixels[:, :, 3] == 0, :3] = 0
        return Image.fromarray(pixels)
    for i in range(COUNT+1):
        source = Image.open(WORK/f"{i:02}.png").convert("RGBA")
        tile = downsample(source)
        atlases["merkel-audit.png"].paste(tile, (i*CELL, 0))
        if i == COUNT: continue
        atlases["merkel-sprite.png"].paste(tile, (i*CELL, 0))
        draw = ImageDraw.Draw(source)
        projection = audit["views"]["left"][i]
        scale = source.width/CELL
        def scaled(points): return [(x*scale, y*scale) for x, y in points]
        for name, points in projection["bones"].items():
            color = "#ff7166" if name.endswith(".L") else "#53c8ff" if name.endswith(".R") else "#ffd462"
            draw.line(scaled(points), fill=color, width=5)
        for side in "LR":
            color = "#ff7166" if side == "L" else "#53c8ff"
            points = scaled(projection["soles"][side])
            draw.line(points, fill=color, width=6)
            for x, y in (points[0], points[-1]): draw.ellipse((x-6, y-6, x+6, y+6), outline=color, width=3)
        atlases["merkel-bones.png"].paste(downsample(source), (i*CELL, 0))
    for name, atlas in atlases.items(): atlas.save(DEST/name, optimize=True)
    sheet = Image.new("RGB", (8*CELL, 4*(CELL+20)), "#e9e3d5")
    painter = ImageDraw.Draw(sheet)
    for i in range(COUNT):
        tile = atlases["merkel-sprite.png"].crop((i*CELL, 0, (i+1)*CELL, CELL))
        x, y = (i%8)*CELL, (i//8)*(CELL+20)
        sheet.paste(tile, (x, y+20), tile)
        painter.text((x+5, y+4), f"{i:02}", fill="#1d1c19")
    sheet.save(DEST/"contact-sheet.png")
    reference = "assets/sprite-archive/pre-rig-20260921/assets/sprite-sources/merkel-sprite-keys.png"
    sources = {str(BASE.relative_to(ROOT)/name): digest(BASE/name) for name in ("merkel-walk.blend", "pose-audit.json", "merkel-sprite.png")}
    sources[reference] = digest(ROOT/reference)
    artifacts = [*atlases, "paint-over.png", "pose-guide.png", "PROMPT.md", "binding-audit.json", "merkel-painted.blend", "contact-sheet.png"]
    write_json(DEST/"manifest.json", {
        "schemaVersion": 1, "status": "candidate-unapproved", "scope": "merkel-painted-left-3d-bound-pilot",
        "appearance": "ImageGen paint-over projected once onto the 3D rig; not an identical or approved likeness",
        "movementAuthority": "unchanged merkel-3d weighted mesh and 32 bone poses; no per-frame generation or recentering",
        "playbackFrames": COUNT, "inspectionPoints": COUNT+1, "cellSize": CELL,
        "durationSeconds": base_manifest["durationSeconds"], "recommendedFps": 26, "directions": ["left"], "rows": {"left": 0},
        "runtimeIsolation": "preview-only; stable game sprites unchanged",
        "limitations": ["one left camera only", "hidden surfaces use material base colors", "silhouette remains that of the 3D study", "likeness and hand/clothing detail still need human review"],
        "sourceHashes": sources, "artifacts": {name: digest(DEST/name) for name in artifacts}})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--blender", default="C:/Program Files/Blender Foundation/Blender 5.2/blender.exe")
    parser.add_argument("--render", action="store_true")
    parser.add_argument("--draft", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else None)
    WORK.mkdir(parents=True, exist_ok=True)
    if args.render: render(args)
    else:
        manifest = json.loads((BASE/"manifest.json").read_text())
        for name, expected in manifest["artifacts"].items():
            if digest(BASE/name) != expected: raise ValueError(f"3D source changed: {name}")
        registration()
        command = [args.blender, "-b", "--factory-startup", "--python-exit-code", "1", "--python", str(Path(__file__).resolve()), "--", "--render"]
        if args.draft: command.append("--draft")
        subprocess.run(command, check=True)
        if not args.draft: pack()


if __name__ == "__main__":
    main()
