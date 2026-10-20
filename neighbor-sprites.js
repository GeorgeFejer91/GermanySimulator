import {loadThreeTexture} from './asset-loaders.js?v=20261020-bounded-assets';
import {schwabingenPropFrame,createSchwabingenProps} from './schwabingen-props.js?v=20261020-dialogue-props';
const NEIGHBOR_PAINT={parent:'heiko',watcher:'inga',swabian:'schwabingen',child:'theodore'};
const FRAMES=32,CELL_WIDTH=128,CELL_HEIGHT=192,COLUMNS=16,ROWS=16,PIVOT=180;
const CLIP_OFFSETS=[0,32,64,96,128,136,152,160,176,184,208,232];
const CLIP_COUNTS=[32,32,32,32,8,16,8,16,8,24,24,24];
const NOTEBOOK_OFFSETS=[256,272,288,304];
const DISTANCE_PER_CYCLE={parent:16.941176470588236,watcher:16.941176470588236,swabian:7.529411764705882,child:11.52};
const GESTURES={point:9,present:9,call:10,wave:10,wash:11,sweep:11,inspect:8,listen:6};
const MOUTHS={parent:[57,79,72.8,4.2],watcher:[60,81,70.5,4],swabian:[60,83,54.9,3.7],child:[55,70,61.5,3.2]};
const ENTRY={settle:.14,look:.2,greet:.35,release:.22};

