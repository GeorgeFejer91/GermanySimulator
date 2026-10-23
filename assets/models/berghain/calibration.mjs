import {survey} from './survey-data.mjs';

export const mainPartId = 'DEBE3DqCCB6bZkIF';
export const hallPartId = 'DEBE3DhgwVF7HsU2';
export const annexPartIds = survey.parts.filter(part => ![mainPartId, hallPartId].includes(part.id)).map(part => part.id);
const ground = part => part.surfaces.find(surface => surface.type === 'GroundSurface').polygons[0].outer;
const main = survey.parts.find(part => part.id === mainPartId), hall = survey.parts.find(part => part.id === hallPartId);
const mainGround = ground(main), hallGround = ground(hall);
const front = mainGround.filter(point => point[2] > 21.99).sort((a, b) => a[0] - b[0]);
const join = mainGround.filter(point => point[2] < -14.9).sort((a, b) => a[0] - b[0]);
const rear = hallGround.filter(point => point[2] < -54.5).sort((a, b) => a[0] - b[0]);
const roofHeight = part => Math.max(...part.surfaces.filter(surface => surface.type === 'RoofSurface').flatMap(surface => surface.polygons.flatMap(polygon => polygon.outer.map(point => point[1]))));
export const calibration = {frontage: survey.frontage, mainRoof: roofHeight(main), hallRoof: roofHeight(hall),
  sources: ['G07', 'G08', 'G09'], status: 'Exterior mass fitted to official LoD2; interiors approximate'};

export function studyToSite(position) {
  const {x, y, z} = position, u = (x + 22) / 44;
  const northern = z < -22, a = northern ? join : front, b = northern ? rear : join;
  const v = northern ? (-22 - z) / 22 : (22 - z) / 44;
  const along = edge => edge[0].map((value, axis) => value + u * (edge[edge.length - 1][axis] - value));
  const start = along(a), end = along(b);
  return {x: start[0] + v * (end[0] - start[0]), y, z: start[2] + v * (end[2] - start[2])};
}

const vector = (point, vertical = value => value) => {
  const result = studyToSite({x: point[0], y: point[1], z: point[2]});
  return [result.x, vertical(point[1]), result.z];
};
const quad = (x, z) => [[x[0], 0, z[0]], [x[1], 0, z[0]], [x[1], 0, z[1]], [x[0], 0, z[1]]].map(point => {
  const mapped = vector(point); return [mapped[0], mapped[2]];
});
const range = (polygon, axis) => [Math.min(...polygon.map(point => point[axis])), Math.max(...polygon.map(point => point[axis]))];

export function calibrateStudy(layout, viewpoints) {
  layout.calibration = calibration;
  layout.confidence = calibration.status;
  layout.parts = layout.parts.filter(part => part.section !== 'roof');
  for (const part of layout.parts) {
    const isNorth = (part.center?.[2] ?? part.start?.[2] ?? 0) < -22;
    const structural = ['shell', 'structure'].includes(part.section);
    const roof = isNorth ? calibration.hallRoof : calibration.mainRoof;
    const oldRoof = isNorth ? 22 : 24.7, fixed = isNorth ? 7.05 : 13.25;
    const vertical = y => structural && y > fixed ? fixed + (y - fixed) * (roof - fixed) / (oldRoof - fixed) : y;
    if (part.shape === 'beam') {
      part.start = vector(part.start, vertical); part.end = vector(part.end, vertical);
      continue;
    }
    const corners = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      corners.push({sign: [x, y, z], point: vector(part.center.map((value, axis) => value + [x, y, z][axis] * part.size[axis] / 2), vertical)});
    }
    const mean = entries => [0, 1, 2].map(axis => entries.reduce((sum, entry) => sum + entry.point[axis], 0) / entries.length);
    const center = mean(corners), axes = [0, 1, 2].map(axis => {
      const low = mean(corners.filter(corner => corner.sign[axis] < 0)), high = mean(corners.filter(corner => corner.sign[axis] > 0));
      return high.map((value, i) => value - low[i]);
    });
    part.matrix = [...axes[0], 0, ...axes[1], 0, ...axes[2], 0, ...center, 1];
    part.center = center; part.size = axes.map(axis => Math.hypot(...axis));
  }
  for (const floor of layout.floors) {
    floor.polygon = quad(floor.x, floor.z);
    if (floor.endY !== undefined) floor.rampAxis = [
      floor.polygon[0].map((value, i) => (value + floor.polygon[1][i]) / 2),
      floor.polygon[3].map((value, i) => (value + floor.polygon[2][i]) / 2)];
    floor.x = range(floor.polygon, 0); floor.z = range(floor.polygon, 1);
  }
  for (const solid of layout.solids) {
    solid.polygon = quad(solid.x, solid.z);
    solid.x = range(solid.polygon, 0); solid.z = range(solid.polygon, 1);
    if (solid.renderPart) {
      const matrix = solid.renderPart.matrix;
      const radius = (Math.abs(matrix[1]) + Math.abs(matrix[5]) + Math.abs(matrix[9])) / 2;
      solid.y = [matrix[13] - radius, matrix[13] + radius];
    }
  }
  for (const id of annexPartIds) {
    const part = survey.parts.find(part => part.id === id), polygon = ground(part).map(point => [point[0], point[2]]);
    layout.solids.push({name: 'unmodelled official annex ' + id, polygon, x: range(polygon, 0), z: range(polygon, 1),
      y: [0, Math.max(...part.surfaces.flatMap(surface => surface.polygons.flatMap(polygon => polygon.outer.map(point => point[1]))))]});
  }
  const band = hall.surfaces.find(surface => surface.type === 'WallSurface' && surface.polygons.every(polygon => polygon.outer.every(point => point[2] > -15.05))).polygons[0].outer;
  const a = band[0], b = band[1];
  const wallPolygon = [[a[0], a[2] - .08], [b[0], b[2] - .08], [b[0], b[2] + .08], [a[0], a[2] + .08]];
  layout.solids.push({name: 'Halle upper front wall', polygon: wallPolygon, x: range(wallPolygon, 0), z: range(wallPolygon, 1),
    y: [calibration.mainRoof, calibration.hallRoof]});
  for (const view of Object.values(viewpoints)) {
    view.position = studyToSite(view.position);
    view.sources = [...new Set([...view.sources, ...calibration.sources])];
  }
  const points = survey.parts.flatMap(part => part.surfaces.flatMap(surface => surface.polygons.flatMap(polygon => polygon.outer)));
  for (const part of layout.parts.filter(part => part.section === 'shell')) {
    if (part.matrix) {
      const m = part.matrix;
      for (const x of [-.5, .5]) for (const y of [-.5, .5]) for (const z of [-.5, .5]) {
        points.push([0, 1, 2].map(axis => m[12 + axis] + m[axis] * x + m[4 + axis] * y + m[8 + axis] * z));
      }
    } else for (const endpoint of [part.start, part.end]) {
      points.push(endpoint.map(value => value - part.width / 2), endpoint.map(value => value + part.width / 2));
    }
  }
  layout.exteriorBounds = {min: [0, 1, 2].map(axis => Math.min(...points.map(point => point[axis])) - .1),
    max: [0, 1, 2].map(axis => Math.max(...points.map(point => point[axis])) + .1)};
}
