"""Add the exact Hannelore diagonal generation request without rewriting earlier records."""
from pathlib import Path
import hashlib
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
REQUEST = ROOT / 'output/street-redesign/hannelore-end-to-end/diagonal-request.json'
DURABLE = Path(__file__).resolve().parent / 'diagonal-generation-request.json'
PROVENANCE = ROOT / 'assets/sprite-sources/berlin-street-20261022/provenance.json'
SOURCE = ROOT / 'assets/sprite-sources/berlin-street-20261022/stadt-hannelore-sparkasse-expressionist-diagonals-v1.png'
ID = SOURCE.stem
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()


def run():
    request = json.loads(REQUEST.read_text())
    assert request['output'] == SOURCE.relative_to(ROOT).as_posix()
    assert sha(SOURCE) == request['rawSha256']
    assert Image.open(SOURCE).size == tuple(request['rawSize'])
    for ref in request['referenceRoles']:
        assert sha(ROOT / ref['file']) == ref['sha256']
    shutil.copyfile(REQUEST, DURABLE)
    assert sha(REQUEST) == sha(DURABLE)
    raw = PROVENANCE.read_text()
    parsed = json.loads(raw)
    assert not any(record['id'] == ID for record in parsed['records'])
    record = {
        'id': ID, 'file': SOURCE.name, 'source': None,
        'prompt': request['prompt'],
        'referencedSources': [ref['file'] for ref in request['referenceRoles']],
        'expectedComponentCount': 4,
        'status': 'OWN Hannelore authoring source; isolated integration candidate, not public acceptance',
        'sourceReviewReceipt': DURABLE.relative_to(ROOT).as_posix(),
        'sourceReviewReceiptSha256': sha(DURABLE),
        'originalSourcePath': None,
        'sourceSha256': sha(SOURCE),
        'exactOriginalRequestedReferences': request['referenceRoles'],
        'producerFindings': request['sourceReview'],
        'producerCaveats': ['Original image generation temporary output path/job identifier was not recorded in the source request; do not infer it.',
                            'Raw alpha21 top margin is 6 px and bottom margin 11 px; registered sources crop/pad before native export.',
                            'Rear-right painted lip is subpixel at 80x100 client export and is explicitly null.'],
        'runtimeAcceptance': 'Isolated candidate; live desktop/mobile stress and root review pending.',
        'originalSourceReviewReceipt': DURABLE.relative_to(ROOT).as_posix(),
        'sha256': sha(SOURCE), 'dimensions': request['rawSize'], 'bytes': SOURCE.stat().st_size,
        'generationRequest': {'transparent_background': True,
                              'referenced_image_paths': request['referenceRoles'],
                              'prompt': request['prompt'],
                              'pathRepresentation': 'Original request uses repository-relative reference paths and hashes. Original temporary output path was not recorded.'},
        'portableReferenceEquivalents': request['referenceRoles'],
    }
    needle = '\n  ]\n}\n'
    assert raw.endswith(needle)
    serialized = json.dumps(record, indent=2, ensure_ascii=False)
    indented = '\n'.join('    ' + line for line in serialized.splitlines())
    updated = raw[:-len(needle)] + ',\n' + indented + needle
    checked = json.loads(updated)
    assert checked['records'][:-1] == parsed['records'] and checked['records'][-1] == record
    PROVENANCE.write_text(updated)
    print(json.dumps({'provenanceRecord': ID, 'sourceSha256': sha(SOURCE),
                      'requestSha256': sha(DURABLE), 'recordCount': len(checked['records'])}))


if __name__ == '__main__':
    run()
