import {layout} from '../assets/models/berghain/layout.mjs';

export const exteriorTarget = layout.exteriorBounds.min.map((value, axis) => (value + layout.exteriorBounds.max[axis]) / 2);

export function fitExteriorRadius(aspect, angle, polar) {
  const tangent = Math.tan(Math.PI / 8), target = exteriorTarget;
  const outward = [Math.sin(angle) * Math.sin(polar), Math.cos(polar), Math.cos(angle) * Math.sin(polar)];
  const right = [Math.cos(angle), 0, -Math.sin(angle)];
  const up = [-Math.sin(angle) * Math.cos(polar), Math.sin(polar), -Math.cos(angle) * Math.cos(polar)];
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  let radius = 115;
  const {min, max} = layout.exteriorBounds;
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) {
    const relative = [x - target[0], y - target[1], z - target[2]];
    radius = Math.max(radius, dot(relative, outward) + Math.max(Math.abs(dot(relative, right)) / (tangent * aspect * .9),
      Math.abs(dot(relative, up)) / (tangent * .9)));
  }
  return radius;
}
