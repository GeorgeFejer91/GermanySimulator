import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createBerghainModel, disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {layout, viewpoints} from '../assets/models/berghain/layout.mjs';
import {moveVisitor, eyeHeight, walkingSpeed} from './navigation.mjs';
import {fitExteriorRadius, exteriorTarget} from './camera.mjs';
import {loadSurfaceTextures} from '../assets/models/berghain/surface-materials.mjs';
import {prepareWithSegments, measureLineStats, measureNaturalWidth} from '../assets/vendor/pretext/dist/layout.js';
import {kloRoomAt} from '../assets/models/berghain/klo-bar.mjs';
import {labRoomAt} from '../assets/models/berghain/lab-oratory.mjs';
import {admissionRoomAt} from '../assets/models/berghain/admission.mjs';
import {createFootsteps} from './footsteps.mjs';
import {createViewerLighting} from './night-lighting.mjs';

const canvas = document.querySelector('#model');
const loading = document.querySelector('#loading');
const exterior = document.querySelector('#exterior');
const enter = document.querySelector('#enter');
const roomSelect = document.querySelector('#room');
const sourceDialog = document.querySelector('#source-dialog');
const instructions = document.querySelector('#instructions');
const interaction = document.querySelector('#interact');
const soundButton = document.querySelector('#footsteps');
const footsteps = createFootsteps({onChange:state=>{canvas.dataset.footsteps=JSON.stringify(state);}});
const playable = document.documentElement.dataset.play === 'true' || new URLSearchParams(location.search).has('play');
let walk = null, walkthroughReady = !playable;
const abort = new AbortController();
const events = {signal: abort.signal};
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'low-power'});
  renderer.transmissionResolutionScale = .5;
} catch {
  loading.textContent = '3D graphics are unavailable in this browser. Try a WebGL-capable browser; the source catalogue is available under Sources & accuracy.';
  enter.disabled = exterior.disabled = true;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b3b3a6');
const camera = new THREE.PerspectiveCamera(45, 1, .08, 500);
const model = createBerghainModel();
scene.add(model);
const lighting = createViewerLighting(scene);

let mode = 'exterior', visitor = {...viewpoints.foyer.position}, yaw = 0, pitch = 0;
let orbitAngle = .7, orbitPitch = 1.28, orbitRadius = 115;
let frame = null, lastFrame = 0, lost = false;
let surfacesReady = false, surfaceError = false;
const keys = new Set(), touchMoves = new Map(), pointers = new Map();
const target = new THREE.Vector3(...exteriorTarget);

function invalidate() {
  if (renderer && frame === null && !lost && !document.hidden) frame = requestAnimationFrame(render);
}

function clearInput() {
  keys.clear(); touchMoves.clear(); pointers.clear();
  walk?.stop();
  footsteps.reset();
}

function syncLoungeRoom(){
  const room=(admissionRoomAt(visitor)?'admission':null)||labRoomAt(visitor)||kloRoomAt(visitor)||(Math.abs(visitor.y-layout.upperLounge.floorHeight)<.15?'lounge':
    roomSelect.value==='admission'&&Math.abs(visitor.y-.05)<.15?'foyer':
    roomSelect.value==='lab'&&Math.abs(visitor.y-.05)<.15?'saule':
    roomSelect.value==='lounge'&&Math.abs(visitor.y-13.25)<.15?'panorama':
    ['klo','toilets'].includes(roomSelect.value)&&Math.abs(visitor.y-6.65)<.15?'berghain':null);
  if(!room||roomSelect.value===room)return;
  const view=viewpoints[room];roomSelect.value=room;
  document.querySelector('#location').textContent=view.label;
  document.querySelector('#accuracy').textContent=view.confidence+' · '+view.sources.join(', ');
  scheduleMeasurement();
}

function render(time) {
  frame = null;
  const dt = Math.min(.05, Math.max(0, (time - lastFrame) / 1000));
  lastFrame = time;
  if (mode === 'interior') {
    const held = new Set([...keys, ...touchMoves.values()]);
    let forward = Number(held.has('w') || held.has('arrowup') || held.has('forward')) - Number(held.has('s') || held.has('arrowdown') || held.has('back'));
    let right = Number(held.has('d') || held.has('arrowright') || held.has('right')) - Number(held.has('a') || held.has('arrowleft') || held.has('left'));
    const length = Math.hypot(forward, right);
    if (length) { forward /= length; right /= length; }
    const delta = {x: (right * Math.cos(yaw) - forward * Math.sin(yaw)) * dt * walkingSpeed,
      z: (-forward * Math.cos(yaw) - right * Math.sin(yaw)) * dt * walkingSpeed};
    const before = visitor;
    visitor = walk ? walk.step(visitor, delta, dt) : (length ? moveVisitor(visitor, delta, layout) : visitor);
    footsteps.advance(before,visitor);
    syncLoungeRoom();
    if (length || walk?.travelling || (walk && Math.hypot(visitor.x - before.x, visitor.z - before.z) > .00001)) invalidate();
    if (walk) {
      canvas.dataset.cameraDistance = String(walk.camera(camera, visitor, yaw, pitch, model, dt));
      canvas.dataset.cameraTurning = String(walk.cameraTurning);
      canvas.dataset.perspective = 'first-person';
      if (walk.cameraTurning) invalidate();
      const action = walk.action(visitor);
      if (interaction.hidden !== !action) scheduleMeasurement();
      interaction.hidden = !action;
      if (action && interaction.textContent !== action) interaction.textContent = action;
      const place = visitor.z > 22.28 ? 'Outside Berghain' :
        admissionRoomAt(visitor)?viewpoints.admission.label:
        labRoomAt(visitor)?viewpoints.lab.label:
        kloRoomAt(visitor)?viewpoints[kloRoomAt(visitor)].label:
        Math.abs(visitor.y-layout.upperLounge.floorHeight)<.15?viewpoints.lounge.label:'Inside Berghain';
      if (document.querySelector('#location').textContent !== place) document.querySelector('#location').textContent = place;
    } else {
      camera.position.set(visitor.x, visitor.y + eyeHeight, visitor.z);
      camera.rotation.set(pitch, yaw, 0, 'YXZ');
      if (camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); }
    }
  } else {
    if (walk) interaction.hidden = true;
    camera.position.set(target.x + Math.sin(orbitAngle) * Math.sin(orbitPitch) * orbitRadius,
      target.y + Math.cos(orbitPitch) * orbitRadius, target.z + Math.cos(orbitAngle) * Math.sin(orbitPitch) * orbitRadius);
    camera.lookAt(target);
  }
  lighting.update(mode,visitor);
  canvas.dataset.lighting = JSON.stringify(lighting.state);
  renderer.render(scene, camera);
  canvas.dataset.view = mode;
  canvas.dataset.position = JSON.stringify(mode === 'interior' ? visitor : camera.position.toArray());
  canvas.dataset.drawCalls = String(renderer.info.render.calls);
  canvas.dataset.triangles = String(renderer.info.render.triangles);
  canvas.dataset.ready = String(surfacesReady && walkthroughReady);
  canvas.dataset.avatar = 'false';
  canvas.dataset.cameraPosition = JSON.stringify(camera.position.toArray());
  canvas.dataset.cameraDirection = JSON.stringify(camera.getWorldDirection(new THREE.Vector3()).toArray());
  canvas.dataset.cameraFov = String(camera.fov);
  canvas.dataset.footsteps = JSON.stringify(footsteps.state);
  canvas.dataset.perspective = mode === 'interior' ? 'first-person' : 'exterior';
  canvas.dataset.crossing = String(walk?.travelling || false);
  loading.hidden = surfacesReady && walkthroughReady && !surfaceError;
  if (surfaceError) loading.textContent = 'Surface textures could not load. Showing basic materials; reload to retry.';
}

