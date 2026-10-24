import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,existsSync,rmSync} from 'node:fs';
import {join,resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {buildLevelPages} from '../tools/build-level-pages.mjs';

test('published Berghain pages retain their complete local module graph and evidence map',()=>{
 const repository=fileURLToPath(new URL('../',import.meta.url)),parent=resolve(tmpdir());
 const temporary=mkdtempSync(join(parent,'berghain-publication-')),root=join(temporary,'source'),output=join(temporary,'site');
 const modules=new Set();
 const write=(path,bytes)=>{const target=join(root,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes);};
 const collect=path=>{
  path=path.replaceAll('\\','/');if(modules.has(path))return;modules.add(path);
  const bytes=readFileSync(join(repository,path));write(path,bytes);
  for(const match of bytes.toString().matchAll(/\b(?:from\s*|import\s*\(\s*)['"](\.[^'"]+)['"]/g)){
   const target=relative(repository,resolve(repository,dirname(path),match[1]));
   assert.ok(!target.startsWith('..')&&!target.includes(':'),'local module remains in repository');collect(target);
  }
 };
 try{
  collect('berghain/viewer.mjs');collect('berghain/walkthrough.mjs');
  const evidence=['README.md','VALIDATION.md','SOURCES.md','INTERIOR.md','KARHARD-MAPPING.md','KARHARD-IMAGE-MAP.json','AUTHENTICITY-AUDIT.md'].map(p=>'berghain/For-AI/'+p);
  for(const p of ['berghain/model.html','berghain/viewer.css',...evidence])write(p,readFileSync(join(repository,p)));
  for(const p of ['berghain/references/private.jpg','berghain/research-notes.mjs'])write(p,'offline authoring input');
  write('index.html','<html><head><title>Game</title></head></html>');
  write('building-catalogue.js','module.exports={catalogue:[]}');
  for(const p of ['assets/social-preview.png','assets/social/neighbors.png'])write(p,'fixture');
  buildLevelPages(root,output);
  for(const path of [...modules,...evidence]){
   assert.ok(existsSync(join(output,path)),'missing published dependency: '+path);
   assert.deepEqual(readFileSync(join(output,path)),readFileSync(join(root,path)),'published bytes: '+path);
  }
  assert.ok(existsSync(join(output,'geheim/index.html')));
  assert.ok(!existsSync(join(output,'berghain/references')),'private reference downloads stay excluded');
  assert.ok(!existsSync(join(output,'berghain/research-notes.mjs')),'authoring modules stay excluded');
 }finally{
  const target=resolve(temporary),within=relative(parent,target);
  assert.ok(within&&!within.startsWith('..')&&!within.includes(':')&&target!==parent);
  rmSync(target,{recursive:true,force:true});
 }
});
