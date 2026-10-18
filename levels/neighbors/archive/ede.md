# Ede · archived neighbor encounter

Archived at George’s request on 2026-10-18. Ede is omitted from the active four-person neighbor cast. This file is historical source material and is never loaded by the game.

Actor `jwd-burglar`, voice `jwd-ede-einbruch`. His profile remains in [CHARACTERS.md](../For-AI/CHARACTERS.md#ede--einbruch-mit-anspruch). Existing voice recordings, cast records and art stay in their shared asset authorities for recovery. No visit, tour completion or repeat home entry spawns him.

## Original dialogue

```javascript
burglar:{de:["Dit soll der neue Haushalt sein? Eine feuchte Matratze und ein leerer Pfandbeutel. Negative Beute, wa.","Komm, wir brechen nebenan bei Maaslos ein. Da gibt's wenigstens was zu holen. Hier müssten wir noch Möbel dalassen."],en:["This is the new household? A damp mattress and an empty bottle bag. Negative loot.","Come on, let's break into the Maaslos place next door. At least there's something worth taking. Here we'd have to leave furniture behind."]}
```

## Original encounter

Former state fields: `burglarVisit:0, burglar:null`. The following update block was removed from `updateJwd`; recovery would require restoring its state, voice mapping and dialogue intentionally. It is not an enabled feature.

```javascript
 if(!jwd.tour&&jwd.visited&&jwd.visit>=2&&jwd.burglarVisit!==jwd.visit&&!jwd.burglar&&distance<550){
  const rich=buildings.find(b=>b.id==="jwd-kranz"),n={id:"jwd-burglar",name:"EDE · EINBRUCH MIT ANSPRUCH",jwdRole:"burglar",x:rich.doorX,y:rich.doorY+35,vx:0,vy:0,phase:"approach",routeBounds:jwdLane,gardenPaths:jwdGardens.paths,detour:[{x:rich.doorX,y:jwdGardens.crossY},{x:home.doorX,y:jwdGardens.crossY}]};
  if(!responderBlocked(n.x,n.y,13,n)){jwd.burglar=n;jwd.burglarVisit=jwd.visit;npcs.push(n)}
 }
 const thief=jwd.burglar;if(!thief||distance>1200)return false;
 const target=thief.phase==="approach"?home:buildings.find(b=>b.id==="jwd-kranz"),tx=target.doorX,ty=target.doorY+35,dx=tx-thief.x,dy=ty-thief.y,d=Math.hypot(dx,dy),beforeX=thief.x,beforeY=thief.y;
 if(d>(thief.phase==="approach"?68:28)){
  if(thief.phase==="retreat"&&d<75&&responderBlocked(tx,ty,13,thief,tx,ty)){thief.jwdMoving=0;thief.progress=null;thief.detour=null;thief.waiting=false;return false}
  const progress=thief.progress||(thief.progress={time:0,x:thief.x,y:thief.y});progress.time+=dt;
  if(progress.time>=.75){if(Math.hypot(thief.x-progress.x,thief.y-progress.y)<8){thief.detour=jwdLaneDetour(thief,tx,ty);thief.waiting=!thief.detour}Object.assign(progress,{time:0,x:thief.x,y:thief.y})}
  while(thief.detour?.length&&dist(thief.x,thief.y,thief.detour[0].x,thief.detour[0].y)<2)thief.detour.shift();
  const aim=thief.detour?.[0]||{x:tx,y:ty},ax=aim.x-thief.x,ay=aim.y-thief.y,ad=Math.hypot(ax,ay);
  if(!thief.waiting&&ad)moveGroundResponder(thief,ax/ad*Math.min(ad,52*dt),ay/ad*Math.min(ad,52*dt),13);
  thief.jwdMoving=Math.hypot(thief.x-beforeX,thief.y-beforeY);if(thief.jwdMoving>.001)thief.facing=Math.atan2(thief.x-beforeX,thief.y-beforeY);
 }
 else if(thief.phase==="approach"){
  thief.jwdMoving=0;
  if(jwd.tour||state.dialogue||dist(player.x,player.y,thief.x,thief.y)>=300)return false;
  thief.phase="inspect";clearInput();state.characterSpeaker=thief;openDialogue(thief.name,jwdCopy.burglar.de,"!",()=>{thief.phase="retreat";thief.progress=null;thief.detour=[{x:home.doorX,y:jwdGardens.crossY},{x:buildings.find(b=>b.id==="jwd-kranz").doorX,y:jwdGardens.crossY}];thief.waiting=false},jwdVoice(thief),jwdCopy.burglar.en);return true;
 }else if(thief.phase==="retreat"){npcs.splice(npcs.indexOf(thief),1);jwd.burglar=null}

```

## Retired procedural appearance

The procedural burglar paint branch was removed from the live renderer on 2026-10-18.

```javascript
    if(kind==="burglar"){
      paint.fillStyle="#d7ccaf";for(const y of [86,101,116,131])paint.fillRect(28,y,40,5);
      paint.fillStyle="#35312f";paint.fillRect(14,35,68,13);paint.fillRect(17,8,62,13);
      paint.fillStyle="#9a7752";paint.beginPath();paint.ellipse(77,111,15,24,0,0,Math.PI*2);paint.fill();
    }
```