function resize() {
  document.documentElement.style.setProperty('--header-height', document.querySelector('header').getBoundingClientRect().height + 'px');
  if (!renderer) return;
  const {width, height} = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const ratio = Math.min(devicePixelRatio, 1.5, Math.sqrt(1_600_000 / (width * height)));
  renderer.setPixelRatio(ratio);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (mode === 'exterior') orbitRadius = Math.max(orbitRadius, fitExteriorRadius(camera.aspect, orbitAngle, orbitPitch));
  invalidate();
}

function selectView(name) {
  clearInput();
  if (name === 'exterior') {
    mode = 'exterior';
    camera.fov = 45; camera.updateProjectionMatrix();
    orbitAngle = .7; orbitPitch = 1.28; orbitRadius = fitExteriorRadius(camera.aspect, orbitAngle, orbitPitch);
    document.querySelector('#location').textContent = 'Exterior';
    document.querySelector('#accuracy').textContent = 'Exterior calibrated · interior layout provisional';
    instructions.textContent = 'Drag to orbit · scroll or + / − to zoom · Go inside to explore';
  } else if (name === 'walk' && walk) {
    mode = 'interior';
    instructions.textContent = 'WASD / arrows to walk · drag to look · E or the entrance button to enter and leave';
    document.querySelector('#accuracy').textContent = 'First-person walk · interior reconstruction in progress';
  } else {
    const view = viewpoints[name];
    mode = 'interior'; visitor = {...view.position}; yaw = view.yaw; pitch = view.pitch || 0;
    roomSelect.value = name;
    document.querySelector('#location').textContent = view.label;
    document.querySelector('#accuracy').textContent = view.confidence + ' · ' + view.sources.join(', ');
    instructions.textContent = 'Drag to look · WASD / arrows to walk · choose a room to change levels · Esc for exterior';
    if (walk) { walk.step(visitor, {x: 0, z: 0}, 0); instructions.textContent = 'WASD / arrows to walk · drag to look · E at the entrance to leave'; }
  }
  exterior.setAttribute('aria-pressed', String(mode === 'exterior'));
  enter.setAttribute('aria-pressed', String(mode === 'interior'));
  document.querySelector('#rooms').hidden = mode !== 'interior';
  document.querySelector('#touch-controls').hidden = mode !== 'interior';
  resize(); invalidate();
}

