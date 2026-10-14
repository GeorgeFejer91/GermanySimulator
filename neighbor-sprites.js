const NEIGHBOR_PAINT={parent:'heiko',watcher:'inga',swabian:'schwabingen'};
const FRAMES=16,CELL_WIDTH=128,CELL_HEIGHT=192,ROWS=9,PIVOT=180;
const DISTANCE_PER_CYCLE={parent:16.941176470588236,watcher:16.941176470588236,swabian:7.529411764705882};
const ENTRY={settle:.14,look:.2,greet:.35,release:.22};

function enterState(playback,state){
  if(playback.state!==state){playback.state=state;playback.age=0;playback.terminalShown=false}
}

function spokenFrame(dialogue){
  const time=Math.max(0,Number(dialogue.mediaTime)||0),duration=Number(dialogue.mediaDuration)||0;
  if(time<=.025||duration>0&&time>=duration-.015)return {frame:0,opening:0};
  const line=String(dialogue.line||''),index=duration>0?Math.floor(time/duration*line.length):Math.floor(time*12)%Math.max(1,line.length);
  const letter=(line[Math.min(index,line.length-1)]||'').toLowerCase();
  const measured=Number.isFinite(dialogue.mouthOpen);
  const estimate=/[\s.,!?mbp]/.test(letter)?0:(/[aeiouäöüy]/.test(letter)?.25:.12)+.55*Math.abs(Math.sin(time*16));
  const opening=Math.max(0,Math.min(1,measured?dialogue.mouthOpen:estimate));
  if(opening<.06)return {frame:0,opening};
  const shape=/[ouöüw]/.test(letter)?1:/[eiäy]/.test(letter)?2:0;
  return {frame:1+(Math.ceil(opening*5)-1)*3+shape,opening};
}

export function neighborFrame(actor,playback,dialogue,dt,running,reducedMotion=false){
  const previous=playback.position||[actor.x,actor.y];
  const dx=actor.x-previous[0],dy=actor.y-previous[1],distance=Math.hypot(dx,dy);
  playback.position=[actor.x,actor.y];
  const active=dialogue?.id===actor.id&&dialogue.active===true;
  const talking=active&&dialogue.speaking===true;
  const advancing=running&&!(active&&dialogue.paused);
  if(!advancing&&playback.pose&&active===playback.active&&talking===playback.pose.talking&&
     (!talking||playback.cueToken===dialogue.cueToken))return playback.pose;
  if(advancing){playback.distance=(playback.distance||0)+distance;playback.time=(playback.time||0)+dt;playback.age=(playback.age||0)+dt}
  if(distance>.001){
    playback.row=Math.abs(dx)>Math.abs(dy)?dx>0?1:3:dy>0?0:2;
  }
  const moving=running&&!active&&(actor.jwdMoving>.001||distance>.001);
  if(active&&!playback.active)enterState(playback,'settle');
  if(!active&&playback.active){enterState(playback,'release');playback.mouthFrame=0;playback.cueToken=null}
  if(talking){
    enterState(playback,'talk');
    if(playback.cueToken!==dialogue.cueToken){playback.cueToken=dialogue.cueToken;playback.mouthFrame=0}
    if(advancing){const cue=spokenFrame(dialogue);playback.mouthFrame=cue.frame;playback.mouthOpen=cue.opening}
  }else if(active){
    playback.mouthFrame=0;playback.mouthOpen=0;playback.cueToken=null;
    if(playback.state==='talk')enterState(playback,'listen');
    if(advancing&&playback.state==='settle'&&playback.age>=ENTRY.settle)enterState(playback,'look');
    else if(advancing&&playback.state==='look'&&playback.age>=ENTRY.look&&playback.terminalShown)enterState(playback,'greet');
    else if(advancing&&playback.state==='greet'&&playback.age>=ENTRY.greet&&playback.terminalShown)enterState(playback,'listen');
  }else if(moving)enterState(playback,'walk');
  else if(playback.state!=='release'||advancing&&playback.age>=ENTRY.release&&playback.terminalShown)enterState(playback,'idle');
  playback.active=active;
  const state=playback.state;
  let row=4,frame=reducedMotion?0:Math.floor((playback.time||0)*8)%FRAMES;
  if(state==='walk'){row=playback.row||0;frame=Math.floor((playback.distance||0)/(DISTANCE_PER_CYCLE[actor.jwdRole]||16.941176470588236)*FRAMES)%FRAMES}
  else if(state==='talk'){row=5;frame=playback.mouthFrame||0}
  else if(state==='listen'){row=6;frame=reducedMotion?0:Math.floor((playback.age||0)*8)%FRAMES}
  else if(state==='greet'||state==='release'){row=7;frame=reducedMotion?0:Math.min(15,Math.floor((playback.age||0)/ENTRY[state]*15));if(state==='release')frame=15-frame}
  else if(state==='look'){row=8;frame=reducedMotion?0:Math.min(15,Math.floor((playback.age||0)/ENTRY.look*15))}
  else if(state==='settle'){row=4;frame=0}
  if(ENTRY[state]&&state!=='settle'&&playback.age>=ENTRY[state])playback.terminalShown=true;
  const pose={row,frame,state,moving,talking,cueToken:playback.cueToken,mouthOpen:talking?playback.mouthOpen||0:0,
    visible:active||state==='release'||moving||!actor.jwdWorking};
  playback.pose=pose;return pose;
}

