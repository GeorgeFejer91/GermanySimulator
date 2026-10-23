export const visitorRadius = .28;
export const eyeHeight = 1.68;
const footprint = [[0, 0], [visitorRadius, 0], [-visitorRadius, 0], [0, visitorRadius], [0, -visitorRadius],
  [.198, .198], [-.198, .198], [.198, -.198], [-.198, -.198]];

function inPolygon(x, z, polygon) {
  let sign = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const cross = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if (Math.abs(cross) < 1e-8) continue;
    if (sign && cross * sign < 0) return false;
    sign = Math.sign(cross);
  }
  return true;
}

function heightAt(floor, x, z) {
  if (floor.endY === undefined) return floor.y;
  let fraction = (z - floor.z[0]) / (floor.z[1] - floor.z[0]);
  if (floor.rampAxis) {
    const [a, b] = floor.rampAxis, dx = b[0] - a[0], dz = b[1] - a[1];
    fraction = ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz);
  }
  return floor.y + (floor.endY - floor.y) * Math.max(0, Math.min(1, fraction));
}

function surfaceHeight(floor, x, z) {
  if (x < floor.x[0] || x > floor.x[1] || z < floor.z[0] || z > floor.z[1]) return null;
  if (floor.polygon && !inPolygon(x, z, floor.polygon)) return null;
  return heightAt(floor, x, z);
}

function supportedHeight(position, space) {
  const candidates = [...new Set(footprint.flatMap(([dx, dz]) => space.floors.map(floor => surfaceHeight(floor, position.x + dx, position.z + dz)))
    .filter(height => height !== null && Math.abs(height - position.y) < .36))]
    .sort((a, b) => b - a);
  for (const height of candidates) {
    const supported = footprint
      .every(([dx, dz]) => space.floors.some(floor => {
        const sample = surfaceHeight(floor, position.x + dx, position.z + dz);
        const length = floor.rampAxis ? Math.hypot(floor.rampAxis[1][0] - floor.rampAxis[0][0], floor.rampAxis[1][1] - floor.rampAxis[0][1]) : floor.z[1] - floor.z[0];
        // A body's rear support point is lower on a ramp when stepping onto its
        // landing. Keep the per-move step limit, but account for that slope.
        const slopeAllowance = floor.endY === undefined ? 0 : visitorRadius * Math.abs(floor.endY - floor.y) / length;
        return sample !== null && Math.abs(sample - height) < .36 + slopeAllowance;
      }));
    if (supported) return height;
  }
  return null;
}

export function canStand(position, space) {
  if (supportedHeight(position, space) === null) return false;
  return !space.solids.some(solid => bodyIntersects(position, solid));
}

function bodyIntersects(position, solid) {
    const height = position.y;
    const dx = position.x - Math.max(solid.x[0], Math.min(position.x, solid.x[1]));
    const dz = position.z - Math.max(solid.z[0], Math.min(position.z, solid.z[1]));
    if (dx * dx + dz * dz >= visitorRadius * visitorRadius - 1e-8) return false;
    if (solid.polygon && !inPolygon(position.x, position.z, solid.polygon)) {
      const close = solid.polygon.some((a, index) => {
        const b = solid.polygon[(index + 1) % solid.polygon.length], ex = b[0] - a[0], ez = b[1] - a[1];
        const t = Math.max(0, Math.min(1, ((position.x - a[0]) * ex + (position.z - a[1]) * ez) / (ex * ex + ez * ez)));
        return Math.hypot(position.x - a[0] - t * ex, position.z - a[1] - t * ez) < visitorRadius - 1e-8;
      });
      if (!close) return false;
    }
    if (solid.ramp) {
      const rampHeight = heightAt(solid.ramp, position.x, position.z);
      return Math.abs(height - rampHeight) > .1 && height < rampHeight && height + 1.8 > rampHeight - .15;
    }
    if (solid.undersideOnly && (height >= solid.y[0] ||
      (solid.treadFloor && height >= heightAt(solid.treadFloor, position.x, position.z) - .1))) return false;
    return height + 1.8 > solid.y[0] && height + .08 < solid.y[1];
}

function recoverVisitor(position, space) {
  const correctedHeight = supportedHeight(position, space);
  if (correctedHeight !== null) {
    const aligned = {...position, y: correctedHeight};
    if (canStand(aligned, space)) return aligned;
  }
  const overlaps = space.solids.filter(solid => bodyIntersects(position, solid));
  const xChoices = [position.x], zChoices = [position.z];
  for (const solid of overlaps) {
    xChoices.push(solid.x[0] - visitorRadius - .001, solid.x[1] + visitorRadius + .001);
    zChoices.push(solid.z[0] - visitorRadius - .001, solid.z[1] + visitorRadius + .001);
  }
  const candidates = xChoices.flatMap(x => zChoices.map(z => ({x, y: position.y, z})))
    .sort((a, b) => Math.hypot(a.x - position.x, a.z - position.z) - Math.hypot(b.x - position.x, b.z - position.z));
  for (const candidate of candidates) {
    const height = supportedHeight(candidate, space);
    if (height === null) continue;
    candidate.y = height;
    if (!canStand(candidate, space)) continue;
    const steps = Math.max(1, Math.ceil(Math.hypot(candidate.x - position.x, candidate.z - position.z) / .08));
    let clear = true;
    for (let i = 1; i <= steps && clear; i++) {
      const fraction = i / steps;
      const sample = {x: position.x + (candidate.x - position.x) * fraction, y: position.y,
        z: position.z + (candidate.z - position.z) * fraction};
      clear = !space.solids.some(solid => !overlaps.includes(solid) && bodyIntersects(sample, solid));
    }
    if (clear) return candidate;
  }
  return {...position};
}

export function moveVisitor(position, displacement, space) {
  const result = canStand(position, space) ? {...position} : recoverVisitor(position, space);
  const count = Math.max(1, Math.ceil(Math.hypot(displacement.x, displacement.z) / .08));
  for (let step = 0; step < count; step++) {
    for (const axis of ['x', 'z']) {
      const next = {...result, [axis]: result[axis] + displacement[axis] / count};
      const height = supportedHeight(next, space);
      if (height === null) continue;
      next.y = height;
      if (canStand(next, space)) Object.assign(result, next);
    }
  }
  return result;
}
