"""Analyze existing office MP3s; ship compact, hash-bound acoustic mouth cues."""
import argparse
from array import array
import base64
import hashlib
import json
import math
from pathlib import Path
import subprocess
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--rhubarb', required=True, type=Path)
parser.add_argument('--ffmpeg', required=True, type=Path)
parser.add_argument('--whisper-model', choices=['base', 'small', 'medium'])
parser.add_argument('--check', action='store_true')
parser.add_argument('--reuse-unchanged', action='store_true', help='Reuse released cues only when audio bytes and authored ownership still match')
args = parser.parse_args()
assert '1.14.0' in subprocess.check_output([str(args.rhubarb), '--version'], text=True)
catalog = json.loads(subprocess.check_output(['node', '-e', "const fs=require('fs'),vm=require('vm'),c=vm.createContext({window:{location:{search:''}},URLSearchParams});vm.runInContext(fs.readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),c);console.log(JSON.stringify(Object.entries(c.window.GermanySimulatorAudioText.recordings).filter(([,v])=>v.voiceId?.startsWith('amt-')).map(([path,v])=>({path,...v}))))"], cwd=ROOT, text=True, encoding='utf-8'))
analysis_dir = ROOT / 'output/mouth-sync/analysis'
analysis_dir.mkdir(parents=True, exist_ok=True)
model = None
if args.whisper_model:
    import torch
    import whisper
    torch.set_num_threads(2)
    model = whisper.load_model(args.whisper_model, device='cpu')
tracks = {}
dest = ROOT / 'assets/buergeramt/speech/mouth-cues.js'
previous = {}
if args.reuse_unchanged and dest.exists():
    previous = json.loads(dest.read_text(encoding='utf-8').split('Object.freeze(', 1)[1].rsplit(');', 1)[0])
for i, clip in enumerate(catalog):
    audio = ROOT / clip['path'].removeprefix('./')
    sha = hashlib.sha256(audio.read_bytes()).hexdigest()
    assert not clip.get('sha256') or clip['sha256'] == sha, 'Catalog/audio mismatch: ' + clip['path']
    existing = previous.get(clip['path'])
    if existing and all(existing.get(key) == value for key, value in {'clipId':clip['id'], 'recording':clip['path'], 'audioSha256':sha, 'source':clip['source']}.items()):
        assert existing['sampleHz'] == 100 and existing['cues'][0][0] == 0
        assert abs(existing['cues'][-1][1] - existing['duration']) <= .011
        assert all(a[1] == b[0] for a,b in zip(existing['cues'], existing['cues'][1:]))
        # Recover the integer 16 kHz sample count before counting 160-sample bins.
        assert len(base64.b64decode(existing['energyBase64'], validate=True)) == math.ceil(round(existing['duration'] * 16000) / 160)
        tracks[clip['path']] = existing
        print(f"{i+1}/{len(catalog)} {clip['id']}: verified unchanged cues", flush=True)
        continue
    with tempfile.TemporaryDirectory(prefix='gs-mouth-cues-') as temporary:
        wav = Path(temporary) / 'track.wav'
        cues = Path(temporary) / 'cues.json'
        subprocess.run([str(args.ffmpeg), '-v', 'error', '-y', '-i', str(audio), '-ac', '1', '-ar', '16000', str(wav)], check=True)
        subprocess.run([str(args.rhubarb), '-q', '-r', 'phonetic', '--threads', '2', '--extendedShapes', 'GHX', '-f', 'json', '-o', str(cues), str(wav)], check=True)
        raw = json.loads(cues.read_text())
        with wave.open(str(wav)) as stream:
            samples = array('h', stream.readframes(stream.getnframes()))
        rms = [math.sqrt(sum((v / 32768) ** 2 for v in samples[j:j+160]) / max(1, len(samples[j:j+160]))) for j in range(0, len(samples), 160)]
        scale = max(1e-5, sorted(rms)[int(len(rms) * .90)])
        energy = bytes(round(255 * min(1, max(0, (v / scale - .045) / .955)) ** .65) for v in rms)
        track = {'clipId':clip['id'], 'recording':clip['path'], 'audioSha256':sha, 'source':clip['source'], 'duration':len(samples)/16000,
                 'sampleHz':100, 'energyBase64':base64.b64encode(energy).decode(),
                 'cues':[[c['start'], c['end'], c['value']] for c in raw['mouthCues']]}
        assert track['cues'][0][0] == 0
        assert all(a[1] == b[0] for a,b in zip(track['cues'], track['cues'][1:]))
        tracks[clip['path']] = track
        diagnostic = {'recording':clip['path'], 'audioSha256':sha, 'duration':track['duration'], 'catalogWordMarks':clip.get('wordCues',[]), 'visemes':track['cues']}
        if model:
            # Independent decode of the encoded MP3; no expected-text prompt.
            result = model.transcribe(str(wav), language='de', word_timestamps=True, fp16=False, verbose=False, temperature=0, condition_on_previous_text=False)
            diagnostic['whisper'] = {'model':args.whisper_model, 'version':whisper.__version__, 'text':result['text'], 'words':[w for s in result['segments'] for w in s.get('words',[])]}
        if not args.check:
            (analysis_dir / (clip['id'] + '.json')).write_text(json.dumps(diagnostic, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f"{i+1}/{len(catalog)} {clip['id']}: {len(track['cues'])} visemes, {len(energy)} acoustic samples", flush=True)
rendered = '// Generated by tools/build-buergeramt-speech-cues.py from unchanged MP3s; phonetic shapes are estimates.\nexport const speechMouthTracks = Object.freeze(' + json.dumps(tracks, ensure_ascii=False, separators=(',', ':')) + ');\n'
if args.check:
    assert dest.read_text(encoding='utf-8') == rendered, 'Office cue data is stale'
else:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(rendered, encoding='utf-8', newline='\n')
print(f"{len(tracks)} tracks, {len(rendered.encode())} bytes; no audio changed", flush=True)
