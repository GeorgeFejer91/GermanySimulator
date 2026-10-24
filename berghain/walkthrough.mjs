import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {moveVisitor, canStand, eyeHeight, walkingSpeed} from './navigation.mjs';
import {createLevelDoor} from '../level-transitions.js';

export function createWalkthrough() {
  const door = createLevelDoor(THREE, {width: 1.35, height: 2.45, color: 0x39433c});
  door.group.position.set(0, .02, 22.28);
  door.opening.visible = false;
  const space = {floors: layout.floors, solids: []};
  let travel = null, opened = false;
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
  return {door, space, spawn: {x: 0, y: 0, z: 29},
    get travelling() { return travel !== null; },
    get cameraTurning() { return false; },
    get opened() { return opened; },
    action(position) { return !travel && nearEntrance(position) ? (position.z > 22.28 ? 'E · Enter Berghain' : 'E · Leave Berghain') : null; },
    interact(position) {
      if (travel || !nearEntrance(position) || !canStand(position,space)) return false;
      const destination = {x: 0, z: position.z > 22.28 ? 20.25 : 24.85};
      syncDoor(true);
      if (!canStand(position,space)) {
        // Keep the leaf closed while the visitor walks clear of its swing.
        syncDoor(false);
        travel = {x: 0, z: position.z > 22.28 ? 23.4 : 21.2, destination};
      } else travel = destination;
      return true;
    },
    stop() { travel = null; },
    step(position, delta, dt) {
      if (travel) {
        const x = travel.x - position.x, z = travel.z - position.z, distance = Math.hypot(x, z);
        const length = Math.min(distance, dt * walkingSpeed);
        delta = distance > .0001 ? {x: x / distance * length, z: z / distance * length} : {x: 0, z: 0};
      }
      const next = moveVisitor(position, delta, space);
      const distance = Math.hypot(next.x - position.x, next.z - position.z);
      if (travel && dt > 0 && distance < .000001) travel = null;
      if (travel && Math.hypot(next.x - travel.x, next.z - travel.z) < .02) {
        if (travel.destination) {
          const destination=travel.destination;
          syncDoor(true);
          if (canStand(next,space)) travel=destination;
          else {syncDoor(false);travel=null;}
        } else {
          travel = null;
          syncDoor(false);
          if (!canStand(next, space)) syncDoor(true);
        }
      }
      return next;
    },
    camera(camera, position, yaw, pitch) {
      camera.position.set(position.x, position.y + eyeHeight, position.z);
      camera.rotation.set(pitch, yaw, 0, 'YXZ');
      if (camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld(true);
      return 0;
    },
    dispose() { door.dispose(); }
  };
}
