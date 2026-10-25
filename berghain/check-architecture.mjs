import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {survey} from '../assets/models/berghain/survey-data.mjs';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite,mainPartId,hallPartId} from '../assets/models/berghain/calibration.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';

const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],subtract=(a,b)=>a.map((value,i)=>value-b[i]);
const site=(x,z,y=0)=>studyToSite({x,y,z});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const polygonArea=polygon=>Math.abs(polygon.reduce((sum,a,i)=>{const b=polygon[(i+1)%polygon.length];return sum+cross(a,b);},0))/2;

function scanIntervals(polygon,x){
 const crossings=[];
 for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length];
  if(x>Math.min(a[0],b[0])&&x<Math.max(a[0],b[0]))crossings.push(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));
 }
 crossings.sort((a,b)=>a-b);return crossings.flatMap((value,i)=>i%2?[]:[[value,crossings[i+1]]]);
}

export function unionArea(polygons){
 const edges=polygons.flatMap(p=>p.map((a,i)=>[a,p[(i+1)%p.length]])),xs=polygons.flatMap(p=>p.map(v=>v[0]));
 for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){
  const [p,p2]=edges[i],[q,q2]=edges[j],r=subtract(p2,p),s=subtract(q2,q),den=cross(r,s);if(Math.abs(den)<1e-12)continue;
  const t=cross(subtract(q,p),s)/den,u=cross(subtract(q,p),r)/den;if(t>0&&t<1&&u>0&&u<1)xs.push(p[0]+t*r[0]);
 }
 const sorted=[...new Set(xs)].sort((a,b)=>a-b);let total=0;
 // Between vertices/intersections the union length is linear, so its midpoint integral is exact.
 for(let i=0;i<sorted.length-1;i++){
  const dx=sorted[i+1]-sorted[i];if(dx<1e-10)continue;const x=(sorted[i]+sorted[i+1])/2;
  const intervals=polygons.flatMap(p=>scanIntervals(p,x)).sort((a,b)=>a[0]-b[0]);
  let length=0,end=-Infinity;for(const [a,b]of intervals){length+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}total+=length*dx;
 }
 return total;
}

export function localBasis(map,x,z){
 const p=map({x,y:0,z}),qx=map({x:x+1,y:0,z}),qz=map({x,y:0,z:z+1});
 const a=[qx.x-p.x,qx.z-p.z],b=[qz.x-p.x,qz.z-p.z],xScale=Math.hypot(...a),zScale=Math.hypot(...b);
 return {at:{x,z},xAxis:a,zAxis:b,xScale,zScale,zToX:zScale/xScale,areaScale:Math.abs(cross(a,b)),
  angleDegrees:Math.acos(Math.max(-1,Math.min(1,(a[0]*b[0]+a[1]*b[1])/xScale/zScale)))*180/Math.PI};
}

export function firstOverhead(model,position){
 const ray=new THREE.Raycaster(new THREE.Vector3(position.x,position.y+.001,position.z),new THREE.Vector3(0,1,0));
 const hit=ray.intersectObject(model,true)[0];
 return hit?{clearance:hit.distance+.001,mesh:hit.object.name,instance:hit.instanceId,point:hit.point.toArray()}:null;
}

export function compareQuantity(source,model){
 const numerical=Number.isFinite(source.value)&&Number.isFinite(model.value);
 const result={source,model,diagnosticRatio:numerical&&source.unit===model.unit&&source.value!==0?model.value/source.value:null,
  diagnosticDifference:numerical&&source.unit===model.unit?model.value-source.value:null};
 if(!numerical)return {...result,status:'unknown',reasons:['missing-quantity']};
 const missing=['unit','scope','datum','definition'].filter(key=>!Object.hasOwn(source,key)||!Object.hasOwn(model,key));
 if(missing.length)return {...result,status:'unknown',reasons:missing.map(key=>'missing-'+key)};
 const reasons=['unit','scope','datum','definition'].filter(key=>source[key]!==model[key]);
 if(reasons.length)return {...result,status:'not-comparable',reasons};
 const equal=Math.abs(model.value-source.value)<=Number.EPSILON*64*Math.max(1,Math.abs(source.value),Math.abs(model.value));
 const status=source.certainty==='documented-count'?(equal?'documented-count-match':'documented-count-difference'):(equal?'nominal-match':'difference-unquantified');
 return {...result,status,reasons:[],equalityMeaning:'Arithmetic equality only; no source measurement uncertainty or acceptance tolerance inferred'};
}

