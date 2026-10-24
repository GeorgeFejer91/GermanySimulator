import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,unlinkSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {polygonArea,unionArea,localBasis,firstOverhead,compareQuantity,measureArchitecture,architectureReport} from '../berghain/check-architecture.mjs';

const rectangle=(x0,z0,x1,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];

test('area union handles duplicates, partial overlap, concave polygons and a real central hole',()=>{
 assert.equal(polygonArea(rectangle(0,0,4,3)),12);
 assert.equal(unionArea([rectangle(0,0,4,3),rectangle(2,1,6,4)]),20);
 assert.equal(unionArea([rectangle(0,0,4,3),rectangle(0,0,4,3)]),12);
 assert.equal(unionArea([[[0,0],[2,0],[2,1],[1,1],[1,2],[0,2]]]),3);
 assert.equal(unionArea([rectangle(0,0,4,1),rectangle(0,3,4,4),rectangle(0,1,1,3),rectangle(3,1,4,3)]),12);
 assert.equal(unionArea([]),0);
});

test('local basis measures scale, area and shear without treating an affine map as uniform',()=>{
 const map=({x,y,z})=>({x:2*x+.5*z,y,z:3*z}),basis=localBasis(map,7,-2);
 assert.equal(basis.xScale,2);assert.ok(Math.abs(basis.zScale-Math.sqrt(9.25))<=2*Number.EPSILON*Math.sqrt(9.25));assert.equal(basis.areaScale,6);
 assert.ok(basis.angleDegrees<90);assert.ok(Math.abs(basis.zToX-Math.sqrt(9.25)/2)<1e-12);
 const mapped=rectangle(0,0,1,1).map(([x,z])=>{const p=map({x,y:0,z});return[p.x,p.z];});
 assert.equal(polygonArea(mapped),basis.areaScale);
});

test('clearance rays measure actual transformed instance geometry and preserve missing ceilings as null',()=>{
 const geometry=new THREE.BoxGeometry(2,.2,2),material=new THREE.MeshBasicMaterial(),mesh=new THREE.InstancedMesh(geometry,material,1);
 mesh.setMatrixAt(0,new THREE.Matrix4().makeTranslation(3,3.1,4));mesh.updateMatrixWorld(true);
 try{
  const hit=firstOverhead(mesh,{x:3,y:.5,z:4});assert.ok(Math.abs(hit.clearance-2.5)<1e-6);assert.equal(hit.instance,0);
  assert.equal(firstOverhead(mesh,{x:8,y:.5,z:4}),null);
 }finally{geometry.dispose();material.dispose();}
});

test('equal numbers cannot falsely match incompatible units, datums, scopes or area definitions',()=>{
 const source={value:11,unit:'m',scope:'bar-room',datum:'finished-floor',definition:'clear-height',certainty:'nominal'};
 assert.equal(compareQuantity(source,{...source}).status,'nominal-match');
 for(const [key,value]of [['unit','mm'],['datum','source-ground'],['scope','dance-floor'],['definition','external-roof-span']]){
  const result=compareQuantity(source,{...source,[key]:value});assert.equal(result.status,'not-comparable');assert.ok(result.reasons.includes(key));
 }
 assert.equal(compareQuantity({...source,value:null},source).status,'unknown');
 assert.equal(compareQuantity({value:11,unit:'m'},{value:11,unit:'m'}).status,'unknown');
 assert.equal(compareQuantity({...source,value:NaN},source).status,'unknown');
 assert.equal(compareQuantity(source,{...source,value:12}).status,'difference-unquantified');
 const count={value:3,unit:'count',scope:'halle',datum:null,definition:'flights',certainty:'documented-count'};
 assert.equal(compareQuantity(count,{...count,value:2}).status,'documented-count-difference');
});

test('actual architecture separates official consistency from unresolved interior evidence',()=>{
 const report=architectureReport(measureArchitecture());
 assert.ok(report.geometryChecks.every(check=>check.status==='consistent'));
 assert.equal(report.overallPass,undefined);
 const find=id=>report.comparisons.find(row=>row.id===id);
 assert.equal(find('bar-height').status,'nominal-match');
 assert.equal(find('halle-height').status,'not-comparable');assert.ok(find('halle-height').diagnosticDifference>1.7);
 assert.equal(find('dance-clearance').status,'not-comparable');assert.ok(find('dance-clearance').model.value>13);
 assert.equal(find('halle-project-gfa').status,'not-comparable');assert.ok(find('halle-project-gfa').diagnosticRatio>2);
 assert.equal(find('halle-upper-datum').status,'unknown');
 assert.equal(find('halle-voids').status,'documented-count-match');
 assert.equal(find('halle-stairs').model.value,2);assert.equal(find('halle-storeys').model.value,2);
 assert.ok(report.measurements.bases[1].zToX>2);
});

test('altered geometry and nominal dimensions remain differences instead of receiving a fabricated tolerance',()=>{
 const measured=measureArchitecture();measured.officialFootprintArea+=1;measured.barBeamClearance+=.25;
 const report=architectureReport(measured);
 assert.equal(report.geometryChecks.find(check=>check.id==='footprint').status,'difference');
 assert.equal(report.comparisons.find(row=>row.id==='bar-height').status,'difference-unquantified');
 assert.equal(report.comparisons.find(row=>row.id==='halle-height').status,'not-comparable');
});

test('CLI emits a report or an explicitly requested output without an ignored freeze dependency',()=>{
 const script=fileURLToPath(new URL('../berghain/check-architecture.mjs',import.meta.url));
 const report=JSON.parse(execFileSync(process.execPath,[script],{encoding:'utf8'}));
 assert.ok(report.comparisons.length>=15);assert.equal(report.overallPass,undefined);
 const directory=mkdtempSync(join(tmpdir(),'berghain-architecture-')),out=join(directory,'report.json');
 try{
  execFileSync(process.execPath,[script,'--out',out],{encoding:'utf8'});
  assert.equal(JSON.parse(readFileSync(out)).schemaVersion,report.schemaVersion);
 }finally{try{unlinkSync(out);}finally{rmdirSync(directory);}}
});
