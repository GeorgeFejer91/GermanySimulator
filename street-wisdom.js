/* Dedicated street advisers. game.js owns encounters; the existing city gait owns motion. */
(()=>{
  const definitions=Object.freeze([
    {id:"street-waltraud-wartemarke",voiceId:"crowd-waltraud-wartemarke",fullName:"Waltraud Wartemarke",displayName:"WALTRAUD WARTEMARKE",role:"waiting-line oracle",style:"plum coat, silver bun, tabbed folder",ruleIndices:[0,3,6,9]},
    {id:"street-horst-hausordnung",voiceId:"crowd-horst-hausordnung",fullName:"Horst Hausordnung",displayName:"HORST HAUSORDNUNG",role:"house-order know-it-all",style:"rust waistcoat, grey side hair, clipboard and keys",ruleIndices:[1,4,7,10]},
    {id:"street-dietmar-din-norm",voiceId:"crowd-dietmar-din-norm",fullName:"Dietmar DIN-Norm",displayName:"DIETMAR DIN-NORM",role:"retired DIN inspector",style:"sage jacket, flat cap, yellow ruler and briefcase",ruleIndices:[2,5,8]}
  ].map(d=>Object.freeze({...d,ruleIndices:Object.freeze(d.ruleIndices)})));
  const palettes=new WeakMap();
  function palette(T){
    if(!palettes.has(T))palettes.set(T,Object.fromEntries(Object.entries({skin:0xcabca8,ink:0x333432,metal:0x777f7b,paper:0xe1d9c7,hair:0xb4b1a7,plum:0x746079,rust:0x895b4e,sage:0x637467,folder:0x9c4541,ruler:0xc2ad58}).map(([key,color])=>[key,new T.MeshStandardMaterial({color,roughness:.94})])));
    return palettes.get(T);
  }
  function createCharacter(T,definition,shared={}){
    const d=definitions.find(item=>item.id===definition?.id);
    if(!d)throw new RangeError("Unknown street adviser");
    const p=palette(T),skin=shared.skin||p.skin,ink=shared.dark||p.ink,metal=shared.metal||p.metal;
    const coat=d===definitions[0]?p.plum:d===definitions[1]?p.rust:p.sage,g=new T.Group();
    g.name=d.fullName;
    const mesh=(geometry,material,x,y,z,parent=g)=>{const q=new T.Mesh(geometry,material);q.position.set(x,y,z);parent.add(q);return q};
    const box=(w,h,zSize,material,x,y,z,parent=g)=>mesh(new T.BoxGeometry(w,h,zSize),material,x,y,z,parent);
    const sphere=(radius,material,x,y,z)=>mesh(new T.SphereGeometry(radius,10,7),material,x,y,z);
    box(.34,.68,.25,coat,0,.84,0);box(.35,.045,.26,ink,0,.56,0);
    sphere(.19,skin,0,1.30,0);
    box(.045,.065,.055,skin,0,1.29,.185);
    for(const x of [-.075,.075])box(.095,.025,.018,ink,x,1.335,.177);
    box(.055,.009,.016,ink,0,1.335,.177);
    box(.065,.009,.018,ink,0,1.235,.177);
    const limbs={};
    for(const [key,x,y,length,radius] of [["ll",-.085,.27,.46,.052],["rl",.085,.27,.46,.052],["la",-.188,.80,.40,.041],["ra",.188,.80,.40,.041]]){
      const limb=new T.Group();limb.position.set(x,y,0);g.add(limb);limbs[key]=limb;
      mesh(new T.CylinderGeometry(radius,radius,length,8),key.endsWith("l")?ink:coat,0,0,0,limb);
      if(key.endsWith("l"))box(.10,.06,.10,ink,0,-.23,.01,limb);
      else box(.07,.08,.065,skin,0,-.22,.014,limb);
    }
    if(d===definitions[0]){
      const cap=mesh(new T.SphereGeometry(.197,10,7,0,Math.PI*2,0,Math.PI*.54),p.hair,0,1.30,0);
      cap.name="Silver hair";sphere(.065,p.hair,0,1.43,-.135);
      box(.34,.32,.26,coat,0,.48,0);
      box(.21,.26,.055,p.folder,0,.83,.146);
      box(.19,.014,.055,p.paper,0,.946,.148);
      for(const x of [-.06,0,.06])box(.034,.024,.02,p.ruler,x,.963,.156);
    }else if(d===definitions[1]){
      for(const x of [-.165,.165])box(.045,.13,.13,p.hair,x,1.325,-.035);
      box(.12,.025,.018,p.hair,0,1.255,.187);
      box(.065,.40,.016,p.paper,0,.86,.133);
      box(.19,.27,.035,p.folder,.035,.82,.146);
      box(.07,.022,.024,metal,.035,.96,.161);
      const ring=mesh(new T.TorusGeometry(.037,.008,5,10),metal,-.153,.69,.116);ring.name="House keys";
      for(const x of [-.17,-.14]){box(.014,.07,.018,metal,x,.634,.12);box(.032,.014,.018,metal,x+.008,.602,.12)}
    }else{
      mesh(new T.CylinderGeometry(.185,.195,.075,10),p.sage,0,1.475,0);
      box(.29,.022,.23,ink,0,1.444,.017);
      box(.035,.36,.015,p.ruler,0,.94,.134);
      box(.18,.20,.07,p.folder,-.062,.50,.115);
      box(.08,.018,.055,ink,-.062,.615,.115);
      box(.022,.55,.035,p.ruler,.19,.81,.04);
      for(let i=0;i<7;i++)box(.025,.008,.01,ink,.19,.58+i*.064,.061);
    }
    // S=.02: the complete silhouette, including gait and props, fits the existing 13-unit NPC radius.
    g.userData={...limbs,streetWisdom:true,wisdomId:d.id,voiceId:d.voiceId};
    return g;
  }
  // now and wisdomSpokeAt use the caller's clock in seconds (performance.now()/1000 in the city).
  // Caller marks wisdomSpokeAt only when the broker accepts speech.
  function nearbySpeaker(actors,player,now,radius=180,cooldown=24){
    if(!Number.isFinite(now)||!Number.isFinite(player?.x)||!Number.isFinite(player?.y)||!Number.isFinite(radius)||radius<0)return null;
    let nearest=null,best=radius*radius,rank=definitions.length;
    for(const actor of actors){
      const order=definitions.findIndex(d=>d.id===actor.wisdomId&&d.voiceId===actor.voiceId);
      if(order<0||actor.removed||actor.jailed||actor.arrested||actor.retired||!Number.isFinite(actor.x)||!Number.isFinite(actor.y)||now-(actor.wisdomSpokeAt??-Infinity)<cooldown)continue;
      const distance=(actor.x-player.x)**2+(actor.y-player.y)**2;
      if(distance<best||(distance===best&&order<rank)){nearest=actor;best=distance;rank=order}
    }
    return nearest;
  }
  window.StreetWisdom=Object.freeze({definitions,createCharacter,nearbySpeaker});
})();