function insideConvex(position,polygon){
 let sign=0;for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],value=cross(subtract(b,a),[position.x-a[0],position.z-a[1]]);
  if(Math.abs(value)<1e-7)continue;if(sign&&sign*Math.sign(value)<0)return false;sign=Math.sign(value);
 }return true;
}

function halleTopology(floors){
 const upper=floors.filter(f=>f.halle&&f.endY===undefined),empty=new Set();
 for(let x=0;x<105;x++)for(let z=0;z<67;z++)if(!upper.some(f=>insideConvex(site(-20.9+x*.4,-43+z*.3),f.polygon)))empty.add(`${x},${z}`);
 let voids=0;while(empty.size){voids++;const queue=[empty.values().next().value];empty.delete(queue[0]);
  while(queue.length){const [x,z]=queue.pop().split(',').map(Number);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const key=`${x+dx},${z+dz}`;if(empty.delete(key))queue.push(key);}}
 }
 return {voids,flights:floors.filter(f=>f.halle&&f.endY!==undefined).length,
  storeys:new Set([floors.find(f=>f.name==='Halle ground').y,...upper.map(f=>f.y)]).size,
  method:'Missing-support connected components sampled on existing Halle authoring bounds at.4×.3 spacing; sampling is not metrology'};
}

export function measureArchitecture(){
 const parts=survey.parts.map(part=>({id:part.id,footprintDate:part.footprintDate,measuredHeight:part.measuredHeight,
  area:polygonArea(part.surfaces.find(s=>s.type==='GroundSurface').polygons[0].outer.map(p=>[p[0],p[2]])),
  roof:Math.max(...part.surfaces.filter(s=>s.type==='RoofSurface').flatMap(s=>s.polygons.flatMap(p=>p.outer.map(v=>v[1]))))}));
 const groundParts=layout.floors.filter(f=>f.name==='Halle ground'),ground=groundParts[0],upper=layout.floors.filter(f=>f.halle&&f.endY===undefined);
 const floors=layout.floors.map(f=>({name:f.name,y:f.y,endY:f.endY,area:f.polygon?polygonArea(f.polygon):(f.x[1]-f.x[0])*(f.z[1]-f.z[0])}));
 const stairs=layout.floors.filter(f=>f.endY!==undefined).map(f=>({name:f.name,datums:[f.y,f.endY],rise:Math.abs(f.endY-f.y),
  run:Math.hypot(f.rampAxis[1][0]-f.rampAxis[0][0],f.rampAxis[1][1]-f.rampAxis[0][1])}));
 const mainFloor=floors.find(f=>f.name==='Berghain dance floor').y,panoramaFloor=floors.find(f=>f.name==='Panorama Bar').y;
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  const rays=Object.fromEntries([['halle',site(0,-34,ground.y)],['dance',site(5,0,mainFloor)],['bar',site(17,-5,layout.mainBar.floorHeight)],['panorama',site(-13,-13,panoramaFloor)]]
   .map(([name,position])=>[name,{position,hit:firstOverhead(model,position)}]));
  const beamBottom=Math.min(...layout.parts.filter(p=>p.role==='roof beam').map(p=>p.center[1]-p.size[1]/2));
  return {units:'metres',parts,officialFootprintArea:parts.reduce((sum,p)=>sum+p.area,0),frontage:distance(site(-22,22),site(22,22)),
   halleWidth:distance(site(-22,-33),site(22,-33)),halleDepth:distance(site(0,-22),site(0,-44)),
   bases:[[0,0],[0,-33],[-20,-43],[20,-23]].map(([x,z])=>localBasis(studyToSite,x,z)),
   halleGroundArea:unionArea(groundParts.map(f=>f.polygon)),halleUpperArea:unionArea(upper.map(f=>f.polygon)),
   halleUpperSum:upper.reduce((sum,f)=>sum+polygonArea(f.polygon),0),halleUpperDatum:upper[0].y,
   barBeamClearance:beamBottom-layout.mainBar.floorHeight,barFloor:layout.mainBar.floorHeight,mainGroundDatum:floors.find(f=>f.name.startsWith('foyer')).y,
   floors,stairs,rays,halleTopology:halleTopology(layout.floors),sourceGroundAltitudeOffset:survey.frame.origin[2]};
 }finally{disposeBerghainModel(model);}
}

