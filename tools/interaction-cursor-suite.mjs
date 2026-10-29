import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {browserProfiles} from './browser-harness.mjs';

const cursorFiles = ['index.html', '3d.html', 'cursor.css',
  'tools/interaction-cursor-suite.mjs', 'assets/cursors/provenance.json',
  'assets/cursors/prussian-hand-48.png', 'assets/cursors/prussian-hand-56.png'];
const cursorAt = locator => locator.evaluate(element => getComputedStyle(element).cursor);

// Chromium screenshots omit the OS cursor. This temporary, pointer-transparent
// image shows the exact encoded asset at the CSS hotspot for visual review only.
async function captureCursor(page, artifacts, name, cursor, x, y) {
  if (cursor.includes('prussian-hand-')) {
    await page.evaluate(async ({cursor, x, y}) => {
      const image = new Image();
      image.id = 'qa-cursor';
      image.src = cursor.match(/url\("?([^"\)]+)"?\)/)[1];
      image.style.cssText = `position:fixed;left:${x-3}px;top:${y-3}px;z-index:9999;pointer-events:none`;
      document.body.append(image);
      await image.decode();
    }, {cursor, x, y});
  }
  await artifacts.screenshot(page, name);
  await page.locator('#qa-cursor').evaluateAll(elements => elements.forEach(element => element.remove()));
}

