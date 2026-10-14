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