// Pixel registrations belong to the actual painting, including its profile and
// chore source. Rear views have no visible mouth. Original talk cells are baked.
const PROFILE_MOUTHS={parent:[92,99,70.8,3.2],watcher:[93,101,67.2,3.2],swabian:[82,91,54.1,3],child:[79,85.5,61,2.6]};
const WORK_MOUTHS={parent:[80,87,62.2,3.2],watcher:[58,70,59.8,3.8],swabian:[72,84,57.1,3.4],child:MOUTHS.child};
const NOTEBOOK_KEYS=[[0,0,1,1,2,2,2,3,3,3,4,4,5,5,6,6],null,[6,6,7,7,8,8,9,9,9,9,9,9,10,10,9,9],[9,9,9,9,11,11,11,11,12,12,12,2,2,1,0,0]];
const NOTEBOOK_MOUTHS=[MOUTHS.parent,MOUTHS.parent,...[76.4,75.6,75.2,75,75.3,75.8,74.9,75.4,74.7,75.2,74.9].map(y=>[58,80,y,4.2])];
export function neighborMouthProfile(actor,pose){
 const {row,frame}=pose,role=actor.jwdRole;
 if(!MOUTHS[role]||row===2)return null;
 if(row>=12){
  if(role!=='parent')return null;
  const p=NOTEBOOK_MOUTHS[row===13?6:NOTEBOOK_KEYS[row-12][frame]].slice();
  if(row===13){const wave=Math.sin(frame/16*Math.PI*2),head=Math.max(0,Math.min(1,(88-p[2])/20)),dx=(head*.25+.15)*wave;p[0]+=dx;p[1]+=dx;p[2]+=head*.35*wave}
  return p;
 }
 let p=(row===1||row===3?PROFILE_MOUTHS[role]:row===11?WORK_MOUTHS[role]:MOUTHS[role]).slice();
 if(row===3)p=[128-p[1],128-p[0],p[2],p[3]];
 // These are the same small head fields evaluated by the existing bake.
 const neck={parent:88,watcher:86,swabian:70,child:80}[role];
 if(row===4){const phase=frame*Math.PI/4,upper=Math.max(0,(120-p[2])/100);p[0]+=.65*Math.sin(phase)*upper;p[1]+=.65*Math.sin(phase)*upper;p[2]+=.4*(1-Math.cos(phase))*upper}
 if([6,7,8].includes(row)){
  const phase=frame/(row===7?15:8),wave=Math.sin((row===7?Math.PI:Math.PI*2)*phase),head=Math.max(0,Math.min(1,(neck-p[2])/20));
  const dx=head*wave*(row===8?.75:.25)+Math.max(0,Math.min(1,(140-p[2])/60))*.15*Math.sin(Math.PI*2*phase);
  p[0]+=dx;p[1]+=dx;p[2]+=head*wave*(row===7?1:.35);
 }
 return p;
}

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
  const energy=Math.max(0,Math.min(1,measured?dialogue.mouthOpen:estimate));
  const opening=Math.sqrt(Math.max(0,(energy-.02)/.98));
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
  const listenerWriting=actor.jwdRole==='parent'&&actor.jwdGesture==='notebook-write'&&dialogue?.active&&actor.jwdNotebookSpeaker===dialogue.id;
  const actionOwned=active||!!listenerWriting;
  const advancing=running&&!(actionOwned&&dialogue.paused);
  if(!advancing&&playback.pose&&active===playback.active&&talking===playback.pose.talking&&
     playback.gesture===actor.jwdGesture&&playback.actionOwned===actionOwned&&
     playback.propCueId===dialogue?.cueId&&playback.propCueToken===dialogue?.cueToken&&
     (!talking||playback.cueToken===dialogue.cueToken))return playback.pose;
  if(advancing){playback.distance=(playback.distance||0)+distance;playback.time=(playback.time||0)+dt;playback.age=(playback.age||0)+dt}
  if(distance>.001){
    playback.row=Math.abs(dx)>Math.abs(dy)?dx>0?1:3:dy>0?0:2;
  }
  // jwdMoving is simulation-owned accepted displacement, never desired speed.
  // Speech owns its lips, not the root or distance-driven walk phase.
  const moving=advancing&&(actor.jwdMoving>.001||distance>.001);
  const prop=schwabingenPropFrame(actor,playback.props||(playback.props={}),moving?null:dialogue,reducedMotion,running);
  playback.propCueId=dialogue?.cueId;playback.propCueToken=dialogue?.cueToken;
  const gesture=Object.hasOwn(GESTURES,actor.jwdGesture)?actor.jwdGesture:null;
  const gestureAge=Math.max(0,Number(actor.jwdGestureAge)||0),gestureDuration=Math.max(.1,Number(actor.jwdGestureDuration)||1.4);
  const writing=actor.jwdRole==='parent'&&actor.jwdGesture==='notebook-write'&&(active||listenerWriting);
  const notebook=actor.jwdRole==='parent'&&(active&&actor.jwdGesture==='notebook'||writing)&&!moving;
  if(notebook&&playback.gesture==='notebook-write')playback.carriedNotebook=true;
  else if(!notebook)playback.carriedNotebook=false;
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
  else if(prop?.held)enterState(playback,'present-prop');
  else if(notebook)enterState(playback,'notebook');
  else if(gesturing)enterState(playback,gesture);
  else if(talking)enterState(playback,'talk');
  else if(active){
    if(playback.state==='walk'||playback.state==='notebook'||Object.hasOwn(GESTURES,playback.state))enterState(playback,'listen');
    if(playback.state==='talk')enterState(playback,'listen');
    if(advancing&&playback.state==='settle'&&playback.age>=ENTRY.settle)enterState(playback,'look');
    else if(advancing&&playback.state==='look'&&playback.age>=ENTRY.look&&playback.terminalShown)enterState(playback,'greet');
    else if(advancing&&playback.state==='greet'&&playback.age>=ENTRY.greet&&playback.terminalShown)enterState(playback,'listen');
  }else if(actor.jwdWorking&&playback.state!=='release')enterState(playback,actor.jwdActivity==='trim'?'inspect':'work');
  else if(playback.state!=='release'||advancing&&playback.age>=ENTRY.release&&playback.terminalShown)enterState(playback,'idle');
  playback.active=active;
  playback.actionOwned=actionOwned;playback.gesture=actor.jwdGesture;
  const state=playback.state;
  let row=4,frame=reducedMotion?0:Math.floor((playback.time||0)*4)%8;
  if(state==='walk'){row=playback.row||0;frame=Math.floor((playback.distance||0)/(DISTANCE_PER_CYCLE[actor.jwdRole]||16.941176470588236)*FRAMES)%FRAMES}
  else if(prop?.held){row=9;frame=prop.frame}
  else if(notebook){
    if(writing){const age=dialogue.mediaDuration>0?dialogue.mediaTime:gestureAge;row=14;frame=reducedMotion?8:4+Math.floor(age*8)%12}
    else{
    const duration=dialogue.mediaDuration>0?dialogue.mediaDuration:gestureDuration;
    const age=Math.max(playback.carriedNotebook?.6:0,dialogue.lineComplete?duration:dialogue.awaitingSpeech?Math.min(.6,gestureAge):Math.max(Math.min(.6,gestureAge),dialogue.mediaDuration>0?dialogue.mediaTime:gestureAge));
    if(age<.6){row=12;frame=Math.min(15,Math.floor(age/.6*15))}
    else if(age>=duration-.5){row=15;frame=Math.min(15,Math.max(0,Math.floor((age-duration+.5)/.5*15)))}
    else if(age>=Math.max(.6,duration*.78)){row=14;frame=Math.min(15,Math.floor((age-Math.max(.6,duration*.78))/Math.max(.1,duration*.22-.5)*15))}
    else{row=13;frame=reducedMotion?0:Math.floor((age-.6)*8)%16}
    if(reducedMotion)frame=row===12?15:row===15?15:row===14?8:0;
    }
  }
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
    visible:true,prop};
  playback.pose=pose;return pose;
}

