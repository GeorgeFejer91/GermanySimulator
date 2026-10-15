// Pure source-bound geometry. Playback, asset leases and world movement belong to the host.
const DIRECTIONS=['down','right','up','left'];
export const STREET_RIG_LIMITS=Object.freeze({vertices:256,triangles:128});
const MAX_VERTICES=STREET_RIG_LIMITS.vertices,MAX_TRIANGLES=STREET_RIG_LIMITS.triangles,MAX_PARTS=16,MAX_POLYGONS=128,POLYGON_VERTICES=12;
const EPS=1e-8,validated=new WeakSet();
const finite=value=>typeof value==='number'&&Number.isFinite(value);
function requireValue(condition,message){if(!condition)throw new TypeError(`Street rig: ${message}`)}
function vector(value,length,label){requireValue(Array.isArray(value)&&value.length===length&&value.every(finite),`${label} needs ${length} finite values`)}

export function validateStreetCharacterRigDefinition(def){
  requireValue(def&&def.schemaVersion===1&&def.format==='gs-painted-parts','unsupported definition');
  requireValue(typeof def.id==='string'&&def.id.length>0,'identity missing');
  const skeleton=def.skeleton;
  requireValue(skeleton&&Array.isArray(skeleton.legs)&&skeleton.legs.length===2,'two physical legs required');
  requireValue(finite(skeleton.pelvisY)&&skeleton.pelvisY>0,'finite positive pelvis height required');
  for(const leg of skeleton.legs){
    vector(leg.hip,3,'hip');vector(leg.ankleOffset,3,'ankle offset');
    requireValue(finite(leg.soleX)&&finite(leg.upperLength)&&leg.upperLength>0&&finite(leg.lowerLength)&&leg.lowerLength>0,'invalid physical bones');
  }
  const gait=def.gait;
  requireValue(gait&&['excursionWorld','liftWorld','baseHipDrop','maxHipDrop','strideDistance'].every(k=>finite(gait[k])&&gait[k]>=0),'invalid gait');
  requireValue(gait.strideDistance>0&&gait.maxHipDrop>=gait.baseHipDrop,'invalid gait limits');
  requireValue(def.views&&typeof def.views==='object','views missing');
  for(const direction of DIRECTIONS){
    const view=def.views[direction];requireValue(view&&Array.isArray(view.parts)&&view.parts.length>0&&view.parts.length<=MAX_PARTS,`${direction} parts missing/unbounded`);
    requireValue(view.parts[0].type==='billboard','first part must own the upper billboard');
    let vertices=0,triangles=0;
    for(const part of view.parts){
      requireValue(['billboard','bone-ribbon','sole-upright'].includes(part.type),'unknown source binding');
      requireValue(Array.isArray(part.vertices)&&part.vertices.length>=3&&part.vertices.length<=12,'invalid part vertices');
      for(const vertex of part.vertices){vector(vertex,2,'bound vertex');requireValue(vertex.every(v=>Math.abs(v)<=8),'source binding outside bounded figure');if(part.type==='bone-ribbon')requireValue(vertex[0]>=-4&&vertex[0]<=4,'bone fraction outside source overlap bound')}
      requireValue(Array.isArray(part.uvs)&&part.uvs.length===part.vertices.length,'UV binding missing');
      for(const uv of part.uvs){vector(uv,2,'UV');requireValue(uv.every(v=>v>=0&&v<=1),'UV outside source atlas')}
      requireValue(Array.isArray(part.triangles)&&part.triangles.length>0,'part topology missing');
      for(const triangle of part.triangles){vector(triangle,3,'triangle');requireValue(triangle.every(i=>Number.isInteger(i)&&i>=0&&i<part.vertices.length),'triangle index outside bound source part')}
      if(part.type!=='billboard')requireValue(part.leg===0||part.leg===1,'part physical leg missing');
      if(part.type==='bone-ribbon')requireValue(part.bone==='upper'||part.bone==='lower','part bone missing');
      vertices+=part.vertices.length;triangles+=part.triangles.length;
    }
    requireValue(vertices<=MAX_VERTICES&&triangles<=MAX_TRIANGLES,`${direction} geometry exceeds packet bound`);
    if(view.upperClips)for(const [name,clip] of Object.entries(view.upperClips)){
      requireValue(name.length>0&&Array.isArray(clip.frames)&&clip.frames.length>0&&clip.frames.length<=32,'invalid upper clip');
      for(const frame of clip.frames){
        requireValue(Array.isArray(frame.uvs)&&frame.uvs.length===view.parts[0].vertices.length,'upper frame UV binding missing');
        for(const uv of frame.uvs){vector(uv,2,'upper UV');requireValue(uv.every(v=>v>=0&&v<=1),'upper UV outside atlas')}
        requireValue(frame.jumpWorld===undefined||(finite(frame.jumpWorld)&&frame.jumpWorld>=0),'invalid jump');
      }
    }
  }
  if(def.mouthRegistration!==undefined)validateStreetCharacterMouthRegistration(def);
  validated.add(def);return def;
}

