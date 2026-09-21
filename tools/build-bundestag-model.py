"""Build the compact, texture-free Reichstag/Bundestag landmark GLB."""

from pathlib import Path

import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "models" / "bundestag" / "bundestag.glb"


def box(size, center):
    mesh = trimesh.creation.box(extents=size)
    mesh.apply_translation(center)
    return mesh


def column(radius, height, center, sections=12):
    mesh = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    mesh.apply_translation(center)
    return mesh


def triangular_prism(width, depth, base, apex, front):
    x0, x1 = -width / 2, width / 2
    y0, y1 = front - depth, front
    vertices = np.array(
        [
            [x0, y0, base], [x1, y0, base], [0, y0, apex],
            [x0, y1, base], [x1, y1, base], [0, y1, apex],
        ],
        dtype=np.float64,
    )
    faces = np.array(
        [
            [0, 1, 2], [5, 4, 3], [0, 3, 4], [0, 4, 1],
            [1, 4, 5], [1, 5, 2], [2, 5, 3], [2, 3, 0],
        ],
        dtype=np.int64,
    )
    return trimesh.Trimesh(vertices=vertices, faces=faces, process=True)


def dome(radius=5.2, height=5.5, base=9.3, oculus=1.05, rings=8, segments=32):
    start = np.arcsin(oculus / radius)
    phis = np.linspace(start, np.pi / 2, rings)
    vertices = []
    for phi in phis:
        ring_radius = radius * np.sin(phi)
        z = base + height * np.cos(phi)
        for step in range(segments):
            theta = 2 * np.pi * step / segments
            vertices.append([ring_radius * np.cos(theta), ring_radius * np.sin(theta), z])
    faces = []
    for row in range(rings - 1):
        for step in range(segments):
            nxt = (step + 1) % segments
            a = row * segments + step
            b = row * segments + nxt
            c = (row + 1) * segments + step
            d = (row + 1) * segments + nxt
            faces.extend(([a, c, b], [b, c, d]))
    return trimesh.Trimesh(vertices=np.asarray(vertices), faces=np.asarray(faces), process=True)


def beam_between(start, end, radius=0.075):
    start, end = np.asarray(start), np.asarray(end)
    direction = end - start
    mesh = trimesh.creation.cylinder(radius=radius, height=np.linalg.norm(direction), sections=6)
    mesh.apply_transform(trimesh.geometry.align_vectors([0, 0, 1], direction))
    mesh.apply_translation((start + end) / 2)
    return mesh


def add_group(scene, name, parts, material):
    mesh = trimesh.util.concatenate(parts)
    mesh.apply_transform(trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0]))
    mesh.apply_transform(trimesh.transformations.rotation_matrix(np.pi, [0, 1, 0]))
    mesh.visual = TextureVisuals(material=material)
    scene.add_geometry(mesh, node_name=name, geom_name=name)


