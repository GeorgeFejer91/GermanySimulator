import {prepareWithSegments,measureLineStats} from "./assets/vendor/pretext/dist/layout.js";
import {splitCaption,timedCaptions,captionAt,captionAtProgress} from "./subtitle-protocol.js";

const app=document.getElementById("app"),box=document.getElementById("english-subtitle");
const preparedCache=new Map();
let scheduled=false;

function measure(text,font,spacing,width){
  const key=JSON.stringify([text,font,spacing]);
  let prepared=preparedCache.get(key);
  if(!prepared){
    prepared=prepareWithSegments(text,font,{letterSpacing:spacing});
    if(preparedCache.size>=128)preparedCache.delete(preparedCache.keys().next().value);
    preparedCache.set(key,prepared);
  }
  return measureLineStats(prepared,Math.max(1,width));
}

function paginate(text){
  if(!text?.trim())return [];
  const css=getComputedStyle(box),font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
  const width=box.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-6;
  const height=box.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom);
  const lineHeight=parseFloat(css.lineHeight),spacing=parseFloat(css.letterSpacing)||0,wordSpacing=parseFloat(css.wordSpacing)||0;
  if(typeof Intl.Segmenter!=="function"||!document.fonts.check(font)){
    box.dataset.measurement="unavailable";
    return splitCaption(text,part=>part.length<=Math.max(12,Math.floor(width/11)));
  }
  box.dataset.measurement="pretext-0.0.9";
  return splitCaption(text,part=>{
    const usable=width-wordSpacing*(part.match(/ /g)||[]).length;
    const lines=measure(part,font,spacing,usable);
    return lines.lineCount<=2&&lines.maxLineWidth<=usable+1&&lines.lineCount*lineHeight<=height+1;
  });
}

window.GermanySubtitleLayout={paginate,timedCaptions:cues=>timedCaptions(cues,paginate),captionAt,captionAtProgress};

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
    const lines=measure(box.textContent,font,spacing,width);
    fits=lines.maxLineWidth<=width+1&&lines.lineCount*parseFloat(css.lineHeight)<=contentHeight+1;
  }
  box.dataset.fit=!fits||box.scrollHeight>box.clientHeight+1?"scroll":"fit";
}

function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(update)}
new ResizeObserver(schedule).observe(box);
new MutationObserver(schedule).observe(box,{attributes:true,attributeFilter:["hidden"],childList:true,characterData:true,subtree:true});
window.addEventListener("resize",schedule);
document.fonts.ready.then(schedule);
schedule();