function packet(){
  return {positionsWorld:new Float64Array(MAX_VERTICES*3),uvs:new Float32Array(MAX_VERTICES*2),indices:new Uint16Array(MAX_TRIANGLES*3),
    trianglePartIds:new Uint16Array(MAX_TRIANGLES),vertexCount:0,triangleCount:0,feetWorld:new Float64Array(6),
    jointsWorld:new Float64Array(18),bounds:new Float64Array(6),supportFoot:0,pose:{},scratch:new Float64Array(32)};
}
function checkPacket(out){
  requireValue(out.positionsWorld instanceof Float64Array&&out.positionsWorld.length>=MAX_VERTICES*3&&out.uvs instanceof Float32Array&&out.uvs.length>=MAX_VERTICES*2&&out.indices instanceof Uint16Array&&out.indices.length>=MAX_TRIANGLES*3,'packet buffers too small');
  requireValue(out.trianglePartIds instanceof Uint16Array&&out.trianglePartIds.length>=MAX_TRIANGLES&&out.feetWorld instanceof Float64Array&&out.feetWorld.length>=6&&out.jointsWorld instanceof Float64Array&&out.jointsWorld.length>=18&&out.bounds instanceof Float64Array&&out.bounds.length>=6&&out.scratch instanceof Float64Array&&out.scratch.length>=32,'packet metadata buffers too small');
}
function footAt(phase,out,offset){
  phase=((phase%1)+1)%1;
  out[offset]=phase<.5?1-4*phase:-Math.cos(Math.PI*(phase-.5)*2);
  out[offset+1]=phase<.5?0:Math.sin(Math.PI*(phase-.5)*2)**2;
  out[offset+2]=phase<.5?1:0;
}
function basis(frame,out){
  for(const [key,value] of Object.entries({rootWorld:frame.rootWorld,forwardWorld:frame.forwardWorld}))vector(value,3,key);
  requireValue(Math.abs(frame.forwardWorld[1])<EPS,'forward must be horizontal');
  const f=frame.forwardWorld,length=Math.hypot(f[0],f[2]);requireValue(length>EPS,'forward is zero');
  out[0]=f[0]/length;out[1]=f[2]/length;out[2]=out[1];out[3]=-out[0];
  for(const name of ['position','right','up','forward'])vector(frame.camera?.[name],3,`camera ${name}`);
  for(const name of ['right','up','forward'])requireValue(Math.abs(Math.hypot(...frame.camera[name])-1)<1e-5,'camera basis must be normalized');
  const r=frame.camera.right,u=frame.camera.up,fwd=frame.camera.forward;
  requireValue(Math.abs(r[0]*u[0]+r[1]*u[1]+r[2]*u[2])<1e-5&&Math.abs(r[0]*fwd[0]+r[1]*fwd[1]+r[2]*fwd[2])<1e-5&&Math.abs(u[0]*fwd[0]+u[1]*fwd[1]+u[2]*fwd[2])<1e-5,'camera basis must be orthogonal');
  requireValue(Math.abs(r[1])<1e-5,'pilot camera roll unsupported');
}
function localPoint(local,root,b,out,index){
  out[index]=root[0]+b[2]*local[0]+b[0]*local[2];out[index+1]=root[1]+local[1];out[index+2]=root[2]+b[3]*local[0]+b[1]*local[2];
}
function solveKnee(j,index,upper,lower,forwardX,forwardZ){
  const ax=j[index],ay=j[index+1],az=j[index+2],tx=j[index+6]-ax,ty=j[index+7]-ay,tz=j[index+8]-az;
  const distance=Math.hypot(tx,ty,tz);requireValue(distance>Math.abs(upper-lower)+EPS&&distance<=upper+lower+EPS,'physical leg target outside reach');
  const x=tx/distance,y=ty/distance,z=tz/distance,dot=forwardX*x+forwardZ*z;
  let bx=forwardX-x*dot,by=-y*dot,bz=forwardZ-z*dot;const length=Math.hypot(bx,by,bz);requireValue(length>EPS,'ambiguous knee bend');bx/=length;by/=length;bz/=length;
  const along=(upper*upper-lower*lower+distance*distance)/(2*distance),bend=Math.sqrt(Math.max(0,upper*upper-along*along));
  j[index+3]=ax+x*along+bx*bend;j[index+4]=ay+y*along+by*bend;j[index+5]=az+z*along+bz*bend;
}

