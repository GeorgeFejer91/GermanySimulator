// The menu is released by the existing asset readiness gate, never by a timer.
globalThis.GermanyPreload = (() => {
  const screen=document.getElementById('preload');
  const meter=document.getElementById('preload-meter'),fill=document.getElementById('preload-fill');
  const value=document.getElementById('preload-value'),status=document.getElementById('preload-status');
  let progress=0,finished=false,menuStarted=false,menuTotal=0,menuSettled=0;
  function prepareMenu(queue){
    if(menuStarted)return;menuStarted=true;
    const images=[...document.querySelectorAll('#intro img')];menuTotal=images.length;
    for(const image of images)queue(()=>image.decode()).catch(()=>{}).finally(()=>menuSettled++);
  }
  function update({renderer=false,total=0,settled=0,ready=false}={}) {
    if(finished)return;
    // Initialization is one stage; the remaining stages count prepared assets.
    ready=ready&&menuStarted&&menuSettled===menuTotal;
    total+=menuTotal;settled+=menuSettled;
    const next=ready?100:Math.min(95,Math.floor((renderer?20:5)+(total?75*settled/total:0)));
    if(next>progress){progress=next;meter.setAttribute('aria-valuenow',String(progress));fill.style.width=progress+'%';fill.style.filter=`grayscale(${100-progress}%)`;value.textContent=progress+' %'}
    if(!ready)return;
    finished=true;screen.hidden=true;screen.setAttribute('aria-busy','false');document.getElementById('app').inert=false;document.body.classList.remove('preloading');
  }
  function fail(){
    if(finished)return;
    status.textContent='LADEN FEHLGESCHLAGEN';document.getElementById('preload-retry').hidden=false;
    meter.setAttribute('aria-invalid','true');
  }
  document.getElementById('preload-retry').onclick=()=>location.reload();
  addEventListener('error',event=>{if(event.target?.tagName==='SCRIPT'||event.error)fail()},true);
  return {prepareMenu,update,fail};
})();
