/** Four bounded, original prop studies. Y-up / +Z-front / ground-centred.
 * No Three.js dependency, texture, randomness, external mesh or runtime service.
 * The same geometry produces the optional in-game GLBs and offline exports.
 */
export const DETAIL_VERSION = 'prop-details-1';
export const DETAIL_IDS = Object.freeze(['fax-kiosk', 'beer-crate', 'allotment-wheelbarrow', 'recycling-containers']);
export const DETAIL_FITS = Object.freeze({
  'fax-kiosk': Object.freeze([1.42, 2.595, 1.08]),
  'beer-crate': Object.freeze([.75, .58, .54]),
  'allotment-wheelbarrow': Object.freeze([1.5565, .75, .65]),
  'recycling-containers': Object.freeze([1.87, 1.21, .68])
});
export const PALETTE = Object.freeze({
  paper: 0xe6dec9, enamel: 0xb5b09e, steel: 0x737b75, ink: 0x282d2a,
  sage: 0x63755c, oxide: 0xa34c3a, amber: 0x70512d, ochre: 0xc1a04d,
  blue: 0x526e83, rubber: 0x343731, wood: 0xa7865c, soil: 0x64503c,
  screen: 0x84aaa0
});
const add = (a,b) => a.map((x,i)=>x+b[i]);
const sub = (a,b) => a.map((x,i)=>x-b[i]);
const mul = (a,s) => a.map(x=>x*s);
const dot = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit = a => {const n=Math.hypot(...a);if(n<1e-10)throw new Error('Zero-length geometry direction');return mul(a,1/n);};
const mean = points => points.reduce((s,p)=>add(s,mul(p,1/points.length)),[0,0,0]);

