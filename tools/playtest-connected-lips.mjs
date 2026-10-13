// GPU pixel contract for every encoded native mouth pose. Run against a local
// static server with PLAYWRIGHT_MODULE, CHROMIUM_PATH, GAME_URL and optionally
// PLAYTEST_OUTPUT. This fixture does not judge anatomy or natural gameplay.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const output=resolve(process.env.PLAYTEST_OUTPUT||join(root,'output/connected-lips/gpu-shapes'));
const gameUrl=new URL(process.env.GAME_URL||'http://127.0.0.1:8877/index.html');
const actors=['clerk','aktenkurier','archivbotin','formularsammler',
  'nummernfluesterer','nachtschichtmelderin','pfandarchitektin',
  'kopiependler','warteschlangenpoetin','renter','parent','pensioner'];
const shapes={
  closed:[0,0,0,0],open:[1,0,0,0],wide:[.6,1,0,0],
  round:[.6,0,1,0],bite:[.7,0,0,1],
};
const hash=path=>createHash('sha256').update(readFileSync(join(root,path))).digest('hex');
const manifestPath=id=>'assets/buergeramt/animation/'+id+'.json';
const manifests=actors.map(id=>({id,path:manifestPath(id),data:JSON.parse(readFileSync(join(root,manifestPath(id)),'utf8'))}));
assert.equal(manifests.length,12);
assert.equal(manifests.reduce((n,item)=>n+item.data.states.length,0),67,'native state inventory changed');
const revision=Object.fromEntries([
  'buergeramt-mouth-paint.js','buergeramt-painted-anchor.js',
  'assets/vendor/three/0.186.0/build/three.module.min.js',
  ...manifests.map(item=>item.path),
].map(path=>[path,hash(path)]));
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
mkdirSync(output,{recursive:true});
const report={scope:'encoded native anchor GPU mouth ROI, 96x64',gameUrl:gameUrl.href,
  revision,shapes,keys:[],failures:[],errors:[],
  limits:['Pixel contracts do not approve anatomy, motion, audio sync, or in-game frame cost.']};
