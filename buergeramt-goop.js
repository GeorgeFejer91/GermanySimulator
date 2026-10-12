// Single authority for liquidation and time dilation. Age is visible, unscaled
// time inside the real doorway; simulation/audio never drive this clock.
(function(root){
 'use strict';
 const duration=780,minSpeed=.65,steepness=12,center=.82;
 const start=1/(1+Math.exp(steepness*center)),span=1/(1+Math.exp(-steepness*(1-center)))-start;
 function goop(age){const p=Math.min(1,Math.max(0,(Number.isFinite(age)?age:0)/duration));if(p===0||p===1)return p;return(1/(1+Math.exp(-steepness*(p-center)))-start)/span;}
 function speed(age){return 1-(1-minSpeed)*goop(age);}
 // Exact logistic antiderivative: raw residence owns the ramp even as the
 // scene slows. Clamp before exp/log1p, so arbitrary long visits cannot overflow.
 function motion(age){const t=Math.max(0,Number.isFinite(age)?age:0),p=Math.min(1,t/duration),area=(Math.log1p(Math.exp(steepness*(p-center)))-Math.log1p(Math.exp(-steepness*center)))/steepness;
  return duration*(p-(1-minSpeed)*(area-start*p)/span)+Math.max(0,t-duration)*minSpeed;}
 function ageForMelt(value){const amount=Math.min(1,Math.max(0,Number.isFinite(value)?value:0));if(amount===0)return 0;if(amount===1)return duration;const sigmoid=start+span*amount;return duration*(center+Math.log(sigmoid/(1-sigmoid))/steepness);}
 root.BuergeramtGoop=Object.freeze({duration,minSpeed,steepness,center,goop,speed,motion,ageForMelt});
})(typeof window==='undefined'?globalThis:window);
