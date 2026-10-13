"""Prepare and train a browser-sized Knick voice from verified selected takes."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time
import re

ROOT = Path(__file__).resolve().parents[1]
VOICE = "amt-brunhilde-knick"
PIPER_REVISION = "35b0f1ec67b289de553555645140e48f1f104b2d"
PIPER_TRAINING_SHA256 = "77e932802f3b7d28653fbda635d7e418144c9281354fc469f0b6e29bbd6c0abf"


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def write(path, document):
    path.write_text(json.dumps(document, ensure_ascii=False, indent=2), encoding="utf-8")


def prepare(args):
    binding = read(ROOT / "For-AI/VOICE-CAST.json")["productionVoices"][VOICE]
    manifest = read(ROOT / "assets/voices/knick/manifest.json")
    assert binding["profileId"] == "b080c7d95ecd418fb428282461d7fbe7"
    profile = args.music_root / "Secret Tunnel shared voice data/profiles" / binding["profileId"]
    assert sha(profile / "reference.wav") == binding["referenceSha256"]
    assert sha(profile / "original.wav") == binding["originalSha256"]
    wav = args.private_root / "dataset/wav"
    wav.mkdir(parents=True, exist_ok=True)
    rows, sources = [], []
    raw_root = args.music_root / "GermanySimulator Knick consistency review 2026-10-11/raw"
    for clip in manifest["clips"]:
        assert clip["voiceId"] == VOICE and clip["profileId"] == binding["profileId"]
        assert clip["referenceSha256"] == binding["referenceSha256"]
        assert clip["asrWordExact"] and clip["asrScriptPrompt"] is None
        encoded = ROOT / clip["file"]
        assert sha(encoded) == clip["sha256"]
        if not 1.0 <= clip["durationSeconds"] <= 16.0:
            continue
        original = raw_root / (clip["clipId"] + ".wav")
        dry = original.is_file() and sha(original) == clip["rawSha256"]
        source = original if dry else encoded
        target = wav / (clip["clipId"] + ".wav")
        subprocess.run([str(args.ffmpeg), "-nostdin", "-hide_banner", "-loglevel", "error",
                        "-y", "-i", str(source), "-ac", "1", "-ar", "22050",
                        "-c:a", "pcm_s16le", str(target)], check=True)
        assert "|" not in clip["text"] and "\n" not in clip["text"]
        rows.append(target.name + "|" + clip["text"])
        sources.append({"clipId": clip["clipId"], "text": clip["text"],
                        "sourceSha256": sha(source), "trainingSha256": sha(target),
                        "seconds": clip["durationSeconds"], "dry": dry})
    assert len(rows) >= 100, "Insufficient verified short selected-speaker takes"
    (wav.parent / "metadata.csv").write_text("\n".join(rows) + "\n", encoding="utf-8")
    receipt = {"voiceId": VOICE, "profileId": binding["profileId"],
               "referenceSha256": binding["referenceSha256"],
               "originalSha256": binding["originalSha256"],
               "teacher": binding["renderer"], "teacherRevision": binding["modelRevision"],
               "piperVersion": "1.8.0", "trainingCodeSha256": PIPER_TRAINING_SHA256, "sources": sources,
               "minutes": sum(row["seconds"] for row in sources) / 60,
               "seed": 20261013, "listening": "not-performed"}
    write(args.private_root / "training-sources.json", receipt)
    print(json.dumps({"takes": len(rows), "minutes": receipt["minutes"],
                      "dryTakes": sum(row["dry"] for row in sources)}), flush=True)


def train(args):
    import pathlib
    import torch
    from lightning.pytorch import Trainer, seed_everything
    from lightning.pytorch.callbacks import Callback, ModelCheckpoint
    from piper.train.vits.dataset import VitsDataModule
    from piper.train.vits.lightning import VitsModel
    import inspect

    assert torch.cuda.is_available(), "Training requires the isolated CUDA environment"
    assert sha(Path(inspect.getfile(VitsModel))) == PIPER_TRAINING_SHA256
    revision = subprocess.check_output(["git", "-C", str(args.piper_source),
                                        "rev-parse", "HEAD"], text=True).strip()
    assert revision == PIPER_REVISION, "Training source revision changed"
    torch.set_num_threads(2)
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True
    seed_everything(20261013, workers=True)
    base = args.private_root / "base.ckpt"
    assert sha(base) == "063f96fd905b9f57bd077bdbca0aa39876a29103c2cc8688fb4d39e2876a0de2", "Pretrained checkpoint changed"
    original_posix_path = pathlib.PosixPath
    if sys.platform == "win32":
        pathlib.PosixPath = pathlib.WindowsPath
    try:
        checkpoint = torch.load(base, map_location="cpu", weights_only=False)
    finally:
        pathlib.PosixPath = original_posix_path
    hyperparameters = checkpoint["hyper_parameters"]
    hyperparameters.update(batch_size=2, sample_rate=22050, num_speakers=1,
                           learning_rate=args.learning_rate, learning_rate_d=args.discriminator_rate,
                           dataset=None, mos_metric=None)
    model = VitsModel(**hyperparameters)
    model.load_state_dict(checkpoint["state_dict"], strict=True)
    del checkpoint
    base_encoder = {key: value.clone() for key, value in model.model_g.enc_p.state_dict().items()}
    base_duration = {key: value.clone() for key, value in model.model_g.dp.state_dict().items()}
    if args.init_checkpoint:
        warmstart = torch.load(args.init_checkpoint, map_location="cpu", weights_only=False)
        model.load_state_dict(warmstart["state_dict"], strict=True)
        del warmstart
    if args.freeze_latent:
        assert args.freeze_pronunciation and not args.init_checkpoint, 'The preserved-latent trial starts from the complete base checkpoint'
        model.model_g.flow.requires_grad_(False)
    if args.freeze_pronunciation:
        model.model_g.enc_p.load_state_dict(base_encoder)
        model.model_g.dp.load_state_dict(base_duration)
        model.model_g.enc_p.requires_grad_(False)
        model.model_g.dp.requires_grad_(False)
    checkpoint_dir = args.private_root / ("checkpoints" + ("-" + args.run_name if args.run_name else ""))
    write(args.private_root / ('training-run' + ('-' + args.run_name if args.run_name else '') + '.json'),
          {'resumeCheckpointSha256': sha(checkpoint_dir / 'last.ckpt') if (checkpoint_dir / 'last.ckpt').exists() else None,
           'baseCheckpointSha256': sha(base), 'initialCheckpointSha256': sha(args.init_checkpoint) if args.init_checkpoint else None,
           'freezePronunciation': args.freeze_pronunciation, 'freezeLatent': args.freeze_latent,
           'generatorRate': args.learning_rate, 'discriminatorRate': args.discriminator_rate,
           'requestedGlobalSteps': args.steps, 'browserMetadataSha256': sha(args.private_root / 'dataset/metadata-browser.csv'),
           'trainingCodeSha256': PIPER_TRAINING_SHA256, 'seed': 20261013})
    class Progress(Callback):
        def __init__(self):
            self.started = time.monotonic()

        def on_train_batch_end(self, trainer, module, outputs, batch, batch_idx):
            if trainer.global_step % 100 == 0:
                metrics = {key: float(value) for key, value in trainer.callback_metrics.items()
                           if key in ["train_mel", "train_kl", "loss_g", "loss_d", "val_mel"]}
                receipt = {"step": trainer.global_step, "seconds": time.monotonic() - self.started,
                           "metrics": metrics}
                write(args.private_root / ("training-progress" + ("-" + args.run_name if args.run_name else "") + ".json"), receipt)
                print(json.dumps(receipt), flush=True)
        def on_train_batch_start(self, trainer, module, batch, batch_idx):
            if args.freeze_pronunciation:
                module.model_g.enc_p.eval()
                module.model_g.dp.eval()
            if args.freeze_latent:
                module.model_g.flow.eval()
    dataset = args.private_root / "dataset"
    browser_metadata = dataset / "metadata-browser.csv"
    assert browser_metadata.exists(), "Run tools/prepare-knick-browser-ids.cjs first"
    data = VitsDataModule(csv_path=browser_metadata, audio_dir=dataset / "wav",
                         cache_dir=dataset / "cache-browser", espeak_voice="de", dataset_type="phoneme_ids",
                         config_path=dataset / "config.json", voice_name="de_DE-knick-medium",
                         batch_size=2, num_workers=0, validation_split=.08,
                         num_test_examples=6, trim_silence=True)
    saves = ModelCheckpoint(dirpath=checkpoint_dir, save_last=True,
                            save_top_k=-1, every_n_train_steps=1000,
                            filename="knick-{step}", save_on_train_epoch_end=False)
    trainer = Trainer(accelerator="gpu", devices=1, precision="32-true", max_steps=args.steps,
                      max_epochs=-1, default_root_dir=args.private_root / "training",
                      callbacks=[saves, Progress()], enable_progress_bar=False, logger=False,
                      log_every_n_steps=20, check_val_every_n_epoch=5,
                      num_sanity_val_steps=2)
    resume = checkpoint_dir / "last.ckpt"
    trainer.fit(model, datamodule=data, ckpt_path=str(resume) if resume.exists() else None)
    trainer.save_checkpoint(checkpoint_dir / "final.ckpt")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("prepare", "train"))
    parser.add_argument("--private-root", type=Path, required=True)
    parser.add_argument("--music-root", type=Path, required=True)
    parser.add_argument("--ffmpeg", type=Path, default=Path("ffmpeg"))
    parser.add_argument("--piper-source", type=Path)
    parser.add_argument("--steps", type=int, default=6000)
    parser.add_argument("--run-name", default="")
    parser.add_argument("--init-checkpoint", type=Path)
    parser.add_argument("--freeze-pronunciation", action="store_true")
    parser.add_argument("--freeze-latent", action="store_true")
    parser.add_argument("--learning-rate", type=float, default=1e-4)
    parser.add_argument("--discriminator-rate", type=float, default=5e-5)
    args = parser.parse_args()
    assert not args.run_name or re.fullmatch(r"[a-z][a-z0-9-]{0,30}", args.run_name)
    assert not args.private_root.resolve().is_relative_to(ROOT), 'Keep authoring inputs and checkpoints outside the checkout'
    args.private_root.mkdir(parents=True, exist_ok=True)
    if args.mode == "prepare":
        prepare(args)
    else:
        train(args)


if __name__ == "__main__":
    main()