export function sampleStreetCharacterRig(def,pose,frame,out){
  if(!validated.has(def))validateStreetCharacterRigDefinition(def);
  requireValue(pose&&DIRECTIONS.includes(pose.direction)&&['walk','settle','hold'].includes(pose.mode),'unsupported pose');
  requireValue(finite(pose.phase)&&pose.phase>=0&&pose.phase<1&&finite(pose.settle)&&pose.settle>=0&&pose.settle<=1,'invalid phase/settle');
  const contacts=pose.contacts;
  requireValue(contacts==null||typeof contacts==='object'&&!Array.isArray(contacts),'contact override must be an object');
  if(contacts){
    vector(contacts.rootWorld,3,'contact root');
    vector(contacts.forwardWorld,3,'contact forward');
    vector(contacts.feetWorld,6,'contact feet');
    for(const [values,length] of [[contacts.rootWorld,3],[contacts.forwardWorld,3],[contacts.feetWorld,6]])for(let i=0;i<length;i++)requireValue(Object.hasOwn(values,i)&&finite(values[i]),'contact vectors require owned finite coordinates');
    requireValue(contacts.rootWorld.every((v,i)=>Math.abs(v-frame.rootWorld[i])<EPS),'contact root differs from accepted root');
    requireValue(contacts.supportFoot===0||contacts.supportFoot===1,'contact support identity missing');
    requireValue(finite(contacts.hipDrop)&&contacts.hipDrop>=def.gait.baseHipDrop&&contacts.hipDrop<=def.gait.maxHipDrop,'contact hip drop outside source range');
  }
  out??=packet();checkPacket(out);const b=out.scratch;basis(contacts?{...frame,forwardWorld:contacts.forwardWorld}:frame,b);
  const view=def.views[pose.direction],gait=def.gait,root=frame.rootWorld,j=out.jointsWorld,soles=out.feetWorld;
  let upperFrame=null,jump=0;
  if(pose.upper){
    const clip=view.upperClips?.[pose.upper.clip];requireValue(clip&&Number.isInteger(pose.upper.frame)&&pose.upper.frame>=0&&pose.upper.frame<clip.frames.length,'unregistered upper paint');
    upperFrame=clip.frames[pose.upper.frame];jump=upperFrame.jumpWorld||0;
  }
  requireValue(!contacts||jump===0,'ground contact override cannot consume an airborne upper action');
  footAt(pose.phase,b,4);footAt(pose.phase+.5,b,7);out.supportFoot=contacts?contacts.supportFoot:b[6]?0:1;
  const settle=pose.mode==='walk'?0:pose.mode==='hold'?1:pose.settle;
  let drop=gait.baseHipDrop;
  for(let leg=0;leg<2;leg++){
    const physical=def.skeleton.legs[leg],f=4+leg*3,si=leg*3,ji=leg*9,forward=gait.excursionWorld*b[f];
    soles[si]=contacts?contacts.feetWorld[si]:root[0]+b[2]*physical.soleX+b[0]*forward;
    soles[si+1]=contacts?contacts.feetWorld[si+1]:root[1]+gait.liftWorld*b[f+1]*(1-settle)+jump;
    soles[si+2]=contacts?contacts.feetWorld[si+2]:root[2]+b[3]*physical.soleX+b[1]*forward;
    if(contacts)requireValue(soles[si+1]>=root[1]-EPS&&soles[si+1]<=root[1]+gait.liftWorld+EPS,'contact sole outside source lift range');
    localPoint(physical.hip,root,b,j,ji);
    j[ji+6]=soles[si]+b[2]*physical.ankleOffset[0]+b[0]*physical.ankleOffset[2];
    j[ji+7]=soles[si+1]+physical.ankleOffset[1];j[ji+8]=soles[si+2]+b[3]*physical.ankleOffset[0]+b[1]*physical.ankleOffset[2];
    j[ji+1]+=jump;
    const horizontal=(j[ji+6]-j[ji])**2+(j[ji+8]-j[ji+2])**2,total=(physical.upperLength+physical.lowerLength)**2;
    requireValue(horizontal<total,'step wider than physical leg reach');
    if(!contacts)drop=Math.max(drop,j[ji+1]-j[ji+7]-Math.sqrt(total-horizontal)+gait.baseHipDrop);
  }
  if(contacts){
    requireValue(Math.abs(soles[contacts.supportFoot*3+1]-root[1])<EPS,'support sole is not grounded');
    drop=contacts.hipDrop;
  }
  requireValue(drop<=gait.maxHipDrop,'step needs excessive hip drop');out.hipDrop=drop;out.jumpWorld=jump;
  for(let leg=0;leg<2;leg++){const physical=def.skeleton.legs[leg];j[leg*9+1]-=drop;solveKnee(j,leg*9,physical.upperLength,physical.lowerLength,b[0],b[1])}
  out.vertexCount=0;out.triangleCount=0;
  const r=frame.camera.right,u=frame.camera.up,bodyY=def.skeleton.pelvisY-drop+jump;
  for(let pi=0;pi<view.parts.length;pi++){
    const part=view.parts[pi],base=out.vertexCount,uvs=pi===0&&upperFrame?upperFrame.uvs:part.uvs;
    for(let vi=0;vi<part.vertices.length;vi++){
      const vertex=part.vertices[vi],index=out.vertexCount++,p=index*3;let x,y,z;
      if(part.type==='billboard'){
        x=root[0]+r[0]*vertex[0]+u[0]*vertex[1];y=root[1]+bodyY+r[1]*vertex[0]+u[1]*vertex[1];z=root[2]+r[2]*vertex[0]+u[2]*vertex[1];
      }else if(part.type==='sole-upright'){
        const si=part.leg*3;x=soles[si]+r[0]*vertex[0];y=soles[si+1]+vertex[1];z=soles[si+2]+r[2]*vertex[0];
      }else{
        const start=part.leg*9+(part.bone==='lower'?3:0),end=start+3,t=vertex[0],width=vertex[1];
        x=j[start]+(j[end]-j[start])*t+r[0]*width;y=j[start+1]+(j[end+1]-j[start+1])*t+r[1]*width;z=j[start+2]+(j[end+2]-j[start+2])*t+r[2]*width;
      }
      out.positionsWorld[p]=x;out.positionsWorld[p+1]=y;out.positionsWorld[p+2]=z;
      out.uvs[index*2]=uvs[vi][0];out.uvs[index*2+1]=uvs[vi][1];
    }
    for(const triangle of part.triangles){const index=out.triangleCount++;out.indices[index*3]=base+triangle[0];out.indices[index*3+1]=base+triangle[1];out.indices[index*3+2]=base+triangle[2];out.trianglePartIds[index]=pi}
  }
  Object.assign(out.pose,{direction:pose.direction,phase:pose.phase,mode:pose.mode,settle});bounds(out);return out;
}

