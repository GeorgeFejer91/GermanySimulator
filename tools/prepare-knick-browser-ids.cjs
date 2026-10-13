// Use the shipped phonemizer for both training and independent inference probes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),vendor=path.join(root,'assets/vendor/piper-phonemize/1.0.0');
const create=require(path.join(vendor,'piper_phonemize.js'));
async function phonemize(texts){
 const rows=[];
 for(let start=0;start<texts.length;start+=8){
  const module=await create({noInitialRun:true,wasmBinary:fs.readFileSync(path.join(vendor,'piper_phonemize.wasm')),
   locateFile:file=>path.join(vendor,file),print:line=>rows.push(JSON.parse(line)),printErr:console.error});
  module.callMain(['-l','de','--input',JSON.stringify(texts.slice(start,start+8).map(text=>({text}))),'--espeak_data','/espeak-ng-data']);
 }
 if(rows.length!==texts.length||rows.some((row,i)=>row.text!==texts[i]||!row.phoneme_ids.length))throw Error('Incomplete phonemes');
 return rows;
}
module.exports=phonemize;
if(require.main===module)(async()=>{
 if(process.argv[2]==='--text-input'){
  console.log(JSON.stringify(await phonemize(JSON.parse(fs.readFileSync(0,'utf8')))));return;
 }
 const privateRoot=path.resolve(process.argv[2]||'');
 if(!process.argv[2]||privateRoot===root||privateRoot.startsWith(root+path.sep))throw Error('Supply a private authoring directory outside the checkout');
 const sources=JSON.parse(fs.readFileSync(path.join(privateRoot,'training-sources.json'),'utf8'));
 if(sources.profileId!=='b080c7d95ecd418fb428282461d7fbe7')throw Error('Wrong voice');
 const rows=await phonemize(sources.sources.map(take=>take.text));
 const csv=rows.map((row,i)=>`${sources.sources[i].clipId}.wav|${row.text}|${row.phoneme_ids.join(' ')}`).join('\n')+'\n';
 fs.writeFileSync(path.join(privateRoot,'dataset/metadata-browser.csv'),csv);
 sources.browserPhonemizer=JSON.parse(fs.readFileSync(path.join(vendor,'delivery.json'),'utf8')).delivery;
 sources.browserMetadataSha256=crypto.createHash('sha256').update(csv).digest('hex');
 fs.writeFileSync(path.join(privateRoot,'training-sources.json'),JSON.stringify(sources,null,2));
 console.log(JSON.stringify({takes:rows.length,metadataSha256:sources.browserMetadataSha256}));
})().catch(error=>{console.error(error);process.exitCode=1});
