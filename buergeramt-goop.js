// Single authority for liquidation and time dilation. Age is visible, unscaled
// time inside the real doorway; simulation/audio never drive this clock.
(function(root){
 'use strict';
 const duration=600,minSpeed=.5,steepness=8;
 const start=1/(1+Math.exp(steepness/2)),span=1-2*start;
 function goop(age){const p=Math.min(1,Math.max(0,(Number.isFinite(age)?age:0)/duration));if(p===0||p===1)return p;return(1/(1+Math.exp(-steepness*(p-.5)))-start)/span;}
 function speed(age){return 1-(1-minSpeed)*goop(age);}
 // Exact logistic antiderivative: raw residence owns the ramp even as the
 // scene slows. Clamp before exp/log1p, so arbitrary long visits cannot overflow.
 function motion(age){const t=Math.max(0,Number.isFinite(age)?age:0),p=Math.min(1,t/duration),area=(Math.log1p(Math.exp(steepness*(p-.5)))-Math.log1p(Math.exp(-steepness/2)))/steepness;
  return duration*(p-(1-minSpeed)*(area-start*p)/span)+Math.max(0,t-duration)*minSpeed;}
 root.BuergeramtGoop=Object.freeze({duration,minSpeed,steepness,goop,speed,motion});
})(typeof window==='undefined'?globalThis:window);
