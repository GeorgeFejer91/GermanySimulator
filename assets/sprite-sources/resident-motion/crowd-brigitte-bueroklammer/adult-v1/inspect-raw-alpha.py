"""Small diagnostic only: sequential raw alpha histograms, no edits or grids."""
from pathlib import Path
import ctypes
import hashlib
import json
import os
import time
from PIL import Image

HERE = Path(__file__).resolve().parent
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
started = time.monotonic(); initial = available()
assert initial >= 1152 * 1024**2, f'LIGHT preflight refused: {initial} bytes free'
images = []
for filename in ['raw-directions-v1.png', 'raw-directions-v2.png']:
    path = HERE / filename
    with Image.open(path) as raw:
        rgba = raw.convert('RGBA')
    alpha = rgba.getchannel('A'); hist = alpha.histogram()
    points = [(0, 0), (rgba.width // 2, 0), (rgba.width - 1, rgba.height - 1),
              (rgba.width // 4, rgba.height // 4), (rgba.width // 2, rgba.height // 2)]
    images.append({'file': filename, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                   'size': list(rgba.size), 'alphaBounds': alpha.getbbox(),
                   'alphaExtrema': alpha.getextrema(), 'alphaZeroPixels': hist[0],
                   'alpha255Pixels': hist[255], 'alphaHistogram': hist,
                   'sampleRGBA': [{'xy': p, 'rgba': rgba.getpixel(p)} for p in points]})
    rgba.close(); alpha.close()
    assert time.monotonic() - started < 10, 'Diagnostic exceeded10s'
memory = ProcessMemory(); memory.cb = ctypes.sizeof(memory)
ctypes.windll.kernel32.GetCurrentProcess.restype = ctypes.c_void_p
assert ctypes.windll.psapi.GetProcessMemoryInfo(ctypes.c_void_p(ctypes.windll.kernel32.GetCurrentProcess()), ctypes.byref(memory), memory.cb)
receipt = {'pid': os.getpid(), 'initialAvailableBytes': initial, 'finalAvailableBytes': available(),
           'peakWorkingSetBytes': memory.peakWorking, 'peakPagefileBytes': memory.peakPagefile,
           'elapsedSeconds': time.monotonic() - started, 'childrenCreated': 0,
           'decodedImages': 'two sequential, closed; no image mutation', 'images': images}
(HERE / 'raw-alpha-diagnostic.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({**{k: v for k, v in receipt.items() if k != 'images'},
                  'images': [{k: v for k, v in item.items() if k != 'alphaHistogram'} for item in images]}))
