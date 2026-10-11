import {prepareWithSegments,measureLineStats,setLocale} from "./assets/vendor/pretext/dist/layout.js";
import {splitCaption,timedCaptions,captionAt,captionAtProgress} from "./subtitle-protocol.js";

const app=document.getElementById("app"),box=document.getElementById("english-subtitle");
const preparedCache=new Map();
let scheduled=false,geometry='';

function measure(text,font,spacing,width){
  setLocale(box.lang||"en");
  const key=JSON.stringify([text,font,spacing,box.lang]);
  let prepared=preparedCache.get(key);
  if(!prepared){
    prepared=prepareWithSegments(text,font,{letterSpacing:spacing});
    if(preparedCache.size>=128)preparedCache.delete(preparedCache.keys().next().value);
    preparedCache.set(key,prepared);
  }
  return measureLineStats(prepared,Math.max(1,width));
}

function paginate(text,speaker=""){
  if(!text?.trim())return [];
  const label=part=>speaker?speaker+" · "+part:part;
  const css=getComputedStyle(box),font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
  const width=box.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-6;
  const height=box.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom);
  const lineHeight=parseFloat(css.lineHeight),spacing=parseFloat(css.letterSpacing)||0,wordSpacing=parseFloat(css.wordSpacing)||0;
  if(typeof Intl.Segmenter!=="function"||!document.fonts.check(font)){
    box.dataset.measurement="unavailable";
    return splitCaption(text,part=>label(part).length<=Math.max(12,Math.floor(width/11))).map((part,index)=>index?part:label(part));
  }
  box.dataset.measurement="pretext-0.0.9";
  setLocale(box.lang||"en");
  return splitCaption(text,part=>{
    const content=label(part),usable=width-wordSpacing*(content.match(/ /g)||[]).length;
    const lines=measure(content,font,spacing,usable);
    return lines.lineCount<=2&&lines.maxLineWidth<=usable+1&&lines.lineCount*lineHeight<=height+1;
  }).map((part,index)=>index?part:label(part));
}

window.GermanySubtitleLayout={paginate,timedCaptions:(cues,speaker)=>timedCaptions(cues,text=>paginate(text,speaker)),captionAt,captionAtProgress};

function update(){
  scheduled=false;
  const visible=!box.hidden&&!!box.textContent;
  const zoom=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
  const height=box.getBoundingClientRect().height/zoom;
  app.style.setProperty("--subtitle-height",`${height}px`);
  if(!visible){box.dataset.fit="hidden";return}

  const css=getComputedStyle(box),font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
  const width=box.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
  const contentHeight=box.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom);
  const spacing=parseFloat(css.letterSpacing)||0,wordSpacing=parseFloat(css.wordSpacing)||0;
  let fits=true;
  const measurable=typeof Intl.Segmenter==="function"&&document.fonts.check(font);
  box.dataset.measurement=measurable?"pretext-0.0.9":"unavailable";
  if(measurable){
    const usable=width-wordSpacing*(box.textContent.match(/ /g)||[]).length,lines=measure(box.textContent,font,spacing,usable);
    fits=lines.maxLineWidth<=usable+1&&lines.lineCount*parseFloat(css.lineHeight)<=contentHeight+1;
  }
  box.dataset.fit=!fits||box.scrollHeight>box.clientHeight+1||box.scrollWidth>box.clientWidth+1?"scroll":measurable?"fit":"unavailable";
  const next=JSON.stringify([width,contentHeight,font,spacing,wordSpacing,css.lineHeight,box.lang]);
  if(next!==geometry){geometry=next;window.dispatchEvent(new Event('caption-layout-change'))}
}

function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(update)}
new ResizeObserver(schedule).observe(box);
new MutationObserver(schedule).observe(box,{attributes:true,attributeFilter:["hidden"],childList:true,characterData:true,subtree:true});
window.addEventListener("resize",schedule);
document.fonts.ready.then(()=>{preparedCache.clear();geometry='';schedule()});
schedule();
