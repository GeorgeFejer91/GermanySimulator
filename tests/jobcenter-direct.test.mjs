import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const source=game.slice(game.indexOf('let pendingStart=null'),game.indexOf('function startGame(',game.indexOf('let pendingStart=null')));
function fixture(query='?geheim=jobcenter',blocked=()=>false){
 const classes=new Set(['preloading']);
 const introClasses=new Set(['hidden']);
 const nodes={intro:{classList:{contains:value=>introClasses.has(value)}},start:{setAttribute(){},getAttribute(){}}};
 const opens=[];
 const h={URLSearchParams,location:{search:query},player:{x:40,y:50,r:16,vx:9,vy:5},state:{started:false,modal:true,mission:0,forms:0},
  buildings:[{id:'jobcenter',doorX:9545,doorY:1720}],responderBlocked:blocked,regionOf:()=> 'berlin',updateHud(){},queueAssetLoad(){},prepareNearbyNpcAssets(){},startupNpcAssetsReady:()=>false,
  document:{hidden:false,body:{classList:{contains:value=>classes.has(value)}},getElementById:id=>nodes[id]},
  window:{Germany3D:{ready:false,startupReady:false,prepareNearbyAssets(){}},Germany3DBridge:{characterAssetStatus:{required:[],settled:[]}},GermanyPreload:{prepareMenu(){},update({ready}){if(ready)classes.delete('preloading')}}},
  enterJobcenter(building){opens.push({building,x:h.player.x,y:h.player.y,started:h.state.started});h.state.modal=true}};
 vm.createContext(h);vm.runInContext(source,h);return{h,opens,classes};
}
test('direct link waits for renderer and foreground, then enters only once without city startup admission',()=>{
 const {h,opens,classes}=fixture();
 h.refreshStartup();assert.equal(opens.length,0);assert.equal(classes.has('preloading'),true);
 h.window.Germany3D.ready=true;h.document.hidden=true;h.refreshStartup();assert.equal(opens.length,0);
 h.document.hidden=false;h.refreshStartup();assert.equal(opens.length,1);assert.equal(opens[0].started,true);
 assert.equal(classes.has('preloading'),false);assert.equal(h.state.region,'berlin');assert.equal(h.state.mission,0);assert.equal(h.state.forms,0);
 h.state.modal=false;for(let i=0;i<8;i++)h.refreshStartup();assert.equal(opens.length,1,'leaving cannot reopen a consumed link');
});
test('direct entry uses a body-clear doorway point and retains valid prior position if every candidate is occupied',()=>{
 for(const [blocked,expected] of [[(_x,y)=>y<1840,1840],[()=>true,50]]){
  const {h,opens}=fixture('?geheim=jobcenter',blocked);h.window.Germany3D.ready=true;h.refreshStartup();
  assert.equal(opens.length,1);assert.equal(h.player.y,expected);assert.equal(h.player.vx,0);assert.equal(h.player.vy,0);
 }
});
test('normal and Bürgeramt URLs never enter the Jobcenter',()=>{
 for(const query of ['','?geheim=buergeramt','?geheim=jobcenter-extra']){
  const {h,opens}=fixture(query);h.window.Germany3D.ready=true;h.refreshStartup();assert.equal(opens.length,0);
 }
});
