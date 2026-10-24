import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {kloRoomAt} from '../assets/models/berghain/klo-bar.mjs';
import {labRoomAt} from '../assets/models/berghain/lab-oratory.mjs';
import {panoramaSanitaryAt} from '../assets/models/berghain/interior-topology.mjs';

// Appearance study: I23/I24 establish localized architectural wash; L01
// establishes colored club lighting, but neither gives current positions,
// candela or a programmed show. These steady cues are authored, not a rig survey.
const spot=(position,target,color,intensity,angle=.65,range=24)=>({position,target,color,intensity,angle,range});
const cues={
  outside:[spot([0,3.6,24],[0,0,25],'#ddaa72',45,.95,10),spot([7,4,19],[6,0,18],'#c77849',80,.7,10)],
  foyer:[spot([7,5.9,16],[6,0,14],'#dfa46c',160,.85,15),spot([-13,4,16],[-14,0,15],'#bd663f',100,.8,12)],
  berghain:[spot([2,16,-8],[6,6.65,-13],'#bb3025',1000,.43,24),spot([10,15,0],[4,6.65,-1],'#537bc0',760,.48,22),spot([8,10,9],[8,6.65,11],'#d19661',90,.85,9)],
  panorama:[spot([-18,17,-14],[-12,13.25,-14],'#b34375',230,.8,13),spot([-8,17,-8],[-14,13.25,-8],'#567db1',180,.78,12),spot([-8,17,3],[-9,13.25,3],'#d5a06e',75,.8,9)],
  panoramaToilets:[-1.9,.3,2.5].map(z=>spot([-19.3,15.6,z],[-18.7,13.25,z],'#a7b9a8',100,1.1,7)),
  lounge:[-3.7,3,8.2].map(z=>spot([-20.4,18.7,z],[-16,16.35,z],'#cd9a70',90,.9,11)),
  klo:[spot([-16,9.4,5],[-15,6.65,5],'#c38b56',100,.9,10),spot([-10,9,0],[-11,6.65,-2],'#869c8b',60,.9,7)],
  toilets:[spot([-11,9.2,-5],[-11,6.65,-5],'#b2c3b6',90,1,7),spot([-17,9.2,-5],[-17,6.65,-5],'#839e95',70,1,7)],
  saule:[spot([3,4.7,-8],[3,.05,-8],'#b84128',160,.85,12),spot([13,4.7,0],[13,.05,0],'#5a769b',140,.85,12),spot([8,4,17],[8,.05,18],'#d49b68',75,.85,10)],
  lab:[spot([-12,3,-8],[-12,.05,-8],'#a34c29',65,.85,9),spot([-17,3,-15],[-17,.05,-15],'#6c776b',55,.75,9)],
  halle:[spot([-10,12,-33],[-10,.05,-34],'#8d9b9d',280,.75,25),spot([13,7,-31],[15.5,1,-32.3],'#a99b7c',150,.9,15),spot([4,3.5,-26],[4,.05,-28],'#aaa28d',180,1.1,12)],
  garden:[spot([32,4,5],[32,.05,4],'#ba8752',80,.9,12),spot([37,4,-8],[37,.05,-8],'#a88f66',60,.9,12)],
};
const point=([x,y,z])=>{const p=studyToSite({x,y,z});return new THREE.Vector3(p.x,p.y,p.z);};
for(const lights of Object.values(cues))for(const light of lights){light.position=point(light.position);light.target=point(light.target);}

function roomAt(p){
  if(p.z>22.28)return 'outside';
  if(p.z<-15.4)return 'halle';
  if(p.x>22)return 'garden';
  if(p.y>15.8)return 'lounge';
  if(panoramaSanitaryAt(p))return 'panoramaToilets';
  if(p.y>12)return 'panorama';
  const sanitary=kloRoomAt(p);if(sanitary)return sanitary;
  if(p.y>5)return 'berghain';
  if(labRoomAt(p))return 'lab';
  return p.z>11?'foyer':'saule';
}

export function createViewerLighting(scene){
  const group=new THREE.Group();group.name='viewer lighting';scene.add(group);
  const ambient=new THREE.HemisphereLight('#c5cbd8','#63657a',.18);
  const sun=new THREE.DirectionalLight('#ffedcf',3);sun.position.set(-45,65,50);
  sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:180});
  sun.shadow.bias=-.001;sun.shadow.normalBias=.04;sun.target.position.set(0,5,-8);
  group.add(ambient,sun,sun.target);
  // Three fixed scene lights reused across room cues; two bounded shadow maps.
  // No frame loop, animated flash, camera lamp, post-process or extra texture.
  const lamps=Array.from({length:3},(_,i)=>{
    const light=new THREE.SpotLight('#ffffff',0,24,.65,.75,2);
    light.name='club cue '+(i+1);light.castShadow=i<2;
    light.shadow.mapSize.set(512,512);light.shadow.camera.near=.15;
    light.shadow.bias=-.0002;light.shadow.normalBias=.025;
    group.add(light,light.target);return light;
  });
  const state={daylight:true,ambient:2.1,room:'exterior',activeLights:1,shadowMaps:1};
  let previous='';
  return {state,update(mode,position){
    const room=mode==='exterior'?'exterior':roomAt(position);
    if(previous===room)return state;previous=room;
    const day=room==='exterior';sun.visible=day;
    ambient.intensity=day?2.1:.18;
    ambient.color.set(day?'#e0e6dd':'#c5cbd8');ambient.groundColor.set(day?'#6a665b':'#63657a');
    scene.background=new THREE.Color(day?'#b3b3a6':'#05070b');
    // Keep surfaces clear enough for orientation; no opaque fake haze volumes.
    scene.fog=day?null:new THREE.FogExp2('#08090e',.009);
    const definitions=cues[room]||[];
    lamps.forEach((light,i)=>{
      const definition=definitions[i];light.visible=!!definition;
      if(!definition)return;
      light.position.copy(definition.position);light.target.position.copy(definition.target);
      light.color.set(definition.color);light.intensity=definition.intensity;
      light.distance=definition.range;light.angle=definition.angle;light.shadow.needsUpdate=true;
    });
    Object.assign(state,{daylight:day,ambient:ambient.intensity,room,activeLights:day?1:definitions.length,shadowMaps:day?1:Math.min(2,definitions.length)});
    return state;
  },dispose(){
    for(const light of [sun,...lamps])light.dispose();
    scene.remove(group);scene.fog=null;
  }};
}
