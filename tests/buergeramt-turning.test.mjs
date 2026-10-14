import test from 'node:test';
import assert from 'node:assert/strict';
import {harness,source} from './amt-harness.mjs';
import {amtWalkDirection,createAmtWalkSpare} from '../buergeramt-walk-view.js';

test('small view-boundary oscillations retain the painting; real turns change it',()=>{
  let view='down';
  for(const offset of [-.04,.04,-.02,.06])view=amtWalkDirection(Math.PI/4+offset,view);
  assert.equal(view,'down');
  assert.equal(amtWalkDirection(Math.PI/4+.11,view),'right');
  assert.equal(amtWalkDirection(-Math.PI/2,'right'),'left');
  assert.equal(amtWalkDirection(-Math.PI+.02,'up'),'up','angles wrap at the rear');
});

test('one office spare reuses A/B views and releases replaced, distant and closed sheets',()=>{
  const cache=createAmtWalkSpare(),textures=[];
  const load=()=>{const texture={disposed:0,dispose(){this.disposed++}};textures.push(texture);return texture};
  let current=load(),direction='left';const first=current;
  for(const next of ['right','left','right','left']){
    current=cache.exchange('courier',next,current,direction,load);direction=next;
  }
  assert.equal(current,first);assert.equal(textures.length,2);assert.ok(textures.every(t=>!t.disposed));
  const other=load();cache.exchange('archivist','up',other,'down',load);
  assert.equal(textures[1].disposed,1,'only the unrelated spare is retired');
  cache.release('courier');assert.ok(cache.inspect(),'another owner keeps its spare');
  cache.release('archivist');assert.equal(other.disposed,1);assert.equal(cache.inspect(),null);
  current=cache.exchange('courier','up',first,'left',load);cache.release();
  assert.equal(first.disposed,1);assert.equal(current.disposed,0,'caller owns its displayed sheet');
});

function office(){
  return harness('host',{hostSource:source('buergeramt.js').replace(/\}\)\(\);\s*$/,'window.__turnProbe={view,setStage,clearOfficeInput};})();')});
}

test('turn onset, reversal and release are bounded and equivalent at 30/60/120/144 Hz',()=>{
  const endings=[];
  for(const hz of [30,60,120,144]){
    const h=office(),dt=1/hz;h.key('ArrowRight');h.level.update(dt);
    assert.ok(h.level.view.yaw>0&&h.level.view.yaw<1.8*dt,'onset responds immediately below full speed');
    for(let i=1;i<hz;i++)h.level.update(dt);
    const right=h.level.view.yaw;h.key('ArrowRight','keyup');h.key('ArrowLeft');h.level.update(dt);
    assert.ok(h.level.view.yaw<right,'a reversal responds in the requested direction');
    h.key('ArrowLeft','keyup');const released=h.level.view.yaw;
    for(let i=0;i<hz/2;i++)h.level.update(dt);
    assert.ok(Math.abs(h.level.view.yaw-released)<.045,'release settles within 2.6 degrees');
    const stopped=h.level.view.yaw;h.level.update(.1);assert.ok(Math.abs(h.level.view.yaw-stopped)<1e-8);
    const fresh=office();fresh.key('ArrowRight');for(let i=0;i<hz;i++)fresh.level.update(dt);endings.push(fresh.level.view.yaw);
  }
  assert.ok(Math.max(...endings)-Math.min(...endings)<1e-7,'ramp integrates elapsed time independently of frame rate');
});

test('focus loss and sequence transitions discard turn momentum and require fresh input',()=>{
  for(const reset of ['blur','hidden','sequence']){
    const h=office();h.key('ArrowRight');h.level.update(.1);
    if(reset==='blur')h.window.dispatchEvent(new Event('blur'));
    else if(reset==='hidden'){h.hide();h.document.hidden=false}
    else {h.window.__turnProbe.setStage('character');h.window.__turnProbe.setStage('walk-sign')}
    const yaw=h.level.view.yaw;h.level.update(.1);assert.equal(h.level.view.yaw,yaw,reset);
    const stale=new Event('keydown',{cancelable:true});Object.assign(stale,{code:'ArrowRight',repeat:true});h.window.dispatchEvent(stale);h.level.update(.1);
    assert.equal(h.level.view.yaw,yaw,'an old repeat is not a fresh press');
    h.key('ArrowRight');h.level.update(.02);assert.ok(h.level.view.yaw>yaw,'a fresh press resumes turning');
  }
});