def build():
    stone = PBRMaterial(
        name="Bundestag_Stone",
        baseColorFactor=[0.63, 0.61, 0.56, 1.0],
        metallicFactor=0.0,
        roughnessFactor=0.92,
    )
    dark = PBRMaterial(
        name="Bundestag_Window",
        baseColorFactor=[0.16, 0.18, 0.18, 1.0],
        metallicFactor=0.05,
        roughnessFactor=0.38,
    )
    metal = PBRMaterial(
        name="Bundestag_Dome_Frame",
        baseColorFactor=[0.34, 0.37, 0.36, 1.0],
        metallicFactor=0.72,
        roughnessFactor=0.28,
    )
    glass = PBRMaterial(
        name="Bundestag_Dome_Glass",
        baseColorFactor=[0.47, 0.67, 0.72, 0.42],
        metallicFactor=0.0,
        roughnessFactor=0.18,
        alphaMode="BLEND",
        doubleSided=True,
    )

    stone_parts = [
        box([36, 25.4, 2.0], [0, 0, 1.0]),
        box([33.4, 23.6, 5.7], [0, 0, 4.65]),
        box([17.5, 25.8, 1.9], [0, 0, 8.45]),
        box([11.5, 4.0, 6.2], [0, 10.4, 5.0]),
        box([14.0, 2.3, 0.65], [0, 12.05, 8.15]),
        triangular_prism(15.2, 1.0, 8.45, 10.65, 13.2),
        box([13.0, 0.8, 0.55], [0, 13.15, 2.0]),
        box([14.8, 2.0, 0.38], [0, 13.15, 0.19]),
        box([13.2, 1.7, 0.34], [0, 13.42, 0.53]),
        box([11.5, 1.45, 0.3], [0, 13.68, 0.84]),
    ]
    for x in (-14.6, 14.6):
        for y in (-9.3, 9.3):
            stone_parts.extend(
                [
                    box([6.2, 5.8, 8.2], [x, y, 5.1]),
                    box([6.7, 6.3, 0.55], [x, y, 9.48]),
                    box([5.7, 5.3, 0.42], [x, y, 9.96]),
                ]
            )
    for x in np.linspace(-5.0, 5.0, 6):
        stone_parts.append(column(0.38, 5.45, [x, 12.75, 4.95]))
        stone_parts.append(box([0.82, 0.82, 0.28], [x, 12.75, 2.08]))
        stone_parts.append(box([0.9, 0.9, 0.3], [x, 12.75, 7.78]))

    window_parts = [box([4.1, 0.18, 4.4], [0, 12.42, 4.45])]
    for z in (3.15, 5.65, 7.65):
        for x in (-11.0, -8.6, 8.6, 11.0):
            window_parts.append(box([1.25, 0.15, 1.05], [x, 12.0, z]))
            window_parts.append(box([1.25, 0.15, 1.05], [x, -12.0, z]))
        for y in (-6.8, -3.5, 0, 3.5, 6.8):
            window_parts.append(box([0.15, 1.3, 1.05], [-16.78, y, z]))
            window_parts.append(box([0.15, 1.3, 1.05], [16.78, y, z]))

    glass_parts = [dome()]
    metal_parts = [column(5.55, 0.48, [0, 0, 9.18], sections=32)]
    metal_parts.append(trimesh.creation.torus(major_radius=1.05, minor_radius=0.09, major_sections=32, minor_sections=6, transform=trimesh.transformations.translation_matrix([0, 0, 14.68])))
    phi_values = np.linspace(np.arcsin(1.05 / 5.2), np.pi / 2, 8)
    for theta in np.linspace(0, 2 * np.pi, 12, endpoint=False):
        points = [
            [5.2 * np.sin(phi) * np.cos(theta), 5.2 * np.sin(phi) * np.sin(theta), 9.3 + 5.5 * np.cos(phi)]
            for phi in phi_values
        ]
        metal_parts.extend(beam_between(a, b) for a, b in zip(points, points[1:]))
    for phi in phi_values[2:-1:2]:
        ring_radius = 5.2 * np.sin(phi)
        ring_height = 9.3 + 5.5 * np.cos(phi)
        metal_parts.append(
            trimesh.creation.torus(
                major_radius=ring_radius,
                minor_radius=0.065,
                major_sections=32,
                minor_sections=5,
                transform=trimesh.transformations.translation_matrix([0, 0, ring_height]),
            )
        )

    scene = trimesh.Scene()
    add_group(scene, "BundestagStone", stone_parts, stone)
    add_group(scene, "BundestagWindows", window_parts, dark)
    add_group(scene, "BundestagDomeGlass", glass_parts, glass)
    add_group(scene, "BundestagDomeFrame", metal_parts, metal)
    scene.metadata["asset"] = {
        "generator": "Germany Simulator tools/build-bundestag-model.py",
        "copyright": "Original project asset; no third-party mesh or texture included",
    }
    OUTPUT.write_bytes(trimesh.exchange.gltf.export_glb(scene, include_normals=True))
    print(f"wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    build()
