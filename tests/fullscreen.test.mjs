import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../fullscreen.js',import.meta.url),'utf8');
function harness({allowed=false,supported=true,hidden=false,webkit=false}={}){
 const listeners=new Map(),requests=[];
 const doc={hidden,documentElement:{},addEventListener(type,fn){const list=listeners.get(type)||new Set();list.add(fn);listeners.set(type,list)},removeEventListener(type,fn){listeners.get(type)?.delete(fn)}};
 const field=webkit?'webkitFullscreenElement':'fullscreenElement';
 const dispatch=(type,extra={})=>{const event={type,isTrusted:true,key:'',preventDefault(){this.prevented=true},...extra};for(const fn of [...listeners.get(type)||[]])fn(event);return event};
 if(supported){doc.documentElement[webkit?'webkitRequestFullscreen':'requestFullscreen']=options=>{requests.push(options);if(!allowed)return Promise.reject(new Error('User activation required'));doc[field]=doc.documentElement;dispatch(webkit?'webkitfullscreenchange':'fullscreenchange');return Promise.resolve()};doc[webkit?'webkitExitFullscreen':'exitFullscreen']=()=>{doc[field]=null;dispatch(webkit?'webkitfullscreenchange':'fullscreenchange');return Promise.resolve()}}
 const window={addEventListener(){}};vm.runInNewContext(source,{document:doc,window,Promise});
 return{doc,window,requests,dispatch,allow(){allowed=true},exit(){doc[field]=null;dispatch('fullscreenchange')}};
}
const settle=()=>new Promise(done=>setImmediate(done));

test('load rejection retries on the first real click; Escape remains respected across office calls',async()=>{
 const h=harness();await settle();assert.equal(h.requests.length,1);
 h.dispatch('click',{isTrusted:false});assert.equal(h.requests.length,1);
 h.allow();h.dispatch('click');await settle();assert.equal(h.doc.fullscreenElement,h.doc.documentElement);
 h.exit();h.dispatch('click');h.dispatch('keydown',{key:'w'});await h.window.GermanyFullscreen.autoEnter();assert.equal(h.requests.length,2);
});
test('keyboard entry and Alt+Enter can explicitly leave and reenter',async()=>{
 const h=harness();await settle();h.allow();h.dispatch('keydown',{key:'Escape'});h.dispatch('keydown',{key:'w',repeat:true});assert.equal(h.requests.length,1);
 h.dispatch('keydown',{key:'w'});await settle();assert.ok(h.doc.fullscreenElement);
 assert.equal(h.dispatch('keydown',{key:'Enter',altKey:true}).prevented,true);await settle();assert.equal(h.doc.fullscreenElement,null);
 h.dispatch('keydown',{key:'Enter',altKey:true});await settle();assert.ok(h.doc.fullscreenElement);
});
test('touch release enters fullscreen even when a game control suppresses click',async()=>{
 const h=harness();await settle();h.allow();h.dispatch('pointerup',{pointerType:'touch'});await settle();assert.ok(h.doc.fullscreenElement);
});
test('permitted load entry, missing APIs, hidden pages, and WebKit fallback',async()=>{
 const h=harness({allowed:true});await settle();assert.ok(h.doc.fullscreenElement);assert.equal(h.requests.length,1);
 const unsupported=harness({supported:false});await settle();assert.equal(await unsupported.window.GermanyFullscreen.enter(),false);
 const hidden=harness({hidden:true});await settle();hidden.dispatch('click');assert.equal(hidden.requests.length,0);
 const webkit=harness({allowed:true,webkit:true});await settle();assert.ok(webkit.doc.webkitFullscreenElement);await webkit.window.GermanyFullscreen.toggle();assert.equal(webkit.doc.webkitFullscreenElement,null);
});
test('all entry pages share fullscreen and the call screen has only answer/decline actions',()=>{
 for(const file of ['index.html','3d.html','buergeramt-phone.html'])assert.match(readFileSync(new URL('../'+file,import.meta.url),'utf8'),/src="\.\/fullscreen\.js\?/);
 const phone=readFileSync(new URL('../buergeramt-phone.html',import.meta.url),'utf8');assert.doesNotMatch(phone,/phone-call-silence/);assert.doesNotMatch(phone,/id="phone-silence"/);assert.match(phone,/id="phone-answer"/);assert.match(phone,/id="phone-decline"/);
});
