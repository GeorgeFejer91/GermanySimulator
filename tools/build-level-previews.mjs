import {createRequire} from 'node:module';
import {readFileSync,mkdirSync} from 'node:fs';
import {levelLinks} from './build-level-pages.mjs';

const sharp=createRequire(import.meta.url)('sharp');
const levels=levelLinks(readFileSync('game.js','utf8'));
mkdirSync('assets/social',{recursive:true});
const escape=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function lines(text,width=30) {
  const rows=[''];
  for(const word of text.split(' ')) {
    if((rows.at(-1)+' '+word).trim().length>width) rows.push(word);
    else rows[rows.length-1]=(rows.at(-1)+' '+word).trim();
  }
  return rows;
}
for(const [index,level] of levels.entries()) {
  if(level.id==='city'||level.id==='buergeramt') continue;
  const color=['#974c35','#526d58','#4c6877','#84613d'][index%4];
  const title=lines(level.title);
  const caption=lines(level.description,48);
  const papers=Array.from({length:8},(_,i)=>`<g transform="translate(${700+i*22},${215-i*13}) rotate(${i%2?7:-7})"><rect width="120" height="210" fill="#faf1d7" stroke="#302c27" stroke-width="4"/><path d="M18 30h80M18 50h70M18 70h80M18 90h55" stroke="#91846c" stroke-width="3"/><text x="18" y="150" font-size="24">${index+1}/${i+1}</text></g>`).join('');
  const special=level.id==='neighbors'
    ? '<path d="M620 400V235l125-100 125 100v165" fill="#cdbb8d" stroke="#302c27" stroke-width="8"/><path d="M600 238l145-122 145 122" fill="none" stroke="#302c27" stroke-width="12"/><rect x="665" y="275" width="150" height="90" fill="#726d55"/><circle cx="700" cy="310" r="22" fill="white"/><circle cx="777" cy="310" r="22" fill="white"/><circle cx="703" cy="315" r="9"/><circle cx="780" cy="315" r="9"/><path d="M620 427h285" stroke="#547247" stroke-width="18"/><text x="670" y="400" font-size="20">RASEN VERBOTEN</text>'
    : level.id==='jobcenter'
      ? '<path d="M850 435C670 330 790 245 770 185c90 55 40 100 80 105 55-20 30-65 75-110 5 85 105 150-15 255" fill="#cb592e" stroke="#302c27" stroke-width="7"/><path d="M845 422c-50-60-15-105 10-140 15 65 70 90 30 140" fill="#f5c66b"/><rect x="690" y="431" width="260" height="26" fill="#302c27"/><text x="730" y="465" font-size="22">ZUSTÄNDIG: FEUER</text>'
      : papers;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#e6dcc4"/><path d="M0 480H1200V630H0" fill="#c9b997"/>
    <g font-family="DejaVu Sans,Arial,sans-serif" fill="#302c27">
    <text x="55" y="60" font-size="22" letter-spacing="4">GERMANY SIMULATOR · GRAND THEFT AMT</text>
    ${title.map((row,i)=>`<text x="55" y="${130+i*52}" font-size="43" font-weight="bold">${escape(row)}</text>`).join('')}
    ${caption.map((row,i)=>`<text x="55" y="${525+i*31}" font-size="24">${escape(row)}</text>`).join('')}
    ${special}
    <g transform="translate(230 280)"><path d="M-40 75q40-25 80 0l28 100h-136z" fill="${color}" stroke="#302c27" stroke-width="6"/><circle cy="30" r="42" fill="#e0ab7c" stroke="#302c27" stroke-width="5"/><path d="M-40 10q20-50 78 0" fill="#5a4935"/><circle cx="-15" cy="28" r="5"/><circle cx="14" cy="28" r="5"/><path d="M-14 51q13-10 27 0" fill="none" stroke="#302c27" stroke-width="3"/><path d="M-23 175v32m48-32v32" stroke="#302c27" stroke-width="15"/><rect x="30" y="78" width="100" height="65" fill="#faf1d7" stroke="#302c27" stroke-width="4"/><text x="43" y="108" font-size="17">ANTRAG</text><text x="45" y="132" font-size="17">${String(index+1).padStart(2,'0')} / 38</text></g>
    <g transform="translate(520 325) rotate(-16)"><rect x="-48" y="-72" width="96" height="50" rx="14" fill="${color}" stroke="#302c27" stroke-width="7"/><path d="M-24-22v50h48v-50" fill="#7e5d3c" stroke="#302c27" stroke-width="6"/><rect x="-90" y="28" width="180" height="42" fill="#302c27"/><text x="-73" y="58" fill="#faf1d7" font-size="21">ABGELEHNT</text></g>
    <path d="M400 449q53-35 116 0" fill="none" stroke="#8f4732" stroke-width="32" stroke-linecap="round"/><path d="M400 444q53-25 116 0" fill="none" stroke="#d8ad3d" stroke-width="5"/>
    <text x="995" y="577" font-size="18" transform="rotate(-8 995 577)">FORM ${String(index+1).padStart(2,'0')}</text>
    </g></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(level.image);
}
if(process.argv[2]) await sharp(process.argv[2]).resize(1200,630,{fit:'cover'}).png().toFile('assets/social/buergeramt.png');
console.log(`Prepared ${levels.length-1} unique 1200 × 630 level previews.`);
