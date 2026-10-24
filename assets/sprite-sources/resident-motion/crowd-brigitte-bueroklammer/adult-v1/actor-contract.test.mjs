import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../../../../',import.meta.url));
const own=fileURLToPath(new URL('./',import.meta.url));
const work=resolve(root,'output/street-redesign/bueroklammer-end-to-end');
const id='crowd-brigitte-bueroklammer';
const json=path=>JSON.parse(readFileSync(path));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const candidate=()=>json(resolve(work,'private-manifest.json')).characters[id];

test('private integration preserves every other actor and the original identity contract',()=>{
  const original=json(resolve(root,'assets/characters/street/manifest.json'));
  const selected=json(resolve(work,'private-manifest.json'));
  assert.deepEqual(Object.keys(selected.characters),Object.keys(original.characters));
  for(const [key,value] of Object.entries(original.characters))if(key!==id)assert.deepEqual(selected.characters[key],value,key);
  const before=json(resolve(own,'pre-admission-person.json')),after=selected.characters[id];
  for(const key of ['id','aliases','cell','pivot','figureHeight'])assert.deepEqual(after[key],before[key],key);
  assert.equal(after.standingOnly,false);assert.equal(after.figureWorldHeight,2.33);
  assert.equal(after.strideDistance,json(resolve(own,'motion-spec.json')).strideDistance);
});

test('every authored walk phase can settle through four frames to its own direction',()=>{
  const person=candidate(),motion=person.atlasMotion;
  for(const heading of ['down','right','up','left']){
    assert.equal(motion.walks[heading].frames,16,heading);
    const settle=motion.settles[heading];
    assert.ok(settle,heading+' settle family missing');
    assert.deepEqual(Object.keys(settle).map(Number).sort((a,b)=>a-b),Array.from({length:16},(_,i)=>i));
    for(const plan of Object.values(settle)){
      assert.equal(plan.frames.length,5);
      assert.deepEqual(plan.frames.at(-1),{row:motion.bridges[heading].row,col:2,ms:70});
    }
  }
  const body=json(resolve(work,'full-working/body-index.json'));
  assert.equal(body.selectedCells,412);assert.equal(body.sourceFiles,348);
  for(const heading of ['down','right','up','left'])for(let phase=0;phase<16;phase++){
    const cells=body.cells.filter(cell=>cell.heading===heading&&cell.kind==='stop'&&cell.entryPhase===phase);
    assert.deepEqual(cells.map(cell=>cell.strength).sort((a,b)=>a-b),[.25,.5,.75,1]);
    for(const cell of cells)assert.equal(sha(resolve(root,cell.source.file)),cell.source.sha256);
  }
});

test('quiet timing and five visible mouth fits remain bound to the original actions',()=>{
  const person=candidate(),before=json(resolve(own,'pre-admission-family.json'));
  for(const action of ['idle','look','success','failure']){
    const selected=person.atlasMotion.interactions.states[action],old=before.interactions.states[action];
    assert.deepEqual(selected.durations_ms,old.durations_ms,action);
    for(const key of ['loop','next'])assert.deepEqual(selected[key],old[key],action+' '+key);
  }
  assert.deepEqual(person.atlasMotion.interactions.states.wait,person.atlasMotion.interactions.states.idle);
  const fit=json(resolve(work,'adult-mouth-fit-v4/fit.json'));
  assert.deepEqual(Object.keys(fit.checks).sort(),['down','front-left','front-right','left','right']);assert.deepEqual(fit.endpointFailures,[]);
  for(const [heading,check] of Object.entries(fit.checks)){
    assert.equal(check.closedExact,true,heading+' closed paint');assert.equal(check.openAlphaExact,true,heading+' open alpha');
    assert.equal(check.endpoints.length,2,heading+' corners');assert.ok(check.changedRgbPixels>0,heading+' visible opening');
    for(const endpoint of check.endpoints)assert.ok(endpoint.rgba[3]>=230,heading+' corner remains on source paint');
  }
  const mouths=json(resolve(work,'family-mouths/mouths-working.json'));
  assert.equal(mouths.visible,324);assert.deepEqual(mouths.missingFits,[]);
});

test('the three selected recordings and all original voice assets remain byte exact',()=>{
  const voices=json(resolve(own,'voice-baseline.json'));
  assert.equal(voices.id,id);assert.equal(voices.selectedRecordings.length,3);
  assert.equal(voices.profileId,'735315eb7b9845dca5919c108814c1a9');
  for(const [path,digest] of Object.entries(voices.hashes))assert.equal(sha(resolve(root,path)),digest,path);
  for(const recording of voices.selectedRecordings)assert.equal(sha(resolve(root,recording.file)),recording.sha256,recording.file);
});
