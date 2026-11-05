const directions=['down','right','up','left'];
const transitionNames=new Set(directions.flatMap(a=>directions.filter(b=>b!==a).map(b=>a+'-to-'+b)));
const only=(value,keys)=>value&&Object.keys(value).every(key=>keys.includes(key));
const duration=ms=>Number.isFinite(ms)&&ms>0&&ms<=1000;

function frame([slot,ms],person){
  const [cols,rows]=person.grid||[];
  if(!Number.isInteger(cols)||cols<1||cols>64||!Number.isInteger(rows)||rows<1||rows>64)throw new RangeError('Invalid compact atlas grid');
  if(!Number.isInteger(slot)||slot<0||slot>=cols*rows||!duration(ms))throw new RangeError('Invalid compact frame');
  return {row:Math.floor(slot/cols),col:slot%cols,ms};
}

export function expandStreetManifest(manifest){
  if(!manifest?.characters||Array.isArray(manifest.characters))return manifest;
  if(Object.keys(manifest.characters).length>64)throw new RangeError('Street cast exceeds manifest bound');
  const result={...manifest,characters:{...manifest.characters}};
  for(const [id,person] of Object.entries(manifest.characters)){
    const packed=person?.atlasMotion?.compactClips;if(packed===undefined)continue;
    if(packed?.schemaVersion!==1||!only(packed,['schemaVersion','settles','transitions']))throw new TypeError('Invalid compact clip version or fields');
    const {compactClips,...motion}=person.atlasMotion;
    if(packed.transitions!==undefined){
      if(motion.transitions!==undefined||!packed.transitions||Array.isArray(packed.transitions)||Object.keys(packed.transitions).length!==12)throw new TypeError('Ambiguous or invalid compact transitions');
      motion.transitions={};
      for(const [key,sequence] of Object.entries(packed.transitions)){
        if(!transitionNames.has(key))throw new TypeError('Invalid compact transition name');
        if(!Array.isArray(sequence)||!sequence.length||sequence.length>64||sequence.some(pair=>!Array.isArray(pair)||pair.length!==2))throw new RangeError('Invalid compact transition frames');
        motion.transitions[key]={frames:sequence.map(pair=>frame(pair,person))};
      }
    }
    if(packed.settles!==undefined){
      const stops=packed.settles;
      if(motion.settles!==undefined||!duration(stops?.ms)||!only(stops,['ms','phases'])||!stops.phases||Object.keys(stops.phases).length!==4)throw new TypeError('Ambiguous or invalid compact settles');
      motion.settles={};
      for(const dir of directions){
        const phases=stops.phases[dir],walk=motion.walks?.[dir],bridge=motion.bridges?.[dir];
        if(!Array.isArray(phases)||phases.length!==walk?.frames||phases.length>64||!bridge)throw new RangeError('Invalid compact settle phases');
        motion.settles[dir]={};
        for(const [phase,slots] of phases.entries()){
          if(!Array.isArray(slots)||!slots.length||slots.length>15)throw new RangeError('Invalid compact settle slots');
          motion.settles[dir][phase]={frames:[...slots.map(slot=>frame([slot,stops.ms],person)),{row:bridge.row,col:bridge.stop_cols.at(-1),ms:stops.ms}]};
        }
      }
    }
    result.characters[id]={...person,atlasMotion:motion};
  }
  return result;
}

export function compactStreetManifest(manifest){
  const expanded=expandStreetManifest(manifest),result={...expanded,characters:{...expanded.characters}};
  for(const [id,person] of Object.entries(expanded.characters)){
    if(!person.atlasMotion)continue;
    const motion={...person.atlasMotion},packed={schemaVersion:1},cols=person.grid[0];
    const plainFrame=f=>only(f,['row','col','ms'])&&Object.keys(f).length===3;
    if(motion.transitions&&Object.keys(motion.transitions).length===12&&Object.values(motion.transitions).every(clip=>only(clip,['frames'])&&clip.frames.every(plainFrame))){
      packed.transitions=Object.fromEntries(Object.entries(motion.transitions).map(([key,clip])=>[key,clip.frames.map(f=>[f.row*cols+f.col,f.ms])]));
      delete motion.transitions;
    }
    if(motion.settles){
      const ms=motion.settles.down?.[0]?.frames?.[0]?.ms;
      const compatible=Object.keys(motion.settles).length===4&&duration(ms)&&directions.every(dir=>{
        const phases=motion.settles[dir],bridge=motion.bridges[dir];
        return phases&&Object.keys(phases).length===motion.walks[dir].frames&&Object.entries(phases).every(([phase,clip])=>{
          const frames=clip.frames,last=frames?.at(-1);
          return /^(0|[1-9]\d*)$/.test(phase)&&Number(phase)<motion.walks[dir].frames&&only(clip,['frames'])&&frames.length>=2&&frames.length<=16&&frames.every(f=>plainFrame(f)&&f.ms===ms)&&last.row===bridge.row&&last.col===bridge.stop_cols.at(-1);
        });
      });
      if(compatible){
        packed.settles={ms,phases:Object.fromEntries(directions.map(dir=>[dir,Object.values(motion.settles[dir]).map(clip=>clip.frames.slice(0,-1).map(f=>f.row*cols+f.col))]))};
        delete motion.settles;
      }
    }
    if(Object.keys(packed).length>1){motion.compactClips=packed;result.characters[id]={...person,atlasMotion:motion}}
  }
  return result;
}
