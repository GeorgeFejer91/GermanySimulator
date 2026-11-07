"""Rebuild Waltraud's authored street family in a disposable source mirror."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
ID = 'crowd-waltraud-wartemarke'
RELATIVE = Path('assets/characters/residents') / ID / 'delivery-v2'
DEST = ROOT / RELATIVE
MANIFEST = ROOT / 'assets/characters/street/manifest.json'
PACK = DEST / 'delivery/motion-delivery.json'
PUBLISH = './' + RELATIVE.as_posix() + '/'
RECEIPTS = ROOT / 'replay-receipts-v1'
PARTS = HERE / 'raw-family-neutral-parts-v2'
SHARED = ROOT / '.agents/skills/animate-2d-characters/scripts'
HEADINGS = ('down', 'right', 'up', 'left')
ACTIONS = ('idle', 'look', 'success', 'failure')
TIERS = ('desktop', 'mobile', 'standing')
GROUPS = ('down', 'right', 'left', 'turn-actions')
MOVEMENT = {
    f'{view}-{index}': (view, tuple(range(start, start + width)))
    for view, width in zip(HEADINGS, (8, 4, 8, 4))
    for index, start in enumerate(range(0, 16, width))
}
BODY = (*MOVEMENT, *ACTIONS)
PACK_STEPS = ('init', 'build', 'bind', 'check')
STAGES = ('register', 'neutral-parts', *BODY, *(f'native-{tier}' for tier in TIERS),
          *(f'mouth-{group}' for group in GROUPS), *(f'pack-{step}' for step in PACK_STEPS), 'compare')
OFFICIAL = {
    'compiler': ('tools/build-street-mouths.py', '7d3ca1c34a6b2164f01e35bdc635f6ad03c75ec7e041878192afef21b670fc1e'),
    'packer': ('tools/build-street-motion-delivery.py', '057a595ad272b9510b8148f95a39bc259bf2adf1503af53fb84b89970b211592'),
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def record(path):
    data = path.read_bytes()
    return {'path': path.relative_to(ROOT).as_posix(), 'sha256': sha(data), 'bytes': len(data)}


def verified(ref):
    path = ROOT / ref['path']
    assert record(path) == ref
    return path


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, value, replace=False):
    with path.open('w' if replace else 'x', encoding='utf-8', newline='\n') as f:
        f.write(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n')


def write_compact_mouths(path, value):
    payload = (json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + '\n').encode('utf-8')
    if len(payload) > 262144:
        raise ValueError('Street mouth data exceeds the runtime 256 KiB budget')
    with path.open('xb') as handle:
        handle.write(payload)


def urls(assets):
    result = {}
    for tag, asset in assets.items():
        name = Path(asset['path']).name
        result[tag] = {'file': PUBLISH + name, 'sha256': asset['sha256'], 'width': asset['width'], 'height': asset['height']}
    return result


def metadata(body, proof, native, frame_bindings, standing):
    order = body['order']
    assert order == ['down', 'right', 'up', 'left']
    neutral = {'row': 4, 'col': 2}
    walks = {d: {'row': i, 'frames': 16, 'frame_ms': 60, 'loop': True} for i, d in enumerate(order)}
    bridges = {d: {'row': i + 4, 'stop_cols': [0, 1, 2], 'start_cols': [3, 4], 'frame_ms': 70} for i, d in enumerate(order)}
    turn_cells = [{'row': 8, 'col': i} for i in range(8)]
    anchors = {d: i * 2 for i, d in enumerate(order)}
    transitions = {
        a + '-to-' + b: {'frames': plan_transition(a, b, walks, bridges, turn_cells, anchors, turn_ms=85)}
        for a in order for b in order if a != b
    }
    settles = {}
    for direction in order:
        group = [c for c in body['cells'] if c['kind'] == 'stop' and c['view'] == direction]
        by_phase = {phase: sorted([c for c in group if c['entryPhase'] == phase], key=lambda c: c['stopStage'])
                    for phase in range(16)}
        assert all([c['stopStage'] for c in row] == [0, 1, 2, 3] for row in by_phase.values())
        bridge = bridges[direction]
        settled = {'row': bridge['row'], 'col': bridge['stop_cols'][-1], 'ms': 70}
        settles[direction] = {
            str(phase): {'frames': [{'row': c['row'], 'col': c['col'], 'ms': 70} for c in row] + [settled]}
            for phase, row in by_phase.items()
        }
    assert body['canonicalActions'] == ['idle', 'look', 'success', 'failure']
    states = {action: {'row': 16 + i, 'col': 0, 'durations_ms': [80 if action == 'idle' else 60] * 16}
              for i, action in enumerate(body['canonicalActions'])}
    states['wait'] = dict(states['idle'])
    person = dict(body['shape'])
    person.update(figureWorldHeight=2.33, strideDistance=15.145, standingOnly=False,
                  standing=native['standing'], grid=[21, 20],
                  variants={'desktop': native['body-desktop'], 'mobile': native['body-mobile']},
                  clips={d: {'offset': i * 21, 'count': 16, 'seconds': .96} for i, d in enumerate(order)},
                  atlasMotion={'schemaVersion': 1, 'walks': walks, 'bridges': bridges,
                               'transitions': transitions, 'settles': settles, 'neutral': neutral,
                               'interactions': {'neutral': neutral, 'states': states}})
    person['clips']['idle'] = {'offset': 86, 'count': 1, 'seconds': 1}
    mouths = {'schemaVersion': 1, 'id': ID, 'cell': [128, 160], 'grid': [21, 20],
              'sources': {'standing': native['standing']['sha256'], 'desktop': native['body-desktop']['sha256'],
                          'mobile': native['body-mobile']['sha256']},
              'standing': standing, 'frames': frame_bindings}
    assert person['id'] == proof['privateResidentRelativeDirectory'].split('/')[-2] == ID
    return person, mouths


def load(path):
    spec = importlib.util.spec_from_file_location('waltraud_' + path.stem.replace('-', '_'), path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def official(args, kind):
    relative, expected = OFFICIAL[kind]
    path = getattr(args, kind)
    digest = getattr(args, kind + '_sha')
    if path is None or digest != expected or path.resolve() != ROOT / relative:
        raise ValueError(f'Provide the mirrored official {kind} path and pinned SHA256')
    if record(path.resolve())['sha256'] != expected:
        raise ValueError(f'Changed official {kind} bytes')
    tool = load(path.resolve())
    assert tool.ROOT == ROOT
    return tool


def receipt(stage):
    value = read(RECEIPTS / (stage + '.json'))
    assert value['status'] == 'PASS' and value['stage'] == stage
    return value


def content(ref):
    return {key: ref[key] for key in ('sha256', 'bytes')}


def digest_fields(field, quiet):
    if quiet:
        names = ('nodesY', 'dx', 'dy', 'headDxDy', 'forebodyDxDy')
        arrays = [field[name] for name in names]
        assert [len(group) for group in arrays] == [6, 6, 6, 2, 2]
        values = [value for group in arrays for value in group]
        values += [field['envelope'], field['minimumVerticalJacobian']]
    else:
        profile = set(field) == {'near', 'far'}
        feet = ('near', 'far') if profile else ('screen-left', 'screen-right')
        assert set(field) == set(feet)
        nodes = 7 if profile else 6
        values = []
        for foot in feet:
            arrays = [field[foot][name] for name in ('nodes_y', 'dx', 'dy', 'footDxDy')]
            assert [len(group) for group in arrays] == [nodes, nodes, nodes, 2]
            values.extend(value for group in arrays for value in group)
    data = struct.pack(f'<{len(values)}d', *values)
    return {'sha256': sha(data), 'bytes': len(data)}


def register(routing):
    load(HERE / 'prepare-neutrals-v1.py').run()
    views = {view: record(HERE / 'registered' / (view + '.png')) for view in routing['turns']}
    return {'views': views, 'registration': record(HERE / 'registration-v1.json')}


def parts():
    registered = receipt('register')
    for view in HEADINGS:
        verified(registered['views'][view])
    controls = read(HERE / 'raw-family-neutral-controls-v1.json')
    rendered = load(HERE / 'raw-family-neutral-parts-v2.py').run(HERE, PARTS, controls)
    assert len(rendered) == 18
    return {'parts': {name: record(path) for name, path in rendered.items()}}


def render_body(stage, routing):
    neutral = receipt('neutral-parts')
    registration = receipt('register')
    quiet = stage in ACTIONS
    if quiet:
        master = verified(registration['views']['down'])
        controls = read(HERE / 'raw-body-quiet-controls-v1.json')
        core = load(HERE / 'raw-body-quiet-v1.py')
    else:
        view, phases = MOVEMENT[stage]
        verified(registration['views'][view])
        for name, item in neutral['parts'].items():
            if name.startswith(view + '-'):
                verified(item)
        controls = read(HERE / 'raw-body-actor-controls-prep-v1.json')
        if view in ('down', 'up'):
            version = 'v2' if view == 'down' else 'v1'
            core = load(HERE / f'raw-body-cardinal-{view}-{version}.py')
        else:
            core = load(HERE / 'raw-body-profile-v1.py')
            controls = {**controls['fields'][view], 'sourcePivot': controls['groundPivot'],
                        'sourceFigurePixels': controls['sourceFigure']}
    out = ROOT / 'body-v1' / stage
    out.mkdir(parents=True)
    if quiet:
        poses = core.run(master, out, controls, stage, range(16))
    elif view in ('down', 'up'):
        poses = core.run(HERE, out, controls, phases)
    else:
        poses = core.run(HERE, out, controls, phases, view)
    expected = {role for role, route in routing['roles'].items() if route['stage'] == stage}
    assert set(poses) == expected
    rows = {}
    for role, result in poses.items():
        source = record(result['source'])
        assert source['path'] == routing['roles'][role]['relativeSource']
        if quiet:
            field = result['sourceField']
            numeric = digest_fields(field, True)
            assert numeric == {'sha256': result['fieldSHA256'], 'bytes': result['fieldBytes']}
            native = {tier: {'sha256': sha(data), 'bytes': len(data)}
                      for tier, data in result['nativeBytes'].items()}
            rows[role] = {'source': source, 'field': field, 'fieldDigest': numeric, 'quietNative': native}
        else:
            field = result['sourceFields']
            numeric = digest_fields(field, False)
            assert numeric == {'sha256': result['fieldPairSHA256'], 'bytes': result['fieldPairBytes']}
            rows[role] = {'source': source, 'field': field, 'fieldDigest': numeric}
    return {'roles': rows, 'idleWrapIndependent': stage == 'idle'}


def source_roles(routing, required):
    needed = set(required)
    selected = {}
    stages = {}
    for role, route in routing['roles'].items():
        if role not in needed:
            continue
        stage = route['stage']
        if stage not in stages:
            stages[stage] = receipt(stage)
        owner = stages[stage]
        if stage == 'register':
            row = {'source': owner['views'][role.removeprefix('neutral-')]}
        elif stage == 'neutral-parts':
            row = {'source': owner['parts'][Path(route['relativeSource']).name]}
        else:
            row = owner['roles'][role]
        assert row['source']['path'] == route['relativeSource']
        verified(row['source'])
        if 'field' in row:
            assert digest_fields(row['field'], 'quietNative' in row) == row['fieldDigest']
        selected[role] = row
    assert set(selected) == needed
    return selected


def pack_native(tier, routing):
    # The renderer needs the full role table; the standing stage validates the one
    # input it consumes and supplies the remaining role names for topology only.
    needed = [routing['standingSourceRole']] if tier == 'standing' else routing['roles']
    sources = source_roles(routing, needed)
    all_roles = dict.fromkeys(routing['roles']) | sources
    core = load(HERE / 'raw-body-native-v2.py')
    out = ROOT / 'native-v1' / tier
    out.mkdir(parents=True)
    path, size, cells, cache = core.run(ROOT, out, tier, routing, all_roles)
    assert len(cells) == (1 if tier == 'standing' else 412)
    asset = {**record(path), 'width': size[0], 'height': size[1]}
    return {'asset': asset, 'decodedCellCount': len(cells), 'sourceTransforms': cache}


def mouth_group(group, routing, compiler):
    relevant = [
        row for row in routing['cells']
        if row['mouth'] is not None
        and (row['kind'] in ('turn', 'action') if group == 'turn-actions'
             else row['kind'] in ('walk', 'stop', 'bridge') and row['view'] == group)
    ]
    sources = source_roles(routing, [row['role'] for row in relevant])
    rests = receipt('register')['views']
    for item in rests.values():
        verified(item)
    fields = {role: item['field'] for role, item in sources.items() if 'quietNative' in item}
    assert len(fields) == (64 if group == 'turn-actions' else 0)
    controls = read(HERE / 'raw-mouth-physical-controls-v1.json')
    core = load(HERE / 'raw-mouth-registrations-v1.py')
    rows = core.run(ROOT, routing, {role: row['source'] for role, row in sources.items()},
                    rests, controls, compiler, fields, group)
    assert [row['slot'] for row in rows] == [row['slot'] for row in relevant]
    return {'rows': rows, 'visibleSlots': len(rows), 'nativeDensityBindings': 2 * len(rows)}


def assets_from_receipts():
    return {('standing' if tier == 'standing' else 'body-' + tier): receipt('native-' + tier)['asset']
            for tier in TIERS}


def pack_init(routing, tool):
    global plan_transition
    from painted_walk import plan_transition
    assert not DEST.exists() and not MANIFEST.exists()
    cells = {row['slot']: row for row in routing['cells']}
    frames = [None] * 420
    seen = set()
    for group in GROUPS:
        for row in receipt('mouth-' + group)['rows']:
            slot = row['slot']
            cell = cells[slot]
            assert slot not in seen and cell['mouth'] is not None
            assert cell['view'] == row['view'] and cell['role'] == row['role'] and row['bothAxesTransported']
            frames[slot] = row['logicalRegistration']
            seen.add(slot)
    assert len(seen) == 324 and seen == {row['slot'] for row in cells.values() if row['mouth'] is not None}
    assert sum(row['mouth'] is None for row in cells.values()) == 88
    assert sorted(set(range(420)) - set(cells)) == routing['paddingSlots']
    assert routing['standingLogicalSlot'] == 168 and cells[168]['role'] == routing['standingSourceRole']
    assets = assets_from_receipts()
    native = urls(assets)
    person, mouths = metadata(routing, {'privateResidentRelativeDirectory': RELATIVE.as_posix()},
                              native, frames, frames[168])
    scoped = tool.collect_slots(person)
    movement, reactions = set(scoped['movement']), set(scoped['reactions'])
    assert len(movement) == 348 and len(reactions) == 64 and movement | reactions == set(cells)
    DEST.mkdir(parents=True)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    for asset in assets.values():
        path = verified({key: asset[key] for key in ('path', 'sha256', 'bytes')})
        with (DEST / path.name).open('xb') as target:
            target.write(path.read_bytes())
    write_compact_mouths(DEST / 'mouths-v1.json', mouths)
    mouths_ref = record(DEST / 'mouths-v1.json')
    person['mouthPaint'] = {'file': PUBLISH + 'mouths-v1.json', 'sha256': mouths_ref['sha256']}
    write(DEST / 'person.json', person)
    write(MANIFEST, {'schemaVersion': 1, 'characters': {ID: person}})
    return {'definitionSha256': tool.definition_fingerprint(person), 'unboundPerson': record(DEST / 'person.json'),
            'mouthMetadata': mouths_ref}


def pack_step(stage, tool):
    init = receipt('pack-init')
    person_path = DEST / 'person.json'
    person = read(person_path)
    definition = tool.definition_fingerprint(person)
    assert definition == init['definitionSha256']
    assert person['id'] == ID and person['figureWorldHeight'] == 2.33 and person['strideDistance'] == 15.145
    assert read(MANIFEST) == {'schemaVersion': 1, 'characters': {ID: person}}
    verified(init['mouthMetadata'])
    for asset in assets_from_receipts().values():
        assert content(record(DEST / Path(asset['path']).name)) == content(asset)
    if stage in ('build', 'bind'):
        assert record(person_path) == init['unboundPerson'] and 'motionDelivery' not in person
    if stage == 'build':
        assert not PACK.parent.exists()
        result = tool.run(MANIFEST, ID, PACK.parent, check=False, root=ROOT)
        assert result['definitionSha256'] == definition
        return {'packet': record(PACK), 'definitionSha256': definition}
    if stage == 'bind':
        packet = receipt('pack-build')['packet']
        verified(packet)
        assert read(PACK)['definitionSha256'] == definition
        person['motionDelivery'] = {'file': PUBLISH + 'delivery/motion-delivery.json', 'sha256': packet['sha256']}
        write(person_path, person, replace=True)
        write(MANIFEST, {'schemaVersion': 1, 'characters': {ID: person}}, replace=True)
        return {'packet': packet, 'person': record(person_path), 'definitionSha256': definition}
    assert stage == 'check'
    bound = receipt('pack-bind')
    verified(bound['person'])
    packet = verified(bound['packet'])
    assert sha(packet.read_bytes()) == person['motionDelivery']['sha256']
    result = tool.run(MANIFEST, ID, PACK.parent, check=True, root=ROOT)
    assert result['definitionSha256'] == definition
    files = {file.relative_to(DEST).as_posix(): record(file) for file in sorted(DEST.rglob('*')) if file.is_file()}
    assert set(files) == {'person.json', 'standing.webp', 'source-desktop.webp', 'source-mobile.webp',
        'mouths-v1.json', 'delivery/motion-delivery.json', 'delivery/movement-desktop.webp',
        'delivery/movement-mobile.webp', 'delivery/reactions-desktop.webp', 'delivery/reactions-mobile.webp'}
    return {'residentFiles': files, 'definitionSha256': definition}


def snapshot(routing, tool):
    package = receipt('pack-check')
    source_rows = {}
    for role, row in source_roles(routing, routing['roles']).items():
        source_rows[role] = {'source': content(row['source'])}
        for name in ('fieldDigest', 'quietNative'):
            if name in row:
                source_rows[role][name] = row[name]
    native = {}
    for tier in TIERS:
        asset = receipt('native-' + tier)['asset']
        native[tier] = content(record(verified({k: asset[k] for k in ('path', 'sha256', 'bytes')})))
    mouths = {}
    for group in GROUPS:
        rows = receipt('mouth-' + group)['rows']
        mouths[group] = {'slots': [row['slot'] for row in rows],
                         'typedRowsSha256': tool.definition_fingerprint({'rows': rows})}
    registered = {view: content(record(verified(item))) for view, item in receipt('register')['views'].items()}
    neutral = {name: content(record(verified(item))) for name, item in receipt('neutral-parts')['parts'].items()}
    resident = {name: content(record(verified(item))) for name, item in package['residentFiles'].items()}
    return {'schemaVersion': 1, 'actor': ID, 'authored': {'height': 2.33, 'stride': 15.145},
            'routingSha256': record(HERE / 'family-routing-v1.json')['sha256'],
            'registered': registered, 'neutralParts': neutral, 'sourceRoles': source_rows,
            'native': native, 'mouthGroups': mouths, 'residentFiles': resident,
            'typedDefinitionSha256': package['definitionSha256']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mirror', required=True, type=Path)
    parser.add_argument('--stage', required=True, choices=STAGES)
    parser.add_argument('--compiler', type=Path)
    parser.add_argument('--compiler-sha')
    parser.add_argument('--packer', type=Path)
    parser.add_argument('--packer-sha')
    parser.add_argument('--baseline', type=Path)
    args = parser.parse_args()
    if args.mirror.resolve() != ROOT or (ROOT / '.git').exists():
        parser.error('Use the actor script copied into a disposable non-Git mirror')
    if args.stage != 'compare' and args.baseline is not None:
        parser.error('The comparison baseline is only accepted after generation')
    sys.path.insert(0, str(SHARED))
    stage = args.stage
    routing = read(HERE / 'family-routing-v1.json')
    assert routing['actor'] == ID and routing['selectedCells'] == 412
    assert routing['uniqueSourceRoles'] == len(routing['roles']) == 328
    assert not (RECEIPTS / (stage + '.json')).exists()
    RECEIPTS.mkdir(exist_ok=True)
    if stage == 'register':
        result = register(routing)
    elif stage == 'neutral-parts':
        result = parts()
    elif stage in BODY:
        result = render_body(stage, routing)
    elif stage.startswith('native-'):
        result = pack_native(stage.removeprefix('native-'), routing)
    elif stage.startswith('mouth-'):
        result = mouth_group(stage.removeprefix('mouth-'), routing, official(args, 'compiler'))
    elif stage == 'pack-init':
        result = pack_init(routing, official(args, 'packer'))
    elif stage.startswith('pack-'):
        result = pack_step(stage.removeprefix('pack-'), official(args, 'packer'))
    else:
        if args.baseline is None:
            parser.error('Compare requires an explicit external postgeneration baseline')
        assert not args.baseline.resolve().is_relative_to(ROOT)
        result = snapshot(routing, official(args, 'packer'))
        expected = read(args.baseline.resolve())
        assert result == expected, ('Source replay comparison differs',
                                    [key for key in result if result[key] != expected.get(key)])
    path = RECEIPTS / (stage + '.json')
    write(path, {'status': 'PASS', 'stage': stage, **result})
    print(json.dumps({'stage': stage, 'receipt': record(path)}), flush=True)


if __name__ == '__main__':
    main()
