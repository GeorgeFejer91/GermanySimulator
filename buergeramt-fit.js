import {measureLineStats,measureNaturalWidth,prepareWithSegments} from './assets/vendor/pretext/dist/layout.js';

// Keep the bounded Amt labels readable as the phone, browser zoom, or German copy changes.
const selectors=['#start','#amt-objective','#amt-nearby','#amt-title','#amt-line','#amt-status','#amt-ambient','#amt-actions button','#amt-leave','#amt-exit','#amt-direct-reset','#amt-direct-result-title','#amt-direct-result-copy','.amt-direct-result a','#amt-mix summary','#amt-mix label','#amt-compact-reset','#phone-expired-stamp','#phone-expired-copy','#phone-number','#phone-status','#phone-admission-status','.phone-brand strong','.phone-breadcrumb','.phone-title','#phone-form h2','#phone-form p','#phone-form label','#phone-submit','#phone-caller','#phone-call-state','#phone-answer-label','#phone-decline-label','#phone-swipe-label','#phone-hangup-label','.phone-keep'];
selectors.push('.control-dock button','.amt-touch-controls button');
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(async()=>{queued=false;await document.fonts.ready;measure()})}
function measure(){
 const zoom=Number.parseFloat(getComputedStyle(document.documentElement).zoom)||1;
 document.body.classList.toggle('amt-compact',innerWidth/zoom<260);
 document.body.classList.toggle('amt-replies-low',innerWidth/zoom<420);
 const phoneCall=document.getElementById('phone-call');if(phoneCall){const height=(innerHeight/zoom)+'px';if(phoneCall.style.getPropertyValue('--phone-height')!==height)phoneCall.style.setProperty('--phone-height',height)}
 const sequence=document.querySelector('#amt-walk-hud.sequence');
 if(sequence){
  const top=sequence.getBoundingClientRect().top;
  const controls=[...document.querySelectorAll('#amt-mix,.subtitle-toggle')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
  const replies=document.getElementById('amt-actions');
  const lowered=document.body.classList.contains('amt-replies-low');
  const sideReplies=replies.children.length&&replies.classList.contains('side-choices')&&!lowered;
  const clearance=Math.max(0,...controls.map(el=>(el.getBoundingClientRect().bottom-top)/zoom),sideReplies?(replies.getBoundingClientRect().bottom-top)/zoom:0)+12;
  sequence.style.setProperty('--amt-caption-top',`${Math.ceil(clearance)}px`);
  sequence.style.setProperty('--amt-scene-height',`${sequence.getBoundingClientRect().height/zoom}px`);
  sequence.style.setProperty('--amt-actions-height',`${replies.children.length&&(!replies.classList.contains('side-choices')||lowered)?Math.ceil(replies.getBoundingClientRect().height/zoom)+12:0}px`);
 }
 for(const el of document.querySelectorAll(selectors.join(','))){
  if(el.hidden||!el.getClientRects().length)continue;
  const label=el.matches('.control-dock button')?el.querySelector('.fraktur'):null;
  const icon=label?el.querySelector('.dock-icon'):el.matches('#phone-answer,#phone-decline')?el.querySelector('span'):null;
  // Icon and label are separate flex items, not a single mixed-font text run.
  const touchLabel=el.matches('.amt-touch-controls button');
  const text=touchLabel?el.innerText.trim():label?label.textContent.trim():icon?Array.from(el.childNodes).filter(node=>node.nodeType===3).map(node=>node.textContent).join('').trim():el.textContent.trim();if(!text)continue;
  const css=getComputedStyle(label||el),boxCss=getComputedStyle(el),px=Number.parseFloat(css.fontSize),lineHeight=Number.parseFloat(css.lineHeight)||px*1.3;
  if(!Number.isFinite(px)||!Number.isFinite(lineHeight))continue;
  const x=(Number.parseFloat(boxCss.paddingLeft)||0)+(Number.parseFloat(boxCss.paddingRight)||0);
  const y=(Number.parseFloat(boxCss.paddingTop)||0)+(Number.parseFloat(boxCss.paddingBottom)||0)+(Number.parseFloat(boxCss.borderTopWidth)||0)+(Number.parseFloat(boxCss.borderBottomWidth)||0);
  // clientWidth and the font are in the same CSS-pixel space, even at 200% zoom.
  const width=Math.max(1,el.clientWidth-x);
  const iconHeight=(icon?icon.offsetHeight:label?(Number.parseFloat(boxCss.lineHeight)||Number.parseFloat(boxCss.fontSize)):0)+(icon||label?(Number.parseFloat(boxCss.rowGap)||0):0);
  const font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
  try{
   if(label&&(typeof Intl.Segmenter!=='function'||!document.fonts.check(font)))throw Error('Text measurement unavailable');
   const prepared=prepareWithSegments(text,font,{letterSpacing:Number.parseFloat(css.letterSpacing)||0,...(touchLabel?{whiteSpace:'pre-wrap'}:{})});
   const stats=measureLineStats(prepared,width);
   const oneLine=stats.lineCount===1&&measureNaturalWidth(prepared)<=width-2;
   const minimum=Math.ceil(Math.max(1,stats.lineCount)*lineHeight+y+iconHeight+4);
   if(el.matches('#amt-ambient')&&el.closest('.sequence')){
    el.style.removeProperty('min-height');
    el.dataset.pretextFit=minimum>el.clientHeight+4?'scroll':oneLine?'one-line':'wrapped';
    continue;
   }
   const reflow=label&&(!oneLine||minimum>el.offsetHeight);
   // Flex and grid regions can grow; the subtitle rail and phone page scroll when needed.
   if(document.body.classList.contains('amt-replies-low')&&el.matches('#amt-actions button'))el.style.removeProperty('min-height');
   else if(el.matches('button,#amt-objective,#amt-nearby,#phone-status,#phone-admission-status,#amt-ambient'))el.style.minHeight=`${minimum}px`;
   el.dataset.pretextFit=el.matches('#amt-actions button')&&minimum>el.offsetHeight+4?'scroll':reflow?'reflow':oneLine?'one-line':stats.lineCount>0?'wrapped':'empty';
  }catch{el.dataset.pretextFit='unavailable'}
 }
 const dock=document.querySelector('.control-dock');
 const clearance=dock?.getClientRects().length?Math.ceil((innerHeight-dock.getBoundingClientRect().top)/zoom):0;
 const value=`${clearance}px`;
 if(document.body.style.getPropertyValue('--city-control-clearance')!==value)document.body.style.setProperty('--city-control-clearance',value);
 if(document.body.classList.contains('amt-inside')){
  const subtitle=document.getElementById('subtitle-toggle');
  const controls=[subtitle,document.querySelector('#amt-mix summary'),document.getElementById('amt-direct-reset')].filter(el=>el?.getClientRects().length);
  const toolbar=Math.max(0,...controls.map(el=>el.getBoundingClientRect().bottom/zoom));
  const touch=document.querySelector('.amt-touch-controls');
  const touchClearance=touch?.getClientRects().length?(innerHeight-touch.getBoundingClientRect().top)/zoom+12:140;
  const values={'--amt-subtitle-width':subtitle.getBoundingClientRect().width/zoom,'--amt-toolbar-bottom':toolbar,'--amt-info-bottom':toolbar,'--amt-touch-clearance':touchClearance};
  for(const [key,number] of Object.entries(values)){const next=number+'px';if(document.body.style.getPropertyValue(key)!==next)document.body.style.setProperty(key,next)}
 }
}
for(const root of [document.getElementById('intro'),document.getElementById('amt-level'),document.getElementById('amt-walk-hud'),document.getElementById('amt-mix'),document.getElementById('amt-direct-result'),document.querySelector('.phone-shell')]){
 if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','open','class']});
}
addEventListener('resize',schedule,{passive:true});
const dock=document.querySelector('.control-dock');if(dock)new ResizeObserver(schedule).observe(dock);
const officeBounds=new ResizeObserver(schedule);for(const el of [document.getElementById('subtitle-toggle'),document.getElementById('amt-direct-reset'),document.getElementById('amt-actions')])if(el)officeBounds.observe(el);
// The shared HUD fitter positions the subtitle control after its own measure.
// Follow that final position without a separate animation/update loop.
const subtitleControl=document.querySelector('.subtitle-toggle');
if(subtitleControl)new MutationObserver(schedule).observe(subtitleControl,{attributes:true,attributeFilter:['style','hidden','class']});
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['style']});
window.BuergeramtFit=schedule;
// Focused scene text can scroll with keys without activating an answer.
for(const region of [document.getElementById('amt-actions'),document.getElementById('amt-ambient')])region?.addEventListener('keydown',event=>{
 const target=event.target.closest('button')||event.currentTarget;
 if(target.scrollHeight<=target.clientHeight||!['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key))return;
 event.preventDefault();const step=event.key.startsWith('Page')?target.clientHeight*.8:32;
 target.scrollTop=event.key==='Home'?0:event.key==='End'?target.scrollHeight:target.scrollTop+(['ArrowUp','PageUp'].includes(event.key)?-step:step);
});
schedule();
