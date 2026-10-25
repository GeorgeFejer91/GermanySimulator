import test from 'node:test';
import assert from 'node:assert/strict';
import {layout,materials} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {smokingToAuthor} from '../assets/models/berghain/architectural-circulation.mjs';

const site=([x,y,z])=>studyToSite({x,y,z});
const towerSite=p=>site(smokingToAuthor(p));
test('smoking enclosure projects outward from the entrance-side facade with distinct opaque and glazed faces',()=>{
  const s=layout.architecturalCirculation.smoking;
  assert.ok(s.authorBounds.x[1]-s.authorBounds.x[0]>s.authorBounds.z[1]-s.authorBounds.z[0],
    'G30/31 long axis must project outward, not run parallel to the side wall');
  assert.ok(s.authorBounds.z[0]>0,'P08/09 attachment region is in the entrance-side half');
  assert.ok(layout.parts.some(p=>p.name==='Architecture smoking opaque entrance-side face'&&p.material==='pale'));
  assert.ok(layout.parts.some(p=>p.name==='Architecture smoking stair glazing'&&p.material==='lightGlass'));
  assert.match(s.registration,/estimated/,'metric registration is not a surveyed claim');
});
function walk(route){
  let p={...route[0]};assert.ok(canStand(p,layout),'legal route start');
  for(const target of [...route.slice(1),...route.toReversed().slice(1)]){
    const steps=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/.055);
    const dx=(target.x-p.x)/steps,dz=(target.z-p.z)/steps;
    for(let i=0;i<steps;i++){
      p=moveVisitor(p,{x:dx,z:dz},layout);
      assert.ok(canStand(p,layout),'full body legal on every step');
    }
    assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.04,JSON.stringify({p,target}));
    assert.ok(Math.abs(p.y-target.y)<.03,'landing elevation '+JSON.stringify({p,target}));
  }
}
test('folded main stair reaches the main floor and returns around the open foyer void',()=>{
  walk(layout.architecturalCirculation.mainStair.siteRoute);
  assert.equal(canStand(site([8,.05,11]),layout),true,'under upper landing has body clearance');
  assert.equal(canStand(site([11,5.45,17]),layout),false,'void is not filled with a phantom support slab');
  assert.ok(!layout.parts.some(p=>p.name==='main stair tread'),'old straight stair retired');
});
test('upper main flight rises toward the DJ-side floor rim without a long return bridge',()=>{
  const upper=layout.floors.find(f=>f.name==='main upper flight');
  const high=upper.y>upper.endY?upper.rampAxis[0]:upper.rampAxis[1];
  const low=upper.y>upper.endY?upper.rampAxis[1]:upper.rampAxis[0];
  const dj=layout.parts.find(p=>p.name==='main DJ desk').center;
  const ascent=[high[0]-low[0],high[1]-low[1]],toward=[dj[0]-low[0],dj[2]-low[1]];
  assert.ok((ascent[0]*toward[0]+ascent[1]*toward[1])/(Math.hypot(...ascent)*Math.hypot(...toward))>.9,
    'G21/G23 upper flight arrives toward the DJ end, rather than returning from the opposite rim');
  assert.ok(!layout.floors.some(f=>f.name==='main upper return'),'no unsupported long return bridge');
  const arrival=layout.floors.find(f=>f.name==='main upper turn');
  assert.ok(arrival.z[1]-arrival.z[0]<2.1,'only a short landing bridges the flight to the gallery edge');
});
test('visible main-flight stringers stop the body approaching their low undersides',()=>{
  for(const name of ['main stair','main upper flight']){
    const parts=layout.parts.filter(p=>p.name==='Architecture '+name+' stringer');
    assert.equal(parts.length,32);
    for(const part of parts){const s=layout.solids.find(s=>s.renderPart===part);assert.ok(s?.undersideOnly&&s.treadFloor.name===name);}
  }
  let p={x:4.761803,y:.05,z:18.136704};assert.ok(canStand(p,layout));
  for(let i=0;i<26;i++)p=moveVisitor(p,{x:.02,z:0},layout);
  assert.ok(p.x<5.26,'body must stop before the visible low stringer, including its below-tread depth');
  assert.ok(canStand(p,layout));
});
test('wardrobe connects through a real glass doorway to main stairs and ground WC in both directions',()=>{
  const c=layout.architecturalCirculation.wardrobeConnection;
  walk([...c.siteRoute,...layout.architecturalCirculation.mainStair.siteRoute.slice(1)]);
  walk([site([0,.05,14.4]),...layout.groundSanitary.route]);
  assert.equal(canStand(site([-4,.05,14.4]),layout),true,'door opening clear');
  for(const z of [13,15.8])assert.equal(canStand(site([-4,.05,z]),layout),false,'remaining glass leaves block');
  const slices=layout.parts.filter(p=>p.circulationDoorway&&p.name.startsWith('Public wardrobe'));
  assert.equal(slices.length,3);
  const header=slices.find(p=>p.name.endsWith('header'));
  assert.ok(Math.abs(header.center[1]-header.size[1]/2-2.45)<1e-8);
  for(const p of slices){
    const s=layout.solids.find(s=>s.renderPart===p);assert.ok(s?.polygon.length===4);
    const m=p.matrix;
    for(const x of [-.5,.5])for(const z of [-.5,.5]){
      const point=[m[12]+m[0]*x+m[8]*z,m[14]+m[2]*x+m[10]*z];
      assert.ok(s.polygon.some(v=>Math.hypot(v[0]-point[0],v[1]-point[1])<1e-8),'render/collision corners match');
    }
  }
});
test('smoking main-floor doorway and both enclosed flights connect in both directions',()=>{
  walk(layout.architecturalCirculation.smoking.siteRoute);
  assert.match(layout.architecturalCirculation.smoking.upperConnection,/estimated/);
  assert.equal(canStand(site([22,9.05,5]),layout),true,'estimated public upper attachment is body clear');
  assert.equal(canStand(site([22,5.45,8]),layout),true,'new lower facade entry is body clear');
  assert.equal(canStand(site([22,5.45,-20]),layout),false,'former rear entry restored to facade');
});
test('open escape flights below smoking enclosure and Eisbar stair remain traversable',()=>{
  walk([[24,.05,-20],[24,2.75,-11.3],[27,2.75,-11.3],[27,5.45,-20]].map(towerSite));
  walk(layout.architecturalCirculation.eisbar.siteUpperRoute);
});
test('new architecture has finite portable transforms, known materials and matching visible-part solids',()=>{
  const additions=layout.parts.filter(p=>p.architecturalCirculation);
  assert.ok(additions.length>500);
  for(const p of additions){
    assert.ok(p.matrix?.length===16&&p.matrix.every(Number.isFinite),p.name);
    assert.ok(materials[p.material],p.material);
    assert.equal(p.instanceTone,.94);
  }
  for(const solid of layout.solids.filter(s=>s.renderPart?.architecturalCirculation)){
    const p=solid.renderPart,m=p.matrix;
    for(const a of [-.5,.5])for(const b of [-.5,.5])for(const c of [-.5,.5]){
      for(let i=0;i<3;i++){
        const v=m[12+i]+m[i]*a+m[4+i]*b+m[8+i]*c,r=solid[['x','y','z'][i]];
        assert.ok(v>=r[0]-1e-7&&v<=r[1]+1e-7,p.name);
      }
    }
  }
});

