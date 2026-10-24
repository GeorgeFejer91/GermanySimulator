"""Bounded one-time extraction of three exact selected neutral cells; no grid."""
from pathlib import Path
import hashlib
import json
import ctypes
import os
import time
from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
OWN = Path(__file__).resolve().parent
class MemoryStatus(ctypes.Structure):
    _fields_ = [('length', ctypes.c_uint32), ('load', ctypes.c_uint32),
                ('total', ctypes.c_uint64), ('available', ctypes.c_uint64),
                ('totalPage', ctypes.c_uint64), ('availablePage', ctypes.c_uint64),
                ('totalVirtual', ctypes.c_uint64), ('availableVirtual', ctypes.c_uint64),
                ('extended', ctypes.c_uint64)]
class ProcessMemory(ctypes.Structure):
    _fields_ = [('cb', ctypes.c_uint32), ('faults', ctypes.c_uint32),
                ('peakWorking', ctypes.c_size_t), ('working', ctypes.c_size_t),
                ('peakPaged', ctypes.c_size_t), ('paged', ctypes.c_size_t),
                ('peakNonpaged', ctypes.c_size_t), ('nonpaged', ctypes.c_size_t),
                ('pagefile', ctypes.c_size_t), ('peakPagefile', ctypes.c_size_t),
                ('private', ctypes.c_size_t)]
def available():
    state = MemoryStatus(); state.length = ctypes.sizeof(state)
    assert ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(state))
    return state.available
started = time.monotonic()
initial = available()
assert initial >= 1152 * 1024**2, f'LIGHT preflight refused: {initial} bytes free'
references = []
for key, relative in [('soeder', 'assets/characters/bayern'),
                      ('herr-sandale', 'assets/tourists/towelMan'),
                      ('frau-sandale', 'assets/tourists/towelWoman')]:
    folder = ROOT / relative
    manifest_path = folder / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    atlas_path = folder / manifest['image']
    width, height = manifest['frame_size']
    row = manifest['bridges']['down']['row']
    col = manifest['bridges']['down']['stop_cols'][-1]
    with Image.open(atlas_path) as atlas:
        cell = atlas.crop((col * width, row * height,
                           (col + 1) * width, (row + 1) * height)).convert('RGBA')
    target = OWN / f'reference-{key}-neutral.png'
    cell.save(target)
    references.append({
        'id': key, 'manifest': manifest_path.relative_to(ROOT).as_posix(),
        'manifestSha256': hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
        'atlas': atlas_path.relative_to(ROOT).as_posix(),
        'atlasSha256': hashlib.sha256(atlas_path.read_bytes()).hexdigest(),
        'row': row, 'col': col, 'cell': [width, height],
        'pivot': manifest['pivot'], 'boundsRGBA': cell.getbbox(),
        'extracted': target.relative_to(ROOT).as_posix(),
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest()
    })
    assert time.monotonic() - started < 15, 'Bounded crop exceeded15s'
(OWN / 'reference-neutrals.json').write_text(json.dumps(references, indent=2) + '\n')
memory = ProcessMemory(); memory.cb = ctypes.sizeof(memory)
ctypes.windll.kernel32.GetCurrentProcess.restype = ctypes.c_void_p
assert ctypes.windll.psapi.GetProcessMemoryInfo(ctypes.c_void_p(ctypes.windll.kernel32.GetCurrentProcess()), ctypes.byref(memory), memory.cb)
receipt = {'pid': os.getpid(), 'initialAvailableBytes': initial,
           'finalAvailableBytes': available(), 'peakWorkingSetBytes': memory.peakWorking,
           'peakPagefileBytes': memory.peakPagefile, 'elapsedSeconds': time.monotonic() - started,
           'childrenCreated': 0, 'atlasDecodes': 'three sequential; each image closed',
           'cells': len(references), 'size': [192, 208], 'references': references}
(OWN / 'reference-extraction-resource.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt))
