import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from '../assets/vendor/three/0.186.0/build/three.core.js';

test('the flag halo breathes in size, alpha, brightness and soft glow without changing its center',()=>{
 const source=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
 const h={T,world:new T.Group(),amtReducedMotion:{matches:false},bridge:{getNeighborStandingSpot:()=>({x:12,y:34}),stationElevation:()=>2},X:x=>x/100,Z:y=>y/100};
 vm.createContext(h);vm.runInContext(source.slice(source.indexOf('  const neighborHalo='),source.indexOf('  const modelLoader='))+';globalThis.sample=time=>{neighborHaloTime=time;syncNeighborHalo();return {visible:neighborHalo.visible,scale:neighborHalo.scale.x,position:neighborHalo.position.toArray(),glow:neighborHalo.children[0].material.uniforms.strength.value,bands:neighborHalo.children.slice(1).map(r=>({alpha:r.material.opacity,color:r.material.color.toArray(),depthWrite:r.material.depthWrite}))}}',h);
 const low=h.sample(2.4),high=h.sample(.8),repeat=h.sample(4);
 assert.ok(high.scale>low.scale);assert.ok(high.glow>low.glow);
 assert.deepEqual(high.position,low.position);
 for(let i=0;i<3;i++){assert.ok(low.bands[i].alpha>0&&high.bands[i].alpha<1);assert.ok(high.bands[i].alpha>low.bands[i].alpha);assert.ok(high.bands[i].color[0]>low.bands[i].color[0]);assert.equal(high.bands[i].depthWrite,false)}
 assert.ok(Math.abs(repeat.scale-high.scale)<1e-12);
 h.amtReducedMotion.matches=true;assert.deepEqual(h.sample(0),h.sample(12),'reduced motion keeps a steady readable halo');
 h.bridge.getNeighborStandingSpot=()=>null;assert.equal(h.sample(0).visible,false);
});
