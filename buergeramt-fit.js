import {measureLineStats,measureNaturalWidth,prepareWithSegments} from './assets/vendor/pretext/dist/layout.js';

// Keep the bounded Amt labels readable as the phone, browser zoom, or German copy changes.
const selectors=['#start','#amt-objective','#amt-nearby','#amt-number-board','#amt-title','#amt-line','#amt-status','#amt-ambient','#amt-actions button','#amt-leave','#amt-exit','#amt-direct-reset','#amt-direct-result-title','#amt-direct-result-copy','.amt-direct-result a','#amt-mix summary','#amt-mix label','#amt-compact-reset','#phone-status','#phone-connect-status','.phone-brand strong','.phone-breadcrumb','.phone-title','#phone-form h2','#phone-form p','#phone-form label','#phone-submit','#phone-caller','#phone-call-state','#phone-answer-label','#phone-decline-label','#phone-swipe-label','.phone-keep','#phone-call-line'];
selectors.push('.control-dock button');
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(async()=>{queued=false;await document.fonts.ready;measure()})}
function measure(){
 const zoom=Number.parseFloat(getComputedStyle(document.documentElement).zoom)||1;
 document.body.classList.toggle('amt-compact',innerWidth/zoom<260);
 for(const el of document.querySelectorAll(selectors.join(','))){
  if(el.hidden||!el.getClientRects().length)continue;
  const label=el.matches('.control-dock button')?el.querySelector('.fraktur'):null;
  const icon=label?el.querySelector('.dock-icon'):el.matches('#phone-answer,#phone-decline')?el.querySelector('span'):null;
  // Icon and label are separate flex items, not a single mixed-font text run.
  const text=label?label.textContent.trim():icon?Array.from(el.childNodes).filter(node=>node.nodeType===3).map(node=>node.textContent).join('').trim():el.textContent.trim();if(!text)continue;
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
   const prepared=prepareWithSegments(text,font,{letterSpacing:Number.parseFloat(css.letterSpacing)||0});
   const stats=measureLineStats(prepared,width);
   const oneLine=stats.lineCount===1&&measureNaturalWidth(prepared)<=width-2;
   const minimum=Math.ceil(Math.max(1,stats.lineCount)*lineHeight+y+iconHeight+4);
   const reflow=label&&(!oneLine||minimum>el.offsetHeight);
   // Flex and grid regions can grow; the subtitle rail and phone page scroll when needed.
   if(document.body.classList.contains('amt-compact')&&el.matches('#amt-actions button'))el.style.removeProperty('min-height');
   else if(el.matches('button,#amt-objective,#amt-nearby,#phone-call-line,#phone-status,#phone-connect-status,#amt-ambient'))el.style.minHeight=`${minimum}px`;
   el.dataset.pretextFit=reflow?'reflow':oneLine?'one-line':stats.lineCount>0?'wrapped':'empty';
  }catch{el.dataset.pretextFit='unavailable'}
 }
 const dock=document.querySelector('.control-dock');
 const clearance=dock?.getClientRects().length?Math.ceil((innerHeight-dock.getBoundingClientRect().top)/zoom):0;
 const value=`${clearance}px`;
 if(document.body.style.getPropertyValue('--city-control-clearance')!==value)document.body.style.setProperty('--city-control-clearance',value);
}
for(const root of [document.getElementById('intro'),document.getElementById('amt-level'),document.getElementById('amt-walk-hud'),document.getElementById('amt-mix'),document.getElementById('amt-direct-result'),document.querySelector('.phone-shell')]){
 if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
}
addEventListener('resize',schedule,{passive:true});
const dock=document.querySelector('.control-dock');if(dock)new ResizeObserver(schedule).observe(dock);
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['style']});
window.BuergeramtFit=schedule;
schedule();