export const sources={
 A01:{url:'https://www.karhard.de/projects/berghain',documentDate:null,phase:'2004 conversion; project page2003–',type:'architect historical project account'},
 A05:{url:'https://www.karhard.de/projects/halle-am-berghain',documentDate:'2022',type:'architect completed-project account'},
 A06:{url:'https://www.zrs.berlin/en/project/halle-am-berghain-refurbishment-and-structural-upgrading/',documentDate:null,phase:'construction2022-01–2022-07',type:'structural engineer project account'},
 A07:{url:'https://www.moderne-regional.de/interview-mythos-berghain/',documentDate:'2021-01-08',type:'primary interview with project architect'},
 A20:{url:'https://archplus.net/de/ausgabe/201/202/',documentDate:'2011-03',type:'publisher preview nominal38×38 retained in catalogue; paragraph not independently re-acquired in2026-10-24 text pass'},
 G07:{url:'https://gdi.berlin.de/services/wfs/alkis_gebaeude',documentDate:null,retrieved:'2026-10-23',type:'official cadastral mapping, digitised from maps'},
 G09:{url:'https://gdi.berlin.de/data/a_lod2/atom/LoD2_394_5819.zip',documentDate:'2026-03-02',footprintDate:'2023-03-11',retrieved:'2026-10-23',type:'generalised external LoD2; no interior'}
};

function evidence(id,sourceIDs,value,unit,scope,definition,datum,uncertainty,modelValue,modelOverrides={},finding=null,certainty='nominal'){
 const source={value,unit,scope,definition,datum,uncertainty,certainty},model={value:modelValue,unit,scope,definition,datum,...modelOverrides};
 return {id,sourceIDs,sourceDates:sourceIDs.map(key=>({id:key,date:sources[key].documentDate,phase:sources[key].phase??null})),finding,...compareQuantity(source,model)};
}

function geometryChecks(m){
 const roof=m.parts.find(p=>p.id===hallPartId).roof,actualRoof=m.rays.halle.hit?m.rays.halle.hit.point[1]:null;
 const checks=[
  {id:'footprint',sourceIDs:['G07','G09'],expected:survey.cadastralArea,actual:m.officialFootprintArea,tolerance:.005,basis:'Half the published0.01m² rounding unit; not survey accuracy'},
  {id:'frontage',sourceIDs:['G09'],expected:survey.frontage,actual:m.frontage,tolerance:Math.SQRT2*.000001,basis:'Two endpoints with six-decimal metre coordinate rounding'},
  {id:'roof',sourceIDs:['G09'],expected:roof,actual:actualRoof,tolerance:2**(Math.floor(Math.log2(roof))-23),basis:'One Float32ULP at stored roof height'}
 ];
 return checks.map(check=>({...check,status:check.actual===null?'unavailable':Math.abs(check.actual-check.expected)<=check.tolerance?'consistent':'difference'}));
}

