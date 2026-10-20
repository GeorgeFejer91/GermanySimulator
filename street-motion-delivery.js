import {leaseWithSignal} from './asset-loaders.js?v=20261020-bounded-assets';

const equal=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&Array.from({length:a.length},(_,i)=>Object.hasOwn(a,i)&&Object.hasOwn(b,i)&&a[i]===b[i]).every(Boolean);
const hashPattern=/^[a-f0-9]{64}$/i;
const definitionPath=/^\.\/assets\/characters\/(?:street|street-speakers|residents)\/[a-z0-9_/-]+\.json$/i;
export const STREET_DELIVERY_HASH_FORMAT='typed-json-f64-v1';

function typedDefinition(value){
  if(value===null)return ['null'];
  if(typeof value==='number'){
    if(!Number.isFinite(value))throw new TypeError('Invalid delivery definition number');
    const bytes=new Uint8Array(8);new DataView(bytes.buffer).setFloat64(0,value,false);
    return ['number',Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')];
  }
  if(Array.isArray(value))return ['array',value.map(typedDefinition)];
  if(typeof value==='object')return ['object',Object.keys(value).sort().map(k=>[k,typedDefinition(value[k])])];
  return [typeof value,value];
}

export function streetMotionDeliveryDefinitionBytes(person){
  const {motionDelivery,...source}=person;
  return new TextEncoder().encode(JSON.stringify(typedDefinition(source)));
}

function requiredSlots(person){
  const m=person.atlasMotion,cols=person.grid[0],movement=new Set(),reactions=new Set();
  const put=(set,p)=>set.add(p.row*cols+p.col);
  for(const w of Object.values(m.walks))for(let col=0;col<w.frames;col++)put(movement,{row:w.row,col});
  for(const b of Object.values(m.bridges))for(const col of [...b.stop_cols,...b.start_cols])put(movement,{row:b.row,col});
  for(const t of Object.values(m.transitions))for(const p of t.frames)put(movement,p);
  for(const phases of Object.values(m.settles||{}))for(const settle of Object.values(phases))for(const p of settle.frames)put(movement,p);
  if(m.turns)for(let i=0;i<m.turns.pose_count;i++)put(movement,{row:m.turns.rows[Math.floor(i/cols)],col:i%cols});
  put(movement,m.neutral);put(movement,m.interactions.neutral);
  for(const s of Object.values(m.interactions.states))for(let i=0;i<s.durations_ms.length;i++)put(reactions,{row:s.row,col:s.col+i});
  for(const [clips,set] of [[person.clips,movement],[person.speech?.clips||{},reactions]])for(const c of Object.values(clips))for(let i=0;i<c.count;i++)set.add(c.offset+i);
  return {movement:[...movement].sort((a,b)=>a-b),reactions:[...reactions].sort((a,b)=>a-b)};
}

export function validateStreetMotionDelivery(person,definition=person.motionDelivery){
  if(!person.atlasMotion?.interactions||!person.standing||person.motionRig)throw new TypeError('Street delivery requires native atlas interactions and standing');
  if(definition?.file!==undefined){
    if(!definitionPath.test(definition.file)||definition.file.includes('..')||!hashPattern.test(definition.sha256)||Object.keys(definition).some(k=>!['file','sha256'].includes(k)))throw new TypeError('Invalid street delivery source');
    return null;
  }
  if(definition?.schemaVersion!==1||definition.id!==person.id||!equal(definition.logical?.cell,person.cell)||!equal(definition.logical?.grid,person.grid)||definition.definitionHashFormat!==STREET_DELIVERY_HASH_FORMAT||!hashPattern.test(definition.definitionSha256))throw new TypeError('Street delivery identity, dimensions or definition hash mismatch');
  const required=requiredSlots(person),packs={},slots=person.grid[0]*person.grid[1];
  for(const variant of ['desktop','mobile']){
    const source=definition.sources?.[variant],original=person.variants[variant];
    const cell=[original.width/person.grid[0],original.height/person.grid[1]];
    if(!source||source.file!==original.file||source.sha256!==original.sha256||source.width!==original.width||source.height!==original.height||!equal(source.cell,cell))throw new TypeError('Street delivery source identity mismatch');
  }
  for(const kind of ['movement','reactions']){
    const pack=definition.packs?.[kind],used=required[kind],rows=Math.ceil(used.length/16);
    if(!used.length||!equal(pack?.grid,[16,rows])||!Array.isArray(pack.slots)||pack.slots.length!==rows*16||!Array.from({length:pack.slots.length},(_,i)=>Object.hasOwn(pack.slots,i)&&pack.slots[i]===(used[i]??null)).every(Boolean))throw new RangeError('Invalid street delivery '+kind+' mapping');
    const lookup=new Int32Array(slots);lookup.fill(-1);for(let i=0;i<used.length;i++)lookup[used[i]]=i;
    for(const variant of ['desktop','mobile']){
      const image=pack.variants?.[variant],cell=definition.sources[variant].cell;
      if(!image||!/^\.\/assets\/characters\/(?:street|street-speakers|residents)\/[a-z0-9_/-]+\.webp$/i.test(image.file)||image.file.includes('..')||!hashPattern.test(image.sha256)||image.width!==16*cell[0]||image.height!==rows*cell[1]||image.width>4096||image.height>4096)throw new RangeError('Invalid street delivery '+variant+' image dimensions/source');
      if(image.decodedBytes!==undefined&&image.decodedBytes!==image.width*image.height*4)throw new RangeError('Invalid street delivery decoded cost');
    }
    packs[kind]={...pack,lookup};
  }
  return {sources:definition.sources,packs};
}

export function createStreetMotionDelivery({person,variant,owner,queueAsset,position,acquireDefinition,acquireImage,intent,onChange}){
  let definition=null,definitionLease=null,loaded=false,failed=false,error=null;
  let reactionImage=null,reactionLease=null,reactionJob=null,reactionOwner=null,reactionController=null,reactionFailed=false,reactionError=null,generation=0;
  const wanted=()=>!owner.retired&&!!(intent()?.pending||intent()?.current);
  function stopRequest(){
    if(!reactionOwner&&!reactionController&&!reactionJob)return;
    generation++;if(reactionOwner)reactionOwner.retired=true;reactionController?.abort();reactionController=null;reactionOwner=null;reactionJob=null;
  }
  function releaseReaction(){stopRequest();reactionLease?.release();reactionLease=null;reactionImage=null}
  async function reaction(signal,version,child){
    if(owner.retired||child.retired||signal?.aborted||!wanted())return false;
    const controller=new AbortController();reactionController=controller;
    let lease=null;
    try{
      lease=leaseWithSignal(acquireImage(definition.packs.reactions.variants[variant],signal),controller.signal);
      const image=await lease.promise;
      if(owner.retired||child.retired||version!==generation||signal?.aborted||!wanted())return false;
      reactionLease=lease;lease=null;reactionImage=image;onChange();return true;
    }catch(cause){
      if(!owner.retired&&!child.retired&&version===generation&&!controller.signal.aborted){reactionFailed=true;reactionError=String(cause?.message||cause);onChange()}
      return false;
    }finally{lease?.release();if(version===generation)reactionController=null}
  }
  return {
    async load(signal){
      try{
        let original=person.motionDelivery;
        if(original.file){definitionLease=acquireDefinition(original,signal);original=await definitionLease.promise}
        if(owner.retired||signal?.aborted)return false;
        const compiled=validateStreetMotionDelivery(person,original);
        const digest=new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',streetMotionDeliveryDefinitionBytes(person)));
        if(Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('')!==original.definitionSha256)throw new TypeError('Street delivery full source definition hash mismatch');
        if(owner.retired||signal?.aborted)return false;
        definition=compiled;loaded=true;return true;
      }catch(cause){definitionLease?.release();definitionLease=null;if(!owner.retired){failed=true;error=String(cause?.message||cause)}throw cause}
    },
    movement(){return definition.packs.movement.variants[variant]},
    request(){
      if(!loaded||failed||reactionFailed||reactionImage||reactionJob||!wanted())return reactionJob;
      const child={retired:false},version=++generation;reactionOwner=child;
      reactionJob=queueAsset(position,2,({signal}={})=>reaction(signal,version,child),child);return reactionJob;
    },
    async handoff(signal,slot){
      if(!intent()?.current&&definition.packs.movement.lookup[slot]>=0)return true;
      const child={retired:false},version=++generation;reactionOwner=child;
      return reaction(signal,version,child);
    },
    ready(){return !!reactionImage},
    reactionFailed(){return reactionFailed},
    cancelUnused(){if(!wanted()&&!reactionImage)stopRequest()},
    releaseUnused(){if(!wanted())releaseReaction()},
    pick(slot){
      const movement=definition.packs.movement,index=movement.lookup[slot];
      if(index>=0)return {slot:index,grid:movement.grid,image:null};
      const reactions=definition.packs.reactions,physical=reactions.lookup[slot];
      return reactionImage&&physical>=0?{slot:physical,grid:reactions.grid,image:reactionImage}:null;
    },
    inspect(movementLoaded=false){
      const movement=definition?.packs.movement.variants[variant],reactions=definition?.packs.reactions.variants[variant];
      return {loaded,failed,error,movementLoaded,reactionLoaded:!!reactionImage,reactionRequested:!!reactionJob,reactionFailed,reactionError,reactionJobState:reactionJob?.state||null,
        movementDecodedBytes:movementLoaded?movement.width*movement.height*4:0,reactionDecodedBytes:reactionImage?reactions.width*reactions.height*4:0};
    },
    dispose(){releaseReaction();definitionLease?.release();definitionLease=null;definition=null;loaded=false}
  };
}
