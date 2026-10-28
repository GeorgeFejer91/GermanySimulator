import {CAST,CARS,LINES,LIMIT_CM,REQUIRED_REPORTS,SAVE_KEY,SPAWN} from './content.mjs';
import {freshState,restoreState,transition,reportStatus,carMeasurePoint,moveBody} from './state.mjs';
const pretext=await import('../../assets/vendor/pretext/dist/layout.js').catch(()=>null);
const {prepareWithSegments,measureLineStats,measureNaturalWidth,setLocale}=pretext??{};

const $=id=>document.getElementById(id);
const dialogs=[...document.querySelectorAll('dialog')];
let state;try{state=restoreState(JSON.parse(localStorage.getItem(SAVE_KEY)))}catch{state=freshState()}
let world,started=false,paused=false,activeTarget=null,measurement=null,selectedCar=null,dialogueQueue=[],dialogueEnd=null,speaker=null,voice=null,audioContext=null,ambient=null,voiceEpoch=0,ledgerPage=0,toastUntil=0,time=0,lastFrame=0,footDistance=0;
let disposed=false,frameId=0,externalPaused=false,inspectionLook=null,animationTime=0;
const query=new URLSearchParams(location.search),embedded=query.get('embedded')==='1'&&parent!==window,channel=query.get('channel');
function emit(type,payload={}){if(embedded&&channel)parent.postMessage({namespace:'gta-klein-korinthen',channel,type,...payload},location.origin)}
const player={...SPAWN,pitch:-.03},keys=new Set(),stick={x:0,y:0},reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch=matchMedia('(pointer: coarse)').matches;
const stats={frames:0,maxFrameMs:0,measures:0,reports:0,fitChecks:0,voiceStarts:0,voiceEnds:0,inputCount:0};
const voices=await fetch(new URL('../../assets/klein-korinthen/voices.json',import.meta.url)).then(r=>r.ok?r.json():{clips:[]}).catch(()=>({clips:[]}));
function text(id,value){if($(id).textContent!==String(value))$(id).textContent=value;}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state))}catch{toast('Speichern gesperrt. Dieses Aufnahmeverfahren bleibt bis zum Schließen erhalten.')}}
function dispatch(action){const next=transition(state,action);if(next!==state){state=next;save();updateHUD();emit('state',{state});if(action.type==='graduate')emit('complete',{state})}return next;}
function updateHUD(){
  text('counter',`${state.reports.length} / ${REQUIRED_REPORTS}`);$('progress-fill').style.width=`${Math.min(100,state.reports.length/REQUIRED_REPORTS*100)}%`;
  text('membership',({arrival:'Zugezogen · noch nicht zuständig',patrol:'Anwärter · bewaffnet mit Zollstock',return:'Aufnahmeprüfung bestanden',member:'Ordentliches Mitglied · endlich zuständig'})[state.stage]);
  text('objective-text',({arrival:'Dietmar wartet vor dem Vereinsheim. Sprechen Sie ihn an.',patrol:'Fünf Autos messen und melden. Nur mehr als 30 cm zählen.',return:'Fünf Fälle belegt. Zurück zu Gisela am Vereinsheim.',member:'Mitgliedschaft erteilt. Die Nachbarschaft bleibt unter Beobachtung.'})[state.stage]);
}
function toast(message){text('toast',message);$('toast').hidden=false;toastUntil=time+5;}
function cancelMeasure(restore=true){if(restore&&measurement?.originalLook)Object.assign(player,measurement.originalLook);measurement=null;$('measure-ui').hidden=true;world?.measure(null);}
function clearInput(){keys.clear();stick.x=stick.y=0;$('stick-knob').style.transform='';lookButton=0;drag=null;}
let previousFocus=null;
function openDialog(id){
  clearInput();cancelMeasure();previousFocus=document.activeElement;
  for(const d of dialogs)if(d.open)d.close();
  $(id).showModal();paused=true;$('hint').hidden=true;
  requestAnimationFrame(()=>$(id).querySelector('button,input')?.focus());queueFit();
}
function closeDialog(id){$(id).close();if(id==='evidence'&&inspectionLook){Object.assign(player,inspectionLook);inspectionLook=null}paused=externalPaused||dialogs.some(d=>d.open);clearInput();if(!paused){$('world').focus({preventScroll:true});previousFocus=null}}
for(const d of dialogs)d.addEventListener('cancel',event=>{
  event.preventDefault();if(d.id==='conversation'){finishDialogue();return}if(d.id==='certificate'){closeDialog(d.id);return}closeDialog(d.id);
});
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>closeDialog(button.dataset.close);
function audio(){
  if(!$('audio-enabled').checked)return null;
  if(!audioContext){audioContext=new AudioContext();}
  audioContext.resume().catch(()=>{});return audioContext;
}
function cue(kind){
  const ctx=audio();if(!ctx)return;const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
  o.type=kind==='stamp'?'triangle':'sine';o.frequency.setValueAtTime(kind==='stamp'?130:kind==='step'?72:440,t);o.frequency.exponentialRampToValueAtTime(40,t+.14);
  g.gain.setValueAtTime(kind==='step'?.018:.07,t);g.gain.exponentialRampToValueAtTime(.0001,t+.16);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.17);
}
function startAmbient(){
  const ctx=audio();if(!ctx||ambient)return;
  const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),d=buffer.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){last=(last+(Math.random()*2-1)*.025)/1.025;d[i]=last;}
  const src=ctx.createBufferSource(),gain=ctx.createGain();src.buffer=buffer;src.loop=true;gain.gain.value=.055;src.connect(gain);gain.connect(ctx.destination);src.start();ambient={src,gain};
}
function stopVoice(){voiceEpoch++;if(voice){voice.pause();voice.removeAttribute('src');voice.load();voice=null}speaker=null;}
function speak(key){
  stopVoice();const line=LINES[key];speaker=line.speaker;text('speaker-name',CAST[speaker].name);text('speaker-role',CAST[speaker].role);text('spoken',line.de);text('translation',line.en);$('translation').hidden=!$('english-enabled').checked;
  $('portrait').style.backgroundPosition=`${CAST[speaker].column*100/3}% 6%`;
  const clip=voices.clips.find(c=>c.id===key&&c.text===line.de&&c.voiceId===CAST[speaker].voiceId);
  text('voice-status',$('audio-enabled').checked?'Untertitel · Ton wird geladen':'Ton aus · Untertitel aktiv');
  if(!clip||!$('audio-enabled').checked){text('voice-status',$('audio-enabled').checked?'Untertitel · Aufnahme nicht verfügbar':'Ton aus · Untertitel aktiv');return}
  const currentEpoch=voiceEpoch;
  voice=new Audio(new URL('../../assets/klein-korinthen/'+clip.file,import.meta.url).href);voice.preload='auto';voice.volume=.85;voice.clip=clip;
  voice.onplaying=()=>{if(currentEpoch===voiceEpoch){stats.voiceStarts++;text('voice-status','Stimme · '+CAST[line.speaker].name)}};
  voice.onended=()=>{if(currentEpoch===voiceEpoch){stats.voiceEnds++;text('voice-status','Aussage zu Protokoll genommen.')}};
  voice.onerror=()=>{if(currentEpoch===voiceEpoch)text('voice-status','Untertitel · Ton nicht verfügbar')};
  voice.play().catch(()=>{if(currentEpoch===voiceEpoch)text('voice-status','Untertitel · Ton vom Browser gesperrt')});
}
function dialogue(lines,onEnd=null){dialogueQueue=[...lines];dialogueEnd=onEnd;openDialog('conversation');advanceDialogue();}
function advanceDialogue(){
  if(!dialogueQueue.length){finishDialogue();return}const key=dialogueQueue.shift();speak(key);text('dialogue-next',dialogueQueue.length?'Weiter':'Verstanden');queueFit();
}
function finishDialogue(){stopVoice();dialogueQueue=[];closeDialog('conversation');const end=dialogueEnd;dialogueEnd=null;end?.();}
$('dialogue-next').onclick=advanceDialogue;
function talk(id){
  if(id==='dietmar'){
    if(state.stage==='arrival')dialogue(['welcome','invitation','rule','first'],()=>{dispatch({type:'join'});toast('Zollstock erhalten. Zum orangefarbenen Wagen: Straße rechts vom Vereinsheim.')});
    else dialogue([state.bonus?'chair':state.stage==='member'?'epilogue':'progress']);
  }else if(id==='gisela'){
    if(state.stage==='return')dialogue(['certificate'],()=>{dispatch({type:'graduate'});cue('stamp');showCertificate()});
    else dialogue([state.stage==='member'?'certificate':'giselaIntro',...(state.stage==='member'?[]:['giselaWait'])]);
  }else if(id==='ronny')dialogue([state.reports.includes('kk-09')?'ronnyAfter':'ronny']);
  else dialogue(['ute','uteHint']);
}
function beginMeasurement(car){
  if(state.stage==='arrival'){toast('Erst beim Vorsitzenden den Zollstock abholen. Ordnung braucht Zuständigkeit.');return}
  if(state.reports.includes(car.id)){toast('Bereits gemeldet. Doppelte Empörung zählt nicht doppelt.');return}
  const targetX=car.road+car.side*(4-car.gap/200),dx=targetX-player.x,dz=car.z-player.z;
  measurement={car,elapsed:0,origin:{x:player.x,z:player.z},originalLook:{yaw:player.yaw,pitch:player.pitch},look:{yaw:Math.atan2(-dx,-dz),pitch:Math.atan2(.2-1.68,Math.hypot(dx,dz))}};
  clearInput();$('measure-ui').hidden=false;$('hint').hidden=true;text('measure-number','… cm');
  text('measure-status','Stillhalten. Es geht um Zentimeter.');cue('start');
}
function showEvidence(car){
  selectedCar=car;openDialog('evidence');text('plate',car.plate);text('owner',car.owner);text('distance',car.gap+' cm');text('excuse',car.excuse);
  text('judgement',car.gap>LIMIT_CM?`${car.gap-LIMIT_CM} cm über der Vereinsgrenze. Ein Fall für Ihre Akte.`:'Vereinskonform. Die Enttäuschung ist nicht meldefähig.');
  text('file-report',car.gap>LIMIT_CM?'Meldung einreichen':'Trotzdem beschweren');
}
$('file-report').onclick=()=>{
  if(!selectedCar)return;const car=selectedCar,status=reportStatus(state,car.id),before=state.reports.length;
  dispatch({type:'report',id:car.id});closeDialog('evidence');selectedCar=null;
  if(status==='valid'){
    stats.reports++;cue('stamp');toast(`Akte ${String(state.reports.length).padStart(2,'0')}: ${car.plate}. Die Nachbarschaft dankt Ihnen nicht.`);
    if(before<5&&state.reports.length>=5)dialogue(['five']);else if(car.chairman)dialogue(['chair']);else if(state.reports.length===3)dialogue(['half']);
  }else if(status==='legal'){cue('wrong');toast('Zurückgewiesen: Vereinskonform. Persönliche Abneigung bitte separat begründen.');}
  else toast('Kein neuer belegter Fall. Erst messen, dann melden.');
};
$('leave-car').onclick=()=>{closeDialog('evidence');selectedCar=null};
function showCertificate(){
  text('certificate-result',`${state.reports.length} belegte Meldungen · ${state.mistakes} zurückgewiesene Beschwerden · Germanness +30`);
  text('certificate-bonus',state.bonus?'Sondervermerk: Auch den Vorsitzenden gemeldet. Ihre Unabhängigkeit wurde missbilligend anerkannt.':'Ihr Mitgliedsbeitrag: ein Sonntag und der letzte Rest Unbefangenheit.');openDialog('certificate');
}
$('continue').onclick=()=>{closeDialog('certificate');dialogue(['epilogue'])};
function restart(){stopVoice();for(const d of dialogs)if(d.open)d.close();state=freshState();Object.assign(player,SPAWN,{pitch:-.03});paused=false;selectedCar=null;dialogueEnd=null;cancelMeasure();clearInput();save();updateHUD();toast('Neuer Zuzug. Die Nachbarn haben Sie schon bemerkt.');$('world').focus()}
$('restart').onclick=restart;$('certificate-restart').onclick=restart;
function ledger(){
  const page=CARS.slice(ledgerPage*4,ledgerPage*4+4);$('ledger-list').replaceChildren();
  for(const car of page){const row=document.createElement('div');row.className='ledger-row';
    const label=document.createElement('b'),value=document.createElement('span'),owner=document.createElement('small');[label,value,owner].forEach(e=>e.dataset.fit='');label.textContent=car.plate;
    value.textContent=state.reports.includes(car.id)?'GEMELDET':state.measured.includes(car.id)?car.gap+' cm':'Ungemessen';owner.textContent=car.owner;row.append(label,value,owner);$('ledger-list').append(row);}
  text('ledger-page',`${ledgerPage+1} / ${Math.ceil(CARS.length/4)}`);$('ledger-prev').disabled=ledgerPage===0;$('ledger-next').disabled=ledgerPage===Math.ceil(CARS.length/4)-1;queueFit();
}
$('ledger-button').onclick=()=>{ledger();openDialog('ledger-dialog')};$('ledger-prev').onclick=()=>{ledgerPage--;ledger()};$('ledger-next').onclick=()=>{ledgerPage++;ledger()};
function drawMap(){
  const c=$('map'),ctx=c.getContext('2d'),sx=x=>c.width/2+x*5.3,sz=z=>c.height/2+z*5.2;
  ctx.fillStyle='#d3d3b9';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#b2ad98';
  for(const x of [-42,0,42]){ctx.fillRect(sx(x-6),sz(-51),12*5.3,102*5.2)}for(const z of [-47,47])ctx.fillRect(sx(-48),sz(z-6),96*5.3,12*5.2);
  ctx.fillStyle='#777c70';for(const x of [-42,0,42])ctx.fillRect(sx(x-4),sz(-47),8*5.3,94*5.2);for(const z of [-47,47])ctx.fillRect(sx(-46),sz(z-4),92*5.3,8*5.2);
  for(const s of world.solids.filter(s=>s.kind==='house'||s.kind==='clubhouse'||s.kind==='garage')){ctx.fillStyle=s.kind==='clubhouse'?'#916c3e':'#92937b';ctx.fillRect(sx(s.minX),sz(s.minZ),(s.maxX-s.minX)*5.3,(s.maxZ-s.minZ)*5.2)}
  CARS.forEach((car,i)=>{ctx.fillStyle=state.reports.includes(car.id)?'#45694c':'#f0d187';ctx.fillRect(sx(car.x)-13,sz(car.z)-14,26,28);ctx.fillStyle='#20372a';ctx.font='bold 17px "Roboto Condensed"';ctx.textAlign='center';ctx.fillText(String(i+1),sx(car.x),sz(car.z)+6)});
  ctx.fillStyle='#253b31';ctx.font='bold 24px "Roboto Condensed"';ctx.fillText('V',sx(-22),sz(45));ctx.fillText('G',sx(CAST.gisela.x),sz(CAST.gisela.z));ctx.fillText('N ↑',c.width-42,35);
  ctx.save();ctx.translate(sx(player.x),sz(player.z));ctx.rotate(-player.yaw);ctx.fillStyle='#b13e2d';ctx.strokeStyle='#fff6db';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(9,10);ctx.lineTo(0,5);ctx.lineTo(-9,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
$('map-button').onclick=()=>{drawMap();openDialog('map-dialog')};
$('menu-button').onclick=()=>{stopVoice();openDialog('settings')};$('resume').onclick=()=>closeDialog('settings');
$('audio-enabled').onchange=()=>{if(!$('audio-enabled').checked){stopVoice();audioContext?.suspend()}else{audio();if(started)startAmbient()}};
$('english-enabled').onchange=()=>{$('translation').hidden=!$('english-enabled').checked;queueFit()};

function nearestTarget(){
  let target=null,distance=3.0;
  for(const[id,actor]of Object.entries(CAST)){const d=Math.hypot(player.x-actor.x,player.z-actor.z);if(d<distance){distance=d;target={kind:'person',id,label:actor.name}}}
  for(const car of CARS){const p=carMeasurePoint(car),d=Math.hypot(player.x-p.x,player.z-p.z);if(d<distance){distance=d;target={kind:'car',id:car.id,car,label:car.plate}}}
  return target;
}
function interact(){stats.inputCount++;if(!started||paused||measurement||!activeTarget)return;audio();activeTarget.kind==='person'?talk(activeTarget.id):beginMeasurement(activeTarget.car)}
$('interact').onclick=interact;
// Some mobile gesture sequences deliver pointerup but omit the compatibility
// click. Preserve native button activation, with a fallback only if it is absent.
const touchButtons=new WeakMap();
document.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch')return;const button=e.target.closest?.('button');if(!button)return;
  const old=touchButtons.get(button);clearTimeout(old?.timer);touchButtons.set(button,{id:e.pointerId,x:e.clientX,y:e.clientY,fired:false});
},true);
document.addEventListener('pointerup',e=>{
  if(e.pointerType!=='touch')return;const button=e.target.closest?.('button'),tap=button&&touchButtons.get(button);
  if(!tap||tap.id!==e.pointerId||button.disabled||Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>10)return;
  tap.timer=setTimeout(()=>{if(disposed||!button.isConnected||!button.getClientRects().length||button.disabled)return;tap.fired=true;button.click()},350);
},true);
document.addEventListener('pointercancel',e=>{const button=e.target.closest?.('button');if(button){clearTimeout(touchButtons.get(button)?.timer);touchButtons.delete(button)}},true);
document.addEventListener('click',e=>{
  const button=e.target.closest?.('button'),tap=button&&touchButtons.get(button);if(!tap)return;
  clearTimeout(tap.timer);if(e.isTrusted&&e.pointerType==='touch'&&tap.fired){e.preventDefault();e.stopImmediatePropagation()}
},true);
let drag=null,lookButton=0;
const worldCanvas=$('world');
worldCanvas.addEventListener('pointerdown',e=>{if(!started||paused)return;worldCanvas.focus({preventScroll:true});worldCanvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY};});
worldCanvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||paused)return;player.yaw-=(e.clientX-drag.x)*.005;player.pitch=Math.max(-1.25,Math.min(.8,player.pitch-(e.clientY-drag.y)*.004));drag.x=e.clientX;drag.y=e.clientY;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])worldCanvas.addEventListener(event,()=>{drag=null});
let stickId=null,stickCenter=null;
$('stick').addEventListener('pointerdown',e=>{if(paused)return;const r=$('stick').getBoundingClientRect();stickCenter={x:r.left+r.width/2,y:r.top+r.height/2};stickId=e.pointerId;$('stick').setPointerCapture(e.pointerId)});
$('stick').addEventListener('pointermove',e=>{if(stickId!==e.pointerId||paused)return;const dx=e.clientX-stickCenter.x,dy=e.clientY-stickCenter.y,l=Math.max(34,Math.hypot(dx,dy));stick.x=dx/l;stick.y=dy/l;$('stick-knob').style.transform=`translate(${stick.x*30}px,${stick.y*30}px)`;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('stick').addEventListener(event,()=>{stickId=null;stick.x=stick.y=0;$('stick-knob').style.transform=''});
for(const [id,dir]of [['look-left',1],['look-right',-1]]){$(id).onpointerdown=e=>{lookButton=dir;$(id).setPointerCapture(e.pointerId)};for(const event of ['pointerup','pointercancel','lostpointercapture'])$(id).addEventListener(event,()=>lookButton=0)}
window.addEventListener('keydown',e=>{
  if(!started)return;
  if(paused){if(e.code==='KeyE'&&$('conversation').open&&!e.repeat){e.preventDefault();advanceDialogue()}return}
  const codes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyQ','KeyR','ShiftLeft','ShiftRight'];
  if(codes.includes(e.code)){e.preventDefault();keys.add(e.code);stats.inputCount++;return}
  if(e.repeat)return;if(e.code==='KeyE'){e.preventDefault();interact()}if(e.code==='KeyM')$('map-button').click();if(e.code==='KeyJ')$('ledger-button').click();if(e.code==='Escape')$('menu-button').click();
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{clearInput();cancelMeasure();voice?.pause();audioContext?.suspend()});
document.addEventListener('visibilitychange',()=>{clearInput();cancelMeasure();if(document.hidden){voice?.pause();audioContext?.suspend();}else if(started&&!externalPaused){if($('audio-enabled').checked)audioContext?.resume();if(voice&&$('conversation').open)voice.play().catch(()=>{});lastFrame=performance.now()}});
window.addEventListener('focus',()=>{if(started&&!document.hidden&&!externalPaused&&$('audio-enabled').checked){audioContext?.resume();if(voice&&$('conversation').open)voice.play().catch(()=>{})}});
window.addEventListener('resize',()=>{world?.resize();queueFit()});
function frame(now){
  if(disposed)return;frameId=requestAnimationFrame(frame);if(document.hidden||!world)return;
  const raw=lastFrame?now-lastFrame:16,dt=Math.min(.045,raw/1000);lastFrame=now;time+=dt;stats.frames++;if(started)stats.maxFrameMs=Math.max(stats.maxFrameMs,raw);
  if(started&&!paused){
    if(measurement){
      measurement.elapsed+=dt;const progress=Math.min(1,measurement.elapsed/1.8);world.measure(measurement.car,progress);$('measure-fill').style.width=progress*100+'%';
      const yawDelta=Math.atan2(Math.sin(measurement.look.yaw-player.yaw),Math.cos(measurement.look.yaw-player.yaw)),ease=reduced?1:Math.min(1,dt*10);
      player.yaw+=yawDelta*ease;player.pitch+=(measurement.look.pitch-player.pitch)*ease;
      text('measure-number',progress<1?`${Math.floor(measurement.car.gap*progress)} cm`:`${measurement.car.gap} cm`);
      if(progress===1){const car=measurement.car;inspectionLook=measurement.originalLook;dispatch({type:'measure',id:car.id});stats.measures++;cancelMeasure(false);showEvidence(car)}
    }else{
      const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-stick.y;
      const side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.x;
      player.yaw+=((keys.has('KeyQ')?1:0)-(keys.has('KeyR')?1:0)+lookButton)*dt*1.8;
      const norm=Math.max(1,Math.hypot(f,side)),speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?5:3.2)*dt;
      const dx=(-Math.sin(player.yaw)*f+Math.cos(player.yaw)*side)/norm*speed,dz=(-Math.cos(player.yaw)*f-Math.sin(player.yaw)*side)/norm*speed;
      const next=moveBody(player,dx,dz,world.solids,world.bounds);player.x=next.x;player.z=next.z;footDistance+=next.distance;if(footDistance>.8){footDistance%=.8;cue('step')}
      activeTarget=nearestTarget();$('hint').hidden=!activeTarget;
      if(activeTarget){text('nearby',activeTarget.label);text('interact',activeTarget.kind==='person'?'E · Ansprechen':state.reports.includes(activeTarget.id)?'E · Bereits gemeldet':'E · Abstand messen')}
    }
  }
  if(toastUntil&&time>toastUntil){$('toast').hidden=true;toastUntil=0}
  let mouth=0;if(voice&&!voice.paused&&!voice.ended){const energy=voice.clip?.energy;mouth=energy?energy[Math.min(energy.length-1,Math.floor(voice.currentTime*40))]??0:0;}
  if(!paused)animationTime+=dt;world.update(player,animationTime,speaker,mouth,reduced);
}

// Bounded text uses the existing pinned Pretext 0.0.9 with the exact loaded DOM font.
const fitCache=new Map();let fitting=false;
function queueFit(){if(fitting)return;fitting=true;requestAnimationFrame(()=>{fitting=false;fitText()})}
function fitText(){
  let checked=0,noFit=0;try{setLocale('de');
    document.documentElement.toggleAttribute('data-large-text',parseFloat(getComputedStyle(document.documentElement).fontSize)>24);
    const measurements=[];for(const e of document.querySelectorAll('[data-fit]')){
      if(!e.getClientRects().length)continue;const s=getComputedStyle(e),rect=e.getBoundingClientRect(),w=rect.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)-parseFloat(s.borderLeftWidth)-parseFloat(s.borderRightWidth),h=rect.height-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom)-parseFloat(s.borderTopWidth)-parseFloat(s.borderBottomWidth);
      if(w<=0||h<=0)continue;const content=e.innerText,font=`${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`,spacing=parseFloat(s.letterSpacing)||0,key=[content,font,spacing].join('|');
      let prepared=fitCache.get(key);if(!prepared){prepared=prepareWithSegments(content,font,{letterSpacing:spacing,whiteSpace:'pre-wrap'});if(fitCache.size>220)fitCache.clear();fitCache.set(key,prepared)}
      const m=measureLineStats(prepared,w+.5),line=parseFloat(s.lineHeight)||parseFloat(s.fontSize)*1.4,natural=measureNaturalWidth(prepared);
      const fits=m.maxLineWidth<=w+2&&m.lineCount*line<=h+3&&e.scrollWidth<=e.clientWidth+2;
      measurements.push([e,fits,natural,m.lineCount]);checked++;if(!fits)noFit++;
    }
    for(const [e,fits,natural,lines]of measurements){e.dataset.fitState=fits?'fit':'no-fit';e.dataset.measuredLines=String(lines);e.dataset.naturalWidth=String(Math.round(natural))}
    document.documentElement.dataset.textMeasurement=noFit?'reflow-needed':'ready';stats.fitChecks+=checked;
  }catch(error){document.documentElement.dataset.textMeasurement='unavailable';}
}
const resizeObserver=new ResizeObserver(queueFit);resizeObserver.observe(document.body);
const textObserver=new MutationObserver(queueFit);textObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frameId);clearInput();stopVoice();ambient?.src.stop();audioContext?.close();world?.dispose();resizeObserver.disconnect();textObserver.disconnect();}
window.addEventListener('pagehide',dispose,{once:true});
function applySettings(settings={}){
  if(typeof settings.audio==='boolean'){$('audio-enabled').checked=settings.audio;$('audio-enabled').onchange()}
  if(typeof settings.englishSubtitles==='boolean'){$('english-enabled').checked=settings.englishSubtitles;$('english-enabled').onchange()}
}
window.addEventListener('message',event=>{
  if(!embedded||event.source!==parent||event.origin!==location.origin||disposed)return;
  const msg=event.data;if(!msg||msg.namespace!=='gta-klein-korinthen'||msg.channel!==channel)return;
  if(msg.type==='init'){if(msg.state!==undefined){state=restoreState(msg.state);updateHUD()}applySettings(msg.settings);emit('initialized',{state})}
  if(msg.type==='settings')applySettings(msg.settings);
  if(msg.type==='pause'){externalPaused=true;paused=true;clearInput();cancelMeasure();voice?.pause();audioContext?.suspend()}
  if(msg.type==='resume'){externalPaused=false;paused=dialogs.some(d=>d.open);lastFrame=performance.now();if($('audio-enabled').checked)audioContext?.resume();if(voice&&$('conversation').open)voice.play().catch(()=>{})}
  if(msg.type==='dispose')dispose();
});
$('exit-level').onclick=()=>{clearInput();stopVoice();audioContext?.suspend();emit('exit',{state})};
if(embedded){document.body.dataset.embedded='true';$('exit-level').hidden=false;$('exit-level').dataset.fit='';$('settings').append($('exit-level'));}
$('start').onclick=()=>{
  started=true;$('welcome').hidden=true;for(const id of ['hud','objective','reticle','controls'])$(id).hidden=false;$('touch-controls').hidden=!touch;
  audio();startAmbient();$('world').focus({preventScroll:true});updateHUD();queueFit();
  toast(state.stage==='arrival'?'Vor dem Vereinsheim wartet Dietmar. Gehen Sie zu ihm und drücken Sie E.':'Aufnahmeakte wiederhergestellt. Die Nachbarschaft hat gewartet.');
};
try{
  await document.fonts.ready;const {createWorld}=await import('./world.mjs');world=createWorld(worldCanvas);updateHUD();$('start').disabled=false;text('start',state.stage==='arrival'?'Ein ordentliches Leben beginnen':'Aufnahmeverfahren fortsetzen');text('loading','WASD / Pfeile zum Gehen · Maus ziehen zum Umsehen · E für Aktionen');
  frameId=requestAnimationFrame(frame);queueFit();emit('ready');
}catch(error){text('loading','Die 3D-Nachbarschaft konnte nicht starten. Bitte WebGL aktivieren und die Seite neu laden.');text('start','3D-Grafik nicht verfügbar');document.documentElement.dataset.loadError=String(error.message);console.error(error);}
// Read-only diagnostics: the playtest drives real keyboard/pointer controls, never mission setters.
window.__kleinKorinthen=Object.freeze({snapshot:()=>structuredClone({state,player,stats,started,paused,measurement:measurement?{id:measurement.car.id,elapsed:measurement.elapsed}:null,target:activeTarget?{kind:activeTarget.kind,id:activeTarget.id}:null,solids:world?.solids,drawCalls:world?.renderer.info.render.calls,triangles:world?.renderer.info.render.triangles,dialogs:dialogs.filter(d=>d.open).map(d=>d.id),voice:{speaker,playing:!!voice&&!voice.paused,time:voice?.currentTime??0},fit:document.documentElement.dataset.textMeasurement})});
