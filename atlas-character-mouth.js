import {attachStreetCharacterMouth,validateStreetMouthRegistration} from './street-character-mouth.js';

// Existing native-atlas controllers own poses; native speech owns timing.
// Only the material is private. The decoded atlas remains shared.
export function createAtlasCharacterMouth(T,mesh,actor){
 const shared=mesh.material,material=shared.clone();mesh.material=material;
 const paint=attachStreetCharacterMouth(T,material);
 let disposed=false,checked=null,source=null,cols=0,rows=0,width=0,height=0,frames=null,definitionError=null;
 function prepare(grid){
  const definition=grid?.mouthPaint;
  if(definition===checked&&source===grid?.sourceSha256&&cols===grid?.cols&&rows===grid?.rows&&width===grid?.frameWidth&&height===grid?.frameHeight)return;
  checked=definition;source=grid?.sourceSha256;cols=grid?.cols;rows=grid?.rows;width=grid?.frameWidth;height=grid?.frameHeight;frames=null;definitionError=null;
  if(!definition)return;
  try{
   if(definition.schemaVersion!==1||!/^[a-f0-9]{64}$/.test(source||'')||definition.sourceSha256!==source)throw Error('Atlas mouth source mismatch');
   if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<=0||rows<=0||cols*rows>4096||!(width>0&&height>0)||definition.cell?.[0]!==width||definition.cell?.[1]!==height||definition.grid?.[0]!==cols||definition.grid?.[1]!==rows)throw Error('Atlas mouth dimensions mismatch');
   if(!Array.isArray(definition.frames)||definition.frames.length!==cols*rows)throw Error('Atlas mouth coverage mismatch');
   const converted=[];
   for(let slot=0;slot<definition.frames.length;slot++){
    const registration=validateStreetMouthRegistration(definition.frames[slot],'native atlas cell '+slot);
    if(registration===null){converted.push(null);continue}
    const r=registration.rect,col=slot%cols,row=Math.floor(slot/cols);
    converted.push({rect:[(col+r[0])/cols,(rows-row-1+r[1])/rows,r[2]/cols,r[3]/rows],axes:registration.axes,profile:registration.profile});
   }
   frames=converted;
  }catch(error){definitionError=String(error.message||error)}
 }
 function sync(grid,pose,speech,paused=false){
  if(disposed)return false;
  prepare(grid);
  const row=pose?.spriteRow??0,col=pose?.spriteFrame??0,image=material.map?.image;
  const selected=frames&&Number.isInteger(row)&&Number.isInteger(col)&&row>=0&&row<rows&&col>=0&&col<cols&&
   (image?.naturalWidth||image?.width)===cols*width&&(image?.naturalHeight||image?.height)===rows*height?frames[row*cols+col]:null;
  const speaking=!!(speech&&speech.actorId===actor.id&&speech.voiceId===actor.voiceId&&speech.cueToken&&speech.speechStatus==='playing'&&Number.isFinite(speech.mouthOpen));
  return paint.sync({texture:material.map,registration:selected,speaking,opening:speaking?speech.mouthOpen:0,paused:paused||speech?.paused===true});
 }
 function dispose(){
  if(disposed)return;disposed=true;paint.dispose();frames=checked=null;
  if(mesh.material===material)mesh.material=shared;
  material.dispose();
 }
 return{sync,dispose,inspect:()=>({...paint.inspect(),definitionError})};
}