let browser,context,page;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,
    args:['--mute-audio','--use-gl=angle','--use-angle=swiftshader']});
  context=await browser.newContext({viewport:{width:320,height:240}});
  page=await context.newPage();
  page.on('pageerror',error=>report.errors.push('pageerror: '+error.message));
  page.on('console',message=>{if(message.type()==='error')report.errors.push('console: '+message.text())});
  await page.route(gameUrl.href,route=>route.fulfill({status:200,contentType:'text/html',
    body:'<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'}));
  await page.goto(gameUrl.href,{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(async()=>{
    const THREE=await import('./assets/vendor/three/0.186.0/build/three.module.min.js');
    const {mouthPaintGlsl,nativeMouthRect,nativeMouthAngle,nativeMouthGap}=await import('./buergeramt-mouth-paint.js');
    const width=96,height=64,canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;document.body.append(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,premultipliedAlpha:false,
      preserveDrawingBuffer:true,antialias:false});
    renderer.setSize(width,height,false);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.NoToneMapping;
    const gl=renderer.getContext();
    if(!(gl instanceof WebGL2RenderingContext))throw new Error('Pinned Three did not create WebGL2');
    const material=new THREE.ShaderMaterial({
      uniforms:{sourceMap:{value:null},mouthRect:{value:new THREE.Vector4()},
        mouthShape:{value:new THREE.Vector4()},mouthAngle:{value:0},
        mouthGap:{value:new THREE.Vector2()},
        sourcePixels:{value:new THREE.Vector2()},candidate:{value:0}},
      vertexShader:'varying vec2 roiUv; void main(){roiUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:'uniform sampler2D sourceMap;uniform vec4 mouthRect;uniform vec4 mouthShape;'+
        'uniform float mouthAngle;uniform vec2 mouthGap;uniform float candidate;uniform vec2 sourcePixels;varying vec2 roiUv;\n'+
        mouthPaintGlsl+
        '\nvoid main(){vec2 uv=mouthRect.xy+(roiUv-.5)*vec2(96.,64.)/sourcePixels;'+
        'gl_FragColor=candidate>.5?amtMouthPaint(sourceMap,uv,mouthRect,mouthShape,mouthAngle,mouthGap):texture2D(sourceMap,uv);}',
      transparent:false,blending:THREE.NoBlending,depthTest:false,depthWrite:false,toneMapped:false,
    });
    const geometry=new THREE.PlaneGeometry(2,2),scene=new THREE.Scene();
    scene.add(new THREE.Mesh(geometry,material));
    const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,2);
    camera.position.z=1;
    const cache=new Map();
    const sha256=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)))
      .map(byte=>byte.toString(16).padStart(2,'0')).join('');
    window.__connectedLipProbe={
      async sample(id,stateId,shapeEntries){
        let cached=cache.get(id);
        if(!cached){
          const response=await fetch('./assets/buergeramt/animation/'+id+'.json');
          if(!response.ok)throw new Error('Manifest unavailable: '+id);
          const bytes=await response.arrayBuffer();
          cached={manifest:JSON.parse(new TextDecoder().decode(bytes)),sha256:await sha256(bytes)};
          cache.set(id,cached);
        }
        const {manifest}=cached;
        const frame=manifest.anchors?.frames?.[stateId];
        if(!frame)throw new Error('Encoded anchor unavailable: '+id+'/'+stateId);
        const rect=nativeMouthRect(manifest,stateId),angle=nativeMouthAngle(manifest,stateId),
          gap=nativeMouthGap(manifest,stateId);
        const url=new URL(frame.file,new URL('./assets/buergeramt/animation/'+id+'.json',location.href));
        const response=await fetch(url);
        if(!response.ok)throw new Error('Encoded frame unavailable: '+url.href);
        const frameBytes=await response.arrayBuffer(),frameSha256=await sha256(frameBytes);
        const bitmap=await createImageBitmap(new Blob([frameBytes],{type:'image/webp'}),
          {imageOrientation:'flipY',premultiplyAlpha:'none',colorSpaceConversion:'none'});
        let texture;
        try{
          const [sourceWidth,sourceHeight]=manifest.canvas_xy;
          if(bitmap.width!==sourceWidth||bitmap.height!==sourceHeight)
            throw new Error('Encoded frame dimensions differ: '+id+'/'+stateId);
          texture=new THREE.Texture(bitmap);
          texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;
          texture.generateMipmaps=false;texture.minFilter=texture.magFilter=THREE.LinearFilter;
          texture.needsUpdate=true;
          material.uniforms.sourceMap.value=texture;
          material.uniforms.mouthRect.value.fromArray(rect);
          material.uniforms.mouthAngle.value=angle;
          material.uniforms.mouthGap.value.fromArray(gap);
          material.uniforms.sourcePixels.value.set(sourceWidth,sourceHeight);
          const samples={};
          for(const [name,shape] of [['baseline',null],...shapeEntries]){
            material.uniforms.candidate.value=name==='baseline'?0:1;
            material.uniforms.mouthShape.value.fromArray(shape??[0,0,0,0]);
            renderer.render(scene,camera);
            const rgba=new Uint8Array(width*height*4);
            gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
            const error=gl.getError();
            if(error!==gl.NO_ERROR)throw new Error('WebGL read failed: '+error+' '+id+'/'+stateId+'/'+name);
            samples[name]={rgba:Array.from(rgba),png:canvas.toDataURL('image/png')};
          }
          return{rect,angle,gap,width:sourceWidth,height:sourceHeight,frame:url.pathname,
            frameSha256,manifestSha256:cached.sha256,samples};
        }finally{
          material.uniforms.sourceMap.value=null;
          texture?.dispose();
          bitmap.close();
        }
      },
      dispose(){
        cache.clear();
        geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();
        canvas.remove();delete window.__connectedLipProbe;
      },
    };
  });

  for(const {id,data} of manifests){
    for(const state of data.states){
      const result=await page.evaluate(
        ([actor,stateId,entries])=>window.__connectedLipProbe.sample(actor,stateId,entries),
        [id,state.id,Object.entries(shapes)]);
      const frame=data.anchors.frames[state.id];
      const framePath='assets/buergeramt/animation/'+frame.file;
      assert.equal(result.frame,new URL(framePath,gameUrl).pathname,'encoded frame route');
      assert.equal(result.manifestSha256,revision[manifestPath(id)],'served manifest differs from local source');
      assert.equal(result.frameSha256,hash(framePath),'served frame differs from local source');
      assert.equal(result.frameSha256,frame.sha256,'encoded frame differs from manifest');
      assert.deepEqual(result.gap,state.mouth_gap,'served lip boundaries differ from local source');
      const baseline=result.samples.baseline.rgba,closed=result.samples.closed.rgba;
      const extent=[result.rect[2]*result.width,result.rect[3]*result.height];
      const cosine=Math.cos(result.angle),sine=Math.sin(result.angle);
      const protectedPixels=[];
      for(let y=0;y<64;y++)for(let x=0;x<96;x++){
        const dx=x+.5-48,dy=31.5-y;
        const qx=(dx*cosine+dy*sine)/extent[0];
        const qy=(-dx*sine+dy*cosine)/extent[1];
        if(qy< -1.8&&Math.abs(qx)<2)protectedPixels.push(y*96+x);
      }
      assert(protectedPixels.length>0,'upper-face ROI missing: '+id+'/'+state.id);
      const entry={actor:id,state:state.id,frame:framePath,frameSha256:result.frameSha256,
        mouthRect:result.rect,mouthAngle:result.angle,mouthGap:result.gap,
        protectedPixelCount:protectedPixels.length,failures:[],
        shapes:{}};
      for(const [name,sample] of Object.entries(result.samples)){
        const safe=id+'--'+state.id.replace(/[^\w-]/g,'_')+'--'+name;
        writeFileSync(join(output,safe+'.png'),Buffer.from(sample.png.split(',')[1],'base64'));
      }
      for(const [name,sample] of Object.entries(result.samples)){
        if(name==='baseline')continue;
        const rgba=sample.rgba;
        let maxRestDifference=0,maxAlphaDifference=0,maxUpperFaceDifference=0,changedPixels=0;
        for(let i=0;i<baseline.length;i+=4){
          let rgbDifference=0;
          for(let c=0;c<3;c++)rgbDifference=Math.max(rgbDifference,Math.abs(rgba[i+c]-baseline[i+c]));
          maxAlphaDifference=Math.max(maxAlphaDifference,Math.abs(rgba[i+3]-baseline[i+3]));
          maxRestDifference=Math.max(maxRestDifference,rgbDifference,Math.abs(rgba[i+3]-baseline[i+3]));
          if(rgbDifference>3)changedPixels++;
        }
        for(const pixel of protectedPixels)for(let c=0;c<3;c++)
          maxUpperFaceDifference=Math.max(maxUpperFaceDifference,
            Math.abs(rgba[pixel*4+c]-baseline[pixel*4+c]));
        entry.shapes[name]={maxRestDifference,maxAlphaDifference,maxUpperFaceDifference,changedPixels};
        if(name==='closed'&&maxRestDifference!==0)entry.failures.push('closed rest differs');
        if(maxAlphaDifference!==0)entry.failures.push(name+' alpha differs');
        if(name!=='closed'){
          if(maxUpperFaceDifference>3)entry.failures.push(name+' upper face changed');
          if(changedPixels<4)entry.failures.push(name+' mouth did not visibly change');
        }
      }
      report.keys.push(entry);
      for(const failure of entry.failures)report.failures.push(id+'/'+state.id+': '+failure);
    }
  }
  assert.equal(report.keys.length,67);
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.failures,[]);
  report.status='PASS';
}catch(error){
  report.status='FAIL';report.failure=error.stack||String(error);
  throw error;
}finally{
  let cleanupFailure;
  try{if(page&&!page.isClosed())await page.evaluate(()=>window.__connectedLipProbe?.dispose())}
  catch(error){cleanupFailure=error;report.errors.push('dispose: '+error.message)}
  try{if(context)await context.close()}catch(error){cleanupFailure??=error;report.errors.push('context close: '+error.message)}
  try{if(browser)await browser.close()}catch(error){cleanupFailure??=error;report.errors.push('browser close: '+error.message)}
  if(report.errors.length)report.status='FAIL';
  writeFileSync(join(output,'results.json'),JSON.stringify(report,null,2));
  if(cleanupFailure)throw cleanupFailure;
  if(report.errors.length)throw new Error(report.errors.join('\n'));
}
