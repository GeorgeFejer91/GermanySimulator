import {studyToSite} from './calibration.mjs';

const registeredSite=p=>{const q=studyToSite({x:p[0],y:p[1],z:p[2]});return[q.x,q.y,q.z];};
const bounds=(points,i)=>[Math.min(...points.map(p=>p[i])),Math.max(...points.map(p=>p[i]))];

// G30/31 and P08–10 show the long stair enclosure projecting out from the
// side wall, nearer the entrance. Retain its estimated construction frame,
// but register it perpendicular to the facade. The selected front-side bay
// and elevations are still estimates, not recovered survey coordinates.
export const smokingToAuthor=([x,y,z])=>[43.6+z,y,32-x];

export function addArchitecturalCirculation(layout){
  let smokingFrame=false;
  const site=p=>registeredSite(smokingFrame?smokingToAuthor(p):p);
  const retired=p=>p.name==='main stair'||p.name==='main stair tread'||p.name==='main stair landing'||
    ['main-stair-left','main-stair-right','foyer-gallery-east'].includes(p.balustrade);
  layout.parts=layout.parts.filter(p=>!retired(p));
  layout.solids=layout.solids.filter(p=>!retired(p));
  layout.floors=layout.floors.filter(p=>!retired(p));
  layout.balustrades=layout.balustrades.filter(p=>!['main-stair-left','main-stair-right','foyer-gallery-east'].includes(p.id));
  const data=layout.architecturalCirculation={sources:['A01','I23'],
    gallery:['07','08','20','21','25','27','28','29','30','31','32','33','34'],
    confidence:'Photographed architectural forms and relative connections; registered coordinates, elevations and counts estimated',
    mainStair:{floorHeights:[.05,2.75,5.45],routes:[],gallery:['07','08','20','21','25']},
    fixtures:[],stairs:[]};
  // U02 and the public admission/wardrobe sequence require a foyer connection.
  // This is an inferred doorway in the provisional glass run, not an opening
  // into Lab (which ends north of author z9.4) or any private room.
  const glass=layout.parts.find(p=>p.name==='Säule glass partition left'&&
    Math.abs(p.center[2]-site([-4,2.6,10.6])[2])<.1);
  if(!glass)throw new Error('Public wardrobe glass run missing');
  const m=glass.matrix,axis=[m[8],m[9],m[10]],length2=axis.reduce((n,v)=>n+v*v,0);
  const fraction=z=>site([-4,2.6,z]).reduce((n,v,i)=>n+(v-m[12+i])*axis[i],0)/length2;
  const za=fraction(13.5),zb=fraction(15.3),headerY=(2.45-m[13])/m[5];
  const glassSlices=[];
  for(const [name,z0,z1,y0,y1] of [['north leaf',-.5,za,-.5,.5],['south leaf',zb,.5,-.5,.5],['header',za,zb,headerY,.5]]){
    const matrix=[...m],zc=(z0+z1)/2,yc=(y0+y1)/2;
    for(let i=0;i<3;i++){matrix[12+i]=m[12+i]+m[8+i]*zc+m[4+i]*yc;matrix[8+i]=m[8+i]*(z1-z0);matrix[4+i]=m[4+i]*(y1-y0);}
    const p={...glass,name:'Public wardrobe glass '+name,matrix,center:matrix.slice(12,15),
      size:[0,4,8].map(i=>Math.hypot(...matrix.slice(i,i+3))),circulationDoorway:true};
    glassSlices.push(p);
  }
  layout.parts=layout.parts.flatMap(p=>p===glass?glassSlices:[p]);
  layout.solids=layout.solids.flatMap(s=>s.renderPart===glass?glassSlices.map(p=>{
    const m=p.matrix,c=p.center,polygon=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>
      [c[0]+m[0]*x+m[8]*z,c[2]+m[2]*x+m[10]*z]);
    return {...s,name:p.name,renderPart:p,polygon,x:bounds(polygon,0),z:bounds(polygon,1),
      y:[c[1]-p.size[1]/2,c[1]+p.size[1]/2],circulationDoorway:true};
  }):[s]);
  data.wardrobeConnection={sources:['U02'],confidence:'Public adjacency supported; doorway location and dimensions inferred in existing provisional glass partition',
    authorOpening:{x:-4,z:[13.5,15.3],y:[.05,2.45]},
    authorRoute:[[-11,.05,14.4],[0,.05,14.4],[5,.05,14.4],[5,.05,10.6],[8,.05,10.6]],
    boundary:'Public wardrobe-to-foyer only; original Lab boundary and admission geometry retained'};
  data.wardrobeConnection.siteRoute=data.wardrobeConnection.authorRoute.map(p=>{const q=site(p);return{x:q[0],y:q[1],z:q[2]};});
  const parts=[];
  function box(name,center,size,material='steel',solid=true,axes=null){
    const c=site(center),a=axes||[[size[0],0,0],[0,size[1],0],[0,0,size[2]]];
    const vectors=a.map(v=>{const q=site(center.map((n,i)=>n+v[i]));return q.map((n,i)=>n-c[i]);});
    const matrix=[...vectors[0],0,...vectors[1],0,...vectors[2],0,...c,1];
    const p={name:'Architecture '+name,section:'interior',shape:'box',material,center:c,size:vectors.map(v=>Math.hypot(...v)),matrix,instanceTone:.94,architecturalCirculation:true};
    layout.parts.push(p);parts.push(p);
    if(solid){
      const corners=[];for(const x of [-.5,.5])for(const y of [-.5,.5])for(const z of [-.5,.5])
        corners.push(c.map((n,i)=>n+vectors[0][i]*x+vectors[1][i]*y+vectors[2][i]*z));
      const polygon=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>[c[0]+vectors[0][0]*x+vectors[2][0]*z,c[2]+vectors[0][2]*x+vectors[2][2]*z]);
      layout.solids.push({name:p.name,renderPart:p,polygon,x:bounds(corners,0),y:bounds(corners,1),z:bounds(corners,2)});
    }
    return p;
  }
  function slab(name,x,z,y,material='steel'){
    const polygon=[[x[0],z[0]],[x[1],z[0]],[x[1],z[1]],[x[0],z[1]]].map(([x,z])=>{const p=site([x,y,z]);return[p[0],p[2]];});
    const f={name,polygon,x:bounds(polygon,0),z:bounds(polygon,1),y};layout.floors.push(f);
    box(name,[(x[0]+x[1])/2,y-.08,(z[0]+z[1])/2],[x[1]-x[0],.16,z[1]-z[0]],material);
    return f;
  }
  function guard(name,x0,z0,x1,z1,y,plate=true){
    const dx=x1-x0,dz=z1-z0,length=Math.hypot(dx,dz),nx=dz/length,nz=-dx/length;
    if(plate)box(name+' plate',[(x0+x1)/2,y+.53,(z0+z1)/2],[.07,1.06,length],'steel',true,
      [[nx*.07,0,nz*.07],[0,1.06,0],[dx,0,dz]]);
    for(const h of plate?[1.1]:[.1,.55,1.1])box(name+' rail',[(x0+x1)/2,y+h,(z0+z1)/2],[.05,.05,length],'steel',true,
      [[nx*.05,0,nz*.05],[0,.05,0],[dx,0,dz]]);
    const count=Math.ceil(length/1.4);for(let i=0;i<=count;i++)box(name+' post',[x0+dx*i/count,y+.55,z0+dz*i/count],[.06,1.1,.06]);
  }
  function flight(name,x,z0,z1,y0,y1,width,steps,plate=true){
    const enclosed=name.includes('smoking')&&name.includes('enclosed');
    const polygon=[[x-width/2,z0],[x+width/2,z0],[x+width/2,z1],[x-width/2,z1]].map(([a,b])=>{const p=site([a,0,b]);return[p[0],p[2]];});
    const a=site([x,y0,z0]),b=site([x,y1,z1]);
    const f={name,polygon,x:bounds(polygon,0),z:bounds(polygon,1),y:y0,endY:y1,rampAxis:[[a[0],a[2]],[b[0],b[2]]]};
    layout.floors.push(f);layout.solids.push({name,polygon,x:f.x,z:f.z,y:[Math.min(y0,y1)-.15,Math.max(y0,y1)],ramp:f});
    data.stairs.push({name,author:{x,z:[z0,z1],y:[y0,y1],width},steps,
      coordinateFrame:smokingFrame?'smoking construction frame':'building author frame'});
    for(let i=0;i<steps;i++){
      const t=(i+.5)/steps,z=z0+(z1-z0)*t,y=y0+(y1-y0)*t,depth=(z1-z0)/steps;
      box(name+' tread',[x,y-.06,z],[width,.12,depth+.012]);
      Object.assign(layout.solids.at(-1),{undersideOnly:true,treadFloor:f});
      if(name.includes('enclosed'))for(let dx=-width/2+.12;dx<width/2;dx+=.15)
        box(name+' grating inset',[x+dx,y+.003,z],[.025,.006,depth*.78],'rubber',false);
      for(const sign of [-1,1]){
        const sx=x+sign*width/2;
        const mainStringer=name==='main stair'||name==='main upper flight';
        box(name+' stringer',[sx,y-.14,z],[.09,.28,depth],'steel',mainStringer,
          [[.09,0,0],[0,.28,0],[0,(y1-y0)/steps,depth]]);
        if(mainStringer)Object.assign(layout.solids.at(-1),{undersideOnly:true,treadFloor:f});
        if(enclosed){
          // Continuous body containment is separate from the photographed
          // sparse-post/wire guard. It is not a visible plate or extra pickets.
          const corners=[[sx-.03,z-depth/2],[sx+.03,z-depth/2],[sx+.03,z+depth/2],[sx-.03,z+depth/2]]
            .map(([x,z])=>{const q=site([x,0,z]);return[q[0],q[2]];});
          const rise=Math.abs(y1-y0)/steps/2;
          layout.solids.push({name:name+' guard containment',polygon:corners,x:bounds(corners,0),z:bounds(corners,1),
            y:[y-rise-.05,y+rise+1.15],collisionPolicy:'Invisible continuous guard containment behind sparse posts and horizontal rails'});
          continue;
        }
        if(plate)box(name+' guard panel',[sx,y+.53,z],[.06,1.06,depth],'steel',true,
          [[.06,0,0],[0,1.06,0],[0,(y1-y0)/steps,depth]]);
        else box(name+' guard picket',[sx,y+.55,z],[.035,1.1,.035]);
        box(name+' sloping handrail',[sx,y+1.1,z],[.05,.05,depth],'steel',true,
          [[.05,0,0],[0,.05,0],[0,(y1-y0)/steps,depth]]);
      }
    }
    if(enclosed)for(const sign of [-1,1]){
      const sx=x+sign*width/2,postIntervals=Math.ceil(Math.abs(z1-z0)/2);
      for(let i=0;i<=postIntervals;i++){
        const t=i/postIntervals;
        box(name+' sparse guard post',[sx,y0+(y1-y0)*t+.55,z0+(z1-z0)*t],[.045,1.1,.045],'steel',true);
      }
      for(const h of [.2,.45,.7,1.1]){
        const thickness=h===1.1?.05:.018;
        box(name+(h===1.1?' continuous handrail':' continuous horizontal wire'),[sx,(y0+y1)/2+h,(z0+z1)/2],
          [thickness,thickness,z1-z0],'steel',false,
          [[thickness,0,0],[0,thickness,0],[0,y1-y0,z1-z0]]);
      }
    }
    return f;
  }

  // G20/21/23/25: the upper plate-sided flight rises toward the dance-floor
  // rim. The previous reversed rise required an unsupported long return.
  // Rebuild both flights, their turn, opening and guards together. These
  // dimensions/ground approach remain fitted estimates; no slab fills the void.
  flight('main stair',8,11.4,19.5,.05,2.75,3,16);
  slab('main intermediate landing',[6.5,13.5],[19.5,21.5],2.75);
  flight('main upper flight',12,11.4,19.5,5.45,2.75,3,16);
  slab('main upper turn',[10.5,13.5],[9.1,11.4],5.45);
  guard('main landing south',6.5,21.5,13.5,21.5,2.75);
  guard('main landing west',6.5,19.5,6.5,21.5,2.75);
  guard('main landing east',13.5,19.5,13.5,21.5,2.75);
  guard('main landing middle',9.5,19.5,10.5,19.5,2.75);
  guard('main arrival west',10.5,9.4,10.5,11.4,5.45);
  guard('main arrival east',13.5,9.4,13.5,11.4,5.45);
  guard('closed old main opening',6.4,9.4,10.5,9.4,5.45);
  guard('east gallery remainder',13.5,9.4,21.5,9.4,5.45);
  data.mainStair.routes=[[8,.05,10.6],[8,2.75,20.5],[12,2.75,20.5],[12,5.45,10.7],[12,5.45,8.5],[14,5.45,7]];
  data.mainStair.riseRelation={sources:['A01','I23'],gallery:['20','21','23','25'],
    upper:'Rises toward the dance-floor rim and DJ end of the void',
    lower:'Opposing switchback; ground approach and landing dimensions estimated',
    registration:'Hall compass/frame remains unresolved; independent of the Panorama orientation error'};
  data.mainStair.siteRoute=data.mainStair.routes.map(p=>{const q=site(p);return{x:q[0],y:q[1],z:q[2]};});
  // Table/duct/radiator adjacency is shown together with the stair in20/25.
  box('foyer standing table top',[2.5,1.05,15.5],[3.5,.18,.85],'concrete');
  for(const x of [1.05,3.95])box('foyer standing table leg',[x,.48,15.5],[.18,.96,.85],'concrete');
  box('foyer broad service duct',[2.5,5.2,16],[2.1,.4,9],'aluminium');
  for(const z of [12,14,16,18,20])box('foyer duct transverse seam',[2.5,4.99,z],[2.12,.025,.035],'steel',false);
  for(let z=11.6;z<20.5;z+=.16)box('foyer duct underside rib',[2.5,4.985,z],[2.06,.035,.025],'steel',false);
  box('foyer radiator header',[4.5,2.9,9.72],[1.1,.06,.11],'steel');
  for(let i=0;i<15;i++)box('foyer radiator fin',[4+i*.072,1.55,9.72],[.045,2.7,.14],'steel');
  data.fixtures.push({id:'lower-stair-services',gallery:['03','04','05','20','25'],placement:'Estimated adjacency to new main stair; exact service bay unmeasured'});

  // G04/07/20/25 show the gallery edge carried by rectangular piers with
  // local beam haunches, transverse soffit ribs and a pier-mounted radiator.
  // Fit these relations to the existing slab edge (author z9.4), not a newly
  // asserted survey grid. Keep the separate Säule capitals and all floor datums.
  const frameParts=[];
  const frameBox=(name,center,size,axes=null)=>{
    const p=box('foyer gallery '+name,center,size,'concrete',true,axes);
    p.foyerFrame=true;frameParts.push(p);return p;
  };
  frameBox('edge beam',[8.75,4.725,9.05],[25.5,.65,.7]);
  const pierXs=[-2.4,4.5,16.55];
  for(const x of pierXs){
    frameBox('pier',[x,2.225,9.05],[1.2,4.35,1.1]);
    for(const sign of [-1,1]){
      const p=frameBox('haunch',[x+sign*1.1,4.1,9.05],[1,.6,.7],
        [[sign,0,0],[0,.6,0],[0,0,sign*.7]]);
      // Reuse the existing tapered concrete corbel primitive. The linked
      // overhead collision envelope conservatively contains its wedge.
      p.shape='saule-corbel';
    }
  }
  for(let x=-3.2;x<21.1;x+=1.5)
    frameBox('soffit rib',[x,4.94,7.4],[.16,.22,2.6]);
  data.foyerFrame={gallery:['04','07','20','25'],sources:['A01','I23'],
    confidence:'Photographed forms and adjacency; pier count, spacing and sections estimated within the existing gallery',
    author:{slabEdge:9.4,slabUnderside:5.05,beam:{x:[-4,21.5],z:[8.7,9.4],y:[4.4,5.05]},
      pierXs,pierZ:9.05,pierSize:[1.2,4.35,1.1],pierBase:.05,haunchBottom:3.8,
      ribPitch:1.5,ribCount:17,radiatorZ:9.72},
    parts:frameParts.length,
    boundary:'Local foyer gallery only; no recovered structural plan, room datum, private door or structural adequacy claim'};

  // I03/I04 and U01/U02 identify a mezzanine, not a counter on the main floor.
  // G27–29 show a guarded drop, onward ascent and overhead crane. The datum,
  // bay, narrow lower approach and upper endpoint remain authoring estimates.
  const eisbarFloor=8.75;
  // The mezzanine intercepts the end uplight's former tall-wall aim. Keep
  // this estimated practical below the slab rather than shining through it.
  const underEisbarLight=layout.mainBar.interiorFacade.practicalLighting.lights[0];
  underEisbarLight.target[1]=8.1;underEisbarLight.intensity=80;underEisbarLight.range=4;
  const counter=(name,c,s)=>{
    box(name+' plinth',[c[0],eisbarFloor+.25,c[2]],[s[0]-.12,.5,s[2]-.12],'rubber');
    box(name+' body',c,s,'stainless');
    for(let x=c[0]-s[0]/2+.12;x<c[0]+s[0]/2;x+=.12)
      box(name+' tile vertical joint',[x,c[1],c[2]+s[2]/2+.004],[.009,s[1],.008],'steel',false);
    for(let y=c[1]-s[1]/2+.12;y<c[1]+s[1]/2;y+=.12)
      box(name+' tile horizontal joint',[c[0],y,c[2]+s[2]/2+.009],[s[0],.009,.009],'steel',false);
    box(name+' worktop',[c[0],c[1]+s[1]/2+.025,c[2]],[s[0]+.05,.05,s[2]+.05],'stainless');
    for(let x=c[0]-s[0]/2+.12;x<c[0]+s[0]/2;x+=.12)
      box(name+' top transverse joint',[x,c[1]+s[1]/2+.051,c[2]],[.009,.004,s[2]],'steel',false);
    for(let z=c[2]-s[2]/2+.12;z<c[2]+s[2]/2;z+=.12){
      box(name+' top longitudinal joint',[c[0],c[1]+s[1]/2+.051,z],[s[0],.004,.009],'steel',false);
      for(const sign of [-1,1])box(name+' return vertical joint',[c[0]+sign*(s[0]/2+.004),c[1],z],[.008,s[1],.009],'steel',false);
    }
    for(const sign of [-1,1])for(let y=c[1]-s[1]/2+.12;y<c[1]+s[1]/2;y+=.12)
      box(name+' return horizontal joint',[c[0]+sign*(s[0]/2+.004),y,c[2]],[.008,.009,s[2]],'steel',false);
  };
  counter('Eisbar front counter',[19.35,eisbarFloor+.8,-17],[3,.6,.8]);
  counter('Eisbar return counter',[18.1,eisbarFloor+.9,-18.05],[.5,.8,1.3]);
  box('Eisbar back service shelf',[18.75,eisbarFloor+.94,-21.35],[2.1,.1,.5],'stainless');
  box('Eisbar coffee machine',[18.5,eisbarFloor+1.25,-21.35],[.7,.5,.45],'stainless');
  box('Eisbar low refrigerator',[20.3,eisbarFloor+.5,-21],[.65,1,.8],'steel');
  // Fitted spacing preserves both stair widths and the full side pier; the
  // intermediate guard is trimmed against its real faces at final registration.
  flight('Eisbar narrow lower stair',13.8,-20,-14.5,8.75,5.45,1.6,19,false);
  slab('Eisbar intermediate landing',[13.0,21.4],[-21.6,-20],eisbarFloor,'floor');
  slab('Eisbar mezzanine platform',[16.8,21.4],[-20,-13.2],eisbarFloor,'floor');
  box('Eisbar platform cross beam',[19.1,eisbarFloor-.28,-18],[4.6,.4,.3],'concrete');
  box('Eisbar platform wall beam',[21.25,eisbarFloor-.28,-17.4],[.3,.4,8.4],'concrete');
  flight('Eisbar narrow upper stair',16.2,-20,-14.5,8.75,12.05,1,19,false);
  slab('Eisbar upper service landing',[15.7,16.7],[-14.5,-13.3],12.05);
  guard('Eisbar landing rear',13.0,-21.6,21.4,-21.6,eisbarFloor,false);
  guard('Eisbar intermediate side',13.0,-21.6,13.0,-20,eisbarFloor,false);
  guard('Eisbar intermediate middle',14.6,-20,15.7,-20,eisbarFloor,false);
  guard('Eisbar mezzanine west',16.8,-20,16.8,-13.2,eisbarFloor,false);
  guard('Eisbar mezzanine east',21.4,-21.6,21.4,-13.2,eisbarFloor,false);
  guard('Eisbar mezzanine front',16.8,-13.2,21.4,-13.2,eisbarFloor,false);
  for(const x of [15.7,16.7])guard('Eisbar upper side',x,-14.5,x,-13.3,12.05,false);
  guard('Eisbar upper termination',15.7,-13.3,16.7,-13.3,12.05,false);
  // G27's relief and window form a local backdrop beside the guarded opening.
  // Their end-wall registration is inferred; no opening is cut into the hull.
  box('Eisbar relief panel',[14.1,10.7,-21.72],[1.65,1.6,.08],'mainBarPlaster');
  const medallion=box('Eisbar circular relief',[14.1,10.7,-21.655],[1.22,.058,1.22],'mainBarPlaster',false,
    [[-1.22,0,0],[0,0,.058],[0,1.22,0]]);
  medallion.shape='main-bar-medallion';
  box('Eisbar high window recess',[14.1,12.95,-21.75],[1.5,2.15,.035],'rubber',false);
  for(const x of [13.38,14.1,14.82])box('Eisbar window mullion',[x,12.95,-21.7],[.045,2.15,.035],'steel',false);
  for(const y of [11.9,12.95,14])box('Eisbar window transom',[14.1,y,-21.7],[1.5,.045,.035],'steel',false);
  box('Eisbar crane track',[18.2,15.1,-17.5],[.24,.45,8],'steel');
  box('Eisbar crane trolley',[18.2,14.75,-17],[.7,.3,.6],'steel');
  box('Eisbar hoist cable',[18.2,13.6,-17],[.025,2,.025],'steel');
  box('Eisbar hoist block',[18.2,12.55,-17],[.32,.4,.22],'steel');
  box('Eisbar hook shank',[18.2,12.2,-17],[.055,.3,.055],'steel');
  box('Eisbar hook bend',[18.27,12.04,-17],[.18,.06,.055],'steel');
  box('Eisbar hook tip',[18.35,12.11,-17],[.055,.15,.055],'steel');
  data.eisbar={sources:['A01','I03','I04','I23','U01','U02'],gallery:['27','28','29'],
    floorHeight:eisbarFloor,counterAuthor:[19.35,eisbarFloor+.8,-17],counterHeight:1.15,returnHeight:1.35,
    authorGuestRoute:[[13.8,5.45,-14],[13.8,eisbarFloor,-20.9],[17.3,eisbarFloor,-20.9],
      [17.3,eisbarFloor,-19.9],[17.3,eisbarFloor,-15.8],[18.8,eisbarFloor,-15.8],[18.8,eisbarFloor,-14.6]],
    authorUpperRoute:[[13.8,5.45,-14],[13.8,eisbarFloor,-20.9],[16.2,eisbarFloor,-20.9],[16.2,12.05,-13.9]],
    stairUpperConnection:'Unresolved service-gallery destination; no invented Panorama doorway',
    registration:'Raised mezzanine supported by dated accounts/cutaways; datum, end bay, footprint and access routes estimated; historical December2006 installation',
    section:'Distinct main-floor approach, guarded counter platform and onward ascent; crane/relief relationship estimated together'};
  for(const kind of ['Guest','Upper'])data.eisbar['site'+kind+'Route']=data.eisbar['author'+kind+'Route'].map(p=>{const q=site(p);return{x:q[0],y:q[1],z:q[2]};});

  // The photographed long axis projects OUT from the side wall. Background
  // buildings in G30 did not establish a main/Halle-join attachment. P08–10
  // constrain the front-side region; the exact bay and heights remain inferred.
  smokingFrame=true;
  const tower={x:[22,33],z:[3,10]};
  slab('smoking escape ground landing',[22.8,28.2],[-21.6,-19],.05);
  flight('smoking exposed lower escape stair',24,-19,-12,.05,2.75,2.4,16,false);
  slab('smoking escape intermediate landing',[22.8,28.2],[-12,-10.6],2.75);
  for(const x of [22.8,28.2])guard('smoking escape landing side',x,-12,x,-10.6,2.75,false);
  guard('smoking escape far end',22.8,-10.6,28.2,-10.6,2.75,false);
  guard('smoking escape middle',25.2,-12,25.8,-12,2.75,false);
  flight('smoking exposed upper escape stair',27,-19,-12,5.45,2.75,2.4,16,false);
  slab('smoking lower landing',[22.4,29],[-22.3,-19],5.45);
  slab('smoking lower approach',[22.8,25.2],[-19,-15.8],5.45);
  guard('smoking lower approach inner',25.2,-19,25.2,-15.8,5.45,false);
  flight('smoking lower enclosed stair',24,-15.8,-12,5.45,7.25,2.4,10,false);
  slab('smoking intermediate landing',[22.8,28.2],[-12,-10.6],7.25);
  guard('smoking enclosed middle',25.2,-12,25.8,-12,7.25,false);
  flight('smoking upper enclosed stair',27,-15.8,-12,9.05,7.25,2.4,10,false);
  slab('smoking upper landing',[22,29],[-21.6,-15.8],9.05);
  const enclosureBottom=z=>z<=-15.8?5.3:z>=-12?7.09:5.3+(z+15.8)*(7.09-5.3)/3.8;
  for(const x of [22.4,29]){
    const entranceFace=x===22.4,cladding=entranceFace?'pale':'lightGlass';
      box(entranceFace?'smoking opaque entrance-side face':'smoking landing glazing',[x,8.275,-20.3],[.06,5.95,2.6],cladding);
      for(let i=0;i<19;i++){
        const z=-19+(i+.5)*7/19,low=enclosureBottom(z)+.15;
        const rise=enclosureBottom(z+3.5/19)-enclosureBottom(z-3.5/19);
        box('smoking sloped underside fascia',[x,low,z],[.14,.3,7/19+.01],'pale',true,
          [[.14,0,0],[0,.3,0],[0,rise,7/19+.01]]);
        box(entranceFace?'smoking opaque entrance-side slope':'smoking stair glazing',[x,(low+11.25)/2,z],[.06,11.25-low,7/19+.01],cladding);
      }
      box(entranceFace?'smoking opaque intermediate face':'smoking intermediate glazing',[x,9.17,-11.3],[.06,4.16,1.4],cladding);
    for(let z=-21.6;z<=-10.5;z+=1.375){
      const low=enclosureBottom(z);
      box('smoking facade mullion',[x,(low+11.25)/2,z],[.07,11.25-low,.07],'steel');
    }
    for(const y of [5.35,7.25,9.05,11.25]){
      const end=y===5.35?-15.8:-10.6;
      box('smoking horizontal glazing rail',[x,y,(-21.6+end)/2],[.08,.08,end+21.6],'steel');
    }
  }
  box('smoking opaque far end',[25.7,(7.09+11.25)/2,-10.6],[6.6,11.25-7.09,.12],'pale');
  // Building-facing end: separate lower and upper doorways. The latter meets
  // the estimated public Panorama passage registered after room assembly.
  box('smoking join glazing left',[22.7,8.275,-21.6],[.6,5.95,.06],'lightGlass');
  box('smoking join glazing middle',[25.5,8.275,-21.6],[1,5.95,.06],'lightGlass');
  box('smoking join glazing right',[28.5,8.275,-21.6],[1,5.95,.06],'lightGlass');
  box('smoking upper doorway sill',[27,7.175,-21.6],[2,3.75,.06],'lightGlass');
  box('smoking upper doorway header',[27,11.2,-21.6],[2,.1,.06],'lightGlass');
  box('smoking join doorway header',[24,9.55,-21.6],[2,3.4,.06],'lightGlass');
  box('smoking join doorway sill',[24,5.375,-21.6],[2,.15,.06],'lightGlass');
  box('smoking roof',[25.7,11.3,-16.1],[6.6,.15,11],'pale');
  for(let z=-21.6;z<-10.5;z+=1.375)
    box('smoking roof joist',[25.7,11.16,z],[6.6,.14,.08],'steel',false);
  for(const [z,top,width] of [[-20.8,5.29,6.7],[-11.4,7.09,6]]){
    box('smoking landing cross-girder',[25.5,top-.15,z],[width,.3,.24],'steel');
    for(const x of [23,28.3])box('smoking exterior support',[x,(top-.3+.05)/2,z],[.18,top-.3-.05,.18],'steel');
  }
  for(const x of [23,28.3])box('smoking lower diagonal tie',[x,2.8,-16.1],[.08,.08,9.4],'steel',true,
    [[.08,0,0],[0,.08,0],[0,4.6,9.4]]);
  guard('smoking upper landing opening',22.8,-15.8,25.8,-15.8,9.05,false);
  guard('smoking upper landing outer edge',28.2,-15.8,29,-15.8,9.05,false);
  guard('smoking lower landing middle',25.2,-19,25.8,-19,5.45,false);
  guard('smoking lower landing outer edge',28.2,-19,29,-19,5.45,false);
  box('smoking upper shelf',[28.7,10,-20.3],[.45,.08,1.4],'steel');
  box('smoking ashtray',[28.65,10.08,-20.3],[.2,.08,.2],'stainless',false);
  // Restrained original geometry for the checkerplate and sliding-pane detail
  // visible in32/33; no downloaded photograph is used as a texture.
  for(const [y,z0,z1] of [[9.05,-21.3,-16],[7.25,-11.8,-10.8]])
    for(let x=23.1;x<28.7;x+=.45)for(let z=z0;z<z1;z+=.38)
      box('smoking checkerplate raised lug',[x,y+.006,z],[.13,.008,.025],'aluminium',false,
        [[.1,0,.08],[0,.008,0],[-.016,0,.02]]);
  for(const [low,high,z0,z1] of [[7.9,9.15,-18.8,-15.8],[9.8,10.6,-21.1,-19.7]]){
    for(const y of [low,high])box('smoking operable pane horizontal',[28.96,y,(z0+z1)/2],[.04,.035,z1-z0],'steel',false);
    for(const z of [z0,(z0+z1)/2,z1])box('smoking operable pane upright',[28.96,(low+high)/2,z],[.04,high-low,.035],'steel',false);
    box('smoking pane handle',[28.92,(low+high)/2,(z0+z1)/2+.1],[.05,.16,.035],'steel',false);
  }
  // P08–10's entrance-facing surface is opaque, with framed dark panels.
  // G30/31's opposite face is glazed. These are two sides of one enclosure.
  for(const [y,z,width] of [[6.8,-19.1,2.2],[9.2,-19.1,2.2],[10,-11.3,1]]){
    box('smoking entrance-side window',[22.365,y,z],[.025,.8,width],'glass',false);
    for(const dy of [-.43,.43])box('smoking entrance-side window frame',[22.34,y+dy,z],[.04,.055,width+.1],'steel',false);
    for(const dz of [-width/2-.03,width/2+.03])box('smoking entrance-side window jamb',[22.34,y,z+dz],[.04,.9,.055],'steel',false);
  }
  // Open one registered bay in the study facade, retaining its masonry above
  // and below. This edits the provisional detail shell only, never LoD2 mass.
  for(const [doorX,doorLow,doorHigh] of [[24,5.45,7.85],[27,9.05,11.15]]){
  const door=site([doorX,0,-21.6]),replacements=new Map();
  for(const p of layout.parts){
    // Decorative sill/reveal boxes have no elevation-name prefix and still
    // render across the portal unless they follow the same opening cut.
    if(p.section!=='shell'||p.shape!=='box'||!p.matrix||Math.abs(p.center[0]-door[0])>.7||Math.abs(p.center[2]-door[2])>.94)continue;
    const low=p.center[1]-p.size[1]/2,high=p.center[1]+p.size[1]/2;
    if(high<=doorLow||low>=doorHigh)continue;
    const slices=[];
    for(const [a,b] of [[low,Math.min(high,doorLow)],[Math.max(low,doorHigh),high]]){
      if(b-a<.001)continue;
      const q={...p,name:p.name+' smoking doorway trim',center:[...p.center],size:[...p.size],matrix:[...p.matrix]};
      q.center[1]=(a+b)/2;q.size[1]=b-a;q.matrix[5]=b-a;q.matrix[13]=(a+b)/2;slices.push(q);
    }
    replacements.set(p,slices);
  }
  layout.parts=layout.parts.flatMap(p=>replacements.get(p)??[p]);
  layout.solids=layout.solids.flatMap(s=>replacements.has(s.renderPart)?replacements.get(s.renderPart).map(p=>
    ({...s,name:p.name,renderPart:p,y:[p.center[1]-p.size[1]/2,p.center[1]+p.size[1]/2]})):[s]);
  }
  const constructionRoute=[[24,5.45,-23.1],[24,5.45,-20],[24,7.25,-11.3],[27,7.25,-11.3],[27,9.05,-20]];
  data.smoking={sources:['A01','I23','P08','P09','P10','U02'],gallery:['30','31','32','33','34'],authorBounds:tower,
    enclosedGuard:'Gallery32/33 sparse posts and continuous horizontal rails; separate invisible body containment, spacing estimated',
    faces:'G30/31 glazed reverse; P08–10 opaque entrance-facing cladding with framed windows; pane dimensions and counts estimated',
    floorHeights:[5.45,7.25,9.05],upperConnection:'Public Panorama connection supported; doorway and guarded passage registration estimated',
    lowerConnection:'Estimated doorway through front-side study-facade bay at author z=8',
    history:'April2008 Treppe Rauchbereich per architect anniversary timeline; gallery date unknown',
    registration:'Outward long axis and front-side region photo-supported; exact bay, dimensions and elevations estimated; official hull untouched',
    supersedes:'Parallel rear-quarter orientation in 121459a; background annex was not proof of the main/Halle join',
    authorRoute:constructionRoute.map(smokingToAuthor),
    lightAnchors:[[25.5,10.5,-20],[25.5,9.5,-11.4]].map(smokingToAuthor)};
  data.smoking.siteRoute=constructionRoute.map(p=>{const q=site(p);return{x:q[0],y:q[1],z:q[2]};});
  Object.assign(layout.interiorTopology.smoking,{sources:['A01','I23'],status:'Estimated photographed tower represented',
    reason:'Full architect gallery30–34 supports stair form and two-level connection; upper return stair and Panorama attachment are estimated, not surveyed',
    architecturalCirculation:'smoking'});
}
