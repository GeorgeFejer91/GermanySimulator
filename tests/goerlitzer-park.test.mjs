import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const game=read("game.js"),diagnostic=read("3d.html"),index=read("index.html");
const shared=read("goerlitzer-park.js"),subtitles=read("For-AI/AUDIO-TEXT-LIBRARY.js");
function between(source,start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,`missing source boundaries: ${start} / ${end}`);
 return source.slice(a,b);
}
function line(source,prefix){
 const found=source.split(/\r?\n/).find(text=>text.startsWith(prefix));
 assert.ok(found,`missing runtime declaration: ${prefix}`);
 return found;
}

const sandbox={window:{},matchMedia:()=>({matches:true})};
vm.runInNewContext(shared,sandbox);
const park=sandbox.window.GoerlitzerPark;
assert.deepEqual([park.x,park.y,park.w,park.h,park.plaqueX,park.plaqueY],[2010,2940,800,480,2586,3462],"the city offset must be applied exactly once");
assert.ok(Object.isFrozen(park)&&Object.isFrozen(park.trees),"shared park geometry must be immutable");

// Execute production data declarations and collision code without browser/audio setup.
vm.runInNewContext(`
const CITY={w:9840,h:4240},RAIL_GUTTER=560,WORLD={w:CITY.w+RAIL_GUTTER*2,h:CITY.h+RAIL_GUTTER*2};
${line(game,"const offsetWorldPoint=")}
${line(game,"const player=")}
${line(game,"const goerlitzerPark=")}
${line(game,"const kiesingerMemorial=")}
${line(game,"const wirtschaftswunderSite=")}
${line(game,"const BORDER_Y=")}
${between(game,"const horizontalRoads=","const OFFENSE_TIMING=")}
${line(game,"const borderGates=")}
${between(game,"const desktopBillboards=","const stableSpriteRoot=")}
${between(game,"const buildings=","const missions=")}
${between(game,"const WURST_TYPES=","const state=")}
const crowdArchetypeOrder=[{id:"towel-man",label:"TOWEL",sprite:"crowdTowelMan"}],npcLines=[""];
${between(game,"const npcs=","window.Germany3DBridge=")}
const dist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by),clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
${line(game,"function propRadius(")}
${line(game,"function staticBlocked(")}
${line(game,"function regionOf(")}
globalThis.layout={goerlitzerPark,player,roads,buildings,props,normObjects,pickups,npcs,trees,walkways,TREE_RADIUS,staticBlocked,regionOf};
`,sandbox);
const layout=sandbox.layout;
assert.equal(layout.goerlitzerPark,park,"canonical simulation must use the shared object directly");
assert.equal(layout.trees.length,24+park.trees.length,"park trees must extend the established 24 trees");
for(const tree of park.trees){
 assert.ok(layout.trees.includes(tree),"park trees must not receive a second world offset");
 assert.ok(tree.x>park.x+layout.TREE_RADIUS&&tree.x<park.x+park.w-layout.TREE_RADIUS&&tree.y>park.y+layout.TREE_RADIUS&&tree.y<park.y+park.h-layout.TREE_RADIUS,"tree crowns must stay within the fence");
}
const inside=(x,y,rect,pad=0)=>x>rect.x-pad&&x<rect.x+rect.w+pad&&y>rect.y-pad&&y<rect.y+rect.h+pad;
const overlap=(a,b,pad=0)=>a.x-pad<b.x+b.w&&a.x+a.w+pad>b.x&&a.y-pad<b.y+b.h&&a.y+a.h+pad>b.y;
assert.equal(layout.regionOf(park.y),"berlin");
assert.equal(layout.regionOf(park.y+park.h),"berlin");
for(const rect of [...layout.roads,...layout.buildings])assert.equal(overlap(park,rect,56),false,"the park and legal apron must clear roads and buildings");
for(const point of [layout.player,...layout.props,...layout.normObjects,...layout.pickups,...layout.npcs])assert.equal(inside(point.x,point.y,park,38),false,`${point.name||point.label||point.asset||"spawn"} must not be stranded inside the park`);
assert.ok(layout.walkways.some(rect=>inside(park.plaqueX,park.plaqueY,rect)),"the placard must be reachable on legal pedestrian ground");

