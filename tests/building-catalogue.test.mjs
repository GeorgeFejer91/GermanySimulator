import test from 'node:test';
import assert from 'node:assert/strict';
import buildingData from '../building-catalogue.js';
import {readFileSync} from 'node:fs';

test('shared catalogue is immutable while each runtime receives independent offset records',()=>{
 const {catalogue,createBuildings}=buildingData;
 assert.ok(Object.isFrozen(catalogue)&&catalogue.every(Object.isFrozen));
 assert.equal(new Set(catalogue.map(building=>building.id)).size,catalogue.length);
 const first=createBuildings(560),second=createBuildings(560);
 for(let i=0;i<catalogue.length;i++)for(const key of ['x','y','doorX','doorY'])assert.equal(first[i][key],catalogue[i][key]+560);
 first[0].x=0;first[0].visible=false;
 assert.notEqual(second[0].x,0);assert.equal(catalogue[0].visible,undefined);
 const ids=['bundestag','jobcenter','buergeramt'];
 assert.deepEqual(createBuildings(0,ids).map(building=>building.id),ids);
 assert.throws(()=>createBuildings(0,['unknown']),/Unknown building/);
});

test('canonical browser entry loads the catalogue before its runtime consumer',()=>{
 for(const [file,consumer] of [['index.html','./game.js?']]){
  const source=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const script=source.indexOf('src="./building-catalogue.js?');
  assert.ok(script>=0&&script<source.indexOf(consumer));
 }
});
