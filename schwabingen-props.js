const CUES={
  'schwabingen-broom-rota':'rota',
  'schwabingen-street-extra':'rota',
  'schwabingen-weeds-law':'bottle',
  'schwabingen-weeds-method':'scraper',
  'schwabingen-hedge-season':'blackbird',
  'schwabingen-hedge-release':'blackbird',
  'schwabingen-attendance-leaf':'leaf',
  'schwabingen-attendance-initials':'rota',
  'schwabingen-wild-scraper':'scraper',
  'schwabingen-bird-listen':'blackbird',
  'schwabingen-bird-calendar-note':'calendar'
};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};

export function schwabingenPropCue(actor,dialogue){
  if(actor.jwdRole!=='swabian'||!dialogue?.active||dialogue.id!==actor.id)return null;
  const kind=CUES[dialogue.cueId];
  return kind?{kind,held:!['blackbird','leaf'].includes(kind)}:null;
}

export function schwabingenHand(frame){
  const p=frame/23;
  const amount=p<.13?-.02*Math.sin(Math.PI*p/.13):p<.42?smooth((p-.13)/.29):p<.68?1:1-smooth((p-.68)/.32);
  const angle=amount*64*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle);
  // Registered right hand and shoulder of the unchanged 128×192 source arc.
  return {x:104+co*8-si*22,y:91+si*8+co*22};
}

export function schwabingenPropFrame(actor,state,dialogue,reducedMotion=false,running=true){
  const cue=schwabingenPropCue(actor,dialogue);
  if(!cue){state.pose=null;state.key=null;return null}
  const key=dialogue.cueId+':'+dialogue.cueToken;
  if(state.key===key&&(dialogue.paused||!running)&&state.pose)return state.pose;
  state.key=key;
  const time=dialogue.awaitingSpeech?0:Math.max(0,dialogue.speaking||dialogue.lineComplete&&dialogue.mediaDuration>0?dialogue.mediaTime:dialogue.captionTime||0);
  const frame=reducedMotion?12:Math.min(12,Math.floor(time/.65*12));
  return state.pose={...cue,time,visible:!dialogue.awaitingSpeech&&(!cue.held||time>.08),row:cue.held?9:null,frame,
    flight:reducedMotion?1:smooth(time/2.1),flap:reducedMotion?0:Math.sin(time*26),target:dialogue.cueTarget||null};
}

