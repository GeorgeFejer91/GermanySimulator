import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createVisitorAvatar} from '../assets/models/berghain/avatar.mjs';
import {layout} from '../assets/models/berghain/layout.mjs';
import {moveVisitor, canStand} from './navigation.mjs';
import {createLevelDoor} from '../level-transitions.js';

export function createWalkthrough() {
  const avatar = createVisitorAvatar();
  const door = createLevelDoor(THREE, {width: 2.65, height: 3.4, color: 0x39433c});
  door.group.position.set(0, .02, 22.28);
  door.opening.visible = false;
  const space = {floors: layout.floors, solids: []};
  const direction = new THREE.Vector3(), target = new THREE.Vector3(), origin = new THREE.Vector3(), lateral = new THREE.Vector3(), ray = new THREE.Raycaster();
  const lowLandscape=layout.solids.filter(solid=>solid.renderPart?.section==='landscape'&&solid.y[1]>.5&&solid.y[1]<2.1);
  let travel = null, opened = false, heading = 0;
  function syncDoor(open) {
    opened = open; door.setOpen(Number(open)); door.group.updateMatrixWorld(true);
    const solids = [];
    door.group.traverse(mesh => {
      if (!mesh.isMesh || mesh === door.opening) return;
      mesh.geometry.computeBoundingBox();
      const {min, max} = mesh.geometry.boundingBox;
      const polygon = [[min.x, min.z], [max.x, min.z], [max.x, max.z], [min.x, max.z]].map(([x, z]) => {
        const v = new THREE.Vector3(x, 0, z).applyMatrix4(mesh.matrixWorld); return [v.x, v.z];
      });
      const bounds = new THREE.Box3().setFromObject(mesh);
      solids.push({name: 'Entrance ' + mesh.id, polygon,
        x: [bounds.min.x, bounds.max.x], z: [bounds.min.z, bounds.max.z], y: [bounds.min.y, bounds.max.y]});
    });
    space.solids = [...layout.solids, ...solids];
  }
  syncDoor(false);
  const nearEntrance = position => position.y < .3 && Math.abs(position.x) < 1.25 && Math.abs(position.z - 22.28) < 2.8;
  return {avatar, door, space, spawn: {x: 0, y: 0, z: 29},
    get travelling() { return travel !== null; },
    get opened() { return opened; },
    action(position) { return !travel && nearEntrance(position) ? (position.z > 22.28 ? 'E · Enter Berghain' : 'E · Leave Berghain') : null; },
    interact(position) {
      if (travel || !nearEntrance(position)) return false;
      syncDoor(true);
      travel = {x: 0, z: position.z > 22.28 ? 20.25 : 24.85};
      return true;
    },
    stop() { travel = null; },
    step(position, delta, dt) {
      if (travel) {
        const x = travel.x - position.x, z = travel.z - position.z, distance = Math.hypot(x, z);
        const length = Math.min(distance, dt * 3);
        delta = distance > .0001 ? {x: x / distance * length, z: z / distance * length} : {x: 0, z: 0};
      }
      const next = moveVisitor(position, delta, space);
      const distance = Math.hypot(next.x - position.x, next.z - position.z);
      if (distance > .00001) heading = Math.atan2(-(next.x - position.x), -(next.z - position.z));
      avatar.group.position.set(next.x, next.y, next.z); avatar.pose(distance, heading);
      if (travel && dt > 0 && distance < .000001) travel = null;
      if (travel && Math.hypot(next.x - travel.x, next.z - travel.z) < .02) {
        travel = null;
        syncDoor(false);
        if (!canStand(next, space)) syncDoor(true);
      }
      return next;
    },
    camera(camera, position, yaw, pitch, model) {
      target.set(position.x, position.y + .95, position.z);
      if (camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); }
      const nearest=lowLandscape.reduce((distance,solid)=>position.y>=solid.y[1]?distance:Math.min(distance,Math.hypot(
        Math.max(solid.x[0]-position.x,0,position.x-solid.x[1]),
        Math.max(solid.z[0]-position.z,0,position.z-solid.z[1]))),Infinity);
      const proximity=THREE.MathUtils.smoothstep(2-nearest,0,1.5);
      const elevation = THREE.MathUtils.lerp(THREE.MathUtils.clamp(.32-pitch,-.15,1.1),1.35,proximity), radius = 4.2;
      model.updateMatrixWorld(true); door.group.updateMatrixWorld(true);
      // Give the camera a small envelope. A centre ray alone can pass through
      // the seam between closed leaves while most of the view is behind a door.
      lateral.set(Math.cos(yaw),0,-Math.sin(yaw)).multiplyScalar(.16);
      function clearance(angle) {
        direction.set(Math.sin(yaw)*Math.cos(angle),Math.sin(angle),Math.cos(yaw)*Math.cos(angle));
        let available=radius;
        for (const x of [-1,0,1]) for (const y of [-1,0,1]) {
          origin.copy(target).addScaledVector(lateral,x); origin.y += y * .16;
          ray.set(origin,direction);ray.near=.04;ray.far=radius;
          const hit=ray.intersectObjects([model,door.group],true).find(hit=>hit.object.visible&&!hit.object.material.transparent);
          if(hit)available=Math.min(available,Math.max(.10,hit.distance-.18));
        }
        return available;
      }
      const distance=clearance(elevation);
      camera.position.copy(target).addScaledVector(direction, distance); camera.lookAt(target);
      avatar.group.visible = distance > .65;
      return distance;
    },
    dispose() { avatar.dispose(); door.dispose(); }
  };
}
