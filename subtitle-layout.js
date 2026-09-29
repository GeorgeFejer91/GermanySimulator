import {prepareWithSegments,measureLineStats} from "./assets/vendor/pretext/dist/layout.js";

const app=document.getElementById("app"),box=document.getElementById("english-subtitle");
let prepared,preparedKey,scheduled=false;

function update(){
  scheduled=false;
  const visible=!box.hidden&&!!box.textContent;
  const height=visible?box.getBoundingClientRect().height:0;
  app.style.setProperty("--subtitle-height",`${height}px`);
  if(!visible){box.dataset.fit="hidden";return}

  const css=getComputedStyle(box),font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
  const width=box.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
  const contentHeight=box.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom);
  const spacing=parseFloat(css.letterSpacing)||0;
  let fits=true;
  const measurable=typeof Intl.Segmenter==="function"&&document.fonts.check(font);
  box.dataset.measurement=measurable?"pretext-0.0.9":"unavailable";
  if(measurable){
    const key=JSON.stringify([box.textContent,font,spacing]);
    if(key!==preparedKey){prepared=prepareWithSegments(box.textContent,font,{letterSpacing:spacing});preparedKey=key}
    const lines=measureLineStats(prepared,Math.max(1,width));
    fits=lines.maxLineWidth<=width+1&&lines.lineCount*parseFloat(css.lineHeight)<=contentHeight+1;
  }else{
    preparedKey="";
  }
  box.dataset.fit=!fits||box.scrollHeight>box.clientHeight+1?"scroll":"fit";
}

function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(update)}
new ResizeObserver(schedule).observe(box);
new MutationObserver(schedule).observe(box,{attributes:true,attributeFilter:["hidden"],childList:true,characterData:true,subtree:true});
window.addEventListener("resize",schedule);
document.fonts.ready.then(schedule);
schedule();
