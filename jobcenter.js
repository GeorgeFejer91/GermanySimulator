// One scene on the city's renderer and frame clock. No room edges, floor texture or horizon.
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));

// Original geometry, based on the official Wedding entrance photograph; no photo texture.
export function createJobcenterBuilding(T,w,d,h){
 const group=new T.Group(),batches=new Map(),materials=[];
 const palette={tile:0xc5cbcb,grout:0x8d999c,stone:0xa6aaa7,red:0xa92327,window:0x34484b,frame:0xd6d9d3,glassBlock:0x72898d,dark:0x20292b};
 const cube=(color,x,y,z,a,b,c)=>{if(!batches.has(color))batches.set(color,[]);batches.get(color).push([x,y,z,a,b,c])};
 cube('tile',0,h/2,0,w,h,d);
 cube('stone',0,h-.08,0,w,.16,d);
 const front=d/2,entry=2.5;
 // Tiled stairwell bay and three red-framed entrance leaves under a thin slab canopy.
 const glassHeight=h-3.2,glassY=3.1+glassHeight/2;
 cube('glassBlock',0,glassY,front+.015,entry,glassHeight,.025);
 for(let x=-entry/2;x<=entry/2+.01;x+=.16)cube('grout',x,glassY,front+.04,.012,glassHeight,.025);
 for(let y=3.1;y<h-.15;y+=.16)cube('grout',0,y,front+.04,entry,.012,.025);
 for(let x=-w/2;x<w/2;x+=.23)cube('grout',x,h/2,front+.011,.007,h,.012);
 for(let y=.23;y<h;y+=.23)cube('grout',0,y,front+.012,w,.007,.012);
 // Repeated office windows on both wings; the entrance bay remains uninterrupted.
 for(const side of [-1,1])for(let c=0;c<3;c++)for(let r=0;r<4;r++){
  const x=side*(1.97+c*.98),y=1.45+r*(h-2.1)/3;
  cube('frame',x,y,front+.035,.84,1.24,.07);
  cube('window',x,y,front+.078,.71,1.1,.025);
  cube('frame',x,y,front+.1,.025,1.1,.02);
  cube('frame',x,y-.22,front+.1,.71,.035,.02);
 }
 cube('dark',0,1.15,front+.02,entry,2.3,.04);
 for(let i=0;i<4;i++)cube('red',-entry/2+i*entry/3,1.15,front+.08,.065,2.3,.08);
 for(const y of [.07,1.77,2.3])cube('red',0,y,front+.08,entry,.075,.08);
 for(let i=0;i<3;i++){
  cube('window',-.83+i*.83,1.13,front+.07,.74,2.12,.025);
  cube('frame',-.67+i*.83,1.03,front+.15,.035,.48,.04);
 }
 cube('stone',0,2.62,front+.48,3.45,.13,1.0);
 for(const x of [-1.1,0,1.1])cube('dark',x,2.546,front+.43,.66,.012,.49);
 // Thin railings stay within the solid footprint; the street-side doorway stays clear.
 for(const side of [-1,1]){cube('frame',side*1.65,2.93,front+.08,.03,.52,.03);cube('frame',side*1.65,3.16,front+.22,.03,.03,.43)}
 const geometry=new T.BoxGeometry(1,1,1),transform=new T.Object3D();
 for(const [name,items] of batches){
  const material=new T.MeshStandardMaterial({color:palette[name],roughness:name==='window'?.3:.86});materials.push(material);
  const mesh=new T.InstancedMesh(geometry,material,items.length);mesh.name='Jobcenter '+name;
  items.forEach(([x,y,z,a,b,c],i)=>{transform.position.set(x,y,z);transform.scale.set(a,b,c);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix)});
  mesh.computeBoundingBox();mesh.computeBoundingSphere();group.add(mesh);
 }
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#c7cecd';ctx.fillRect(0,0,768,160);
 ctx.fillStyle='#252c2d';ctx.font='bold 91px Arial';ctx.textAlign='left';ctx.fillText('jobcenter',18,92);
 ctx.font='26px Arial';ctx.fillText('Berlin Mitte',23,132);
 ctx.fillStyle='#bc282e';ctx.beginPath();ctx.arc(693,72,41,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 55px Arial';ctx.fillText('A',673,91);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const label=new T.Mesh(new T.PlaneGeometry(3.5,.73),new T.MeshBasicMaterial({map:texture}));materials.push(label.material);label.position.set(0,3.26,front+.10);group.add(label);
 group.name='Jobcenter Berlin Mitte · Wedding';group.userData.jobcenter={doorWidth:entry,doorHeight:2.3,reference:'Müllerstraße 16'};
 return {group,label,materials};
}

