import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
const radiance=source.slice(source.indexOf('function buergeramtDoorRadiance('),source.indexOf('function showRendererFailure('));

test('door cycles black, red and gold smoothly over nine seconds, with a bounded slow pulse',()=>{
 const scope=vm.createContext({});vm.runInContext(radiance,scope);const sample=scope.buergeramtDoorRadiance;
 for(const [time,phase] of [[0,0],[1,0],[3,1],[4,1],[6,2],[7,2],[9,0],[18,0]])assert.equal(sample(time).phase,phase);
 assert.equal(sample(2).blend,0);assert.equal(sample(2.5).blend,.5);assert.ok(sample(2.9999).blend>.99999);assert.equal(sample(3).blend,0);
 for(let t=0;t<36;t+=.01){const s=sample(t);assert.ok(s.pulse>=.56-1e-9&&s.pulse<=1+1e-9);assert.ok(s.blend>=0&&s.blend<=1);assert.equal(s.next,(s.phase+1)%3)}
 for(const t of [0,2.5,9,1000])assert.deepEqual(JSON.parse(JSON.stringify(sample(t,true))),{phase:2,next:0,blend:0,pulse:.9});
});

test('invisible, paused and reduced-motion doors freeze their clock; resuming cannot catch up a hidden interval',()=>{
 const color=()=>({copy(){return this},lerp(){return this}}),hud={started:true,busy:false},document={hidden:false},window={GermanyHUD:{paused:false}};
 const glow={slot:{group:{visible:true}},group:{visible:true},lastTime:0,time:0,skin:{color:color(),emissive:color()},flagColors:[0,1,2],glowColors:[0,1,2],raysMaterial:{uniforms:{uColor:{value:color()},uPulse:{value:0},uTime:{value:0}}},light:{color:color(),intensity:0}};
 const scope=vm.createContext({buergeramtDoorGlow:glow,bridge:{getHUDState:()=>hud},document,window,amtReducedMotion:{matches:false}});
 vm.runInContext(radiance+source.slice(source.indexOf('  function updateBuergeramtDoorGlow('),source.indexOf('  function building(b,i){')),scope);
 scope.updateBuergeramtDoorGlow(50);assert.equal(glow.time,.05);assert.ok(glow.light.intensity>0);
 hud.busy=true;scope.updateBuergeramtDoorGlow(100);assert.equal(glow.time,.05);hud.busy=false;
 window.GermanyHUD.paused=true;scope.updateBuergeramtDoorGlow(150);assert.equal(glow.time,.05);window.GermanyHUD.paused=false;
 glow.slot.group.visible=false;scope.updateBuergeramtDoorGlow(10150);assert.equal(glow.light.intensity,0);assert.equal(glow.time,.05);
 glow.slot.group.visible=true;scope.updateBuergeramtDoorGlow(10160);assert.ok(Math.abs(glow.time-.06)<1e-12);
 document.hidden=true;scope.updateBuergeramtDoorGlow(20160);assert.equal(glow.group.visible,false);assert.equal(glow.light.intensity,0);document.hidden=false;
 scope.amtReducedMotion.matches=true;scope.updateBuergeramtDoorGlow(20200);assert.ok(Math.abs(glow.time-.06)<1e-12);assert.equal(glow.phase,2);assert.equal(glow.raysMaterial.uniforms.uTime.value,0);assert.equal(glow.pulse,.9);
 hud.started=false;scope.updateBuergeramtDoorGlow(20250);assert.equal(glow.group.visible,false);assert.equal(glow.light.intensity,0);
});
