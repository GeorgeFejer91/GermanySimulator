const NEIGHBOR_PAINT={parent:'heiko',watcher:'inga',swabian:'schwabingen',child:'theodore'};
const FRAMES=32,CELL_WIDTH=128,CELL_HEIGHT=192,COLUMNS=16,ROWS=16,PIVOT=180;
const CLIP_OFFSETS=[0,32,64,96,128,136,152,160,176,184,208,232];
const CLIP_COUNTS=[32,32,32,32,8,16,8,16,8,24,24,24];
const DISTANCE_PER_CYCLE={parent:16.941176470588236,watcher:16.941176470588236,swabian:7.529411764705882,child:11.52};
const GESTURES={point:9,present:9,call:10,wave:10,wash:11,sweep:11,inspect:8,listen:6};
const MOUTHS={parent:[57,79,72.8,1.9],watcher:[60,81,70.5,1.8],swabian:[60,83,54.9,1.6],child:[55,70,62,1.4]};
const ENTRY={settle:.14,look:.2,greet:.35,release:.22};

export function neighborWorkMirrored(actor,row,cameraRight){
  if(row!==11||actor.jwdRole==='child'||!Number.isFinite(actor.facing))return false;
  // Game +y maps to world +z. Work source paint faces screen-right; project
  // the subject-facing vector onto camera-right before choosing its handedness.
  return Math.sin(actor.facing)*cameraRight.x+Math.cos(actor.facing)*cameraRight.z<-.01;
}

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
  // jwdMoving is simulation-owned accepted displacement, never desired speed.
  // Speech owns its lips, not the root or distance-driven walk phase.
  const moving=advancing&&(actor.jwdMoving>.001||distance>.001);
  const gesture=Object.hasOwn(GESTURES,actor.jwdGesture)?actor.jwdGesture:null;
  const gestureAge=Math.max(0,Number(actor.jwdGestureAge)||0),gestureDuration=Math.max(.1,Number(actor.jwdGestureDuration)||1.4);
  const gesturing=gesture&&gestureAge<=gestureDuration&&!moving;
  if(active&&!playback.active)enterState(playback,'settle');
  if(!active&&playback.active){enterState(playback,'release');playback.mouthFrame=0;playback.cueToken=null}
  if(talking){
    if(playback.cueToken!==dialogue.cueToken){playback.cueToken=dialogue.cueToken;playback.mouthFrame=0}
    if(advancing){const cue=spokenFrame(dialogue);playback.mouthFrame=cue.frame;playback.mouthOpen=cue.opening}
  }else{
    playback.mouthFrame=0;playback.mouthOpen=0;playback.cueToken=null;
  }
  if(moving)enterState(playback,'walk');
  else if(gesturing)enterState(playback,gesture);
  else if(talking)enterState(playback,'talk');
  else if(active){
    if(playback.state==='walk'||Object.hasOwn(GESTURES,playback.state))enterState(playback,'listen');
    if(playback.state==='talk')enterState(playback,'listen');
    if(advancing&&playback.state==='settle'&&playback.age>=ENTRY.settle)enterState(playback,'look');
    else if(advancing&&playback.state==='look'&&playback.age>=ENTRY.look&&playback.terminalShown)enterState(playback,'greet');
    else if(advancing&&playback.state==='greet'&&playback.age>=ENTRY.greet&&playback.terminalShown)enterState(playback,'listen');
  }else if(actor.jwdWorking&&playback.state!=='release')enterState(playback,actor.jwdActivity==='trim'?'inspect':'work');
  else if(playback.state!=='release'||advancing&&playback.age>=ENTRY.release&&playback.terminalShown)enterState(playback,'idle');
  playback.active=active;
  const state=playback.state;
  let row=4,frame=reducedMotion?0:Math.floor((playback.time||0)*4)%8;
  if(state==='walk'){row=playback.row||0;frame=Math.floor((playback.distance||0)/(DISTANCE_PER_CYCLE[actor.jwdRole]||16.941176470588236)*FRAMES)%FRAMES}
  else if(state==='talk'){row=5;frame=playback.mouthFrame||0}
  else if(gesturing){
    row=GESTURES[gesture];
    frame=reducedMotion?Math.floor((CLIP_COUNTS[row]-1)*.5):Math.min(CLIP_COUNTS[row]-1,Math.floor(gestureAge/gestureDuration*(CLIP_COUNTS[row]-1)));
  }
  else if(state==='work'){row=11;frame=reducedMotion?0:Math.floor((playback.time||0)*16)%24}
  else if(state==='inspect'){row=8;frame=reducedMotion?0:Math.floor((playback.time||0)*5)%8}
  else if(state==='listen'){row=6;frame=reducedMotion?0:Math.floor((playback.age||0)*4)%8}
  else if(state==='greet'||state==='release'){row=7;frame=reducedMotion?0:Math.min(15,Math.floor((playback.age||0)/ENTRY[state]*15));if(state==='release')frame=15-frame}
  else if(state==='look'){row=8;frame=reducedMotion?0:Math.min(7,Math.floor((playback.age||0)/ENTRY.look*7))}
  else if(state==='settle'){row=4;frame=0}
  if(ENTRY[state]&&state!=='settle'&&playback.age>=ENTRY[state])playback.terminalShown=true;
  const pose={row,frame,state,moving,talking,cueToken:playback.cueToken,mouthOpen:talking?playback.mouthOpen||0:0,
    visible:true};
  playback.pose=pose;return pose;
}

