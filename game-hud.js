import {prepareWithSegments,measureLineStats,measureNaturalWidth} from './assets/vendor/pretext/dist/layout.js';

const byId=id=>document.getElementById(id),file=byId('case-file'),fax=byId('mission-fax'),rail=byId('city-status'),toggle=byId('file-toggle'),notices=byId('city-notices');
const noticeAnchor=document.createComment('city notice position');notices.before(noticeAnchor);
const meter=byId('germanness-hud'),meterAnchor=document.createComment('Germanness HUD position');meter.before(meterAnchor);
const alerts=['toast','police-bark','violation-alert','wurst-alert','law-unlock-prompt','border-alert','dialogue','quiz-modal','form-modal','humor-modal','end-modal'];
const cache=new Map();
let pending=true,mission='',timer=0,reminderAt=0,queued=false,manual=false,language='';
let motion=0,motionTimer=0,sound=null,departing=false,mask=null,kernel=null;
const FAX_READ_MS=12000,FAX_GAP_MS=150000;
const visible=el=>!el.hidden&&(el.id!=='toast'||el.classList.contains('show'));
const active=()=>{const s=window.Germany3DBridge?.getHUDState();return s?.started&&!s.busy&&!document.hidden&&!document.body.classList.contains('amt-inside')};
const quiet=()=>active()&&!alerts.some(id=>visible(byId(id)));
const setText=(el,text)=>{if(el.textContent!==text)el.textContent=text};
const setHidden=(el,hidden)=>{if(el.hidden!==hidden)el.hidden=hidden};
function arm(callback,delay){clearTimeout(timer);timer=setTimeout(()=>{timer=0;callback()},delay)}
function reminder(reset=false){if(reset||!reminderAt)reminderAt=performance.now()+FAX_GAP_MS;arm(()=>{pending=true;schedule()},Math.max(0,reminderAt-performance.now()))}
function cancelTransition(){cancelAnimationFrame(motion);motion=0;clearTimeout(motionTimer);motionTimer=0;sound?.cancel();sound=null;departing=false;fax.classList.remove('fax-leaving');fax.style.removeProperty('mask-image');delete fax.dataset.transition}
// Screen-space Gaussian splatting: overlapping anisotropic alpha kernels mask
// the actual DOM sheet, so its exact text, focus order and hit targets survive.
// One 192x256 mask + 32x32 kernel; at most 30 Hz, only during a 1.08s feed.
function paintSplats(progress){
 if(!mask){mask=document.createElement('canvas');mask.width=192;mask.height=256;kernel=document.createElement('canvas');kernel.width=kernel.height=32;const k=kernel.getContext('2d'),pixels=k.createImageData(32,32);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r2=((x-15.5)**2+(y-15.5)**2)/25.5;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;pixels.data[i+3]=Math.round(255*Math.exp(-r2/2))}k.putImageData(pixels,0,0)}
 const ctx=mask.getContext('2d');ctx.clearRect(0,0,192,256);
 for(let y=0;y<24;y++)for(let x=0;x<18;x++){const i=y*18+x,local=Math.max(0,Math.min(1,(progress*1.6-y/24*.5-(Math.sin(i*7)+1)*.05)/.8)),scatter=(1-local)**2;ctx.globalAlpha=local;const rx=19+scatter*10,ry=17+scatter*8;ctx.drawImage(kernel,(x+.5)*192/18+Math.sin(i*13)*scatter*28-rx,(y+.5)*256/24+Math.cos(i*9)*scatter*35-ry,rx*2,ry*2)}
 ctx.globalAlpha=Math.max(0,(progress-.8)/.2);ctx.fillStyle='#fff';ctx.fillRect(0,0,192,256);ctx.globalAlpha=1;
 fax.style.maskImage=`url("${mask.toDataURL()}")`;
}
function transitionFax(appear,done){
 cancelTransition();departing=!appear;fax.classList.toggle('fax-leaving',!appear);fax.dataset.transition=appear?'arriving':'departing';
 const started=performance.now();try{sound=window.Germany3DBridge.playFaxTransition()}catch{}
 const clock=sound,duration=clock?.duration||1.08,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const finish=()=>{cancelTransition();if(!appear)fax.hidden=true;done()};
 if(reduced||!CSS.supports('mask-image','linear-gradient(#fff,#fff)')){if(!appear)fax.hidden=true;motionTimer=setTimeout(finish,duration*1000);return}
 try{paintSplats(appear?0:1)}catch{if(!appear)fax.hidden=true;motionTimer=setTimeout(finish,duration*1000);return}
 let previous=started,elapsed=0;
 function frame(now){elapsed=Math.max(elapsed,clock?.elapsed()??(now-started)/1000);const t=Math.min(1,elapsed/duration);if(t>=1){finish();return}if(now-previous>=1000/30){previous=now;paintSplats(appear?t:1-t)}motion=requestAnimationFrame(frame)}
 motion=requestAnimationFrame(frame);
}
function hideFax(animate=false,done=()=>{}){
 clearTimeout(timer);timer=0;
 if(animate&&!fax.hidden)transitionFax(false,done);
 else{cancelTransition();fax.hidden=true;done()}
}
function showFax(){
 pending=false;
 setText(byId('fax-title'),byId('mission-title').textContent);setText(byId('fax-text'),byId('mission-text').textContent);
 setText(byId('mission-announcement'),byId('fax-title').textContent+' · '+byId('fax-text').textContent);
 fax.hidden=false;measure();
 // Twelve readable seconds follow the synchronized feed. Focus alone may hold
 // it for keyboard reading; incidental pointer hover must not pin the reminder.
 transitionFax(true,()=>arm(expire,FAX_READ_MS));
}
function expire(){if(fax.contains(document.activeElement)){arm(expire,3000);return}hideFax(true,()=>{reminder(true);schedule()})}
function page(name){for(const el of file.querySelectorAll('[data-page]'))el.hidden=el.dataset.page!==name;for(const el of file.querySelectorAll('[data-file-page]'))el.setAttribute('aria-pressed',String(el.dataset.filePage===name));measure()}
function openFile(){
 if(!active())return;
 hideFax();pending=false;manual=true;window.Germany3DBridge.clearInput();
 file.append(notices);file.querySelector('.file-header').append(meter);file.showModal();toggle.setAttribute('aria-expanded','true');page('mission');byId('file-close').focus();schedule();
}
function closeFile(){file.close()}
file.addEventListener('close',()=>{manual=false;noticeAnchor.after(notices);meterAnchor.after(meter);toggle.setAttribute('aria-expanded','false');window.Germany3DBridge.clearInput();if(!rail.hidden)toggle.focus({preventScroll:true});if(!document.hidden)reminder(true);schedule()});
byId('file-close').onclick=closeFile;toggle.onclick=openFile;byId('fax-open').onclick=openFile;
byId('fax-dismiss').onclick=()=>{pending=false;hideFax(true,()=>reminder(true));toggle.focus({preventScroll:true})};
for(const el of file.querySelectorAll('[data-file-page]'))el.onclick=()=>page(el.dataset.filePage);
addEventListener('keydown',event=>{
 if(event.repeat||event.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
 if(event.code==='KeyM'&&(active()||manual)){event.preventDefault();event.stopImmediatePropagation();if(manual)closeFile();else openFile()}
 else if(event.code==='Escape'&&!fax.hidden&&!manual){event.preventDefault();pending=false;hideFax(true,()=>reminder(true))}
},true);
window.GermanyHUD={get paused(){return manual},refresh:schedule};

function sync(){
 queued=false;
 const state=window.Germany3DBridge?.getHUDState();if(!state)return;
 setHidden(rail,!state.started||document.body.classList.contains('amt-inside'));rail.classList.toggle('city-busy',!active());
 const lang=state.lang==='en'?'en':'de';
 if(language!==lang){language=lang;for(const el of document.querySelectorAll('[data-de]'))setText(el,el.dataset[lang]);byId('fax-dismiss').setAttribute('aria-label',lang==='en'?'Hide mission':'Auftrag ausblenden')}
 setHidden(byId('energy-warning'),state.energy>35);setText(byId('energy-warning'),(lang==='en'?'ENERGY ':'ENERGIE ')+state.energy);
 const next=byId('mission-title').textContent+'\n'+byId('mission-text').textContent;
 if(next!==mission){mission=next;pending=true;hideFax()}
 if(!active()||!quiet()||manual){if(!fax.hidden||motion||motionTimer){hideFax();if(!pending)reminder(true)}if(!active()){clearTimeout(timer);timer=0}}
 else if(pending)showFax();
 else if(!timer&&!motion&&!motionTimer&&!departing)reminder();
 // Speech remains visible inside the file; an actual game modal takes ownership.
 if(manual&&!active())closeFile();
 measure();
}
function schedule(){if(queued||document.hidden)return;queued=true;requestAnimationFrame(sync)}

// Actual, bounded text measurements with the shipped Pretext version. DOM owns
// wrapping; a long file page scrolls at zoom rather than truncating instructions.
const fitSelectors=['#city-status button','#energy-warning','.wanted small','#fax-title','#fax-text','.fax-heading>span','#mission-fax button','.file-header h2','.file-header button','.file-tabs button','.file-page button','.mission-body small','#mission-title','#mission-text','.rule small','#rule-id','#rule-text','.stats span','.germanness>small','#germanness-value','#law-power','.wurst-pass>b','.file-controls dt','.file-controls dd','.file-page>a','#toast','#bark-speaker','#police-bark-text','#violation-law','#violation-title','#violation-text'];
function measure(){
 for(const el of document.querySelectorAll(fitSelectors.join(','))){
  if(!el.getClientRects().length||el.hidden)continue;
  const text=el.textContent.trim();if(!text)continue;
  const css=getComputedStyle(el),font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`,spacing=parseFloat(css.letterSpacing)||0,line=parseFloat(css.lineHeight)||parseFloat(css.fontSize)*1.4;
  const zoom=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
  const width=el.getBoundingClientRect().width/zoom-parseFloat(css.borderLeftWidth)-parseFloat(css.borderRightWidth)-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight),height=el.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom);
  if(width<=0)continue;
  try{
   if(!document.fonts.check(font)||typeof Intl.Segmenter!=='function')throw Error('font unavailable');
   const key=JSON.stringify([text,font,spacing]);let prepared=cache.get(key);
   if(!prepared){prepared=prepareWithSegments(text,font,{letterSpacing:spacing});if(cache.size>=96)cache.delete(cache.keys().next().value);cache.set(key,prepared)}
   const usable=Math.max(1,width-(parseFloat(css.wordSpacing)||0)*(text.match(/ /g)||[]).length);
   const stats=measureLineStats(prepared,usable+.1),natural=measureNaturalWidth(prepared);
   el.dataset.pretextFit=stats.maxLineWidth<=usable+1&&stats.lineCount*line<=height+2?(stats.lineCount===1&&natural<=usable+1?'one-line':'wrapped'):'reflow';
   el.dataset.measurement='pretext-0.0.9';
   if(el.matches('button')){
    const min=Math.max(44,Math.ceil(stats.lineCount*line+parseFloat(css.paddingTop)+parseFloat(css.paddingBottom)+parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth)));
    if(el.style.minHeight!==min+'px')el.style.minHeight=min+'px';
   }
  }catch{el.dataset.pretextFit='unavailable';el.style.removeProperty('min-height')}
 }
 if(file.open){
  const p=file.querySelector('.file-page:not([hidden])'),css=getComputedStyle(file),zoom=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
  const anchors=(file.querySelector('.file-header').getBoundingClientRect().height+file.querySelector('.file-tabs').getBoundingClientRect().height)/zoom;
  const reading=Math.max(80,(parseFloat(getComputedStyle(document.documentElement).fontSize)||16)*3),insets=(parseFloat(css.paddingTop)||0)+(parseFloat(css.paddingBottom)||0)+(parseFloat(css.rowGap)||14)*3;
  // At enlarged text sizes, scroll the whole paper if its fixed anchors would
  // leave no readable page. Never trap the mission in a zero-height inner pane.
  file.dataset.layout=anchors+insets+reading>file.clientHeight?'scroll':'bounded';
  p.dataset.fit=p.scrollHeight>p.clientHeight+1?'scroll':'fit';
 }
 // Stack warnings above speech without covering either, including long text.
 const zoom=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
 const top=rail.hidden?12:rail.getBoundingClientRect().bottom/zoom+8,dock=document.querySelector('.control-dock');
 const bottom=dock.getClientRects().length?dock.getBoundingClientRect().top/zoom:innerHeight/zoom-(parseFloat(getComputedStyle(byId('app')).getPropertyValue('--subtitle-height'))||0);
 const noticeTop=innerWidth<=760?top:12;
 if(!manual){notices.style.top=noticeTop+'px';notices.style.maxHeight=Math.max(44,bottom-noticeTop-12)+'px'}
 else{notices.style.removeProperty('top');notices.style.removeProperty('max-height')}
 if(!fax.hidden){fax.style.top=top+'px';fax.style.maxHeight=Math.max(44,bottom-top-12)+'px'}
}
const observer=new MutationObserver(schedule);
for(const id of [...alerts,'mission-title','mission-text','energy','stars','day','germanness-value','law-power','wurst-badges','intro'])observer.observe(byId(id),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class']});
observer.observe(document.body,{attributes:true,attributeFilter:['class']});
observer.observe(document.documentElement,{attributes:true,attributeFilter:['style','lang']});
const bounds=new ResizeObserver(schedule);for(const el of [file,rail,document.querySelector('.control-dock')])bounds.observe(el);
addEventListener('resize',schedule,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){queued=false;const wasVisible=!fax.hidden;hideFax();if(wasVisible){pending=false;reminderAt=performance.now()+FAX_GAP_MS}if(manual)closeFile()}else schedule()});
addEventListener('pagehide',()=>{hideFax();cache.clear();mask=kernel=null});
addEventListener('pageshow',schedule);
document.fonts.ready.then(schedule);schedule();