export function createSchwabingenProps(T,actor,host,camera){
  let root=null,held=null,wings=[],nest=null,current=null,displayHand=null,retired=false;
  const objects=new Map(),geometries=new Set(),materials=new Set();
  const material=color=>{const m=new T.MeshStandardMaterial({color,roughness:.92});materials.add(m);return m};
  function mesh(parent,geometry,mat,position=[0,0,0],scale=[1,1,1]){
    geometries.add(geometry);const m=new T.Mesh(geometry,mat);m.position.set(...position);m.scale.set(...scale);parent.add(m);return m;
  }
  function make(kind){
    const g=new T.Group();g.name='Schwabingen '+kind;
    const cream=material(0xe8dfba),green=material(0x5b7750),dark=material(0x38342d);
    if(kind==='bottle'){
      mesh(g,new T.CylinderGeometry(.055,.07,.21,10),material(0xb8bd6e),[0,.105,0]);
      mesh(g,new T.CylinderGeometry(.027,.027,.05,8),material(0xa43b26),[0,.235,0]);
      mesh(g,new T.BoxGeometry(.092,.095,.009),cream,[0,.12,.065]);
      const label=mesh(g,new T.SphereGeometry(1,8,5),green,[0,.12,.074],[.018,.034,.006]);label.rotation.z=-.45;
    }else if(kind==='scraper'){
      mesh(g,new T.CylinderGeometry(.022,.025,.17,8),material(0x9b6339),[0,.07,0]);
      mesh(g,new T.BoxGeometry(.014,.14,.018),material(0x929796),[0,.22,0]);
      mesh(g,new T.BoxGeometry(.075,.018,.018),dark,[.03,.285,0]);
    }else if(kind==='rota'||kind==='calendar'){
      mesh(g,new T.BoxGeometry(.28,.32,.016),material(0x79756a),[0,.13,0]);
      mesh(g,new T.BoxGeometry(.255,.29,.006),cream,[0,.13,.013]);
      mesh(g,new T.BoxGeometry(.255,.045,.008),kind==='rota'?green:material(0x9e4638),[0,.253,.02]);
      for(let y=0;y<3;y++)for(let x=0;x<3;x++)mesh(g,new T.BoxGeometry(.049,.029,.004),x===y?green:material(0xb8b1a0),[-.077+x*.077,.18-y*.064,.02]);
    }else if(kind==='leaf'){
      mesh(g,new T.SphereGeometry(1,8,5),material(0xa37c31),[0,0,0],[.09,.015,.045]);
      mesh(g,new T.CylinderGeometry(.004,.004,.09,5),dark,[.06,0,0]).rotation.z=Math.PI/2;
    }else if(kind==='blackbird'){
      const black=material(0x202322),gold=material(0xe0a027);
      mesh(g,new T.SphereGeometry(1,12,8),black,[0,.07,0],[.17,.105,.09]);
      mesh(g,new T.SphereGeometry(.072,10,7),black,[.13,.17,0]);
      mesh(g,new T.ConeGeometry(.027,.1,8),gold,[.23,.165,0]).rotation.z=-Math.PI/2;
      mesh(g,new T.SphereGeometry(.012,8,5),gold,[.16,.19,.06]);
      mesh(g,new T.SphereGeometry(.006,6,4),dark,[.163,.19,.07]);
      mesh(g,new T.BoxGeometry(.17,.027,.075),black,[-.18,.065,0]).rotation.z=-.22;
      wings=[-1,1].map(side=>{const pivot=new T.Group();pivot.position.set(-.02,.1,side*.035);g.add(pivot);mesh(pivot,new T.SphereGeometry(1,8,5),black,[-.025,0,side*.105],[.11,.025,.16]);pivot.userData.side=side;return pivot});
      for(const z of [-.035,.035])mesh(g,new T.CylinderGeometry(.006,.006,.07,5),dark,[.04,-.035,z]);
    }
    objects.set(kind,g);return g;
  }
  function ensure(){
    if(root)return;
    root=new T.Group();root.name='Schwabingen dialogue props';root.userData.dialogueDecoration=true;host.add(root);
    held=new T.Group();root.add(held);
  }
  return {
    sync(pose,paintReady){
      if(retired)return;
      current=pose?.visible?pose:null;
      if(!current){if(root)root.visible=false;return}
      ensure();root.visible=true;
      for(const g of objects.values())g.visible=false;
      held.visible=false;if(nest)nest.visible=false;
      const object=objects.get(current.kind)||make(current.kind);object.visible=true;
      root.quaternion.copy(host.quaternion).invert();
      if(current.held){
        held.visible=true;held.quaternion.copy(camera.quaternion);
        if(object.parent!==held)held.add(object);
        const hand=schwabingenHand(paintReady?current.frame:0),unit=1.6/170;
        displayHand=hand;
        const fallback=!paintReady&&host.userData.personFallback;
        if(fallback){
          const {width,height}=fallback.geometry.parameters;
          displayHand={x:79,y:137,source:'procedural'};
          object.position.set((79/96-.5)*width,(184-137)/192*height,.025);
        }else object.position.set((hand.x-64)*unit,(180-hand.y)*unit,.025);
        object.scale.setScalar(current.kind==='scraper'?.9:1);
      }else if(current.kind==='blackbird'){
        if(object.parent!==root)root.add(object);
        const target=current.target||{x:910,y:4700},tx=(target.x-actor.x)*.02,tz=(target.y-actor.y)*.02;
        const perch=(Number.isFinite(target.height)?target.height:.76)+.09;
        const f=current.flight;
        object.position.set(tx-2.8*(1-f),perch+Math.sin(f*Math.PI)*.8,tz+.18+1.3*(1-f));
        object.rotation.y=f<1?-.25:0;
        for(const wing of wings)wing.rotation.x=wing.userData.side*(f<1?current.flap*.8:.1);
        if(!nest){nest=new T.Group();nest.name='Blackbird nest';root.add(nest);const twig=material(0x796043);mesh(nest,new T.TorusGeometry(.13,.035,5,12),twig).rotation.x=Math.PI/2;for(const x of [-.045,.045])mesh(nest,new T.SphereGeometry(.037,8,6),material(0xa9b8aa),[x,0,0],[1,1.2,.8])}
        nest.visible=true;nest.position.set(tx,perch-.08,tz+.18);
      }else{
        if(object.parent!==root)root.add(object);
        const f=current.flight;object.position.set(.7-Math.sin(f*Math.PI)*.25,1.6-f*1.4,.25);object.rotation.set(f*.5,0,f*2);
      }
      root.updateMatrixWorld(true);
    },
    inspect(){return {kind:current?.kind||null,visible:!!root?.visible,held:!!current?.held,time:current?.time||0,flight:current?.flight??null,hand:current?.held?displayHand:null,meshes:root?geometries.size:0,materials:materials.size,retired}},
    dispose(){if(retired)return;retired=true;current=null;for(const g of geometries)g.dispose();for(const m of materials)m.dispose();if(root)host.remove(root);root=null;objects.clear();geometries.clear();materials.clear();nest=held=null;wings=[]}
  };
}