function bounds(out){
  out.bounds.set([Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity]);
  for(let v=0;v<out.vertexCount;v++)for(let axis=0;axis<3;axis++){const value=out.positionsWorld[v*3+axis];out.bounds[axis]=Math.min(out.bounds[axis],value);out.bounds[axis+3]=Math.max(out.bounds[axis+3],value)}
}
function orderingScratch(){
  return {vertices:new Float64Array(MAX_POLYGONS*POLYGON_VERTICES*5),counts:new Uint8Array(MAX_POLYGONS),parts:new Uint16Array(MAX_POLYGONS),
    normals:new Float64Array(MAX_POLYGONS*4),front:new Int16Array(MAX_POLYGONS),back:new Int16Array(MAX_POLYGONS),next:new Int16Array(MAX_POLYGONS),
    splitFront:new Float64Array(POLYGON_VERTICES*5),splitBack:new Float64Array(POLYGON_VERTICES*5),used:0};
}
function copyPolygon(s,id,values,count,part){requireValue(count<=POLYGON_VERTICES,'polygon vertex capacity exceeded');s.vertices.set(values.subarray(0,count*5),id*POLYGON_VERTICES*5);s.counts[id]=count;s.parts[id]=part;s.front[id]=s.back[id]=s.next[id]=-1}
function newPolygon(s){requireValue(s.used<MAX_POLYGONS,'polygon capacity exceeded');return s.used++}
function setPlane(s,id){
  const v=s.vertices,o=id*POLYGON_VERTICES*5,n=id*4;let x=0,y=0,z=0,length=0;
  // Clipping can leave collinear leading vertices; use the largest valid fan triangle.
  for(let i=1;i<s.counts[id]-1;i++){
    const a=o+i*5,b=o+(i+1)*5,ax=v[a]-v[o],ay=v[a+1]-v[o+1],az=v[a+2]-v[o+2],bx=v[b]-v[o],by=v[b+1]-v[o+1],bz=v[b+2]-v[o+2];
    const cx=ay*bz-az*by,cy=az*bx-ax*bz,cz=ax*by-ay*bx,candidate=Math.hypot(cx,cy,cz);
    if(candidate>length){x=cx;y=cy;z=cz;length=candidate}
  }
  if(length<=1e-12)return false;
  x/=length;y/=length;z/=length;s.normals.set([x,y,z,x*v[o]+y*v[o+1]+z*v[o+2]],n);return true;
}
function insertPolygon(s,node,id){
  if(node<0)return setPlane(s,id)?id:-1;
  const v=s.vertices,n=node*4,o=id*POLYGON_VERTICES*5,count=s.counts[id];let positive=false,negative=false;
  for(let i=0;i<count;i++){const k=o+i*5,d=v[k]*s.normals[n]+v[k+1]*s.normals[n+1]+v[k+2]*s.normals[n+2]-s.normals[n+3];positive||=d>EPS;negative||=d<-EPS}
  if(!positive&&!negative){s.next[id]=s.next[node];s.next[node]=id;return node}
  if(!negative){s.front[node]=insertPolygon(s,s.front[node],id);return node}
  if(!positive){s.back[node]=insertPolygon(s,s.back[node],id);return node}
  let fc=0,bc=0;
  for(let i=0;i<count;i++){
    const a=o+i*5,b=o+((i+1)%count)*5,da=v[a]*s.normals[n]+v[a+1]*s.normals[n+1]+v[a+2]*s.normals[n+2]-s.normals[n+3],db=v[b]*s.normals[n]+v[b+1]*s.normals[n+1]+v[b+2]*s.normals[n+2]-s.normals[n+3];
    if(da>=-EPS){requireValue(fc<POLYGON_VERTICES,'split capacity exceeded');s.splitFront.set(v.subarray(a,a+5),fc++*5)}
    if(da<=EPS){requireValue(bc<POLYGON_VERTICES,'split capacity exceeded');s.splitBack.set(v.subarray(a,a+5),bc++*5)}
    if((da>EPS&&db<-EPS)||(da<-EPS&&db>EPS)){
      requireValue(fc<POLYGON_VERTICES&&bc<POLYGON_VERTICES,'split capacity exceeded');const t=da/(da-db);
      for(let channel=0;channel<5;channel++){const value=v[a+channel]+(v[b+channel]-v[a+channel])*t;s.splitFront[fc*5+channel]=s.splitBack[bc*5+channel]=value}fc++;bc++;
    }
  }
  const other=newPolygon(s),part=s.parts[id];copyPolygon(s,id,s.splitFront,fc,part);copyPolygon(s,other,s.splitBack,bc,part);
  s.front[node]=insertPolygon(s,s.front[node],id);s.back[node]=insertPolygon(s,s.back[node],other);return node;
}
function emitPolygon(s,id,out){
  const count=s.counts[id],base=out.vertexCount,offset=id*POLYGON_VERTICES*5;
  requireValue(base+count<=MAX_VERTICES&&out.triangleCount+count-2<=MAX_TRIANGLES,'ordered packet capacity exceeded');
  for(let i=0;i<count;i++){const source=offset+i*5,target=out.vertexCount++;out.positionsWorld.set(s.vertices.subarray(source,source+3),target*3);out.uvs.set(s.vertices.subarray(source+3,source+5),target*2)}
  for(let i=1;i<count-1;i++){const triangle=out.triangleCount++;out.indices.set([base,base+i,base+i+1],triangle*3);out.trianglePartIds[triangle]=s.parts[id]}
}
function traverse(s,node,camera,out){
  if(node<0)return;const n=node*4,front=s.normals[n]*camera[0]+s.normals[n+1]*camera[1]+s.normals[n+2]*camera[2]-s.normals[n+3]>=0;
  traverse(s,front?s.back[node]:s.front[node],camera,out);
  for(let id=node;id>=0;id=s.next[id])emitPolygon(s,id,out);
  traverse(s,front?s.front[node]:s.back[node],camera,out);
}

