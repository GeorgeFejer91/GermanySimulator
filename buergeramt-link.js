(function(){
"use strict";
const alphabet="abcdefghijklmnopqrstuvwxyz0123456789";
function randomId(length=24){const bytes=crypto.getRandomValues(new Uint8Array(length));return Array.from(bytes,n=>alphabet[n%alphabet.length]).join("")}
function event(target,type,detail){target.dispatchEvent(new CustomEvent(type,{detail}))}
function sourceOf(value){return typeof value==="string"?value:value?.streamID||value?.streamId||value?.id||""}
// The sender role owns both the message type and its bounded payload.
function validPayload(type,data,sender){
 const shapes=sender==="phone"?{scan:["id"],register:["name"],"phone-hidden":[],answer:["id"],decline:["id"],"sync-pong":["id","receivedAtMs","sentAtMs"],"police-start":["index","mode","readyDelayMs","atMs"],"police-done":["index","mode","durationMs","atMs"]}:
  sender==="host"?{ticket:["number"],forfeit:[],call:["id","line"],"police-line":["index","line"],"sync-ping":["id"],done:[]}:{};
 if(!Object.hasOwn(shapes,type)||!data||typeof data!=="object"||Array.isArray(data))return false;
 const fields=shapes[type],keys=Object.keys(data);
 if(keys.length!==fields.length||keys.some(key=>!fields.includes(key)))return false;
 if(type==="scan")return typeof data.id==="string"&&/^[a-f0-9]{24}$/.test(data.id);
 const clock=value=>Number.isFinite(value)&&value>=0&&value<=1e12;
 if(type==="sync-ping"||type==="sync-pong")return Number.isSafeInteger(data.id)&&data.id>0&&data.id<=2147483647&&
  (type==="sync-ping"||clock(data.receivedAtMs)&&clock(data.sentAtMs)&&data.sentAtMs>=data.receivedAtMs&&data.sentAtMs-data.receivedAtMs<=12000);
 if(type==="police-start"||type==="police-done")return Number.isInteger(data.index)&&data.index>=-1&&data.index<3&&["voice","fallback"].includes(data.mode)&&
  clock(data.atMs)&&(type==="police-start"?Number.isInteger(data.readyDelayMs)&&data.readyDelayMs>=0&&data.readyDelayMs<=60000:Number.isInteger(data.durationMs)&&data.durationMs>=0&&data.durationMs<=60000);
 if(type==="register")return typeof data.name==="string"&&data.name.trim().length>=2&&data.name.length<=80&&!/[\u0000-\u001f\u007f]/.test(data.name);
 if(type==="ticket")return typeof data.number==="string"&&/^B-\d{3}$/.test(data.number);
 if(type==="answer"||type==="decline")return data.id==="grass";
 if(type==="call"||type==="police-line")return typeof data.line==="string"&&data.line.trim().length>0&&data.line.length<350&&
  (type==="call"?data.id==="grass":Number.isInteger(data.index)&&data.index>=0&&data.index<3);
 return true;
}
function validMessage(msg,session,lastSeq,sender){
 if(!msg||typeof msg!=="object"||Array.isArray(msg)||msg.v!==2||msg.session!==session||
  !Number.isSafeInteger(msg.seq)||msg.seq<=0||msg.seq<=lastSeq||typeof msg.type!=="string")return false;
 const {v,session:ignoredSession,seq,type,...payload}=msg;
 return validPayload(type,payload,sender);
}
class AmtLink extends EventTarget{
 constructor(role,invitation){super();this.role=role;this.invitation=invitation;this.sdk=null;this.channel=null;this.peer="";this.seq=0;this.lastSeq=0;this.closed=false;this.viewing=false}
 static invitation(){return{room:`amt-${randomId(16)}`,secret:randomId(32),stream:`amt-ticket-${randomId(16)}`}}
 static phoneUrl(invitation,englishSubtitles=false){const url=new URL("./buergeramt-phone.html",location.href),params=new URLSearchParams(invitation);url.searchParams.set("v","20261006-call-ui-sync3");if(englishSubtitles)params.set("captions","en");url.hash=params.toString();return url.href}
 static fromHash(){const p=new URLSearchParams(location.hash.slice(1)),room=p.get("room"),secret=p.get("secret"),stream=p.get("stream");if(!room?.startsWith("amt-")||!stream?.startsWith("amt-ticket-")||!/^[a-z0-9]{32}$/.test(secret||""))return null;return{room,secret,stream}}
 async start(){if(typeof VDONinjaSDK!=="function")throw new Error("VDO.Ninja Verbindung fehlt");
  const sdk=new VDONinjaSDK({password:this.invitation.secret,salt:"germany-simulator-amt-v1"});this.sdk=sdk;
  sdk.addEventListener("error",e=>event(this,"status",e.detail?.message||"Verbindungsfehler"));
  sdk.addEventListener("connectionFailed",()=>event(this,"status","Verbindung unterbrochen"));
  sdk.addEventListener("dataChannelClose",e=>{if(e.detail?.uuid===this.peer){this.channel=null;this.peer="";event(this,"status","Telefon getrennt")}});
  if(this.role==="host"){
   sdk.addEventListener("dataChannelOpen",e=>{const uuid=e.detail?.uuid;if(!uuid||this.closed||this.peer&&this.peer!==uuid)return;this.openHostChannel(uuid)});
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
 async openHostChannel(uuid){try{const channel=await this.sdk.openChannel(uuid,"amt-events",{ordered:true});if(!this.closed)this.attach(uuid,channel);else channel.close()}catch(e){event(this,"status",e.message||"Telefonkanal fehlgeschlagen")}}
 attach(uuid,channel){
  if(this.closed||!channel||this.channel?.readyState==="open")return;
  this.peer=uuid;this.channel=channel;this.lastSeq=0;
  const current=()=>!this.closed&&this.channel===channel;
  channel.addEventListener("message",e=>{
   if(!current()||channel.readyState!=="open"||typeof e.data!=="string"||e.data.length>1024)return;
   if(new TextEncoder().encode(e.data).byteLength>1024)return;
   let msg;try{msg=JSON.parse(e.data)}catch{return}
   if(!validMessage(msg,this.invitation.stream,this.lastSeq,this.role==="host"?"phone":"host"))return;
   this.lastSeq=msg.seq;event(this,"message",msg);
  });
  channel.addEventListener("close",()=>{if(current()){this.channel=null;this.peer="";this.viewing=false;event(this,"status","Telefon getrennt")}});
  let announced=false;
  const ready=()=>{if(current()&&!announced&&channel.readyState==="open"){announced=true;event(this,"connected",{});event(this,"status","Telefon verbunden")}};
  if(channel.readyState==="open")ready();else channel.addEventListener("open",ready,{once:true});
 }
 send(type,data={}){
  if(this.closed||this.channel?.readyState!=="open"||this.channel.bufferedAmount>65536)return false;
  try{
   if(!validPayload(type,data,this.role)||!Number.isSafeInteger(this.seq+1))return false;
   const msg={...data,v:2,session:this.invitation.stream,seq:this.seq+1,type},encoded=JSON.stringify(msg);
   if(new TextEncoder().encode(encoded).byteLength>1024)return false;
   this.seq=msg.seq;this.channel.send(encoded);return true;
  }catch{return false}
 }
 close(){this.closed=true;const channel=this.channel,sdk=this.sdk;this.channel=null;this.sdk=null;this.peer="";try{channel?.close()}catch{}try{sdk?.disconnect?.()?.catch?.(()=>{})}catch{}}
}
window.BuergeramtLink=AmtLink;
})();
