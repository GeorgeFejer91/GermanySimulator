import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';

export function createVisitorAvatar() {
  const group = new THREE.Group(), joints = [], legs = [], arms = [], knees = [];
  group.name = 'Visitor · 1.80 m';
  const geometries = new Set();
  const materials = Object.fromEntries(Object.entries({skin: '#b28c74', jacket: '#303b3b', shirt: '#b4b3a4',
    trousers: '#33333b', shoe: '#222426', hair: '#302a25'}).map(([name, color]) =>
    [name, new THREE.MeshStandardMaterial({color, roughness: .86})]));
  function mesh(geometry, material, position, parent = group) {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, materials[material]);
    object.position.set(...position); object.castShadow = true; object.receiveShadow = true;
    parent.add(object); return object;
  }
  function limb(parent, length, radius, material) {
    mesh(new THREE.CylinderGeometry(radius * .88, radius, length, 10), material, [0, -length / 2, 0], parent);
  }
  const pivot = (parent, position) => {
    const joint = new THREE.Group(); joint.position.set(...position); parent.add(joint); joints.push(joint); return joint;
  };
  mesh(new THREE.CapsuleGeometry(.185, .32, 5, 12), 'jacket', [0, 1.23, 0]);
  mesh(new THREE.BoxGeometry(.12, .36, .012), 'shirt', [0, 1.28, -.18]);
  mesh(new THREE.CylinderGeometry(.055, .065, .10, 10), 'skin', [0, 1.56, 0]);
  const head = mesh(new THREE.SphereGeometry(1, 16, 12), 'skin', [0, 1.665, -.005]);
  head.scale.set(.115, .135, .115);
  const hair = mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI * .58), 'hair', [0, 1.68, .005]);
  hair.scale.set(.119, .12, .119);
  mesh(new THREE.SphereGeometry(.026, 8, 6), 'skin', [0, 1.655, -.112]);
  for (const side of [-1, 1]) {
    mesh(new THREE.SphereGeometry(.012, 6, 5), 'hair', [side * .041, 1.69, -.107]);
    const arm = pivot(group, [side * .23, 1.47, 0]); arms.push(arm);
    limb(arm, .29, .044, 'jacket');
    const elbow = pivot(arm, [0, -.29, 0]);
    limb(elbow, .27, .038, 'jacket');
    const hand = mesh(new THREE.SphereGeometry(1, 10, 8), 'skin', [0, -.59, 0], arm);
    hand.scale.set(.034, .065, .035);
    const hip = pivot(group, [side * .105, .94, 0]); legs.push(hip);
    limb(hip, .43, .075, 'trousers');
    const knee = pivot(hip, [0, -.43, 0]); knees.push(knee);
    limb(knee, .42, .059, 'trousers');
    mesh(new THREE.BoxGeometry(.12, .09, .20), 'shoe', [0, -.465, -.035], knee);
  }
  let phase = 0;
  return {group, joints,
    pose(distance, heading) {
      group.rotation.y = heading;
      for (const joint of joints) joint.rotation.x = 0;
      if (distance <= .00001) return;
      phase += distance * 8;
      for (let i = 0; i < 2; i++) {
        const swing = Math.sin(phase + i * Math.PI);
        legs[i].rotation.x = swing * .085;
        knees[i].rotation.x = Math.max(0, -swing) * .08;
        arms[i].rotation.x = -swing * .10;
      }
    },
    dispose() {
      group.removeFromParent();
      for (const geometry of geometries) geometry.dispose();
      for (const material of Object.values(materials)) material.dispose();
    }
  };
}
