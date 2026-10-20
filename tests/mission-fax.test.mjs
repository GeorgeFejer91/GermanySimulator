import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source=readFileSync(new URL('../game-hud.js',import.meta.url),'utf8').replace(/^import .*\r?\n/gm,'');
function hud({reduced=true,audioRate=1,missionKey,missionTitle='ANMELDUNG I',missionText='Zum Bürgeramt gehen.'}={}){
 let now=0,serial=0,feeds=0,cancellations=0,maskFrames=0;
 const tasks=new Map(),events=new Map(),nodes=new Map();
 const later=(fn,delay=0)=>{const id=++serial;tasks.set(id,{at:now+delay,fn});return id};
 function node(id){
  if(nodes.has(id))return nodes.get(id);
  const handlers=new Map(),classes=new Set(),el={id,hidden:true,open:false,textContent:'',dataset:{},clientHeight:600,rect:{bottom:140,top:700,height:40},style:{removeProperty(){},setProperty(){}},classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c),toggle(c,on){on?classes.add(c):classes.delete(c)}},before(other){other.parentElement=el.parentElement},after(other){other.parentElement=el.parentElement},append(other){other.parentElement=el},setAttribute(){},getClientRects:()=>[],getBoundingClientRect:()=>el.rect,querySelector:selector=>node(id+selector),querySelectorAll:()=>[],contains:other=>other?.parentElement===el,addEventListener:(name,fn)=>handlers.set(name,fn),showModal(){el.open=true},close(){el.open=false;handlers.get('close')?.()},focus(){document.activeElement=el}};
  nodes.set(id,el);return el;
 }
 const ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},clearRect(){},drawImage(){},fillRect(){}};
 const state={started:true,busy:false,lang:'de',energy:100,missionKey},document={hidden:false,activeElement:null,getElementById:node,createElement:()=>({getContext:()=>ctx,toDataURL(){maskFrames++;return'data:image/png;base64,mask'}}),createComment:()=>node('comment-'+ ++serial),querySelector:()=>node('dock'),querySelectorAll:()=>[],body:node('body'),documentElement:node('html'),fonts:{load:()=>({then:()=>({catch(){}})}),ready:{then(){}}},addEventListener:(name,fn)=>events.set(name,fn)};
 node('germanness-hud').parentElement=node('city-status');node('mission-title').textContent=missionTitle;node('mission-text').textContent=missionText;
 node('file-close').parentElement=node('case-file.file-header');node('subtitle-toggle').parentElement=node('app');node('english-subtitle').parentElement=node('app');
 const context=vm.createContext({document,window:{Germany3DBridge:{getHUDState:()=>state,clearInput(){},playFaxTransition(){feeds++;const start=now;return{duration:1.08,elapsed:()=>(now-start)/1000*audioRate,cancel(){cancellations++}}}}},performance:{now:()=>now},setTimeout:later,clearTimeout:id=>tasks.delete(id),requestAnimationFrame:fn=>later(()=>fn(now),16),cancelAnimationFrame:id=>tasks.delete(id),matchMedia:()=>({matches:reduced}),CSS:{supports:()=>true},MutationObserver:class{observe(){}},ResizeObserver:class{observe(){}},getComputedStyle:()=>({zoom:'1',getPropertyValue:()=>0}),innerWidth:1280,innerHeight:800,addEventListener:(name,fn)=>events.set(name,fn)});
 let modalOptions;context.createModalFocus=(root,options)=>{modalOptions=options;return{sync(){}}};vm.runInContext(source,context);
 function advance(ms){const end=now+ms;for(let count=0;count<10000;count++){const next=[...tasks].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next){now=end;return}tasks.delete(next[0]);now=next[1].at;next[1].fn()}throw Error('unbounded timer work')}
 const refresh=()=>{context.window.GermanyHUD.refresh();advance(20)};
 advance(20);
 return{controller:context.window.GermanyHUD,node,state,document,advance,refresh,events,bridge:context.window.Germany3DBridge,modalChanged:next=>modalOptions.onChange(next),get feeds(){return feeds},get cancellations(){return cancellations},get maskFrames(){return maskFrames}};
}

test('modal entry and switches release old input; delayed closure preserves fresh gameplay input',()=>{
 const h=hud(),held={ArrowUp:true};h.bridge.clearInput=()=>{held.ArrowUp=false};
 h.modalChanged(h.node('dialogue'));assert.equal(held.ArrowUp,false);
 held.ArrowUp=true;h.modalChanged(h.node('quiz-modal'));assert.equal(held.ArrowUp,false);
 h.state.busy=false;held.ArrowUp=true;h.modalChanged(null);
 assert.equal(held.ArrowUp,true,'a key admitted after logical close must survive deferred focus release');
});

test('Gaussian frames follow audio elapsed time and leave no idle mask work',()=>{
 const h=hud({reduced:false,audioRate:.5});h.advance(1100);assert.equal(h.node('mission-fax').dataset.transition,'arriving','wall time must not complete a still-active audio feed');assert.equal(h.cancellations,0);assert(h.maskFrames>1&&h.maskFrames<35);
 h.advance(1200);assert.equal(h.node('mission-fax').dataset.transition,undefined);assert.equal(h.cancellations,1);const frames=h.maskFrames;h.advance(1000);assert.equal(h.maskFrames,frames,'idle paper must not keep encoding masks');
});

