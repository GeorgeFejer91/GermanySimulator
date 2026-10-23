import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {levelLinks,levelPage,buildLevelPages} from '../tools/build-level-pages.mjs';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const template=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('publication omits offline street authoring trees while retaining game and preview assets',()=>{
  const parent=resolve(tmpdir()),directory=mkdtempSync(join(parent,'germany-pages-sources-'));
  const root=join(directory,'source'),output=join(directory,'site');
  const omitted=['resident-motion','berlin-street-20261022','street-residents'].map(name=>`assets/sprite-sources/${name}/source.png`);
  const retained=[
    'assets/characters/residents/anna/walk.webp',
    'assets/characters/police/walk.webp',
    'assets/sprite-sources/rigs/registry.json',
    'assets/sprite-sources/candidates/merkel-3d/merkel-sprite.png',
    'assets/sprite-sources/reference/neutral-walk/guide.png',
    'assets/sprite-sources/buergeramt/parent/key-0.png',
    'assets/sprite-archive/towel/key.png',
    'assets/models/study/sprite-sources/resident-motion/keep.png',
    'assets/sprite-sources/resident-motion.webp',
    'For-AI/AUDIO-TEXT-LIBRARY.js',
  ];
  try {
    for(const path of [...omitted,...retained,'assets/social-preview.png','assets/social/neighbors.png']){
      const file=join(root,path);mkdirSync(resolve(file,'..'),{recursive:true});writeFileSync(file,path);
    }
    writeFileSync(join(root,'index.html'),'<html><head><title>Game</title></head></html>');
    writeFileSync(join(root,'building-catalogue.js'),'module.exports={catalogue:[]}');
    buildLevelPages(root,output);
    for(const path of omitted){
      assert.ok(!existsSync(resolve(output,path,'..')),`offline directory must stay out of publication: ${path}`);
      assert.ok(!existsSync(join(output,path)),`offline source must stay out of publication: ${path}`);
      assert.equal(readFileSync(join(root,path),'utf8'),path,'original source must remain intact');
    }
    for(const path of retained)assert.equal(readFileSync(join(output,path),'utf8'),path,`required game/preview asset: ${path}`);
    assert.ok(existsSync(join(output,'city/index.html')));
    assert.ok(existsSync(join(output,'neighbors/index.html')));
  } finally {
    const target=resolve(directory),within=relative(parent,target);
    assert.ok(within&&!within.startsWith('..')&&!within.includes(':')&&target!==parent,'cleanup stays inside the temporary parent');
    rmSync(target,{recursive:true,force:true});
  }
});

test('every enterable nonresidential building and neighbors have a unique direct route',()=>{
  const levels=levelLinks();
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
  const routes=new Set(levelLinks().map(level=>level.id));
  for(const id of ids)assert.ok(routes.has(id),'new level requires a direct route: '+id);
});

test('share metadata is in raw HTML and routes retain canonical scripts with a parent base',()=>{
  for(const level of levelLinks()) {
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
  for(const level of levelLinks()) {
    const bytes=readFileSync(new URL('../'+level.image,import.meta.url));
    assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],level.image);
    assert.equal(bytes.readUInt32BE(16),1200,level.image);
    assert.equal(bytes.readUInt32BE(20),630,level.image);
    const hash=createHash('sha256').update(bytes).digest('hex');assert.ok(!hashes.has(hash),'each level needs its own image pixels: '+level.image);hashes.add(hash);
  }
});

test('legacy 3d entry preserves URL state and replaces history, including file entry',()=>{
 const html=readFileSync(new URL('../3d.html',import.meta.url),'utf8');
 const match=html.match(/<script id="compatibility-entry">([\s\S]*?)<\/script>/);assert.ok(match);
 const cases=[
  ['https://germanysimulator.de/3d.html','https://germanysimulator.de/index.html'],
  ['https://germanysimulator.de/3d.html?chapter=neighbors&voicePreview=1#scene=city','https://germanysimulator.de/index.html?chapter=neighbors&voicePreview=1#scene=city'],
  ['https://georgefejer91.github.io/GermanySimulator/3d.html?level=jobcenter&x=%2B&x=2#tab=a%20b','https://georgefejer91.github.io/GermanySimulator/index.html?level=jobcenter&x=%2B&x=2#tab=a%20b'],
  ['file:///C:/Games/Germany%20Simulator/3d.html?chapter=neighbors#scene=city','file:///C:/Games/Germany%20Simulator/index.html?chapter=neighbors#scene=city'],
  ['file:///home/player/GermanySimulator/3d.html?level=city#section=1','file:///home/player/GermanySimulator/index.html?level=city#section=1'],
 ];
 for(const [href,expected]of cases){
  const url=new URL(href),replaced=[],link={href:'./index.html'};
  const location={get href(){return href},set href(_){assert.fail('must not push a navigation')},search:url.search,hash:url.hash,
   replace:target=>replaced.push(target),assign(){assert.fail('must replace the compatibility history slot')}};
  vm.runInNewContext(match[1],{URL,location,document:{getElementById:id=>{assert.equal(id,'canonical-game');return link}}});
  assert.deepEqual(replaced,[expected]);assert.equal(link.href,expected,'manual fallback must retain URL state');
 }
});

test('legacy 3d entry exposes static city metadata without a second controller',()=>{
 const html=readFileSync(new URL('../3d.html',import.meta.url),'utf8');
 for(const key of ['og:title','og:description','og:url','og:image','og:image:width','og:image:height']){
  const pattern=new RegExp('<meta property="'+key+'" content="([^"]+)">');
  assert.ok(html.match(pattern));assert.equal(html.match(pattern)[1],template.match(pattern)?.[1],key+' is static canonical city metadata');
 }
 assert.match(html,/<link rel="canonical" href="https:\/\/germanysimulator\.de\/">/);
 assert.equal((html.match(/<script\b/g)||[]).length,1);
 assert.doesNotMatch(html,/<script[^>]+src=|type="importmap"|<iframe\b|Germany3DBridge|requestAnimationFrame\(/);
 assert.match(template,/src="\.\/game\.js\?/);assert.match(template,/src="\.\/world3d\.js\?/);
});
