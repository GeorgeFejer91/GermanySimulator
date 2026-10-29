// Optional main-game integration. Nothing runs until the host explicitly mounts the level.
export const levelDefinition=Object.freeze({id:'klein-korinthen',version:2,title:'Klein-Korinthen',achievementId:'klein-korinthen-membership',entry:new URL('../../labor/vereinigung-7f3c9d/index.html',import.meta.url).href});
export function mountKleinKorinthen({container,state,settings={},onState=()=>{},onComplete=()=>{},onExit=()=>{}}){
  if(!(container instanceof HTMLElement))throw new TypeError('A host container is required');
  const channel=crypto.randomUUID(),url=new URL(levelDefinition.entry);url.searchParams.set('embedded','1');url.searchParams.set('channel',channel);
  const frame=document.createElement('iframe');frame.title='Klein-Korinthen · Grand Theft Amt';frame.src=url.href;
  frame.allow='autoplay; fullscreen';Object.assign(frame.style,{width:'100%',height:'100%',border:'0',display:'block'});
  let disposed=false,latest=state,resolveReady,rejectReady;
  const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject});
  const send=(type,payload={})=>{if(!disposed)frame.contentWindow?.postMessage({namespace:'gta-klein-korinthen',channel,type,...payload},url.origin)};
  const timeout=setTimeout(()=>rejectReady(new Error('Klein-Korinthen did not become ready within 30 seconds')),30000);
  function receive(event){
    if(disposed||event.source!==frame.contentWindow||event.origin!==url.origin)return;
    const msg=event.data;if(!msg||msg.namespace!=='gta-klein-korinthen'||msg.channel!==channel)return;
    if(msg.type==='ready')send('init',{state,settings});
    if(msg.type==='initialized'){clearTimeout(timeout);latest=msg.state;resolveReady(handle)}
    if(msg.type==='state'){latest=msg.state;onState(structuredClone(latest))}
    // The host awards/persists any city reward, once per achievementId, in its own controller.
    if(msg.type==='complete')onComplete({levelId:levelDefinition.id,achievementId:levelDefinition.achievementId,state:structuredClone(msg.state)});
    if(msg.type==='exit')onExit(structuredClone(msg.state));
  }
  window.addEventListener('message',receive);
  const handle=Object.freeze({ready,element:frame,pause:()=>send('pause'),resume:()=>send('resume'),setSettings:settings=>send('settings',{settings}),serialize:()=>structuredClone(latest),dispose(){if(disposed)return;send('dispose');disposed=true;clearTimeout(timeout);rejectReady(new DOMException('Level disposed before ready','AbortError'));window.removeEventListener('message',receive);frame.remove();}});
  container.append(frame);return handle;
}