exterior.addEventListener('click', () => selectView('exterior'), events);
enter.addEventListener('click', () => {selectView(walk ? 'walk' : 'foyer');footsteps.unlock();}, events);
roomSelect.addEventListener('change', () => {selectView(roomSelect.value);footsteps.unlock();}, events);
soundButton.addEventListener('click',()=>{
  const enabled=soundButton.getAttribute('aria-pressed')!=='true';
  soundButton.setAttribute('aria-pressed',String(enabled));soundButton.textContent=enabled?'Footsteps: on':'Footsteps: off';
  footsteps.setEnabled(enabled);scheduleMeasurement();invalidate();
},events);
document.querySelector('#sources').addEventListener('click', () => { clearInput(); sourceDialog.showModal(); scheduleMeasurement(); }, events);
document.querySelector('#close-sources').addEventListener('click', () => sourceDialog.close(), events);
sourceDialog.addEventListener('close', clearInput, events);

function interact() {
  if (!walk || walk.travelling || mode !== 'interior' || sourceDialog.open) return;
  clearInput();
  footsteps.unlock();
  if (walk.interact(visitor)) { canvas.focus({preventScroll: true}); invalidate(); }
}
interaction.addEventListener('click', interact, events);

canvas.addEventListener('pointerdown', event => {
  canvas.focus({preventScroll: true});
  canvas.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
  if(mode==='interior')footsteps.unlock();
}, events);
canvas.addEventListener('pointermove', event => {
  const previous = pointers.get(event.pointerId);
  if (!previous) return;
  const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
  if (pointers.size === 2 && mode === 'exterior') {
    const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)[1];
    const before = Math.hypot(previous.x - other.x, previous.y - other.y);
    const after = Math.hypot(event.clientX - other.x, event.clientY - other.y);
    if (after > 5) orbitRadius = THREE.MathUtils.clamp(orbitRadius * before / after, 72, Math.max(180, fitExteriorRadius(camera.aspect, orbitAngle, orbitPitch) * 1.8));
  } else if (mode === 'exterior') {
    orbitAngle -= dx * .005;
    orbitPitch = THREE.MathUtils.clamp(orbitPitch + dy * .004, .25, 1.48);
  } else {
    yaw -= dx * .004;
    pitch = THREE.MathUtils.clamp(pitch - dy * .004, -1.15, 1.15);
  }
  pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
  invalidate();
}, events);
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, e => pointers.delete(e.pointerId), events);
canvas.addEventListener('wheel', event => {
  if (mode !== 'exterior') return;
  event.preventDefault();
  orbitRadius = THREE.MathUtils.clamp(orbitRadius * Math.exp(event.deltaY * .001), 72, Math.max(180, fitExteriorRadius(camera.aspect, orbitAngle, orbitPitch) * 1.8));
  invalidate();
}, {...events, passive: false});

