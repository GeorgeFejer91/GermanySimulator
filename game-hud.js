import {prepareWithSegments,measureLineStats,measureNaturalWidth} from './assets/vendor/pretext/dist/layout.js';

const byId=id=>document.getElementById(id),file=byId('case-file'),fax=byId('mission-fax'),rail=byId('city-status'),toggle=byId('file-toggle'),notices=byId('city-notices');
const noticeAnchor=document.createComment('city notice position');notices.before(noticeAnchor);
const alerts=['toast','police-bark','violation-alert','wurst-alert','law-unlock-prompt','border-alert','dialogue','quiz-modal','form-modal','humor-modal','end-modal'];
const cache=new Map();
let pending=true,mission='',timer=0,exitTimer=0,queued=false,manual=false,language='';
const visible=el=>!el.hidden&&(el.id!=='toast'||el.classList.contains('show'));
const active=()=>{const s=window.Germany3DBridge?.getHUDState();return s?.started&&!s.busy&&!document.hidden&&!document.body.classList.contains('amt-inside')};
const quiet=()=>active()&&!alerts.some(id=>visible(byId(id)));
const setText=(el,text)=>{if(el.textContent!==text)el.textContent=text};
const setHidden=(el,hidden)=>{if(el.hidden!==hidden)el.hidden=hidden};
function arm(callback,delay){clearTimeout(timer);timer=setTimeout(()=>{timer=0;callback()},delay)}
function reminder(){arm(()=>{pending=true;schedule()},90000)}
function hideFax(animate=false){
 clearTimeout(timer);timer=0;clearTimeout(exitTimer);
 if(animate&&!fax.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){fax.classList.add('fax-leaving');exitTimer=setTimeout(()=>{fax.hidden=true;fax.classList.remove('fax-leaving')},350)}
 else{fax.hidden=true;fax.classList.remove('fax-leaving')}
}
function showFax(){
 pending=false;clearTimeout(exitTimer);fax.classList.remove('fax-leaving');
 setText(byId('fax-title'),byId('mission-title').textContent);setText(byId('fax-text'),byId('mission-text').textContent);
 fax.hidden=false;measure();
 // Read time begins after the short reveal. Hover/focus offers unlimited time.
 const words=fax.textContent.trim().split(/\s+/).length;
 arm(expire,Math.max(12000,Math.min(30000,words*350+1500)));
}
function expire(){if(fax.matches(':hover')||fax.contains(document.activeElement)){arm(expire,3000);return}hideFax(true);reminder()}
function page(name){for(const el of file.querySelectorAll('[data-page]'))el.hidden=el.dataset.page!==name;for(const el of file.querySelectorAll('[data-file-page]'))el.setAttribute('aria-pressed',String(el.dataset.filePage===name));measure()}
function openFile(){
 if(!active())return;
 hideFax();pending=false;manual=true;window.Germany3DBridge.clearInput();
 file.append(notices);file.showModal();toggle.setAttribute('aria-expanded','true');page('mission');byId('file-close').focus();schedule();
}
function closeFile(){file.close()}
file.addEventListener('close',()=>{manual=false;noticeAnchor.after(notices);toggle.setAttribute('aria-expanded','false');window.Germany3DBridge.clearInput();if(!rail.hidden)toggle.focus({preventScroll:true});if(!document.hidden)reminder();schedule()});
byId('file-close').onclick=closeFile;toggle.onclick=openFile;byId('fax-open').onclick=openFile;
byId('fax-dismiss').onclick=()=>{pending=false;hideFax();reminder();toggle.focus({preventScroll:true})};
for(const el of file.querySelectorAll('[data-file-page]'))el.onclick=()=>page(el.dataset.filePage);
addEventListener('keydown',event=>{
 if(event.repeat||event.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
 if(event.code==='KeyM'&&(active()||manual)){event.preventDefault();event.stopImmediatePropagation();if(manual)closeFile();else openFile()}
 else if(event.code==='Escape'&&!fax.hidden&&!manual){event.preventDefault();pending=false;hideFax();reminder()}
},true);
window.GermanyHUD={get paused(){return manual},refresh:schedule};

function sync(){
 queued=false;
 const state=window.Germany3DBridge?.getHUDState();if(!state)return;
 setHidden(rail,!state.started||state.busy||document.body.classList.contains('amt-inside'));
 const lang=state.lang==='en'?'en':'de';
 if(language!==lang){language=lang;for(const el of document.querySelectorAll('[data-de]'))setText(el,el.dataset[lang]);byId('fax-dismiss').setAttribute('aria-label',lang==='en'?'Hide mission':'Auftrag ausblenden')}
 setHidden(byId('energy-warning'),state.energy>35);setText(byId('energy-warning'),(lang==='en'?'ENERGY ':'ENERGIE ')+state.energy);
 const next=byId('mission-title').textContent+'\n'+byId('mission-text').textContent;
 if(next!==mission){mission=next;pending=true;hideFax()}
 if(!active()||!quiet()||manual){if(!fax.hidden){pending=true;hideFax()}if(!active()){clearTimeout(timer);timer=0}}
 else if(pending)showFax();
 else if(!timer)reminder();
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
 if(file.open){const p=file.querySelector('.file-page:not([hidden])');p.dataset.fit=p.scrollHeight>p.clientHeight+1?'scroll':'fit'}
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
for(const id of [...alerts,'mission-title','mission-text','energy','stars','day','law-power','wurst-badges','intro'])observer.observe(byId(id),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class']});
observer.observe(document.body,{attributes:true,attributeFilter:['class']});
observer.observe(document.documentElement,{attributes:true,attributeFilter:['style','lang']});
const bounds=new ResizeObserver(schedule);for(const el of [file,rail,document.querySelector('.control-dock')])bounds.observe(el);
addEventListener('resize',schedule,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){queued=false;clearTimeout(timer);timer=0;hideFax();if(manual)closeFile();pending=true}else schedule()});
addEventListener('pagehide',()=>{hideFax();cache.clear()});
addEventListener('pageshow',()=>{pending=true;schedule()});
document.fonts.ready.then(schedule);schedule();
