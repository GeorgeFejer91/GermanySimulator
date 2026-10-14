import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {levelLinks,levelPage} from './build-level-pages.mjs';

const base=new URL(process.env.LEVEL_BASE_URL||'https://germanysimulator.de/');
const levels=levelLinks(readFileSync('game.js','utf8'));
const template=readFileSync('index.html','utf8'),normalize=text=>text.replaceAll('\r\n','\n');
const report={base:base.href,verifiedAt:new Date().toISOString(),complete:false,levels:[],runtime:[],limits:['HTTP, deployed HTML/runtime, static metadata and PNG verification; browser playability is separate','Sharing-platform cache rendering and physical Android are not established by this check']};
const meta=(html,name)=>html.match(new RegExp(`<meta (?:property|name)="${name}" content="([^"]+)"`))?.[1];
async function get(url){const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`${response.status} ${url}`);return response}
try{
  for(const level of levels){
    const checks=[];
    for(const path of [level.path,...level.aliases]){
      const url=new URL(encodeURIComponent(path),base);
      const response=await get(url),html=await response.text();
      if(!response.headers.get('content-type')?.includes('text/html'))throw Error('Not HTML: '+url);
      if(normalize(html)!==normalize(levelPage(template,level)))throw Error('Stale/different deployed level HTML: '+url);
      if(!html.includes(`data-direct-level="${level.id}"`))throw Error('Wrong direct destination: '+url);
      if(meta(html,'og:url')!==`https://germanysimulator.de/${level.path}/`)throw Error('Wrong canonical share URL: '+url);
      if(meta(html,'og:image')!==`https://germanysimulator.de/${level.image}`)throw Error('Wrong share image: '+url);
      if(meta(html,'twitter:card')!=='summary_large_image'||!meta(html,'og:title')||!meta(html,'og:description'))throw Error('Incomplete share metadata: '+url);
      checks.push({path,url:url.href,finalUrl:response.url,status:response.status});
    }
    const image=await get(new URL(level.image,base)),bytes=Buffer.from(await image.arrayBuffer());
    if(!image.headers.get('content-type')?.includes('image/png')||bytes.readUInt32BE(16)!==1200||bytes.readUInt32BE(20)!==630)throw Error('Wrong PNG type/dimensions: '+level.image);
    const sha256=createHash('sha256').update(bytes).digest('hex');
    if(sha256!==createHash('sha256').update(readFileSync(level.image)).digest('hex'))throw Error('Stale/different deployed share image: '+level.image);
    report.levels.push({...level,checks,imageCheck:{status:image.status,width:1200,height:630,bytes:bytes.length,sha256}});
    console.log(`PASS ${level.id}: routes, static share metadata, PNG`);
  }
  for(const path of ['index.html','3d.html','game.js','world3d.js','tourist-animation.js','buergeramt-link.js','buergeramt-fit.js','buergeramt.css','buergeramt-floor.js','buergeramt-portrait-melt.js']){
    const response=await get(new URL(path==='index.html'?'':path,base)),source=normalize(await response.text());
    if(source!==normalize(readFileSync(path,'utf8')))throw Error('Stale/different deployed runtime: '+path);
    report.runtime.push({path,status:response.status,sha256:createHash('sha256').update(source).digest('hex')});
  }
  report.complete=true;
  if(process.argv.includes('--update-catalogue')){
    const path='For-AI/LEVEL-URLS.md',text=readFileSync(path,'utf8');
    const rows=levels.map(level=>`| ${level.title} | [/${level.path}/](https://germanysimulator.de/${encodeURIComponent(level.path)}/) | ${level.aliases.map(alias=>`[/${alias}/](https://germanysimulator.de/${encodeURIComponent(alias)}/)`).join(', ')||'—'} | [PNG](https://germanysimulator.de/${level.image}) | HTTP, static metadata and PNG PASS · ${report.verifiedAt.slice(0,10)} |`);
    const section=`## Current public checks\n\nProduction HTTP, static social metadata, aliases and PNG dimensions checked ${report.verifiedAt}. Browser evidence and its device limits are recorded below. Platform caches may retain an earlier preview.\n\n| Level / area | Permanent direct URL | Aliases | Share image | Live checks |\n| --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\n`;
    if(!text.includes('## Implementation'))throw Error('Catalogue update anchor missing');
    writeFileSync(path,text.replace(/## Current public checks[\s\S]*?(?=## Implementation)/,section).replace('## Implementation candidate (not yet production-verified)','## Implementation and verification'));
  }
}catch(error){report.error=error.stack;throw error}
finally{mkdirSync('output/level-links-live',{recursive:true});writeFileSync('output/level-links-live/report.json',JSON.stringify(report,null,2)+'\n')}
