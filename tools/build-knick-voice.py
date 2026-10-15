"""Render exact current dialogue with cached, fixed production voices.

Uses existing local authoring environments; never downloads a model, creates a
profile, edits dialogue, or grants listening approval. Failed takes stay private.
Run --plan first, --render in the Chatterbox environment, then --process in the
faster-whisper environment. Knick is the default; --request-file supports the
curated street-wisdom, office reply and bounded city dialogue families. City
processing remains private pending the reviewed curator export. --check verifies
the existing shipped families.
"""
import argparse
import gc
import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import time

VOICE = "amt-brunhilde-knick"
ROOT = Path(__file__).resolve().parents[1]


def native_archive_path(path):
    """Keep archive names intact while supporting Windows long absolute paths."""
    value = os.path.abspath(os.fspath(path))
    if os.name == "nt" and not value.startswith("\\\\?\\"):
        value = "\\\\?\\UNC\\" + value[2:] if value.startswith("\\\\") else "\\\\?\\" + value
    return Path(value)


def archive_move(source, destination):
    source, destination = native_archive_path(source), native_archive_path(destination)
    assert source.is_file() and not destination.exists(), "Failed archives must never be overwritten"
    digest = sha(source)
    shutil.move(str(source), str(destination))
    assert destination.is_file() and sha(destination) == digest, "Archived take bytes changed"


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


AUTHORING_HELPER_SHA256 = sha(Path(__file__))
BINDING = read(ROOT / "For-AI/VOICE-CAST.json")["productionVoices"][VOICE]
PROFILE, REFERENCE_HASH, REVISION, PROCESSING = (BINDING[key] for key in ("profileId", "referenceSha256", "modelRevision", "processing"))
assert BINDING["renderer"] == "ResembleAI/Chatterbox Multilingual V2 0.1.7"
assert REVISION == "5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18", "Only the verified cached engine revision is supported"
REUSE_EVIDENCE = []
SOURCE_FILES = ("buergeramt-story.js", "buergeramt.js")
PUBLIC_ASSET_FAMILY = "assets/voices/knick"
PRIVATE_REVIEW_FAMILY = "GermanySimulator Knick consistency review 2026-10-11"
CUSTOM_PLAN = None
RENDER_CACHE = None
ASR_CACHE = None
ASR_NORMALIZATION = "case/punctuation, German numeric and A38 spoken equivalents, guarded full-hour and date-ordinal equivalents, section sign/Paragraf orthography, German compound spacing"
SEGMENTED_ASR_AUTHORITIES = {'knick-registration-identityfix': {'diagnosticSha256': '78d0ce846c42ff915ea6c58c283a836f05a417d379905d1fa1eeb28548b0d407',
                                    'encodedSha256': 'a68ed7c036b0b4ba79c19c5e6a5bbccc35022348b5fff77026713e1f7b9be2c9',
                                    'originalEncodedReceiptSha256': '80711c3e6775807880f4b218b3201312a9713cd19903c7eba6451c479913c3c3',
                                    'fullDecodedPcmSha256': 'a8f2148f84e6e4ac9e26529060559a72aec87e3066f46a5bed428607553aaca2',
                                    'boundaries': [0, 56960, 86400, 129280, 203520, 234880],
                                    'authoritySha256': 'be3bb20e33dd5f29e94e06a027ee8b324c420fa035b2ea6bf878281a54351ce4',
                                    'voiceId': 'amt-brunhilde-knick',
                                    'profileId': 'b080c7d95ecd418fb428282461d7fbe7',
                                    'referenceSha256': '901e9ad60eda5cbb36337b12864b6a2b0d133570acb90941b9eabd9888c16351',
                                    'text': 'Der Originalpass steckt in Ihrer Dokumentenmappe. Holen Sie ihn '
                                            'heraus. Ihr Telefon bleibt lautlos. Ich werde die Identität Ihres '
                                            'Ladekabels heute nicht mitprüfen. Wie reichen Sie den Pass?',
                                    'modelSha256': 'e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da',
                                    'chunkPcmSha256': ['52bfcd53bf36a3490786b7c50b9404d2294abe163130df81e2152360358d4404',
                                                       '87ad6b24f47daed0308ea5952fbfcf8131442418de935fbcd6c7d015e42a5cca',
                                                       '7b02650b1f4d7019f4f8bded8da241d7166e73dd89d0500be1091aadc33ad65f',
                                                       'b8c5a1beafd9ef06efd1a64afcf1f74eab34946bb35f23c3f488c207cad3bf11',
                                                       '81c8cc1471a4ab9f1bc9149fa5840db5eb9f31411c0313ef8bfa87a3b8f3d70c'],
                                    'parts': [{'clipId': 'knick-registration-identityfix-part-01',
                                               'text': 'Der Originalpass steckt in Ihrer Dokumentenmappe.',
                                               'rawSha256': 'ac65e3235221119f24286ab3bbfddc328dcbe6d4bf3743bd9b2a33252e0b6762',
                                               'encodedSha256': 'b8f3ab849b1a217a4593bb75faf3a46373aa41f89b88f379ab830e5f0cd734f2'},
                                              {'clipId': 'knick-registration-identityfix-part-02',
                                               'text': 'Holen Sie ihn heraus.',
                                               'rawSha256': '4d48c17a6e246797ef261f1a8aa8d02d98ed8d9c9a3d6bf84ea70d6ec26e9d32',
                                               'encodedSha256': 'e0178ef6d6e37fdff287d026aa8829b679d1254a5ed5f3be3c4660e762fe0665'},
                                              {'clipId': 'knick-registration-identityfix-part-03',
                                               'text': 'Ihr Telefon bleibt lautlos.',
                                               'rawSha256': '93bac22c667fdb66f596de6ef83523d24cb11fadef1f0240d65b9fc9c2787e55',
                                               'encodedSha256': '43351690ce5753940b21f6ca377355aa0386822a70c82cb38ec59f368b46c2c1'},
                                              {'clipId': 'knick-registration-identityfix-part-04',
                                               'text': 'Ich werde die Identität Ihres Ladekabels heute nicht '
                                                       'mitprüfen.',
                                               'rawSha256': 'b8be1b69835c5a635e4f582ff9c4b2e8fa3f810c29bf44f7cc236fed144cb057',
                                               'encodedSha256': '9af94c56be7a6fb974deb51fe83f0a73c3d55aa6bd762cd0e9d8d8df79a25690'},
                                              {'clipId': 'knick-registration-identityfix-part-05',
                                               'text': 'Wie reichen Sie den Pass?',
                                               'rawSha256': '6143c752faebabf3f3e33692a9db0b7e4cac277c63f9c8beaac49c7e05908fe1',
                                               'encodedSha256': '9e1c5c83349b9bf07e68042734a9ade8e8404066c26f185f31ffcf95eb8a830e'}],
                                    'selectedReadings': [{'beamSize': 1,
                                                          'transcript': 'Der Originalpass steckt in Ihrer '
                                                                        'Dokumentenmappe.'},
                                                         {'beamSize': 1, 'transcript': 'Holen Sie ihn heraus!'},
                                                         {'beamSize': 1,
                                                          'transcript': 'Ihr Telefon bleibt lautlos.'},
                                                         {'beamSize': 1,
                                                          'transcript': 'Ich werde die Identität Ihres Ladekabels '
                                                                        'heute nicht mitprüfen.'},
                                                         {'beamSize': 1,
                                                          'transcript': 'Wie reichen Sie den Pass?'}]},
 'knick-registration-movein': {'diagnosticSha256': 'f3e5dda674c0913fa972c2a6937e3d9db55eb953014efec50db687016570eb37',
                               'encodedSha256': '03d534b7db8e485e87aeccdc142096b35976f8beadb3457c90da5a419ee934da',
                               'originalEncodedReceiptSha256': 'd2e71d9616ff840799cf8290e61cff1074a7430d43f2623aadf82db69f291ebc',
                               'fullDecodedPcmSha256': '75892a6c021180e335d25d8e29e09b832fc66b3e5bdc3e129a9cb81fca4a001a',
                               'boundaries': [0, 19200, 64000, 115200, 161280, 222080, 238080],
                               'authoritySha256': '49bf27d8a4b9f76452ef16ddf65e7a8e6ef0e7b13f94b6819d2becf6c7998f0b',
                               'voiceId': 'amt-brunhilde-knick',
                               'profileId': 'b080c7d95ecd418fb428282461d7fbe7',
                               'referenceSha256': '901e9ad60eda5cbb36337b12864b6a2b0d133570acb90941b9eabd9888c16351',
                               'text': 'Einzugsdatum. Ihr Mietvertrag begann am Ersten. Den Schlüssel bekamen Sie '
                                       'am Dritten. Eingezogen sind Sie am Fünften. Drei Daten, aber nur eins '
                                       'wohnt in diesem Feld. Welches?',
                               'modelSha256': 'e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da',
                               'chunkPcmSha256': ['8b8650025fc808372954107a6cf8ab1bd7e542d883074e24603a8fa47d6fdfcb',
                                                  'faca89829beabb3b702fb536e3076134442098900afb4c464ee5233e2597fd17',
                                                  'e6d27776f831eb101dd662f3b52de0100bfc8def1bfb33a432566adc8447d40a',
                                                  '9d0e75b3c50722de26a8aa784269007427179838f0c3edd7ee99293653e091e6',
                                                  'ca679d3dac5c7d863e1191c0dd8a95c842b557c34925e949e411c1c13a0885b0',
                                                  '4847056ba26cf87f0785f176dc40be65098cad1d7e31c7394a5e1a7023bc3be5'],
                               'parts': [{'clipId': 'knick-registration-movein-part-01',
                                          'text': 'Einzugsdatum.',
                                          'rawSha256': '57e738ef6fae55cfdb3661639027acccac82be38d6b0a2fc69ee6cb7e792250e',
                                          'encodedSha256': 'b0dfffc7a2371dc9fbd5418d501fc33aa4967b59129dc0f0beb49d01c39dabe0'},
                                         {'clipId': 'knick-registration-movein-part-02',
                                          'text': 'Ihr Mietvertrag begann am Ersten.',
                                          'rawSha256': 'a928801556cbdb9ed5fdc7912213a63217210e775212672dc9faea81a679a999',
                                          'encodedSha256': '4b74099e8072b5edf9f13f8146f6f934d1f807b2edd2c5b0c4bf7a1f309957ed'},
                                         {'clipId': 'knick-registration-movein-part-03',
                                          'text': 'Den Schlüssel bekamen Sie am Dritten.',
                                          'rawSha256': '378b0c832f0f61489e4b4ada92559011a5d1f428bcfd4a2baa0409e77c8cd037',
                                          'encodedSha256': '5666e0ecd370a350ed6df8483eb698972cdff7f2cfe6f4ab63f141a81738ff5b'},
                                         {'clipId': 'knick-registration-movein-part-04',
                                          'text': 'Eingezogen sind Sie am Fünften.',
                                          'rawSha256': '0114257c9b8324542d8a7d0cf0fff4ac6af96eeadb95cf23444e1e34b13c0300',
                                          'encodedSha256': 'de1d31597d32dbfdc9af6f398a202175d34e6718cad2837e3566bfc81b8372b6'},
                                         {'clipId': 'knick-registration-movein-part-05',
                                          'text': 'Drei Daten, aber nur eins wohnt in diesem Feld.',
                                          'rawSha256': 'ba34c6a3ba0fbbc9f7a71f008203076553e8b2f82b7fee116b8bb84d5897450b',
                                          'encodedSha256': 'd54b692b113039c89ef4a4d6295c7929897b683e999e6fb01986e63c11140f0b'},
                                         {'clipId': 'knick-registration-movein-part-06',
                                          'text': 'Welches?',
                                          'rawSha256': '3ebbbfa5a150006937041ce38f58e593d986106520f2878de1fd422daf33fe18',
                                          'encodedSha256': '8c3253bb2dc8c1c6b3acb04076f6697212c4718b1b193f7cc58f3505293e381d'}],
                               'selectedReadings': [{'beamSize': 1, 'transcript': 'Einzugsdatum.'},
                                                    {'beamSize': 1, 'transcript': 'Ihr Mietvertrag begann am 1.'},
                                                    {'beamSize': 1,
                                                     'transcript': 'Den Schlüssel bekamen sie am dritten.'},
                                                    {'beamSize': 1,
                                                     'transcript': 'Eingezogen sind sie am fünften.'},
                                                    {'beamSize': 1,
                                                     'transcript': 'Drei Daten, aber nur eins wohnt in diesem '
                                                                   'Feld.'},
                                                    {'beamSize': 5, 'transcript': 'Welches?'}]},
 'knick-registration-residencefix': {'diagnosticSha256': 'd1a0a3d9f3c443aab416ccb73a7aba456e3a8143e6ad6eb101c0f4dddd685939',
                                     'encodedSha256': '5f3320cb4462361bc0cbc127d8650cd8a77ba130517f115c7b1c6c8a17e519fd',
                                     'originalEncodedReceiptSha256': '7d9d901d3a2987cbede1ed050e10a4a47b91a79be5116f37655f188297856c1b',
                                     'fullDecodedPcmSha256': 'c86ad26e8dcfb1dcffe7f624e155c20d16d988c0fc4ca48ef7e47f07482ca50f',
                                     'boundaries': [0, 56960, 133760, 169600, 199680],
                                     'authoritySha256': '106ecd1bf77ca16865610edf4f21c4e89fe153b2d1105256c4f4939e5147a86f',
                                     'voiceId': 'amt-brunhilde-knick',
                                     'profileId': 'b080c7d95ecd418fb428282461d7fbe7',
                                     'referenceSha256': '901e9ad60eda5cbb36337b12864b6a2b0d133570acb90941b9eabd9888c16351',
                                     'text': 'Geben Sie die weiteren Wohnungen vollständig an. Hauptwohnung '
                                             'bestimmen wir anhand der maßgeblichen tatsächlichen Nutzung und der '
                                             'Angaben zu Ihrer Wohnsituation. Was reichen Sie nach?',
                                     'modelSha256': 'e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da',
                                     'chunkPcmSha256': ['179426d7f779d9d32af7065b6c6ab67cbdfb749de91be613d482632d18b83095',
                                                        'e9d6a81951d85d375af8e107c7788dd6fb58ef3601fa0e43a1b2750d008044e1',
                                                        '49a2028815eaac2c81da023846c73f847da6567f6ffc9266aed14fa331ed9bcd',
                                                        'fec2c0b1e2344e03a1d34598a9ee7126001a025289460c8c2cf548e4be014d26'],
                                     'parts': [{'clipId': 'knick-registration-residencefix-part-01',
                                                'text': 'Geben Sie die weiteren Wohnungen vollständig an.',
                                                'rawSha256': 'e3b3b8b7480ddc315cb1a4c5cee961ded34a457de7aa3bf22d558808c622f3b8',
                                                'encodedSha256': '43321da20eb1965454a8add1a42d8e267675905daf05ef6520bddc297ffc46fc'},
                                               {'clipId': 'knick-registration-residencefix-context-01',
                                                'text': 'Hauptwohnung bestimmen wir anhand der maßgeblichen '
                                                        'tatsächlichen Nutzung',
                                                'rawSha256': 'b49bb6eb661a6c0c3e87a0110b665d07d3528ba6a91a5776913348559f49e151',
                                                'encodedSha256': '93ade980cffcfc6c435de5c30b3b9ffdc408f1dcd5807f67a34d9c76e76db4fc'},
                                               {'clipId': 'knick-registration-residencefix-segment-03',
                                                'text': 'und der Angaben zu Ihrer Wohnsituation.',
                                                'rawSha256': 'c7a124406f93c778ef3d720e8c10c9c0a5621884f53a0f1041539e8d93da68b5',
                                                'encodedSha256': '86a3b8f7edb78bf11d2e6020e406c9ef3f6c91e33f1edfc96911d701dbe22f82'},
                                               {'clipId': 'knick-registration-residencefix-part-03',
                                                'text': 'Was reichen Sie nach?',
                                                'rawSha256': 'e8ec4cc90b06cd25bf4f753b5b0ba9ec406fed23031ad3a80b60ac77fd8a20eb',
                                                'encodedSha256': '36a7017214d7c8205aaba3e1cc8fc8cc1132afe07d9a1976642c9923515afa68'}],
                                     'selectedReadings': [{'beamSize': 1,
                                                           'transcript': 'Geben Sie die weiteren Wohnungen '
                                                                         'vollständig an.'},
                                                          {'beamSize': 1,
                                                           'transcript': 'Hauptwohnung bestimmen wir anhand der '
                                                                         'maßgeblichen tatsächlichen Nutzung.'},
                                                          {'beamSize': 1,
                                                           'transcript': 'und der Angaben zu ihrer '
                                                                         'Wohnsituation.'},
                                                          {'beamSize': 1, 'transcript': 'Was reichen sie nach?'}]}}