export class MeshBuilder {
  constructor(id){this.id=id;this.parts=new Map();this.features=[];}
  feature(name){this.features.push(name);}
  tri(a,b,c,material){
    const n=cross(sub(b,a),sub(c,a)),length=Math.hypot(...n);
    if(length<1e-10)return;
    if(!Object.hasOwn(PALETTE,material))throw new Error(`Unknown material ${material}`);
    if(!this.parts.has(material))this.parts.set(material,{material,positions:[],normals:[]});
    const part=this.parts.get(material);part.positions.push(...a,...b,...c);
    for(let i=0;i<3;i++)part.normals.push(...mul(n,1/length));
  }
  face(points,material,outward){
    let p=points;
    if(outward && dot(cross(sub(p[1],p[0]),sub(p[2],p[0])),outward)<0)p=[...p].reverse();
    for(let i=1;i<p.length-1;i++)this.tri(p[0],p[i],p[i+1],material);
  }
  box(center,size,material,bevel=0){
    const [x,y,z]=center,[w,h,d]=size.map(v=>v/2);
    if(!size.every(v=>v>0))throw new Error('Non-positive box');
    const b=Math.min(bevel,w*.45,h*.45,d*.45);
    if(!b){
      const p=[[-w,-h,-d],[w,-h,-d],[w,-h,d],[-w,-h,d],[-w,h,-d],[w,h,-d],[w,h,d],[-w,h,d]].map(v=>add(v,center));
      for(const f of [[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]){
        const q=f.map(i=>p[i]);this.face(q,material,sub(mean(q),center));
      }
      return;
    }
    const ring=(yy,ww,dd,c)=>[[-ww+c,-dd],[ww-c,-dd],[ww,-dd+c],[ww,dd-c],[ww-c,dd],[-ww+c,dd],[-ww,dd-c],[-ww,-dd+c]].map(([xx,zz])=>[x+xx,y+yy,z+zz]);
    const rings=[ring(-h,w-b,d-b,b*.4),ring(-h+b,w,d,b),ring(h-b,w,d,b),ring(h,w-b,d-b,b*.4)];
    this.face(rings[0],material,[0,-1,0]);this.face(rings[3],material,[0,1,0]);
    for(let r=0;r<3;r++)for(let i=0;i<8;i++){
      const j=(i+1)%8,q=[rings[r][i],rings[r][j],rings[r+1][j],rings[r+1][i]];
      this.face(q,material,sub(mean(q),center));
    }
  }
  lathe(center,axis,profile,material,segments=12){
    const n=unit(axis),u=unit(cross(n,Math.abs(n[1])<.9?[0,1,0]:[0,0,1])),v=cross(n,u);
    const rings=profile.map(([t,r])=>Array.from({length:segments},(_,i)=>add(add(center,mul(n,t)),add(mul(u,r*Math.cos(i*Math.PI*2/segments)),mul(v,r*Math.sin(i*Math.PI*2/segments))))));
    for(let k=0;k<rings.length-1;k++)for(let i=0;i<segments;i++){
      const j=(i+1)%segments;
      // u cross v = axis. This order is outward, including recessed profiles.
      this.face([rings[k][i],rings[k][j],rings[k+1][j],rings[k+1][i]],material);
    }
    this.face([...rings[0]].reverse(),material,mul(n,-1));
    this.face(rings.at(-1),material,n);
  }
  beam(a,b,r,material,segments=8){this.lathe(a,sub(b,a),[[0,r],[Math.hypot(...sub(b,a)),r]],material,segments);}
  ellipsoid(center,scale,material,segments=12,rings=6){
    const point=(i,j)=>add(center,[scale[0]*Math.sin(j*Math.PI/rings)*Math.cos(i*2*Math.PI/segments),scale[1]*Math.cos(j*Math.PI/rings),scale[2]*Math.sin(j*Math.PI/rings)*Math.sin(i*2*Math.PI/segments)]);
    for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
      const q=[point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)];
      this.face(q,material,sub(mean(q),center));
    }
  }
  tray(top,bottom,thickness,material){
    // Each loop is four corners at a constant height. An open interior, not a box.
    const ct=mean(top),cb=mean(bottom);
    const innerTop=top.map(p=>[p[0]+Math.sign(ct[0]-p[0])*thickness,p[1],p[2]+Math.sign(ct[2]-p[2])*thickness]);
    const innerBottom=bottom.map(p=>[p[0]+Math.sign(cb[0]-p[0])*thickness,p[1]+thickness,p[2]+Math.sign(cb[2]-p[2])*thickness]);
    this.face(bottom,material,[0,-1,0]);this.face(innerBottom,material,[0,1,0]);
    for(let i=0;i<4;i++){
      const j=(i+1)%4,out=[top[i],top[j],bottom[j],bottom[i]],inside=[innerTop[i],innerTop[j],innerBottom[j],innerBottom[i]];
      this.face(out,material,[mean(out)[0]-ct[0],0,mean(out)[2]-ct[2]]);
      this.face(inside,material,[ct[0]-mean(inside)[0],0,ct[2]-mean(inside)[2]]);
      this.face([top[i],top[j],innerTop[j],innerTop[i]],material,[0,1,0]);
    }
  }
  finish(){
    const parts=[...this.parts.values()],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(const p of parts)for(let i=0;i<p.positions.length;i++){const v=p.positions[i],axis=i%3;if(!Number.isFinite(v))throw new Error('Nonfinite vertex');min[axis]=Math.min(min[axis],v);max[axis]=Math.max(max[axis],v);}
    const size=max.map((v,i)=>v-min[i]),target=DETAIL_FITS[this.id]||size,s=Math.min(...target.map((v,i)=>v/size[i]));
    const origin=[(min[0]+max[0])/2,min[1],(min[2]+max[2])/2];
    for(const p of parts)p.positions=p.positions.map((v,i)=>Math.fround((v-origin[i%3])*s));
    return {id:this.id,version:DETAIL_VERSION,features:this.features,parts,dimensions:size.map(v=>v*s),triangles:parts.reduce((n,p)=>n+p.positions.length/9,0)};
  }
}

