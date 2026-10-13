"use strict";
const root=new URL('./',self.location.href),modelRoot=new URL('assets/voices/knick/browser/',root);
const vendor=new URL('assets/vendor/piper-phonemize/1.0.0/',root);
let engine=null,manifest=null,tails=null;
const counterWords=['eins','zwei','drei','vier'];
async function sha(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')}
async function decompress(bytes,maximum){
 const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),chunks=[];
 let size=0;
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;
  if(size>maximum){await reader.cancel();throw Error('model-size')}chunks.push(part.value)}
 const output=new Uint8Array(size);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length}return output;
}
async function load(cachedBytes){
 const response=await fetch(new URL('manifest.json',modelRoot),{cache:'no-store'});
 if(!response.ok)throw Error('manifest');
 manifest=await response.json();
 if(manifest.voiceId!=='amt-brunhilde-knick'||manifest.profileId!=='b080c7d95ecd418fb428282461d7fbe7'||
    manifest.referenceSha256!=='901e9ad60eda5cbb36337b12864b6a2b0d133570acb90941b9eabd9888c16351'||
    !/^knick-[a-f0-9]{12}\.onnx\.bin$/.test(manifest.model)||manifest.sampleRate!==22050||manifest.compression!=='gzip'||
    !Number.isSafeInteger(manifest.bytes)||manifest.bytes<1000000||manifest.bytes>20000000||
    !Number.isSafeInteger(manifest.downloadBytes)||manifest.downloadBytes<=0||manifest.downloadBytes>20000000||
    !/^[a-f0-9]{64}$/.test(manifest.sha256)||!/^[a-f0-9]{64}$/.test(manifest.downloadSha256))throw Error('voice');
 importScripts(new URL('assets/vendor/onnxruntime/1.18.0/ort.wasm.min.js',root).href,
               new URL('piper_phonemize.js',vendor).href);
 ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;
 ort.env.wasm.wasmPaths=new URL('assets/vendor/onnxruntime/1.18.0/',root).href;
 ort.env.logLevel='error';
 let encodedBytes=cachedBytes;
 if(!(encodedBytes instanceof ArrayBuffer)||encodedBytes.byteLength!==manifest.downloadBytes||await sha(encodedBytes)!==manifest.downloadSha256){
  const response=await fetch(new URL(manifest.model,modelRoot),{cache:'no-store'});if(!response.ok)throw Error('model');
  encodedBytes=await response.arrayBuffer();
  if(encodedBytes.byteLength!==manifest.downloadBytes||await sha(encodedBytes)!==manifest.downloadSha256)throw Error('model-hash');
 }
 const modelBytes=await decompress(encodedBytes,manifest.bytes);
 if(modelBytes.byteLength!==manifest.bytes||await sha(modelBytes)!==manifest.sha256)throw Error('model-hash');
 const session=await ort.InferenceSession.create(modelBytes,
                {executionProviders:['wasm'],graphOptimizationLevel:'all'});
 if(manifest.nameContextFrames!==16||manifest.contextSuffix!==', bitte zu Schalter eins!'||
    !Array.isArray(manifest.counterTails)||manifest.counterTails.length!==4)throw Error('parts');
 tails=await Promise.all(manifest.counterTails.map(async(part,index)=>{
  if(part.counter!==index+1||part.file!==`counter-${index+1}.wav`||part.sampleRate!==22050||part.channels!==1||
     part.profileId!==manifest.profileId||part.referenceSha256!==manifest.referenceSha256||
     !Number.isSafeInteger(part.bytes)||part.bytes<44||part.bytes>400000||!/^[a-f0-9]{64}$/.test(part.sha256))throw Error('part');
  const response=await fetch(new URL(part.file,modelRoot),{cache:'no-store'});if(!response.ok)throw Error('part');
  const bytes=await response.arrayBuffer();if(bytes.byteLength!==part.bytes||await sha(bytes)!==part.sha256)throw Error('part-hash');
  const view=new DataView(bytes);
  if(view.getUint32(0,false)!==0x52494646||view.getUint32(8,false)!==0x57415645||
     view.getUint32(12,false)!==0x666d7420||view.getUint32(16,true)!==16||view.getUint16(20,true)!==1||
     view.getUint16(22,true)!==1||view.getUint32(24,true)!==22050||view.getUint16(34,true)!==16||
     view.getUint32(36,false)!==0x64617461||view.getUint32(40,true)!==bytes.byteLength-44||
     (bytes.byteLength-44)%2)throw Error('part-format');
  const pcm=new Float32Array((bytes.byteLength-44)/2);for(let i=0;i<pcm.length;i++)pcm[i]=view.getInt16(44+i*2,true)/32768;
  return pcm;
 }));
 self.postMessage({kind:'model-buffer',bytes:encodedBytes,profileId:manifest.profileId,
   referenceSha256:manifest.referenceSha256},[encodedBytes]);
 return session;
}
function wav(samples){
 const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);
 const label=(at,text)=>{for(let i=0;i<text.length;i++)view.setUint8(at+i,text.charCodeAt(i))};
 label(0,'RIFF');view.setUint32(4,buffer.byteLength-8,true);label(8,'WAVE');label(12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,22050,true);view.setUint32(28,44100,true);view.setUint16(32,2,true);
 view.setUint16(34,16,true);label(36,'data');view.setUint32(40,samples.length*2,true);
 let peak=0,sum=0;
 for(const value of samples){if(!Number.isFinite(value))throw Error('samples');peak=Math.max(peak,Math.abs(value));sum+=value*value}
 if(peak<.001||Math.sqrt(sum/samples.length)<.001)throw Error('silence');
 const gain=Math.min(.85/peak,.1/Math.sqrt(sum/samples.length));
 for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]*gain))*32767),true);
 return buffer;
}
self.onmessage=async event=>{
 const {id,text,modelBytes}=event.data;
 if(!Number.isSafeInteger(id)||typeof text!=='string'||text.length<3||text.length>160||/[\u0000-\u001f\u007f-\u009f]/.test(text))return;
 try{
  const started=performance.now();engine??=load(modelBytes);const session=await engine;
  const counter=counterWords.findIndex(word=>text.endsWith(`, bitte zu Schalter ${word}!`));
  if(counter<0)throw Error('text');
  const name=text.slice(0,-(`, bitte zu Schalter ${counterWords[counter]}!`).length);
  const contextText=name+manifest.contextSuffix;
  // The packaged CLI retains parser state; each invocation needs its own module.
  let printed=null;
  const phonemizer=await createPiperPhonemize({noInitialRun:true,locateFile:file=>new URL(file,vendor).href,
   print:value=>{printed=JSON.parse(value).phoneme_ids},printErr:()=>{}});
  phonemizer.callMain(['-l','de','--input',JSON.stringify([{text:contextText}]),'--espeak_data','/espeak-ng-data']);
  if(!Array.isArray(printed)||!printed.length||printed.length>1500||printed.some(n=>!Number.isInteger(n)||n<0||n>=256))throw Error('phonemes');
  const end=printed.lastIndexOf(8);if(end<1)throw Error('name');
  const count=printed.length,input=BigInt64Array.from(printed,BigInt),length=BigInt64Array.of(BigInt(count));
  const output=await session.run({input:new ort.Tensor('int64',input,[1,count]),
    input_lengths:new ort.Tensor('int64',length,[1]),scales:new ort.Tensor('float32',Float32Array.of(0,1.2,0),[3]),
    name_end:new ort.Tensor('int64',BigInt64Array.of(BigInt(end)),[1])});
  const samples=output.output.data,duration=samples.length/22050;
  if(duration<.2||duration>20)throw Error('duration');
  // Normalize the name once. Fixed tails were prepared offline from this voice.
  const nameWav=wav(samples),nameView=new DataView(nameWav),pcm=new Float32Array(samples.length);
  for(let i=0;i<pcm.length;i++)pcm[i]=nameView.getInt16(44+i*2,true)/32768;
  const fade=Math.min(110,pcm.length);for(let i=0;i<fade;i++)pcm[pcm.length-fade+i]*=1-i/(fade-1);
  const variants=[];
  for(let index=0;index<4;index++){
   const tail=tails[index],joined=new Float32Array(pcm.length+tail.length);joined.set(pcm);joined.set(tail,pcm.length);
   for(let i=0;i<Math.min(110,tail.length);i++)joined[pcm.length+i]*=i/109;
   const buffer=wav(joined);
   variants.push({text:`${name}, bitte zu Schalter ${counterWords[index]}!`,wav:buffer,duration:joined.length/22050,sha256:await sha(buffer)});
  }
  const selected=variants[counter],buffer=selected.wav;
  self.postMessage({id,text,status:'ready',wav:buffer,duration:selected.duration,sha256:selected.sha256,variants,
     generationMs:performance.now()-started,profileId:manifest.profileId,
     referenceSha256:manifest.referenceSha256},variants.map(part=>part.wav));
 }catch{
  self.postMessage({id,text,status:'failed',reason:'synthesis'});
 }
};
