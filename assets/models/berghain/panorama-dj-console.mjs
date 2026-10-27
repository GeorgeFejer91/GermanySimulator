import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';

export const createDjChainGeometry=()=>new THREE.TorusGeometry(.5,.09,4,12);

// M13/M14 are discovery leads only. A13 and I19/00/06 establish the sloped
// retained instrument front and visible chain links; dimensions/counts are a fit.
export function detailPanoramaDjConsole(layout){
 const fixture=layout.fixtures.find(f=>f.id==='panorama-dj-table');
 const table=layout.parts.find(p=>p.fixture===fixture.id&&p.name.endsWith('table surface'));
 const suspended=layout.parts.filter(p=>p.fixture===fixture.id&&p.name.endsWith('suspension'));
 // Preserve unrelated batch colours before changing any instance count.
 const groups=new Map(),key=p=>[p.section,['mainBarPlaster','panoramaCeilingWash'].includes(p.material)?'pale':p.material,p.shape].join('/');
 for(const p of layout.parts){const k=key(p);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}
 for(const parts of groups.values())parts.forEach((p,i)=>{p.instanceTone??=.84+((i*193+parts.length*37)%101)/625;});
 // Retain the estimated rods, but close their inherited 30 mm floor gap.
 const floorY=layout.panoramaServices.floorHeight;
 for(const leg of layout.parts.filter(p=>p.fixture===fixture.id&&p.name.endsWith('table leg'))){
  const top=leg.center[1]+leg.size[1]/2,height=top-floorY;
  leg.center[1]=(top+floorY)/2;leg.size[1]=height;
  leg.matrix[13]=leg.center[1];leg.matrix[5]=height;
 }
 const retired=new Set(suspended);layout.parts=layout.parts.filter(p=>!retired.has(p));
 const orientation=new THREE.Quaternion(),scale=new THREE.Vector3(),origin=new THREE.Vector3();
 new THREE.Matrix4().fromArray(table.matrix).decompose(origin,orientation,scale);
 const frame=new THREE.Matrix4().compose(new THREE.Vector3(...fixture.anchor),orientation,new THREE.Vector3(1,1,1));
 const first=layout.parts.length;
 function add(name,center,size,material='steel',rotation=new THREE.Quaternion(),shape='box',parent=frame){
  const m=new THREE.Matrix4().multiplyMatrices(parent,new THREE.Matrix4().compose(new THREE.Vector3(...center),rotation,new THREE.Vector3(...size)));
  const p={name:'Panorama console '+name,fixture:fixture.id,consoleDetail:true,section:'interior',shape,material,
   matrix:m.toArray(),center:m.elements.slice(12,15),size,instanceTone:.94};layout.parts.push(p);return p;
 }
 // Crowd side is west in the registered room, the negative local Z side.
 const slopeAngle=.4,panelHeight=.48,panelThickness=.045;
 const slope=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),slopeAngle)
  .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI));
 const tableTop=table.center[1]+table.size[1]/2-fixture.anchor[1];
 const panelY=tableTop+(panelHeight*Math.cos(slopeAngle)+panelThickness*Math.sin(slopeAngle))/2;
 const panelFrame=new THREE.Matrix4().multiplyMatrices(frame,new THREE.Matrix4().compose(new THREE.Vector3(0,panelY,-.31),slope,new THREE.Vector3(1,1,1)));
 for(const x of [-1.12,0,1.12]){
  add('sloped instrument panel',[x,0,0],[1.10,panelHeight,panelThickness],'steel',undefined,'box',panelFrame);
  add('meter bezel',[x,.025,.029],[.22,.17,.014],'rubber',undefined,'box',panelFrame);
  add('meter face',[x,.025,.037],[.18,.13,.006],'pale',undefined,'box',panelFrame);
  for(let tick=0;tick<5;tick++)add('meter scale tick',[x-.066+tick*.033,.062,.041],[.004,.013,.003],'steel',undefined,'box',panelFrame);
  const needle=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-.45);
  add('meter needle',[x-.008,.018,.043],[.004,.068,.003],'steel',needle,'box',panelFrame);
  for(const dx of [-.09,.09])for(const y of [-.045,.095])add('meter bezel fastener',[x+dx,y,.038],[.008,.008,.005],'aluminium',undefined,'box',panelFrame);
 }
 // Rails remain within the retained, conservative desk collision footprint.
 add('front edge rail',[0,1.025,-.407],[3.55,.035,.035]);
 for(const x of [-1.76,1.76])add('edge rail return',[x,1.025,0],[.035,.035,.82]);
 const chains=[];
 for(const [index,old] of suspended.entries()){
  const bottom=old.center[1]-old.size[1]/2,top=old.center[1]+old.size[1]/2;
  const count=Math.ceil((top-bottom)/.075),height=(top-bottom)/(1+.75*(count-1)),pitch=.75*height;
  for(let i=0;i<count;i++)add('chain link',[old.center[0],bottom+height/2+i*pitch,old.center[2]],
   [.043/1.18,height/1.18,.043/1.18],'steel',new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),(i%2)*Math.PI/2),
   'dj-chain',new THREE.Matrix4());
  add('lower chain attachment',[old.center[0],bottom-.015,old.center[2]],[.07,.05,.07],'steel',undefined,'box',new THREE.Matrix4());
  add('upper chain attachment',[old.center[0],top+.015,old.center[2]],[.09,.03,.09],'steel',undefined,'box',new THREE.Matrix4());
  chains.push({index,bottom,top,count,height,pitch,x:old.center[0],z:old.center[2]});
 }
 const clearance=layout.solids.find(s=>s.fixture===fixture.id);
 clearance.y[0]=floorY;
 clearance.y[1]=Math.max(clearance.y[1],...chains.map(c=>c.top+.03));
 fixture.sources=[...new Set([...fixture.sources,'I19'])];
 fixture.console={sources:['A13','I19'],photoViews:[0,6],chains,partCount:layout.parts.length-first,
  evidence:'Photographed sloped instrument front, metal perimeter and chains; source pixels not used',
  uncertainty:'Retained estimated footprint and floor supports; slope, meter inventory/readings, chain gauge/count and attachments estimated. Photograph dates/current retention unresolved; no structural certification.',
  discovery:['M13','M14'],discoveryLimit:'Imagined cardboard artwork is not a geometric reference'};
}