export function orderStreetCharacterRigPacket(source,cameraWorldPosition,out){
  vector(cameraWorldPosition,3,'camera world position');checkPacket(source);requireValue(source.vertexCount<=MAX_VERTICES&&source.triangleCount<=MAX_TRIANGLES,'source packet exceeds bound');
  if(!out){source.ordered??=packet();out=source.ordered}requireValue(out!==source,'ordering needs separate packet buffers');checkPacket(out);
  out.orderingScratch??=orderingScratch();const s=out.orderingScratch;s.used=0;let tree=-1;
  for(let triangle=0;triangle<source.triangleCount;triangle++){
    const id=newPolygon(s),values=s.splitFront;
    for(let corner=0;corner<3;corner++){const index=source.indices[triangle*3+corner];requireValue(index<source.vertexCount,'source index outside packet');values.set(source.positionsWorld.subarray(index*3,index*3+3),corner*5);values.set(source.uvs.subarray(index*2,index*2+2),corner*5+3)}
    copyPolygon(s,id,values,3,source.trianglePartIds[triangle]);tree=insertPolygon(s,tree,id);
  }
  out.vertexCount=out.triangleCount=0;traverse(s,tree,cameraWorldPosition,out);out.feetWorld.set(source.feetWorld);out.jointsWorld.set(source.jointsWorld);out.supportFoot=source.supportFoot;out.hipDrop=source.hipDrop;out.jumpWorld=source.jumpWorld;Object.assign(out.pose,source.pose);bounds(out);return out;
}

