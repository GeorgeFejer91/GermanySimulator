(function(){"use strict";
// External UTC is a fallback and a wall-clock check. Peer pings own cue timing.
const endpoint="https://timeapi.io/api/Time/current/zone?timeZone=UTC";
function utcAt(anchor,monoMs){return anchor.utcOffsetMs+monoMs}
function monoAt(anchor,utcMs){return utcMs-anchor.utcOffsetMs}
function usable(anchor,now=performance.now()){return !!anchor&&Number.isFinite(anchor.utcOffsetMs)&&anchor.uncertaintyMs<=300&&now-anchor.sampledAtMs<300000}
async function sample({count=3,timeoutMs=1800}={}){
 if(typeof fetch!=="function")return null;
 let best=null;
 for(let i=0;i<count;i++){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),timeoutMs),before=performance.now();
  try{
   const response=await fetch(endpoint,{cache:"no-store",mode:"cors",signal:controller.signal});
   if(!response.ok)continue;
   const data=await response.json(),after=performance.now(),rttMs=after-before;
   if(data.timeZone!=="UTC"||!Number.isInteger(data.year)||!Number.isInteger(data.month)||!Number.isInteger(data.day)||!Number.isInteger(data.hour)||!Number.isInteger(data.minute)||!Number.isInteger(data.seconds)||!Number.isInteger(data.milliSeconds)||rttMs>3000)continue;
   const utcMs=Date.UTC(data.year,data.month-1,data.day,data.hour,data.minute,data.seconds,data.milliSeconds);
   if(!Number.isFinite(utcMs))continue;
   const anchor={utcOffsetMs:utcMs-(before+after)/2,sampledAtMs:after,rttMs,uncertaintyMs:Math.ceil(rttMs/2+50),source:"timeapi.io"};
   if(!best||anchor.rttMs<best.rttMs)best=anchor;
  }catch{}finally{clearTimeout(timeout)}
 }
 return best;
}
window.BuergeramtClock={sample,utcAt,monoAt,usable};
})();
