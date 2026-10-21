import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {validateStreetMouthRegistration} from '../street-character-mouth.js';
import {registerStreetCharacterManifest} from '../street-character-sprites.js';

const manifest=JSON.parse(readFileSync('assets/characters/street/manifest.json'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const file=path=>readFileSync(path.replace(/^\.\//,''));

test('shipped external mouth definitions bind the actual selected source paint',()=>{
 registerStreetCharacterManifest(manifest);
 const selected=Object.values(manifest.characters).filter(person=>person.mouthPaint?.file);
 assert(selected.length>0);
 for(const person of selected){
  const bytes=file(person.mouthPaint.file);assert.equal(hash(bytes),person.mouthPaint.sha256,person.id+' definition bytes');
  const definition=JSON.parse(bytes);
  assert.equal(definition.schemaVersion,1);assert.equal(definition.id,person.id);
  assert.deepEqual(definition.cell,person.cell);assert.equal(definition.sources.standing,person.standing.sha256);
  assert.equal(hash(file(person.standing.file)),definition.sources.standing,person.id+' standing bytes');
  validateStreetMouthRegistration(definition.standing,person.id+' standing');
  if(person.standingOnly){
   assert.equal(definition.grid,null);assert.deepEqual(definition.frames,[]);
   assert.equal(definition.sources.desktop,null);assert.equal(definition.sources.mobile,null);
  }else{
   assert.deepEqual(definition.grid,person.grid);assert.equal(definition.frames.length,person.grid[0]*person.grid[1]);
   for(const variant of ['desktop','mobile']){
    assert.equal(definition.sources[variant],person.variants[variant].sha256);
    assert.equal(hash(file(person.variants[variant].file)),definition.sources[variant]);
   }
   for(const registration of definition.frames)validateStreetMouthRegistration(registration,person.id+' frame');
  }
 }
});

// The loader verifies delivery bytes, so Git must not rewrite a pinned payload.
// hash-object without -w is read-only and exercises the effective clean filter.
test('Git preserves the exact hash-bound shipped mouth payload bytes',()=>{
 for(const person of Object.values(manifest.characters)){
  if(!person.mouthPaint?.file)continue;
  const path=person.mouthPaint.file.replace(/^\.\//,''),bytes=file(path);
  const raw=spawnSync('git',['hash-object','--no-filters','--stdin'],{input:bytes,encoding:'utf8'});
  const delivered=spawnSync('git',['hash-object','--path='+path,'--stdin'],{input:bytes,encoding:'utf8'});
  assert.equal(raw.status,0,raw.stderr);assert.equal(delivered.status,0,delivered.stderr);
  assert.equal(delivered.stdout.trim(),raw.stdout.trim(),person.id+' Git changes the SHA-bound delivery bytes');
 }
});