export function projectStreetCharacterRigPacket(source,matrix,viewport,out){
  requireValue((Array.isArray(matrix)||ArrayBuffer.isView(matrix))&&matrix.length===16&&Array.from(matrix).every(finite),'projection needs finite column-major matrix');
  requireValue(viewport&&['x','y','width','height'].every(k=>finite(viewport[k]))&&viewport.width>0&&viewport.height>0,'invalid viewport');
  checkPacket(source);out??=(source.projected??={screenXY:new Float32Array(MAX_VERTICES*2),reciprocalW:new Float32Array(MAX_VERTICES),ndcDepth:new Float32Array(MAX_VERTICES),visible:true});
  requireValue(out.screenXY.length>=MAX_VERTICES*2&&out.reciprocalW.length>=MAX_VERTICES&&out.ndcDepth.length>=MAX_VERTICES,'projection buffers too small');
  out.visible=true;
  for(let i=0;i<source.vertexCount;i++){
    const x=source.positionsWorld[i*3],y=source.positionsWorld[i*3+1],z=source.positionsWorld[i*3+2],w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15],cz=matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14];
    if(w<=EPS||cz<-w){out.visible=false;out.vertexCount=out.triangleCount=0;return out}
    const reciprocal=1/w;out.reciprocalW[i]=reciprocal;out.ndcDepth[i]=cz*reciprocal;
    out.screenXY[i*2]=viewport.x+(1+(matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12])*reciprocal)*viewport.width/2;
    out.screenXY[i*2+1]=viewport.y+(1-(matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13])*reciprocal)*viewport.height/2;
  }
  out.vertexCount=source.vertexCount;out.triangleCount=source.triangleCount;out.uvs=source.uvs;out.indices=source.indices;out.trianglePartIds=source.trianglePartIds;return out;
}

