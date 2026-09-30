// Preview-only art direction. The source GLBs, their animation clips and the
// accepted in-game bitmap sprites remain unchanged. No additional art downloads.
export const TOWEL_CARICATURE_VERSION = 'caricature-1';

const profiles = Object.freeze({
  man: Object.freeze({body: Object.freeze([1.16, .90, 1.15]), head: 1.30,
    chest: Object.freeze([1.09, 1, 1.10]), hands: 1.10}),
  woman: Object.freeze({body: Object.freeze([1.14, .89, 1.13]), head: 1.30,
    chest: Object.freeze([1.07, 1, 1.09]), hands: 1.10})
});
const identity = Object.freeze([1, 1, 1]);
const normalize = name => String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function towelCaricatureProfile(kind) {
  if (!Object.hasOwn(profiles, kind)) throw new RangeError(`Unknown towel character: ${kind}`);
  return profiles[kind];
}

export function towelPropEmphasis(name) {
  const key = normalize(name);
  if (key.includes('moustache')) return 1.45;
  if (key.includes('sunglasseslens')) return 1.13;
  if (key.includes('glassesrim')) return 1.10;
  if (key.includes('rolledreservationtowel') || key.includes('rolledtowelend')) return 1.12;
  if (key.includes('towelretainingband')) return 1.12;
  return 1;
}

// Deliberately retain facial shading from the source skin, but replace its
// photographic color noise with a small, warm painted palette.
const skinPalette = Object.freeze([
  [115, 77, 62], [149, 102, 79], [181, 134, 102],
  [207, 163, 124], [227, 190, 149], [241, 215, 177]
].map(Object.freeze));
export function towelSkinTone(r, g, b) {
  const luminance = Math.max(0, Math.min(255, .2126 * r + .7152 * g + .0722 * b));
  return skinPalette[Math.min(5, Math.floor(luminance * 6 / 256))];
}

// Restore -> sample the existing mixer -> apply. Restoring on EVERY frame is
// important: a paused mixer does not rewrite scales, so multiplication alone
// would keep inflating heads. No joint positions or keyframes are edited.
export function createTowelPoseStyle(actor, kind) {
  const profile = towelCaricatureProfile(kind);
  const rootScale = actor.scale.clone();
  const bones = [];
  actor.traverse(node => {
    if (!node.isBone) return;
    const key = normalize(node.name);
    let factor = identity;
    if (key === 'head') factor = [profile.head, profile.head, profile.head];
    else if (key === 'chest') factor = profile.chest;
    else if (key === 'handl' || key === 'handr') factor = [profile.hands, profile.hands, profile.hands];
    if (factor !== identity) bones.push({node, factor, sampled: node.scale.clone()});
  });
  if (!bones.some(record => normalize(record.node.name) === 'head')) {
    throw new Error('Towel caricature requires the existing named head bone.');
  }
  let enabled = false;
  function beforePose() {
    actor.scale.copy(rootScale);
    for (const record of bones) record.node.scale.copy(record.sampled);
  }
  function afterPose() {
    for (const record of bones) {
      record.sampled.copy(record.node.scale);
      if (enabled) record.node.scale.set(
        record.sampled.x * record.factor[0],
        record.sampled.y * record.factor[1],
        record.sampled.z * record.factor[2]);
    }
    actor.scale.copy(rootScale);
    if (enabled) actor.scale.set(rootScale.x * profile.body[0],
      rootScale.y * profile.body[1], rootScale.z * profile.body[2]);
  }
  return {beforePose, afterPose, setEnabled(value) {
    beforePose();
    enabled = Boolean(value);
    afterPose();
  }};
}