for(const radius of [12,16,38]){
 for(let x=park.x;x<=park.x+park.w;x+=20)for(let y=park.y;y<=park.y+park.h;y+=20)assert.equal(layout.staticBlocked(x,y,radius),true,`the whole interior must block radius ${radius} at ${x}/${y}`);
 for(const fraction of [0,.25,.5,.75,1]){
  const x=park.x+park.w*fraction,y=park.y+park.h*fraction;
  for(const [px,py] of [[park.x-radius+1,y],[park.x+park.w+radius-1,y],[x,park.y-radius+1],[x,park.y+park.h+radius-1]])assert.equal(layout.staticBlocked(px,py,radius),true,`fence approach must block radius ${radius}`);
  for(const [px,py] of [[park.x-radius-1,y],[park.x+park.w+radius+1,y],[x,park.y-radius-1],[x,park.y+park.h+radius+1]])assert.equal(layout.staticBlocked(px,py,radius),false,`outside route must clear radius ${radius}`);
 }
 assert.equal(layout.staticBlocked(park.plaqueX,park.plaqueY,radius),false,`placard approach must clear radius ${radius}`);
}

let opened;
Object.assign(sandbox,{state:{dialogue:false,modal:false},openDialogue:(...args)=>{opened=args}});
Object.assign(layout.player,{x:park.plaqueX,y:park.plaqueY});
vm.runInNewContext(`${between(game,"function interact(){","function collect(){")}\ninteract();`,sandbox);
assert.equal(opened?.[1],park.lines,"E interaction must open every sourced line from the outside placard");

for(const [html,next] of [[index,"game.js"],[diagnostic,"const goerlitzerPark="]]){
 const position=html.indexOf('src="./goerlitzer-park.js');
 assert.ok(position>=0&&position<html.indexOf(next),"shared data must load before its entry-point consumer");
}
const debugSandbox={window:{}};
vm.runInNewContext(shared,debugSandbox);
vm.runInNewContext(`${between(diagnostic,"const goerlitzerPark=","const dist=")}\n${line(diagnostic,"function blocked(")}\nglobalThis.blocked=blocked;`,debugSandbox);
const debugBridge=debugSandbox.window.Germany3DBridge;
assert.equal(debugBridge.goerlitzerPark,debugSandbox.window.GoerlitzerPark,"diagnostic must use the same data authority");
for(const tree of debugBridge.goerlitzerPark.trees)assert.ok(debugBridge.trees.includes(tree),"diagnostic must not offset park trees twice");
assert.equal(debugSandbox.blocked(park.x+park.w/2,park.y+park.h/2),true,"diagnostic must also close the interior");
assert.equal(debugSandbox.blocked(park.plaqueX,park.plaqueY),false,"diagnostic must retain the outside placard approach");

vm.runInNewContext(subtitles,sandbox);
assert.equal(park.lines.length,6,"the cost information and closure instructions must remain complete");
for(const text of park.lines)assert.ok(sandbox.window.GermanySimulatorAudioText.lines[text]?.trim(),`missing exact English subtitle for ${text}`);
const sign=park.signLines.join("\n"),explanation=park.lines.join("\n");
for(const fact of ["CDU/SPD","1,8","251.444","netto","775.000","2026","2027"])assert.ok(sign.includes(fact),`placard is missing ${fact}`);
for(const qualifier of ["19/22762","19/25369","2655 F-1","1,74","brutto","192.227","59.217","Haushaltsansatz","keine belegte Jahresausgabe"])assert.ok(explanation.includes(qualifier),`documentary explanation is missing ${qualifier}`);

const parkRenderer=between(read("world3d.js"),"function makeGoerlitzerPark(site)","makeGoerlitzerPark(bridge.goerlitzerPark)");
const printedSigns=[...parkRenderer.matchAll(/sign\(\[([^\]]+)\]/g)].map(match=>match[1]).join("\n");
assert.doesNotMatch(sign+"\n"+explanation+"\n"+printedSigns,/miniatur|miniature|satirisch|spielsatire|fiktiv|fictional|reality check|not real/i,"park signs and dialogue must never explain away the satire or scale");

console.log("Görlitzer Park shared geometry, sealed collision, reachable placard and sourced subtitles OK");
