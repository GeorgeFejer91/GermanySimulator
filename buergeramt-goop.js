// Single authority for liquidation and time dilation. Age is visible, unscaled
// time inside the real doorway; simulation/audio never drive this clock.
(function(root){
 'use strict';
 function goop(age){const p=Math.min(1,Math.max(0,(Number.isFinite(age)?age:0)/210));return p*p*(3-2*p);}
 function speed(age){return 1-.6*goop(age);}
 function motion(age){const t=Math.max(0,Number.isFinite(age)?age:0),p=Math.min(1,t/210);return 210*(p-.6*(p*p*p-.5*p*p*p*p))+Math.max(0,t-210)*.4;}
 root.BuergeramtGoop=Object.freeze({goop,speed,motion});
})(typeof window==='undefined'?globalThis:window);