canvas.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (key === 'e' && walk && mode === 'interior') { event.preventDefault(); if (!event.repeat) interact(); return; }
  if (key === 'escape') { selectView('exterior'); return; }
  if (mode === 'exterior') {
    if (['arrowleft', 'arrowright'].includes(key)) orbitAngle += key === 'arrowleft' ? .12 : -.12;
    else if (['+', '=', '-', '_', 'arrowup', 'arrowdown'].includes(key)) orbitRadius = THREE.MathUtils.clamp(orbitRadius * (['-', '_', 'arrowdown'].includes(key) ? 1.1 : .9), 72, Math.max(180, fitExteriorRadius(camera.aspect, orbitAngle, orbitPitch) * 1.8));
    else return;
  } else if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {keys.add(key);footsteps.unlock();}
  else return;
  event.preventDefault(); invalidate();
}, events);
canvas.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()), events);
canvas.addEventListener('blur', clearInput, events);
window.addEventListener('blur', clearInput, events);
for (const button of document.querySelectorAll('[data-move]')) {
  button.addEventListener('pointerdown', event => {
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    touchMoves.set(event.pointerId, button.dataset.move); invalidate();
    footsteps.unlock();
  }, events);
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, e => touchMoves.delete(e.pointerId), events);
  button.addEventListener('keydown', event => {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); touchMoves.set('keyboard', button.dataset.move); footsteps.unlock();invalidate(); }
  }, events);
  button.addEventListener('keyup', () => touchMoves.delete('keyboard'), events);
  button.addEventListener('blur', () => touchMoves.delete('keyboard'), events);
}
document.addEventListener('visibilitychange', () => {
  clearInput();
  if (document.hidden && frame !== null) { cancelAnimationFrame(frame); frame = null; }
  else invalidate();
}, events);
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault(); lost = true; clearInput();
  canvas.dataset.ready = 'false';
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null; loading.hidden = false;
  loading.textContent = 'Graphics paused. Waiting for the browser to restore the 3D context…';
}, events);
canvas.addEventListener('webglcontextrestored', () => { lost = false; resize(); }, events);

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(document.querySelector('#viewport'));
resizeObserver.observe(document.querySelector('header'));
window.addEventListener('pageshow', invalidate, events);
window.addEventListener('pagehide', event => {
  clearInput();
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
  if (event.persisted) return;
  resizeObserver.disconnect(); textObserver.disconnect(); textChanges.disconnect();
  abort.abort(); footsteps.dispose();walk?.dispose(); lighting.dispose(); disposeBerghainModel(model); renderer?.dispose();
}, events);

