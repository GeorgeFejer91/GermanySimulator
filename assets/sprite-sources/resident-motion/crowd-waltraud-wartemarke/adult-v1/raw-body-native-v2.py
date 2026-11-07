"""Waltraud native body packing from her independent raw replay."""
import numpy as np
from PIL import Image


def native_transform(source, tier):
    cell, figure, (px, py) = NATIVE[tier]
    scale = figure / 400
    return source.convert('RGBa').transform(cell, Image.Transform.AFFINE,
        (1 / scale, 0, 256 - px / scale, 0, 1 / scale, 472 - py / scale),
        Image.Resampling.BICUBIC).convert('RGBA')


def effective_gutter(cell):
    alpha = np.asarray(cell)[..., 3]
    bounds = Image.fromarray((alpha >= 21).astype('uint8')).getbbox()
    assert bounds
    x0, y0, x1, y1 = bounds
    gutter = min(x0, y0, cell.width - x1, cell.height - y1)
    outer = max(int(v.max()) for v in (alpha[:2], alpha[-2:], alpha[:, :2], alpha[:, -2:]))
    assert gutter >= 2 and outer <= 20, ('Effective A21 body gutter at existing .08 test', bounds, outer)
    return {'boundsAlpha1': list(cell.getchannel('A').getbbox()), 'boundsAlpha21': list(bounds),
            'effectiveGutter21': gutter, 'outerTwoMaxAlpha': outer}


def run(raw, out, tier, routing, source_roles):
    global NATIVE
    NATIVE = {key: (tuple(spec['cell']), spec['figure'], spec['pivot']) for key, spec in routing['native'].items()}
    assert tier in NATIVE and routing['grid'] == [21, 20]
    assert routing['sourceFigure'] == 400 and routing['sourcePivot'] == [256, 472]
    assert routing['authoredHeight'] == 2.33 and routing['authoredStride'] == 15.145
    assert len(routing['cells']) == 412 and len(routing['roles']) == len(source_roles) == 328
    cache = {}

    def render(role):
        source = source_roles[role]['source']
        key = source['sha256']
        if key not in cache:
            path = raw / routing['roles'][role]['relativeSource']
            with Image.open(path) as opened:
                assert opened.size == (512, 512)
                cell = native_transform(opened.convert('RGBA'), tier)
            cache[key] = (cell, effective_gutter(cell))
        return cache[key]

    checks = []
    if tier == 'standing':
        role = routing['standingSourceRole']
        sheet, gutter = render(role)
        checks.append({'slot': routing['standingLogicalSlot'], 'role': role, 'gutter': gutter})
        filename = 'standing.webp'
    else:
        width, height = NATIVE[tier][0]
        columns, rows = routing['grid']
        sheet = Image.new('RGBA', (columns * width, rows * height))
        for route in routing['cells']:
            slot, role = route['slot'], route['role']
            row, col = divmod(slot, columns)
            assert (row, col) == (route['row'], route['col'])
            cell, gutter = render(role)
            sheet.paste(cell, (col * width, row * height))
            checks.append({'slot': slot, 'role': role, 'gutter': gutter})
        assert len(checks) == 412
        for slot in routing['paddingSlots']:
            row, col = divmod(slot, columns)
            assert not np.asarray(sheet.crop((col * width, row * height, (col + 1) * width, (row + 1) * height))).any()
        filename = 'source-' + tier + '.webp'
    path = out / filename
    sheet.save(path, lossless=True, exact=True, method=4)
    with Image.open(path) as decoded:
        assert decoded.size == sheet.size
        assert decoded.convert('RGBA').tobytes() == sheet.tobytes()
    return path, sheet.size, checks, len(cache)