export function createNeighborSprite(T,actor,host,queueAsset,camera){
  const name=NEIGHBOR_PAINT[actor.jwdRole];if(!name)return null;
  const owner={retired:false},playback={},fallback=host.children.slice();
  let sprite=null,texture=null,lastTime=null,lastPose=null;
  queueAsset(()=>({x:host.position.x,z:host.position.z}),2,()=>new Promise(resolve=>{
    const version='20261014-neighbor-performance';
    new T.TextureLoader().load(`./assets/characters/neighbors/${name}${innerWidth<=600&&devicePixelRatio<2?'-mobile':''}.webp?v=${version}`,loaded=>{
      if(owner.retired){loaded.dispose();resolve(false);return}
      texture=loaded;texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;
      texture.minFilter=texture.magFilter=T.LinearFilter;texture.premultiplyAlpha=true;
      const height=1.6*CELL_HEIGHT/170;
      const geometry=new T.PlaneGeometry(height*CELL_WIDTH/CELL_HEIGHT,height);
      const material=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.08,
        depthWrite:true,premultipliedAlpha:true,side:T.DoubleSide});
      sprite=new T.Mesh(geometry,material);sprite.name=`${name} painted neighbor`;
      sprite.userData.neighborPaint=true;sprite.visible=false;host.add(sprite);resolve(true);
    },undefined,error=>{console.warn('Neighbor paint unavailable; keeping articulated neighbor',error);resolve(false)});
  }),owner);
  return {
    sync(now,hud,dialogue,reducedMotion){
      const dt=lastTime==null?0:Math.min(.1,Math.max(0,now-lastTime));lastTime=now;
      const running=!!hud?.started&&!hud.paused&&!document.hidden&&(!hud.busy||dialogue?.id===actor.id);
      const pose=neighborFrame(actor,playback,dialogue,dt,running,reducedMotion);lastPose=pose;
      if(!sprite)return;
      sprite.visible=pose.visible;
      if(!pose.visible)return;
      for(const mesh of fallback)mesh.visible=false;
      const uv=sprite.geometry.attributes.uv,u0=pose.frame/FRAMES,v0=1-(pose.row+1)/ROWS;
      uv.setXY(0,u0,v0+1/ROWS);uv.setXY(1,u0+1/FRAMES,v0+1/ROWS);
      uv.setXY(2,u0,v0);uv.setXY(3,u0+1/FRAMES,v0);uv.needsUpdate=true;
      sprite.quaternion.copy(host.quaternion).invert().multiply(camera.quaternion);
      const pivot=sprite.geometry.parameters.height*(PIVOT/CELL_HEIGHT-.5);
      sprite.position.set(0,pivot,0).applyQuaternion(sprite.quaternion);
    },
    restore(){for(const mesh of fallback)mesh.visible=true;if(sprite)sprite.visible=false},
    inspect(){return {loaded:!!sprite,visible:!!sprite?.visible,row:lastPose?.row??0,frame:lastPose?.frame??0,
      state:lastPose?.state,cueToken:lastPose?.cueToken,mouthOpen:lastPose?.mouthOpen||0,distance:playback.distance||0}},
    dispose(){owner.retired=true;texture?.dispose();sprite?.material.dispose()}
  };
}
