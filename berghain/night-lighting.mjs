import {architecturalRoomAt,architecturalCues} from './architectural-lighting.mjs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {kloRoomAt} from '../assets/models/berghain/klo-bar.mjs';
import {labRoomAt} from '../assets/models/berghain/lab-oratory.mjs';
import {panoramaSanitaryAt} from '../assets/models/berghain/interior-topology.mjs';
import {panoramaWorldPoint,panoramaPassageAt} from '../assets/models/berghain/panorama-registration.mjs';
import {admissionRoomAt} from '../assets/models/berghain/admission.mjs';

// Appearance study: I23/I24 establish localized architectural wash; L01
// establishes colored club lighting, but neither gives current positions,
// candela or a programmed show. These steady cues are authored, not a rig survey.
const spot=(position,target,color,intensity,angle=.65,range=24)=>({position,target,color,intensity,angle,range});
const cues={
  ...architecturalCues(spot),
  outside:[spot([-8,4,22.9],[-7,0,27],'#e8ddc2',160,1,16),spot([0,2.8,22.65],[0,0,24.5],'#ffe3b5',95,.95,10),spot([8,4,22.9],[8,0,26],'#e6ddc7',150,1,15)],
  admission:[...[18.05,20.45].map(z=>spot([-5.25,2.79,z],[-5.25,.6,z],'#e1dcc9',160,1.25,10)),
    spot([-3.1,1.94,18.55],[-3.1,1.1,17.5],'#e8dcc5',60,1.1,5)],
  foyer:[spot([7,5.9,16],[6,0,14],'#dfa46c',160,.85,15),spot([-13,4,16],[-14,0,15],'#bd663f',130,1.1,12),spot([-3,3.8,14.7],[-4,.05,14.4],'#c1a688',140,1.25,10)],
  berghain:[spot([2,16,-8],[6,6.65,-13],'#bb3025',1000,.43,24),spot([10,15,0],[4,6.65,-1],'#537bc0',760,.48,22),spot([5,12,-14],[5,11,-21.5],'#a26051',260,.9,14)],
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
for(const room of ['panoramaToilets','lounge'])for(const light of cues[room]){
  light.position.fromArray(panoramaWorldPoint(light.position.toArray()));
  light.target.fromArray(panoramaWorldPoint(light.target.toArray()));
  if(room==='lounge'){light.position.z+=.4;light.target.z+=.4;}
}
// Registered world-space positions keep the bar wash and low corridor practical
// below their respective ceilings. No inferred fixture inventory or live show.
const worldSpot=(...args)=>{const light=spot(...args);light.position=new THREE.Vector3(...light.position);light.target=new THREE.Vector3(...light.target);return light;};
cues.panorama=[worldSpot([-13.5,17,14.4],[-15.6,14.1,14.4],'#b34375',230,.8,13),
  worldSpot([-9,17,17],[-9,13.25,14],'#567db1',180,.78,12),
  worldSpot([-2,15.9,12.3],[1.5,13.25,12.3],'#d5a06e',75,1,9)];
cues.panoramaPassage=[worldSpot([9,15.6,9.6],[10,13.25,9.6],'#b7a185',80,1.1,9),
  worldSpot([14,15.6,9.6],[14,13.25,9.6],'#b7a185',80,1.1,9),
  worldSpot([17.4,15.25,7.7],[18.6,13.25,7.7],'#b7a185',75,1.1,8)];
// Fixed low-output circulation washes reveal treads while retaining dark rooms.
// These reuse the same three lights; the positions are authoring estimates.
cues.panoramaStair=[worldSpot([5.4,10.3,5.83],[5.4,7.6,5.83],'#afbad0',65,1,8),
  worldSpot([.6,13.1,5.88],[.6,10.3,5.88],'#bca88e',75,1,8),
  worldSpot([-4.3,16.2,5.93],[-4.3,13.2,5.93],'#bca88e',85,1,8)];
cues.loungeStair=[worldSpot([6.4,15.75,10],[5.8,13.75,10],'#c8ab88',65,1.1,7),
  worldSpot([3.7,17.4,10],[3.7,14.7,10],'#c8ab88',70,1,7),
  worldSpot([.6,18.7,10],[.6,16.3,10],'#c8ab88',70,1,7)];

function roomAt(p){
  if(p.z>22.28)return 'outside';
  if(admissionRoomAt(p))return 'admission';
  const architecture=architecturalRoomAt(p);if(architecture)return architecture;
  if(p.z<-15.4)return 'halle';
  if(p.x>22)return 'garden';
  if(p.x>-6&&p.x<8.5&&p.z>4.3&&p.z<7.3&&p.y>6.4&&p.y<13.4)return 'panoramaStair';
  if(p.x>-.4&&p.x<7.5&&p.z>8.9&&p.z<11.4&&p.y>13.1&&p.y<16.5)return 'loungeStair';
  if(p.y>15.8)return 'lounge';
  if(panoramaSanitaryAt(p))return 'panoramaToilets';
  if(panoramaPassageAt(p))return 'panoramaPassage';
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
    const practical=room==='outside'||room==='admission';
    const interior=!day&&room!=='outside'&&room!=='garden';
    // Warm reflected fill keeps circulation surfaces legible between club cues.
    ambient.intensity=day?2.1:practical?.7:interior?.72:.18;
    ambient.color.set(day?'#e0e6dd':practical?'#e0d5bd':interior?'#efd4b0':'#c5cbd8');
    ambient.groundColor.set(day?'#6a665b':practical?'#8c806a':interior?'#9f8061':'#63657a');
    scene.background=new THREE.Color(day?'#b3b3a6':'#05070b');
    // Keep surfaces clear enough for orientation; no opaque fake haze volumes.
    scene.fog=day?null:new THREE.FogExp2(interior?'#120e0a':'#08090e',interior?.006:.009);
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
