import {writeFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createTogetherGeometries} from '../assets/models/berghain/together-geometry.mjs';

const size=1024,minimum=new Float32Array(size*size).fill(Infinity),maximum=new Float32Array(size*size).fill(-Infinity);
const geometries=createTogetherGeometries();
for(const geometry of Object.values(geometries)){
  const p=geometry.attributes.position,uv=geometry.attributes.uv1,index=geometry.index.array;
  for(let triangle=0;triangle<index.length;triangle+=3){
    const ids=Array.from(index.subarray(triangle,triangle+3));
    const [a,b,c]=ids.map(i=>({x:uv.getX(i)*size,y:uv.getY(i)*size,h:p.getY(i)}));
    const determinant=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
    if(Math.abs(determinant)<1e-9)continue;
    for(let y=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y)));y<=Math.min(size-1,Math.ceil(Math.max(a.y,b.y,c.y)));y++){
      for(let x=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x)));x<=Math.min(size-1,Math.ceil(Math.max(a.x,b.x,c.x)));x++){
        const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/determinant;
        const v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/determinant,w=1-u-v;
        if(u<0||v<0||w<0)continue;
        const height=u*a.h+v*b.h+w*c.h,offset=y*size+x;
        minimum[offset]=Math.min(minimum[offset],height);maximum[offset]=Math.max(maximum[offset],height);
      }
    }
  }
  geometry.dispose();
}
const pixels=Buffer.alloc((size*3+1)*size),values=[];
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const index=y*size+x,thickness=Number.isFinite(minimum[index])?Math.max(0,maximum[index]-minimum[index]):.02;
  const g=Math.min(255,Math.round(thickness/.25*255)),offset=y*(size*3+1)+1+x*3;
  pixels[offset]=255;pixels[offset+1]=g;pixels[offset+2]=255;if(g)values.push(g);
}
function chunk(name,bytes){
  const label=Buffer.from(name),body=Buffer.concat([label,bytes]),header=Buffer.alloc(4),crc=Buffer.alloc(4);header.writeUInt32BE(bytes.length);
  let value=0xffffffff;for(const byte of body){value^=byte;for(let bit=0;bit<8;bit++)value=(value>>>1)^((value&1)?0xedb88320:0);}
  crc.writeUInt32BE((value^0xffffffff)>>>0);return Buffer.concat([header,body,crc]);
}
const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=2;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels,{level:9})),chunk('IEND',Buffer.alloc(0))]);
const file='textures/amber-thickness.png';writeFileSync(new URL('../assets/models/berghain/'+file,import.meta.url),png);
const manifest={generator:'berghain/build-together-volume.mjs',file,bytes:png.length,sha256:createHash('sha256').update(png).digest('hex'),
  size:[size,size],channel:'G',texCoord:1,thicknessFactorMetres:.25,nonzeroPixels:values.length,
  min:values.reduce((a,b)=>Math.min(a,b),255),max:values.reduce((a,b)=>Math.max(a,b),0),
  limits:'Vertical envelope of the two authored anatomical poses; decorative details use20mm. Not measured sugar, exact ray thickness or scanned artwork'};
writeFileSync(new URL('../assets/models/berghain/textures/amber-volume-manifest.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest));
