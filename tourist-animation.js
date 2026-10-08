/* Accepted painted character assets; simulation owns distance and planted turns. */
globalThis.TouristAnimations = (() => {
  const loading = new Map();
  const facing = (dx, dy) => Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  const cell = (n, p) => { n.spriteRow=p.row; n.spriteFrame=p.col; n.spriteFlip=false; };
  async function load(url) {
    if (!loading.has(url)) loading.set(url, (async () => {
      const response=await fetch(url); if(!response.ok) throw Error('Tourist manifest '+response.status);
      const manifest=await response.json();
      async function artwork(spec) {
      const art=await fetch(new URL(spec.image,new URL(url,location.href)));
      if(!art.ok) throw Error('Character artwork '+art.status);
      const bytes=new Uint8Array(await art.arrayBuffer());
      if(globalThis.crypto?.subtle) {
        const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
        if(actual!==spec.sha256) throw Error('Tourist artwork hash mismatch');
      }
      const header=new DataView(bytes.buffer);
      const cols=manifest.cols??8,rows=manifest.rows??10;
      const [w,h]=manifest.image_size||[cols*manifest.frame_size[0],rows*manifest.frame_size[1]];
      const webp=spec!==manifest;
      let width,height;
      if(webp) {
        if(bytes.length<25||header.getUint32(0)!==0x52494646||header.getUint32(8)!==0x57454250||header.getUint32(12)!==0x5650384c||bytes[20]!==0x2f)throw Error('Lossless character WebP header');
        const bits=header.getUint32(21,true);width=(bits&0x3fff)+1;height=((bits>>>14)&0x3fff)+1;
      } else {width=header.getUint32(16);height=header.getUint32(20)}
      if(w!==cols*manifest.frame_size[0] || h!==rows*manifest.frame_size[1] || width!==w || height!==h) throw Error('Character atlas dimensions');
      return {manifest,objectURL:URL.createObjectURL(new Blob([bytes],{type:webp?'image/webp':'image/png'}))};
      }
      // PNG masters retain the accepted artwork when delivery fails.
      if(manifest.delivery)try{return await artwork(manifest.delivery)}catch(error){console.warn('Character delivery fallback',error)}
      return artwork(manifest);
    })());
    return loading.get(url);
  }
  function request(n,dx,dy,m) {
    n.touristRequested=facing(dx,dy);
    if(!n.touristFacing) {
      n.touristFacing=n.touristRequested;
      n.gaitDistance=((n.spriteFrame||0)%8)*(m.cycle_distance??24)/8;
    }
    if(!n.touristTurn) cell(n,{row:m.walks[n.touristFacing].row,col:(n.spriteFrame||0)%8});
  }
  function advance(n,distance,dt,m,cycle=24) {
    cycle=m.cycle_distance??cycle;
    if(!n.touristFacing) request(n,n.vx||0,n.vy||0,m);
    const active=n.touristTurn;
    if(active) {
      active.elapsed+=Math.max(0,dt)*1000;
      while(active.elapsed>=active.frames[active.index].ms) {
        active.elapsed-=active.frames[active.index].ms;
        if(++active.index===active.frames.length) {
          n.touristFacing=active.target; n.gaitDistance=0; n.touristTurn=null;
          cell(n,{row:m.walks[active.target].row,col:0}); return false;
        }
      }
      cell(n,active.frames[active.index]); return false;
    }
    if(!(distance>.001)) return false;
    const old=n.gaitDistance||0, next=old+distance;
    const target=n.touristRequested||n.touristFacing;
    if(target!==n.touristFacing && Math.floor(next/cycle)>Math.floor(old/cycle)) {
      const frames=m.transitions[n.touristFacing+'-to-'+target].frames;
      n.touristTurn={target,frames,index:0,elapsed:0}; cell(n,frames[0]); return true;
    }
    n.gaitDistance=next;
    cell(n,{row:m.walks[n.touristFacing].row,col:Math.floor((next%cycle)/cycle*8)%8}); return true;
  }
  function action(n,name,elapsed,duration,m,cycle=24){
    cycle=m.cycle_distance??cycle;
    const a=m.actions?.[name];if(!a||n.touristTurn)return false;
    const key=Math.min(a.keys.length-1,Math.floor(Math.max(0,elapsed)/Math.max(.001,duration)*a.keys.length));
    const phase=Math.floor(((n.gaitDistance||0)%cycle)/cycle*a.frames_per_key)%a.frames_per_key;
    if(key===0||key===a.keys.length-1){cell(n,{row:m.walks[n.touristFacing].row,col:phase})}
    else{const p=a.keys[key];cell(n,{row:p.row,col:p.col_start+phase});n.spriteFlip=name==='sidePour'&&n.touristFacing==='left'}
    return true;
  }
  return Object.freeze({load,request,advance,action,isTurning:n=>!!n.touristTurn});
})();
