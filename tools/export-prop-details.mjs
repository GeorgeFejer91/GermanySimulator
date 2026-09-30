import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {DETAIL_IDS,buildDetailMesh,createDetailGLB,DETAIL_VERSION} from '../assets/models/prop-details/models.js';
const out=new URL('../assets/models/prop-details/',import.meta.url);
await mkdir(out,{recursive:true});
const manifest={version:DETAIL_VERSION,source:'models.js',axis:'Y-up / +Z-front / ground-centred',models:{}};
for(const id of DETAIL_IDS){const bytes=Buffer.from(createDetailGLB(id)),mesh=buildDetailMesh(id);await writeFile(new URL(id+'.glb',out),bytes);manifest.models[id]={file:id+'.glb',bytes:bytes.length,triangles:mesh.triangles,primitives:mesh.parts.length,dimensions:mesh.dimensions,sha256:createHash('sha256').update(bytes).digest('hex')};}
await writeFile(new URL('manifest.json',out),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({directory:fileURLToPath(out),...manifest},null,2));
