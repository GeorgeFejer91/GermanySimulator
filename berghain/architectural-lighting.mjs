import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {groundSanitaryAt} from '../assets/models/berghain/ground-sanitary.mjs';
import {smokingToAuthor} from '../assets/models/berghain/architectural-circulation.mjs';

const footprint=(x,z)=>[[x[0],z[0]],[x[1],z[0]],[x[1],z[1]],[x[0],z[1]]].map(([x,z])=>studyToSite({x,y:0,z}));
const inside=(p,polygon)=>{
  let side=0;
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length],cross=(b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x);
    if(Math.abs(cross)<1e-7)continue;
    if(side&&side*Math.sign(cross)<0)return false;
    side=Math.sign(cross);
  }
  return true;
};
const smoking=footprint([21.3,33.2],[2.8,10.6]);
const eisbar=footprint([13,21.9],[-21.5,-13.2]);
const mainStair=footprint([5,17.2],[9.3,21.6]);
// Include the dance-floor approach so the descent is visible before entry.
const mainStairApproach=footprint([5,17.2],[7.3,9.3]);

export function architecturalRoomAt(p){
  if(groundSanitaryAt(p))return 'groundToilets';
  if(inside(p,smoking)&&p.y<11.3)return p.y<5.2?'smokingEscape':'smoking';
  if(inside(p,eisbar)&&p.y>5.2&&p.y<14)return 'eisbar';
  if(inside(p,mainStair)&&p.y<6)return 'mainStair';
  if(p.y>5.2&&p.y<5.8&&inside(p,mainStairApproach))return 'mainStair';
  return null;
}

// Fixed appearance cues for the newly reconstructed routes. Positions and
// photometry are authored estimates, not an assertion about the club's rig.
export function architecturalCues(spot){
  const towerSpot=(position,target,...args)=>spot(smokingToAuthor(position),smokingToAuthor(target),...args);
  return {
    mainStair:[spot([8,5.7,18],[8,1.7,16],'#a87955',160,1.15,11),spot([10,5.6,20.5],[10,2.75,20.5],'#ba8b65',140,1.25,9),spot([12,8,11],[12,5.45,10.7],'#a18b74',130,1.15,11)],
    eisbar:[spot([19.3,11.1,-15],[19.35,9.6,-17],'#839fba',160,1.05,12),spot([16.2,14.3,-14],[16.2,10.5,-17],'#a4aca8',160,1.2,11),spot([14.1,9.5,-14.4],[14.1,5.45,-16],'#98a6ad',80,1,10)],
    smoking:[towerSpot([25.4,10.9,-20.2],[27,9.05,-20],'#a3aaa1',110,1.15,11),towerSpot([25.5,10.2,-11.3],[25.5,7.25,-11.3],'#a2a79f',100,1.2,10),towerSpot([24.7,8,-17],[24.5,5.45,-17],'#ada28d',85,1.15,10)],
    smokingEscape:[towerSpot([24,5.7,-20],[24,.05,-19],'#b09a75',75,1.1,11),towerSpot([26,5.9,-11.3],[25.5,2.75,-11.3],'#b09a75',80,1.15,10)],
    groundToilets:[-19.5,-15,-11.5].map(x=>spot([x,2.7,20.2],[x,.05,20.2],'#b4b8a4',65,1.1,7)),
  };
}