function fax(){
  const m=new MeshBuilder('fax-kiosk');
  m.feature('bevelled enclosure and open canopy');
  for(const x of [-.59,.59]){m.box([x,.045,-.2],[.22,.09,.26],'ink',.02);m.box([x,1.24,-.2],[.09,2.48,.09],'steel',.018);}
  m.box([0,1.37,-.41],[1.24,2.08,.07],'sage',.035);
  m.box([0,2.53,0],[1.42,.13,1.08],'ink',.045);
  m.box([0,2.40,.40],[1.25,.12,.07],'enamel',.02);
  m.box([0,1.05,0],[1.23,.12,.8],'steel',.025);
  for(const x of [-.61,.61]){m.box([x,1.63,-.04],[.045,.97,.63],'enamel',.012);m.box([x,1.63,.26],[.055,.97,.045],'steel',.01);}
  m.box([0,1.235,0],[.94,.25,.60],'enamel',.065);
  m.box([0,1.385,-.06],[.90,.06,.37],'paper',.025);
  m.box([-.17,1.425,-.035],[.31,.022,.135],'ink',.009);
  m.box([-.17,1.44,-.035],[.25,.012,.078],'screen',.008);
  m.feature('large keypad and recognisable handset');
  for(let col=0;col<3;col++)for(let row=0;row<3;row++)m.box([.13+col*.078,1.435,.06+row*.066],[.059,.026,.048],'ink',.009);
  for(const z of [-.15,.18])m.box([-.41,1.42,z],[.14,.08,.16],'ink',.04);
  m.box([-.41,1.45,.015],[.09,.055,.36],'ink',.025);
  m.box([0,1.205,.315],[.63,.036,.035],'ink',.008);
  m.feature('continuous folded paper feed and raised ruled marks');
  const path=[[-.23,1.38],[-.28,1.67],[-.18,1.74],[-.11,1.71]];
  for(let i=0;i<path.length-1;i++){
    const [z,y]=path[i],[zz,yy]=path[i+1];
    m.face([[-.29,y,z],[.29,y,z],[.29,yy,zz],[-.29,yy,zz]],'paper',[0,0,1]);
    m.face([[-.29,y-.006,z],[.29,y-.006,z],[.29,yy-.006,zz],[-.29,yy-.006,zz]],'paper',[0,0,-1]);
  }
  const feed=[[.325,1.19],[.47,1.16],[.49,1.04],[.43,.94]];
  for(let i=0;i<feed.length-1;i++){
    const [z,y]=feed[i],[zz,yy]=feed[i+1];
    const q=[[-.26,y,z],[.26,y,z],[.26,yy,zz],[-.26,yy,zz]];
    m.face(q,'paper',[0,1,1]);m.face(q.map(p=>[p[0],p[1]-.004,p[2]-.004]),'paper',[0,-1,-1]);
  }
  for(let i=0;i<3;i++)m.box([-.01,1.165-i*.044,.493],[.34-i*.045,.009,.007],'ink');
  return m;
}
function crate(){
  const m=new MeshBuilder('beer-crate');m.feature('open ribbed crate with real handle apertures');
  m.box([0,.035,0],[.74,.07,.53],'oxide',.019);
  for(const x of [-.347,.347])for(const z of [-.237,.237])m.box([x,.22,z],[.052,.37,.052],'oxide',.012);
  for(const z of [-.245,.245]){
    m.box([0,.16,z],[.74,.13,.04],'oxide',.01);m.box([0,.385,z],[.74,.04,.048],'oxide',.011);
    // Negative space between upper rail and two side shoulders makes the handle.
    for(const x of [-.26,.26])m.box([x,.30,z],[.22,.14,.04],'oxide',.01);
    for(const x of [-.24,-.12,0,.12,.24])m.box([x,.15,z*1.035],[.025,.18,.022],'oxide',.004);
  }
  for(const x of [-.35,.35]){
    m.box([x,.15,0],[.04,.18,.50],'oxide',.01);m.box([x,.385,0],[.05,.04,.52],'oxide',.01);
    for(const z of [-.195,.195])m.box([x,.30,z],[.045,.16,.12],'oxide',.009);
  }
  m.feature('six shouldered bottles with long necks and crown caps');
  for(const x of [-.22,0,.22])for(const z of [-.11,.11]){
    m.lathe([x,.075,z],[0,1,0],[[0,.051],[.025,.059],[.29,.059],[.34,.047],[.375,.025],[.459,.023]],'amber',12);
    m.lathe([x,.075,z],[0,1,0],[[.14,.060],[.235,.060]],'paper',12);
    m.lathe([x,.075,z],[0,1,0],[[.17,.061],[.195,.061]],'sage',12);
    m.lathe([x,.075,z],[0,1,0],[[.45,.027],[.468,.029],[.475,.025]],'steel',12);
  }
  return m;
}
function wheelbarrow(){
  const m=new MeshBuilder('allotment-wheelbarrow');m.feature('open tapered tray with wall thickness');
  m.tray([[-.50,.69,-.30],[.37,.69,-.30],[.37,.69,.30],[-.50,.69,.30]],
    [[-.34,.43,-.19],[.21,.43,-.19],[.21,.43,.19],[-.34,.43,.19]],.024,'sage');
  for(const z of [-.306,.306])m.beam([-.51,.69,z],[.38,.69,z],.024,'steel');
  for(const x of [-.51,.38])m.beam([x,.69,-.306],[x,.69,.306],.024,'steel');
  m.feature('framed handles, stable support feet and separate tyre/hub');
  for(const z of [-.24,.24]){
    m.beam([-.49,.25,z],[.87,.57,z],.028,'steel');
    m.beam([.18,.43,z],[.31,.015,z],.028,'steel');
    m.beam([.31,.024,z],[.44,.024,z],.024,'steel');
    m.beam([.73,.537,z],[.95,.589,z],.038,'wood');
    m.beam([.91,.580,z],[.965,.593,z],.040,'ink');
  }
  m.beam([-.48,.205,-.25],[-.48,.205,.25],.027,'steel');
  m.lathe([-.48,.205,0],[0,0,1],[[-.064,.16],[-.045,.205],[.045,.205],[.064,.16]],'rubber',16);
  for(const z of [-.066,.066]){
    m.lathe([-.48,.205,z],[0,0,1],[[-.003,.095],[.003,.095]],'steel',12);
    m.lathe([-.48,.205,z*1.08],[0,0,1],[[-.004,.035],[.004,.035]],'ink',10);
  }
  m.feature('bounded faceted soil mound, leaving the inner tray visible');
  m.ellipsoid([-.09,.465,0],[.225,.065,.115],'soil',10,5);
  return m;
}
function recycling(){
  const m=new MeshBuilder('recycling-containers');m.feature('tapered bodies, overhanging lids, wheels and grab handles');
  for(const [x,color] of [[-.63,'blue'],[0,'sage'],[.63,'ochre']]){
    m.tray([[x-.26,1.075,-.28],[x+.26,1.075,-.28],[x+.26,1.075,.28],[x-.26,1.075,.28]],
      [[x-.213,.11,-.22],[x+.213,.11,-.22],[x+.213,.11,.22],[x-.213,.11,.22]],.025,color);
    m.box([x,1.115,0],[.60,.095,.63],'ink',.025);
    m.box([x,1.161,.08],[.50,.015,.40],color,.005);
    for(const sx of [-.207,.207])m.lathe([x+sx,.105,-.226],[1,0,0],[[-.027,.088],[.027,.088]],'rubber',12);
    for(const sx of [-.16,.16])m.beam([x+sx,.92,-.285],[x+sx,1.03,-.325],.018,'steel');
    m.beam([x-.16,1.03,-.325],[x+.16,1.03,-.325],.021,'steel');
    m.box([x,.54,.26],[.33,.21,.027],'paper',.015);
    m.box([x,.86,.288],[.31,.07,.018],'ink',.006);
    m.feature(`${color}: raised sorting pictogram, not tiny text`);
    if(color==='blue'){
      for(let i=0;i<3;i++)m.box([x-.05+i*.037,.54-i*.018,.281+i*.008],[.13,.12,.012],'blue',.003);
    }else if(color==='sage'){
      m.box([x,.523,.287],[.075,.105,.012],'sage',.009);m.box([x,.598,.287],[.032,.049,.012],'sage',.004);
    }else{
      for(let i=0;i<3;i++)m.box([x-.09+i*.09,.54,.287],[.045,.12,.013],'ochre',.01);
    }
  }
  return m;
}
export function buildDetailMesh(id){
  const makers={'fax-kiosk':fax,'beer-crate':crate,'allotment-wheelbarrow':wheelbarrow,'recycling-containers':recycling};
  if(!Object.hasOwn(makers,id))throw new RangeError(`Unknown detail prop: ${id}`);
  return makers[id]().finish();
}
function linearColor(hex){return [16,8,0].map(shift=>{const s=((hex>>shift)&255)/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}).concat(1);}

