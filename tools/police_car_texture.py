"""Build and apply the police-car body UV texture used by the shipped GLB.

Production-only dependencies: trimesh, xatlas, Pillow.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import trimesh
import xatlas
from PIL import Image, ImageDraw
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals


BODY_MATERIALS = {"White", "GermanPoliceLivery"}


def load_scene(path: Path) -> trimesh.Scene:
    scene = trimesh.load(path, force="scene")
    if not isinstance(scene, trimesh.Scene):
        raise TypeError(f"Expected a scene in {path}")
    return scene


def body_geometry(scene: trimesh.Scene) -> tuple[str, trimesh.Trimesh]:
    for name, mesh in scene.geometry.items():
        material = getattr(mesh.visual, "material", None)
        if getattr(material, "name", None) in BODY_MATERIALS:
            return name, mesh
    raise ValueError(f"No geometry using one of {sorted(BODY_MATERIALS)!r}")


def save_glb(scene: trimesh.Scene, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(trimesh.exchange.gltf.export_glb(scene))


def unwrap(source: Path, template: Path, uv_model: Path, size: int) -> None:
    scene = load_scene(source)
    name, mesh = body_geometry(scene)
    vertices = np.asarray(mesh.vertices, dtype=np.float32)
    faces = np.asarray(mesh.faces, dtype=np.uint32)
    normals = np.asarray(mesh.vertex_normals, dtype=np.float32)
    vertex_map, atlas_faces, uv = xatlas.parametrize(vertices, faces)
    unwrapped = trimesh.Trimesh(
        vertices=vertices[vertex_map],
        faces=atlas_faces,
        vertex_normals=normals[vertex_map],
        process=False,
    )
    unwrapped.visual = TextureVisuals(
        uv=uv,
        material=PBRMaterial(name="GermanPoliceLivery", baseColorFactor=[198, 202, 201, 255]),
    )
    scene.geometry[name] = unwrapped
    save_glb(scene, uv_model)

    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    points = np.column_stack((uv[:, 0] * (size - 1), (1 - uv[:, 1]) * (size - 1)))
    for face in atlas_faces:
        polygon = [tuple(points[index]) for index in face]
        draw.polygon(polygon, fill=(198, 202, 201, 255))
        draw.line((*polygon, polygon[0]), fill=(53, 68, 73, 150), width=max(1, size // 512))
    template.parent.mkdir(parents=True, exist_ok=True)
    image.save(template)


def apply_texture(source: Path, texture: Path, output: Path) -> None:
    scene = load_scene(source)
    name, mesh = body_geometry(scene)
    uv = np.asarray(mesh.visual.uv, dtype=np.float32)
    image = Image.open(texture).convert("RGBA")
    mesh.visual = TextureVisuals(
        uv=uv,
        material=PBRMaterial(
            name="GermanPoliceLivery",
            baseColorFactor=[255, 255, 255, 255],
            baseColorTexture=image,
            metallicFactor=0.08,
            roughnessFactor=0.62,
        ),
    )
    scene.geometry[name] = mesh
    save_glb(scene, output)


def main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    unwrap_parser = subparsers.add_parser("unwrap")
    unwrap_parser.add_argument("source", type=Path)
    unwrap_parser.add_argument("template", type=Path)
    unwrap_parser.add_argument("uv_model", type=Path)
    unwrap_parser.add_argument("--size", type=int, default=1024)
    apply_parser = subparsers.add_parser("apply")
    apply_parser.add_argument("source", type=Path)
    apply_parser.add_argument("texture", type=Path)
    apply_parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if args.command == "unwrap":
        unwrap(args.source, args.template, args.uv_model, args.size)
    else:
        apply_texture(args.source, args.texture, args.output)


if __name__ == "__main__":
    main()
