(function(){
"use strict";
const alphabet="abcdefghijklmnopqrstuvwxyz0123456789";
function randomId(length=24){const bytes=crypto.getRandomValues(new Uint8Array(length));return Array.from(bytes,n=>alphabet[n%alphabet.length]).join("")}
function event(target,type,detail){target.dispatchEvent(new CustomEvent(type,{detail}))}
function sourceOf(value){return typeof value==="string"?value:value?.streamID||value?.streamId||value?.id||""}
class AmtLink extends EventTarget{
 constructor(role,invitation){super();this.role=role;this.invitation=invitation;this.sdk=null;this.channel=null;this.peer="";this.seq=0;this.lastSeq=0;this.closed=false;this.viewing=false}
 static invitation(){return{room:`amt-${randomId(16)}`,secret:randomId(32),stream:`amt-ticket-${randomId(16)}`}}
 static phoneUrl(invitation){const url=new URL("./buergeramt-phone.html",location.href);url.hash=new URLSearchParams(invitation).toString();return url.href}
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
 attach(uuid,channel){if(this.channel&&this.channel.readyState==="open")return;this.peer=uuid;this.channel=channel;channel.addEventListener("message",e=>{if(typeof e.data!=="string"||e.data.length>1024)return;let msg;try{msg=JSON.parse(e.data)}catch{return}if(msg?.v!==1||msg.session!==this.invitation.stream||!Number.isSafeInteger(msg.seq)||msg.seq<=this.lastSeq||typeof msg.type!=="string")return;this.lastSeq=msg.seq;event(this,"message",msg)});channel.addEventListener("close",()=>{if(this.channel===channel){this.channel=null;this.peer="";event(this,"status","Telefon getrennt")}});const ready=()=>{if(this.channel===channel&&!this.closed){event(this,"connected",{});event(this,"status","Telefon verbunden")}};if(channel.readyState==="open")ready();else channel.addEventListener("open",ready,{once:true})}
 send(type,data={}){if(this.channel?.readyState!=="open")return false;const msg={v:1,session:this.invitation.stream,seq:++this.seq,type,...data};const encoded=JSON.stringify(msg);if(encoded.length>1024||this.channel.bufferedAmount>65536)return false;this.channel.send(encoded);return true}
 close(){this.closed=true;try{this.channel?.close()}catch{}try{this.sdk?.disconnect?.()}catch{}this.channel=null;this.sdk=null}
}
window.BuergeramtLink=AmtLink;
})();