const preparedText = new Map();
let measurementFrame = null;
function measureLabels() {
  measurementFrame = null;
  const available = document.fonts.check('16px "Berghain Sans"') && typeof Intl.Segmenter === 'function';
  for (const element of document.querySelectorAll('[data-measure],#room')) {
    if (!element.getClientRects().length) continue;
    if (!available) { element.dataset.fit = 'unavailable'; continue; }
    const css = getComputedStyle(element), rect = element.getBoundingClientRect();
    const text = element === roomSelect ? roomSelect.selectedOptions[0].textContent : element.textContent;
    const font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
    const letterSpacing = parseFloat(css.letterSpacing) || 0;
    const key = JSON.stringify([text, font, letterSpacing]);
    if (!preparedText.has(key)) {
      if (preparedText.size > 128) preparedText.clear();
      preparedText.set(key, prepareWithSegments(text, font, {letterSpacing}));
    }
    const width = rect.width - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight) - parseFloat(css.borderLeftWidth) - parseFloat(css.borderRightWidth) - (element === roomSelect ? 16 : 0);
    const height = rect.height - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) - parseFloat(css.borderTopWidth) - parseFloat(css.borderBottomWidth);
    // DOM dimensions round to 1/64 px; Canvas advances retain finer precision.
    const stats = measureLineStats(preparedText.get(key), Math.max(1, width + .5));
    const lineHeight = parseFloat(css.lineHeight) || parseFloat(css.fontSize) * 1.4;
    const fits = stats.maxLineWidth <= width + .5 && stats.lineCount * lineHeight <= height + 1;
    const naturalFits = element !== roomSelect || (stats.lineCount === 1 && measureNaturalWidth(preparedText.get(key)) <= width);
    element.dataset.fit = fits && naturalFits ? 'fit' : 'reflow';
    if (element === roomSelect) {
      const full = document.querySelector('#room-full-name');
      full.hidden = fits && naturalFits;
      if (full.textContent !== text) full.textContent = text;
    }
  }
  document.documentElement.dataset.textMeasurement = available ? 'pretext-0.0.9' : 'unavailable';
}
function scheduleMeasurement() {
  if (measurementFrame === null) measurementFrame = requestAnimationFrame(measureLabels);
}
const textObserver = new ResizeObserver(scheduleMeasurement);
textObserver.observe(document.body);
const textChanges = new MutationObserver(scheduleMeasurement);
textChanges.observe(document.body, {subtree: true, childList: true, characterData: true});
document.fonts.load('16px "Berghain Sans"').then(scheduleMeasurement);
document.fonts.load('600 16px "Berghain Sans"').then(scheduleMeasurement);
document.addEventListener('change', scheduleMeasurement, events);
if (renderer) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  resize();
  if (playable) import('./walkthrough.mjs').then(({createWalkthrough}) => {
    if (model.userData.disposed) return;
    walk = createWalkthrough(); scene.add(walk.door.group);
    visitor = {...walk.spawn}; yaw = 0; pitch = 0; walkthroughReady = true;
    enter.textContent = 'Walk';
    canvas.setAttribute('aria-label', 'First-person walking view. WASD or arrows to walk, drag to look, E at the entrance to enter or leave.');
    selectView('walk');
  }).catch(() => {
    loading.hidden = false;
    loading.textContent = 'The walkthrough could not load. Reload to retry or use the architectural model viewer.';
  });
  loadSurfaceTextures(model, Math.min(4, renderer.capabilities.getMaxAnisotropy())).then(count => {
    if (model.userData.disposed) return;
    surfacesReady = true;
    canvas.dataset.materials = 'ready';
    canvas.dataset.surfaceTextures = String(count);
    invalidate();
  }).catch(() => {
    if (model.userData.disposed) return;
    surfacesReady = true; surfaceError = true;
    canvas.dataset.materials = 'fallback';
    invalidate();
  });
}
