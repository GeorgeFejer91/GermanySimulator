"""Independent unprompted CPU reading of a final encoded neighbor recording."""
import hashlib
import json
from pathlib import Path
import sys
from faster_whisper import WhisperModel

model_dir, audio, output = map(Path, sys.argv[1:])
assert model_dir.is_dir() and audio.is_file() and not output.exists()
model = WhisperModel(str(model_dir), device="cpu", compute_type="int8", cpu_threads=1)
segments, info = model.transcribe(str(audio), language="de", beam_size=5,
                                 condition_on_previous_text=False, word_timestamps=True)
segments = list(segments)
result = {"transcript": " ".join(segment.text.strip() for segment in segments),
          "audioSha256": hashlib.sha256(audio.read_bytes()).hexdigest(),
          "modelSha256": hashlib.sha256((model_dir / "model.bin").read_bytes()).hexdigest(),
          "renderer": "faster-whisper CPU int8 independent unprompted whole-file reading",
          "device": "cpu", "computeType": "int8", "cpuThreads": 1,
          "beamSize": 5, "language": "de", "scriptPrompt": None,
          "conditionOnPreviousText": False,
          "words": [{"word": word.word, "start": word.start, "end": word.end}
                    for segment in segments for word in segment.words or []]}
output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