function mouthArray(value,min,max,label){
  requireValue(Array.isArray(value)&&value.length>=min&&value.length<=max,`invalid mouth ${label}`);
  for(let i=0;i<value.length;i++)requireValue(Object.hasOwn(value,i),`sparse mouth ${label}`);
  return value;
}
function mouthVector(value,length,label){
  mouthArray(value,length,length,label);requireValue(value.every(finite),`nonfinite mouth ${label}`);return value;
}
function mouthArea(a,b,c){return ((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2}
function mouthExpectedPoints(profile){
  const [x0,y0,x1,y1]=profile.mouthRect,points=[[x0,y0],[x1,y0],[x0,y1],[x1,y1]],crease=profile.crease;
  for(let i=0;i<crease.length;i++){
    const [x,y]=crease[i],aperture=profile.maxOpening*Math.sin(Math.PI*(x-x0)/(x1-x0))**2;
    if(i===0||i===crease.length-1)points.push([x,y]);else points.push([x,y-.25*aperture],[x,y+.75*aperture]);
  }
  return points;
}
function validateMouthTopology(profile,view){
  const points=mouthArray(profile.points,8,24,'points'),expected=mouthExpectedPoints(profile);
  requireValue(points.length===expected.length,'mouth point correspondence missing');
  for(let i=0;i<points.length;i++){
    mouthVector(points[i],2,'point');requireValue(points[i].every((v,axis)=>Math.abs(v-expected[i][axis])<=1e-9),'mouth points do not follow fitted contours');
  }
  const triangles=mouthArray(profile.triangles,1,48,'triangles');
  requireValue(triangles.length===2*points.length-8,'mouth triangulation count mismatch');
  const distinct=new Set(),edges=new Map();let area=0,winding=0;
  for(const triangle of triangles){
    mouthArray(triangle,3,3,'triangle');requireValue(triangle.every(i=>Number.isInteger(i)&&i>=0&&i<points.length),'mouth triangle index outside points');
    const key=triangle.slice().sort((a,b)=>a-b).join(',');requireValue(!distinct.has(key),'repeated mouth source triangle');distinct.add(key);
    const signed=mouthArea(...triangle.map(i=>points[i])),size=Math.abs(signed);requireValue(size>1e-8,'degenerate mouth source triangle');winding||=Math.sign(signed);requireValue(Math.sign(signed)===winding,'inconsistent mouth source winding');area+=size;
    for(let i=0;i<3;i++){const edge=[triangle[i],triangle[(i+1)%3]].sort((a,b)=>a-b).join(',');edges.set(edge,(edges.get(edge)||0)+1)}
  }
  const [x0,y0,x1,y1]=profile.mouthRect;requireValue(Math.abs(area-(x1-x0)*(y1-y0))<=1e-6,'mouth triangulation area mismatch');
  for(const [edge,count] of edges){
    requireValue(count===1||count===2,'nonmanifold mouth source edge');
    if(count===1){const [a,b]=edge.split(',').map(i=>points[Number(i)]);requireValue(a[0]===b[0]&&(a[0]===x0||a[0]===x1)||a[1]===b[1]&&(a[1]===y0||a[1]===y1),'unclosed mouth source boundary')}
  }
  const groups=mouthArray(profile.groups,1,4,'groups'),seen=new Set();let vertices=16;
  for(const group of groups){
    mouthArray(group,1,48,'group');const used=new Set();
    for(const index of group){requireValue(Number.isInteger(index)&&index>=0&&index<triangles.length&&!seen.has(index),'invalid or repeated mouth group triangle');seen.add(index);for(const i of triangles[index])used.add(i)}
    requireValue(used.size<=12,'mouth part exceeds vertex bound');vertices+=used.size;
  }
  requireValue(seen.size===triangles.length,'mouth group coverage missing');
  const legs=view.parts.slice(1);vertices+=legs.reduce((n,p)=>n+p.vertices.length,0);
  requireValue(4+groups.length+legs.length<=MAX_PARTS&&vertices<=MAX_VERTICES&&8+triangles.length+legs.reduce((n,p)=>n+p.triangles.length,0)<=MAX_TRIANGLES,'mouth mesh exceeds packet bounds');
}
function validateMouthProfile(def,registration,direction){
  const profile=registration.views[direction],view=def.views[direction],upper=view.parts[0];
  requireValue(profile&&typeof profile==='object'&&!Array.isArray(profile),'mouth profile missing');
  requireValue(profile.sourceId===`${def.id}:neutral:${direction}`&&/^[a-f0-9]{64}$/i.test(profile.profileSha256),'mouth source/profile identity missing');
  requireValue(profile.originalUpper?.type==='billboard'&&JSON.stringify(profile.originalUpper.vertices)===JSON.stringify(upper.vertices)&&JSON.stringify(profile.originalUpper.uvs)===JSON.stringify(upper.uvs)&&JSON.stringify(profile.originalUpper.triangles)===JSON.stringify(upper.triangles),'mouth upper source binding mismatch');
  requireValue(upper.vertices.length===4&&upper.uvs.length===4&&JSON.stringify(upper.triangles)==='[[0,1,2],[1,3,2]]','mouth needs original upper quad');
  for(const list of [upper.vertices,upper.uvs])requireValue(list[0][0]===list[2][0]&&list[1][0]===list[3][0]&&list[0][1]===list[1][1]&&list[2][1]===list[3][1]&&list[3][0]>list[0][0],'mouth upper must be rectangular');
  requireValue(upper.vertices[0][1]>upper.vertices[3][1]&&upper.uvs[3][1]>upper.uvs[0][1],'mouth upper has invalid height');
  const bounds=mouthVector(profile.sourceBounds,4,'source bounds'),canvas=registration.sourceCanvas;
  requireValue(bounds[0]>=0&&bounds[1]>=0&&bounds[2]>bounds[0]&&bounds[3]>bounds[1]&&bounds[2]<=canvas[0]&&bounds[3]<=canvas[1],'mouth source crop outside canvas');
  requireValue(finite(profile.sourceScale)&&profile.sourceScale>0&&profile.sourceScale<=4,'mouth scale invalid');mouthVector(profile.sourceOrigin,2,'source origin');
  requireValue(profile.sourceOrigin.every(v=>Math.abs(v)<=8192),'mouth origin outside canvas bound');
  const crease=mouthArray(profile.crease,3,12,'crease');for(const point of crease)mouthVector(point,2,'crease point');
  for(let i=1;i<crease.length;i++)requireValue(crease[i][0]>crease[i-1][0],'mouth crease not monotonic');
  const rect=mouthVector(profile.mouthRect,4,'rect'),ys=crease.map(p=>p[1]),k=profile.sourceScale,o=profile.sourceOrigin;
  requireValue(rect[0]===crease[0][0]&&rect[2]===crease.at(-1)[0]&&rect[1]===Math.min(...ys)-9&&rect[3]===Math.max(...ys)+9,'mouth guard does not bind crease');
  requireValue(rect[0]>=bounds[0]*k+o[0]&&rect[2]<=bounds[2]*k+o[0]&&rect[1]>=bounds[1]*k+o[1]&&rect[3]<=bounds[3]*k+o[1],'mouth guard outside upper source');
  requireValue(finite(profile.maxOpening)&&profile.maxOpening>0&&profile.maxOpening<=8,'mouth opening outside fitted bound');
  validateMouthTopology(profile,view);
}
export function validateStreetCharacterMouthRegistration(def){
  const registration=def.mouthRegistration;if(registration===undefined)return null;
  requireValue(registration?.schemaVersion===1&&registration.character===def.id&&registration.sourceSha256===def.sourceSha256&&registration.atlasSha256===def.variants?.desktop?.sha256,'mouth registration source/atlas mismatch');
  mouthVector(registration.sourceCanvas,2,'source canvas');requireValue(registration.sourceCanvas.every(v=>Number.isInteger(v)&&v>0&&v<=4096),'mouth source canvas unbounded');
  requireValue(registration.views&&Object.keys(registration.views).length===4&&DIRECTIONS.every(d=>Object.hasOwn(registration.views,d))&&registration.views.up===null,'mouth views require explicit rear absence');
  for(const direction of ['down','right','left'])validateMouthProfile(def,registration,direction);
  return registration;
}

const mouthLerp=(a,b,t)=>a+(b-a)*t;
function mouthCreaseAt(points,x){
  if(x<=points[0][0])return points[0][1];
  for(let i=1;i<points.length;i++)if(x<=points[i][0])return mouthLerp(points[i-1][1],points[i][1],(x-points[i-1][0])/(points[i][0]-points[i-1][0]));
  return points.at(-1)[1];
}
function mouthInverseField(profile,x,y,opening,shape){
  if(opening===0)return [x,y];
  const left=profile.crease[0][0],right=profile.crease.at(-1)[0],crease=mouthCreaseAt(profile.crease,x);
  if(x<=left||x>=right||Math.abs(y-crease)>=9)return [x,y];
  const f=(x-left)/(right-left),joined=Math.sin(Math.PI*f)**(shape==='rounded'?2.5:2),guard=Math.exp(-(((y-crease)/5)**4));
  const aperture=profile.maxOpening*opening*joined,upper=crease-.25*aperture,lower=crease+.75*aperture;
  const sy=y<upper?y+(crease-upper)*guard:y>lower?y-(lower-crease)*guard:crease;
  const sx=x-(x-(left+right)/2)*(shape==='rounded'?-.04:0)*opening*joined*guard;return [sx,sy];
}
function mouthTexturePoint(profile,[x,y],target){
  const b=profile.sourceBounds,k=profile.sourceScale,o=profile.sourceOrigin,uv=profile.originalUpper.uvs;
  target[0]=mouthLerp(uv[0][0],uv[3][0],((x-o[0])/k-b[0])/(b[2]-b[0]));target[1]=mouthLerp(uv[0][1],uv[3][1],((y-o[1])/k-b[1])/(b[3]-b[1]));
}
function mouthPart(profile,points,triangles,id){
  const upper=profile.originalUpper,b=profile.sourceBounds,k=profile.sourceScale,o=profile.sourceOrigin;
  const vertices=points.map(([x,y])=>[mouthLerp(upper.vertices[0][0],upper.vertices[3][0],((x-o[0])/k-b[0])/(b[2]-b[0])),mouthLerp(upper.vertices[0][1],upper.vertices[3][1],((y-o[1])/k-b[1])/(b[3]-b[1]))]);
  const uvs=points.map(p=>{const uv=[0,0];mouthTexturePoint(profile,p,uv);return uv});return {id,type:'billboard',vertices,uvs,triangles};
}
function mouthMeshDefinition(def,direction,profile){
  const b=profile.sourceBounds,k=profile.sourceScale,o=profile.sourceOrigin,[left,top,right,bottom]=[b[0]*k+o[0],b[1]*k+o[1],b[2]*k+o[0],b[3]*k+o[1]],[x0,y0,x1,y1]=profile.mouthRect;
  const bands=[[[left,top],[x0,top],[left,bottom],[x0,bottom]],[[x1,top],[right,top],[x1,bottom],[right,bottom]],[[x0,top],[x1,top],[x0,y0],[x1,y0]],[[x0,y1],[x1,y1],[x0,bottom],[x1,bottom]]];
  const bindings=[],parts=bands.map((points,i)=>mouthPart(profile,points,[[0,1,2],[1,3,2]],`mouth-outer-${i}`));
  for(const [index,group] of profile.groups.entries()){
    const ids=[...new Set(group.flatMap(t=>profile.triangles[t]))].sort((a,b)=>a-b),lookup=new Map(ids.map((v,i)=>[v,i])),points=ids.map(i=>profile.points[i]);
    const part=mouthPart(profile,points,group.map(t=>profile.triangles[t].map(i=>lookup.get(i))),`mouth-inner-${index}`);bindings.push({part,points});parts.push(part);
  }
  const candidate={...def,mouthRegistration:undefined,views:{...def.views,[direction]:{...def.views[direction],parts:[...parts,...def.views[direction].parts.slice(1)],upperClips:{}}}};
  validateStreetCharacterRigDefinition(candidate);return {definition:candidate,bindings};
}
export function createStreetCharacterRigSampler(def){
  validateStreetCharacterRigDefinition(def);const registration=def.mouthRegistration;
  if(!registration)return (pose,frame,out)=>sampleStreetCharacterRig(def,pose,frame,out);
  const meshes={};for(const direction of ['down','right','left'])meshes[direction]=mouthMeshDefinition(def,direction,registration.views[direction]);
  return function sample(pose,frame,out){
    const cue=pose.mouth,profile=registration.views[pose.direction];let selected=def;
    if(profile&&!pose.upper&&cue&&cue.sourceId===profile.sourceId&&cue.profileSha256===profile.profileSha256&&finite(cue.opening)&&cue.opening>0&&['open','rounded'].includes(cue.shape)){
      const opening=Math.min(1,cue.opening),mesh=meshes[pose.direction];
      for(const binding of mesh.bindings)for(let i=0;i<binding.points.length;i++){const [x,y]=binding.points[i];mouthTexturePoint(profile,mouthInverseField(profile,x,y,opening,cue.shape),binding.part.uvs[i])}
      selected=mesh.definition;
    }
    return sampleStreetCharacterRig(selected,pose,frame,out);
  };
}