export function installTowelCaricature(THREE, actor, kind) {
  const pose = createTowelPoseStyle(actor, kind);
  const records = [], shells = [];
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const materialCache = new Map(), skinCache = new Map();
  const gradient = new THREE.DataTexture(new Uint8Array([72, 138, 202, 255]), 4, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  textures.add(gradient);
  const ink = new THREE.MeshBasicMaterial({color: 0x302b27, side: THREE.BackSide});
  materials.add(ink);

  function paintedSkin(source) {
    if (!source || !source.image || typeof document === 'undefined') return source;
    if (skinCache.has(source)) return skinCache.get(source);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 512;
      const ctx = canvas.getContext('2d', {willReadFrequently: true});
      if (!ctx) return source;
      ctx.drawImage(source.image, 0, 0, 512, 512);
      const pixels = ctx.getImageData(0, 0, 512, 512);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const tone = towelSkinTone(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]);
        pixels.data[i] = tone[0]; pixels.data[i + 1] = tone[1]; pixels.data[i + 2] = tone[2];
      }
      ctx.putImageData(pixels, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = source.flipY;
      texture.channel = source.channel;
      texture.offset.copy(source.offset); texture.repeat.copy(source.repeat);
      texture.center.copy(source.center); texture.rotation = source.rotation;
      texture.wrapS = source.wrapS; texture.wrapT = source.wrapT;
      textures.add(texture); skinCache.set(source, texture);
      return texture;
    } catch {
      // A missing/tainted image must not prevent the original model loading.
      skinCache.set(source, source);
      return source;
    }
  }

  function toon(source) {
    if (materialCache.has(source)) return materialCache.get(source);
    const key = normalize(source.name);
    let color = source.color ? source.color.clone() : new THREE.Color(0xffffff);
    let map = source.map || null;
    if (key.includes('skin')) {
      const painted = paintedSkin(map);
      if (painted && painted !== map) color = new THREE.Color(0xffffff);
      map = painted;
    } else {
      const palette = [
        ['bluecottonpolo', 0x4b7794], ['coralcottonpolo', 0xb96555],
        ['polocollar', kind === 'man' ? 0x334b5c : 0x813f37],
        ['sandwalkingshorts', 0xa48b68], ['whitewalkingsocks', 0xe9dfc9],
        ['strawsunhat', 0xc6ac75], ['darkhatband', 0x494035],
        ['patternedtravelcap', 0x777466], ['silvergreyhair', 0xb2afa1],
        ['brownhair', 0x574332], ['eyewear', 0x292a29],
        ['smallbrassbuckle', 0xb7a16a], ['sandalrubbersole', 0x39332d],
        ['sandalleather', kind === 'man' ? 0x76523a : 0x394c62],
        ['bluebeachtowel', 0x427b9c], ['yellowtowelstripe', 0xdcc171],
        ['redbeachtowel', 0xb24f45], ['whitetowelstripe', 0xeee1c6]
      ];
      const entry = palette.find(([name]) => key.includes(name));
      if (entry) color = new THREE.Color(entry[1]);
    }
    const result = new THREE.MeshToonMaterial({color, map, gradientMap: gradient,
      side: source.side, transparent: source.transparent, opacity: source.opacity,
      alphaTest: source.alphaTest, depthWrite: source.depthWrite, vertexColors: source.vertexColors});
    result.name = `${source.name || 'cloth'} / painted caricature`;
    materials.add(result); materialCache.set(source, result);
    return result;
  }

  function emphasizedGeometry(source, factor) {
    if (factor === 1) return source;
    const geometry = source.clone();
    geometries.add(geometry);
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    // Scale about this prop's own center, not the character/world origin.
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.scale(factor, factor, factor);
    geometry.translate(center.x, center.y, center.z);
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    return geometry;
  }

  function makeShell(mesh, geometry) {
    const shellGeometry = geometry.clone();
    geometries.add(shellGeometry);
    if (!shellGeometry.getAttribute('normal')) shellGeometry.computeVertexNormals();
    const points = shellGeometry.getAttribute('position'), normals = shellGeometry.getAttribute('normal');
    for (let i = 0; i < points.count; i++) {
      const nx = normals.getX(i), ny = normals.getY(i), nz = normals.getZ(i);
      const length = Math.hypot(nx, ny, nz) || 1;
      points.setXYZ(i, points.getX(i) + nx / length * .0035,
        points.getY(i) + ny / length * .0035, points.getZ(i) + nz / length * .0035);
    }
    points.needsUpdate = true;
    shellGeometry.computeBoundingBox(); shellGeometry.computeBoundingSphere();
    const shell = mesh.isSkinnedMesh ? new THREE.SkinnedMesh(shellGeometry, ink) : new THREE.Mesh(shellGeometry, ink);
    if (mesh.isSkinnedMesh) {
      shell.bindMode = mesh.bindMode;
      shell.bind(mesh.skeleton, mesh.bindMatrix);
    }
    shell.name = `${mesh.name}_caricature_ink`;
    shell.position.copy(mesh.position); shell.quaternion.copy(mesh.quaternion); shell.scale.copy(mesh.scale);
    shell.matrix.copy(mesh.matrix); shell.matrixAutoUpdate = mesh.matrixAutoUpdate;
    shell.frustumCulled = false;
    shell.castShadow = shell.receiveShadow = false;
    shell.visible = false;
    mesh.parent.add(shell);
    shells.push({shell, source: mesh});
  }

  function dispose() {
    pose.setEnabled(false);
    for (const record of records) {
      record.mesh.material = record.material;
      record.mesh.geometry = record.geometry;
      record.mesh.frustumCulled = record.frustumCulled;
    }
    for (const {shell} of shells) shell.removeFromParent();
    for (const resource of [...geometries, ...materials, ...textures]) resource.dispose();
  }

  try {
    const meshes = [];
    actor.traverse(node => {if (node.isMesh) meshes.push(node);});
    if (!meshes.length) throw new Error('Towel caricature requires the original character meshes.');
    // Collect first: never mutate the scene graph while traversing it.
    for (const mesh of meshes) {
      const original = mesh.material;
      const styledMaterial = Array.isArray(original) ? original.map(toon) : toon(original);
      const geometry = emphasizedGeometry(mesh.geometry, towelPropEmphasis(mesh.name));
      records.push({mesh, material: original, geometry: mesh.geometry,
        styledMaterial, styledGeometry: geometry, frustumCulled: mesh.frustumCulled});
      const key = normalize(mesh.name);
      if (mesh.visible && /continuoushumanbody|strawbrim|strawcrown|suncapcrown|sandalsole|rolledreservationtowel/.test(key)) {
        makeShell(mesh, geometry);
      }
    }
  } catch (error) {
    dispose();
    throw error;
  }
  let enabled = false;
  function setEnabled(value) {
    enabled = Boolean(value);
    pose.setEnabled(enabled);
    for (const record of records) {
      record.mesh.material = enabled ? record.styledMaterial : record.material;
      record.mesh.geometry = enabled ? record.styledGeometry : record.geometry;
      record.mesh.frustumCulled = enabled ? false : record.frustumCulled;
    }
    for (const {shell, source} of shells) shell.visible = enabled && source.visible;
  }
  setEnabled(true);
  return {beforePose: pose.beforePose, afterPose: pose.afterPose, setEnabled, dispose,
    version: TOWEL_CARICATURE_VERSION, outlineMeshes: shells.length};
}
