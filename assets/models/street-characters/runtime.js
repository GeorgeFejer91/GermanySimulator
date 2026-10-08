/** Opt-in render adapter. Never creates NPC state, dialogue, collisions or audio. */
import {buildStreetCharacter, STREET_IDS, VERSION} from './models.js';
import {samplePose, WALK_DISTANCE, CLIP_SECONDS} from './rig.js';
import {STREET_PERSONA_MAP} from './persona-map.js';
export const WORLD_SCALE = .82;

export function characterIdFor(state) {
  if (state.voiceId) return STREET_PERSONA_MAP[state.voiceId]?.templateId ?? null;
  if (STREET_IDS.includes(state.streetCharacterId)) return state.streetCharacterId;
  const key = String(state.id ?? state.name ?? `${state.spriteKind || 'npc'}:${state.homeX ?? state.x}:${state.homeY ?? state.y}`);
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619) >>> 0;
  return STREET_IDS[hash % STREET_IDS.length];
}

export function createStreetCharacterSystem(T, {forcedId = null} = {}) {
  if (forcedId !== null && !STREET_IDS.includes(forcedId)) throw new RangeError('Unknown forced street-character ID');
  const templates = new Map(), actors = new Set(), failed = new Set();
  let disposed = false;
  function template(id) {
    if (templates.has(id)) return templates.get(id);
    const model = buildStreetCharacter(id), geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(model.positions, 3));
    geometry.setAttribute('normal', new T.Float32BufferAttribute(model.normals, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(model.colors, 3));
    geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(model.joints.flatMap(j => [j, 0, 0, 0]), 4));
    geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(model.joints.flatMap(() => [1, 0, 0, 0]), 4));
    geometry.setIndex(model.indices); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const material = new T.MeshStandardMaterial({color: 0xffffff, vertexColors: true, roughness: .88, metalness: 0});
    const item = {model, geometry, material}; templates.set(id, item); return item;
  }
  function create(state) {
    if (disposed || !state || state.special) return null;
    // forcedId is only for the explicit visual-debug URL; normal actors use their voice identity.
    const id = forcedId || characterIdFor(state); if (!id || failed.has(id)) return null;
    try {
      const item = template(id), group = new T.Group(), mesh = new T.SkinnedMesh(item.geometry, item.material);
      const bones = item.model.rig.map(b => {const bone = new T.Bone(); bone.name = b.name; bone.position.fromArray(b.translation); return bone;});
      item.model.rig.forEach((b, i) => {if (b.parent >= 0) bones[b.parent].add(bones[i]);});
      group.add(bones[0], mesh); group.updateMatrixWorld(true);
      const skeleton = new T.Skeleton(bones); mesh.bind(skeleton);
      // The controller culls whole actors by distance. Bind-pose bounds would
      // incorrectly cut off moving hands and their attached props.
      mesh.frustumCulled = false; mesh.name = `${id}_painted_skin`;
      group.name = `street-character:${id}`; group.scale.setScalar(WORLD_SCALE);
      group.userData.streetCharacter = {id, item, bones, skeleton, clock: 0, phase: 0, blend: 0,
        previous: null, mode: 'Idle', scratchPosition: new T.Vector3(), scratchRotation: new T.Quaternion()};
      actors.add(group); return group;
    } catch (error) {
      failed.add(id); console.warn(`Street character ${id} unavailable; keeping the existing NPC artwork`, error); return null;
    }
  }
  function update(group, {x, z, elevation = 0, timeSeconds, playerX = x, playerZ = z}) {
    const record = group?.userData.streetCharacter;
    if (disposed || !actors.has(group) || !record) return;
    if (![x, z, elevation, timeSeconds, playerX, playerZ].every(Number.isFinite)) return;
    const previous = record.previous, dx = previous ? x - previous.x : 0, dz = previous ? z - previous.z : 0;
    const dt = previous ? Math.min(.05, Math.max(0, timeSeconds - previous.time)) : 0;
    const distance = Math.hypot(dx, dz), moving = distance > .00005 && distance < 2;
    record.previous = {x, z, time: timeSeconds}; record.clock += dt;
    group.position.set(x, elevation, z); group.visible = Math.hypot(playerX - x, playerZ - z) < 38;
    if (moving) {
      record.phase = (record.phase + distance / (WALK_DISTANCE * WORLD_SCALE)) % 1;
      const angle = Math.atan2(dx, dz), delta = Math.atan2(Math.sin(angle - group.rotation.y), Math.cos(angle - group.rotation.y));
      group.rotation.y += delta * (1 - Math.exp(-18 * dt));
    }
    record.blend += ((moving ? 1 : 0) - record.blend) * (1 - Math.exp(-16 * dt));
    if (!group.visible) return;
    const idle = samplePose(record.item.model, record.mode, record.clock / CLIP_SECONDS[record.mode]);
    const walk = record.blend > .001 ? samplePose(record.item.model, 'Walk', record.phase) : null;
    record.item.model.rig.forEach((bone, i) => {
      const object = record.bones[i], base = idle[bone.name];
      object.position.fromArray(base.translation); object.quaternion.fromArray(base.rotation);
      if (walk) {
        const target = walk[bone.name];
        object.position.lerp(record.scratchPosition.fromArray(target.translation), record.blend);
        object.quaternion.slerp(record.scratchRotation.fromArray(target.rotation), record.blend);
      }
    });
  }
  function setMotion(group, mode = 'Idle') {
    if (!['Idle', 'Talk', 'Gesture'].includes(mode)) throw new RangeError('Stationary motion must be Idle, Talk or Gesture');
    if (!actors.has(group)) return;
    const record = group.userData.streetCharacter; if (record.mode !== mode) {record.mode = mode; record.clock = 0;}
  }
  function remove(group) {
    if (!actors.delete(group)) return;
    group.userData.streetCharacter.skeleton.dispose(); group.removeFromParent();
    delete group.userData.streetCharacter;
  }
  function dispose() {
    if (disposed) return; for (const actor of [...actors]) remove(actor);
    for (const item of templates.values()) {item.geometry.dispose(); item.material.dispose();}
    templates.clear(); disposed = true;
  }
  function inspect() {
    return {version: VERSION, status: 'candidate-unapproved', actors: actors.size,
      visible: [...actors].filter(a => a.visible).length, failed: [...failed],
      templates: [...templates].map(([id, item]) => ({id, triangles: item.model.triangles, primitives: 1, bones: item.model.rig.length}))};
  }
  return {create, update, setMotion, remove, dispose, inspect};
}
