// Shared authored garden parcels: simulation and diagnostic use identical ground data.
(()=>{
 const offset=560,point=p=>({...p,x:p.x+offset,y:p.y+offset});
 const paths=[{x:40,y:3580,w:1010,h:130},{x:40,y:3580,w:60,h:650},{x:40,y:3936,w:1010,h:84},...[220,530,840].map(x=>({x:x-38,y:3880,w:76,h:350})),{x:978,y:3936,w:72,h:294},{x:202,y:4112,w:134,h:56}].map(point);
 const lots=[{id:'fink',x:100,y:3896,w:280,h:330,kept:true},{id:'home',x:395,y:3896,w:300,h:330,kept:false},{id:'kranz',x:706,y:3896,w:270,h:330,kept:true}].map(p=>({...point(p),privateGarden:true}));
 const props=[];
 const solid=(id,asset,x,y,w,d,h,extra={})=>{const p=point({id,asset,x,y,w,d,h,interactive:asset==='jwd-car',...extra});p.collisionRect={x:p.x-w/2,y:p.y-d/2,w,h:d};p.collisionRadius=Math.hypot(w,d)/2;props.push(p)};
 solid('jwd-vw','jwd-car',145,4120,96,210,78,{style:'vw',owner:'FRAU FINK',label:'FINKS SUV · FRISCH GEWASCHEN'});
 solid('jwd-bmw','jwd-car',755,4120,96,210,65,{style:'bmw',owner:'HEIKO KRANZ',label:'HEIKOS DIENSTWAGEN · NICHT BERÜHREN'});
 solid('jwd-tesla','jwd-car',922,4120,96,210,68,{style:'tesla',owner:'DR. KRANZ',label:'ELEKTROAUTO · MORALISCHE VORFAHRT'});
 solid('jwd-fink-hedge','jwd-hedge',350,4140,18,156,38,{kept:true});
 solid('jwd-home-hedge-west','jwd-hedge',409,4140,23,150,58,{kept:false});
 solid('jwd-home-hedge-east','jwd-hedge',668,4140,23,150,65,{kept:false});
 solid('jwd-kranz-topiary','jwd-hedge',733,3910,28,24,49,{kept:true,round:true});
 solid('jwd-fink-gnome','jwd-gnome',312,4105,27,25,47,{kept:true});
 solid('jwd-kranz-gnome','jwd-gnome',890,3908,25,23,43,{kept:true});
 solid('jwd-home-gnome','jwd-gnome',597,4187,34,25,16,{kept:false});
 const stations={
  'jwd-swabian':point({x:220,y:4110,activity:'wash',target:'jwd-vw',alternate:'jwd-fink-hedge',trimX:316,trimY:4140}),
  'jwd-parent':point({x:840,y:4130,activity:'wash',target:'jwd-bmw'}),
  'jwd-watcher':point({x:1007,y:4100,activity:'wash',target:'jwd-tesla'})
 };
 stations['jwd-swabian'].trimX+=offset;stations['jwd-swabian'].trimY+=offset;
 window.JwdGardens=Object.freeze({paths,lots,props,stations,crossY:3980+offset,gate:point({x:530,y:3990}),gateAside:point({x:615,y:3980}),corridor:point({x:40,y:3890,w:1010,h:340})});
})();
