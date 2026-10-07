/** Original rigid-skinned puppet rig. Metres, Y-up, +Z-front, feet at y=0.
 * Animation is in-place. The simulation, not the model, owns displacement.
 */
export const CLIP_NAMES = Object.freeze(['Idle', 'Walk', 'Talk', 'Gesture']);
export const CLIP_SECONDS = Object.freeze({Idle: 3, Walk: 1.2, Talk: 2, Gesture: 2.4});
export const WALK_DISTANCE = .68;
export const VERSION = 'street-characters-1';
const TAU = Math.PI * 2;

export function createRig(width = 1, height = 1) {
  const raw = [
    ['Root', null, [0, 0, 0]], ['Hips', 'Root', [0, .86, 0]],
    ['Spine', 'Hips', [0, 1.18, 0]], ['Head', 'Spine', [0, 1.51, 0]]
  ];
  for (const [side, sign] of [['L', -1], ['R', 1]]) {
    raw.push([`UpperArm_${side}`, 'Spine', [sign * .34, 1.30, 0]],
      [`LowerArm_${side}`, `UpperArm_${side}`, [sign * .43, 1.065, .015]],
      [`Hand_${side}`, `LowerArm_${side}`, [sign * .47, .85, .07]],
      [`Thigh_${side}`, 'Hips', [sign * .15, .86, 0]],
      [`Shin_${side}`, `Thigh_${side}`, [sign * .15, .47, 0]],
      [`Foot_${side}`, `Shin_${side}`, [sign * .15, .12, 0]]);
  }
  return raw.map(([name, parentName, p]) => {
    const parent = raw.findIndex(bone => bone[0] === parentName);
    const position = [p[0] * width, p[1] * height, p[2]];
    const origin = parent < 0 ? [0, 0, 0] : raw[parent][2].map((v, i) => v * (i === 0 ? width : i === 1 ? height : 1));
    return {name, parent, position, translation: position.map((v, i) => v - origin[i])};
  });
}

function quaternion(x = 0, y = 0, z = 0) {
  const cx = Math.cos(x / 2), sx = Math.sin(x / 2), cy = Math.cos(y / 2), sy = Math.sin(y / 2), cz = Math.cos(z / 2), sz = Math.sin(z / 2);
  return [sx * cy * cz + cx * sy * sz, cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz, cx * cy * cz - sx * sy * sz];
}
const clamp = v => Math.max(-1, Math.min(1, v));

