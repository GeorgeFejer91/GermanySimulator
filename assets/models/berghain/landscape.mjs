export const landscapeMaterials = {
  paving: {color: '#696d68', roughness: 1},
  pathStone: {color: '#96958b', roughness: 1},
  bedSoil: {color: '#41453e', roughness: 1},
  bark: {color: '#51483d', roughness: 1},
  leafDark: {color: '#34483a', roughness: 1},
  leafMuted: {color: '#53654a', roughness: 1},
  leafSilver: {color: '#657260', roughness: 1},
  grass: {color: '#55604a', roughness: 1},
  meshScreen: {color: '#4f5752', roughness: .8, metalness: .5, transparent: true, opacity: .18}
};

export function addLandscape(layout) {
  const obsolete = new Set(['garden bar', 'garden boundary', 'garden east boundary', 'garden seat', 'queue post', 'queue rail']);
  layout.parts = layout.parts.filter(part => !obsolete.has(part.name));
  layout.solids = layout.solids.filter(solid => !obsolete.has(solid.name));
  layout.landscape = {confidence: 'Photo-informed industrial site study; placement and planting inferred',
    sources: ['I01', 'P07', 'P08', 'P09', 'P10', 'SITE01', 'SITE02'],
    zones: ['forecourt', 'queue', 'garden', 'service edge'],
    softPlanting: 'High tree crowns are nonblocking; opaque low planting, trunks and grassy mounds have physical bodies'};

  function part(name, center, size, material, shape = 'box', solid = false) {
    const item = {name, center, size, material, shape, section: 'landscape'};
    layout.parts.push(item);
    if (solid) layout.solids.push({name, x: [center[0] - size[0] / 2, center[0] + size[0] / 2],
      y: [center[1] - size[1] / 2, center[1] + size[1] / 2],
      z: [center[2] - size[2] / 2, center[2] + size[2] / 2], renderPart: item});
    return item;
  }
  const box = (name, center, size, material, solid = false) => part(name, center, size, material, 'box', solid);
  const cylinder = (name, center, diameter, height, material, solid = false) =>
    part(name, center, [diameter, height, diameter], material, 'cylinder', solid);
  const sphere = (name, center, size, material, solid = false) => part(name, center, size, material, 'sphere', solid);
  const beam = (name, start, end, width, material) =>
    layout.parts.push({name, start, end, width, material, shape: 'beam', section: 'landscape'});

  box('forecourt concrete apron', [0, .014, 26], [45, .028, 8], 'paving');
  box('entrance approach paving', [0, .017, 37], [6.2, .034, 24], 'pathStone');
  for (let row = 0; row < 11; row++) for (let column = 0; column < 15; column++) {
    const x = -3.35 + column * .48 + (row % 2) * .24;
    box('entrance cobble', [x, .047, 22.6 + row * .47], [.45, .016, .43],
      (row + column) % 5 === 0 ? 'paving' : 'pathStone');
  }
  for (const z of [29, 35, 41, 47]) box('approach expansion joint', [0, .038, z], [6.25, .008, .035], 'rust');
  box('entrance threshold', [0, .04, 22.8], [4.2, .08, 1.4], 'stone');
  for (const x of [-22.7, 22.7]) box('apron gutter', [x, .018, 26], [.36, .035, 8], 'darkConcrete');
  for (const z of [29, 43]) {
    box('forecourt trench drain', [8, .03, z], [4.4, .06, .24], 'steel');
    for (let x = 6; x <= 10; x += .4) box('drain grate tooth', [x, .064, z], [.025, .008, .24], 'darkConcrete');
  }
  for (const x of [-5.5, 5.5]) for (const z of [24, 27.2]) {
    cylinder('entrance bollard', [x, .53, z], .22, 1.06, 'steel', true);
    cylinder('bollard band', [x, .83, z], .235, .1, 'steel');
  }
  for (const x of [-12, -6, 6, 12]) {
    for (const z of [27, 36]) {
      cylinder('fixed queue post', [x, .52, z], .09, 1.04, 'steel', true);
      cylinder('queue post cap', [x, 1.06, z], .14, .07, 'steel');
    }
    box('queue barrier rail', [x, .8, 31.5], [.045, .045, 9], 'steel', true);
  }

  box('garden gravel walk', [29, .064, 12.5], [5.5, .028, 19], 'pathStone');
  box('garden cross walk', [35.3, .064, 2.5], [17.8, .028, 3.4], 'pathStone');
  box('garden outdoor dance slab', [36.5, .078, -5], [12, .04, 7], 'concrete');
  for (const z of [-7, -4, -1.8]) box('dance slab expansion joint', [36.5, .101, z], [12, .006, .025], 'darkConcrete');
  box('garden terrace', [39.5, .066, 12.7], [16, .032, 11], 'paving');
  for (const z of [8.1, 13, 17.8]) box('terrace joint', [39.5, .086, z], [16, .007, .04], 'darkConcrete');
  box('south garden wall west', [24.7, .55, 20.5], [4.4, 1.1, .42], 'concrete', true);
  box('south garden wall east', [40.7, .55, 20.5], [16.6, 1.1, .42], 'concrete', true);
  box('north garden wall', [36, .62, -18.4], [25, 1.24, .42], 'concrete', true);
  box('east garden fence plinth', [48.7, .22, 1], [.42, .44, 39], 'concrete', true);
  box('east garden wire-mesh fence', [48.7, 1.25, 1], [.055, 2.05, 39], 'meshScreen', true);
  for (let z = -18; z <= 20; z += 4.75) {
    cylinder('fence steel post', [48.7, 1.2, z], .12, 2.4, 'steel', true);
  }
  for (const y of [.55, 1.3, 2.25]) beam('fence rail', [48.7, y, -18.5], [48.7, y, 20.5], .06, 'steel');
  for (let z = -18; z <= 20; z += .65) beam('wire-mesh upright', [48.72, .45, z], [48.72, 2.25, z], .014, 'steel');
  box('north garden wall coping', [36, 1.3, -18.4], [25, .12, .52], 'stone');
  box('south garden wall coping', [24.7, 1.17, 20.5], [4.4, .12, .52], 'stone');
  box('south garden wall coping', [40.7, 1.17, 20.5], [16.6, .12, .52], 'stone');
  box('garden gateway lintel', [29.4, 2.45, 20.5], [5, .16, .35], 'steel');
  for (const x of [26.9, 31.9]) cylinder('garden gateway upright', [x, 1.25, 20.5], .11, 2.5, 'steel', true);

  for (const [x, z, sx, sz] of [[34, -13, 12, 7], [43, -14, 8, 7], [46.3, 2.5, 3.5, 9],
    [34.5, 17.7, 7, 3.2], [41.5, 18, 8, 3]]) {
    box('garden planting bed', [x, .061, z], [sx, .022, sz], 'bedSoil');
  }
  for (const [x, z, sx, sz] of [[-31, -10, 7, 18], [30, -29, 7, 17], [-33, 19, 9, 8]]) {
    box('perimeter planting bed', [x, .016, z], [sx, .032, sz], 'bedSoil');
  }
  for (const [x, z, width, depth] of [[35, -11, 2.6, 3.5], [45, 18, 3, 2.3]]) {
    sphere('garden grassy mound', [x, .31, z], [width, .56, depth], 'grass', true);
  }
  for (let x = 25; x <= 29.5; x += .65) {
    const height = 2.2 + (Math.round(x * 7) % 3) * .22;
    cylinder('bamboo edge stem', [x, height / 2, -16.5], .07, height, 'bark', true);
    sphere('bamboo edge foliage', [x, height * .84, -16.5], [.45, .95, .48], 'leafMuted', true);
  }

  function tree(x, z, height, spread, tone) {
    cylinder('tree trunk', [x, height * .31, z], .38, height * .62, 'bark', true);
    beam('tree branch', [x, height * .47, z], [x + spread * .32, height * .67, z + spread * .18], .13, 'bark');
    beam('tree branch', [x, height * .5, z], [x - spread * .33, height * .7, z - spread * .2], .11, 'bark');
    const crowns = [[0, .78, 0, .78], [-.33, .69, -.16, .53], [.37, .71, .18, .55],
      [-.07, .92, .25, .48], [.11, .64, -.32, .48]];
    for (const [dx, dy, dz, scale] of crowns) sphere('tree crown',
      [x + dx * spread, height * dy, z + dz * spread], [spread * scale, spread * scale * .72, spread * scale], tone);
  }
  for (const [x, z, h, s, tone] of [[35, -13, 5.8, 4.7, 'leafMuted'], [44, -13, 6.4, 5, 'leafDark'],
    [45.7, 3, 5.2, 4, 'leafSilver'], [35, 18, 5.5, 4.4, 'leafDark'],
    [-31, -10, 7.8, 5.8, 'leafMuted'], [30, -30, 6.7, 4.8, 'leafDark'], [-33, 18, 7.2, 5.2, 'leafSilver'],
    [-42, -40, 6.8, 4.9, 'leafDark'], [-43, -24, 7.5, 5.2, 'leafMuted'], [-43, -8, 6.5, 4.5, 'leafSilver'],
    [-42, 11, 7.2, 5, 'leafDark'], [-43, 30, 6.9, 4.8, 'leafMuted'], [0, -49, 7.3, 5.3, 'leafSilver'],
    [30, -48, 7, 4.9, 'leafDark']]) {
    tree(x, z, h, s, tone);
  }
  for (const [x, z, width] of [[32, -16, 1.5], [39, -16, 1.7], [46, -16, 1.3], [33, 16.6, 1.5],
    [40, 18, 1.7], [45.5, 18, 1.4], [46.4, 8, 1.5], [-33, 15, 1.8], [29, -34, 1.5],
    [-43, -37, 1.7], [-42, -23, 1.8], [-43, -7, 1.6], [-42, 10, 1.8], [-43, 29, 1.6],
    [-2, -49, 1.7], [29, -47, 1.6]]) {
    sphere('shrub cluster', [x, .8, z], [width, 1.35, width], 'leafDark', true);
    sphere('shrub cluster', [x + width * .4, .65, z + .3], [width * .8, 1.05, width * .8], 'leafMuted', true);
  }

  function bench(x, z, alongX = true) {
    const top = alongX ? [2.4, .12, .56] : [.56, .12, 2.4];
    box('garden bench seat', [x, .5, z], top, 'timber', true);
    for (const end of [-.95, .95]) {
      const offset = alongX ? [end, z] : [0, z + end];
      box('garden bench support', [x + offset[0], .25, offset[1]], alongX ? [.15, .5, .52] : [.52, .5, .15], 'steel', true);
    }
    box('garden bench back', alongX ? [x, .88, z + .3] : [x + .3, .88, z],
      alongX ? [2.4, .65, .12] : [.12, .65, 2.4], 'timber', true);
  }
  bench(38, 8);
  bench(44, 8);
  bench(40, 16);
  bench(45, -6, false);
  box('garden service counter', [44, .64, -8.7], [1.25, 1.28, 4.5], 'timber', true);
  box('service counter top', [44, 1.32, -8.7], [1.52, .1, 4.8], 'stone');
  for (const z of [-10.7, -6.7]) cylinder('service canopy upright', [45.2, 1.35, z], .11, 2.7, 'steel', true);
  box('service canopy', [43.8, 2.75, -8.7], [3.8, .12, 5.2], 'steel');
  for (const [x, z] of [[36, 11], [42, 11], [43, -2]]) {
    cylinder('garden standing table', [x, .96, z], 1.05, .12, 'steel', true);
    cylinder('garden table pedestal', [x, .48, z], .13, .9, 'steel', true);
    cylinder('garden table foot', [x, .04, z], .65, .08, 'steel', true);
  }
  for (const x of [-17, 17]) {
    box('forecourt utility cabinet', [x, .82, 25.1], [1.3, 1.64, .62], 'steel', true);
    box('cabinet inset door', [x, .89, 25.44], [1.04, 1.25, .02], 'darkConcrete');
  }
}