test('fax is readable for 12 seconds, disappears and returns only after a 150-second gap',()=>{
 const h=hud();assert.equal(h.node('mission-fax').hidden,false);assert.equal(h.feeds,1);
 h.advance(12000);assert.equal(h.node('mission-fax').hidden,false);
 h.advance(2200);assert.equal(h.node('mission-fax').hidden,true);assert.equal(h.feeds,2);
 // Reduced motion hides immediately; its short sound completes before the gap.
 h.advance(149000);assert.equal(h.node('mission-fax').hidden,true);
 h.advance(1000);assert.equal(h.node('mission-fax').hidden,false);assert.equal(h.feeds,3);
});

test('warnings retract once, quiet does not immediately replay, changed objectives do',()=>{
 const h=hud();h.advance(2000);h.node('police-bark').hidden=false;h.refresh();assert.equal(h.node('mission-fax').hidden,true);
 h.node('police-bark').hidden=true;h.refresh();h.advance(10000);assert.equal(h.node('mission-fax').hidden,true);assert.equal(h.feeds,1);
 h.node('mission-text').textContent='Wohnungsgeberbestätigung abholen.';h.refresh();assert.equal(h.node('mission-fax').hidden,false);assert.equal(h.node('fax-text').textContent,'Wohnungsgeberbestätigung abholen.');assert.equal(h.feeds,2);
 assert.equal(h.node('mission-announcement').textContent,'ANMELDUNG I · Wohnungsgeberbestätigung abholen.');
});

for(const reduced of [true,false])test(`stable halo key refreshes the home fax when its authored objective changes; reduced ${reduced}`,()=>{
 const title='LERNE DEINE 3 NACHBARN KENNEN',home='Lerne deine 3 Nachbarn kennen. Folge der Wurst zuerst zu deinem Haus am südwestlichen Berliner Kartenrand. Stell dich in den Leuchtkreis.',neighbors='Lerne Frau Schwabingen, Heiko und Inga Maaslos kennen: 0/3 Nachbarn. Folge dem Leuchtkreis am Boden.';
 const h=hud({reduced,missionKey:'jwd-tour-halo',missionTitle:title,missionText:home});h.advance(2000);
 assert.equal(h.node('dialogue').hidden,true);assert.equal(h.state.busy,false);assert.equal(h.node('mission-fax').hidden,false);assert.equal(h.node('fax-title').textContent,title);assert.equal(h.node('fax-text').textContent,home);assert.equal(h.feeds,1);
 h.node('mission-text').textContent=neighbors;h.refresh();
 assert.equal(h.state.missionKey,'jwd-tour-halo');assert.equal(h.node('dialogue').hidden,true);assert.equal(h.node('mission-fax').hidden,false);assert.equal(h.node('fax-text').textContent,neighbors);assert.equal(h.node('mission-announcement').textContent,title+' · '+neighbors);assert.equal(h.feeds,2);
 h.advance(2000);h.refresh();assert.equal(h.feeds,2,'unchanged halo content must not restart the feed');
 h.node('dialogue').hidden=false;h.refresh();assert.equal(h.node('mission-fax').hidden,true,'visible dialogue still owns attention');
});

for(const reduced of [true,false])test(`a real tour ID keeps its fax stable until the tour identity changes; reduced ${reduced}`,()=>{
 const h=hud({reduced,missionKey:'jwd-tour-1',missionTitle:'RUNDGANG',missionText:'ERSTER HALT'});h.advance(2000);
 h.node('mission-title').textContent='RUNDGANG · ZWEITER HALT';h.node('mission-text').textContent='FOLGE HEIKO';h.refresh();
 assert.equal(h.node('mission-fax').hidden,false);assert.equal(h.node('fax-title').textContent,'RUNDGANG');assert.equal(h.node('fax-text').textContent,'ERSTER HALT');assert.equal(h.feeds,1,'tour progress text must not retrigger a stable actual tour ID');
 h.state.missionKey='jwd-tour-2';h.refresh();assert.equal(h.node('fax-title').textContent,'RUNDGANG · ZWEITER HALT');assert.equal(h.node('fax-text').textContent,'FOLGE HEIKO');assert.equal(h.feeds,2,'new tour identity still refreshes');
});

test('backgrounding cancels the current feed and keeps the reminder gap on resume',()=>{
 const h=hud();h.document.hidden=true;h.events.get('visibilitychange')();assert.equal(h.node('mission-fax').hidden,true);assert.equal(h.cancellations,1);
 h.advance(1000);h.document.hidden=false;h.events.get('visibilitychange')();h.advance(20);assert.equal(h.node('mission-fax').hidden,true);assert.equal(h.feeds,1);
});

