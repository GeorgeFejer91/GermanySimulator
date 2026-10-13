"""Generate independent fixed-name probes with the actual compact ONNX model."""
import argparse
import hashlib
import json
from pathlib import Path
import time
import wave
import subprocess
import gzip
import re
import soundfile as sf

import numpy as np
import onnxruntime as ort

NAMES = ['Erika Mustermann', 'Anna Müller', 'Hans Schmidt', 'Jürgen Müller',
         'George Fejer', 'Anna-Lena Weiß', 'Özlem Yılmaz', 'Jean-Luc Dupont']
COUNTERS = ['eins', 'zwei', 'drei', 'vier']


def samples(session, ids, deterministic=False, name_only=False):
    feed = {'input': np.array([ids], dtype=np.int64),
        'input_lengths': np.array([len(ids)], dtype=np.int64),
        'scales': np.array([0, 1.2, 0], dtype=np.float32)}
    if name_only: feed['name_end'] = np.array([len(ids)-1-ids[::-1].index(8)], dtype=np.int64)
    return session.run(None, feed)[0].reshape(-1)


def check(args):
    manifest = json.loads((args.model_root / 'manifest.json').read_text())
    model = args.model_root / manifest['model']
    encoded = model.read_bytes()
    if manifest.get('compression') == 'gzip':
        assert len(encoded) == manifest['downloadBytes']
        assert hashlib.sha256(encoded).hexdigest() == manifest['downloadSha256']
    model_bytes = gzip.decompress(encoded) if manifest.get('compression') == 'gzip' else encoded
    assert len(model_bytes) == manifest['bytes']
    assert hashlib.sha256(model_bytes).hexdigest() == manifest['sha256']
    options = ort.SessionOptions()
    options.intra_op_num_threads = 2
    options.inter_op_num_threads = 1
    options.log_severity_level = 3
    session = ort.InferenceSession(model_bytes, options, providers=['CPUExecutionProvider'])
    reference = ort.InferenceSession(str(args.reference), options, providers=['CPUExecutionProvider']) if args.reference else None
    names = json.loads(args.names_json.read_text(encoding='utf-8')) if args.names_json else NAMES
    assert all(isinstance(name,str) and 2 <= len(name) <= 80 for name in names)
    texts = json.loads(args.texts_json.read_text(encoding='utf-8')) if args.texts_json else [f'{name}, bitte zu Schalter {COUNTERS[index % 4]}!' for index, name in enumerate(names)]
    assert all(isinstance(text,str) and 3 <= len(text) <= 160 for text in texts)
    name_only = manifest.get('nameContextFrames') == 16
    contexts = [re.sub(r', bitte zu Schalter (eins|zwei|drei|vier)!$', ', bitte zu Schalter eins!', text) for text in texts] if name_only else texts
    rows = json.loads(subprocess.check_output(['node', str(Path(__file__).with_name('prepare-knick-browser-ids.cjs')), '--text-input'],
                      input=json.dumps(contexts, ensure_ascii=False), text=True, encoding='utf-8'))
    args.output.mkdir(parents=True, exist_ok=True)
    report = {'modelSha256': manifest['sha256'], 'ortVersion': ort.__version__,
              'provider': 'CPUExecutionProvider', 'threads': 2, 'cases': [],
              'listening': 'not-performed', 'browser': 'not-run'}
    for index, text in enumerate(texts):
        ids = rows[index]['phoneme_ids']
        started = time.monotonic()
        audio = samples(session, ids, name_only=name_only)
        if name_only:
            counter = COUNTERS.index(re.search(r', bitte zu Schalter (eins|zwei|drei|vier)!$', text)[1])
            tail, rate = sf.read(args.model_root / manifest['counterTails'][counter]['file'], dtype='float32')
            assert rate == 22050
            gain = min(.85 / np.abs(audio).max(), .1 / np.sqrt(np.mean(audio * audio)))
            audio = np.rint(audio * gain * 32767).astype('<i2').astype(np.float32) / 32768
            fade = min(110, len(audio)); audio[-fade:] *= np.linspace(1, 0, fade)
            tail[:min(110, len(tail))] *= np.linspace(0, 1, min(110, len(tail)))
            audio = np.concatenate([audio, tail])
        elapsed = time.monotonic() - started
        assert np.isfinite(audio).all()
        peak, rms = float(np.max(np.abs(audio))), float(np.sqrt(np.mean(audio * audio)))
        seconds = len(audio) / 22050
        assert .5 < seconds < 20 and peak > .001 and rms > .001
        gain = min(.85 / peak, .1 / rms)
        path = args.output / f'knick-name-{index + 1:02}.wav'
        with wave.open(str(path), 'wb') as wav:
            wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(22050)
            wav.writeframes(np.rint(np.clip(audio * gain, -1, 1) * 32767).astype('<i2').tobytes())
        case = {'text': text, 'file': path.name, 'seconds': seconds,
                'generationSeconds': elapsed, 'rtf': elapsed / seconds,
                'rawPeak': peak, 'rawRms': rms, 'gain': gain}
        if reference and index < 2:
            expected = samples(reference, ids, True)
            actual = samples(session, ids, True)
            case['referenceSamples'] = len(expected)
            case['quantizedSamples'] = len(actual)
            length = min(len(expected), len(actual))
            case['quantizationMae'] = float(np.mean(np.abs(expected[:length] - actual[:length])))
        report['cases'].append(case)
        print(json.dumps(case, ensure_ascii=False), flush=True)
        (args.output / 'native-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model-root', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--reference', type=Path)
    parser.add_argument('--names-json', type=Path)
    parser.add_argument('--texts-json', type=Path)
    check(parser.parse_args())
