import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {neighborFrame} from '../neighbor-sprites.js';
import {createSchwabingenProps} from '../schwabingen-props.js';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
function fn(name){
 const start=source.indexOf(`function ${name}(`);assert.ok(start>=0,`missing ${name}`);
 const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?undefined:end);
}
function harness(){
 const actor={id:'jwd-swabian',jwdRole:'swabian',x:780,y:4708,jwdRoute:[]};
 const t={id:1,actor,phase:'dialogue'},h={jwd:{tour:t},dist:(a,b,c,d)=>Math.hypot(c-a,d-b),state:{dialogue:false},
  jwdPath:(_n,p)=>[p],jwdGesture(n){n.jwdMoving=0},advanceJwdTour(){h.advanced=(h.advanced||0)+1},
  walkJwdRoute(n,dt){const p=n.jwdRoute[0];if(!p)return true;if(h.blocked){n.jwdMoving=0;return false}const d=h.dist(n.x,n.y,p.x,p.y),step=Math.min(d,62*dt);n.jwdMoving=step;n.x+=(p.x-n.x)/d*step;n.y+=(p.y-n.y)/d*step;if(d<=step)n.jwdRoute.shift();return !n.jwdRoute.length}};
 vm.createContext(h);vm.runInContext(['beginSchwabingenBird','updateSchwabingenBird','finishJwdTourStop'].map(fn).join('\n'),h);return {...h,h,t,actor};
}
test('one bird visit survives consecutive lines; cleanup requires departure, actual arrival and contact time',()=>{
 const {h,t,actor}=harness(),target={x:910,y:4700,height:.76};
 h.beginSchwabingenBird(t,'schwabingen-hedge-season',target);const scene=actor.jwdBirdScene;
 h.updateSchwabingenBird(t,1);h.beginSchwabingenBird(t,'schwabingen-hedge-release',target);
 assert.equal(actor.jwdBirdScene,scene);assert.equal(scene.age,1);
 h.updateSchwabingenBird(t,2.5);assert.equal(scene.stain,0,'droppings must actually reach the ground first');
 h.updateSchwabingenBird(t,1);assert.equal(scene.stain,1);
 h.finishJwdTourStop(t);assert.equal(t.phase,'cleanup');assert.equal(h.advanced,undefined);
 h.blocked=true;h.updateSchwabingenBird(t,5);assert.equal(scene.stain,1);assert.equal(scene.cleanTime,0);
 h.blocked=false;for(let i=0;i<20;i++)h.updateSchwabingenBird(t,.1);
 assert.ok(actor.x>848,'actor must walk to the mess');assert.equal(scene.phase,'clean');
 for(let i=0;i<40;i++)h.updateSchwabingenBird(t,.1);
 assert.equal(scene.stain,0);assert.equal(h.advanced,1);assert.equal(actor.jwdCleaning,false);
 h.updateSchwabingenBird(t,5);assert.equal(h.advanced,1,'completion is once only');
});
test('bird event is actor/tour owned and replay starts a fresh attempt',()=>{
 const {h,t,actor}=harness();h.beginSchwabingenBird(t,'schwabingen-weeds-law',{});assert.equal(actor.jwdBirdScene,undefined);
 h.beginSchwabingenBird(t,'schwabingen-bird-listen',{x:910,y:4700,height:.76});const original=actor.jwdBirdScene;
 h.beginSchwabingenBird(t,'schwabingen-bird-listen',{});assert.equal(actor.jwdBirdScene,original);
 const next={...t,id:2};h.beginSchwabingenBird(next,'schwabingen-bird-listen',{x:910,y:4700,height:.76});assert.notEqual(actor.jwdBirdScene,original);assert.equal(actor.jwdBirdScene.age,0);
 h.jwd.tour=null;h.updateSchwabingenBird(next,10);assert.equal(actor.jwdBirdScene.age,0,'stale tour cannot advance an event');
});
test('Schwabingen takes a cloth for car washing and never carries the chore broom while walking',()=>{
 const actor={id:'jwd-swabian',jwdRole:'swabian',x:780,y:4670,jwdWorking:true,jwdActivity:'wash'},playback={};
 const work=neighborFrame(actor,playback,null,.1,true);assert.notEqual(work.row,11);assert.equal(work.prop.kind,'cloth');
 const other=neighborFrame(actor,playback,{active:true,id:'jwd-parent',speaking:true},.1,true);assert.notEqual(other.row,11);assert.equal(other.prop.kind,'cloth','another speaker cannot give her the broom');
 const paused=neighborFrame(actor,playback,{active:true,id:'jwd-parent',speaking:true},5,false);assert.notEqual(paused.row,11);assert.equal(paused.prop.kind,'cloth');
 actor.x+=2;actor.jwdMoving=2;const walk=neighborFrame(actor,playback,null,.1,true);assert.equal(walk.row,1);assert.equal(walk.prop,null);
});
test('droppings stay above the actual paving and keep their world anchor during cleanup movement',()=>{
 const actor={id:'jwd-swabian',jwdRole:'swabian',x:780,y:4708,jwdBirdScene:{age:5,releaseAt:2.1,phase:'visit',target:{x:910,y:4700,height:.76},patch:{x:808,y:4742,height:.014},stain:1}};
 const host=new T.Group(),props=createSchwabingenProps(T,actor,host,new T.PerspectiveCamera());props.sync(null,true);
 const stains=host.getObjectByName('Blackbird droppings'),before=new T.Box3().setFromObject(stains);
 assert.ok(before.min.y>.014,'paint must sit above the walkway surface');
 actor.x+=20;host.position.x+=.4;props.sync(null,true);host.updateMatrixWorld(true);const moved=new T.Box3().setFromObject(stains);assert.ok(moved.min.distanceTo(before.min)<1e-8);
 actor.jwdBirdScene.stain=.5;props.sync(null,true);assert.equal(stains.scale.y,1);assert.ok(new T.Box3().setFromObject(stains).min.y>.014,'cleaning shrinks the patch without sinking it under paving');props.dispose();
});
