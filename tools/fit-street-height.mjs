import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {streetMotionDeliveryDefinitionBytes,validateStreetMotionDelivery} from '../street-motion-delivery.js';
import {registerStreetCharacterManifest} from '../street-character-sprites.js';
import {expandStreetManifest,compactStreetManifest} from '../street-manifest.js';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>JSON.stringify(value,null,2)+'\n';

export function fitAdultStreetHeight(original,packet,height){
  if(!Number.isFinite(height)||height<=0)throw new RangeError('Invalid target height');
  if(original.standingOnly!==false||original.figureWorldHeight<2||!Number.isFinite(original.strideDistance)||original.strideDistance<=0)throw new TypeError('Height fitting requires an already redesigned adult walker');
  const person=structuredClone(original);
  person.figureWorldHeight=height;
  person.strideDistance=original.strideDistance*height/original.figureWorldHeight;
  if(!original.motionDelivery)return {person,packet:null,packetBytes:null};
  validateStreetMotionDelivery(original,packet);
  if(packet.definitionSha256!==hash(streetMotionDeliveryDefinitionBytes(original)))throw new Error('Source delivery does not bind its original person');
  const fitted=structuredClone(packet);
  fitted.definitionSha256=hash(streetMotionDeliveryDefinitionBytes(person));
  const packetBytes=json(fitted);
  person.motionDelivery.sha256=hash(packetBytes);
  validateStreetMotionDelivery(person,fitted);
  return {person,packet:fitted,packetBytes};
}

function prepare(){
  const {values}=parseArgs({options:{manifest:{type:'string',default:'assets/characters/street/manifest.json'},out:{type:'string'},height:{type:'string',default:'2.77'}}});
  if(!values.out)throw new Error('Provide a fresh --out directory; this prepares a candidate without editing production assets');
  const out=resolve(values.out),height=Number(values.height);
  if(!Number.isFinite(height)||height<=0)throw new RangeError('Invalid target height');
  if(existsSync(out))throw new Error('Output already exists; preserve previous candidates');
  const manifest=expandStreetManifest(JSON.parse(readFileSync(values.manifest,'utf8')));
  const before=structuredClone(manifest),receipt={height,source:resolve(values.manifest),actors:[],packetOverrides:{}};
  const excluded=new Set(['jwd-ede-einbruch','spieler-hans-peter-mustermann','polizei-heinrich-wachtmeister']);
  const staged=[];
  for(const [id,original] of Object.entries(before.characters)){
    if(excluded.has(id)||original.standingOnly!==false||original.figureWorldHeight!==2.33)continue;
    if(!/^[a-z0-9_-]+$/.test(id))throw new Error('Invalid actor output identity');
    const path=original.motionDelivery?.file.replace(/^\.\//,'');
    const bytes=path?readFileSync(path):null;
    if(bytes&&hash(bytes)!==original.motionDelivery.sha256)throw new Error('Source packet bytes changed: '+id);
    const fitted=fitAdultStreetHeight(original,bytes?JSON.parse(bytes):null,height);
    manifest.characters[id]=fitted.person;
    if(path){
      const relative='packets/'+id+'.json';
      receipt.packetOverrides[path]=relative;
      staged.push([relative,fitted.packetBytes]);
    }
    receipt.actors.push({id,fromHeight:original.figureWorldHeight,height,fromStride:original.strideDistance,stride:fitted.person.strideDistance,packet:path??null});
  }
  registerStreetCharacterManifest(manifest);
  const wire=compactStreetManifest(manifest);
  if(Buffer.byteLength(JSON.stringify(wire))>262144)throw new Error('Candidate exceeds canonical metadata budget');
  mkdirSync(out,{recursive:true});
  for(const [path,bytes] of staged){const target=resolve(out,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes)}
  writeFileSync(resolve(out,'source-manifest.json'),json(before));
  writeFileSync(resolve(out,'manifest.json'),JSON.stringify(wire)+'\n');
  writeFileSync(resolve(out,'expanded-manifest.json'),JSON.stringify(manifest)+'\n');
  writeFileSync(resolve(out,'receipt.json'),json(receipt));
  console.log(JSON.stringify({actors:receipt.actors.length,packets:staged.length,height,out,productionEdited:false}));
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)prepare();
