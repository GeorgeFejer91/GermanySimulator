import {measureLineStats,measureNaturalWidth,prepareWithSegments} from './assets/vendor/pretext/dist/layout.js';

// Keep the bounded Amt labels readable as the phone, browser zoom, or German copy changes.
const selectors=['#amt-objective','#amt-nearby','#amt-number-board','#amt-line','#amt-status','#amt-ambient','#amt-actions button','#amt-leave','#amt-exit','#amt-direct-reset','#amt-direct-result-title','#amt-direct-result-copy','.amt-direct-result a','#phone-status','#phone-connect-status','.phone-brand strong','.phone-breadcrumb','.phone-title','#phone-form h2','#phone-form p','#phone-form label','#phone-submit','#phone-caller','#phone-call-state','#phone-answer-label','#phone-decline-label','#phone-swipe-label','.phone-keep','#phone-call-line'];
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(async()=>{queued=false;await document.fonts.ready;measure()})}
function measure(){
 const zoom=Number.parseFloat(getComputedStyle(document.documentElement).zoom)||1;
 document.body.classList.toggle('amt-compact',innerWidth/zoom<260);
 for(const el of document.querySelectorAll(selectors.join(','))){
  if(el.hidden||!el.getClientRects().length)continue;
  const icon=el.matches('#phone-answer,#phone-decline')?el.querySelector('span'):null;
  // Icon and label are separate flex items, not a single mixed-font text run.
  const text=icon?Array.from(el.childNodes).filter(node=>node.nodeType===3).map(node=>node.textContent).join('').trim():el.textContent.trim();if(!text)continue;
  const css=getComputedStyle(el),px=Number.parseFloat(css.fontSize),lineHeight=Number.parseFloat(css.lineHeight)||px*1.3;
  if(!Number.isFinite(px)||!Number.isFinite(lineHeight))continue;
  const x=(Number.parseFloat(css.paddingLeft)||0)+(Number.parseFloat(css.paddingRight)||0);
  const y=(Number.parseFloat(css.paddingTop)||0)+(Number.parseFloat(css.paddingBottom)||0)+(Number.parseFloat(css.borderTopWidth)||0)+(Number.parseFloat(css.borderBottomWidth)||0);
  // clientWidth and the font are in the same CSS-pixel space, even at 200% zoom.
  const width=Math.max(1,el.clientWidth-x);
  const iconHeight=icon?icon.offsetHeight+(Number.parseFloat(css.rowGap)||0):0;
  const font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
  try{
   const prepared=prepareWithSegments(text,font,{letterSpacing:Number.parseFloat(css.letterSpacing)||0});
   const stats=measureLineStats(prepared,width);
   const oneLine=stats.lineCount===1&&measureNaturalWidth(prepared)<=width-2;
   const minimum=Math.ceil(Math.max(1,stats.lineCount)*lineHeight+y+iconHeight+4);
   // Flex and grid regions can grow; the paper and phone panels scroll when needed.
   if(el.matches('button,#amt-objective,#amt-nearby,#amt-line,#phone-call-line,#phone-status,#phone-connect-status,#amt-ambient'))el.style.minHeight=`${minimum}px`;
   el.dataset.pretextFit=oneLine?'one-line':stats.lineCount>0?'wrapped':'empty';
  }catch{el.dataset.pretextFit='unavailable'}
 }
}
for(const root of [document.getElementById('amt-level'),document.getElementById('amt-walk-hud'),document.getElementById('amt-direct-result'),document.querySelector('.phone-shell')]){
 if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
}
addEventListener('resize',schedule,{passive:true});
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['style']});
window.BuergeramtFit=schedule;
schedule();
