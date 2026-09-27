// Offline step after the Blender export. Argument: node_modules containing
// @gltf-transform/{core,extensions,functions} 4.5.0, meshoptimizer and gltf-validator.
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(resolve(process.argv[2]||'.','package.json'));
const {NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {dedup,prune,weld,simplify,quantize}=require('@gltf-transform/functions');
const {MeshoptSimplifier}=require('meshoptimizer'),validator=require('gltf-validator');
await MeshoptSimplifier.ready;
const root=resolve(import.meta.dirname,'../assets/models/vehicles');
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
for(const item of Object.values(manifest.models)){
  const path=join(root,item.file),doc=await io.read(path);
  await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.55,error:.002}),dedup({keepUniqueNames:true}),prune(),quantize({quantizePosition:14,quantizeNormal:10}));
  const bytes=await io.writeBinary(doc),report=await validator.validateBytes(bytes,{uri:item.file});
  assert.equal(report.issues.numErrors,0,JSON.stringify(report.issues.messages));
  const wheels=doc.getRoot().listNodes().filter(n=>n.getExtras().wheel);
  assert.equal(wheels.length,4,'Wheel pivot metadata was lost');
  if(item.file==='police-estate.glb')for(const name of ['BeaconLeft','BeaconRight'])assert.ok(doc.getRoot().listMaterials().some(m=>m.getName()===name),'Independent LED bank was merged');
  item.triangles=doc.getRoot().listNodes().reduce((sum,n)=>sum+(n.getMesh()?.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0)||0),0);
  item.bytes=bytes.length;item.sha256=createHash('sha256').update(bytes).digest('hex');
  assert.ok(item.triangles<32000&&bytes.length<600000,JSON.stringify({file:item.file,triangles:item.triangles,bytes:bytes.length}));
  await writeFile(path,bytes);
  console.log(item.file,JSON.stringify({triangles:item.triangles,bytes:item.bytes,errors:report.issues.numErrors,warnings:report.issues.numWarnings}));
}
manifest.optimization='glTF Transform 4.5.0: weld, bounded simplify, dedup, prune, 14-bit position/10-bit normal quantization; no runtime decoder';
await writeFile(join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