/** Valid glTF 2.0 binary: material-batched triangles, normals, no textures. */
export function createDetailGLB(id){
  return encodePropGLB(buildDetailMesh(id));
}

export function encodePropGLB(model){
  const id=model.id,views=[],accessors=[],primitives=[],materials=[],blocks=[];
  let offset=0;
  function attribute(values,position){
    const bytes=new Uint8Array(values.length*4),view=new DataView(bytes.buffer);
    values.forEach((v,i)=>view.setFloat32(i*4,v,true));
    const a={bufferView:views.length,componentType:5126,count:values.length/3,type:'VEC3'};
    if(position){a.min=[Infinity,Infinity,Infinity];a.max=[-Infinity,-Infinity,-Infinity];values.forEach((v,i)=>{const k=i%3;a.min[k]=Math.min(a.min[k],v);a.max[k]=Math.max(a.max[k],v);});}
    views.push({buffer:0,byteOffset:offset,byteLength:bytes.byteLength,target:34962});blocks.push(bytes);offset+=bytes.byteLength;accessors.push(a);return accessors.length-1;
  }
  for(const part of model.parts){
    const material=materials.length;
    materials.push({name:`PropDetail_${part.material}`,pbrMetallicRoughness:{baseColorFactor:linearColor(PALETTE[part.material]),metallicFactor:part.material==='steel'?.25:0,roughnessFactor:part.material==='screen'?.45:.86}});
    primitives.push({attributes:{POSITION:attribute(part.positions,true),NORMAL:attribute(part.normals,false)},material,mode:4});
  }
  const json={asset:{version:'2.0',generator:`GermanySimulator ${model.version||DETAIL_VERSION}`},scene:0,scenes:[{nodes:[0]}],nodes:[{name:id,mesh:0,extras:{version:model.version||DETAIL_VERSION,features:model.features}}],meshes:[{name:id,primitives}],materials,buffers:[{byteLength:offset}],bufferViews:views,accessors};
  const text=new TextEncoder().encode(JSON.stringify(json)),jsonLength=(text.length+3)&~3,total=12+8+jsonLength+8+offset;
  const bytes=new Uint8Array(total),view=new DataView(bytes.buffer);
  view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,total,true);
  view.setUint32(12,jsonLength,true);view.setUint32(16,0x4e4f534a,true);bytes.fill(32,20,20+jsonLength);bytes.set(text,20);
  view.setUint32(20+jsonLength,offset,true);view.setUint32(24+jsonLength,0x004e4942,true);
  let cursor=28+jsonLength;for(const block of blocks){bytes.set(block,cursor);cursor+=block.length;}
  return bytes.buffer;
}