export function architectureReport(m){
 const main=m.parts.find(p=>p.id===mainPartId),height=name=>m.rays[name].hit?.clearance??null;
 const rows=[
  evidence('halle-height',['A05','A06'],21,'m','halle','interior-height','finished-floor-to-inner-soffit','Up to21m; no registered floor/soffit section or numerical error bound',height('halle'),{definition:'external-roof-span',datum:'model-floor-to-external-roof'},'unresolved-datum-or-soffit-discrepancy'),
  evidence('historic-turbine-volume',['A01'],18,'m','original-turbine-volume','interior-height','unregistered-historic-floor','Historical two-level volume; not contemporary raised-floor clearance',main.roof-m.mainGroundDatum,{definition:'external-envelope',datum:'model-ground-to-external-roof'},'non-equivalent-datum'),
  evidence('dance-clearance',['A01'],18,'m','original-turbine-volume','interior-height','unregistered-historic-floor','18m does not specify today’s dance-floor clearance',height('dance'),{scope:'current-dance-floor',datum:'model-current-dance-floor-to-roof'},'not-a-valid18m-target'),
  evidence('bar-height',['A07'],11,'m','bar-room','beam-clear-height','local-finished-floor','Interview nominal height; no measured section or numerical uncertainty',m.barBeamClearance,{},'nominal dimension only; absolute floor/footprint/cardinal placement inferred'),
  evidence('halle-project-gfa',['A06'],1180,'m²','refurbished-project','gross-floor-area',null,'Approximate; project boundary unregistered',m.halleGroundArea+m.halleUpperArea,{scope:'whole-model-halle',definition:'horizontal-support-union-sum'},'project-scope-unresolved'),
  evidence('halle-project-net',['A06'],785,'m²','refurbished-project','usable-area',null,'Approximate usable-area definition/boundary unregistered',m.halleGroundArea,{scope:'whole-model-halle-ground',definition:'support-polygon-area'},'net-area-not-ground-footprint'),
  evidence('whole-project-area',['A01'],7300,'m²','whole-architect-project','unspecified-project-area',null,'No full floor-by-floor area schedule',null,{},'no-comparable-model-inventory'),
  evidence('nominal-halle-width',['A20'],38,'m','2011-boiler-project','nominal-width',null,'Catalogue-retained nominal text; no plan recovered',m.halleWidth,{scope:'official-external-halle',definition:'mid-depth-width'},'source-phase-or-scope-conflict'),
  evidence('nominal-halle-depth',['A20'],38,'m','2011-boiler-project','nominal-depth',null,'Catalogue-retained nominal text; no plan recovered',m.halleDepth,{scope:'official-external-halle',definition:'centreline-depth'},'source-phase-or-scope-conflict'),
  evidence('halle-upper-datum',['A05','A06'],null,'m','halle','upper-floor-datum','source-ground','No absolute floor datum published',m.halleUpperDatum,{},'photographic-model-estimate'),
  evidence('main-floor-datum',['A01','A07'],null,'m','main-club','floor-datum','source-ground','First-floor relationship supplies no absolute metric datum',m.floors.find(f=>f.name==='Berghain dance floor').y,{},'unverified-model-estimate'),
  evidence('panorama-floor-datum',['A01','A07'],null,'m','panorama','floor-datum','source-ground','No measured shared section',m.floors.find(f=>f.name==='Panorama Bar').y,{},'unverified-model-estimate'),
  evidence('main-roof-attribute',['G09'],main.measuredHeight,'m','main-hull','CityGML-measuredHeight','source-ground','Attribute20.373 versus surface20.374',main.roof,{definition:'RoofSurface-altitude'},'source-internal1mm-difference')
 ];
 for(const [id,expected,key]of [['halle-voids',3,'voids'],['halle-stairs',2,'flights'],['halle-storeys',2,'storeys']])
  rows.push(evidence(id,['A05','A06'],expected,'count','halle2022',key,null,'Explicit count; position/dimension/currentness unresolved',m.halleTopology[key],{},'count does not establish registered plan','documented-count'));
 return {schemaVersion:1,sourceReviewDate:'2026-10-24',scope:'CPU architectural consistency and source comparisons; no dimensioned interior blueprint obtained',
  sources,geometryChecks:geometryChecks(m),comparisons:rows,measurements:m,
  limitations:['No overall authenticity PASS.','Unknown datums and incompatible area definitions remain unresolved.','Nominal equality is not measured accuracy.','Sampled void topology is not an exhaustive geometric proof.','No render, currentness, accessibility or building-code certification.']};
}

export function runArchitectureCLI(args=process.argv.slice(2)){
 if(args.length!==0&&(args.length!==2||args[0]!=='--out'||!args[1]))throw Error('Usage: node berghain/check-architecture.mjs [--out report.json]');
 const report=architectureReport(measureArchitecture()),json=JSON.stringify(report,null,2)+'\n';
 if(args.length)writeFileSync(args[1],json);else process.stdout.write(json);
 if(report.geometryChecks.some(check=>check.status!=='consistent'))process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))runArchitectureCLI();
