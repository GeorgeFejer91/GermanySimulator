import {prepareWithSegments,measureLineStats} from './assets/vendor/pretext/dist/layout.js';

const panel=document.querySelector('.preload-content');
let queued=false;
function measure(){
  queued=false;
  for(const el of panel.querySelectorAll('[data-preload-text]')){
    if(el.hidden)continue;
    const css=getComputedStyle(el),font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
    const zoom=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
    const width=el.getBoundingClientRect().width/zoom-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-parseFloat(css.borderLeftWidth)-parseFloat(css.borderRightWidth);
    try{
      if(!document.fonts.check(font)||width<=0)throw Error('font or bounds unavailable');
      const prepared=prepareWithSegments(el.textContent,font,{letterSpacing:parseFloat(css.letterSpacing)||0});
      const stats=measureLineStats(prepared,Math.max(1,width-2));
      el.dataset.pretextFit=stats.maxLineWidth<=width&&stats.lineCount*parseFloat(css.lineHeight)<=el.clientHeight+2?'fit':'reflow';
      el.dataset.measurement='pretext-0.0.9';
      // Text retains its full copy and readable size; auto-height absorbs wrapping.
    }catch{el.dataset.pretextFit='unavailable';el.dataset.measurement='unavailable'}
  }
}
function schedule(){if(!queued&&!document.getElementById('preload').hidden){queued=true;requestAnimationFrame(measure)}}
new ResizeObserver(schedule).observe(panel);
new MutationObserver(schedule).observe(panel,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
addEventListener('resize',schedule,{passive:true});
document.fonts.ready.then(schedule);
