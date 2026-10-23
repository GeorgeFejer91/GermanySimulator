import {calibration} from './calibration.mjs';

const evidence = {
  entrance: {sources: ['P07', 'P08'], confidence: 'Observed form; dimensions and exact profile inferred'},
  masonry: {sources: ['P03', 'P07', 'P08', 'P09'], confidence: 'Observed facade language; individual dimensions inferred'},
  drainage: {sources: ['P07', 'P08'], confidence: 'Observed rainwater elements; locations and sections approximate'},
  roof: {sources: ['G09'], confidence: 'Flat roof plane official; restrained surface seams inferred'},
  halle: {sources: ['A05', 'A06', 'G09'], confidence: 'Official mass; blind-bay and service detailing inferred'},
  weathering: {sources: ['P03', 'P07', 'P08'], confidence: 'Original sparse geometry inspired by observed mineral runoff; exact marks inferred'}
};

export function addExteriorDetails(layout) {
  layout.parts = layout.parts.filter(part => part.name !== 'rainwater downpipe');
  layout.exteriorDetails = {
    assemblies: evidence,
    omission: {name: 'smoking-room bridge', sources: ['I15', 'P08', 'P10'],
      reason: 'Visible form, but attachment bay, section and route endpoint are not established'},
    geometry: 'Original metre-based geometry; no reference photograph or artwork embedded'
  };

  const authoredHeight = (height, hall = false) => {
    const fixed = hall ? 7.05 : 13.25;
    const authoredRoof = hall ? 22 : 24.7;
    const measuredRoof = hall ? calibration.hallRoof : calibration.mainRoof;
    return height <= fixed ? height : fixed + (height - fixed) * (authoredRoof - fixed) / (measuredRoof - fixed);
  };
  const box = (name, center, size, material, evidenceKey) => {
    const part = {name, center, size, material, section: 'shell', shape: 'box',
      sources: evidence[evidenceKey].sources, confidence: evidence[evidenceKey].confidence};
    layout.parts.push(part);
    return part;
  };
  const physical = part => {
    const {center, size} = part;
    layout.solids.push({name: part.name, x: [center[0] - size[0] / 2, center[0] + size[0] / 2],
      y: [center[1] - size[1] / 2, center[1] + size[1] / 2],
      z: [center[2] - size[2] / 2, center[2] + size[2] / 2], renderPart: part});
    return part;
  };
  const beam = (name, start, end, width, material, evidenceKey) => layout.parts.push({
    name, start, end, width, material, section: 'shell', shape: 'beam',
    sources: evidence[evidenceKey].sources, confidence: evidence[evidenceKey].confidence
  });
  const face = (name, axis, fixed, along, y, length, height, depth, outward, material, evidenceKey, hall = false) => {
    const low = authoredHeight(y - height / 2, hall), high = authoredHeight(y + height / 2, hall);
    const center = axis === 'x' ? [along, (low + high) / 2, fixed + Math.sign(fixed) * outward] :
      [fixed + Math.sign(fixed) * outward, (low + high) / 2, along];
    const size = axis === 'x' ? [length, high - low, depth] : [depth, high - low, length];
    return box(name, center, size, material, evidenceKey);
  };

  for (const [axis, fixed, minimum, maximum] of [['x', 22, -22, 22], ['z', -22, -22, 22], ['z', 22, -22, 22]]) {
    const length = maximum - minimum;
    face('main parapet dark soffit', axis, fixed, 0, 20.12, length + .45, .115, .20, .57, 'darkConcrete', 'masonry');
    face('main parapet coping lip', axis, fixed, 0, 20.31, length + .62, .07, .20, .60, 'pale', 'masonry');
    face('main attic lower reveal', axis, fixed, 0, 17.92, length + .12, .055, .055, .32, 'recess', 'masonry');
    face('main plinth drip edge', axis, fixed, 0, 4.38, length + .16, .065, .14, .49, 'stone', 'masonry');
    for (const along of [-17.9, -10.2, 4.8, 14.3]) {
      for (const [y, height] of [[4.53, .12], [9.6, .11], [14.72, .12]]) {
        face('masonry sill underside shadow', axis, fixed, along, y, 1.48, height, .035, .48, 'recess', 'masonry');
      }
    }
  }

  for (const x of [-15, -10, -5, 0, 5, 10, 15]) {
    beam('main roof membrane seam', [x, authoredHeight(calibration.mainRoof + .016), -18],
      [x, authoredHeight(calibration.mainRoof + .016), 18], .026, 'rubber', 'roof');
    beam('Halle roof membrane seam', [x, authoredHeight(calibration.hallRoof + .016, true), -40],
      [x, authoredHeight(calibration.hallRoof + .016, true), -26], .026, 'rubber', 'roof');
  }

  for (const side of [-1, 1]) {
    const x = side * 22;
    for (const z of [-16.2, 16.2]) {
      const pipeX = side * 22.63;
      const pipeTop = authoredHeight(19.67);
      physical(box('rainwater pipe vertical', [pipeX, (.62 + pipeTop) / 2, z],
        [.105, pipeTop - .62, .105], 'rust', 'drainage'));
      beam('rainwater pipe upper offset', [pipeX, authoredHeight(19.67), z],
        [side * 22.82, authoredHeight(20.02), z], .105, 'rust', 'drainage');
      beam('rainwater pipe shoe', [pipeX, .62, z], [side * 22.82, .26, z + .1], .12, 'rust', 'drainage');
      physical(box('rainwater pipe shoe casing', [side * 22.72, .44, z + .05],
        [.25, .50, .24], 'rust', 'drainage'));
      for (const y of [1.25, 4.48, 8.8, 13.05, 17.3]) {
        face('rainwater pipe wall strap', 'z', x, z, y, .24, .09, .12, .56, 'steel', 'drainage');
      }
    }
  }

  face('entrance outer stone lintel', 'x', 22, 0, 4.22, 4.45, .18, .37, .49, 'stone', 'entrance');
  face('entrance lintel shadow course', 'x', 22, 0, 3.86, 3.44, .08, .06, .34, 'recess', 'entrance');
  for (const side of [-1, 1]) {
    physical(face('entrance layered stone reveal', 'x', 22, side * 1.84, 1.93, .20, 3.67, .12, .51, 'stone', 'entrance'));
    physical(face('entrance inner steel rebate', 'x', 22, side * 1.64, 1.83, .065, 3.42, .055, .50, 'steel', 'entrance'));
    physical(face('entrance stone plinth return', 'x', 22, side * 2.08, .38, .34, .7, .18, .53, 'stone', 'entrance'));
  }
  face('entrance threshold', 'x', 22, 0, .025, 3.25, .05, .24, .61, 'stone', 'entrance');
  for (const x of [-1.85, 1.85]) {
    face('entrance fixing plate', 'x', 22, x, 3.28, .14, .18, .025, .61, 'steel', 'entrance');
  }

  for (const side of [-1, 1]) {
    const x = side * 22;
    physical(face('Halle side continuous base course', 'z', x, -33, 1.05, 22, .18, .12, .31, 'stone', 'halle', true));
    face('Halle side lower string course', 'z', x, -33, 4.38, 22, .16, .20, .34, 'stone', 'halle', true);
    face('Halle side upper string course', 'z', x, -33, 17.82, 22, .15, .17, .32, 'pale', 'halle', true);
    face('Halle side roof edge soffit', 'z', x, -33, 22.56, 22.1, .15, .19, .38, 'darkConcrete', 'halle', true);
    face('Halle side coping', 'z', x, -33, 22.72, 22.3, .085, .20, .41, 'pale', 'halle', true);
    for (const z of [-40.7, -36.5, -32.3, -28.1]) {
      face('Halle side pier', 'z', x, z, 10.93, .43, 13.05, .22, .35, 'concrete', 'halle', true);
      face('Halle blind masonry bay', 'z', x, z + 2.05, 10.8, 3.05, 12.6, .08, .31, 'recess', 'halle', true);
      face('Halle upper blind panel', 'z', x, z + 2.05, 19.75, 2.3, 1.95, .045, .32, 'concrete', 'halle', true);
      face('Halle bay sill', 'z', x, z + 2.05, 4.69, 3.15, .12, .19, .41, 'stone', 'halle', true);
      face('Halle bay lintel', 'z', x, z + 2.05, 17.55, 3.15, .12, .16, .39, 'stone', 'halle', true);
    }
  }

  physical(face('Halle rear base course', 'x', -44, 0, 1.05, 44, .18, .12, .30, 'stone', 'halle', true));
  face('Halle rear lower string course', 'x', -44, 0, 4.38, 44, .16, .20, .34, 'stone', 'halle', true);
  face('Halle rear upper string course', 'x', -44, 0, 17.82, 44, .16, .18, .34, 'pale', 'halle', true);
  face('Halle rear roof edge soffit', 'x', -44, 0, 22.56, 44.1, .15, .19, .38, 'darkConcrete', 'halle', true);
  face('Halle rear coping', 'x', -44, 0, 22.72, 44.3, .085, .20, .41, 'pale', 'halle', true);
  for (const x of [-18, -12, -6, 0, 6, 12, 18]) {
    face('Halle rear pier', 'x', -44, x, 10.92, .48, 13.05, .20, .35, 'concrete', 'halle', true);
    face('Halle rear blind panel', 'x', -44, x, 11.0, 3.78, 12.5, .06, .30, 'recess', 'halle', true);
    face('Halle rear panel sill', 'x', -44, x, 4.69, 3.9, .12, .18, .39, 'stone', 'halle', true);
    face('Halle rear panel head', 'x', -44, x, 17.55, 3.9, .12, .18, .39, 'stone', 'halle', true);
    face('Halle rear high vent inset', 'x', -44, x, 20.2, 1.45, 1.03, .035, .36, 'rubber', 'halle', true);
    for (let slat = 0; slat < 5; slat++) {
      face('Halle rear vent louvre', 'x', -44, x, 19.82 + slat * .18, 1.42, .045, .065, .39, 'steel', 'halle', true);
    }
  }

  for (const x of [-13.5, 13.5]) {
    physical(face('Halle closed service door', 'x', -44, x, 1.76, 2.55, 3.35, .07, .39, 'steel', 'halle', true));
    for (const side of [-1, 1]) {
      physical(face('Halle service door jamb', 'x', -44, x + side * 1.32, 1.76, .14, 3.43, .13, .47, 'stone', 'halle', true));
    }
    face('Halle service lintel', 'x', -44, x, 3.52, 2.86, .15, .15, .47, 'stone', 'halle', true);
    physical(face('Halle door kick plate', 'x', -44, x, .48, 2.38, .62, .025, .47, 'rust', 'halle', true));
  }

  for (const [axis, fixed, along, y, width, height] of [
    ['x', 22, -15.6, 4.03, .33, .72], ['x', 22, 10.7, 4.05, .24, .56],
    ['x', 22, 17.7, 17.25, .24, .8], ['z', -22, -12.4, 4.02, .28, .67],
    ['z', 22, 7.2, 17.4, .31, .87], ['z', 22, -13.5, 4.04, .19, .6],
    ['x', -44, -5.2, 17.7, .42, .95], ['x', -44, 16, 4.35, .3, .78]
  ]) {
    const hall = fixed === -44;
    face('mineral runoff upper', axis, fixed, along, y, width, height, .014, hall ? .44 : .67,
      'recess', 'weathering', hall);
    face('mineral runoff tail', axis, fixed, along + width * .25, y - height * .55,
      width * .37, height * .46, .013, hall ? .45 : .68, 'recess', 'weathering', hall);
  }
}
