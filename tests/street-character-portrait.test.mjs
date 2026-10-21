import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createStreetPortraitDisplay} from '../street-character-portrait.js';

function fixture(){
 const image={style:{opacity:'.7'}},children=[],writes=[];
 const frame={clientWidth:120,ownerDocument:{createElement(){return{style:{},dataset:{},setAttribute(){},getContext(){return{createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),putImageData:data=>writes.push(data.data.slice())}},remove(){children.splice(children.indexOf(this),1);this.parentNode=null}}}},appendChild(node){children.push(node);node.parentNode=this}};
 const state={target:{original:true},viewport:new THREE.Vector4(3,4,900,700),scissor:new THREE.Vector4(5,6,80,90),test:true,color:new THREE.Color('#abcdef'),alpha:.6};
 const before={...state,viewport:state.viewport.clone(),scissor:state.scissor.clone(),color:state.color.clone()};
 const draws=[],targets=[];
 const renderer={autoClear:false,info:{autoReset:true},getRenderTarget:()=>state.target,setRenderTarget(v){state.target=v;if(v?.isRenderTarget&&!targets.includes(v)){targets.push(v);v.disposals=0;v.addEventListener('dispose',()=>v.disposals++)}},getViewport:v=>v.copy(state.viewport),setViewport(...v){state.viewport.copy(v.length===1?v[0]:new THREE.Vector4(...v))},getScissor:v=>v.copy(state.scissor),setScissor:v=>state.scissor.copy(v),getScissorTest:()=>state.test,setScissorTest:v=>state.test=v,getClearColor:v=>v.copy(state.color),getClearAlpha:()=>state.alpha,setClearColor(c,a){state.color.set(c);state.alpha=a},
  render(scene,camera){if(this.fail)throw Error('GPU lost');const mesh=scene.children[0];draws.push({geometry:mesh.geometry,material:mesh.material,camera,opening:mesh.material.userData.opening})},
  readRenderTargetPixels(target,x,y,w,h,data){for(let row=0;row<h;row++)for(let col=0;col<w;col++){const i=(row*w+col)*4;data[i]=row===0?255:0;data[i+2]=row===h-1?255:0;data[i+3]=255}}
 };
 const geometry=new THREE.PlaneGeometry(1.6,2),material=new THREE.MeshBasicMaterial({map:new THREE.Texture({width:128,height:160})}),mesh=new THREE.Mesh(geometry,material);mesh.position.set(9,4,12);mesh.rotation.y=.8;
 const actor={id:'actual-gisela'},display=createStreetPortraitDisplay({THREE,renderer,frame,image});
 return{image,frame,children,writes,state,before,renderer,draws,targets,mesh,actor,display};
}

test('live portrait samples the actual mesh material/UV and restores the shared renderer completely',()=>{
 const f=fixture(),transform=f.mesh.matrix.clone(),position=f.mesh.position.clone();
 f.mesh.material.userData.opening=.7;
 assert.equal(f.display.update(f.mesh,f.actor,0),true);assert.equal(f.children.length,1);assert.equal(f.draws.length,1);
 assert.equal(f.draws[0].geometry,f.mesh.geometry);assert.equal(f.draws[0].material,f.mesh.material);assert.equal(f.draws[0].opening,.7);
 assert.deepEqual(f.mesh.position,position);assert.deepEqual(f.mesh.matrix,transform);
 for(const key of ['target','test','alpha'])assert.equal(f.state[key],f.before[key]);
 for(const key of ['viewport','scissor','color'])assert.deepEqual(f.state[key],f.before[key]);
 assert.equal(f.renderer.autoClear,false);assert.equal(f.renderer.info.autoReset,true);
 assert.equal(f.image.style.opacity,'0');assert.equal(f.children[0].dataset.actor,f.actor.id);
 assert.deepEqual([...f.writes[0].slice(0,4)],[0,0,255,255],'readback is flipped from GPU bottom-up');
 f.display.dispose();
});

test('bounded sampling uses the current source after pause-sized gaps and actor replacement, without owning shared resources',()=>{
 const f=fixture();let geometryDisposals=0,materialDisposals=0;f.mesh.geometry.addEventListener('dispose',()=>geometryDisposals++);f.mesh.material.addEventListener('dispose',()=>materialDisposals++);
 f.display.update(f.mesh,f.actor,0);f.mesh.material.userData.opening=.2;f.display.update(f.mesh,f.actor,.01);assert.equal(f.draws.length,1);
 f.display.update(f.mesh,f.actor,9);assert.equal(f.draws.at(-1).opening,.2);assert.equal(f.draws.length,2);
 const next={id:'actual-heike'};f.display.update(f.mesh,next,9.001);assert.equal(f.children[0].dataset.actor,next.id);assert.equal(f.draws.length,3);
 f.display.update(null,null,10);assert.equal(f.children.length,0);assert.equal(f.image.style.opacity,'.7');assert(f.targets.every(t=>t.disposals===1));
 f.display.dispose();assert.equal(geometryDisposals,0);assert.equal(materialDisposals,0);
});

test('failed readback restores state, shows static fallback and cannot retry every frame',()=>{
 const f=fixture();f.renderer.fail=true;
 assert.equal(f.display.update(f.mesh,f.actor,0),false);assert.equal(f.display.inspect().failed,true);assert.equal(f.image.style.opacity,'.7');assert.equal(f.children.length,0);assert.equal(f.state.target,f.before.target);assert.deepEqual(f.state.viewport,f.before.viewport);
 const allocations=f.targets.length;f.display.update(f.mesh,f.actor,1);assert.equal(f.targets.length,allocations);
 f.display.update(null,null,2);f.renderer.fail=false;assert.equal(f.display.update(f.mesh,f.actor,3),true);
 f.display.dispose();f.display.dispose();assert(f.targets.every(t=>t.disposals===1));
});

test('sRGB target pixels are unassociated in linear light before straight-alpha ImageData',()=>{
 const f=fixture();
 f.renderer.readRenderTargetPixels=(_target,_x,_y,_w,_h,data)=>{
  for(let i=0;i<data.length;i+=4)data.set([64,32,16,128],i);
 };
 f.display.update(f.mesh,f.actor,0);
 assert.deepEqual([...f.writes[0].slice(0,4)],[90,47,26,128]);
 f.display.dispose();
});