def processing_hash(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest() if value is not None else None


def manifest_name(ambient=False):
    if CUSTOM_PLAN and CUSTOM_PLAN["family"] == "crowd-dialogue":
        return VOICE + "-crowd-manifest.json"
    if CUSTOM_PLAN and CUSTOM_PLAN["family"] == "office-monologue":
        return VOICE + "-portrait-manifest.json"
    if CUSTOM_PLAN and CUSTOM_PLAN["family"] == "office-mirror":
        return VOICE + "-mirror-manifest.json"
    return VOICE + "-manifest.json" if CUSTOM_PLAN else ("ambient-manifest.json" if ambient else "manifest.json")


def source_hashes():
    return {name: sha(ROOT / name) for name in SOURCE_FILES}


def configure_request(args):
    global VOICE, BINDING, PROFILE, REFERENCE_HASH, REVISION, PROCESSING
    global SOURCE_FILES, PUBLIC_ASSET_FAMILY, PRIVATE_REVIEW_FAMILY, CUSTOM_PLAN
    SOURCE_FILES = ("buergeramt-story.js", "buergeramt.js")
    PUBLIC_ASSET_FAMILY = "assets/voices/knick"
    PRIVATE_REVIEW_FAMILY = "GermanySimulator Knick consistency review 2026-10-11"
    CUSTOM_PLAN = None
    VOICE = args.voice_id
    assert re.fullmatch(r"[a-z0-9-]+", VOICE), "Selected voice identifiers must be safe path components"
    BINDING = read(ROOT / "For-AI/VOICE-CAST.json")["productionVoices"][VOICE]
    PROFILE, REFERENCE_HASH, REVISION = (BINDING[key] for key in ("profileId", "referenceSha256", "modelRevision"))
    PROCESSING = BINDING.get("processing")
    assert PROCESSING is None or isinstance(PROCESSING, str) and PROCESSING, "Dry processing must be absent/null; declared recipes must be nonempty"
    assert BINDING["renderer"] == "ResembleAI/Chatterbox Multilingual V2 0.1.7"
    assert REVISION == "5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18"
    if args.request_file:
        plan = read(args.request_file)
        assert not args.ambient, "Custom families own their authored queues"
        assert plan["family"] in ("street-wisdom", "office-replies", "office-ambient", "office-monologue", "office-mirror", "city-dialogue", "crowd-dialogue")
        if plan["family"] in ("office-monologue", "office-mirror"):
            assert not getattr(args, "sentence_rescue", False), "The player monologue requires one whole-text synthesis call, never joined sentence takes"
        if plan["family"] == "crowd-dialogue":
            assert VOICE in {"crowd-baerbel-brezel", "crowd-brigitte-bueroklammer", "crowd-elfriede-eingabe", "crowd-guenther-gartenzaun", "crowd-hildegard-brotzeit", "crowd-irmgard-aktenordner", "crowd-klaus-dieter-knoedel", "crowd-manfred-mittagsruhe", "crowd-ruediger-rasenkante"}
            assert plan["publicAssetFamily"] == "assets/voices/candidate-dialogue"
            assert plan["privateReviewFamily"] == "GermanySimulator crowd dialogue review 2026-10-15"
            assert set(plan["sourceSha256"]) == {"game.js", "For-AI/VOICE-CAST.json", "For-AI/AUDIO-TEXT-LIBRARY.js"}
            assert not (args.sentence_rescue or args.eos_after_alignment or args.benchmark_hooks), "Crowd dialogue uses the unchanged whole-take recipe"
            SOURCE_FILES = ("game.js", "For-AI/VOICE-CAST.json", "For-AI/AUDIO-TEXT-LIBRARY.js")
        elif plan["family"] == "city-dialogue":
            assert VOICE.startswith("stadt-"), "City family requires an owned city voice"
            assert plan["publicAssetFamily"] == "assets/voices/city-dialogue", "City public asset scope changed"
            assert plan["privateReviewFamily"] == "GermanySimulator city dialogue review 2026-10-15", "City private review scope changed"
            assert set(plan["sourceSha256"]) == {"game.js", "For-AI/VOICE-CAST.json", "For-AI/AUDIO-TEXT-LIBRARY.js"}, "City source set changed"
            assert not (args.sentence_rescue or args.eos_after_alignment or args.benchmark_hooks), "City dialogue uses the unchanged whole-take native recipe"
            assert not (args.manifest or args.check), "City public export awaits the reviewed curator interface"
            SOURCE_FILES = ("game.js", "For-AI/VOICE-CAST.json", "For-AI/AUDIO-TEXT-LIBRARY.js")
        elif plan["family"] == "office-ambient":
            assert VOICE.startswith("amt-")
            assert plan["publicAssetFamily"] == "assets/voices/office-ambient"
            assert plan["privateReviewFamily"] == "GermanySimulator office ambient review 2026-10-12"
            assert set(plan["sourceSha256"]) == {"buergeramt-story.js", "buergeramt.js"}
        elif plan["family"] in ("office-replies", "office-monologue", "office-mirror"):
            assert VOICE == "spieler-hans-peter-mustermann"
            assert plan["publicAssetFamily"] == "assets/voices/player-replies"
            assert plan["privateReviewFamily"] == {"office-monologue": "GermanySimulator president portrait review 2026-10-12", "office-mirror": "GermanySimulator potato mirror review 2026-10-13", "office-replies": "GermanySimulator office replies review 2026-10-12"}[plan["family"]]
            assert set(plan["sourceSha256"]) == {"buergeramt-story.js", "buergeramt.js"}
            SOURCE_FILES = ("buergeramt-story.js", "buergeramt.js")
        else:
            assert plan["publicAssetFamily"] == "assets/voices/street-wisdom"
            assert plan["privateReviewFamily"] == "GermanySimulator street wisdom review 2026-10-11"
            assert set(plan["sourceSha256"]) in ({"For-AI/AUDIO-TEXT-LIBRARY.js"}, {"For-AI/AUDIO-TEXT-LIBRARY.js", "street-wisdom.js"})
            SOURCE_FILES = ("For-AI/AUDIO-TEXT-LIBRARY.js", "street-wisdom.js")
            assert (ROOT / "street-wisdom.js").is_file()
        PUBLIC_ASSET_FAMILY, PRIVATE_REVIEW_FAMILY = plan["publicAssetFamily"], plan["privateReviewFamily"]
        for name in plan["sourceSha256"]:
            target = ROOT / name
            assert target.resolve().is_relative_to(ROOT.resolve()) and target.is_file(), "Source must be an existing repository file"
        CUSTOM_PLAN = plan
    else:
        assert VOICE == "amt-brunhilde-knick", "Other selected characters need a frozen request file"


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def assert_binding(take):
    assert take["voiceId"] == VOICE and take["profileId"] == PROFILE
    assert take["referenceSha256"] == REFERENCE_HASH and take["referenceOriginalSha256"] == BINDING["originalSha256"]
    assert take["renderer"] == BINDING["renderer"] and take["modelRevision"] == REVISION


def authorized_extra_take(args, job, previous, checked):
    """One named receipt-bound exception; the normal two-take cap stays unchanged."""
    path = getattr(args, "extra_take_authorization", None)
    if path is None:
        return None
    assert sha(path) == args.extra_take_authorization_sha256, "Exceptional take authority changed"
    authority = read(path)
    if authority["clipId"] != job["clipId"]:
        return None
    assert (authority["maximumAdditionalTakes"] == 1 and authority["previousActualSynthesisAttempt"] == 2
            and authority["authorizedActualSynthesisAttempt"] == 3), "This exception allows one actual third take only"
    assert (authority["text"] == job["text"] == previous["text"] and authority["profileId"] == job["profileId"]
            and previous["synthesisAttempt"] == 2 and previous["rawSha256"] == authority["previousRawSha256"]
            and checked is not None and checked["sha256"] == authority["previousEncodedSha256"]), "Exceptional source or actual attempt drifted"
    return {"receiptSha256": args.extra_take_authorization_sha256, "receiptPath": str(path), **authority}


def authorized_join_part_retake(args, job, previous, checked, private):
    """One ordinary take2 prompted by a failed parent; original part ASR stays truthful."""
    path = getattr(args, "join_retake_authorization", None)
    if path is None:
        return None
    assert sha(path) == args.join_retake_authorization_sha256, "Join-retake authority changed"
    authority = read(path)
    if authority["clipId"] != job["clipId"]:
        return None
    assert (authority["maximumAdditionalTakes"] == 1 and authority["previousActualSynthesisAttempt"] == 1
            and authority["authorizedActualSynthesisAttempt"] == 2), "Ordinary cap2 remains unchanged"
    assert (authority["text"] == job["text"] == previous["text"] and authority["profileId"] == job["profileId"]
            and previous["synthesisAttempt"] == 1 and previous["rawSha256"] == authority["previousRawSha256"]
            and checked is not None and checked["asrWordExact"] is True
            and checked["sha256"] == authority["previousEncodedSha256"]), "Successful original part or attempt drifted"
    parent_path = private.parent / "encoded" / (authority["failedParentClipId"] + ".json")
    parent = read(parent_path)
    assert (parent["asrWordExact"] is False and parent["rawSha256"] == authority["failedParentRawSha256"]
            and sha(parent_path.with_suffix(".mp3")) == parent["sha256"] == authority["failedParentEncodedSha256"]
            and sha(private.parent / "raw" / parent_path.with_suffix(".wav").name) == parent["rawSha256"])
    for field in ("joinedAudit", "joinOffsets"):
        assert sha(Path(authority[field + "Path"])) == authority[field + "Sha256"]
    for part in parent["rescueParts"]:
        assert sha(private / "raw" / (part["clipId"] + ".wav")) == part["rawSha256"]
        assert sha(private / "encoded" / (part["clipId"] + ".mp3")) == part["encodedSha256"]
    return {"receiptSha256": args.join_retake_authorization_sha256, "receiptPath": str(path), **authority}


def edited_delivery_complete(take):
    editing = take.get("deliveryEditing")
    if editing is None:
        return True
    if not isinstance(editing, dict):
        return False
    kind = editing.get("kind", "complete-prefix-extra-tail")
    if kind not in ("complete-prefix-extra-tail", "post-speech-silence-boundary"):
        return False
    quiet_tail = kind == "post-speech-silence-boundary"
    interval = editing.get("verifiedSilentIntervalSeconds")
    next_field = "nextUnclassifiedActivityStartSeconds" if quiet_tail else "nextUnwantedWordStartSeconds"
    numeric = [editing.get(key) for key in ("endSeconds", "lastScriptedWordEndSeconds", next_field, "sourceFullGenerationDurationSeconds")]
    if not (isinstance(interval, list) and len(interval) == 2
            and all(isinstance(value, (int, float)) and math.isfinite(value) for value in interval + numeric)):
        return False
    stop, last, following, duration = numeric
    exact_source = same_spoken_words(take.get("text", ""), editing.get("sourceFullAsr", ""))
    word_proof = (editing.get("sourceFullAsrWordExact") is True and exact_source and abs(following - interval[1]) < 1e-7
                  and stop >= last + .05) if quiet_tail else (
        "".join(spoken_words(editing.get("sourceFullAsr", ""))).startswith("".join(spoken_words(take.get("text", "")))) and not exact_source)
    return bool(editing.get("sourceNativeEos") is True and editing.get("sourceEosKind") in ("model-sampled", "analyzer-forced")
                and all(re.fullmatch(r"[a-f0-9]{64}", editing.get(key, "")) for key in ("sourceFullRawSha256", "sourceFullEncodedSha256", "sourceEosTraceSha256"))
                and editing.get("sourceFullText") == take.get("text") and editing.get("authorization")
                and word_proof
                and editing.get("startSample") == 0 and type(editing.get("endSampleExclusive")) is int
                and editing.get("sourceSampleRateHz") == 24000
                and abs(stop - editing["endSampleExclusive"] / 24000) < 1e-7
                and editing.get("silenceThresholdDb") == -38 and editing.get("minimumSilenceSeconds") == .2
                and interval[1] - interval[0] >= .2 and interval[0] < stop < interval[1]
                and last < stop < following and stop < duration
                and (not quiet_tail or isinstance(editing.get("preservedFullTakeArchiveRelative"), str) and bool(editing["preservedFullTakeArchiveRelative"])))


def recognition_complete(take):
    mode = take.get("asrVerificationMode", "full-file-continuous")
    if mode == "full-file-continuous":
        authority = SEGMENTED_ASR_AUTHORITIES.get(take.get("clipId"))
        # These named unchanged files were accepted only through this explicit
        # recognition context. Removing the mode cannot fabricate a whole-file pass.
        return not (authority and take.get("sha256") == authority["encodedSha256"]
                    and take.get("asrWordExact") is True)
    if mode != "full-encoded-contiguous-chunks":
        return False
    authority = SEGMENTED_ASR_AUTHORITIES.get(take.get("clipId"))
    proof = take.get("segmentedAsrProof")
    if not authority or not isinstance(proof, dict):
        return False
    if not (all(proof.get(key) == authority[key] for key in ("authoritySha256", "diagnosticSha256", "encodedSha256", "fullDecodedPcmSha256", "modelSha256", "originalEncodedReceiptSha256"))
            and take.get("sha256") == authority["encodedSha256"] and all(take.get(key) == authority[key] for key in ("voiceId", "profileId", "referenceSha256", "text"))
            and proof.get("sampleRateHz") == 16000 and proof.get("decodedPcmDtype") == "IEEE754 little-endian float32"
            and proof.get("scriptPrompt", "missing") is None and take.get("asrScriptPrompt", "missing") is None
            and proof.get("modelSha256") == take.get("asrModelSha256") and re.fullmatch(r"[a-f0-9]{64}", proof.get("modelSha256", ""))
            and isinstance(proof.get("preservedOriginalEncodedReceiptRelative"), str) and bool(proof["preservedOriginalEncodedReceiptRelative"])
            and isinstance(proof.get("continuousFullLineReadings"), list) and bool(proof["continuousFullLineReadings"])
            and isinstance(proof.get("boundaries"), list) and all(type(value) is int for value in proof["boundaries"])
            and proof["boundaries"] == authority["boundaries"] and type(proof.get("totalDecodedSamples")) is int
            and proof["totalDecodedSamples"] == authority["boundaries"][-1]):
        return False
    chunks, parts = proof.get("chunks"), take.get("rescueParts")
    if not (isinstance(chunks, list) and isinstance(parts, list) and len(chunks) == len(parts) == len(authority["chunkPcmSha256"])):
        return False
    cursor, transcripts = 0, []
    for index, (chunk, part) in enumerate(zip(chunks, parts)):
        if not (all(part.get(key) == value for key, value in authority["parts"][index].items())
                and chunk.get("sourcePartClipId") == part.get("clipId") == authority["parts"][index]["clipId"]
                and chunk.get("expectedText") == part.get("text") and chunk.get("sourcePartRawSha256") == part.get("rawSha256")
                and chunk.get("sourcePartEncodedSha256") == part.get("encodedSha256")
                and type(chunk.get("startSample")) is int and type(chunk.get("endSampleExclusive")) is int
                and chunk["startSample"] == cursor == authority["boundaries"][index]
                and cursor < chunk["endSampleExclusive"] == authority["boundaries"][index + 1]
                and chunk.get("decodedPcmSha256") == authority["chunkPcmSha256"][index]
                and chunk.get("scriptPrompt", "missing") is None and chunk.get("readings")):
            return False
        transcript = chunk["readings"][-1].get("transcript")
        if (not isinstance(transcript, str) or not same_spoken_words(part["text"], transcript)
                or any(chunk["readings"][-1].get(key) != value for key, value in authority["selectedReadings"][index].items())):
            return False
        cursor = chunk["endSampleExclusive"]
        transcripts.append(transcript)
    combined = " ".join(transcripts)
    return (cursor == proof["totalDecodedSamples"] and proof.get("combinedAsr") == combined and take.get("asr") == combined
            and same_spoken_words(take.get("text", ""), combined))


def generation_complete(take):
    # Newly authored families need actual native decoder evidence. Historical
    # approved fever reuse is verified separately in jobs(), never inferred here.
    decode = take.get("decode")
    return (isinstance(decode, dict) and decode.get("eosReached") is True and edited_delivery_complete(take) and recognition_complete(take)
            and ("rescueParts" not in take or bool(take["rescueParts"])
                 and same_spoken_words(take["text"], " ".join(part["text"] for part in take["rescueParts"]))
                 and all(part.get("eosReached") is True and part.get("asrWordExact") is True and edited_delivery_complete(part)
                         and same_spoken_words(part["text"], part["asr"])
                         and all(part.get(key) == take.get(key) for key in ("voiceId", "profileId", "referenceSha256", "renderer", "modelRevision")) for part in take["rescueParts"])))


def reference_license(profile_record):
    for role in read(ROOT / "For-AI/VOICE-CAST.json")["roleProfiles"]:
        reference = role.get("reference", {})
        if (role.get("voiceId") == VOICE and role.get("secretTunnelProfileId") == PROFILE
                and reference.get("workingReferenceSha256") == BINDING["originalSha256"]
                and reference.get("license")):
            return reference["license"]
    return (BINDING.get("referenceLicense") or profile_record.get("reference_license") or profile_record.get("license")
            or ("CC0-1.0 (EmoDB original, transformed reference)" if VOICE == "amt-brunhilde-knick"
                else "unknown; selected profile does not record reference license"))


def city_dialogue_sources():
    """Owned city slots cross-checked against the actual caller and public export."""
    source = (ROOT / "game.js").read_text(encoding="utf-8")
    selector = 'function cityNpcDialogue(n){const owned=speechCatalog.cityDialogue?.[n.id],rows=owned?.[state.region];if(owned?.voiceId!==n.voiceId||!Array.isArray(rows)||rows.length!==2||rows.some(row=>typeof row.text!=="string"||!row.text.trim()||typeof row.english!=="string"||!row.english.trim()))return null;return rows}'
    caller_alternatives = (
        (' }else if(n.id?.startsWith("city-")){\n'
         '   const rows=cityNpcDialogue(n);if(!rows)return;\n'
         '   openDialogue(n.name,rows.map(row=>row.text),"!",()=>innerMonologue("lost",.55),n.voiceId,rows.map(row=>row.english));\n'),
        (' }else if(n.id?.startsWith("city-")){\n'
         '   const rows=cityNpcDialogue(n);if(!rows)return;\n'
         '   openDialogue(n.name,rows.map(row=>row.text),"!",()=>innerMonologue("lost",.55),n.voiceId,rows.map(row=>row.english),false,false,n);\n'))
    assert selector in source and sum(caller in source for caller in caller_alternatives) == 1, "Owned city selector/caller/caption contract changed"
    start = source.index("const npcs=[")
    stop = source.index("].map(n=>", start)
    actors = re.findall(r'\{[^\n{}]*id:"(city-[a-z-]+)"[^\n{}]*fullName:"([^\"]+)"[^\n{}]*voiceId:"([^\"]+)"[^\n{}]*line:\d+[^\n{}]*\}', source[start:stop])
    cast = read(ROOT / "For-AI/VOICE-CAST.json")
    people = [person for person in cast["characters"] if person["gameCharacterId"].startswith("city-")]
    owners = {person["gameCharacterId"]: person for person in people}
    assert len(actors) == len(people) == len(owners) == 19 and len({row[0] for row in actors}) == 19 and {row[0] for row in actors} == set(owners), "City actor ownership changed"
    assert len({person["voiceId"] for person in people}) == 19, "City selected voices must be distinct"
    js = 'global.window={};require("./For-AI/AUDIO-TEXT-LIBRARY.js");console.log(JSON.stringify(window.GermanySimulatorAudioText.cityDialogue??null));'
    exported = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT, encoding="utf-8"))
    assert isinstance(exported, dict) and set(exported) == set(owners), "Missing/foreign city public export"
    authored = []
    for actor_id, name, voice_id in actors:
        owner, public = owners[actor_id], exported[actor_id]
        assert owner["voiceId"] == voice_id == "stadt-" + actor_id[5:] and owner["fullName"] == name, "City actor/selected voice identity changed"
        assert set(public) == {"voiceId", "germany", "berlin"} and public["voiceId"] == voice_id, "City public owner/voice mismatch"
        assert len(owner["dialogue"]) == 4, "City owner needs four regional slots"
        binding = cast["productionVoices"][voice_id]
        assert binding["renderer"] == "ResembleAI/Chatterbox Multilingual V2 0.1.7" and binding["modelRevision"] == "5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18"
        assert binding.get("processing") is None, "City dry delivery must not inherit an undertone"
        for region in ("germany", "berlin"):
            assert len(public[region]) == 2, "Incomplete city public slots"
            for slot in (0, 1):
                rows = [row for row in owner["dialogue"] if row["region"] == region and row["slot"] == slot]
                assert len(rows) == 1, "Missing/duplicate city cast region slot"
                row, clip = rows[0], public[region][slot]
                text, english = row["text"], row["english"]
                locator = f"For-AI/VOICE-CAST.json characters[gameCharacterId={actor_id}].dialogue[region={region},slot={slot}]"
                ordinal = (0 if region == "germany" else 2) + slot + 1
                clip_id = voice_id + f"-{ordinal:02}"
                assert isinstance(text, str) and text.strip() and isinstance(english, str) and english.strip() and row["locator"] == locator, "City owned source/English/locator changed"
                assert clip == {"id": clip_id, "text": text, "english": english}, "City public source/English/stable slot mismatch"
                authored.append({"clipId": clip_id, "voiceId": voice_id, "actorId": actor_id,
                                 "region": region, "slot": slot, "sourceLocator": locator,
                                 "text": text, "english": english, "sourceSha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
                                 "profileId": binding["profileId"], "referenceSha256": binding["referenceSha256"],
                                 "referenceOriginalSha256": binding["originalSha256"], "renderer": binding["renderer"],
                                 "modelRevision": binding["modelRevision"], "processing": None})
    assert len(authored) == 76 and len({job["clipId"] for job in authored}) == 76
    return authored


