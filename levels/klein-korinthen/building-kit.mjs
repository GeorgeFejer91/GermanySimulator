// Renderer-independent metre-scale kit. The host owns geometry, collisions and disposal.
export const BUILDING_STYLE=Object.freeze({id:'grand-theft-amt-brandenburg-v1',metresPerUnit:1,plaster:Object.freeze([0xc6b694,0xe0c9a6,0xb5b6a1,0xc0a38c,0xd3c3a7,0xb4bbad]),paper:0xe8dcc1,ink:0x34483d,burgundy:0x79463c,brass:0xc7a15c});
export const LANDMARKS=Object.freeze([
  {id:'aktenkathedrale',x:-22,z:-8,base:7.9,top:22.5,visualFootprint:[11.5,9.6],host:'house'},
  {id:'eichkathedrale',x:25,z:-38,base:3.925,top:17.25,visualFootprint:[3.2,2],host:'garage'},
  {id:'normtor',x:0,z:-30,clearance:5.54,width:14.2}
]);
export function emitHouse({box,shape,solid,pole},{x=0,z=0,index:i=0,face=1,outer=false,style=BUILDING_STYLE}={}){
    const w=i%3===0?10:9,d=9,h=i%4===0?5.8:4.5;
    box(x,h/2,z,w,h,d,style.plaster[i%style.plaster.length]);solid(x,z,w+.2,d+.2,'house');
    box(x,.25,z,w+.2,.5,d+.2,0x7d7667);
    shape('cone',x,h+1.3,z,w+1,2.9,d+1,i%2?0x6a6459:0x956b4c,0,Math.PI/4);
    box(x+1.7,h+2.25,z-1,1,2.2,.85,0x746050);
    const front=x+face*(w/2+.03);
    box(front,1.25,z,.16,2.5,1.2,0x475a4e);
    solid(front,z,.16,1.2,'house-door');
    for(const dz of [-2.7,2.7])for(const yy of [1.8,...(h>5?[4.3]:[])]){
      box(front,yy,z+dz,.12,1.3,1.3,0x435659);box(front+face*.08,yy,z+dz,.06,1.35,.06,0xe4d4b4);box(front+face*.08,yy,z+dz,.06,.06,1.36,0xe4d4b4);
      for(const side of [-1,1])box(front+face*.1,yy,z+dz+side*.93,.08,1.4,.38,0x5f7160);
      if(yy<3)solid(front+face*.04,z+dz,.2,2.24,'window');
      box(front+face*.3,yy-.85,z+dz,.6,.23,1.5,0x674938);
      if(yy<3)solid(front+face*.3,z+dz,.6,1.5,'window-planter');
      for(let k=-1;k<=1;k++)shape('ball',front+face*.3,yy-.66,z+dz+k*.43,.35,.3,.34,k%2?0x8e5648:0xc4ab61);
    }
    // A paved gate path, two hedge sections, and a mailbox leave body-clear access.
    box(front+face*2,.03,z,4,.06,1.7,0xab9f84);
    const hedgeOffset=outer?1.1:3.7;
    for(const dz of [-3.1,3.1]){box(front+face*hedgeOffset,.65,z+dz,.65,1.3,4.2,0x4d6449);solid(front+face*hedgeOffset,z+dz,.65,4.2,'hedge');}
    box(front+face*(hedgeOffset-.2),1.0,z+1.4,.4,.45,.4,0x5e6257);pole(front+face*(hedgeOffset-.2),z+1.4,.8);
    solid(front+face*(hedgeOffset-.2),z+1.4,.4,.4,'mailbox');
    // Rain barrel and terracotta planter.
    shape('cylinder',x-face*(w/2+.65),.55,z+3,1.1,1.1,1.1,0x4e645a);solid(x-face*(w/2+.65),z+3,1.1,1.1,'barrel');
  }
