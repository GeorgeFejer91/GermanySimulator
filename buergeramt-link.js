(function(){
"use strict";
const alphabet="abcdefghijklmnopqrstuvwxyz0123456789";
function randomId(length=24){const bytes=crypto.getRandomValues(new Uint8Array(length));return Array.from(bytes,n=>alphabet[n%alphabet.length]).join("")}
function event(target,type,detail){target.dispatchEvent(new CustomEvent(type,{detail}))}
function sourceOf(value){return typeof value==="string"?value:value?.streamID||value?.streamId||value?.id||""}
// The sender role owns both the message type and its bounded payload.
function validPayload(type,data,sender){
 const shapes=sender==="phone"?{scan:["id"],register:["id","name"],"ticket-received":["id","number"],"phone-hidden":[],"phone-visible":[],answer:["id","round"],decline:["id","round"],hangup:["id","round"],"call-ringing":["id","round","atMs"],"call-missed":["id","round"],"sync-pong":["id","receivedAtMs","sentAtMs"],"call-ready":["id","round","atMs"],"call-scheduled":["id","round","atMs","mode","lateMs"],"police-start":["index","mode","readyDelayMs","atMs"],"police-done":["index","mode","durationMs","atMs"]}:
  sender==="host"?{"scan-ready":[],ticket:["number","counter"],"queue-call":["number","counter"],forfeit:[],silence:["id"],"counter-start":[],"call-arm":["id","round"],call:["id","round","line","ringAtPhoneMs","ringAtUtcMs","leadMs"],"police-line":["index","line"],"police-cutoff":["index","stopAtPhoneMs","stopAtUtcMs"],"sync-ping":["id"],"office-tempo":["rate"],done:[]}:{};
 if(!Object.hasOwn(shapes,type)||!data||typeof data!=="object"||Array.isArray(data))return false;
 if(type==="police-start"&&Object.hasOwn(data,"atUtcMs")){
  if(data.atUtcMs!==null&&(!Number.isSafeInteger(data.atUtcMs)||data.atUtcMs<0))return false;
  data={...data};delete data.atUtcMs;
 }
 const fields=shapes[type],keys=Object.keys(data);
 if(keys.length!==fields.length||keys.some(key=>!fields.includes(key)))return false;
 if(type==="office-tempo")return Number.isFinite(data.rate)&&data.rate>=.5&&data.rate<=1;
 if(type==="ticket-received")return typeof data.id==="string"&&/^[a-f0-9]{24}$/.test(data.id)&&typeof data.number==="string"&&/^[A-Z]-\d{1,12}$/.test(data.number);
 if(type==="scan"||type==="register"){if(typeof data.id!=="string"||!/^[a-f0-9]{24}$/.test(data.id))return false;if(type==="scan")return true}
 const clock=value=>Number.isFinite(value)&&value>=0&&value<=1e12;
 if(type==="sync-ping"||type==="sync-pong")return Number.isSafeInteger(data.id)&&data.id>0&&data.id<=2147483647&&
  (type==="sync-ping"||clock(data.receivedAtMs)&&clock(data.sentAtMs)&&data.sentAtMs>=data.receivedAtMs&&data.sentAtMs-data.receivedAtMs<=12000);
 const round=value=>Number.isInteger(value)&&value>=1&&value<=1000000;
 if(type==="call-ready"||type==="call-ringing")return data.id==="grass"&&round(data.round)&&clock(data.atMs);
 if(type==="call-scheduled")return data.id==="grass"&&round(data.round)&&clock(data.atMs)&&["peer","utc","receipt"].includes(data.mode)&&Number.isInteger(data.lateMs)&&data.lateMs>=0&&data.lateMs<=12000;
 if(type==="police-start"||type==="police-done")return Number.isInteger(data.index)&&data.index>=-1&&data.index<4&&["voice","recording","fallback"].includes(data.mode)&&
  clock(data.atMs)&&(type==="police-start"?Number.isInteger(data.readyDelayMs)&&data.readyDelayMs>=0&&data.readyDelayMs<=60000:Number.isInteger(data.durationMs)&&data.durationMs>=0&&data.durationMs<=60000);
 if(type==="register")return typeof data.name==="string"&&data.name.trim().length>=2&&data.name.length<=80&&!/[\u0000-\u001f\u007f]/.test(data.name);
 if(type==="ticket"||type==="queue-call")return typeof data.number==="string"&&/^[A-Z]-\d{1,12}$/.test(data.number)&&Number.isInteger(data.counter)&&data.counter>=1&&data.counter<=4;
 if(type==="answer"||type==="decline"||type==="hangup"||type==="call-missed"||type==="call-arm")return data.id==="grass"&&round(data.round);
 if(type==="silence")return data.id==="grass";
 if(type==="call")return data.id==="grass"&&round(data.round)&&typeof data.line==="string"&&data.line.trim().length>0&&data.line.length<350&&
  (data.ringAtPhoneMs===null||clock(data.ringAtPhoneMs))&&(data.ringAtUtcMs===null||Number.isSafeInteger(data.ringAtUtcMs)&&data.ringAtUtcMs>=0)&&Number.isInteger(data.leadMs)&&data.leadMs>=600&&data.leadMs<=4400;
 if(type==="police-line")return typeof data.line==="string"&&data.line.trim().length>0&&data.line.length<350&&Number.isInteger(data.index)&&data.index>=0&&data.index<4;
 if(type==="police-cutoff")return Number.isInteger(data.index)&&data.index>=-1&&data.index<3&&
  (data.stopAtPhoneMs===null||clock(data.stopAtPhoneMs))&&(data.stopAtUtcMs===null||Number.isSafeInteger(data.stopAtUtcMs)&&data.stopAtUtcMs>=0);
 return true;
}
function validMessage(msg,session,lastSeq,sender){
 if(!msg||typeof msg!=="object"||Array.isArray(msg)||msg.v!==3||msg.session!==session||
  !Number.isSafeInteger(msg.seq)||msg.seq<=0||msg.seq<=lastSeq||typeof msg.type!=="string")return false;
 const {v,session:ignoredSession,seq,type,...payload}=msg;
 return validPayload(type,payload,sender);
}
class AmtLink extends EventTarget{
 constructor(role,invitation){super();this.role=role;this.invitation=invitation;this.sdk=null;this.channel=null;this.peer="";this.seq=0;this.lastSeq=0;this.peers=new Map();this.opening=new Set();this.closed=false;this.viewing=false}
 static invitation(){return{room:`amt-${randomId(16)}`,secret:randomId(32),stream:`amt-ticket-${randomId(16)}`}}
 static phoneUrl(invitation,englishSubtitles=false){const url=new URL("./buergeramt-phone.html",location.href),params=new URLSearchParams(invitation);url.searchParams.set("v","20261013-four-calls");if(new URL(location.href).searchParams.get("voicePreview")==="1")url.searchParams.set("voicePreview","1");if(englishSubtitles)params.set("captions","en");url.hash=params.toString();return url.href}
 static fromHash(){const p=new URLSearchParams(location.hash.slice(1)),room=p.get("room"),secret=p.get("secret"),stream=p.get("stream");if(!room?.startsWith("amt-")||!stream?.startsWith("amt-ticket-")||!/^[a-z0-9]{32}$/.test(secret||""))return null;return{room,secret,stream}}
 async start(){if(typeof VDONinjaSDK!=="function")throw new Error("VDO.Ninja Verbindung fehlt");
  const sdk=new VDONinjaSDK({password:this.invitation.secret,salt:"germany-simulator-amt-v1"});this.sdk=sdk;
  sdk.addEventListener("error",e=>event(this,"status",e.detail?.message||"Verbindungsfehler"));
  sdk.addEventListener("connectionFailed",()=>event(this,"status","Verbindung unterbrochen"));
  sdk.addEventListener("dataChannelClose",e=>this.detach(e.detail?.uuid));
  if(this.role==="host"){
   sdk.addEventListener("dataChannelOpen",e=>{const uuid=e.detail?.uuid;if(!uuid||this.closed)return;this.openHostChannel(uuid)});
  }else{
   const discover=e=>{const list=Array.isArray(e.detail?.list)?e.detail.list:[e.detail];for(const item of list){if(sourceOf(item)===this.invitation.stream)this.viewHost()}};
   sdk.addEventListener("listing",discover);sdk.addEventListener("videoaddedtoroom",discover);
   sdk.addEventListener("channelOpen",e=>{const d=e.detail;if(d?.label==="x-amt-events"&&d.channel)this.attach(d.uuid,d.channel)});
  }
  await sdk.connect();if(this.closed)return;
  await sdk.joinRoom({room:this.invitation.room,password:this.invitation.secret});if(this.closed)return;
  if(this.role==="host")await sdk.announce({streamID:this.invitation.stream,label:"Bürgeramt ticket"});
  else this.viewHost();
  event(this,"status",this.role==="host"?"Telefon wird erwartet":"Wartenummer wird gesucht");
 }
 async viewHost(){if(this.viewing||this.closed)return;this.viewing=true;try{await this.sdk.view(this.invitation.stream,{dataOnly:true,allowresources:false,label:"Bürgeramt Telefon"})}catch(e){this.viewing=false;event(this,"status",e.message||"Verbindung fehlgeschlagen")}}
 async openHostChannel(uuid){
  if(this.closed||this.peers.has(uuid)||this.opening.has(uuid))return;
  this.opening.add(uuid);
  try{const channel=await this.sdk.openChannel(uuid,"amt-events",{ordered:true});if(!this.closed)this.attach(uuid,channel);else channel.close()}catch(e){if(!this.closed)event(this,"status",e.message||"Telefonkanal fehlgeschlagen")}finally{this.opening.delete(uuid)}
 }
 selectPeer(peer){const state=this.peers.get(peer);if(!state)return false;this.peer=peer;this.channel=state.channel;this.seq=state.seq;this.lastSeq=state.lastSeq;return true}
 detach(peer,channel){
  const state=this.peers.get(peer);if(!state||channel&&state.channel!==channel)return;
  this.peers.delete(peer);
  if(this.peer===peer){this.peer="";this.channel=null;this.seq=this.lastSeq=0;const next=this.peers.keys().next().value;if(next)this.selectPeer(next)}
  if(this.role==="phone")this.viewing=false;
  event(this,"disconnected",{peer});if(!this.peers.size)event(this,"status","Telefon getrennt");
 }
 attach(uuid,channel){
  if(this.closed||!uuid||!channel||this.peers.has(uuid)||this.role==="phone"&&this.peers.size)return;
  const state={channel,seq:0,lastSeq:0};this.peers.set(uuid,state);if(!this.peer)this.selectPeer(uuid);
  const current=()=>!this.closed&&this.peers.get(uuid)===state;
  channel.addEventListener("message",e=>{
   if(!current()||channel.readyState!=="open"||typeof e.data!=="string"||e.data.length>1024)return;
   if(new TextEncoder().encode(e.data).byteLength>1024)return;
   let msg;try{msg=JSON.parse(e.data)}catch{return}
   if(!validMessage(msg,this.invitation.stream,state.lastSeq,this.role==="host"?"phone":"host"))return;
   state.lastSeq=msg.seq;if(this.peer===uuid)this.lastSeq=msg.seq;event(this,"message",{...msg,peer:uuid});
  });
  channel.addEventListener("close",()=>{if(current())this.detach(uuid,channel)});
  let announced=false;
  const ready=()=>{if(current()&&!announced&&channel.readyState==="open"){announced=true;event(this,"connected",{peer:uuid});event(this,"status","Telefon verbunden")}};
  if(channel.readyState==="open")ready();else channel.addEventListener("open",ready,{once:true});
 }
 send(type,data={},peer=this.peer){
  const state=this.peers.get(peer),channel=state?.channel;
  if(this.closed||channel?.readyState!=="open"||channel.bufferedAmount>65536)return false;
  try{
   if(!validPayload(type,data,this.role)||!Number.isSafeInteger(state.seq+1))return false;
   const msg={...data,v:3,session:this.invitation.stream,seq:state.seq+1,type},encoded=JSON.stringify(msg);
   if(new TextEncoder().encode(encoded).byteLength>1024)return false;
   channel.send(encoded);state.seq=msg.seq;if(this.peer===peer)this.seq=msg.seq;return true;
  }catch{return false}
 }
 close(){this.closed=true;const channels=[...this.peers.values()].map(state=>state.channel),sdk=this.sdk;this.peers.clear();this.opening.clear();this.channel=null;this.sdk=null;this.peer="";this.seq=this.lastSeq=0;for(const channel of channels)try{channel.close()}catch{}try{sdk?.disconnect?.()?.catch?.(()=>{})}catch{}}
}
window.BuergeramtLink=AmtLink;
})();
