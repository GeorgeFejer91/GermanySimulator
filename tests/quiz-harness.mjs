import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const gameSource=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

function productionSlice(start,end){
 const first=gameSource.indexOf(start),last=gameSource.indexOf(end,first);
 assert.ok(first>=0&&last>first,'Production boundaries: '+start);
 return gameSource.slice(first,last);
}

// Keep the actual area geometry and guards shared by both controller/broker fixtures.
// The block avoids redeclaring world constants when spawnCityCrowd loads its producers.
const gutter=gameSource.match(/RAIL_GUTTER=\d+/)?.[0];
const offset=gameSource.split('\n').find(line=>line.startsWith('const offsetWorldPoint='));
const lane=gameSource.split('\n').find(line=>line.startsWith('const jwdLane='));
assert.ok(gutter&&offset&&lane,'current neighbor protection geometry');
export const neighborProtectionSource='{const '+gutter+';'+offset+lane+'globalThis.jwdLane=jwdLane;}'+
 productionSlice('function neighborActivityActive(','function speechActorCurrent(');

// Executes current controller/data producers. DOM, media delivery, movement,
// reactions and point sinks are doubles; this cannot establish rendered play.
export function createQuizHarness(region='germany'){
 const nodes=new Map();
 const createNode=()=>({hidden:false,style:{},dataset:{},textContent:'',children:[],
  set innerHTML(value){this.children=[]},get innerHTML(){return ''},
  classList:{add(){},remove(){}},appendChild(child){this.children.push(child)},
  removeAttribute(name){delete this[name]},addEventListener(){}});
 const node=id=>{if(!nodes.has(id))nodes.set(id,createNode());return nodes.get(id)};
 node('quiz-modal').hidden=true;
 const npcs=[],effects={speech:[],reactions:[],points:[],feedback:[]};
 const randomMath=Object.create(Math);randomMath.random=()=>.999999;
 const scope=vm.createContext({window:{},npcs,Math:randomMath,
  player:{x:0,y:0},jwd:{tour:null,allocated:true,met:new Set(['jwd-swabian','jwd-parent','jwd-watcher'])},crowdIndex:0,npcSpriteAtlases:{},
  STIMULUS_PRIORITY:{CRITICAL:5},
  document:{getElementById:node,createElement:createNode,
   querySelector:()=>node('portrait-frame'),querySelectorAll:()=>node('quiz-choices').children},
  requestCharacterReaction:(actor,names)=>effects.reactions.push({actor,names}),stopSpeech(){},
  speak:(text,options)=>effects.speech.push({text,...options}),
  nextVariant:(_key,variants)=>variants[0],uiTone(){},
  addGermanness:(delta,label)=>effects.points.push({delta,label}),
  showWorldBark:(...args)=>effects.feedback.push(args),
  dist:(x,y,a,b)=>Math.hypot(x-a,y-b),stimulusBusy:()=>false,
  moveGroundResponder:(n,dx,dy)=>{n.x+=dx;n.y+=dy},orientCrowdSprite(){},advanceSpriteGait(){}});
 vm.runInContext(read('For-AI/QUIZ-CHARACTER-DICTIONARY.js')+read('For-AI/AUDIO-TEXT-LIBRARY.js'),scope);
 scope.speechCatalog=scope.window.GermanySimulatorAudioText;scope.audioTextLibrary=scope.speechCatalog;
 const stateDeclaration=gameSource.split('\n').find(line=>line.startsWith('const state='));
 const limits=gameSource.match(/QUIZ_FOLLOW_MAX_SECONDS=\d+,QUIZ_FOLLOW_BREAK_DISTANCE=\d+/)?.[0];
 const pick=gameSource.match(/pick=list=>list\[Math\.floor\(Math\.random\(\)\*list\.length\)\]/)?.[0];
 assert.ok(stateDeclaration&&limits&&pick,'current state, interest limits and random picker');
 vm.runInContext(stateDeclaration+'const '+limits+';const '+pick+';globalThis.state=state;',scope);
 Object.assign(scope.state,{region,started:true,quizTimer:0});
 vm.runInContext(neighborProtectionSource+productionSlice('function speechClip(','const WURST_TYPES=')+
  productionSlice('const crowdArchetypes=','const germannessVoice=')+
  productionSlice('const citizenshipQuestions=','const violationPools=')+
  productionSlice('const npcLines=','const merzLines=')+
  productionSlice('const crowdNames=','const sidewalkSegments=')+
  productionSlice('function addCrowdPedestrian(','function requestCharacterReaction(')+
  productionSlice('function nextCitizenshipQuestion(','function spawnPointVisible(')+
  'globalThis.questions=citizenshipQuestions;globalThis.people=quizCharacterLibrary.characters;',scope);
 const approach=gameSource.split('\n').find(line=>line.trimStart().startsWith('if(n===state.quizApproach){'));
 assert.ok(approach,'current movement-loop quiz approach branch');
 vm.runInContext('function advanceApproach(dt){for(const n of npcs){'+approach+'}}',scope);
 function knownActor(id='gisela-becker'){
  const person=scope.people.find(person=>person.id===id);assert.ok(person,id);
  const actor={id:'actor-'+id,quizCharacterId:id,voiceId:person.voiceId,name:person.name,
   fullName:person.name,quizzer:true,x:0,y:0};npcs.push(actor);return{person,actor};
 }
 function seedQuestion(category='civic'){
  const index=scope.questions.findIndex(q=>scope.quizQuestionCategory(q)===category);
  assert.ok(index>=0,category);scope.state.quizBag=[index];return scope.questions[index];
 }
 return{scope,state:scope.state,npcs,effects,node,knownActor,seedQuestion};
}

export function spawnCityCrowd(harness){
 const bounds=gameSource.match(/CITY=\{w:\d+,h:\d+\},RAIL_GUTTER=\d+,WORLD=\{[^;]+\}/)?.[0];
 const width=gameSource.match(/^const SIDEWALK_WIDTH=(\d+)/m)?.[1];
 assert.ok(bounds&&width,'current city bounds and sidewalk width');
 vm.runInContext('const '+bounds+';const SIDEWALK_WIDTH='+width+';'+
  gameSource.split('\n').filter(line=>line.startsWith('const horizontalRoads=')||line.startsWith('const verticalRoads=')).join('\n')+
  productionSlice('const stations=Object.freeze([','for(const station of stations){')+
  productionSlice('const sidewalkSegments=[];','let crowdIndex=0;')+
  productionSlice('for(const road of horizontalRoads){\n const y=','const wurstSpots='),harness.scope);
}
