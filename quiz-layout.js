import {prepareWithSegments,measureLineStats} from "./assets/vendor/pretext/dist/layout.js";

const modal=document.getElementById("quiz-modal"),card=modal.querySelector(".quiz-card");
let pending=false;

function measureQuizText(){
 pending=false;
 if(modal.hidden)return;
 let fit=true;
 for(const element of modal.querySelectorAll("#quiz-person-name,#quiz-person-title,#quiz-speaker,#quiz-source,#quiz-prompt,#quiz-choices button")){
  const css=getComputedStyle(element),font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
  if(typeof Intl.Segmenter!=="function"||!document.fonts.check(font)){card.dataset.textFit="unavailable";return}
  const width=element.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight),height=element.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom);
  const prepared=prepareWithSegments(element.textContent,font,{letterSpacing:parseFloat(css.letterSpacing)||0});
  const lines=measureLineStats(prepared,Math.max(1,width));
  const lineHeight=parseFloat(css.lineHeight)||parseFloat(css.fontSize)*1.4;
  fit&&=lines.maxLineWidth<=width+1&&lines.lineCount*lineHeight<=height+1;
 }
 card.dataset.textFit=fit?"fit":"scroll";
}

function schedule(){if(pending)return;pending=true;requestAnimationFrame(measureQuizText)}
new ResizeObserver(schedule).observe(card);
new MutationObserver(schedule).observe(modal,{attributes:true,attributeFilter:["hidden"],childList:true,characterData:true,subtree:true});
addEventListener("resize",schedule);
document.fonts.ready.then(schedule);
