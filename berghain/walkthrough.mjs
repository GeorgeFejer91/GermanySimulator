import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createVisitorAvatar} from '../assets/models/berghain/avatar.mjs';
import {layout} from '../assets/models/berghain/layout.mjs';
import {moveVisitor, canStand} from './navigation.mjs';
import {createLevelDoor} from '../level-transitions.js';
import {pierOrbitConstraint,frameVisitorCamera} from './camera.mjs';

export function createWalkthrough() {
  const avatar = createVisitorAvatar();
  const door = createLevelDoor(THREE, {width: 2.65, height: 3.4, color: 0x39433c});
  door.group.position.set(0, .02, 22.28);
  door.opening.visible = false;
  const space = {floors: layout.floors, solids: []};
  const direction = new THREE.Vector3(), target = new THREE.Vector3(), origin = new THREE.Vector3(), lateral = new THREE.Vector3(), ray = new THREE.Raycaster();
  const lowLandscape=layout.solids.filter(solid=>solid.renderPart?.section==='landscape'&&solid.y[1]>.5&&solid.y[1]<2.1);
  let travel = null, opened = false, heading = 0, screenYaw = null, pierYaw=null, cameraTurning = false, cameraFrame=null;
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
    get cameraTurning() { return cameraTurning; },
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
    camera(camera, position, yaw, pitch, model, dt = 1 / 60) {
      target.set(position.x, position.y + .95, position.z);
      const nearest=lowLandscape.reduce((distance,solid)=>position.y>=solid.y[1]?distance:Math.min(distance,Math.hypot(
        Math.max(solid.x[0]-position.x,0,position.x-solid.x[1]),
        Math.max(solid.z[0]-position.z,0,position.z-solid.z[1]))),Infinity);
      // As with low planting, lift smoothly before a close guard enters the
      // camera envelope. A yaw-dependent retry pops through the picket gaps.
      const nearestGuard=layout.balustrades.reduce((distance,guard)=>{
        const [a,b]=[guard.start,guard.end],dx=b[0]-a[0],dz=b[2]-a[2];
        const t=THREE.MathUtils.clamp(((position.x-a[0])*dx+(position.z-a[2])*dz)/(dx*dx+dz*dz),0,1);
        const top=a[1]+(b[1]-a[1])*t+guard.handrailHeight-position.y;
        return top<.5||top>1.3?distance:Math.min(distance,Math.hypot(position.x-a[0]-dx*t,position.z-a[2]-dz*t)-.0225);
      },Infinity);
      const baseElevation=THREE.MathUtils.clamp(.32-pitch,-.15,1.1);
      const elevation = Math.max(THREE.MathUtils.lerp(baseElevation,1.35,THREE.MathUtils.smoothstep(2-nearest,0,1.5)),
        THREE.MathUtils.lerp(baseElevation,1.1,THREE.MathUtils.smoothstep(1-nearestGuard,0,.65))), radius = 4.2;
      // Slide the orbit along the glazed screen on the visitor's side. Keep
      // ordinary walking elevation and test the resulting view against every
      // opaque frame/wall/door below. A bounded turn avoids switching tangents
      // abruptly when the requested view points straight through the screen.
      const screen=layout.mainBar,normal=screen?position.x-screen.screenAnchor[0]:Infinity;
      const screenDistance=screen&&Math.abs(position.y-screen.floorHeight)<.3
        ?Math.hypot(normal,Math.max(Math.abs(position.z-screen.screenAnchor[2])-7.4,0)):Infinity;
      let orbitYaw=yaw;
      cameraTurning=false;
      const horizontal=radius*Math.cos(elevation);
      if(screenDistance<horizontal){
        const center=Math.sign(normal)*Math.PI/2;
        const limit=Math.acos(-THREE.MathUtils.clamp((screenDistance-.32)/horizontal,0,1));
        const relative=angle=>Math.atan2(Math.sin(angle-center),Math.cos(angle-center));
        const wanted=THREE.MathUtils.clamp(relative(yaw),-limit,limit);
        const previous=THREE.MathUtils.clamp(screenYaw===null?wanted:relative(screenYaw),-limit,limit);
        orbitYaw=center+previous+THREE.MathUtils.clamp(wanted-previous,-3*Math.min(dt,.05),3*Math.min(dt,.05));
        cameraTurning=Math.abs(center+wanted-orbitYaw)>.002;
        screenYaw=orbitYaw;
      }else screenYaw=null;
      const pier=pierOrbitConstraint(position,Math.min(horizontal,2.3));
      if(pier){
        const relative=angle=>Math.atan2(Math.sin(angle-pier.center),Math.cos(angle-pier.center));
        const wanted=THREE.MathUtils.clamp(relative(orbitYaw),-pier.limit,pier.limit);
        const previous=relative(pierYaw??(pier.center+wanted));
        orbitYaw=pier.center+previous+THREE.MathUtils.clamp(wanted-previous,-3*Math.min(dt,.05),3*Math.min(dt,.05));
        cameraTurning ||= Math.abs(pier.center+wanted-orbitYaw)>.002;
        pierYaw=orbitYaw;
      }else pierYaw=null;
      model.updateMatrixWorld(true); door.group.updateMatrixWorld(true);
      // Give the camera a small envelope. A centre ray alone can pass through
      // the seam between closed leaves while most of the view is behind a door.
      lateral.set(Math.cos(orbitYaw),0,-Math.sin(orbitYaw)).multiplyScalar(.16);
      function clearance(angle) {
        direction.set(Math.sin(orbitYaw)*Math.cos(angle),Math.sin(angle),Math.cos(orbitYaw)*Math.cos(angle));
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
      const framing=frameVisitorCamera(camera,avatar.group,dt);
      cameraFrame=framing.frame;cameraTurning ||= framing.settling;
      avatar.group.visible = distance > .65;
      return distance;
    },
    get cameraFrame(){return cameraFrame;},
    dispose() { avatar.dispose(); door.dispose(); }
  };
}
