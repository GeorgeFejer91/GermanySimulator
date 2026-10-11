"""Build the original pale Weisswurst HUD model. Python standard library only."""
import hashlib
import json
import math
from pathlib import Path
import struct

root = Path(__file__).resolve().parents[1]
# Rounded meat, pinched casing necks and folded wrapper fans; +Z glows.
profile = [(0, .18), (.24, .176), (.43, .167), (.59, .149), (.65, .125),
           (.70, .085), (.73, .035), (.755, .023), (.775, .024),
           (.81, .065), (.845, .078), (.875, .068)]

def radius(z):
    z = abs(z)
    for (a, ra), (b, rb) in zip(profile, profile[1:]):
        if z <= b:
            t = (z-a)/(b-a)
            return ra + (rb-ra)*t*t*(3-2*t)
    return 0

sides = 32
# Merge rings before float32 encoding (for example 0.81 and 27 * 0.03).
zs = sorted({round(z, 8) for z in ([-z for z, _ in profile] +
             [z for z, _ in profile] + [i*.03 for i in range(-29, 30)])})
points, indices = [], []
for z in zs:
    r = radius(z)
    centre = .018-.028*z*z
    for side in range(sides):
        theta = 2*math.pi*side/sides
        gathered = max(0, min(1, (abs(z)-.72)/.06))
        fold = 1 + .22*math.cos(theta*6+math.copysign(1, z)*(abs(z)-.72)*22)*gathered
        points.append((centre + r*math.cos(theta)*fold, r*math.sin(theta), z))
centre_x = (min(p[0] for p in points)+max(p[0] for p in points))/2
points = [(x-centre_x, y, z) for x, y, z in points]
for row in range(len(zs)-1):
    for side in range(sides):
        a, c = row*sides+side, row*sides+(side+1)%sides
        b, d = a+sides, c+sides
        indices.extend((a, c, b, c, d, b))

for row, sign in [(0, -1), (len(zs)-1, 1)]:
    z = zs[row]
    cap = len(points)
    points.append((.018-.028*z*z-centre_x, 0, z))
    for side in range(sides):
        a, c = row*sides+side, row*sides+(side+1)%sides
        indices.extend((cap, c, a) if sign < 0 else (cap, a, c))

normals = [[0., 0., 0.] for _ in points]
for i in range(0, len(indices), 3):
    a, b, c = indices[i:i+3]
    u = [points[b][k]-points[a][k] for k in range(3)]
    v = [points[c][k]-points[a][k] for k in range(3)]
    n = (u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0])
    for vertex in (a, b, c):
        for k in range(3):
            normals[vertex][k] += n[k]
for i, n in enumerate(normals):
    length = math.sqrt(sum(x*x for x in n))
    normals[i] = [x/length for x in n] if length else [0, 0, math.copysign(1, points[i][2])]

binary, views, accessors = bytearray(), [], []
def pack(values, fmt, component, kind, target, bounds=None):
    binary.extend(b'\0'*(-len(binary)%4))
    data = struct.pack('<'+fmt*len(values), *values)
    views.append({'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(data), 'target': target})
    binary.extend(data)
    item = {'bufferView': len(views)-1, 'componentType': component,
            'count': len(values)//(3 if kind == 'VEC3' else 1), 'type': kind}
    if bounds:
        item['min'], item['max'] = bounds
    accessors.append(item)
    return len(accessors)-1

bounds = [[min(p[k] for p in points) for k in range(3)], [max(p[k] for p in points) for k in range(3)]]
position = pack([x for p in points for x in p], 'f', 5126, 'VEC3', 34962, bounds)
normal = pack([x for n in normals for x in n], 'f', 5126, 'VEC3', 34962)
index = pack(indices, 'H', 5123, 'SCALAR', 34963)
doc = {'asset': {'version': '2.0', 'generator': 'Germany Simulator / build-mission-sausage.py / original Weisswurst'},
       'scene': 0, 'scenes': [{'nodes': [0]}],
       'nodes': [{'name': 'Plump Weisswurst / +Z mission direction', 'mesh': 0}],
       'meshes': [{'primitives': [{'attributes': {'POSITION': position, 'NORMAL': normal}, 'indices': index, 'material': 0}]}],
       'materials': [{'name': 'Pale sausage casing', 'pbrMetallicRoughness': {'baseColorFactor': [.90, .84, .70, 1], 'metallicFactor': 0, 'roughnessFactor': .32}}],
       'buffers': [{'byteLength': len(binary)}], 'bufferViews': views, 'accessors': accessors}
encoded = json.dumps(doc, separators=(',', ':')).encode()
encoded += b' '*(-len(encoded)%4)
binary.extend(b'\0'*(-len(binary)%4))
result = (struct.pack('<3I', 0x46546c67, 2, 28+len(encoded)+len(binary)) +
          struct.pack('<2I', len(encoded), 0x4e4f534a) + encoded +
          struct.pack('<2I', len(binary), 0x004e4942) + binary)
target = root/'assets/models/mission-sausage/sausage.glb'
target.write_bytes(result)
print(json.dumps({'sha256': hashlib.sha256(result).hexdigest(), 'bytes': len(result),
                  'triangles': len(indices)//3, 'vertices': len(points), 'bounds': bounds}))
