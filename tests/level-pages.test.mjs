import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {levelLinks,levelPage} from '../tools/build-level-pages.mjs';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const template=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('every enterable nonresidential building and neighbors have a unique direct route',()=>{
  const levels=levelLinks(source);
  const paths=levels.flatMap(level=>[level.path,...level.aliases]);
  assert.equal(new Set(paths).size,paths.length);
  for(const id of ['city','neighbors','buergeramt','jobcenter','hausverwaltung','finanzamt','krankenkasse','stadtbild','auslaender','bundestag']) assert.ok(levels.some(level=>level.id===id),id);
  assert.ok(!levels.some(level=>['akw','kohlewerk','jwd-home'].includes(level.id)));
  const office=levels.find(level=>level.id==='buergeramt');
  assert.equal(office.path,'bürgeramt');
  assert.deepEqual(office.aliases,['buergeramt']);
  assert.equal(new Set(levels.map(level=>level.image)).size,levels.length);
});

test('every registered level scope has a maintained direct route',()=>{
  const scopes=readFileSync(new URL('../For-AI/LEVELS.md',import.meta.url),'utf8');
  const ids=[...scopes.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map(match=>match[1]);
  assert.ok(ids.length>0,'level scope catalogue must remain discoverable');
  const routes=new Set(levelLinks(source).map(level=>level.id));
  for(const id of ids)assert.ok(routes.has(id),'new level requires a direct route: '+id);
});

test('share metadata is in raw HTML and routes retain canonical scripts with a parent base',()=>{
  for(const level of levelLinks(source)) {
    const html=levelPage(template,level);
    assert.match(html,new RegExp(`data-direct-level="${level.id}"`));
    assert.match(html,/<base href="\.\.\/">/);
    assert.ok(html.includes(`content="https://germanysimulator.de/${level.image}"`));
    assert.equal((html.match(/property="og:image"/g)||[]).length,1);
    assert.equal((html.match(/property="og:url"/g)||[]).length,1);
    assert.ok(html.includes(`href="https://germanysimulator.de/${level.path}/"`));
    assert.equal((html.match(/<script\b/g)||[]).length,(template.match(/<script\b/g)||[]).length);
  }
});

test('every advertised share image is a real 1200 by 630 PNG',()=>{
  const hashes=new Set();
  for(const level of levelLinks(source)) {
    const bytes=readFileSync(new URL('../'+level.image,import.meta.url));
    assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],level.image);
    assert.equal(bytes.readUInt32BE(16),1200,level.image);
    assert.equal(bytes.readUInt32BE(20),630,level.image);
    const hash=createHash('sha256').update(bytes).digest('hex');assert.ok(!hashes.has(hash),'each level needs its own image pixels: '+level.image);hashes.add(hash);
  }
});