def validate_crowd_request(requested, authored, voice):
    expected = {row["clipId"]: row for row in authored}
    assert len(authored) == 36 and len(expected) == 36
    assert len(requested) == 36 and len({row["clipId"] for row in requested}) == 36
    for row in requested:
        assert row["clipId"] in expected and row == expected[row["clipId"]], "Crowd actor, text, subtitle or selected profile/reference mismatch"
    selected = [dict(row) for row in requested if row["voiceId"] == voice]
    assert len(selected) == 4, "Crowd request must contain the four owned region/slot lines"
    return selected


def validate_crowd_manifest(document, requested, voice):
    identity_fields = ("clipId", "voiceId", "actorId", "region", "slot", "sourceLocator", "text", "english",
                       "profileId", "referenceSha256", "referenceOriginalSha256", "renderer", "modelRevision", "processing")
    expected = {row["clipId"]: row for row in requested}
    clips, held = document.get("clips"), document.get("heldPrivate")
    assert len(expected) == 4 and len(requested) == 4 and all(row["voiceId"] == voice for row in requested)
    assert document.get("voiceId") == voice and document.get("profileId") == expected[next(iter(expected))]["profileId"]
    assert document.get("requestedLineCount") == 4 and isinstance(clips, list) and isinstance(held, list)
    assert document.get("lineCount") == len(clips)
    generated = document.get("generatedLineCount")
    assert type(generated) is int and len(clips) <= generated <= 4
    records = clips + held
    identities = [row.get("clipId") for row in records]
    assert len(records) == 4 and len(set(identities)) == 4 and set(identities) == set(expected)
    for row in records:
        job = expected[row["clipId"]]
        assert all(row.get(field) == job.get(field) for field in identity_fields), "Crowd accepted/held row ownership or source slot drift"
    assert all(isinstance(row.get("reason"), str) and row["reason"] for row in held)


