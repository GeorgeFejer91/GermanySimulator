"use strict";

const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const game=fs.readFileSync(path.join(root,"game.js"),"utf8");
const dialogueSource=fs.readFileSync(path.join(root,"merkel-dialogue.js"),"utf8");
const ids=new Set(Array.from(html.matchAll(/\bid=["']([^"']+)["']/g),match=>match[1]));
const errors=[];

for(const match of game.matchAll(/getElementById\(["']([^"']+)["']\)/g)){
  if(!ids.has(match[1]))errors.push(`game.js references missing #${match[1]}`);
}

const localReferences=new Set();
for(const source of [html,game]){
  for(const match of source.matchAll(/["'](\.\/(?:assets\/|styles\.css|merkel-dialogue\.js|game\.js)[^"']*)["']/g)){
    localReferences.add(match[1]);
  }
}
for(const reference of localReferences){
  const clean=reference.replace(/^\.\//,"").split(/[?#]/)[0];
  if(!fs.existsSync(path.join(root,clean)))errors.push(`missing local asset: ${reference}`);
}

const sandbox={window:{}};
vm.runInNewContext(dialogueSource,sandbox,{filename:"merkel-dialogue.js"});
const dialogue=sandbox.window.MERKEL_DIALOGUE;
if(!dialogue||!dialogue.start)errors.push("Merkel dialogue has no start node");
else{
  for(const [nodeId,node] of Object.entries(dialogue)){
    if(!node.text||!Array.isArray(node.choices)||node.choices.length===0)errors.push(`invalid Merkel dialogue node: ${nodeId}`);
    for(const choice of node.choices||[]){
      if(choice[1]!=="__close"&&!dialogue[choice[1]])errors.push(`dialogue node ${nodeId} links to missing ${choice[1]}`);
    }
  }
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${ids.size} DOM ids, ${localReferences.size} local assets, and ${Object.keys(dialogue).length} dialogue nodes.`);