/** Absolute local pose, never cumulative transforms; t is a cycle fraction. */
export function samplePose(model, clip, t) {
  if (!CLIP_NAMES.includes(clip)) throw new RangeError(`Unknown clip: ${clip}`);
  if (!Number.isFinite(t)) throw new TypeError('Finite animation phase required');
  const phase = ((t % 1) + 1) % 1, a = phase * TAU, height = model.height;
  const pose = Object.fromEntries(model.rig.map(b => [b.name, {translation: [...b.translation], rotation: [0, 0, 0, 1]}]));
  const rotate = (name, x = 0, y = 0, z = 0) => {pose[name].rotation = quaternion(x, y, z);};
  if (clip === 'Walk') {
    const drop = (-.038 + .008 * Math.cos(a * 2)) * height;
    pose.Hips.translation[1] += drop;
    for (const [side, offset] of [['L', 0], ['R', .5]]) {
      const p = (phase + offset) % 1, swing = p >= .5, u = (p - .5) * 2;
      const z = swing ? -.17 + .34 * (u - Math.sin(TAU * u) / TAU) : .17 - .68 * p;
      const lift = swing ? .095 * height * Math.sin(Math.PI * u) ** 2 : 0;
      const down = .74 * height + drop - lift, l1 = .39 * height, l2 = .35 * height;
      const distance = Math.min(Math.hypot(down, z), l1 + l2 - 1e-7);
      const thigh = Math.atan2(-z, down) - Math.acos(clamp((l1 * l1 + distance * distance - l2 * l2) / (2 * l1 * distance)));
      const knee = Math.PI - Math.acos(clamp((l1 * l1 + l2 * l2 - distance * distance) / (2 * l1 * l2)));
      rotate(`Thigh_${side}`, thigh); rotate(`Shin_${side}`, knee);
      rotate(`Foot_${side}`, -thigh - knee);
      const arm = -Math.sin((p + .25) * TAU) * (model.carry[side] ? .035 : .26);
      rotate(`UpperArm_${side}`, arm);
      rotate(`LowerArm_${side}`, -.025 - Math.abs(arm) * .18);
    }
    rotate('Spine', 0, Math.sin(a) * .025, 0);
    rotate('Head', -.015, Math.sin(a) * -.035, 0);
  } else {
    rotate('Spine', Math.sin(a) * .009, Math.sin(a) * .012, 0);
    rotate('Head', .01 * Math.sin(a + .4), .035 * Math.sin(a), -.015);
    if (clip === 'Talk') {
      rotate('Head', Math.sin(a * 2) * .045, Math.sin(a) * .075, -.015);
      // Gestures remain restrained while carrying full-length tools.
      rotate('UpperArm_R', -.09 - .06 * Math.sin(a), .035 * Math.sin(a), -.035);
      rotate('LowerArm_R', -.04 - .035 * Math.sin(a * 2));
    }
    if (clip === 'Gesture') {
      const pulse = .5 - .5 * Math.cos(a);
      if (model.id === 'kehrwoche') {
        rotate('UpperArm_R', 0, 0, -.10 * pulse);
        rotate('Head', .13 * pulse, -.08 * pulse, 0);
      } else if (model.id === 'pendler' || model.id === 'warteschlange') {
        rotate('UpperArm_L', -.34 * pulse, .16 * pulse, .05 * pulse);
        rotate('LowerArm_L', -.48 * pulse);
        rotate('Head', .19 * pulse, -.19 * pulse, 0);
      } else if (model.id === 'wanderer') {
        rotate('Head', -.12 * pulse, .25 * Math.sin(a), 0);
        rotate('UpperArm_R', -.07 * pulse);
      } else {
        rotate('UpperArm_R', -.35 * pulse, -.12 * pulse, -.10 * pulse);
        rotate('LowerArm_R', -.28 * pulse);
        rotate('Head', .03 * pulse, .14 * pulse, -.025);
      }
    }
  }
  return pose;
}

export function animationTracks(model, clip) {
  const frames = 32, duration = CLIP_SECONDS[clip];
  const times = Array.from({length: frames + 1}, (_, i) => i * duration / frames);
  const poses = times.map((_, i) => samplePose(model, clip, i === frames ? 0 : i / frames));
  const tracks = [];
  for (const bone of model.rig) {
    for (const [path, count] of [['rotation', 4], ['translation', 3]]) {
      const values = poses.flatMap(p => p[bone.name][path]);
      const first = values.slice(0, count);
      // Omit constant tracks. Unanimated bones retain their bind transforms.
      if (!values.some((v, i) => Math.abs(v - first[i % count]) > 1e-7)) continue;
      tracks.push({bone: bone.name, path, count, times, values});
    }
  }
  return tracks;
}