test('Germanness stays visible in city play and file pages, hides in the office, and returns on exit',()=>{
 const h=hud();h.state.busy=true;h.refresh();assert.equal(h.node('city-status').hidden,false);
 h.state.busy=false;h.refresh();h.node('file-toggle').onclick();assert.equal(h.node('germanness-hud').parentElement.id,'case-file.file-header');
 h.node('file-close').onclick();assert.equal(h.node('germanness-hud').parentElement.id,'city-status');
 h.document.body.classList.add('amt-inside');h.refresh();assert.equal(h.node('city-status').hidden,true,'office play uses its own HUD');
 h.state.started=false;h.refresh();assert.equal(h.node('city-status').hidden,true,'direct office entry must also hide Germanness');
 h.state.started=true;h.document.body.classList.remove('amt-inside');h.refresh();assert.equal(h.node('city-status').hidden,false,'leaving the office restores Germanness');
});

test('enlarged file anchors trigger whole-document reading and recover when space returns',()=>{
 const h=hud();h.node('file-toggle').onclick();assert.equal(h.node('case-file').dataset.layout,'bounded');
 h.node('case-file.file-header').rect.height=330;h.node('case-file.file-tabs').rect.height=210;h.refresh();assert.equal(h.node('case-file').dataset.layout,'scroll');
 h.node('case-file').clientHeight=900;h.refresh();assert.equal(h.node('case-file').dataset.layout,'bounded');
});

test('the same subtitle control and rail enter the native modal and return on close',()=>{
 const h=hud();h.node('file-toggle').onclick();
 assert.equal(h.node('subtitle-toggle').parentElement.id,'case-file.file-header');
 assert.equal(h.node('english-subtitle').parentElement.id,'case-file');
 h.node('file-close').onclick();
 assert.equal(h.node('subtitle-toggle').parentElement.id,'app');
 assert.equal(h.node('english-subtitle').parentElement.id,'app');
 assert.equal(h.state.started,true);
});

test('fax sound supplies its audio clock, effects bus and cancellation for all scheduled sources',()=>{
 const game=readFileSync(new URL('../game.js',import.meta.url),'utf8'),fn=game.slice(game.indexOf('function playSynthFaxFeed(){'),game.indexOf('\nfunction playFaxFeed('));
 const sources=[],outputs=[],param={setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},bus={},a={currentTime:5,state:'running',sampleRate:100,createGain(){return{gain:param,connect(target){outputs.push(target);return target},disconnect(){}}},createOscillator(){const n={frequency:param,connect(target){return target},start(t){n.startAt=t},stop(t){n.stopAt=t}};sources.push(n);return n},createBufferSource(){return a.createOscillator()},createBuffer:(_,size)=>({getChannelData:()=>new Float32Array(size)}),createBiquadFilter:()=>({frequency:{},Q:{},connect:target=>target})};
 const context=vm.createContext({ensureAudio:()=>a,soundEffectOutput:()=>bus,performance:{now:()=>0}});vm.runInContext(fn+';globalThis.feed=playSynthFaxFeed()',context);
 assert.equal(sources.length,11);assert.equal(context.feed.duration,1.08);assert(outputs.includes(bus));a.currentTime=5.5;assert.equal(context.feed.elapsed(),.5);context.feed.cancel();assert(sources.every(n=>n.stopAt===undefined));
});

for(const reduced of [true,false])test(`welcome fax starts once and cancels on replay, exit and background; reduced ${reduced}`,()=>{
 const h=hud({reduced});h.node('dialogue').hidden=false;h.node('dialogue').classList.add('welcome');h.state.busy=true;h.refresh();
 const feeds=h.feeds,cancels=h.cancellations;
 h.controller.welcomeFax();assert.equal(h.feeds,feeds+1);
 h.refresh();h.refresh();assert.equal(h.feeds,feeds+1,'HUD refresh cannot retrigger the welcome feed');
 h.controller.welcomeFax();assert.equal(h.feeds,feeds+2);assert.equal(h.cancellations,cancels+1,'replay stops the old cue');
 h.controller.stopWelcomeFax();h.controller.stopWelcomeFax();assert.equal(h.cancellations,cancels+2,'Continue cleanup is idempotent');
 h.controller.welcomeFax();h.node('dialogue').hidden=true;h.refresh();assert.equal(h.cancellations,cancels+3,'closing the paper stops its cue');
 h.node('dialogue').hidden=false;h.controller.welcomeFax();h.node('dialogue').classList.remove('welcome');h.refresh();assert.equal(h.cancellations,cancels+4,'another speaker cannot retain fax audio');
 h.node('dialogue').classList.add('welcome');h.controller.welcomeFax();h.document.hidden=true;h.events.get('visibilitychange')();assert.equal(h.cancellations,cancels+5,'backgrounding cancels immediately');
 const hiddenFeeds=h.feeds;h.controller.welcomeFax();assert.equal(h.feeds,hiddenFeeds,'a hidden page cannot start another feed');
 h.document.hidden=false;h.controller.welcomeFax();h.events.get('pagehide')();assert.equal(h.cancellations,cancels+6,'navigation stops the owned cue');
});
