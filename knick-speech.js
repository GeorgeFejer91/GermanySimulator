(function(){
"use strict";
const script=document.currentScript,police=script?.dataset?.voice==='kriminalpolizei';
const voiceId=police?'kriminalpolizei':'amt-brunhilde-knick',counterCount=police?1:4;
const base=new URL('./',script?.src||location.href),cache=new Map(),pending=new Map(),queue=[];
let worker=null,current=null,serial=0,startTimer=null,idleTimer=null,deadlineTimer=null,initialName='',modelBytes=null;
const counters=['','eins','zwei','drei','vier'];
function validName(value){
 if(typeof value!=='string'||value.length>80||/[\u0000-\u001f\u007f-\u009f]/.test(value))return '';
 const name=value.normalize('NFC').trim().replace(/\s+/g,' ');
 return name.length>=2&&name.length<=80&&!/[\u0000-\u001f\u007f-\u009f]/.test(name)?name:'';
}
function textFor(name,counter){return police?`Spricht hier ${name.normalize('NFC')}? Hier ist die Kriminalpolizei am Apparat!`:`${name.normalize('NFC')}, bitte zu Schalter ${counters[counter]}!`}
function englishFor(name,counter){return police?`Is this ${name}? This is the criminal police speaking!`:`${name}, please go to counter ${counter}!`}
function stopWorker(){worker?.terminate();worker=null;clearTimeout(idleTimer);idleTimer=null;clearTimeout(deadlineTimer);deadlineTimer=null}
function finish(result){
 const job=current;if(!job)return;
 current=null;clearTimeout(deadlineTimer);deadlineTimer=null;pending.delete(job.text);
 if(result.status==='ready'){
  for(const variant of result.variants||[]){
   cache.set(variant.text,variant);
   const other=pending.get(variant.text);
   if(other&&other!==job){
    const index=queue.indexOf(other);if(index>=0)queue.splice(index,1);
    pending.delete(other.text);other.resolve(variant);
   }
  }
  const {variants,...ready}=result;result=ready;
  cache.set(job.text,result);
  while(cache.size>8)cache.delete(cache.keys().next().value);
 }
 job.resolve(result);schedule();
 if(!queue.length)idleTimer=setTimeout(stopWorker,5000);
}
function start(){
 startTimer=null;if(document.hidden||current||!queue.length)return;
 clearTimeout(idleTimer);idleTimer=null;current=queue.shift();
 try{
  const freshWorker=!worker;
  if(!worker){
   worker=new Worker(new URL('knick-speech-worker.js?v=20261013-local-name'+(police?'&voice=kriminalpolizei':''),base));
   const instance=worker;
   worker.onmessage=event=>{
    const result=event.data,job=current;
    if(result.kind==='model-buffer'){
     const binding=window.GermanySimulatorAudioText?.productionVoices?.[voiceId];
     if(worker===instance&&binding&&result.profileId===binding.profileId&&result.referenceSha256===binding.referenceSha256&&
        result.bytes instanceof ArrayBuffer&&result.bytes.byteLength>0&&result.bytes.byteLength<=20000000)modelBytes=result.bytes;
     return;
    }
    if(!job||result.id!==job.id||result.text!==job.text)return;
    if(result.status!=='ready'){finish({status:'failed',reason:result.reason||'synthesis'});return}
    const binding=window.GermanySimulatorAudioText?.productionVoices?.[voiceId];
    if(!binding||result.profileId!==binding.profileId||result.referenceSha256!==binding.referenceSha256||
       !(result.wav instanceof ArrayBuffer)||result.wav.byteLength<44||result.wav.byteLength>2*1024*1024||
       !Number.isFinite(result.duration)||result.duration<=0||result.duration>20){
     finish({status:'failed',reason:'voice-binding'});return;
    }
    const variants=[];
    if(result.variants!==undefined){
     if(!Array.isArray(result.variants)||result.variants.length!==counterCount){finish({status:'failed',reason:'variants'});return}
     for(let counter=1;counter<=counterCount;counter++){
      const part=result.variants[counter-1],text=textFor(job.name,counter);
      if(!part||typeof part!=='object'||part.text!==text||!(part.wav instanceof ArrayBuffer)||part.wav.byteLength<44||part.wav.byteLength>2*1024*1024||
         !Number.isFinite(part.duration)||part.duration<=0||part.duration>20||!/^[a-f0-9]{64}$/.test(part.sha256)){
       finish({status:'failed',reason:'variants'});return;
      }
      variants.push({status:'ready',text,english:englishFor(job.name,counter),
        profileId:result.profileId,referenceSha256:result.referenceSha256,duration:part.duration,sha256:part.sha256,
        blob:new Blob([part.wav],{type:'audio/wav'})});
     }
    }
    const selected=variants.find(part=>part.text===job.text);
    finish({...result,...selected,variants,english:job.english,
      blob:selected?.blob||new Blob([result.wav],{type:'audio/wav'}),wav:undefined});
   };
   worker.onerror=()=>{if(worker!==instance)return;stopWorker();finish({status:'failed',reason:'worker'})};
  }
  deadlineTimer=setTimeout(()=>{stopWorker();finish({status:'failed',reason:'timeout'})},180000);
  worker.postMessage({id:current.id,text:current.text,...(freshWorker&&modelBytes?{modelBytes}: {})});
 }catch{stopWorker();finish({status:'failed',reason:'unavailable'})}
}
function schedule(){
 if(startTimer!==null||current||document.hidden||!queue.length)return;
 startTimer=setTimeout(start,50);
}
function prepare(name,counter,priority=true){
 name=validName(name);
 if(!name||!Number.isInteger(counter)||counter<1||counter>counterCount||typeof Worker!=='function')return Promise.resolve({status:'failed',reason:'unavailable'});
 const text=textFor(name,counter),cached=cache.get(text);
 if(cached){cache.delete(text);cache.set(text,cached);return Promise.resolve(cached)}
 if(pending.has(text)){
  const job=pending.get(text),index=queue.indexOf(job);
  if(priority){job.warm=false;if(index>0){queue.splice(index,1);queue.unshift(job)}}
  return job.promise;
 }
 if(pending.size>=12)return Promise.resolve({status:'deferred',reason:'busy'});
 const job={id:++serial,text,name,warm:!priority,english:englishFor(name,counter)};job.promise=new Promise(resolve=>job.resolve=resolve);pending.set(text,job);
 priority?queue.unshift(job):queue.push(job);schedule();return job.promise;
}
function peek(name,counter){return cache.get(textFor(validName(name),counter))||null}
function rememberName(value,{warm=true}={}){
 const name=validName(value);if(!name&&String(value).trim())return;
 if(name!==initialName)for(let i=queue.length-1;i>=0;i--){
  const job=queue[i];if(!job.warm)continue;
  queue.splice(i,1);pending.delete(job.text);job.resolve({status:'failed',reason:'replaced'});
 }
 if(name!==initialName&&current?.warm){stopWorker();finish({status:'disabled',reason:'replaced'})}
 initialName=name;
 if(!warm||!name)return;
 for(let counter=1;counter<=counterCount;counter++)prepare(name,counter,false);
}
function lease(result){
 if(result?.status!=='ready'||!(result.blob instanceof Blob))return null;
 const url=URL.createObjectURL(result.blob);let released=false;
 return {url,text:result.text,voiceId,profileId:result.profileId,
         referenceSha256:result.referenceSha256,durationSeconds:result.duration,sha256:result.sha256,
         english:result.english,
         release(){if(!released){released=true;URL.revokeObjectURL(url)}}};
}
function cancelPreparation(){
 clearTimeout(startTimer);startTimer=null;stopWorker();
 if(current){queue.unshift(current);current=null}
 for(const job of pending.values())job.resolve({status:'disabled',reason:'cancelled'});
 queue.length=0;pending.clear();
}
function dispose(){cancelPreparation();cache.clear();modelBytes=null}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){
  clearTimeout(startTimer);startTimer=null;stopWorker();
  if(current){current.id=++serial;queue.unshift(current);current=null}
 }else schedule();
});
window.addEventListener('pagehide',dispose);
window[police?'GermanyKripoSpeech':'GermanyKnickSpeech']={prepare,peek,rememberName,validName,textFor,lease,cancelPreparation,dispose,
 get initialName(){return initialName},
 inspect(){return{active:!!current,worker:!!worker,pending:pending.size,cached:cache.size}}
};
})();