def jobs(ambient=False, music_root=None):
    if CUSTOM_PLAN:
        REUSE_EVIDENCE.clear()
        if CUSTOM_PLAN["family"] == "city-dialogue":
            authored = {job["clipId"]: job for job in city_dialogue_sources()}
            requested = CUSTOM_PLAN["jobs"]
            assert requested and len({job["clipId"] for job in requested}) == len(requested), "City requests must be a finite unique subset"
            for job in requested:
                assert job["clipId"] in authored and job == authored[job["clipId"]], "City source, translation, actor or selected binding drift"
            selected = [dict(job) for job in requested if job["voiceId"] == VOICE]
            assert selected, "No authored city request for selected voice"
            return selected
        if CUSTOM_PLAN["family"] == "crowd-dialogue":
            js = r'''const fs=require("node:fs"),vm=require("node:vm");
const source=fs.readFileSync("game.js","utf8"),match=source.match(/const crowdCharacterBarks=(Object\.freeze\([\s\S]*?\));\nconst crowdArchetypeById/);
if(!match)throw Error("Crowd actor-owned source map missing");
const barks=vm.runInNewContext(match[1]);global.window={};require("./For-AI/AUDIO-TEXT-LIBRARY.js");
console.log(JSON.stringify({barks,english:window.GermanySimulatorAudioText.pools.crowdPersonalized}));'''
            authority = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT, encoding="utf-8"))
            cast = read(ROOT / "For-AI/VOICE-CAST.json")
            actors = {row.get("gameRole"): row for row in cast["roleProfiles"] if row.get("gameRole") in authority["barks"]}
            authored = []
            for actor_id, regions in authority["barks"].items():
                owner = actors.get(actor_id)
                assert owner and owner["voiceId"] == actor_id and any("actor-owned crowdCharacterBarks[" + actor_id + "]" in item for item in owner["dialogueSources"]), "Crowd source has no actor-owned cast row"
                binding = cast["productionVoices"][actor_id]
                for region in ("berlin", "germany"):
                    assert len(regions[region]) == 2 and len(authority["english"][actor_id][region]) == 2
                    for slot, text in enumerate(regions[region]):
                        locator = f"game.js crowdCharacterBarks[{actor_id}].{region}[{slot}]"
                        clip_id = f"{actor_id}-{region}-{slot + 1:02}"
                        authored.append({"clipId": clip_id, "voiceId": actor_id, "actorId": actor_id,
                                         "region": region, "slot": slot, "sourceLocator": locator,
                                         "text": text, "english": authority["english"][actor_id][region][slot],
                                         "profileId": binding["profileId"], "referenceSha256": binding["referenceSha256"],
                                         "referenceOriginalSha256": binding["originalSha256"], "renderer": binding["renderer"],
                                         "modelRevision": binding["modelRevision"], "processing": binding.get("processing")})
            assert len(authored) == 36 and len({row["clipId"] for row in authored}) == 36
            return validate_crowd_request(CUSTOM_PLAN["jobs"], authored, VOICE)
        if CUSTOM_PLAN["family"] in ("office-monologue", "office-mirror"):
            js = 'global.window={};require("./buergeramt-story.js");console.log(JSON.stringify(window.BuergeramtStory));'
            story = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT, encoding="utf-8"))
            selected = [dict(job) for job in CUSTOM_PLAN["jobs"] if job["voiceId"] == VOICE]
            assert len(selected) == 1, "The player monologue must be generated in one complete take"
            job = selected[0]
            assert job["voiceId"] == story["playerIdentity"]["voiceId"] and job["profileId"] == PROFILE and job["actorId"] == "player"
            if CUSTOM_PLAN["family"] == "office-mirror":
                assert job["clipId"] == "player-potato-mirror"
                assert job["text"] == story["potatoMirror"]["line"] and job["english"] == story["potatoMirror"]["english"]
                assert job["sourceLocator"] == "buergeramt-story.js potatoMirror.line"
            else:
                assert job["clipId"] == "player-president-portrait-1"
                assert job["text"] == " ".join(row["line"] for row in story["presidentPortrait"]["lines"])
                assert job["english"] == " ".join(row["english"] for row in story["presidentPortrait"]["lines"])
                assert job["sourceLocator"] == "buergeramt-story.js presidentPortrait.lines joined in authored order"
            return selected
        if CUSTOM_PLAN["family"] == "office-ambient":
            js = 'global.window={};require("./buergeramt-story.js");console.log(JSON.stringify(window.BuergeramtStory));'
            story = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT, encoding="utf-8"))
            people = {**story["characters"], **dict(zip(("renter", "parent", "pensioner"), story["patrons"].values())),
                      **{"clerk-" + desk: person for desk, person in story["clerks"].items()}}
            authored = [row for row in story["ambient"] if people[row["actor"]]["voiceId"] == VOICE]
            selected = [dict(job) for job in CUSTOM_PLAN["jobs"] if job["voiceId"] == VOICE]
            assert len(selected) == len(authored) and len({job["clipId"] for job in selected}) == len(selected)
            for job, row in zip(selected, authored):
                assert job["clipId"] == row["id"] and job["actorId"] == row["actor"]
                assert re.fullmatch(r"[a-z0-9-]+", job["clipId"])
                assert job["text"] == row["text"] and job["english"] == row["english"]
                assert job["profileId"] == PROFILE and job["voiceId"] == people[row["actor"]]["voiceId"]
                assert job["sourceLocator"] == "buergeramt-story.js ambient." + row["id"]
            return selected
        if CUSTOM_PLAN["family"] == "office-replies":
            js = 'global.window={};require("./buergeramt-story.js");console.log(JSON.stringify(window.BuergeramtStory));'
            story = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT, encoding="utf-8"))
            authored = [(f"player-registration-{key.lower()}-{index + 1}", choice["label"], f"buergeramt-story.js registration.nodes.{key}.choices[{index}].label")
                        for key, node in story["registration"]["nodes"].items() for index, choice in enumerate(node["choices"])]
            runtime = (ROOT / "buergeramt.js").read_text(encoding="utf-8")
            for key, text in (("phone-silent", "Telefon auf lautlos schalten."), ("phone-ignore", "Nicht rangehen. Telefon weglegen."), ("complete", "Meldebestätigung und A38 mitnehmen.")):
                assert "label:" + json.dumps(text, ensure_ascii=False) in runtime, "Authored player runtime choice changed"
                authored.append(("player-" + key, text, "buergeramt.js choice.label " + key))
            selected = [dict(job) for job in CUSTOM_PLAN["jobs"] if job["voiceId"] == VOICE]
            assert len(selected) == len(authored) and len({job["clipId"] for job in selected}) == len(selected)
            for job, (clip_id, text, locator) in zip(selected, authored):
                assert job["voiceId"] == VOICE and job["profileId"] == PROFILE and job["actorId"] == "player"
                assert job["clipId"] == clip_id and job["text"] == text and job["sourceLocator"] == locator, "Exact authored player choice changed"
                assert job["english"].strip()
            return selected
        js = 'global.window={};require("./For-AI/AUDIO-TEXT-LIBRARY.js");require("./street-wisdom.js");console.log(JSON.stringify({rules:window.GermanySimulatorAudioText.rules,english:window.GermanySimulatorAudioText.ruleEnglish,definitions:window.StreetWisdom.definitions}));'
        catalog = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT, encoding="utf-8"))
        selected = [dict(job) for job in CUSTOM_PLAN["jobs"] if job["voiceId"] == VOICE]
        assert selected and len({job["clipId"] for job in selected}) == len(selected)
        definition = next(row for row in catalog["definitions"] if row["voiceId"] == VOICE)
        assert {job["ruleIndex"] for job in selected} == set(definition["ruleIndices"]), "Exact actor rule deck changed"
        for job in selected:
            assert re.fullmatch(r"[a-z0-9-]+", job["clipId"]), "Clip identifiers must be safe asset filenames"
            assert job["profileId"] == PROFILE and job["voiceId"] == VOICE
            index = job["ruleIndex"]
            assert isinstance(index, int) and 0 <= index < 11
            assert job["actorId"] == definition["id"] and job["clipId"] == definition["id"] + f"-rule-{index + 1:02}", "Actor/voice/clip ownership differs from actual deck"
            assert job["text"] == catalog["rules"][index][1] and job["english"] == catalog["english"][index], "Actual authored rule changed"
            assert job["sourceLocator"] == f"For-AI/AUDIO-TEXT-LIBRARY.js rules[{index}][1]"
        return selected
    js = 'global.window={}; require("./buergeramt-story.js"); console.log(JSON.stringify(window.BuergeramtStory));'
    story = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT, encoding="utf-8"))
    assert story["clerkIdentity"]["voiceId"] == VOICE and "KNICK" in story["registration"]["speaker"]
    music_root = music_root or Path(os.environ["USERPROFILE"]) / "Music/German emotional voice databases"
    native = music_root / "Secret Tunnel shared voice data/profiles" / PROFILE
    native_record = read(native / "profile.json")
    assert sha(native / "original.wav") == native_record["original_sha256"] == BINDING["originalSha256"]
    assert sha(native / "reference.wav") == native_record["reference_sha256"] == REFERENCE_HASH
    available = {}
    REUSE_EVIDENCE.clear()
    for clip in read(ROOT / "assets/voices/amt-fever/manifest.json")["clips"]:
        approved = clip.get("approval", {}).get("status") == "user-approved"
        matches = (clip["voiceId"] == VOICE and clip["profileId"] == PROFILE and not clip.get("retiredReason")
                   and clip.get("renderer") == BINDING["renderer"] and clip.get("modelRevision") == REVISION
                   and clip.get("referenceSha256") == REFERENCE_HASH and clip.get("processing") == PROCESSING
                   and clip.get("referenceOriginalSha256", BINDING["originalSha256"]) == BINDING["originalSha256"])
        if matches and approved and clip.get("asrWordExact") is True and abs(clip["integratedLufs"] + 18) <= .3 and clip["truePeakDbtp"] <= -1.5:
            assert sha(ROOT / clip["path"]) == clip["sha256"], "Approved fever audio changed"
            available[clip["text"]] = clip
    result = []

    def add(key, text, source):
        if text in available:
            clip = available[text]
            if not any(row["sourceClipId"] == clip["clipId"] for row in REUSE_EVIDENCE):
                REUSE_EVIDENCE.append({"legacyApprovedReuse": True, "sourceManifest": "assets/voices/amt-fever/manifest.json",
                    "sourceClipId": clip["clipId"], "sourceSha256": clip["sha256"], "text": text, "voiceId": VOICE,
                    "profileId": PROFILE, "referenceSha256": REFERENCE_HASH, "renderer": BINDING["renderer"],
                    "modelRevision": REVISION, "processing": PROCESSING, "approval": clip["approval"],
                    "currentNativeProfileEvidence": {"originalSha256": BINDING["originalSha256"], "referenceSha256": REFERENCE_HASH,
                        "profileJsonSha256": sha(native / "profile.json"), "historicalClipOriginalHashRecorded": "referenceOriginalSha256" in clip,
                        "basis": "Current native original/reference files and profile.json verified against selected binding; historical normalized-reference receipt remains distinct"}})
        if text not in available and not any(job["text"] == text for job in result):
            result.append({"clipId": "knick-" + key, "actorId": "clerk", "voiceId": VOICE,
                           "profileId": PROFILE, "text": text, "sourceLocator": source})

    runtime = (ROOT / "buergeramt.js").read_text(encoding="utf-8")
    if ambient:
        lines = json.loads(re.search(r"const ambientLines=(\[\[.*?\]\]);", runtime)[1])
        for index, actor in ((1, "clerk-1"), (2, "clerk-2"), (4, "clerk-4")):
            add("ambient-" + actor, lines[index][1], f"buergeramt.js ambientLines[{index}]")
        assert len(result) == 3
        return result

    for i, text in enumerate(story["outburst"]["lines"]):
        add(f"outburst-{i + 1}", text, f"buergeramt-story.js outburst.lines[{i}]")
    # Factored runtime refusal keeps its exact approved same-profile fever reuse.
    add("refusal", story["clerkRefusal"], "buergeramt-story.js clerkRefusal")
    for i, node in enumerate(story["clerk"]):
        add(f"counter-{i + 1}", node["line"], f"buergeramt-story.js clerk[{i}].line")
        for c, choice in enumerate(node["choices"]):
            add(f"counter-{i + 1}-reply-{c + 1}", choice["reply"], f"buergeramt-story.js clerk[{i}].choices[{c}].reply")
    for i, text in enumerate(story["phoneWarnings"]):
        add(f"phone-warning-{i + 1}", text, f"buergeramt-story.js phoneWarnings[{i}]")
    # Extract only static text actually assigned to Knick. Dynamic names/tickets
    # retain the production fallback; no generic number or name is substituted.
    pattern = r'content\((?:story\.(?:clerkIdentity|registration)\.speaker|"FRAU KNICK · SCHALTER "\+(?:assignedCounter|desk)),\s*("(?:[^"\\]|\\.)*")\s*,'
    # Keep existing IDs by exact text as runtime branches move or disappear.
    previous = read(ROOT / "assets/voices/knick/manifest.json")
    previous_status = {row["text"]: row["clipId"][6:] for row in previous["clips"] + previous["heldPrivate"] if row["clipId"].startswith("knick-status-")}
    for i, match in enumerate(re.finditer(pattern, runtime)):
        text = json.loads(match[1])
        key = previous_status.get(text, "status-" + hashlib.sha256(text.encode("utf-8")).hexdigest()[:12])
        add(key, text, f"buergeramt.js:{runtime[:match.start()].count(chr(10)) + 1}")
    for key, node in story["registration"]["nodes"].items():
        add(f"registration-{key.lower()}", node["line"], f"buergeramt-story.js registration.nodes.{key}.line")
        for i, choice in enumerate(node["choices"]):
            add(f"registration-{key.lower()}-reply-{i + 1}", choice["reply"], f"buergeramt-story.js registration.nodes.{key}.choices[{i}].reply")
    return result


