import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,mkdirSync,mkdtempSync,readdirSync,readFileSync,readlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {admitCityManifest} from '../tools/curate-voice-library.mjs';

function snapshotTree(root){
 const entries=[];
 function visit(directory,relative=''){
  const stat=lstatSync(directory);
  entries.push({path:relative||'.',kind:'directory',mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs});
  for(const name of readdirSync(directory).sort()){
   const path=join(directory,name),child=relative?join(relative,name):name,info=lstatSync(path);
   if(info.isSymbolicLink())entries.push({path:child,kind:'symlink',target:readlinkSync(path),mtimeMs:info.mtimeMs,ctimeMs:info.ctimeMs});
   else if(info.isDirectory())visit(path,child);
   else if(info.isFile())entries.push({path:child,kind:'file',bytes:info.size,sha256:createHash('sha256').update(readFileSync(path)).digest('hex'),mtimeMs:info.mtimeMs,ctimeMs:info.ctimeMs});
   else entries.push({path:child,kind:'other'});
  }
 }
 visit(root);return entries;
}

const arrangements=[
 ['review equals destination',base=>[join(base,'review'),join(base,'author'),join(base,'review')]],
 ['review is nested in destination',base=>[join(base,'dest','review'),join(base,'author'),join(base,'dest')]],
 ['destination is nested in review',base=>[join(base,'review'),join(base,'author'),join(base,'review','dest')]],
 ['review equals authoring',base=>[join(base,'author'),join(base,'author'),join(base,'dest')]],
 ['review is nested in authoring',base=>[join(base,'author','review'),join(base,'author'),join(base,'dest')]],
 ['authoring is nested in review',base=>[join(base,'review'),join(base,'review','author'),join(base,'dest')]],
 ['authoring equals destination',base=>[join(base,'review'),join(base,'author'),join(base,'author')]],
 ['authoring is nested in destination',base=>[join(base,'review'),join(base,'dest','author'),join(base,'dest')]],
 ['destination is nested in authoring',base=>[join(base,'review'),join(base,'author'),join(base,'author','dest')]],
];

for(const [name,layout] of arrangements){
 test(`admission rejects ${name} before proof access and leaves all roots unchanged`,()=>{
  const scratch=mkdtempSync(join(tmpdir(),'gs-city-admission-roots-'));
  try{
   const [reviewRoot,authoringRoot,destinationRoot]=layout(scratch);
   for(const root of new Set([reviewRoot,authoringRoot,destinationRoot]))mkdirSync(root,{recursive:true});
   const roots=[...new Set([reviewRoot,authoringRoot,destinationRoot])];
   const before=new Map(roots.map(root=>[root,snapshotTree(root)]));
   assert.throws(
    ()=>admitCityManifest({}, {}, reviewRoot, resolve(scratch,'absent-helper.py'), authoringRoot, destinationRoot),
    /roots alias or nest/,
   );
   for(const root of roots){
    assert.equal(existsSync(root),true);
    assert.deepEqual(snapshotTree(root),before.get(root),`${root} changed during the rejected call`);
   }
  }finally{rmSync(scratch,{recursive:true,force:true});}
 });
}
