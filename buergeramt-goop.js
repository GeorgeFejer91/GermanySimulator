// Single authority for liquidation and time dilation. Age is visible, unscaled
// time inside the real doorway; simulation/audio never drive this clock.
(function(root){
 'use strict';
 const delay=90,duration=480,minSpeed=.65,waveAmplitude=.18,waveCycles=3;
 function goop(age){const p=Math.min(1,Math.max(0,((Number.isFinite(age)?age:0)-delay)/duration));if(p===0||p===1)return p;return p+waveAmplitude*Math.sin(Math.PI*p)*Math.sin(2*Math.PI*waveCycles*p);}
 function speed(age){return 1-(1-minSpeed)*goop(age);}
 // Exact integral of the downward trend and its three slow surges. Scene time
 // always runs forward, including the temporary speed recoveries.
 function motion(age){const t=Math.max(0,Number.isFinite(age)?age:0);if(t<=delay)return t;const active=t-delay,p=Math.min(1,active/duration),lo=Math.PI*(2*waveCycles-1),hi=Math.PI*(2*waveCycles+1);
  const area=p*p*.5+waveAmplitude*.5*(Math.sin(lo*p)/lo-Math.sin(hi*p)/hi);
  return delay+duration*(p-(1-minSpeed)*area)+Math.max(0,active-duration)*minSpeed;}
 // The wave has multiple roots. Recovery needs any matching melt amount,
 // never a unique chronological inverse; all visible consumers use that amount.
 function ageForMelt(value){const amount=Math.min(1,Math.max(0,Number.isFinite(value)?value:0));if(amount===0)return 0;if(amount===1)return delay+duration;let lo=delay,hi=delay+duration;for(let i=0;i<48;i++){const mid=(lo+hi)*.5;if(goop(mid)<amount)lo=mid;else hi=mid;}return(lo+hi)*.5;}
 root.BuergeramtGoop=Object.freeze({delay,duration,minSpeed,waveAmplitude,waveCycles,goop,speed,motion,ageForMelt});
})(typeof window==='undefined'?globalThis:window);
