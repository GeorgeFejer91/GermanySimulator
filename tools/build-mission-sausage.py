"""Package the licensed cooked-sausage mesh as one compact mission pointer.

Input: the original Objaverse GLB (see assets/models/mission-sausage/LICENSES.md).
Uses the existing Pillow environment; no authoring dependency ships to the game.
"""
import hashlib
import json
from pathlib import Path
import struct
import sys
from io import BytesIO
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
raw = source.read_bytes()
if hashlib.sha256(raw).hexdigest() != 'b0927613b574e17533ca185de510bdd5f427e94f0f96133702e0fb6ee5d35f54':
    raise ValueError('Input must be the attributed Saucisse source GLB')
json_size = struct.unpack_from('<I', raw, 12)[0]
doc = json.loads(raw[20:20 + json_size])
binary = raw[28 + json_size:]
views = [bytearray(binary[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]) for v in doc['bufferViews']]

# Keep the authored curve and UVs, center the mesh, and aim its long axis at +Z.
position = doc['accessors'][doc['meshes'][0]['primitives'][0]['attributes']['POSITION']]
view = views[position['bufferView']]
stride = doc['bufferViews'][position['bufferView']].get('byteStride', 12)
offset = position.get('byteOffset', 0)
points = [struct.unpack_from('<3f', view, offset + i * stride) for i in range(position['count'])]
low = [min(p[k] for p in points) for k in range(3)]
high = [max(p[k] for p in points) for k in range(3)]
center = [(a + b) / 2 for a, b in zip(low, high)]
scale = 1.75 / (high[2] - low[2])
for i, point in enumerate(points):
    struct.pack_into('<3f', view, offset + i * stride, *[(point[k] - center[k]) * scale for k in range(3)])
position['min'] = [(low[k] - center[k]) * scale for k in range(3)]
position['max'] = [(high[k] - center[k]) * scale for k in range(3)]

for image in doc['images']:
    index = image['bufferView']
    pic = Image.open(BytesIO(views[index])).convert('RGB')
    pic.thumbnail((512, 512), Image.Resampling.LANCZOS)
    encoded = BytesIO()
    pic.save(encoded, format='JPEG', quality=90, optimize=True)
    views[index] = bytearray(encoded.getvalue())
    image['mimeType'] = 'image/jpeg'

packed = bytearray()
for meta, data in zip(doc['bufferViews'], views):
    packed.extend(b'\0' * (-len(packed) % 4))
    meta['byteOffset'], meta['byteLength'] = len(packed), len(data)
    packed.extend(data)
doc['buffers'] = [{'byteLength': len(packed)}]
doc['nodes'] = [{'name': 'Grilled sausage / +Z mission direction', 'mesh': 0}]
doc['scenes'] = [{'nodes': [0]}]
doc['scene'] = 0
doc['materials'][0]['doubleSided'] = False
doc['asset']['generator'] = 'Germany Simulator / build-mission-sausage.py; adapted from Saucisse by __Maros__'
encoded = json.dumps(doc, separators=(',', ':')).encode()
encoded += b' ' * (-len(encoded) % 4)
packed.extend(b'\0' * (-len(packed) % 4))
result = struct.pack('<3I', 0x46546c67, 2, 28 + len(encoded) + len(packed)) + struct.pack('<2I', len(encoded), 0x4e4f534a) + encoded + struct.pack('<2I', len(packed), 0x004e4942) + packed
target = root / 'assets/models/mission-sausage/sausage.glb'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_bytes(result)
print(json.dumps({'sourceSha256': hashlib.sha256(raw).hexdigest(), 'sha256': hashlib.sha256(result).hexdigest(), 'bytes': len(result), 'triangles': 3640, 'textures': [512, 512, 3], 'bounds': [position['min'], position['max']]}))