export function stepJobcenter(state,input,dt){
 dt=clamp(dt,0,.12);state.time+=dt;
 state.yaw+=((input.ArrowLeft?1:0)-(input.ArrowRight?1:0))*dt*1.55;
 state.pitch=clamp(state.pitch+((input.PageUp?1:0)-(input.PageDown?1:0))*dt,-1.25,1.25);
 let forward=(input.KeyW||input.ArrowUp?1:0)-(input.KeyS||input.ArrowDown?1:0)+(input.forward||0);
 let side=(input.KeyD?1:0)-(input.KeyA?1:0)+(input.side||0);
 const length=Math.max(1,Math.hypot(forward,side)),speed=(input.KeyR||input.ShiftLeft||input.ShiftRight?7:3.6)*dt/length;
 state.x+=(Math.cos(state.yaw)*side-Math.sin(state.yaw)*forward)*speed;
 state.z+=(-Math.sin(state.yaw)*side-Math.cos(state.yaw)*forward)*speed;
 state.distance=Math.hypot(state.x,state.z);
 state.pressure=clamp((28-state.distance)/23);
 return state.distance<=13;
}

export function sampleJobcenterEnvelope(data,time){
 const values=data?.energy||[],attacks=data?.attack||[],index=Math.max(0,time*(data?.sampleHz||30));
 const i=Math.floor(index),mix=index-i;
 return {energy:((values[i]||0)*(1-mix)+(values[i+1]||0)*mix)/255,attack:(attacks[i]||0)/255};
}

const flameFragment=`
 varying vec2 vUv;uniform float uTime,uEnergy,uAttack,uAnger;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){return noise(p)*.54+noise(p*2.03)*.28+noise(p*4.07)*.13+noise(p*8.01)*.05;}
 void main(){
  vec2 p=vec2((vUv.x-.5)*2.,vUv.y);float t=uTime*(1.3+uAnger*.9);
  float n=fbm(vec2(p.x*5.,p.y*6.-t*2.));
  float tongues=sin(p.x*19.+n*7.+t)*.07+sin(p.x*31.-t*1.6)*.04;
  float bend=sin(p.y*8.-t*2.)*.07*p.y*(.3+uAnger);
  float width=.37*pow(max(.001,1.-p.y),.68)+.07*n+uEnergy*.035;
  float shape=width-abs(p.x+bend)+(n-.5)*(.22+.09*uAttack)+tongues*p.y;
  float fire=smoothstep(-.09,.12,shape)*smoothstep(0.,.09,p.y)*(1.-smoothstep(.72+n*.19,1.,p.y));
  float core=clamp(shape*3.8,0.,1.)*(1.-p.y)*1.6;
  vec3 color=mix(vec3(1.,.07,.002),vec3(1.,.56,.018),clamp(core+n*.25,0.,1.));
  color=mix(color,vec3(1.,.94,.57),pow(clamp(core,0.,1.),2.));
  float glow=exp(-length(vec2(p.x*3.,(p.y-.3)*1.6))*5.)*.14;
  // Charred eye slits and an opening furnace mouth deform with the actual speech energy.
  vec2 eye=vec2(abs(p.x)-.13,p.y-(.49+abs(p.x)*.28));
  float eyes=exp(-pow(eye.x/.073,4.)-pow(eye.y/.017,2.))*uAnger;
  float mouth=1.-smoothstep(.75,1.,length(vec2(p.x/(.10+.045*uEnergy),(p.y-.29)/(.025+.10*uEnergy))));
  color*=1.-mouth*.94*uAnger; color=mix(color,vec3(1.,.96,.66),eyes);
  gl_FragColor=vec4(color*(.8+uEnergy*.65+uAttack*.12),clamp(fire+glow,0.,1.));
 }
`;

