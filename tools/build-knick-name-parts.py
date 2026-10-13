"""Verify name-only decoding and prepare four fixed intercom tails privately."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import time

import numpy as np
import onnx
import onnxruntime as ort
import soundfile as sf


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def model(root, durations=False):
    manifest = json.loads((root / 'manifest.json').read_text())
    encoded = (root / manifest['model']).read_bytes()
    assert hashlib.sha256(encoded).hexdigest() == manifest['downloadSha256']
    graph = onnx.load_from_string(gzip.decompress(encoded))
    if durations:
        graph.graph.output.append(onnx.helper.make_tensor_value_info('/Ceil_output_0', onnx.TensorProto.FLOAT, [1, 1, 'tokens']))
    options = ort.SessionOptions(); options.intra_op_num_threads = 2; options.inter_op_num_threads = 1; options.log_severity_level = 3
    return ort.InferenceSession(graph.SerializeToString(), options, providers=['CPUExecutionProvider']), manifest


def write(path, audio):
    peak, rms = float(np.abs(audio).max()), float(np.sqrt(np.mean(audio * audio)))
    assert np.isfinite(audio).all() and peak > .001 and rms > .001
    sf.write(path, audio * min(.85 / peak, .1 / rms), 22050, subtype='PCM_16')
    return {'file': path.name, 'sha256': sha(path), 'bytes': path.stat().st_size, 'samples': len(audio)}


def run(args):
    root = Path(__file__).resolve().parent.parent
    assert not args.output.resolve().is_relative_to(root)
    args.output.mkdir(parents=True, exist_ok=True)
    original, manifest = model(args.source, True)
    names_only, new_manifest = model(args.name_model)
    names = ['Erika Mustermann', 'George Fejer', 'Anna Müller', 'Jürgen Müller', 'Al', 'Weiß, Anna-Lena', 'Name ' * 15]
    counters = ['eins', 'zwei', 'drei', 'vier']
    texts = [f'{name}, bitte zu Schalter eins!' for name in names]
    texts += [f'Erika Mustermann, bitte zu Schalter {counter}!' for counter in counters]
    rows = json.loads(subprocess.check_output(['node', str(root / 'tools/prepare-knick-browser-ids.cjs'), '--text-input'],
                     input=json.dumps(texts), text=True, encoding='utf-8'))
    tails, cases, named = [], [], []
    for index, row in enumerate(rows):
        ids = row['phoneme_ids']; end = len(ids) - 1 - ids[::-1].index(8)
        feed = {'input': np.asarray([ids], dtype=np.int64), 'input_lengths': np.asarray([len(ids)], dtype=np.int64), 'scales': np.asarray([0, 1.2, 0], dtype=np.float32)}
        started = time.monotonic(); full, durations = original.run(None, feed); full_time = time.monotonic() - started
        frames = int(durations.reshape(-1)[:end].sum()); cut = frames * 256
        full = full.reshape(-1)
        if index < len(names):
            started = time.monotonic(); name = names_only.run(None, {**feed, 'name_end': np.asarray([end], dtype=np.int64)})[0].reshape(-1)
            name_time = time.monotonic() - started
            assert len(name) == cut
            error = float(np.max(np.abs(name - full[:cut])))
            assert error < 1e-4, f'Name context changed retained samples: {error}'
            named.append(name)
            cases.append({**write(args.output / f'name-{index+1:02}.wav', name), 'name': names[index], 'fullSeconds': len(full) / 22050,
                          'nameSeconds': len(name) / 22050, 'fullGenerationSeconds': full_time, 'nameGenerationSeconds': name_time, 'maximumRetainedSampleError': error})
        else:
            counter = index - len(names) + 1
            tails.append(full[cut:])
            cases_tail = write(args.output / f'counter-{counter}.wav', full[cut:])
            cases_tail.update(counter=counter, text=f'bitte zu Schalter {counters[counter-1]}!', sampleRate=22050, channels=1, format='PCM16 WAV',
                              voiceId=manifest['voiceId'], profileId=manifest['profileId'], referenceSha256=manifest['referenceSha256'],
                              sourceModelSha256=manifest['sha256'], sourceText=row['text'], startSample=cut)
            cases.append(cases_tail)
    # Audition the actual joins: fixed tail comes from Erika, regardless of name.
    for index, name in enumerate(named[:4]):
        for counter, tail in enumerate(tails):
            name_float, _ = sf.read(args.output / f'name-{index+1:02}.wav', dtype='float32')
            tail_float, _ = sf.read(args.output / f'counter-{counter+1}.wav', dtype='float32')
            fade = min(110, len(name_float)); name_float[-fade:] *= np.linspace(1, 0, fade)
            tail_float[:min(110, len(tail_float))] *= np.linspace(0, 1, min(110, len(tail_float)))
            write(args.output / f'joined-{index+1:02}-{counter+1}.wav', np.concatenate([name_float, tail_float]))
    report = {'schemaVersion': 1, 'modelSha256': new_manifest['sha256'], 'sourceModelSha256': manifest['sha256'],
              'sampleRate': 22050, 'nameContextFrames': 16, 'listening': 'not-performed', 'provider': 'CPUExecutionProvider', 'threads': 2,
              'nameCases': cases[:len(names)], 'counterTails': cases[len(names):]}
    (args.output / 'parts.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--name-model', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    run(parser.parse_args())
