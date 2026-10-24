"""Rebuild Ursula from raw inputs; compare tracked expectations only afterward."""
from pathlib import Path
import argparse, ctypes, hashlib, json, os, shutil, subprocess, sys, time

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
OWN = HERE.relative_to(ROOT)
ID = 'stadt-ursula-neumann'
WORK = Path('output/street-redesign/ursula-neumann-end-to-end')
ASSET = Path('assets/characters/residents') / ID / 'delivery-v2'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()

def available_memory():
    if os.name != 'nt':
        return None
    class Memory(ctypes.Structure):
        _fields_ = [('length', ctypes.c_ulong), ('load', ctypes.c_ulong),
                    *[(name, ctypes.c_ulonglong) for name in
                      ('total', 'available', 'page', 'availablePage', 'virtual', 'availableVirtual', 'extended')]]
    memory = Memory(); memory.length = ctypes.sizeof(memory)
    assert ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(memory))
    return memory.available

def run(name):
    assert name.startswith('un-clean-') and all(c.isalnum() or c == '-' for c in name)
    destination = ROOT / 'output' / name
    assert not destination.exists(), 'Keep earlier attempts; a new empty mirror is required'
    destination.mkdir(parents=True)
    if os.name == 'nt':
        destination = Path('\\\\?\\' + str(destination))
    pins = {}
    def copy(relative):
        source, target = ROOT / relative, destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        pins[relative.as_posix()] = sha(source)
        assert sha(target) == pins[relative.as_posix()]
    for path in HERE.rglob('*'):
        relative = path.relative_to(HERE)
        if path.is_file() and not {'registered', '__pycache__'} & set(relative.parts) and path.name not in ('registration.json', 'rebuild-baseline.json'):
            copy(path.relative_to(ROOT))
    for path in ['tools/build-street-character-sprites.py', 'tools/build-street-mouths.py',
                 'tools/build-street-motion-delivery.py',
                 '.agents/skills/animate-2d-characters/scripts/painted_walk.py',
                 '.agents/skills/animate-2d-characters/scripts/harmonize_material.py',
                 '.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py']:
        copy(Path(path))
    assert not any('/registered/' in path or path.startswith('output/') for path in pins)
    prior = json.loads((destination / OWN / 'pre-admission-person.json').read_text())
    manifest = destination / 'assets/characters/street/manifest.json'
    manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest.write_text(json.dumps({'schemaVersion': 1, 'characters': {ID: prior}}, separators=(',', ':')) + '\n')
    spec = json.loads((destination / OWN / 'motion-spec.json').read_text())
    assert spec['actor'] == ID
    environment = dict(os.environ, OMP_NUM_THREADS='1', OPENBLAS_NUM_THREADS='1', PYTHONDONTWRITEBYTECODE='1')
    flags = subprocess.CREATE_NO_WINDOW | subprocess.BELOW_NORMAL_PRIORITY_CLASS if os.name == 'nt' else 0
    steps = []
    def execute(script, *arguments):
        free = available_memory()
        assert free is None or free >= 1024**3, 'Hold before the next child below1GiB available'
        # Keep __file__ and caller-supplied paths in the mirror's same Windows
        # extended-length namespace. A relative outdir.resolve() loses that
        # prefix, making a valid own-directory containment check fail.
        argv = [sys.executable, '-B', str(destination / script), *map(str, arguments)]
        start = time.time()
        with (destination / 'commands.log').open('a', encoding='utf-8') as log:
            child = subprocess.Popen(argv, cwd=destination, env=environment, creationflags=flags,
                                     stdout=log, stderr=subprocess.STDOUT)
            priority = None
            if os.name == 'nt':
                from ctypes import wintypes
                kernel = ctypes.WinDLL('kernel32', use_last_error=True)
                kernel.GetPriorityClass.argtypes = [wintypes.HANDLE]
                kernel.GetPriorityClass.restype = wintypes.DWORD
                priority = kernel.GetPriorityClass(wintypes.HANDLE(int(child._handle)))
                assert priority == 16384
            record = {'argv': argv, 'pid': child.pid, 'actualPriorityClass': priority,
                      'availableMemoryBefore': free, 'threads': 1, 'hidden': bool(flags)}
            print(json.dumps(record), flush=True)
            record.update(minimumAvailableMemory=free, peakWorkingSet=0)
            if os.name == 'nt':
                class Counters(ctypes.Structure):
                    _fields_ = [('cb', wintypes.DWORD), ('faults', wintypes.DWORD),
                                *[(key, ctypes.c_size_t) for key in
                                  ('peak', 'working', 'qpp', 'pp', 'qpnp', 'pnp', 'page', 'peakPage')]]
                psapi = ctypes.WinDLL('psapi')
                psapi.GetProcessMemoryInfo.argtypes = [wintypes.HANDLE, ctypes.POINTER(Counters), wintypes.DWORD]
            while child.poll() is None:
                observed_free = available_memory()
                if observed_free is not None:
                    record['minimumAvailableMemory'] = min(record['minimumAvailableMemory'], observed_free)
                if os.name == 'nt':
                    counters = Counters(); counters.cb = ctypes.sizeof(counters)
                    if psapi.GetProcessMemoryInfo(wintypes.HANDLE(int(child._handle)), ctypes.byref(counters), counters.cb):
                        record['peakWorkingSet'] = max(record['peakWorkingSet'], counters.peak)
                time.sleep(.15)
            result = child.returncode
        record.update(exit=result, seconds=time.time()-start, availableMemoryAfter=available_memory())
        steps.append(record)
        (destination / 'steps.json').write_text(json.dumps(steps, indent=2)+'\n')
        assert result == 0, (script, result)
    for script in ['prepare-neutrals.py', 'fit-adult-mouths.py', 'build-family-source.py', 'prepare-family-mouths.py']:
        execute(OWN / script)
    execute(OWN / 'build-candidate.py', '--outdir', destination / WORK / 'candidate-v1', '--stride-distance', spec['strideDistance'])
    execute(OWN / 'install-candidate.py')
    execute(Path('tools/build-street-motion-delivery.py'), '--manifest', destination / 'assets/characters/street/manifest.json',
            '--character', ID, '--outdir', destination / ASSET / 'delivery')
    execute(OWN / 'bind-delivery.py')
    baseline = json.loads((HERE / 'rebuild-baseline.json').read_text())
    assert baseline['actor'] == ID and baseline['validationOnly'] is True
    matches = []
    for relative, expected in baseline['expectedFiles'].items():
        actual = sha(destination / relative)
        assert actual == expected, (relative, actual, expected)
        matches.append({'file': relative, 'sha256': actual})
    selected = json.loads(manifest.read_text())['characters'][ID]
    assert selected == baseline['selectedPerson']
    for relative, digest in pins.items():
        assert sha(ROOT / relative) == sha(destination / relative) == digest
    report = {'status': 'PASS', 'actor': ID, 'copiedInputs': pins, 'steps': steps,
              'exactOutputs': matches, 'sameSelectedPerson': True,
              'baselineValidationOnly': True, 'baselineSha256': sha(HERE / 'rebuild-baseline.json'),
              'noRegisteredCompiledCacheOrCurrentRegistryInputs': True,
              'python': sys.version, 'bootstrap': 'immutable own pre-admission-person + legacy family'}
    (destination / 'report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'status': 'PASS', 'exactOutputs': len(matches), 'sameSelectedPerson': True}), flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--name', required=True)
    run(parser.parse_args().name)