export default {
  name: 'Native Prussian hand cursor',
  profiles: [...browserProfiles, {id:'system-cursor', viewport:{width:1280,height:800}, forcedColors:'active'}],
  sourceFiles(root) {
    const manifest=JSON.parse(readFileSync(resolve(root,'assets/cursors/provenance.json')));
    for(const entry of manifest.exports) {
      const bytes=readFileSync(resolve(root,'assets/cursors',entry.file));
      assert.equal(bytes.length,entry.encodedBytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);
    }
    assert.ok(manifest.exports.filter(entry=>entry.runtime).reduce((sum,entry)=>sum+entry.encodedBytes,0)<=12*1024);
    return Object.fromEntries(cursorFiles.map(file => [file,
      createHash('sha256').update(readFileSync(file.startsWith('tools/')?new URL('../'+file,import.meta.url):resolve(root,file))).digest('hex')]));
  },
  limits: ['Silent headless Chromium; Android profiles are emulation',
    'Screenshots add a QA-only image because OS cursors are absent from captures; native CSS and real input are checked separately',
    'No world geometry, camera, physics, gameplay rules or text geometry changes'],
  scenarios: [{id:'cursor', modes:['quick','stress'], timeoutMs:180000,
    async run({page,baseURL,profile,artifacts}) {
      const checks=[], requested=[];
      const pass = name => {checks.push({name,verdict:'PASS'}); artifacts.log('check',name)};
      page.on('request', request => {if(request.url().includes('/assets/cursors/'))requested.push(request.url())});
      await page.route(/^https:\/\//, route => route.abort());
      await page.goto(baseURL, {waitUntil:'commit'});
      await page.waitForFunction(() => document.getElementById('preload').hidden);
      const custom = !profile.isMobile && profile.forcedColors!=='active';
      const base = await cursorAt(page.locator('body'));
      const active = await cursorAt(page.locator('#start'));
      assert.equal(base.includes('prussian-hand-48.png'), custom);
      assert.equal(active.includes('prussian-hand-56.png'), custom);
      if(custom) {assert.match(base,/3 3, auto$/); assert.match(active,/3 3, pointer$/)}
      pass('root selects native cursors only for a fine hovering pointer outside forced colors');

      // Existing specialized affordances must win over the inherited art.
      const affordances = await page.evaluate(() => {
        const host=document.createElement('div');
        host.innerHTML='<input><textarea></textarea><button disabled>Disabled</button><canvas class="humor-signature-canvas"></canvas><div class="amt-move-stick"></div>';
        document.body.append(host);
        const cursors=[...host.children].map(element=>getComputedStyle(element).cursor);
        host.remove();
        return cursors;
      });
      assert.match(affordances[0],/^(auto|text)$/);
      assert.match(affordances[1],/^(auto|text)$/);
      assert.ok(!affordances[2].includes('prussian-hand-56'));
      assert.equal(affordances[3],'crosshair');
      assert.equal(affordances[4],'grab');
      artifacts.json('specialized-cursors.json',affordances);
      pass('disabled controls, writing fields, signature crosshair and drag cursor retain their affordances');

      const bounds=await page.locator('#start').boundingBox();
      assert.ok(bounds?.width>0 && bounds.height>0);
      const x=bounds.x+bounds.width/2, y=bounds.y+bounds.height/2;
      if(custom)await page.mouse.move(x,y);
      await captureCursor(page,artifacts,'menu-cursor.png',active,x,y);
      if(profile.isMobile)await page.locator('#start').tap(); else await page.mouse.click(x,y);
      assert.ok(await page.locator('#humor-modal').isVisible());
      pass('real pointer or touch Start opens the existing questionnaire');

      if(custom) {
        const decoded=await page.evaluate(async () => {
          const results=[];
          for(const size of [48,56]) {
            const image=new Image(); image.src=`./assets/cursors/prussian-hand-${size}.png`; await image.decode();
            const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
            const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
            const rgba=ctx.getImageData(0,0,size,size).data;
            results.push({size,width:image.naturalWidth,height:image.naturalHeight,
              cornerAlpha:rgba[3],hotspotAlpha:rgba[(3*size+3)*4+3],
              hasOpaque:rgba.some((value,i)=>i%4===3&&value===255)});
          }
          return results;
        });
        for(const item of decoded){assert.equal(item.width,item.size);assert.equal(item.height,item.size);assert.equal(item.cornerAlpha,0);assert.ok(item.hotspotAlpha>128);assert.ok(item.hasOpaque)}
        artifacts.json('decoded-cursors.json',decoded);
        pass('both PNGs decode with genuine alpha and a fingertip covering the 3,3 hotspot');
      }

      // Existing questionnaire/welcome skip is a staging fixture; this check
      // proves the city cursor and file-button input, not the mission chain.
      await page.evaluate(() => document.getElementById('simulator-s').click());
      await page.waitForFunction(() => Germany3DBridge.getHUDState().started);
      await page.evaluate(() => {for(let i=0;i<8;i++)document.getElementById('dialogue-next').click()});
      const worldCursor=await cursorAt(page.locator('#world3d'));
      assert.equal(worldCursor.includes('prussian-hand-48.png'),custom);
      await captureCursor(page,artifacts,'city-cursor.png',worldCursor,profile.viewport.width*.65,profile.viewport.height*.4);
      if(profile.isMobile)await page.locator('#file-toggle').tap(); else await page.locator('#file-toggle').click();
      assert.ok(await page.locator('#case-file').isVisible());
      pass('staged city view retains the cursor and real pointer or touch input opens the file');

      await page.goto(new URL('3d.html?cursor-check=1#cursor-check',baseURL).href,{waitUntil:'commit'});
      await page.waitForFunction(() => location.pathname.endsWith('/index.html') && document.getElementById('preload')?.hidden);
      assert.equal(new URL(page.url()).search,'?cursor-check=1');
      assert.equal(new URL(page.url()).hash,'#cursor-check');
      assert.equal((await cursorAt(page.locator('#world3d'))).includes('prussian-hand-48.png'),custom);
      assert.equal((await cursorAt(page.locator('#start'))).includes('prussian-hand-56.png'),custom);
      await artifacts.screenshot(page,'compatibility-entry.png');
      pass('the compatibility entry preserves query/hash and shares the canonical cursor');
      assert.ok(requested.every(url=>!url.includes('prussian-hand.webp')),'review master is never fetched');
      if(!custom)assert.deepEqual(requested,[],'touch-only and forced-color clients must not fetch cursor PNGs');
      pass('only selected tiny delivery assets are requested');

      if(profile.id==='desktop') {
        await page.route('**/assets/cursors/*.png',route=>route.abort());
        await page.goto(baseURL,{waitUntil:'commit'});
        await page.waitForFunction(() => document.getElementById('preload').hidden);
        assert.match(await cursorAt(page.locator('#start')),/, pointer$/);
        await page.locator('#start').click();
        assert.ok(await page.locator('#humor-modal').isVisible());
        pass('missing cursor images retain native pointer fallback and working interaction');
      }
      return {checks,cursorRequests:requested};
    }
  }]
};
