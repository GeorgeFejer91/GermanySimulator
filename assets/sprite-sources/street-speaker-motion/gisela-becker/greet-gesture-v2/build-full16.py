"""Sample the accepted serialized greeting paint; never rebuild/change its rig."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label

FOLDER = Path(__file__).resolve().parent
ROOT = FOLDER.parents[4]
PILOT = ROOT / 'output/ambient-city-animation/gisela-greet-v2'
OUT = ROOT / 'output/ambient-city-animation/gisela-greet-full16'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

# Root-accepted source/pilot contract: no ignored cache is required to rebuild.
ACCEPTED_INPUTS = json.loads(r'''{
  "assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/build-pilot.py": {
    "sha256": "8f191cfe86ef58be922f81a01cff70c9cf56192fb4569c512ebc949264dbb31b",
    "bytes": 13058
  },
  "assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/controls.json": {
    "sha256": "32ba2e7bdbb4987b1cb04a6723832b0ac866ef74ab3fc4e1e9932cf293a667a2",
    "bytes": 16008
  },
  "assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/source-registration.json": {
    "sha256": "2ee16ea17500dbaf7e4469d0f235fd6a40847c31291d4ee266eb25eb6a0b26d6",
    "bytes": 947
  },
  "assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/native-face-sources.json": {
    "sha256": "985e2bf03136ccc66740ab3b92fcba334dd77604776f00419ebc9e664d1ec7b8",
    "bytes": 5735
  },
  "assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/neutral-source.png": {
    "sha256": "0f4015fdcb98d4d074ecd3313d8a07824dc793f93560ae87710b8e2d076a1cab",
    "bytes": 190372
  },
  "assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/neutral-head.png": {
    "sha256": "d2022d015039aeb088ed208d36b9ac9b3549e806f915a7cb02411734f8a64ab2",
    "bytes": 97016
  },
  "assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/raised-head.png": {
    "sha256": "5c4de171f9edec63de872c12265eb2ef677254befc1ecad9c95404906c696833",
    "bytes": 92054
  },
  "assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/neutral-arm.png": {
    "sha256": "fbfb86a45203ac4ea311f971d617ef8c8f39b0abe23aa1c6922a252fc73f1882",
    "bytes": 9999
  },
  "assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/raised-arm.png": {
    "sha256": "400967894dbf3b8224868dbda4ced3e4524bf30ea8423a7878c1bfac3f5bc4e6",
    "bytes": 13244
  },
  "assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/rigid-paper-hand.png": {
    "sha256": "64c04b615c702b08d7499bbe0b40513d38142393d6e89d7441242951c1bcdd1e",
    "bytes": 18919
  },
  "assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/own-torso-backing.png": {
    "sha256": "6a650a5b535eac64f7ff43d350f86321ce2cc47ffa502bf1a29ce68b44a3cac8",
    "bytes": 81750
  },
  "tools/build-street-speaker-family.py": {
    "sha256": "d2389d0574f735361e824c04ad96bcb512bd084ca19a4a6d008d1a3e584fe20c",
    "bytes": 6246
  },
  "tools/build-resident-motion.py": {
    "sha256": "c20472334f2292f5144db7c8521b51a1133aed26e6c5e49dd5343fcefb9da735",
    "bytes": 37038
  },
  ".agents/skills/animate-2d-characters/scripts/morph_frames.py": {
    "sha256": "c706db478d42bd228274dabe9ae4198d5d2f0fc62ed35eb5b1c30218bb82c37e",
    "bytes": 6270
  },
  "assets/sprite-sources/street-speaker-motion/gisela-becker/motion-spec.json": {
    "sha256": "f8dbea3a9878babeeb2b75a6d8b80baafa56bab2c83dcd34d899ff447cf79f5b",
    "bytes": 17773
  },
  "assets/sprite-sources/street-quiz/gisela-becker-keys.png": {
    "sha256": "c367a9062ce40efdadcd6436ac712d0f9e502a3c2e206b3be1a3c7d2d2ee5d74",
    "bytes": 2169540
  },
  "assets/characters/street-speakers/quiz-gisela-becker/character-desktop.webp": {
    "sha256": "cf62820e6a5cc5b38bc594b86c36f7db545d22560ca12f339f5ea4e950a75b2a",
    "bytes": 1561194
  },
  "assets/characters/street-speakers/quiz-gisela-becker/character-mobile.webp": {
    "sha256": "18d18a9396bc918395801e1dfc3e57c0a7b4818c522ea0ff67aa9ef4d0f832c0",
    "bytes": 488688
  },
  "assets/characters/street-speakers/quiz-gisela-becker/manifest.json": {
    "sha256": "2dd57b9f4c3eab6e98668d9f7d8e1603624a3ebe1a22dd3c5af49cd4dc6195cd",
    "bytes": 16925
  }
}''')
REPLAY_GOLDEN = json.loads(r'''{
  "workingRGBA": [
    "74ca4f14972fa6c1e09dfa467d1eae5b5139c700b92553c65a84bbff07966a1c",
    "2839bb49e809aeaaacc106a54b0dd0863679078602284faff6fb3e45d561550c",
    "f749a41f7fd15e11e24e038e1e6ed78f05718f6d9a2860aa8453950180c2de69",
    "99a8def762ea0efa7d466246e6eb8b3197b784cb53ba34ecb02c52800f15b10b",
    "f749a41f7fd15e11e24e038e1e6ed78f05718f6d9a2860aa8453950180c2de69",
    "2839bb49e809aeaaacc106a54b0dd0863679078602284faff6fb3e45d561550c",
    "74ca4f14972fa6c1e09dfa467d1eae5b5139c700b92553c65a84bbff07966a1c"
  ],
  "desktopRGBA": [
    "346882324b79f03b13f09a5c3f51394dd4dba54a783c812fd63851f98f7876d4",
    "ccce7385f25347e62640808ce4525c72108ffceb2f7279d7ab6653f4ac16d7e3",
    "4e8795c4931c630f5d077ebe0946af8364f4c23f887b411cccd146345c6c5b2e",
    "d96f66dd1f5d8e9349bc48928325d3c61d910183f7bf99415d946b775b24868d",
    "4e8795c4931c630f5d077ebe0946af8364f4c23f887b411cccd146345c6c5b2e",
    "ccce7385f25347e62640808ce4525c72108ffceb2f7279d7ab6653f4ac16d7e3",
    "346882324b79f03b13f09a5c3f51394dd4dba54a783c812fd63851f98f7876d4"
  ],
  "mobileRGBA": [
    "b99a160bc117a6f1655db22be49f5bb41acfd7c1c30fb3a0e1b91560c288f527",
    "5a0400bc7dab78b82e1b3fc8707c27837c9f7d62fbafb67b70a69d6a82fe2843",
    "5fceea6cd90b210691acf0d7a2a1f6f71da9ea7c7d277cb8a031073bc1a0f504",
    "61c8760ddbbd0a3e37d54e4a222941c448bd179d84a606f7bb4b5b03f0b86b94",
    "5fceea6cd90b210691acf0d7a2a1f6f71da9ea7c7d277cb8a031073bc1a0f504",
    "5a0400bc7dab78b82e1b3fc8707c27837c9f7d62fbafb67b70a69d6a82fe2843",
    "b99a160bc117a6f1655db22be49f5bb41acfd7c1c30fb3a0e1b91560c288f527"
  ]
}''')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    inputs = ACCEPTED_INPUTS.copy()
    for name, pin in inputs.items():
        assert sha(ROOT / name) == pin['sha256'], name
        assert (ROOT / name).stat().st_size == pin['bytes'], name
    controls = json.loads((FOLDER / 'controls.json').read_text())
    sys.path.insert(0, str(ROOT / '.agents/skills/animate-2d-characters/scripts'))
    import morph_frames
    module_spec = importlib.util.spec_from_file_location('family', ROOT / 'tools/build-street-speaker-family.py')
    family = importlib.util.module_from_spec(module_spec)
    module_spec.loader.exec_module(family)
    builder, cfg = family.configure(ROOT / 'assets/sprite-sources/street-speaker-motion/gisela-becker/motion-spec.json')
    layers = {name: Image.open(FOLDER / (name + '.png')).convert('RGBA')
              for name in ['neutral-source', 'neutral-head', 'raised-head',
                           'neutral-arm', 'raised-arm', 'rigid-paper-hand', 'own-torso-backing']}
    neutral = layers['neutral-source']
    original = np.array(neutral)
    mask = Image.new('L', neutral.size)
    ImageDraw.Draw(mask).polygon(controls['maskOwnership']['stationaryBookLeftHand'], fill=255)
    book = np.array(mask) > 0
    fields = {}
    for part in ['head', 'arm']:
        c = controls[part]
        fields[part] = [np.array(c['pointsSource']), np.array(c['pointsTarget']),
                        np.array(c['triangles'])]
        morph_frames.validate_mesh(*fields[part])
    yy, xx = np.mgrid[:neutral.height, :neutral.width]
    prop_pixels = builder.paint.premul(layers['rigid-paper-hand'])
    prop_dx, prop_dy = controls['rigidPaperHand']['translationAtExtreme']
    assert controls['rigidPaperHand']['scale'] == 1 and controls['rigidPaperHand']['rotation'] == 0

    def render(phase):
        if phase == 0:
            return neutral.copy()
        frame = layers['own-torso-backing'].copy()
        for part in ['arm', 'head']:
            # These are the actual accepted nodes/triangles/phase passed to the
            # existing helper, not a newly fitted or reconstructed deformation.
            frame.alpha_composite(morph_frames.morph(layers['neutral-' + part],
                layers['raised-' + part], *fields[part], phase))
        frame.alpha_composite(builder.paint.unpack(builder.paint.sample(prop_pixels,
            xx - prop_dx * phase, yy - prop_dy * phase)))
        pixels = np.array(frame)
        pixels[book] = original[book]
        return Image.fromarray(pixels)

    # Mandatory gate BEFORE the new dense bake: replay complete paint recipe,
    # including rigid prop, held book, actual helper layers and final exporter.
    replay_phases = [0, .30, .65, 1, .65, .30, 0]
    replay = [render(t) for t in replay_phases]
    for i, frame in enumerate(replay):
        assert hashlib.sha256(frame.tobytes()).hexdigest() == REPLAY_GOLDEN['workingRGBA'][i], ('working golden replay', i)
        reference = PILOT / ('working-%02d.png' % i)
        if reference.exists():
            assert frame.tobytes() == Image.open(reference).convert('RGBA').tobytes(), ('live working replay', i)
    for variant, compact in [('desktop', False), ('mobile', True)]:
        reference_path = PILOT / (variant + '-pilot.webp')
        reference = Image.open(reference_path).convert('RGBA') if reference_path.exists() else None
        for i, frame in enumerate(replay):
            cell = builder.street.export_cell(frame, cfg, compact=compact)
            w, h = cell.size
            assert hashlib.sha256(cell.tobytes()).hexdigest() == REPLAY_GOLDEN[variant+'RGBA'][i], ('encoded golden replay', variant, i)
            if reference is not None:
                assert cell.tobytes() == reference.crop((i*w, 0, (i+1)*w, h)).tobytes(), ('live encoded replay', variant, i)
    (OUT / 'pilot-replay-checks.json').write_text(json.dumps({
        'status': 'PASS exact complete serialized recipe replay', 'workingFrames': 7,
        'desktopEncodedCells': 7, 'mobileEncodedCells': 7, 'phases': replay_phases,
        'inputs': inputs, 'goldenRGBA': REPLAY_GOLDEN, 'comparisonMode': 'Frozen decoded pixel golden hashes; optional live pilot byte comparisons'}, indent=2) + '\n')
    print('PASS exact seven working + fourteen encoded cells; beginning full16', flush=True)

    # Deliberate two-cell peak at7/8; exact neutral at0/15. Eight distinct poses
    # evaluated from the original field, never recursively from rendered frames.
    smooth = lambda t: t*t*(3-2*t)
    phases = [smooth(i/7) if i <= 7 else smooth((15-i)/7) for i in range(16)]
    frames = [render(t) for t in phases]
    records = []
    for i, (phase, frame) in enumerate(zip(phases, frames)):
        frame.save(OUT / ('working-%02d.png' % i))
        pixels = np.array(frame)
        assert np.array_equal(pixels[420:], original[420:]), ('feet/lower garment', i)
        assert np.array_equal(pixels[book], original[book]), ('held book/left hand', i)
        components, _ = label(pixels[:, :, 3] >= 128)
        sizes = np.bincount(components.ravel())[1:]
        fraction = float(sizes.max() / sizes.sum())
        assert fraction > .995, ('detached opaque component', i)
        fields_record = {part: {**{key: controls[part][key] for key in
                          ['pointsSource', 'pointsTarget', 'triangles']}, 'phase': phase}
                         for part in ['head', 'arm']}
        records.append({'frame': i, 'phase': phase, 'frameMs': 80,
            'headField': fields_record['head'], 'armField': fields_record['arm'],
            'rigidPropInverse': {'dx': -prop_dx*phase, 'dy': -prop_dy*phase},
            'bookLeftHandExact': True, 'lowerBodyExact': True, 'opaqueBodyFraction': fraction})
    assert frames[0].tobytes() == frames[-1].tobytes() == neutral.tobytes()
    assert frames[7].tobytes() == frames[8].tobytes() == replay[3].tobytes()
    distinct = len({frame.tobytes() for frame in frames})
    assert distinct == 8
    variants = {}
    for variant, compact in [('desktop', False), ('mobile', True)]:
        encoded = [builder.street.export_cell(frame, cfg, compact=compact) for frame in frames]
        w, h = encoded[0].size
        atlas = Image.new('RGBA', (w*16, h))
        for i, cell in enumerate(encoded):
            atlas.alpha_composite(cell, (i*w, 0))
        path = OUT / (variant + '-greet16.webp')
        atlas.save(path, lossless=True, exact=True, method=6)
        actual = Image.open(path).convert('RGBA')
        assert actual.tobytes() == atlas.tobytes()
        rows = []
        for i in range(16):
            cell = actual.crop((i*w, 0, (i+1)*w, h))
            cell.save(OUT / ('%s-frame-%02d.png' % (variant, i)))
            a = np.array(cell)
            assert np.all(a[a[:, :, 3] == 0, :3] == 0), ('hidden RGB', variant, i)
            box = cell.getbbox()
            gutters = [box[0], box[1], w-box[2], h-box[3]]
            assert min(gutters) >= (2 if compact else 4), ('cell gutter', variant, i)
            rows.append({'frame': i, 'rgbaSha256': hashlib.sha256(cell.tobytes()).hexdigest(),
                         'alphaBounds': box, 'guttersLTRB': gutters})
        old_atlas = Image.open(ROOT / ('assets/characters/street-speakers/quiz-gisela-becker/character-' + variant + '.webp')).convert('RGBA')
        old_neutral = old_atlas.crop((2*w, 4*h, 3*w, 5*h))
        assert actual.crop((0, 0, w, h)).tobytes() == old_neutral.tobytes()
        assert actual.crop((15*w, 0, 16*w, h)).tobytes() == old_neutral.tobytes()
        zoom = 3 if not compact else 6
        for theme, background in [('light', '#eee8db'), ('dark', '#25272b')]:
            builder.street.opaque_board(encoded, 8, background, zoom).save(OUT / (variant + '-all16-' + theme + '.png'))
            for half in range(2):
                builder.street.opaque_board(encoded[half*8:(half+1)*8], 8, background, zoom).save(OUT / ('%s-ordered-%d-%s.png' % (variant, half, theme)))
            for speed, ms in [('normal', 80), ('slow', 160)]:
                display = [builder.street.opaque_board([cell], 1, background, zoom) for cell in encoded]
                display[0].save(OUT / ('%s-%s-%s.gif' % (variant, speed, theme)),
                    save_all=True, append_images=display[1:], duration=ms, loop=0, disposal=2)
        variants[variant] = {'file': path.relative_to(ROOT).as_posix(), 'sha256': sha(path),
            'bytes': path.stat().st_size, 'cell': [w, h], 'pivot': [v/(2 if compact else 1) for v in cfg['pivot']],
            'size': actual.size, 'decodedRGBABytes': actual.width*actual.height*4,
            'zeroEndExactV1Neutral': True, 'frames': rows}
    capture = {'status': 'candidate full16 greeting; root art review required',
        'driver': {'path': Path(__file__).relative_to(ROOT).as_posix(), 'sha256': sha(Path(__file__))},
        'fieldOwner': controls['fieldOwner'], 'fieldOwnerSha256': controls['fieldOwnerSha256'],
        'inputs': inputs, 'registration': controls['sharedRegistration'],
        'recipe': 'Serialized own backing -> exact morph_frames arm -> exact morph_frames head -> rigid paper/grip -> stationary source book; phase0 exact source neutral',
        'mouthTransport': 'Both endpoint inverse maps/Jacobians must come from the recorded actual helper triangles, source/target nodes and phase; no approximate replacement rig.',
        'clip': {'intent': 'one-shot candidate; GIF repeats for review only', 'cells': 16,
                 'distinctPoses': distinct, 'normalFrameMs': 80, 'durationMs': 1280,
                 'peakCells': [7, 8], 'peakHoldMs': 160, 'phases': phases},
        'samples': records, 'variants': variants, 'limits': ['No atlas merge or runtime integration',
            'No gesture mouth bake or GPU validation', 'Live normal/slow playback not observed by builder',
            'No general walking stride/support claim; lower source body intentionally stationary']}
    (OUT / 'actual-field-capture.json').write_text(json.dumps(capture, indent=2) + '\n')
    # Check accepted inputs after all sampling/encoding, without writing them.
    for name, pin in inputs.items():
        assert sha(ROOT / name) == pin['sha256'], name
    all_paths = [p for p in OUT.glob('*') if p.is_file() and p.name != 'full16-bindings.json'] + [Path(__file__)]
    bindings = {p.relative_to(ROOT).as_posix(): {'sha256': sha(p), 'bytes': p.stat().st_size}
                for p in all_paths}
    (OUT / 'full16-bindings.json').write_text(json.dumps({'inputs': inputs, 'outputsAndDriver': bindings}, indent=2) + '\n')
    print(json.dumps({'status': 'candidate', 'samples': 16, 'distinct': distinct,
                      'variants': {k: {n: v[n] for n in ['sha256', 'bytes', 'cell']} for k, v in variants.items()},
                      'output': str(OUT)}), flush=True)


if __name__ == '__main__':
    main()
