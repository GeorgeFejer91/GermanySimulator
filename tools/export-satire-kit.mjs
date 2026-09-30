import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SATIRE_CATALOG,KIT_VERSION,buildSatireMesh,createSatireGLB} from '../assets/models/satire-kit/models.js';
const directory=new URL('../assets/models/satire-kit/',import.meta.url);
await mkdir(directory,{recursive:true});
const manifest={version:KIT_VERSION,status:'candidate-unapproved',units:'metres',axis:'Y-up; +Z-front; ground-centred',models:{}};
for(const entry of SATIRE_CATALOG){
 const mesh=buildSatireMesh(entry.id),bytes=Buffer.from(createSatireGLB(entry.id));
 await writeFile(new URL(entry.id+'.glb',directory),bytes);
 manifest.models[entry.id]={...entry,file:entry.id+'.glb',dimensions:mesh.dimensions,triangles:mesh.triangles,primitives:mesh.parts.length,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
}
manifest.totals={models:SATIRE_CATALOG.length,triangles:Object.values(manifest.models).reduce((n,m)=>n+m.triangles,0),bytes:Object.values(manifest.models).reduce((n,m)=>n+m.bytes,0)};
await writeFile(new URL('manifest.json',directory),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest.totals));
