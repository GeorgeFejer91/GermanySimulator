import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {neighborRecordingsBlock} from '../tools/curate-voice-library.mjs';

test('private preflight validates the unchanged receipt against staged bytes and canonical checks remain strict',()=>{
 const cast=JSON.parse(readFileSync('For-AI/VOICE-CAST.json','utf8'));
 const published=JSON.parse(readFileSync('assets/voices/neighbors/schwabingen-manifest.json','utf8'));
 const clip=published.clips[0],receipt=JSON.stringify(clip),manifest={...published,clips:[clip],heldPrivate:[],requestedLineCount:1};
 const canonical=neighborRecordingsBlock(cast,[manifest]);
 const privateRoot=mkdtempSync(resolve(tmpdir(),'neighbor-staged-'));
 try{
  const path=resolve(privateRoot,clip.file);mkdirSync(dirname(path),{recursive:true});
  const bytes=readFileSync(clip.file);writeFileSync(path,bytes);
  assert.equal(neighborRecordingsBlock(cast,[manifest],privateRoot),canonical);
  const corrupted=Buffer.from(bytes);corrupted[0]^=1;writeFileSync(path,corrupted);
  assert.throws(()=>neighborRecordingsBlock(cast,[manifest],privateRoot),/Neighbor audio hash\/path drift/);
  assert.equal(neighborRecordingsBlock(cast,[manifest]),canonical,'private drift cannot alter the canonical asset authority');
  assert.equal(JSON.stringify(clip),receipt,'preflight never substitutes another encoding hash into the candidate');
 }finally{rmSync(privateRoot,{recursive:true,force:true})}
});
