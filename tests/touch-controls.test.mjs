import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../buergeramt-fit.js',import.meta.url),'utf8');
const start=source.indexOf('function measure(){'),end=source.indexOf('\nfor(const root of ',start);
assert.ok(start>=0&&end>start);
const label={textContent:'Rechts'},button={hidden:false,clientWidth:100,offsetHeight:68,style:{},dataset:{},
 getClientRects:()=>[{}],querySelector:s=>s==='.fraktur'?label:null,
 matches:s=>s==='.control-dock button'||s.startsWith('button,')};
const typography={fontStyle:'normal',fontWeight:'700',fontSize:'13px',fontFamily:'Fraktur',lineHeight:'13px',letterSpacing:'0px'};
const box={fontSize:'17px',lineHeight:'17px',paddingLeft:'8px',paddingRight:'8px',paddingTop:'8px',paddingBottom:'8px',borderTopWidth:'1px',borderBottomWidth:'1px',rowGap:'3px'};
let available=true,lines=1,natural=50,measuredWidth,clearance='',dockTop=237;
const dock={getClientRects:()=>[{}],getBoundingClientRect:()=>({top:dockTop})};
const scope={selectors:['.control-dock button'],innerWidth:844,innerHeight:390,Intl,
 document:{documentElement:{},fonts:{check:()=>available},body:{style:{getPropertyValue:()=>clearance,setProperty:(_,v)=>{clearance=v}},classList:{toggle(){},contains:()=>false}},querySelectorAll:()=>[button],querySelector:()=>dock},
 getComputedStyle:el=>el===label?typography:el===button?box:{zoom:'1'},
 prepareWithSegments:(text,font)=>{assert.equal(text,'Rechts');assert.equal(font,'normal 700 13px Fraktur');return{}},
 measureLineStats:(_,width)=>{measuredWidth=width;return{lineCount:lines,maxLineWidth:50}},measureNaturalWidth:()=>natural};
vm.runInNewContext(`${source.slice(start,end)};globalThis.run=measure`,scope);
scope.run();
assert.equal(measuredWidth,84,'use the button content width, excluding padding, rather than the label span or outer box');
assert.equal(button.style.minHeight,'55px','reserve icon, label line height, gap, borders, padding and rounding');
assert.equal(button.dataset.pretextFit,'one-line');
assert.equal(clearance,'153px','overlay clearance uses the rendered dock position');
lines=2;natural=120;scope.run();
assert.equal(button.dataset.pretextFit,'reflow');assert.equal(button.style.minHeight,'68px','grow without shrinking the label type');
available=false;dockTop=220;scope.run();assert.equal(button.dataset.pretextFit,'unavailable','missing font measurement is not a fit');assert.equal(clearance,'170px','enlarged controls move overlays above their actual top');
console.log('Touch-label font parity, content budgets, reflow and unavailable measurement contracts OK; rendered checks remain separate');