/** glTF 2.0 with one vertex-coloured primitive, a real skin and four clips. */
export function encodeCharacterGLB(model) {
  const bufferViews = [], accessors = [], blocks = []; let byteLength = 0;
  function attribute(values, type, componentType = 5126, normalized = false, target) {
    const sizes = {SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16}, count = sizes[type];
    const bytesPer = componentType === 5121 ? 1 : componentType === 5123 ? 2 : 4;
    const bytes = new Uint8Array(values.length * bytesPer), data = new DataView(bytes.buffer);
    values.forEach((v, i) => {
      if (!Number.isFinite(v)) throw new TypeError('Nonfinite GLB attribute');
      if (componentType === 5121) data.setUint8(i, v);
      else if (componentType === 5123) data.setUint16(i * 2, v, true);
      else if (componentType === 5125) data.setUint32(i * 4, v, true);
      else data.setFloat32(i * 4, v, true);
    });
    const bufferView = {buffer: 0, byteOffset: byteLength, byteLength: bytes.length};
    if (target) bufferView.target = target;
    bufferViews.push(bufferView);
    const padded = new Uint8Array((bytes.length + 3) & ~3); padded.set(bytes); blocks.push(padded); byteLength += padded.length;
    const accessor = {bufferView: bufferViews.length - 1, componentType, count: values.length / count, type};
    if (normalized) accessor.normalized = true;
    if (type === 'SCALAR' || (type === 'VEC3' && target === 34962)) {
      accessor.min = Array(count).fill(Infinity); accessor.max = Array(count).fill(-Infinity);
      values.forEach((v, i) => {const k = i % count, n = componentType === 5126 ? Math.fround(v) : v; accessor.min[k] = Math.min(accessor.min[k], n); accessor.max[k] = Math.max(accessor.max[k], n);});
    }
    accessors.push(accessor); return accessors.length - 1;
  }
  const attributes = {
    POSITION: attribute(model.positions, 'VEC3', 5126, false, 34962),
    NORMAL: attribute(model.normals, 'VEC3', 5126, false, 34962),
    COLOR_0: attribute(model.colors, 'VEC3', 5126, false, 34962),
    JOINTS_0: attribute(model.joints.flatMap(j => [j, 0, 0, 0]), 'VEC4', 5121, false, 34962),
    WEIGHTS_0: attribute(model.joints.flatMap(() => [255, 0, 0, 0]), 'VEC4', 5121, true, 34962)
  };
  const indices = attribute(model.indices, 'SCALAR', model.joints.length > 65535 ? 5125 : 5123, false, 34963);
  const nodes = [{name: model.id, children: [2], extras: {status: 'candidate-unapproved', version: VERSION, features: model.features}}, {name: `${model.id}_mesh`, mesh: 0, skin: 0}];
  model.rig.forEach(b => nodes.push({name: b.name, translation: b.translation}));
  model.rig.forEach((b, i) => {if (b.parent >= 0) (nodes[b.parent + 2].children ||= []).push(i + 2);});
  const inverse = model.rig.flatMap(({position: [x, y, z]}) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -x, -y, -z, 1]);
  const skin = {name: `${model.id}_rig`, joints: model.rig.map((_, i) => i + 2), skeleton: 2, inverseBindMatrices: attribute(inverse, 'MAT4')};
  const animations = CLIP_NAMES.map(name => {
    const samplers = [], channels = [], tracks = animationTracks(model, name);
    const input = attribute(tracks[0].times, 'SCALAR');
    for (const track of tracks) {
      const sampler = samplers.length;
      samplers.push({input, output: attribute(track.values, track.count === 4 ? 'VEC4' : 'VEC3'), interpolation: 'LINEAR'});
      channels.push({sampler, target: {node: model.rig.findIndex(b => b.name === track.bone) + 2, path: track.path}});
    }
    return {name, samplers, channels};
  });
  const json = {asset: {version: '2.0', generator: `GermanySimulator ${VERSION}`}, scene: 0, scenes: [{nodes: [0, 1]}], nodes,
    meshes: [{name: model.id, primitives: [{attributes, indices, material: 0, mode: 4}]}],
    materials: [{name: 'Painted street caricature', pbrMetallicRoughness: {baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: .88}}],
    skins: [skin], animations, accessors, bufferViews, buffers: [{byteLength}]};
  const text = new TextEncoder().encode(JSON.stringify(json)), jsonSize = (text.length + 3) & ~3;
  const bytes = new Uint8Array(28 + jsonSize + byteLength), view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true); view.setUint32(4, 2, true); view.setUint32(8, bytes.length, true);
  view.setUint32(12, jsonSize, true); view.setUint32(16, 0x4e4f534a, true); bytes.fill(32, 20, 20 + jsonSize); bytes.set(text, 20);
  view.setUint32(20 + jsonSize, byteLength, true); view.setUint32(24 + jsonSize, 0x004e4942, true);
  let offset = 28 + jsonSize; for (const block of blocks) {bytes.set(block, offset); offset += block.length;}
  return bytes.buffer;
}
