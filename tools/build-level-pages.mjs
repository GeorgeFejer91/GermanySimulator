import {readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import buildingData from '../building-catalogue.js';

export function levelLinks(buildings=buildingData.catalogue) {
  if(!Array.isArray(buildings))throw new TypeError('Structured building catalogue required');
  const links = [{id:'city', path:'city', aliases:[], title:'Grand Theft Amt', description:'Die Straßen sind grau. Die Formulare beige. Der Rasen ist verboten.', image:'assets/social-preview.png'},
    {id:'neighbors', path:'neighbors', aliases:['nachbarn'], title:'JWD · Die Nachbarn', description:'Kehrwoche ist immer. Auch wenn Sie gerade erst eingezogen sind.', image:'assets/social/neighbors.png'}];
  for (const {id,name:title,sign:description,residential,kind} of buildings) {
    if(residential||kind)continue;
    if (![id,title,description].every(value=>typeof value==='string'&&value.trim())) throw Error('Missing level copy: '+id);
    links.push({id, path:id==='buergeramt'?'bürgeramt':id, aliases:id==='buergeramt'?['buergeramt']:[], title, description, image:`assets/social/${id}.png`});
  }
  return links;
}

const escape = text => text.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');

export function levelPage(template, level) {
  const title = `${level.title} · Grand Theft Amt`;
  const url = `https://germanysimulator.de/${level.path}/`;
  const image = `https://germanysimulator.de/${level.image}`;
  const metadata = [
    ['property','og:title',title], ['property','og:description',level.description],
    ['property','og:type','website'], ['property','og:url',url], ['property','og:site_name','Germany Simulator'],
    ['property','og:image',image], ['property','og:image:secure_url',image], ['property','og:image:type','image/png'],
    ['property','og:image:width','1200'], ['property','og:image:height','630'], ['property','og:image:alt',level.title+' · satirische Levelvorschau'],
    ['name','description',level.description], ['name','twitter:card','summary_large_image'],
    ['name','twitter:title',title], ['name','twitter:description',level.description], ['name','twitter:image',image],
    ['name','twitter:image:alt',level.title+' · satirische Levelvorschau']
  ].map(([attribute, key, value])=>`  <meta ${attribute}="${key}" content="${escape(value)}">`).join('\n');
  return template.replace(/<html\b/, `<html data-direct-level="${level.id}"`)
    .replace(/\s*<meta (?:property="og:[^"]+"|name="(?:twitter:[^"]+|description)")[^>]*>/g,'')
    .replace(/<title>[^<]*<\/title>/,`<title>${escape(title)}</title>`)
    .replace('<head>',`<head>\n  <base href="../">\n  <link rel="canonical" href="${escape(url)}">\n${metadata}`);
}

export function geheimPage(template) {
  const metadata = [
    ['property','og:title','Geheim · Hier kommst du rein'],
    ['property','og:description','Walk around Berghain, open the door and explore inside.'],
    ['property','og:type','website'], ['property','og:url','https://germanysimulator.de/geheim/'],
    ['property','og:image','https://germanysimulator.de/assets/social/geheim.png'],
    ['property','og:image:type','image/png'], ['property','og:image:width','1200'], ['property','og:image:height','630'],
    ['property','og:image:alt','Berghain reconstruction with a visitor and the caption Hier kommst du rein.'],
    ['name','description','Explore the Berghain reconstruction in first person with footsteps and room reverb.'],
    ['name','twitter:card','summary_large_image'], ['name','twitter:title','Geheim · Berghain'],
    ['name','twitter:description','Hier kommst du rein. Walk around and explore inside.'],
    ['name','twitter:image','https://germanysimulator.de/assets/social/geheim.png']
  ].map(([attribute,key,value]) => `  <meta ${attribute}="${key}" content="${escape(value)}">`).join('\n');
  return template.replace('<html ', '<html data-play="true" ')
    .replace('<head>', '<head>\n  <base href="../berghain/">')
    .replace(/<title>[^<]*<\/title>/, '<title>Geheim · Berghain</title>')
    .replace('</head>', `  <link rel="canonical" href="https://germanysimulator.de/geheim/">\n${metadata}\n</head>`);
}

export function buildLevelPages(root, output) {
  if (resolve(root)===resolve(output)) throw Error('Build output must be separate from source');
  // These originals are provenance only; game textures live in assets/characters.
  // Other sprite-sources trees remain required by the maintained sprite/office previews.
  const offlineSources=new Set(['resident-motion','berlin-street-20261022','street-residents']
    .map(name=>resolve(root,'assets/sprite-sources',name)));
  mkdirSync(output,{recursive:true});
  for (const entry of readdirSync(root,{withFileTypes:true})) {
    if (entry.name.startsWith('.') || ['output','node_modules','tests','tools','geheim'].includes(entry.name)) continue;
    if (entry.name==='berghain') {
      for (const path of ['model.html','viewer.css','viewer.mjs','navigation.mjs','camera.mjs','walkthrough.mjs','footsteps.mjs','night-lighting.mjs','For-AI/SOURCES.md','For-AI/INTERIOR.md']) {
        const source=join(root,entry.name,path);
        if (!existsSync(source)) continue;
        const destination=join(output,entry.name,path);
        mkdirSync(resolve(destination,'..'),{recursive:true});
        cpSync(source,destination);
      }
      const modelPage = join(root,'berghain/model.html');
      if (existsSync(modelPage)) {
        mkdirSync(join(output,'geheim'),{recursive:true});
        writeFileSync(join(output,'geheim/index.html'),geheimPage(readFileSync(modelPage,'utf8')));
      }
      continue;
    }
    cpSync(join(root,entry.name),join(output,entry.name),{
      recursive:true,filter:source=>!offlineSources.has(resolve(source))
    });
  }
  const levels = levelLinks(createRequire(import.meta.url)(resolve(root,'building-catalogue.js')).catalogue);
  const template = readFileSync(join(root,'index.html'),'utf8');
  for (const level of levels) {
    if (!existsSync(join(root,level.image))) throw Error('Missing share preview: '+level.image);
    for (const path of [level.path,...level.aliases]) {
      mkdirSync(join(output,path),{recursive:true});
      writeFileSync(join(output,path,'index.html'),levelPage(template,level));
    }
  }
  writeFileSync(join(output,'level-links.json'),JSON.stringify(levels,null,2)+'\n');
  return levels;
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const levels=buildLevelPages(resolve('.'),resolve(process.argv[2]||'output/site'));
  console.log(`Built ${levels.length} direct level pages and their aliases.`);
}
