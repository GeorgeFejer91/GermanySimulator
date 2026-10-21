"""Verify the bounded Karl V3 source/compact diagnostic contract."""
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / 'output/ambient-city-animation/karl-post-motion-v3'
FIT = Path(__file__).with_name('source-fit-v3.json')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    assert (OUT / 'receipt.json').is_file(), 'Karl V3 source probe receipt absent'
    receipt = json.loads((OUT / 'receipt.json').read_text())
    assert receipt['sourceFitSha256'] == digest(FIT)
    assert receipt['worldContract'] == {'standingFigureWorldHeight': 1.6, 'standingPivot': [64,150], 'standingFigureHeight': 136, 'distancePerCycle': 'unmeasured'}
    for relative, expected in receipt['sourceFiles'].items():
        assert digest(ROOT / relative) == expected
    assert set(receipt['directions']) == {'down','right','up','left'}
    for direction, record in receipt['directions'].items():
        count = 16 if direction in ('right','left') else 4
        assert len(record['frames']) == count
        assert record['registeredSha256'] == digest(OUT / f'{direction}-registered.png')
        for index, frame in enumerate(record['frames']):
            for suffix, size in [('working',(512,512)),('desktop',(96,120)),('mobile',(64,80))]:
                path = OUT / f'{direction}-{suffix}-{index:02}.png'
                assert digest(path) == frame[suffix+'Sha256']
                assert Image.open(path).size == size
            assert frame['majorAlphaComponents'] == 1
        assert len(set(frame['workingSha256'] for frame in record['frames'])) == count
        for color in ('light','dark'):
            assert digest(OUT / f'{direction}-working-{color}.png') == record['boards']['working'][color]
            assert digest(OUT / f'{direction}-desktop-{color}.png') == record['boards']['desktop'][color]
            assert digest(OUT / f'{direction}-mobile-{color}.png') == record['boards']['mobile'][color]
        if count == 16:
            assert len(record['adjacentRms']) == count
            assert record['loopJoinBoardSha256'] == digest(OUT / f'{direction}-loop-join.png')
    print('Karl V3 diagnostic contract PASS')


if __name__ == '__main__':
    main()