def spoken_words(text):
    units = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"]
    small = units + ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"]
    tens = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"]
    numbers = {str(n): small[n] if n < 20 else (("ein" if n % 10 == 1 else units[n % 10]) + "und" if n % 10 else "") + tens[n // 10] for n in range(100)}
    ordinals = ["", "ersten", "zweiten", "dritten", "vierten", "fünften", "sechsten", "siebten", "achten"]
    text = text.casefold().replace("§", " paragraph ")
    text = re.sub(r"\bam\s+([1-9]|[12]\d|3[01])\.(?=\s|$)",
                  lambda match: "am " + (ordinals[int(match[1])] if int(match[1]) < len(ordinals)
                                           else numbers[match[1]] + ("ten" if int(match[1]) < 20 else "sten")), text)
    text = re.sub(r"\b([01]?\d|2[0-3]):00(?=\s*uhr\b)", r"\1", text)
    text = re.sub(r"\bparagraf\b", "paragraph", text)
    text = re.sub(r"\ba\s*38\b", "a achtunddreißig", text)
    return [numbers.get(word, word).casefold() for word in re.findall(r"\w+", text)]


def same_spoken_words(expected, heard):
    # German ASR may split or join compounds; actual changed letters still fail.
    return "".join(spoken_words(expected)) == "".join(spoken_words(heard))


def reconcile_request(private, frozen, queue, source_hashes):
    identity = lambda rows: [{key: value for key, value in job.items() if key != "sourceLocator"} for job in rows]
    assert identity(frozen["jobs"]) == identity(queue), "Authored dialogue or ownership changed; a fresh request is required"
    original_hash = sha(private / "requests.json")
    history = private / ("requests-before-source-reconcile-" + original_hash[:12] + ".json")
    assert not history.exists() or sha(history) == original_hash
    shutil.copyfile(private / "requests.json", history)
    replacement = {"requestedLineCount": len(queue), "sourceSha256": source_hashes, "jobs": queue, "approvedExistingReuse": REUSE_EVIDENCE,
          "reconciliation": {"previousRequestSha256": original_hash, "basis": "entire authored clip/text/profile/voice/actor set unchanged; source locators may move"}}
    for field in ("authoredPlanSha256", "authoredPlanSourceSha256"):
        if field in frozen:
            replacement[field] = frozen[field]
    write(private / "requests.json", replacement)
    print(f"Reconciled {len(queue)} unchanged authored jobs; preserved {history.name}", flush=True)


def follow_unchanged_source(args, queue, private):
    if not args.follow_source:
        return
    frozen = read(private / "requests.json")
    hashes = source_hashes()
    if frozen["sourceSha256"] != hashes:
        current = jobs(args.ambient, args.music_root)
        reconcile_request(private, frozen, current, hashes)
        locators = {job["clipId"]: job["sourceLocator"] for job in current}
        for job in queue:
            job["sourceLocator"] = locators[job["clipId"]]
    selected = read(ROOT / "For-AI/VOICE-CAST.json")["productionVoices"][VOICE]
    for field in ("profileId", "originalSha256", "referenceSha256", "renderer", "modelRevision", "processing"):
        assert selected.get(field) == BINDING.get(field), f"Selected voice {field} changed; stop synthesis"


def render(args, queue, private):
    global RENDER_CACHE
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    import torch
    import torchaudio
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    from chatterbox.models.t3.inference.alignment_stream_analyzer import AlignmentStreamAnalyzer, LLAMA_ALIGNED_HEADS
    from chatterbox.models.t3.inference import alignment_stream_analyzer as analyzer_source
    assert importlib.metadata.version("chatterbox-tts") == "0.1.7"
    assert args.device != "cuda" or torch.cuda.is_available(), "Existing CUDA authoring runtime is unavailable"
    assert args.device != "cpu" or args.precision == "fp32", "CPU synthesis benchmark uses the pinned renderer in FP32"
    torch.set_num_threads(getattr(args, "cpu_threads", 2))
    assert args.model_dir.name == REVISION, "Use the fixed cached revision"
    profile = args.music_root / "Secret Tunnel shared voice data/profiles" / PROFILE
    reference = profile / "reference.wav"
    profile_record = read(profile / "profile.json")
    assert sha(reference) == REFERENCE_HASH == profile_record["reference_sha256"]
    assert sha(profile / "original.wav") == profile_record["original_sha256"] == BINDING["originalSha256"]
    cache_key = (str(args.model_dir.resolve()), args.precision, args.device)
    model_reused = RENDER_CACHE is not None
    if RENDER_CACHE is None:
        model = ChatterboxMultilingualTTS.from_local(args.model_dir, args.device)
        RENDER_CACHE = {"key": cache_key, "model": model, "nativeInference": model.t3.inference}
    else:
        assert RENDER_CACHE["key"] == cache_key, "Cached engine/revision/precision changed"
        model = RENDER_CACHE["model"]
        # Restore the native method before installing this profile's wrapper;
        # never nest wrappers with an earlier profile's decode budget/state.
        model.t3.inference = RENDER_CACHE["nativeInference"]
    exaggeration = .65 if CUSTOM_PLAN and CUSTOM_PLAN["family"] == "office-mirror" else .5
    with torch.inference_mode():
        model.prepare_conditionals(str(reference), exaggeration=exaggeration)
    assert model.conds.t3.speaker_emb.dtype == torch.float32 and model.conds.t3.emotion_adv.dtype == torch.float32, "Reference conditioning must remain float32"
    if args.precision == "fp16":
        model.t3.half()
        torch.cuda.empty_cache()
    actual_t3_parameter = next(model.t3.parameters())
    assert actual_t3_parameter.device.type == args.device, "Renderer device does not match the receipt"
    assert actual_t3_parameter.dtype == (torch.float16 if args.precision == "fp16" else torch.float32), "Renderer weight precision changed"
    # The pinned T3 API exposes max_new_tokens, although generate() hardcodes
    # 1000. Bound runaway short-line decodes, preserving every other argument.
    # Budget exhaustion is a rejected take, never evidence of a complete line.
    original_inference = model.t3.inference
    decode = {}
    eos_trace = []
    observe_eos = getattr(args, "observe_eos", False) or getattr(args, "eos_after_alignment", False)
    restore_after_alignment = getattr(args, "eos_after_alignment", False)
    native_analyzer_step = AlignmentStreamAnalyzer.step

    def observed_analyzer_step(analyzer, logits, next_token=None):
        # No installed package edit. Retain all native checks; a bounded
        # experiment may undo only renewed EOS suppression after completion.
        original_eos = logits[..., analyzer.eos_idx].clone()
        before = float(original_eos.flatten()[0].item())
        completed_before = bool(analyzer.complete)
        output = native_analyzer_step(analyzer, logits, next_token)
        after = float(output[..., analyzer.eos_idx].flatten()[0].item())
        suppressed, forced = after == -(2 ** 15), after == 2 ** 15
        restored = restore_after_alignment and completed_before and suppressed
        if restored:
            output[..., analyzer.eos_idx] = original_eos
        eos_trace.append({"step": len(eos_trace) + 1, "completeBefore": completed_before, "completeAfter": bool(analyzer.complete),
                          "textPosition": int(analyzer.text_position), "textTokenCount": analyzer.alignment.shape[1],
                          "modelEosLogit": before, "nativeEosLogit": after,
                          "nativeEosSuppressed": suppressed, "analyzerForcedEos": forced, "modelEosRestored": restored})
        return output
    attention_modules = [model.t3.tfmr.layers[layer].self_attn for layer, _ in LLAMA_ALIGNED_HEADS]
    cleanup_enabled = True

    def release_new_hooks(baselines):
        removed = 0
        for module, baseline in zip(attention_modules, baselines):
            for key in set(module._forward_hooks) - baseline:
                del module._forward_hooks[key]
                getattr(module, "_forward_hooks_with_kwargs", {}).pop(key, None)
                getattr(module, "_forward_hooks_always_called", {}).pop(key, None)
                removed += 1
        return removed

    def bounded_inference(*arguments, **keywords):
        keywords["max_new_tokens"] = decode["maxSpeechTokens"]
        baselines = [set(module._forward_hooks) for module in attention_modules]
        decode["attentionHooksBefore"] = sum(map(len, baselines))
        inference_start = time.monotonic()
        eos_trace.clear()
        if observe_eos:
            AlignmentStreamAnalyzer.step = observed_analyzer_step
        try:
            tokens = original_inference(*arguments, **keywords)
            decode["generatedSpeechTokens"] = tokens.shape[-1]
            decode["eosReached"] = int(tokens[0, -1].item()) == model.t3.hp.stop_speech_token
            if observe_eos:
                forced = bool(eos_trace and eos_trace[-1]["analyzerForcedEos"])
                decode.update({"eosKind": "analyzer-forced" if forced else "model-sampled" if decode["eosReached"] else "budget-exhausted",
                               "eosSuppressionObservedSteps": sum(row["nativeEosSuppressed"] for row in eos_trace),
                               "modelEosRestoredSteps": sum(row["modelEosRestored"] for row in eos_trace),
                               "alignmentFirstCompletedStep": next((row["step"] for row in eos_trace if row["completeAfter"]), None),
                               "nativeAnalyzerSourceSha256": sha(Path(analyzer_source.__file__)),
                               "eosPolicy": "Restore original model EOS logit only if monotonic completion was already true and native analyzer would suppress EOS; all native forced-EOS and other integrity checks retained" if restore_after_alignment else "Native analyzer unchanged; observation only"})
            return tokens
        finally:
            if observe_eos:
                AlignmentStreamAnalyzer.step = native_analyzer_step
            decode["t3InferenceSeconds"] = round(time.monotonic() - inference_start, 2)
            decode["temporaryAnalyzerHooksRemoved"] = release_new_hooks(baselines) if cleanup_enabled else 0
            decode["attentionHooksAfter"] = sum(len(module._forward_hooks) for module in attention_modules)

    model.t3.inference = bounded_inference
    print("Cached fixed Chatterbox model ready", flush=True)
    if args.benchmark_hooks:
        import numpy as np
        import random
        job = next(row for row in queue if row["clipId"] == "knick-registration-identity-reply-1")
        baselines = [set(module._forward_hooks) for module in attention_modules]
        comparisons = []
        for enabled in (False, True):
            cleanup_enabled = enabled
            torch.manual_seed(71019)
            np.random.seed(71019)
            random.seed(71019)
            decode.clear()
            decode["maxSpeechTokens"] = min(1000, max(250, 160 + 12 * len(re.findall(r"\w+", job["text"]))))
            start = time.monotonic()
            with torch.inference_mode(), torch.autocast(args.device, dtype=torch.float16, enabled=args.precision == "fp16"):
                audio = model.generate(job["text"], language_id="de", exaggeration=.5, temperature=.65, repetition_penalty=3., cfg_weight=.6)
            digest = hashlib.sha256(audio.numpy().tobytes()).hexdigest()
            row = {"cleanup": enabled, "rawArraySha256": digest, "seconds": round(time.monotonic() - start, 2), **decode}
            row["betweenCallsHooksRemoved"] = release_new_hooks(baselines)
            comparisons.append(row)
            print(json.dumps({"stage": "hook benchmark", **row}), flush=True)
            del audio
            gc.collect()
            if args.device == "cuda":
                torch.cuda.empty_cache()
        cleanup_enabled = True
        write(private / "hook-cleanup-benchmark.json", {"clipId": job["clipId"], "text": job["text"],
              "profileId": PROFILE, "referenceSha256": REFERENCE_HASH, "modelRevision": REVISION,
              "renderer": BINDING["renderer"], "processing": PROCESSING, "seed": 71019,
              "numpyAndPythonSeeds": 71019, "precision": args.precision, "languageId": "de",
              "exaggeration": .5, "temperature": .65, "repetitionPenalty": 3., "cfgWeight": .6,
              "savedAudioTakes": 0, "rawArrayBitIdentical": comparisons[0]["rawArraySha256"] == comparisons[1]["rawArraySha256"], "readings": comparisons})
        assert comparisons[0]["rawArraySha256"] == comparisons[1]["rawArraySha256"], "Inspect any deterministic cleanup discrepancy before production"
    attempts_path = private / "retake-attempts.json"
    retakes = read(attempts_path).get("attempts", []) if attempts_path.exists() else []
    for index, job in enumerate(queue):
        follow_unchanged_source(args, queue, private)
        receipt = private / "raw" / (job["clipId"] + ".json")
        wav = receipt.with_suffix(".wav")
        attempt = 1
        extra_authority = None
        join_authority = None
        if not receipt.exists() and any(row["clipId"] == job["clipId"] for row in retakes):
            print(json.dumps({"stage": "retake capped after failed final attempt", "clipId": job["clipId"]}), flush=True)
            continue
        if receipt.exists():
            previous = read(receipt)
            assert previous["text"] == job["text"]
            assert_binding(previous)
            assert sha(wav) == previous["rawSha256"]
            if not args.retake_failed:
                continue
            encoded_receipt = private / "encoded" / receipt.name
            checked = read(encoded_receipt) if encoded_receipt.exists() else None
            if checked is None and previous.get("decode", {}).get("eosReached") is True:
                # Known missing/failed EOS is already a technical rejection;
                # other first takes need the independent ASR/level audit first.
                continue
            join_authority = authorized_join_part_retake(args, job, previous, checked, private)
            if join_authority:
                assert sha(encoded_receipt.with_suffix('.mp3')) == join_authority['previousEncodedSha256']
            if not join_authority and checked and same_spoken_words(job["text"], checked["asr"]) and abs(checked["integratedLufs"] + 18) <= .3 and checked["truePeakDbtp"] <= -1.5 and checked.get("decode", {}).get("eosReached") is True:
                continue
            attempt = previous.get("synthesisAttempt", 1)
            extra_authority = authorized_extra_take(args, job, previous, checked)
            if extra_authority:
                assert sha(encoded_receipt.with_suffix('.mp3')) == extra_authority['previousEncodedSha256']
            capped = attempt >= 2 or any(row["clipId"] == job["clipId"] for row in retakes)
            if capped and not (extra_authority and attempt == 2 and not any(row["clipId"] == job["clipId"] and row["attempt"] >= 3 for row in retakes)):
                print(json.dumps({"stage": "retake capped", "clipId": job["clipId"], "attempts": attempt}), flush=True)
                continue
            archive = private / "rejected" / job["clipId"] / ("attempt-" + str(attempt))
            native_archive_path(archive).mkdir(parents=True, exist_ok=True)
            trace = receipt.with_name(job["clipId"] + "-eos-trace.json")
            trace_hash = previous.get("decode", {}).get("eosTraceSha256")
            if trace_hash:
                assert trace.exists() and sha(trace) == trace_hash, "Preserve the failed take's immutable EOS trace"
            raw_paths = (receipt, wav, trace) if trace.exists() else (receipt, wav)
            for folder, paths in (("raw", raw_paths), ("encoded", (encoded_receipt, encoded_receipt.with_suffix(".mp3"), encoded_receipt.with_name(job["clipId"] + "-processed.wav")))):
                for path in paths:
                    if folder == "encoded" and not path.exists():
                        continue
                    assert path.resolve().is_relative_to(private.resolve()) and path.is_file()
                    destination = archive / (folder + "-" + path.name)
                    archive_move(path, destination)
            attempt += 1
            retakes.append({"clipId": job["clipId"], "attempt": attempt, "previousRawSha256": previous["rawSha256"],
                            "reason": "One explicitly authorized actual third take; default cap unchanged" if extra_authority else "Ordinary actual take2 after full parent join failed; first part's successful ASR remains truthful" if join_authority else "One final exact-text take after explicit EOS or independent ASR/level gate failure; previous artifacts archived intact",
                            **({"exceptionAuthority": extra_authority} if extra_authority else {}),
                            **({"joinRetakeAuthority": join_authority} if join_authority else {})})
            write(attempts_path, {"attempts": retakes})
        elif args.retake_failed:
            # A crashed final attempt remains a fallback, without an implicit retry.
            continue
        renderer_input = re.sub(r"\bA38\b", "A achtunddreißig", job["text"]).replace("§", "Paragraph ")
        assert same_spoken_words(job["text"], renderer_input), "Renderer phonetics must preserve every authored spoken word"
        decode.clear()
        decode["maxSpeechTokens"] = min(1000, max(250, 160 + 12 * len(re.findall(r"\w+", renderer_input))))
        seed = 71000 + index + (attempt - 1) * 100000
        torch.manual_seed(seed)
        start = time.monotonic()
        print(json.dumps({"stage": "render", "n": index + 1, "total": len(queue), "clipId": job["clipId"]}), flush=True)
        with torch.inference_mode(), torch.autocast(args.device, dtype=torch.float16, enabled=args.precision == "fp16"):
            audio = model.generate(renderer_input, language_id="de", exaggeration=exaggeration, temperature=.65, repetition_penalty=3., cfg_weight=.6)
        assert torch.isfinite(audio).all(), "Non-finite synthesis output remains private"
        wav.parent.mkdir(parents=True, exist_ok=True)
        torchaudio.save(str(wav), audio.cpu(), model.sr)
        if observe_eos:
            trace_path = receipt.with_name(job["clipId"] + "-eos-trace.json")
            write(trace_path, {"clipId": job["clipId"], "text": job["text"], "profileId": PROFILE,
                               "referenceSha256": REFERENCE_HASH, "modelRevision": REVISION, "steps": eos_trace})
            decode["eosTraceSha256"] = sha(trace_path)
        write(receipt, {**job, "seed": seed, "synthesisAttempt": attempt, "referenceSha256": REFERENCE_HASH,
                        "authoringHelperSha256": AUTHORING_HELPER_SHA256,
                        **({"exceptionAuthority": extra_authority} if extra_authority else {}),
                        **({"joinRetakeAuthority": join_authority} if join_authority else {}),
                        "rendererInputText": renderer_input, "decode": dict(decode),
                        "rendererInputBasis": "German letter-number spoken equivalent" if renderer_input != job["text"] else "exact authored source",
                        "requestSha256": sha(private / "requests.json"),
                        "referenceOriginalSha256": profile_record["original_sha256"],
                        "profileJsonSha256": sha(profile / "profile.json"), "rawSha256": sha(wav),
                        "renderer": "ResembleAI/Chatterbox Multilingual V2 0.1.7", "modelRevision": REVISION,
                        "modelLicense": "MIT", "referenceLicense": reference_license(profile_record),
                        "durationSeconds": audio.shape[-1] / model.sr, "renderSeconds": round(time.monotonic() - start, 2),
                         "synthesis": {"exaggeration": exaggeration, "exaggerationReason": "User-requested surprised mirror reaction" if exaggeration != .5 else None,
                                       "temperature": .65, "repetitionPenalty": 3., "cfgWeight": .6, "languageId": "de", "device": args.device, "precision": args.precision,
                                      "t3WeightPrecision": str(actual_t3_parameter.dtype).removeprefix("torch."), "conditioningPrecision": "float32",
                                      "autocastPrecision": "float16" if args.precision == "fp16" else None, "conditioningCached": True,
                                      "referenceReconditionedForProfile": PROFILE, "referenceConditioningVerifiedFloat32": True,
                                      "modelSessionReused": model_reused, "cpuThreads": torch.get_num_threads(), "inferenceMode": True},
                        "listening": "pending", "status": "private candidate"})
        print(json.dumps({"stage": "saved", "n": index + 1, "total": len(queue), "seconds": round(time.monotonic() - start, 2)}), flush=True)
        del audio
        gc.collect()
        if args.device == "cuda":
            torch.cuda.empty_cache()


def process(args, queue, private, all_jobs=None, publish_manifest=True):
    global ASR_CACHE
    import numpy as np
    from faster_whisper import WhisperModel
    cache_key = (str(args.asr_model.resolve()), args.asr_device, "int8", args.asr_threads)
    if ASR_CACHE is None:
        model = WhisperModel(str(args.asr_model), device=args.asr_device, compute_type="int8", cpu_threads=args.asr_threads)
        assert model.model.device == args.asr_device, "Independent ASR device changed"
        ASR_CACHE = {"key": cache_key, "model": model, "sha256": sha(args.asr_model / "model.bin"),
                     "device": model.model.device, "effectiveComputeType": model.model.compute_type}
    else:
        assert ASR_CACHE["key"] == cache_key, "Independent ASR model/settings changed"
        model = ASR_CACHE["model"]
    asr_model_hash = ASR_CACHE["sha256"]

    def ff(*arguments):
        return subprocess.run([str(args.ffmpeg), "-hide_banner", "-nostats", *map(str, arguments)], capture_output=True, check=True)

    def measure(path):
        result = ff("-i", path, "-af", "loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json", "-f", "null", "NUL")
        return json.loads(re.search(r'\{\s*"input_i".*?\}', result.stderr.decode("utf-8"), re.S)[0])

    for index, job in enumerate(queue):
        follow_unchanged_source(args, queue, private)
        receipt = private / "encoded" / (job["clipId"] + ".json")
        if receipt.exists():
            assert read(receipt)["text"] == job["text"]
            continue
        raw = private / "raw" / (job["clipId"] + ".wav")
        if args.follow:
            deadline = time.monotonic() + 1200
            while not raw.with_suffix(".json").exists() and time.monotonic() < deadline:
                time.sleep(1)
            if not raw.with_suffix(".json").exists():
                break
        if not raw.with_suffix(".json").exists():
            continue
        take = read(raw.with_suffix(".json"))
        assert take["text"] == job["text"] and sha(raw) == take["rawSha256"]
        assert_binding(take)
        if not generation_complete(take):
            print(json.dumps({"stage": "held before ASR", "n": index + 1, "total": len(queue), "clipId": job["clipId"],
                              "reason": "missing or failed explicit native EOS evidence; selected production fallback"}), flush=True)
            continue
        receipt.parent.mkdir(parents=True, exist_ok=True)
        prepared, mp3 = receipt.with_name(job["clipId"] + "-processed.wav"), receipt.with_suffix(".mp3")
        if PROCESSING is None:
            ff("-y", "-i", raw, "-ar", 48000, prepared)
        else:
            ff("-y", "-i", raw, "-filter_complex", PROCESSING, "-map", "[a]", "-ar", 48000, prepared)
        target = -18.
        for iteration in range(7):
            filt = f"loudnorm=I={target}:TP=-1.8:LRA=11:linear=false"
            ff("-y", "-i", prepared, "-af", filt, "-ar", 48000, "-ac", 1, "-codec:a", "libmp3lame", "-b:a", "128k", mp3)
            checked = measure(mp3)
            delta = -18 - float(checked["input_i"])
            if abs(delta) <= .3 and float(checked["input_tp"]) <= -1.5:
                break
            target += delta
            # Peak-limited short takes can stay quiet while the correction
            # target rises. Enter the existing limiter/gain fallback before
            # FFmpeg's loudnorm target range (-70..-5) would be exceeded.
            if not -70 <= target <= -5:
                break
        if abs(delta) > .3 or float(checked["input_tp"]) > -1.5:
            original = measure(prepared)
            gain = 10 ** ((-18 - float(original["input_i"])) / 20)
            for iteration in range(12):
                filt = f"volume={gain},alimiter=limit=0.78:attack=1:release=80:level=false:latency=true"
                ff("-y", "-i", prepared, "-af", filt, "-ar", 48000, "-ac", 1, "-codec:a", "libmp3lame", "-b:a", "128k", mp3)
                checked = measure(mp3)
                delta = -18 - float(checked["input_i"])
                if abs(delta) <= .2 and float(checked["input_tp"]) <= -1.5:
                    break
                gain *= 10 ** (delta / 20)
        technical = abs(delta) <= .3 and float(checked["input_tp"]) <= -1.5 and take.get("decode", {}).get("eosReached") is True
        pcm = ff("-loglevel", "error", "-i", mp3, "-f", "f32le", "-ac", 1, "-ar", 16000, "pipe:1").stdout
        readings = []
        for beam in (1, 5):
            asr_started = time.monotonic()
            segments, _ = model.transcribe(np.frombuffer(pcm, dtype=np.float32).copy(), language="de", beam_size=beam, word_timestamps=True)
            segments = list(segments)
            transcript = " ".join(segment.text.strip() for segment in segments)
            readings.append({"beamSize": beam, "transcript": transcript, "transcribeSeconds": round(time.monotonic() - asr_started, 2),
                             "words": [{"word": word.word, "start": round(word.start, 3), "end": round(word.end, 3)}
                                       for segment in segments for word in segment.words]})
            if same_spoken_words(job["text"], transcript):
                break
        encoded = json.loads(subprocess.check_output([str(args.ffmpeg.with_name("ffprobe.exe")), "-v", "error", "-show_format", "-show_streams", "-of", "json", str(mp3)], encoding="utf-8"))
        assert encoded["streams"][0]["sample_rate"] == "48000" and encoded["streams"][0]["channels"] == 1
        exact = same_spoken_words(job["text"], transcript)
        expected = list(re.finditer(r"\w+", job["text"]))
        heard = [(token, word.start, word.end) for segment in segments for word in segment.words for token in re.findall(r"\w+", word.word)]
        cues = [{"at": round(at, 3), "charIndex": word.start(), "word": word[0], "end": round(end, 3)} for word, (_, at, end) in zip(expected, heard)] if exact and len(expected) == len(heard) else []
        take.update({"processing": PROCESSING, "processingSha256": processing_hash(PROCESSING), "normalization": {"targetLufs": -18, "targetTruePeakDbtp": -1.5, "filter": filt, "iterations": iteration + 1},
                     "integratedLufs": float(checked["input_i"]), "truePeakDbtp": float(checked["input_tp"]),
                     "asr": transcript, "asrWordExact": exact, "asrLiteralWordExact": spoken_words(job["text"]) == spoken_words(transcript),
                     "asrNormalization": ASR_NORMALIZATION,
                     "asrModel": f"independent faster-whisper, cached local model, {ASR_CACHE['device']} int8 (effective {ASR_CACHE['effectiveComputeType']}), no script prompt", "asrCpuThreads": args.asr_threads,
                     "asrDevice": ASR_CACHE["device"], "asrEffectiveComputeType": ASR_CACHE["effectiveComputeType"],
                     "asrLanguageId": "de", "asrComputeType": "int8", "asrScriptPrompt": None,
                     "asrBeamSize": beam, "asrReadings": readings,
                     "asrModelSha256": asr_model_hash,
                     "asrModelDirectoryName": args.asr_model.name, "wordCues": cues, "sha256": sha(mp3),
                     "durationSeconds": float(encoded["format"]["duration"]), "bytes": mp3.stat().st_size,
                     "sampleRateHz": 48000, "channels": 1, "bitrateBitsPerSecond": 128000,
                     "file": PUBLIC_ASSET_FAMILY + "/" + mp3.name, "status": "private benchmark; not production eligible" if take.get("benchmarkOnly") else "eligible exact-text recording; human listening pending" if exact and technical else "held private; selected production fallback"})
        write(receipt, take)
        print(json.dumps({"stage": "processed", "n": index + 1, "total": len(queue), "clipId": job["clipId"], "exact": exact, "technical": technical, "asr": transcript}, ensure_ascii=False), flush=True)
    if publish_manifest:
        manifest(all_jobs if all_jobs is not None else read(private / "requests.json")["jobs"], private, args.ambient)


def benchmark_asr(args, private):
    """Compare small CPU thread counts on one unchanged, eligible encoded clip."""
    import numpy as np
    from faster_whisper import WhisperModel

    def memory_status():
        if os.name != "nt":
            return None
        import ctypes
        from ctypes import wintypes

        class MemoryStatus(ctypes.Structure):
            _fields_ = [("length", wintypes.DWORD), ("loadPercent", wintypes.DWORD)] + [(field, ctypes.c_ulonglong) for field in ("totalPhysical", "availablePhysical", "totalPageFile", "availablePageFile", "totalVirtual", "availableVirtual", "availableExtendedVirtual")]

        state = MemoryStatus()
        state.length = ctypes.sizeof(state)
        assert ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(state)), "Unable to observe host memory headroom"
        return {"availableRamBytes": state.availablePhysical, "totalRamBytes": state.totalPhysical, "memoryLoadPercent": state.loadPercent}
    candidates = [(path, read(path)) for path in (private / "encoded").glob("*.json")]
    candidates += [(path, read(path)) for path in (private / "rejected").glob("*/attempt-*/encoded-*.json")]
    receipt, take = max(((path, row) for path, row in candidates if row["asrWordExact"]), key=lambda pair: pair[1]["durationSeconds"])
    mp3 = receipt.with_suffix(".mp3")
    assert sha(mp3) == take["sha256"]
    pcm = subprocess.check_output([str(args.ffmpeg), "-loglevel", "error", "-i", str(mp3), "-f", "f32le", "-ac", "1", "-ar", "16000", "pipe:1"])
    samples = np.frombuffer(pcm, dtype=np.float32).copy()
    rows = []
    for threads in (1, 4):
        before_load = memory_status()
        start = time.monotonic()
        model = WhisperModel(str(args.asr_model), device="cpu", compute_type="int8", cpu_threads=threads)
        load_seconds = time.monotonic() - start
        after_load = memory_status()
        start = time.monotonic()
        segments, _ = model.transcribe(samples, language="de", beam_size=1, word_timestamps=True)
        transcript = " ".join(segment.text.strip() for segment in segments)
        row = {"cpuThreads": threads, "beamSize": 1, "loadSeconds": round(load_seconds, 2),
               "transcribeSeconds": round(time.monotonic() - start, 2), "transcript": transcript,
               "spokenWordExact": same_spoken_words(take["text"], transcript),
               "memoryBeforeLoad": before_load, "memoryAfterLoad": after_load, "memoryAfterTranscription": memory_status()}
        rows.append(row)
        print(json.dumps({"stage": "ASR benchmark", **row}, ensure_ascii=False), flush=True)
        del model
        gc.collect()
    write(private / "asr-thread-benchmark.json", {"clipId": take["clipId"], "sha256": sha(mp3),
          "selection": "Immutable previously ASR-exact encoded clip, including rejected archive if needed; performance benchmark grants no production eligibility",
          "durationSeconds": take["durationSeconds"], "modelDirectoryName": args.asr_model.name,
          "modelSha256": sha(args.asr_model / "model.bin"),
          "computeType": "int8", "language": "de", "scriptPrompt": None, "readings": rows})


def sentence_rescue(args, queue, private, publish_manifest=True):
    """Bounded exact same-profile parts; full encoded words remain the release gate."""
    rescue = private / "sentence-rescue"
    plan_path = rescue / "requests.json"
    if args.plan:
        assert not plan_path.exists(), "A frozen rescue plan already exists; preserve it before a new replan"
        parts = []
        for job in queue:
            raw_path = private / "raw" / (job["clipId"] + ".json")
            encoded_path = private / "encoded" / raw_path.name
            if not raw_path.exists():
                continue
            raw = read(raw_path)
            encoded = read(encoded_path) if encoded_path.exists() else {}
            if (generation_complete(encoded) and encoded.get("asr") is not None and same_spoken_words(job["text"], encoded["asr"])
                    and abs(encoded["integratedLufs"] + 18) <= .3 and encoded["truePeakDbtp"] <= -1.5):
                continue
            if raw.get("synthesisAttempt", 1) < 2:
                continue  # The ordinary one-retake cap remains available first.
            sentences = re.split(r"(?<=[.!?;])\s+", job["text"])
            chunks = []
            for sentence in sentences:
                chunks.extend(re.split(r"(?<=,)\s+", sentence) if len(re.findall(r"\w+", sentence)) > 18 else [sentence])
            assert same_spoken_words(job["text"], " ".join(chunks)), "Rescue boundaries changed authored words"
            for index, text in enumerate(chunks):
                parts.append({**job, "clipId": job["clipId"] + f"-part-{index + 1:02}", "text": text,
                              "parentClipId": job["clipId"], "partIndex": index})
        write(plan_path, {"sourceSha256": source_hashes(), "jobs": parts, "parentRequestSha256": sha(private / "requests.json"),
                         "authorization": "2026-10-12 integrator authorized exact same-profile sentence/phrase rescue; raw dry joins receive the existing processing once; full encoded independent ASR remains mandatory"})
        print(json.dumps({"rescueLines": len({part["parentClipId"] for part in parts}), "exactParts": len(parts)}), flush=True)
        return
    plan = read(plan_path)
    originals = {job["clipId"]: job for job in queue}
    for parent in dict.fromkeys(part["parentClipId"] for part in plan["jobs"]):
        expected = originals[parent]["text"]
        assert same_spoken_words(expected, " ".join(part["text"] for part in plan["jobs"] if part["parentClipId"] == parent))
    following = args.follow_source
    args.follow_source = False  # The complete parent request is checked before this bounded part queue.
    try:
        if args.render:
            render(args, plan["jobs"], rescue)
        elif args.process:
            process(args, plan["jobs"], rescue, publish_manifest=False)
            assembled = []
            for parent in dict.fromkeys(part["parentClipId"] for part in plan["jobs"]):
                jobs_for_parent = [part for part in plan["jobs"] if part["parentClipId"] == parent]
                records = []
                for part in jobs_for_parent:
                    path = rescue / "encoded" / (part["clipId"] + ".json")
                    if not path.exists():
                        break
                    record = read(path)
                    if not (generation_complete(record) and record.get("asrWordExact") is True and same_spoken_words(part["text"], record["asr"])):
                        break
                    records.append(record)
                if len(records) != len(jobs_for_parent):
                    continue
                raw_receipt = private / "raw" / (parent + ".json")
                failed_take = read(raw_receipt)
                rejoin_authority = None
                if failed_take.get("rescueParts"):
                    old_parts = failed_take["rescueParts"]
                    signatures = lambda rows: [(row["clipId"], row["rawSha256"], row.get("encodedSha256", row.get("sha256"))) for row in rows]
                    if signatures(old_parts) == signatures(records):
                        assembled.append(originals[parent])
                        continue
                    delivery_path = getattr(args, "join_delivery_authorization", None)
                    if delivery_path:
                        assert sha(delivery_path) == args.join_delivery_authorization_sha256
                        review = read(delivery_path)
                        proof = review["approvedCandidate"]
                        assert proof["kind"] == "post-speech-silence-boundary" and proof["voiceId"] == VOICE and proof["profileId"] == PROFILE
                        if "joinedAuditSha256" in proof:
                            audit_path = args.join_delivery_joined_audit
                            assert sha(audit_path) == proof["joinedAuditSha256"]
                            audit = read(audit_path)
                            assert audit["clipId"] == parent
                        else:
                            # A named source-exact player boundary review binds
                            # the failed canonical parent directly, before rebuild.
                            assert proof["failedParentClipId"] == parent
                            parent_receipt = private / "encoded" / (parent + ".json")
                            assert sha(parent_receipt) == proof["failedParentReceiptSha256"]
                            audit = {"rawSha256": proof["failedParentRawSha256"],
                                     "encodedSha256": proof["failedParentEncodedSha256"]}
                        authority_hash = args.join_delivery_authorization_sha256
                        authority = {"clipId": proof["clipId"], "previousRawSha256": proof["sourceFullRawSha256"],
                                     "previousEncodedSha256": proof["sourceFullEncodedSha256"], "failedParentClipId": parent,
                                     "failedParentRawSha256": audit["rawSha256"], "failedParentEncodedSha256": audit["encodedSha256"]}
                    else:
                        authority_path = getattr(args, "join_retake_authorization", None)
                        assert authority_path and sha(authority_path) == args.join_retake_authorization_sha256, "Changed joined parts need their explicit repair authority"
                        authority = read(authority_path)
                        authority_hash = args.join_retake_authorization_sha256
                    assert authority["failedParentClipId"] == parent and failed_take["rawSha256"] == authority["failedParentRawSha256"]
                    old_by_id = {row["clipId"]: row for row in old_parts}
                    assert set(old_by_id) == {row["clipId"] for row in records}
                    for record in records:
                        prior = old_by_id[record["clipId"]]
                        if record["clipId"] == authority["clipId"]:
                            if delivery_path:
                                edit = record["deliveryEditing"]
                                assert (record["synthesisAttempt"] == proof["sourceActualSynthesisAttempt"]
                                        and edit["kind"] == proof["kind"] and edit["reviewedProposalSha256"] == review["proposalSha256"]
                                        and edit["endSampleExclusive"] == proof["endSampleExclusive"])
                            else:
                                assert record["synthesisAttempt"] == 2 and record["joinRetakeAuthority"]["receiptSha256"] == authority_hash
                            assert prior["rawSha256"] == authority["previousRawSha256"] and prior["encodedSha256"] == authority["previousEncodedSha256"]
                        else:
                            assert (prior["rawSha256"], prior["encodedSha256"]) == (record["rawSha256"], record["sha256"]), "Every other joined part stays byte-identical"
                    assert sha(raw_receipt.with_suffix('.wav')) == authority["failedParentRawSha256"]
                    assert sha(private / 'encoded' / (parent+'.mp3')) == authority["failedParentEncodedSha256"]
                    rejoin_authority = {"receiptSha256": authority_hash, "kind": "post-speech-silence-boundary" if delivery_path else "ordinary-part-retake", "priorRawSha256": authority["failedParentRawSha256"],
                                        "priorEncodedSha256": authority["failedParentEncodedSha256"], "replacedPartClipId": authority["clipId"]}
                archive = private / "rejected" / parent / ("joined-line-before-authorized-part-retake-" + failed_take["rawSha256"][:12] if rejoin_authority else "whole-line-before-sentence-rescue")
                assert not archive.exists(), "Whole-line rescue archive is immutable"
                native_archive_path(archive).mkdir(parents=True)
                failed_trace = raw_receipt.with_name(parent + "-eos-trace.json")
                if failed_take.get("decode", {}).get("eosTraceSha256"):
                    assert failed_trace.exists() and sha(failed_trace) == failed_take["decode"]["eosTraceSha256"]
                for folder in ("raw", "encoded"):
                    for path in (private / folder).glob(parent + ".*"):
                        assert path.resolve().is_relative_to(private.resolve()) and path.is_file()
                        archive_move(path, archive / (folder + "-" + path.name))
                    prepared = private / folder / (parent + "-processed.wav")
                    if prepared.exists():
                        archive_move(prepared, archive / (folder + "-" + prepared.name))
                if failed_trace.exists():
                    archive_move(failed_trace, archive / ("raw-" + failed_trace.name))
                wav = raw_receipt.with_suffix(".wav")
                inputs, filters, evidence = [], [], []
                for index, record in enumerate(records):
                    part_wav = rescue / "raw" / (record["clipId"] + ".wav")
                    assert sha(part_wav) == record["rawSha256"]
                    inputs += ["-i", str(part_wav)]
                    filters.append(f"[{index}:a]")
                    evidence.append({"clipId": record["clipId"], "text": record["text"], "voiceId": record["voiceId"],
                                     "profileId": record["profileId"], "referenceSha256": record["referenceSha256"], "rawSha256": record["rawSha256"],
                                     "encodedSha256": record["sha256"], "asr": record["asr"], "asrWordExact": True,
                                     "eosReached": True, "eosKind": record.get("decode", {}).get("eosKind"),
                                     "decode": record["decode"], "renderer": record["renderer"], "modelRevision": record["modelRevision"],
                                     "asrModelSha256": record["asrModelSha256"], "asrScriptPrompt": record["asrScriptPrompt"],
                                     **({"authoringHelperSha256": record["authoringHelperSha256"]} if record.get("authoringHelperSha256") else {}),
                                     "deliveryEditing": record.get("deliveryEditing"),
                                     **({"exceptionAuthority": record["exceptionAuthority"]} if record.get("exceptionAuthority") else {}),
                                     **({"joinRetakeAuthority": record["joinRetakeAuthority"]} if record.get("joinRetakeAuthority") else {}),
                                     "synthesis": record["synthesis"], "synthesisAttempt": record["synthesisAttempt"], "seed": record["seed"]})
                subprocess.run([str(args.ffmpeg), "-v", "error", "-y", *inputs, "-filter_complex", "".join(filters) + f"concat=n={len(records)}:v=0:a=1[out]", "-map", "[out]", "-c:a", "pcm_s16le", str(wav)], check=True)
                take = {**records[0], **originals[parent], "rawSha256": sha(wav), "synthesisAttempt": 3,
                        "authoringHelperSha256": AUTHORING_HELPER_SHA256,
                        "decode": {"eosReached": True, "basis": "Every complete original part generation has explicit native EOS; each part delivery has independent encoded-word audit, and any edited endpoint is separately recorded without an EOS claim at the cut"},
                        "rescueParts": evidence, "rescuePlanSha256": sha(plan_path), "rescueAuthorization": plan["authorization"],
                        **({"joinRebuildAuthority": rejoin_authority} if rejoin_authority else {}),
                        "joinProcessing": "Concatenate dry24kHz mono parts with their natural endpoint silence; apply selected undertone and encoded normalization once to the full line",
                        "renderSeconds": sum(record["renderSeconds"] for record in records), "requestSha256": sha(private / "requests.json")}
                for key in ("sha256", "file", "asr", "asrWordExact", "integratedLufs", "truePeakDbtp", "wordCues", "deliveryEditing", "exceptionAuthority", "joinRetakeAuthority"):
                    take.pop(key, None)
                write(raw_receipt, take)
                assembled.append(originals[parent])
            process(args, assembled, private, queue, publish_manifest=publish_manifest)
            print(json.dumps({"rescueAssembled": len(assembled), "rescueRequested": len({part["parentClipId"] for part in plan["jobs"]})}), flush=True)
        else:
            raise AssertionError("Sentence rescue uses --plan, --render or --process")
    finally:
        args.follow_source = following


def manifest(queue, private, ambient=False):
    filename = manifest_name(ambient)
    public_path = ROOT / PUBLIC_ASSET_FAMILY / filename
    existing = {row["clipId"]: row for row in read(public_path)["clips"]} if public_path.exists() else {}
    identity_keys = ("clipId", "voiceId", "profileId", "text", "referenceSha256", "referenceOriginalSha256", "renderer", "modelRevision", "processing")
    family_reference_license = reference_license({}) if CUSTOM_PLAN else None
    clips, held = [], []
    for job in queue:
        receipt = private / "encoded" / (job["clipId"] + ".json")
        if not receipt.exists():
            raw_receipt = private / "raw" / (job["clipId"] + ".json")
            waiting = raw_receipt.exists()
            if waiting and not generation_complete(read(raw_receipt)):
                held.append({**job, "reason": "held private; selected production fallback", "failedGates": ["missing or failed explicit native EOS evidence"],
                             "candidateRawSha256": read(raw_receipt)["rawSha256"]})
            else:
                held.append({**job, "reason": ("awaiting independent final audit" if waiting else "not rendered") + "; selected production fallback"})
            continue
        take = read(receipt)
        assert take["text"] == job["text"] and take["clipId"] == job["clipId"]
        assert_binding(take)
        assert take["processing"] == PROCESSING and take["modelRevision"] == REVISION
        if CUSTOM_PLAN:
            # Cached street takes predate the matched cast license annotation.
            # Rebuilding their manifest must retain this verified provenance.
            take["referenceLicense"] = family_reference_license
        take["asrLiteralWordExact"] = spoken_words(take["text"]) == spoken_words(take["asr"])
        take["asrWordExact"] = same_spoken_words(take["text"], take["asr"])
        take["asrNormalization"] = ASR_NORMALIZATION
        take["processingSha256"] = processing_hash(take["processing"])
        one_take = not (CUSTOM_PLAN and CUSTOM_PLAN["family"] == "office-mirror") or not (take.get("rescueParts") or take.get("deliveryEditing"))
        if not take.get("benchmarkOnly") and one_take and take["asrWordExact"] and abs(take["integratedLufs"] + 18) <= .3 and take["truePeakDbtp"] <= -1.5 and generation_complete(take):
            prior = existing.get(take["clipId"], {})
            if prior and all(prior.get(key) == take.get(key) for key in identity_keys):
                if "english" in prior:
                    take["english"] = prior["english"]
                if "approval" in prior:
                    # Authored-text translation and voice use authorization can
                    # survive a retake; human listening is tied to encoded bytes.
                    take["approval"] = {key: prior["approval"][key] for key in ("status", "date", "instruction", "scope") if key in prior["approval"]}
                    for key in ("listeningConfirmed", "listeningVerified"):
                        if key in prior["approval"] or prior.get("sha256") != take["sha256"]:
                            take["approval"][key] = prior["approval"].get(key, False) if prior.get("sha256") == take["sha256"] else False
                if prior.get("sha256") == take["sha256"]:
                    if "listening" in prior:
                        take["listening"] = prior["listening"]
                    for key in ("listeningConfirmed", "listeningVerified"):
                        if key in prior:
                            take[key] = prior[key]
                else:
                    take["listening"] = "pending"
                    for key in ("listeningConfirmed", "listeningVerified"):
                        if key in prior:
                            take[key] = False
            destination = ROOT / take["file"]
            assert take["file"] == PUBLIC_ASSET_FAMILY + "/" + job["clipId"] + ".mp3", "Unexpected public asset path"
            destination.parent.mkdir(parents=True, exist_ok=True)
            assert sha(receipt.with_suffix(".mp3")) == take["sha256"], "Private encoded bytes changed before public promotion"
            shutil.copyfile(receipt.with_suffix(".mp3"), destination)
            take["status"] = "eligible exact-text recording; human listening pending"
            assert sha(ROOT / take["file"]) == take["sha256"]
            clips.append(take)
        else:
            failures = []
            if take.get("benchmarkOnly"):
                failures.append("benchmark diagnostic only; no production eligibility")
            if not one_take:
                failures.append("mirror requires one continuous unedited synthesis take")
            if not take["asrWordExact"]:
                failures.append("independent spoken-word equivalence")
            if abs(take["integratedLufs"] + 18) > .3 or take["truePeakDbtp"] > -1.5:
                failures.append("encoded loudness/true peak")
            if take.get("decode", {}).get("eosReached") is not True:
                failures.append("missing explicit native EOS evidence" if "eosReached" not in take.get("decode", {}) else "token budget exhausted without EOS")
            held.append({**job, "reason": "held private; selected production fallback", "failedGates": failures,
                         "candidateSha256": take["sha256"], "asr": take["asr"]})
    write(public_path, {"schemaVersion": 1, "voiceId": VOICE, "profileId": PROFILE, "fallback": BINDING.get("fallback", "browser"),
          "status": "same-profile technical and independent ASR audit; perceptual listening not independently verified",
          "generatedLineCount": sum((private / "raw" / (job["clipId"] + ".json")).exists() for job in queue),
          "requestedLineCount": len(queue), "lineCount": len(clips), "clips": clips, "heldPrivate": held,
          "approvedExistingReuse": read(private / "requests.json").get("approvedExistingReuse", [])})


def check_manifest(queue, ambient=False):
    assert same_spoken_words("A38, § 17: an meinem Schalter Lärm.", "A achtunddreißig, Paragraph siebzehn: an meinem Schalterlärm.")
    assert not same_spoken_words("einem Grashalm", "einen Grashalm")
    assert not same_spoken_words("Formular A38", "Formular 88")
    assert not same_spoken_words("Ihren Wohnsitz", "Ihrem Wohnsitz")
    document = read(ROOT / PUBLIC_ASSET_FAMILY / manifest_name(ambient))
    current = {job["clipId"]: job for job in queue}
    if CUSTOM_PLAN and CUSTOM_PLAN["family"] == "crowd-dialogue":
        validate_crowd_manifest(document, queue, VOICE)
    for clip in document["clips"]:
        assert clip["text"] == current[clip["clipId"]]["text"]
        if CUSTOM_PLAN and CUSTOM_PLAN["family"] == "crowd-dialogue":
            job = current[clip["clipId"]]
            assert clip["english"] == job["english"] and clip["sourceLocator"] == job["sourceLocator"]
            assert clip["region"] == job["region"] and clip["slot"] == job["slot"] and clip["actorId"] == VOICE
        assert_binding(clip)
        assert clip["modelRevision"] == REVISION and clip["processing"] == PROCESSING
        assert clip["processingSha256"] == processing_hash(PROCESSING)
        assert clip["referenceOriginalSha256"] == BINDING["originalSha256"]
        assert same_spoken_words(clip["text"], clip["asr"]) and clip["asrWordExact"]
        assert generation_complete(clip), "Missing or failed explicit native EOS evidence remains private"
        if CUSTOM_PLAN and CUSTOM_PLAN["family"] == "office-mirror":
            assert not clip.get("rescueParts") and not clip.get("deliveryEditing"), "Mirror requires one complete, unedited take"
            assert clip["synthesis"]["exaggeration"] == .65
        assert abs(clip["integratedLufs"] + 18) <= .3 and clip["truePeakDbtp"] <= -1.5
        assert sha(ROOT / clip["file"]) == clip["sha256"]
        assert clip["file"] == PUBLIC_ASSET_FAMILY + "/" + clip["clipId"] + ".mp3"
    print(f'Verified {len(document["clips"])} fixed-profile encoded clips; {len(document["heldPrivate"])} selected production fallbacks')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", type=Path, required=True)
    parser.add_argument("--voice-id", default="amt-brunhilde-knick", help="Selected production voice, or all for one cached-model family batch; other characters require --request-file")
    parser.add_argument("--request-file", type=Path, help="Frozen authored street, office or city plan; shared synthesis and audit pipeline")
    parser.add_argument("--model-dir", type=Path)
    parser.add_argument("--asr-model", type=Path)
    parser.add_argument("--ffmpeg", type=Path)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--ambient", action="store_true", help="Use the separate three-line clerk ambient supplement without changing the main request")
    parser.add_argument("--precision", choices=("fp32", "fp16"), default="fp32", help="fp16 stores the T3 language model in half precision and enables CUDA autocast; reference conditioning remains float32")
    parser.add_argument("--device", choices=("cpu", "cuda"), default="cuda", help="Cached renderer device; bounded CPU benchmarks use FP32 and the same reference/revision/decoding")
    parser.add_argument("--cpu-threads", type=int, choices=(2, 4), default=2, help="Authoring renderer CPU threads; changing this requires bounded same-input timing and fidelity evidence")
    parser.add_argument("--observe-eos", action="store_true", help="Bounded diagnostic: record native alignment and EOS suppression/forced-stop evidence")
    parser.add_argument("--eos-after-alignment", action="store_true", help="Authorized decode experiment only: preserve the model EOS logit after monotonic alignment completion; retain every other native guard")
    parser.add_argument("--follow", action="store_true", help="Keep the CPU ASR model loaded and await each completed raw receipt, up to 20 minutes per line")
    parser.add_argument("--follow-source", action="store_true", help="Preserve source snapshots and reconcile unrelated edits only when every frozen authored voice request is unchanged")
    parser.add_argument("--asr-threads", type=int, choices=(1, 2, 4), default=1)
    parser.add_argument("--asr-device", choices=("cpu", "cuda"), default="cpu", help="Native cached-model device; CUDA requires existing compatible libraries in this process")
    parser.add_argument("--retake-failed", action="store_true", help="With --render, archive failed audited takes and make at most one final attempt per line")
    parser.add_argument("--sentence-rescue", action="store_true", help="Authorized replan only: exact same-profile parts, each capped at one retake, with independent final whole-line audit")
    parser.add_argument("--benchmark-hooks", action="store_true", help="With --render, verify native versus cleaned-up repeated-line arrays without saving extra audio takes")
    mode = parser.add_mutually_exclusive_group(required=True)
    for name in ("plan", "reconcile-source", "render", "process", "benchmark-asr", "manifest", "check"):
        mode.add_argument("--" + name, action="store_true")
    args = parser.parse_args()
    if args.voice_id == "all":
        assert args.request_file and not args.ambient, "All-voice batches require a frozen custom family plan"
        plan = read(args.request_file)
        if plan["family"] == "city-dialogue":
            assert plan["jobs"], "City requests must be a finite unique subset"
        for voice in dict.fromkeys(job["voiceId"] for job in plan["jobs"]):
            args.voice_id = voice
            execute(args)
    else:
        execute(args)


def execute(args):
    configure_request(args)
    assert not args.retake_failed or args.render, "Retake selection applies only to rendering"
    assert not args.benchmark_hooks or args.render, "Hook comparison applies only to rendering"
    if os.name == "nt" and (args.render or args.process or args.benchmark_asr):
        import ctypes
        from ctypes import wintypes
        kernel = ctypes.windll.kernel32
        kernel.GetCurrentProcess.restype = wintypes.HANDLE
        kernel.SetPriorityClass.argtypes = (wintypes.HANDLE, wintypes.DWORD)
        assert kernel.SetPriorityClass(kernel.GetCurrentProcess(), 0x20), "Unable to set normal authoring process priority"
    queue = jobs(args.ambient, args.music_root)
    private = args.music_root / PRIVATE_REVIEW_FAMILY
    if CUSTOM_PLAN:
        private = private / VOICE
    assert private.resolve().is_relative_to(args.music_root.resolve())
    if args.ambient:
        private = private / "ambient"
    private = private.resolve()
    assert not private.is_relative_to(ROOT.resolve()), "Private authoring files must stay outside the game checkout"
    if args.check:
        check_manifest(queue, args.ambient)
        return
    hashes = source_hashes()
    if args.sentence_rescue:
        frozen = read(private / "requests.json")
        assert frozen["jobs"] == queue and frozen["sourceSha256"] == hashes, "Freeze/reconcile the exact complete parent request before sentence rescue"
        sentence_rescue(args, queue, private)
        return
    if args.plan:
        if CUSTOM_PLAN and not args.follow_source:
            assert all(hashes[name] == value for name, value in CUSTOM_PLAN["sourceSha256"].items()), "Supplied authored plan source changed; refresh the plan before freezing"
        frozen_plan = {"requestedLineCount": len(queue), "sourceSha256": hashes, "jobs": queue, "approvedExistingReuse": REUSE_EVIDENCE}
        if CUSTOM_PLAN:
            frozen_plan.update({"authoredPlanSha256": sha(args.request_file), "authoredPlanSourceSha256": CUSTOM_PLAN["sourceSha256"]})
        if CUSTOM_PLAN and CUSTOM_PLAN["family"] == "city-dialogue" and (private / "requests.json").exists():
            assert read(private / "requests.json") == frozen_plan, "City request already frozen; use the existing explicit source reconciliation"
        write(private / "requests.json", frozen_plan)
        print(json.dumps({"requestedLineCount": len(queue), "registrationLineCount": sum("registration-" in job["clipId"] for job in queue), "privateRoot": str(private)}, ensure_ascii=False))
        return
    frozen = read(private / "requests.json")
    if args.reconcile_source or (args.follow_source and (frozen["sourceSha256"] != hashes or frozen["jobs"] != queue)):
        reconcile_request(private, frozen, queue, hashes)
        frozen = read(private / "requests.json")
        if args.reconcile_source:
            return
    assert frozen["sourceSha256"] == hashes, "Source changed; reconcile the frozen request before resuming"
    assert frozen["jobs"] == queue, "Exact dialogue/profile requests changed; reconcile before resuming"
    if args.manifest:
        manifest(queue, private, args.ambient)
    elif args.render:
        render(args, queue[:args.limit] if args.limit else queue, private)
    elif args.benchmark_asr:
        benchmark_asr(args, private)
    else:
        process(args, queue[:args.limit] if args.limit else queue, private, queue,
                publish_manifest=not (CUSTOM_PLAN and CUSTOM_PLAN["family"] == "city-dialogue"))


if __name__ == "__main__":
    main()