export function createJobcenterEncounter(T,renderer,bridge){
 let visit=null,serial=0,last=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function close(reason='escape'){
  const v=visit;if(!v)return;visit=null;++serial;
  v.abort.abort();v.audio.onended=v.audio.onerror=v.audio.onplaying=null;v.audio.pause();v.audio.removeAttribute('src');v.audio.load();
  v.surface.remove();v.style.remove();document.body.classList.remove('jobcenter-inside');
  for(const event of v.events)event[0].removeEventListener(event[1],event[2]);
  v.scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});
  const box=document.getElementById('english-subtitle');if(box){box.hidden=true;box.textContent=''}
  bridge.clearInput?.();v.config.onClose?.(reason);
 }
 function open(config={}){
  if(visit)return false;
  const id=++serial,scene=new T.Scene();scene.background=new T.Color(0);
  const camera=new T.PerspectiveCamera(68,innerWidth/innerHeight,.03,100000);
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uTime:{value:0},uEnergy:{value:0},uAttack:{value:0},uAnger:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:flameFragment});
  const flame=new T.Mesh(new T.PlaneGeometry(1,1),material);scene.add(flame);
  const audio=new Audio(config.recording||'./assets/audio/jobcenter/overlord.mp3');audio.preload='auto';audio.playsInline=true;audio.volume=0;
  const surface=document.createElement('div');surface.id='jobcenter-input';surface.tabIndex=0;surface.setAttribute('role','application');surface.setAttribute('aria-label','Jobcenter. WASD: gehen. Pfeile oder Ziehen: Blick. Auf Touch links ziehen: gehen; rechts ziehen: Blick. Escape: verlassen.');
  const style=document.createElement('style');style.textContent=`
   .jobcenter-inside #app> :not(#world3d):not(#jobcenter-input):not(#english-subtitle){display:none!important}
   .jobcenter-inside #world3d{filter:none!important;background:#000!important}
   #jobcenter-input{position:fixed;inset:0;z-index:140;touch-action:none;cursor:crosshair;outline:none}
   #jobcenter-input:focus-visible{outline:1px solid #5a3020;outline-offset:-2px}
   .jobcenter-inside #english-subtitle{z-index:242;pointer-events:none}
   .jobcenter-inside #english-subtitle[data-fit="scroll"]{pointer-events:auto}
  `;
  document.head.append(style);document.getElementById('app').append(surface);document.body.classList.add('jobcenter-inside');
  const v=visit={id,scene,camera,material,flame,audio,surface,style,config,abort:new AbortController(),events:[],x:0,z:34,yaw:0,pitch:-.015,time:0,distance:34,pressure:0,phase:'approach',mediaStarted:false,mediaPending:false,playSerial:0,failed:false,playback:0,lastMedia:0,stalled:0,energy:0,attack:0,data:null,captionKey:'',captionCues:[],touch:{forward:0,side:0},pointers:new Map()};last=performance.now();
  const on=(target,name,fn)=>{target.addEventListener(name,fn);v.events.push([target,name,fn])};
  const current=()=>visit===v&&serial===id;
  function fail(){if(!current())return;++v.playSerial;v.failed=true;v.mediaPending=false;audio.pause();v.playback=Math.max(v.playback,audio.currentTime||0)}
  audio.onerror=fail;
  audio.onended=()=>{if(current()&&v.phase==='speaking'&&v.mediaStarted)close('ended')};
  // Unlock this single media element in the entrance's trusted E/touch gesture.
  // Silent priming stops at time zero; speech is still gated by approach.
  audio.play().then(()=>{if(!current())return;if(v.phase==='approach'){audio.pause();audio.currentTime=0}else if(!v.failed&&!v.paused()){v.mediaStarted=true;audio.volume=.9}else audio.pause()}).catch(()=>{});
  fetch('./assets/audio/jobcenter/overlord.json',{signal:v.abort.signal}).then(r=>{if(!r.ok)throw Error('jobcenter envelope');return r.json()}).then(data=>{if(current())v.data=data}).catch(error=>{if(current()&&error.name!=='AbortError')v.data={text:config.text||'',duration:config.duration||60}});
  on(surface,'pointerdown',e=>{if(!current())return;surface.setPointerCapture(e.pointerId);const move=e.pointerType==='touch'&&e.clientX<innerWidth*.45;v.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,move});if(v.mediaPending||v.failed&&v.phase==='speaking')resume();});
  on(surface,'pointermove',e=>{const p=v.pointers.get(e.pointerId);if(!p||!current()||paused())return;if(p.move){v.touch.side=clamp((e.clientX-p.startX)/55,-1,1);v.touch.forward=clamp((p.startY-e.clientY)/55,-1,1)}else{v.yaw-=(e.clientX-p.x)*.004;v.pitch=clamp(v.pitch-(e.clientY-p.y)*.003,-1.25,1.25)}p.x=e.clientX;p.y=e.clientY});
  const release=e=>{const p=v.pointers.get(e.pointerId);if(p?.move)v.touch={forward:0,side:0};v.pointers.delete(e.pointerId)};
  on(surface,'pointerup',release);on(surface,'pointercancel',release);on(surface,'lostpointercapture',release);
  on(window,'keydown',e=>{if(!current())return;if(e.code==='Escape'){e.preventDefault();close();return}if(v.phase==='speaking'&&(v.mediaPending||v.failed)&&!e.repeat)resume()});
  function resetInput(){v.touch={forward:0,side:0};v.pointers.clear();bridge.clearInput?.()}
  on(window,'blur',()=>{resetInput();audio.pause();v.suspended=true});
  on(window,'focus',()=>{v.suspended=false;last=performance.now();if(v.phase==='speaking'&&!paused())resume()});
  on(document,'visibilitychange',()=>{resetInput();last=performance.now();if(document.hidden)audio.pause();else if(v.phase==='speaking'&&!paused())resume()});
  function paused(){return document.hidden||v.suspended||!!window.GermanyHUD?.paused}
  function resume(){
   if(!current()||paused()||v.mediaPending)return;
   if(config.voiceOn?.()===false){v.failed=true;return}
   const playId=++v.playSerial;v.mediaPending=true;audio.volume=.9;
   audio.play().then(()=>{if(!current()||playId!==v.playSerial){audio.pause();return}if(paused()){audio.pause();v.mediaPending=false;return}v.mediaStarted=true;v.mediaPending=false;v.failed=false;v.stalled=0}).catch(()=>{if(current()&&playId===v.playSerial)fail()});
  }
  v.resume=resume;v.paused=paused;surface.focus({preventScroll:true});return true;
 }
 function render(){
  const v=visit;if(!v)return false;
  const now=performance.now(),dt=clamp((now-last)/1000,0,.12);last=now;
  if(v.paused()){v.audio.pause();v.wasPaused=true;return true}
  if(v.wasPaused){v.wasPaused=false;if(v.phase==='speaking'&&!v.failed)v.resume()}
  const near=stepJobcenter(v,{...bridge.getInput?.(),...v.touch},dt);
  if(near&&v.phase==='approach'){v.phase='speaking';v.resume()}
  if(v.phase==='speaking'){
   const duration=v.data?.duration||v.config.duration||60;
   if(v.config.voiceOn?.()===false){v.audio.pause();v.failed=true}
   if(v.failed){v.playback+=dt;if(v.playback>=duration){close('fallback-ended');return false}}
   else{
    v.playback=v.audio.currentTime||0;
    v.stalled=v.playback>v.lastMedia+.001?0:v.stalled+dt;v.lastMedia=v.playback;
    // A missing/rejected/stalled recording keeps a bounded readable, silent path.
    if(v.stalled>8){++v.playSerial;v.failed=true;v.audio.pause();v.mediaPending=false}
   }
   const signal=(!v.failed&&!v.audio.paused)?sampleJobcenterEnvelope(v.data,v.playback):{energy:0,attack:0};
   v.energy+=(signal.energy-v.energy)*(1-Math.exp(-dt*(signal.energy>v.energy?25:11)));v.attack=signal.attack;
   caption(v,duration);
  }
  const anger=Math.max(v.pressure,v.phase==='speaking'?.85:0),growth=1+v.pressure*5+(v.phase==='speaking'?2:0),pulse=reduced.matches?0:v.energy*.42+v.attack*.13;
  v.camera.aspect=innerWidth/innerHeight;v.camera.updateProjectionMatrix();v.camera.position.set(0,1.65,0);v.camera.rotation.order='YXZ';v.camera.rotation.set(v.pitch,v.yaw,0);
  // Camera-relative origin keeps a limitless plane numerically stable in ordinary play.
  v.flame.position.set(-v.x,growth*.50,-v.z);v.flame.scale.set(growth*.9+pulse,growth+pulse*1.8,1);v.flame.quaternion.copy(v.camera.quaternion);
  const u=v.material.uniforms;u.uTime.value=reduced.matches?0:v.time;u.uEnergy.value=v.energy;u.uAttack.value=reduced.matches?0:v.attack;u.uAnger.value=anger;
  renderer.render(v.scene,v.camera);return true;
 }
 function caption(v,duration){
  const box=document.getElementById('english-subtitle');if(!box)return;
  const english=v.config.subtitlesOn?.(),text=english?(v.config.english||v.data?.text||v.config.text):(v.data?.text||v.config.text),layout=window.GermanySubtitleLayout;
  if(!text)return;
  const key=[text,innerWidth,innerHeight,box.clientWidth,getComputedStyle(box).fontSize].join('|');
  if(key!==v.captionKey){v.captionKey=key;box.lang=english?'en':'de';box.hidden=false;box.textContent=text;v.captionCues=layout?.timedCaptions([[0,duration,text]],'JOBCENTER')||[[0,duration,text]]}
  const next=layout?.captionAt(v.captionCues,v.playback)||v.captionCues.find(c=>c[0]<=v.playback&&v.playback<c[1])?.[2]||'';
  if(box.textContent!==next)box.textContent=next;box.hidden=!next;
 }
 return {open,close,render,get active(){return !!visit},inspect(){return visit?{active:true,phase:visit.phase,x:visit.x,z:visit.z,yaw:visit.yaw,pitch:visit.pitch,distance:visit.distance,pressure:visit.pressure,energy:visit.energy,attack:visit.attack,playback:visit.playback,mediaStarted:visit.mediaStarted,mediaPaused:visit.audio.paused,failed:visit.failed,captionCues:visit.captionCues.length,resources:{geometries:1,textures:0,media:1},duration:visit.data?.duration||0}:{active:false}}};
}