test('replacement landing guards block the full body independently of missing floor support',()=>{
  const checks=[
    ['main landing middle',[10,2.75,20.1],[10,2.75,18.9]],
    ['main arrival east',[12.8,5.45,10.3],[14.1,5.45,10.3]],
    ['Eisbar intermediate side',[13.9,8.75,-20.7],[12.7,8.75,-20.7]],
    ['Eisbar landing rear',[19,8.75,-20.8],[19,8.75,-22.2]],
    ['Eisbar intermediate middle',[15,8.75,-20.7],[15,8.75,-19.4]],
    ['Eisbar upper side',[16.2,12.05,-13.8],[15.2,12.05,-13.8]],
    ['smoking escape landing side',[27.7,2.75,-11.3],[28.8,2.75,-11.3]],
    ['smoking escape far end',[25.5,2.75,-11.3],[25.5,2.75,-10]],
    ['smoking escape middle',[25.5,2.75,-11.3],[25.5,2.75,-12.7]],
    ['smoking enclosed middle',[25.5,7.25,-11.3],[25.5,7.25,-12.7]]];
  for(const [name,a,b] of checks){
    const frame=name.startsWith('smoking')?towerSite:site;
    const p=frame(a),target=frame(b),space={floors:[{x:[-100,100],z:[-100,100],y:a[1]}],
      solids:layout.solids.filter(s=>s.name.startsWith('Architecture '+name))};
    assert.ok(space.solids.length&&canStand(p,space),name+' start');
    const stopped=moveVisitor(p,{x:target.x-p.x,z:target.z-p.z},space);
    assert.ok(Math.hypot(stopped.x-target.x,stopped.z-target.z)>.4,name+' must stop at visible guard');
  }
});
test('tower posts touch actual landing cross-girders and hoist is outside the upper stair body',()=>{
  const posts=layout.parts.filter(p=>p.name==='Architecture smoking exterior support');
  const girders=layout.parts.filter(p=>p.name==='Architecture smoking landing cross-girder');
  assert.equal(posts.length,4);assert.equal(girders.length,2);
  for(const p of posts){
    const top=p.center[1]+p.size[1]/2;
    assert.ok(girders.some(g=>Math.abs(g.center[0]-p.center[0])<.15&&Math.abs(g.center[1]-g.size[1]/2-top)<1e-8));
  }
  for(const g of girders){
    const top=g.center[1]+g.size[1]/2;
    assert.ok(layout.parts.some(p=>p.name.includes('smoking')&&p.name.includes('landing')&&!p.name.includes('cross-girder')&&
      Math.abs(p.center[1]-p.size[1]/2-top)<1e-8));
  }
  const p=site([16.2,10.75,-17]);assert.ok(canStand(p,layout));
  for(const part of layout.parts.filter(p=>/Architecture Eisbar (hoist|hook)/.test(p.name))){
    const s=layout.solids.find(s=>s.renderPart===part);assert.ok(s,'Hoist has collision');
    const dx=p.x-Math.max(s.x[0],Math.min(p.x,s.x[1])),dz=p.z-Math.max(s.z[0],Math.min(p.z,s.z[1]));
    assert.ok(Math.hypot(dx,dz)>.28,'Hoist outside visited upper-stair body');
  }
});
test('enclosed smoking guards have sparse posts and full-length rails with independent continuous containment',()=>{
  const flights=layout.architecturalCirculation.stairs.filter(s=>s.name.includes('smoking')&&s.name.includes('enclosed'));
  assert.equal(flights.length,2);
  for(const f of flights){
    const parts=layout.parts.filter(p=>p.name.startsWith('Architecture '+f.name+' '));
    assert.equal(parts.filter(p=>p.name.endsWith('guard picket')).length,0);
    assert.equal(parts.filter(p=>p.name.endsWith('sparse guard post')).length,6);
    const rails=parts.filter(p=>p.name.includes('continuous '));assert.equal(rails.length,8);
    rails.forEach((rail,i)=>{
      const x=f.author.x+(i<4?-1:1)*f.author.width/2;
      const a=towerSite([x,f.author.y[0],f.author.z[0]]),b=towerSite([x,f.author.y[1],f.author.z[1]]);
      assert.ok(Math.abs(Math.hypot(...rail.matrix.slice(8,11))-Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z))<1e-8,'rail spans entire slope');
    });
    const solids=layout.solids.filter(s=>s.name===f.name+' guard containment');assert.equal(solids.length,20);
    assert.ok(solids.every(s=>!s.renderPart&&s.collisionPolicy.includes('Invisible')));
    for(const t of [.13,.38,.63,.88])for(const sign of [-1,1]){
      const y=f.author.y[0]+(f.author.y[1]-f.author.y[0])*t,z=f.author.z[0]+(f.author.z[1]-f.author.z[0])*t;
      const start=towerSite([f.author.x+sign*(f.author.width/2-.5),y,z]),target=towerSite([f.author.x+sign*(f.author.width/2+.6),y,z]);
      const space={floors:[{x:[-100,100],z:[-100,100],y}],solids};
      assert.ok(canStand(start,space));
      const stopped=moveVisitor(start,{x:target.x-start.x,z:target.z-start.z},space);
      assert.ok(Math.hypot(stopped.x-target.x,stopped.z-target.z)>.5,'body stopped between sparse posts');
    }
  }
  assert.equal(layout.parts.filter(p=>p.name==='Architecture Eisbar narrow lower stair guard picket').length,38,'other stair profile retained');
});
test('reachable smoking endpoint posts have fitted solids and stop both landing approaches',()=>{
  const posts=layout.parts.filter(p=>p.name.includes('smoking')&&p.name.endsWith('sparse guard post'));
  assert.equal(posts.length,12);
  for(const p of posts){
    const solid=layout.solids.find(s=>s.renderPart===p);assert.ok(solid,p.name+' fitted solid');
    for(const x of [-.5,.5])for(const z of [-.5,.5]){
      const m=p.matrix,q=[m[12]+m[0]*x+m[8]*z,m[14]+m[2]*x+m[10]*z];
      assert.ok(solid.polygon.some(v=>Math.hypot(v[0]-q[0],v[1]-q[1])<1e-8));
    }
  }
  for(const [x,y,startX] of [[22.8,5.45,24],[28.2,9.05,27]]){
    let p=towerSite([startX,y,-16.8]);
    for(const t of [towerSite([x,y,-16.8]),towerSite([x,y,-16.14])]){
      const n=Math.ceil(Math.hypot(t.x-p.x,t.z-p.z)/.025),dx=(t.x-p.x)/n,dz=(t.z-p.z)/n;
      for(let i=0;i<n;i++){p=moveVisitor(p,{x:dx,z:dz},layout);assert.ok(canStand(p,layout));}
    }
    const near=posts.filter(post=>Math.abs(post.center[1]-(y+.55))<1e-8);
    assert.ok(near.length);
    for(const post of near){
      const s=layout.solids.find(s=>s.renderPart===post);
      let distance=Infinity;
      for(let i=0;i<s.polygon.length;i++){
        const a=s.polygon[i],b=s.polygon[(i+1)%s.polygon.length],dx=b[0]-a[0],dz=b[1]-a[1];
        const t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.z-a[1])*dz)/(dx*dx+dz*dz)));
        distance=Math.min(distance,Math.hypot(p.x-a[0]-t*dx,p.z-a[1]-t*dz));
      }
      assert.ok(distance>=.28-1e-7,'production approach clears complete visible post footprint');
    }
  }
});