export function createNeighborSprite(T,actor,host,queueAsset,camera){
  const name=NEIGHBOR_PAINT[actor.jwdRole];if(!name)return null;
  const owner={retired:false,controller:new AbortController()},playback={},fallback=host.children.slice();
  const props=actor.jwdRole==='swabian'?createSchwabingenProps(T,actor,host,camera):null;
  let sprite=null,texture=null,standing=null,lastTime=null,lastPose=null,mouthUniforms=null,lastMirrored=false,settled=false,failed=false;
  for(const mesh of fallback)mesh.visible=true;
  const cameraRight=T.Vector3?new T.Vector3(1,0,0):null;
  queueAsset(()=>({x:host.position.x,z:host.position.z}),2,({signal}={})=>new Promise(resolve=>{
    loadThreeTexture(T,`./assets/characters/neighbors/${name}-standing.png`,signal,signal?owner.controller.signal:undefined).then(loaded=>{
      if(owner.retired||signal?.aborted||sprite){loaded.dispose();resolve(false);return}
      loaded.colorSpace=T.SRGBColorSpace;loaded.generateMipmaps=false;loaded.minFilter=loaded.magFilter=T.LinearFilter;loaded.premultiplyAlpha=true;
      const height=1.6*(actor.jwdRole==='child'?.68:1)*CELL_HEIGHT/170;
      standing=new T.Mesh(new T.PlaneGeometry(height*CELL_WIDTH/CELL_HEIGHT,height),new T.MeshBasicMaterial({map:loaded,transparent:true,alphaTest:.08,depthWrite:true,premultipliedAlpha:true,side:T.DoubleSide}));
      standing.name=`${name} standing paint`;standing.userData.neighborPaint=true;host.add(standing);resolve(true);
    },error=>{console.warn('Neighbor standing paint unavailable',error);resolve(false)});
  }),owner);
  queueAsset(()=>({x:host.position.x,z:host.position.z}),2,({signal}={})=>new Promise(resolve=>{
    const version='20261020-neighbor-face-repair';
    loadThreeTexture(T,`./assets/characters/neighbors/${name}${innerWidth<=600&&devicePixelRatio<2?'-mobile':''}.webp?v=${version}`,signal,signal?owner.controller.signal:undefined).then(loaded=>{
      if(owner.retired||signal?.aborted){settled=true;loaded.dispose();resolve(false);return}
      texture=loaded;texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;
      texture.minFilter=texture.magFilter=T.LinearFilter;texture.premultiplyAlpha=true;
      const height=1.6*(actor.jwdRole==='child'?.68:1)*CELL_HEIGHT/170;
      const geometry=new T.PlaneGeometry(height*CELL_WIDTH/CELL_HEIGHT,height);
      const material=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.08,
        depthWrite:true,premultipliedAlpha:true,side:T.DoubleSide});
      const profile=MOUTHS[actor.jwdRole];
      mouthUniforms={neighborMouth:{value:0},neighborCell:{value:new T.Vector2()},neighborLip:{value:new T.Vector4(...profile)},neighborRows:{value:actor.jwdRole==='parent'?20:ROWS}};
      material.onBeforeCompile=shader=>{
        Object.assign(shader.uniforms,mouthUniforms);
        shader.fragmentShader=`uniform float neighborMouth;\nuniform float neighborRows;\nuniform vec2 neighborCell;\nuniform vec4 neighborLip;\n${shader.fragmentShader}`;
        const map=T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D( map, neighborUv )');
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
          vec2 neighborUv=vMapUv;
          float neighborCavity=0.0;
          if(neighborMouth>0.0){
            vec2 p=vec2((vMapUv.x*16.0-neighborCell.x)*128.0,(1.0-(vMapUv.y*neighborRows-neighborCell.y))*192.0);
            float f=clamp((p.x-neighborLip.x)/(neighborLip.y-neighborLip.x),0.0,1.0);
            float joined=pow(sin(f*3.14159265),2.0);
            float guard=exp(-pow((p.y-neighborLip.z)/4.0,4.0));
            float aperture=neighborLip.w*neighborMouth*joined;
            float upper=neighborLip.z-aperture*.25,lower=neighborLip.z+aperture*.75;
            neighborCavity=smoothstep(upper,upper+.35,p.y)*(1.0-smoothstep(lower-.35,lower,p.y))*step(.18,aperture);
            float sy=p.y<upper?p.y+(neighborLip.z-upper)*guard:p.y>lower?p.y-(lower-neighborLip.z)*guard:neighborLip.z;
            if(p.x>=neighborLip.x&&p.x<=neighborLip.y&&abs(p.y-neighborLip.z)<8.0)neighborUv.y+=(p.y-sy)/(192.0*neighborRows);
          }
          ${map}
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.025,.008,.006),neighborCavity);`);
      };
      material.customProgramCacheKey=()=> 'neighbor-pose-lips-v3';
      sprite=new T.Mesh(geometry,material);sprite.name=`${name} painted neighbor`;
      sprite.userData.neighborPaint=true;sprite.visible=false;host.add(sprite);settled=true;resolve(true);
    },error=>{settled=true;failed=true;console.warn('Neighbor animation unavailable; keeping standing paint',error);resolve(false)});
  }),owner);
  return {
    sync(now,hud,dialogue,reducedMotion){
      const dt=lastTime==null?0:Math.min(.1,Math.max(0,now-lastTime));lastTime=now;
      const running=!!hud?.started&&!hud.paused&&!document.hidden&&(!hud.busy||dialogue?.id===actor.id);
      const pose=neighborFrame(actor,playback,dialogue,dt,running,reducedMotion);lastPose=pose;
      props?.sync(pose.prop,!!sprite);
      for(const mesh of fallback)mesh.visible=!sprite&&!standing&&pose.visible;
      if(standing){standing.visible=!sprite;standing.quaternion.copy(host.quaternion).invert().multiply(camera.quaternion);const pivot=standing.geometry.parameters.height*(PIVOT/CELL_HEIGHT-.5);standing.position.set(0,pivot,0).applyQuaternion(standing.quaternion)}
      if(!sprite)return;
      sprite.visible=pose.visible;
      if(!pose.visible)return;
      for(const mesh of fallback)mesh.visible=false;
      const rows=actor.jwdRole==='parent'?20:ROWS;
      const sourceFrame=pose.row===5?0:pose.frame;
      const slot=(pose.row>=12?NOTEBOOK_OFFSETS[pose.row-12]:CLIP_OFFSETS[pose.row])+sourceFrame,column=slot%COLUMNS,atlasRow=Math.floor(slot/COLUMNS);
      const uv=sprite.geometry.attributes.uv,u0=column/COLUMNS,v0=1-(atlasRow+1)/rows;
      cameraRight.set(1,0,0).applyQuaternion(camera.quaternion);
      lastMirrored=neighborWorkMirrored(actor,pose.row,cameraRight);
      const left=lastMirrored?u0+1/COLUMNS:u0,right=lastMirrored?u0:u0+1/COLUMNS;
      uv.setXY(0,left,v0+1/rows);uv.setXY(1,right,v0+1/rows);
      uv.setXY(2,left,v0);uv.setXY(3,right,v0);uv.needsUpdate=true;
      mouthUniforms.neighborCell.value.set(column,rows-atlasRow-1);
      const lip=neighborMouthProfile(actor,pose);
      if(lip)mouthUniforms.neighborLip.value.set(...lip);
      mouthUniforms.neighborMouth.value=lip?pose.mouthOpen:0;
      sprite.quaternion.copy(host.quaternion).invert().multiply(camera.quaternion);
      const pivot=sprite.geometry.parameters.height*(PIVOT/CELL_HEIGHT-.5);
      sprite.position.set(0,pivot,0).applyQuaternion(sprite.quaternion);
    },
    restore(){for(const mesh of fallback)mesh.visible=!sprite&&!standing},
    inspect(){return {loaded:!!sprite,settled,failed,standing:!!standing?.visible,fallback:fallback.some(mesh=>mesh.visible),visible:!!sprite?.visible||!!standing?.visible||fallback.some(mesh=>mesh.visible),row:lastPose?.row??0,frame:lastPose?.frame??0,
      state:lastPose?.state,cueToken:lastPose?.cueToken,mouthOpen:lastPose?.mouthOpen||0,distance:playback.distance||0,props:props?.inspect()||null,
      frames:lastPose?.row>=12?16:CLIP_COUNTS[lastPose?.row??4],mouthProfile:lastPose?neighborMouthProfile(actor,lastPose):null,height:actor.jwdRole==='child'?1.088:1.6,mirrored:lastMirrored}},
    dispose(){props?.dispose();owner.retired=true;owner.controller.abort();texture?.dispose();sprite?.material.dispose();sprite?.geometry.dispose();if(sprite)host.remove(sprite);standing?.material.map.dispose();standing?.material.dispose();standing?.geometry.dispose();if(standing)host.remove(standing);sprite=null;texture=null;standing=null}
  };
}