export function emitServiceStation({box,shape,solid,sign},station){
  const {x,z,support:y,id}=station;
  box(x,y+.09,z,1.3,.18,1.1,BUILDING_STYLE.ink);
  box(x,y+.88,z,1.06,1.6,.72,BUILDING_STYLE.burgundy);
  box(x,y+1.2,z+.375,.8,.58,.045,BUILDING_STYLE.paper);
  box(x,y+.66,z+.4,.66,.09,.1,0x202d29);
  box(x,y+1.77,z,1.22,.16,.98,BUILDING_STYLE.brass);
  solid(x,z,1.3,1.1,'station:'+id);
  sign(x,z+.65,station.sign,id+' · '+station.subtitle,0,2.4);
  // Monumental stamp handle: decorative above the body-clear area, fixed footprint.
  shape('cylinder',x,y+2.12,z,.28,.56,.28,BUILDING_STYLE.ink);
  shape('ball',x,y+2.48,z,.65,.4,.42,BUILDING_STYLE.burgundy);
}
export function emitBureaucraticLandmarks({box,shape,solid,sign}){
  const {paper,ink,burgundy,brass}=BUILDING_STYLE;
  // The existing residential parcel carries the archive; all overhang is overhead.
  for(let floor=0;floor<6;floor++){
    const y=8+floor*1.9,offset=floor%2?.45:-.45;
    box(-22+offset,y,-8,10.4,.20,9.6,burgundy);
    box(-22+offset,y+1.74,-8,10,.20,9.4,burgundy);
    box(-22+offset,y+.87,-8,9.8,1.55,9,paper);
    box(-16.86+offset,y+.87,-8,.23,1.94,9.6,ink);
    for(const dz of [-2.8,2.8]){shape('cylinder',-16.71+offset,y+.87,-8+dz,.28,.09,.28,brass,0,0,Math.PI/2);}
    for(let k=0;k<10;k++)box(-22+offset,y+.18+k*.15,-3.48,9.7,.013,.025,0xb3a68e);
  }
  box(-22,19.6,-8,6,.6,5,paper);box(-22,20,-8,6,.25,5,ink);box(-22,20.9,-8,1,1.6,1,burgundy);shape('ball',-22,22,-8,3,1,2,burgundy);
  sign(-16,-13,'ZENTRALARCHIV','Nicht zuständig. Aber für immer.',Math.PI/2,3.5);
  // Garage becomes a cathedral to calibrated length, with a twelve-metre ruler spire.
  box(25,10,-38,1,12,.7,brass);box(25,4,-38,3,.15,2,paper);
  for(let k=0;k<24;k++)box(25+(k%2?.16:0),4.2+k*.46,-37.63,k%2?.65:.98,.05,.035,ink);
  box(25,16.2,-38,3.2,.24,.5,ink);box(25,16.4,-38,.25,1.7,.5,ink);
  // A triumphal arch for the centimetre. The pedestrian openings remain >2m wide.
  for(const side of [-1,1]){
    box(side*6.8,2.8,-30,.48,5.6,.48,brass);solid(side*6.8,-30,.48,.48,'norm-gate');
    box(side*6.8,.16,-30,.7,.32,.7,ink);solid(side*6.8,-30,.7,.7,'norm-gate-base');
  }
  box(0,6,-30,14.2,.8,.6,brass);
  for(let i=-13;i<=13;i++)box(i*.5,5.8+(i%2?.1:0),-29.68,.04,i%2?.3:.52,.025,ink);
  // Filing-cabinet monument in the clubhouse court: the big stamp is scenery, not a gate.
  box(-29,1.2,37,1.4,2.04,1.15,ink);solid(-29,37,1.4,1.15,'cabinet');
  for(let i=0;i<4;i++){box(-29,.48+i*.47,37.6,1.2,.4,.07,paper);box(-29,.48+i*.47,37.66,.38,.06,.06,brass)}
  solid(-29,37.63,1.2,.12,'cabinet-drawers');
  shape('cylinder',-29,3.25,37,.65,2.1,.65,burgundy);box(-29,4.42,37,2,.4,1,burgundy);
  // Gnomes become tiny inspectors; the plinths are the full blocking footprints.
  for(let i=0;i<4;i++){
    const x=-28.8+i*1.25,z=25.3;box(x,.32,z,.7,.28,.7,ink);solid(x,z,.7,.7,'gnome-plinth');
    shape('ball',x,.7,z,.4,.55,.35,0x6a7252);shape('ball',x,1,z,.27,.27,.27,0xc6a580);shape('cone',x,1.28,z,.34,.47,.34,burgundy);
    box(x+.23,.79,z+.12,.18,.25,.04,paper);
  }
}