export function createNeighborSprite(T,actor,host,queueAsset,camera){
  const name=NEIGHBOR_PAINT[actor.jwdRole];if(!name)return null;
  const owner={retired:false},playback={},fallback=host.children.slice();
  let sprite=null,texture=null,standing=null,lastTime=null,lastPose=null,mouthUniforms=null,lastMirrored=false,settled=false,failed=false;
  for(const mesh of fallback)mesh.visible=false;
  const cameraRight=T.Vector3?new T.Vector3(1,0,0):null;
  queueAsset(()=>({x:host.position.x,z:host.position.z}),2,()=>new Promise(resolve=>{
    new T.TextureLoader().load(`./assets/characters/neighbors/${name}-standing.png`,loaded=>{
      if(owner.retired||sprite){loaded.dispose();resolve(false);return}
      loaded.colorSpace=T.SRGBColorSpace;loaded.generateMipmaps=false;loaded.minFilter=loaded.magFilter=T.LinearFilter;loaded.premultiplyAlpha=true;
      const height=1.6*(actor.jwdRole==='child'?.68:1)*CELL_HEIGHT/170;
      standing=new T.Mesh(new T.PlaneGeometry(height*CELL_WIDTH/CELL_HEIGHT,height),new T.MeshBasicMaterial({map:loaded,transparent:true,alphaTest:.08,depthWrite:true,premultipliedAlpha:true,side:T.DoubleSide}));
      standing.name=`${name} standing paint`;standing.userData.neighborPaint=true;host.add(standing);resolve(true);
    },undefined,error=>{console.warn('Neighbor standing paint unavailable',error);resolve(false)});
  }),owner);
  queueAsset(()=>({x:host.position.x,z:host.position.z}),2,()=>new Promise(resolve=>{
    const version='20261014-neighbor-tours-32-torso';
    new T.TextureLoader().load(`./assets/characters/neighbors/${name}${innerWidth<=600&&devicePixelRatio<2?'-mobile':''}.webp?v=${version}`,loaded=>{
      if(owner.retired){settled=true;loaded.dispose();resolve(false);return}
      texture=loaded;texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;
      texture.minFilter=texture.magFilter=T.LinearFilter;texture.premultiplyAlpha=true;
      const height=1.6*(actor.jwdRole==='child'?.68:1)*CELL_HEIGHT/170;
      const geometry=new T.PlaneGeometry(height*CELL_WIDTH/CELL_HEIGHT,height);
      const material=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.08,
        depthWrite:true,premultipliedAlpha:true,side:T.DoubleSide});
      const profile=MOUTHS[actor.jwdRole];
      mouthUniforms={neighborMouth:{value:0},neighborCell:{value:new T.Vector2()},neighborLip:{value:new T.Vector4(...profile)}};
      // Only a registered front painting receives this bounded connected-lip
      // displacement. Profile/rear and unregistered chore faces retain paint.
      material.onBeforeCompile=shader=>{
        Object.assign(shader.uniforms,mouthUniforms);
        shader.fragmentShader=`uniform float neighborMouth;\nuniform vec2 neighborCell;\nuniform vec4 neighborLip;\n${shader.fragmentShader}`;
        const map=T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D( map, neighborUv )');
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
          vec2 neighborUv=vMapUv;
          if(neighborMouth>0.0){
            vec2 p=vec2((vMapUv.x*16.0-neighborCell.x)*128.0,(1.0-(vMapUv.y*16.0-neighborCell.y))*192.0);
            float f=clamp((p.x-neighborLip.x)/(neighborLip.y-neighborLip.x),0.0,1.0);
            float joined=pow(sin(f*3.14159265),2.0);
            float guard=exp(-pow((p.y-neighborLip.z)/4.0,4.0));
            float aperture=neighborLip.w*neighborMouth*joined;
            float upper=neighborLip.z-aperture*.25,lower=neighborLip.z+aperture*.75;
            float sy=p.y<upper?p.y+(neighborLip.z-upper)*guard:p.y>lower?p.y-(lower-neighborLip.z)*guard:neighborLip.z;
            if(p.x>=neighborLip.x&&p.x<=neighborLip.y&&abs(p.y-neighborLip.z)<8.0)neighborUv.y+=(p.y-sy)/(192.0*16.0);
          }
          ${map}`);
      };
      material.customProgramCacheKey=()=> 'neighbor-connected-front-lips-v1';
      sprite=new T.Mesh(geometry,material);sprite.name=`${name} painted neighbor`;
      sprite.userData.neighborPaint=true;sprite.visible=false;host.add(sprite);settled=true;resolve(true);
    },undefined,error=>{settled=true;failed=true;console.warn('Neighbor animation unavailable; keeping standing paint',error);resolve(false)});
  }),owner);
  return {
    sync(now,hud,dialogue,reducedMotion){
      const dt=lastTime==null?0:Math.min(.1,Math.max(0,now-lastTime));lastTime=now;
      const running=!!hud?.started&&!hud.paused&&!document.hidden&&(!hud.busy||dialogue?.id===actor.id);
      const pose=neighborFrame(actor,playback,dialogue,dt,running,reducedMotion);lastPose=pose;
      for(const mesh of fallback)mesh.visible=false;
      if(standing){standing.visible=!sprite;standing.quaternion.copy(host.quaternion).invert().multiply(camera.quaternion);const pivot=standing.geometry.parameters.height*(PIVOT/CELL_HEIGHT-.5);standing.position.set(0,pivot,0).applyQuaternion(standing.quaternion)}
      if(!sprite)return;
      sprite.visible=pose.visible;
      if(!pose.visible)return;
      for(const mesh of fallback)mesh.visible=false;
      const slot=CLIP_OFFSETS[pose.row]+pose.frame,column=slot%COLUMNS,atlasRow=Math.floor(slot/COLUMNS);
      const uv=sprite.geometry.attributes.uv,u0=column/COLUMNS,v0=1-(atlasRow+1)/ROWS;
      cameraRight.set(1,0,0).applyQuaternion(camera.quaternion);
      lastMirrored=neighborWorkMirrored(actor,pose.row,cameraRight);
      const left=lastMirrored?u0+1/COLUMNS:u0,right=lastMirrored?u0:u0+1/COLUMNS;
      uv.setXY(0,left,v0+1/ROWS);uv.setXY(1,right,v0+1/ROWS);
      uv.setXY(2,left,v0);uv.setXY(3,right,v0);uv.needsUpdate=true;
      mouthUniforms.neighborCell.value.set(column,ROWS-atlasRow-1);
      // The calling hand can cover the lower face: keep its source paint rather
      // than articulating lips through the hand/sleeve occluder.
      mouthUniforms.neighborMouth.value=[0,9].includes(pose.row)||(pose.row===11&&actor.jwdRole==='child')?pose.mouthOpen:0;
      sprite.quaternion.copy(host.quaternion).invert().multiply(camera.quaternion);
      const pivot=sprite.geometry.parameters.height*(PIVOT/CELL_HEIGHT-.5);
      sprite.position.set(0,pivot,0).applyQuaternion(sprite.quaternion);
    },
    restore(){for(const mesh of fallback)mesh.visible=false},
    inspect(){return {loaded:!!sprite,settled,failed,standing:!!standing?.visible,visible:!!sprite?.visible||!!standing?.visible,row:lastPose?.row??0,frame:lastPose?.frame??0,
      state:lastPose?.state,cueToken:lastPose?.cueToken,mouthOpen:lastPose?.mouthOpen||0,distance:playback.distance||0,
      frames:CLIP_COUNTS[lastPose?.row??4],height:actor.jwdRole==='child'?1.088:1.6,mirrored:lastMirrored}},
    dispose(){owner.retired=true;texture?.dispose();sprite?.material.dispose();sprite?.geometry.dispose();if(sprite)host.remove(sprite);standing?.material.map.dispose();standing?.material.dispose();standing?.geometry.dispose();if(standing)host.remove(standing);sprite=null;texture=null;standing=null}
  };
}
