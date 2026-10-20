import assert from 'node:assert/strict';
import {resizeViewport} from './browser-harness.mjs';

async function tabTo(page,selector){
  for(let i=0;i<45;i++){
    if(await page.locator(selector).evaluate(el=>el===document.activeElement))return;
    await page.keyboard.press('Tab');
  }
  assert.fail('Keyboard could not reach '+selector);
}

async function runKeyboardAccess({page,baseURL,artifacts,profile},language){
  const checks=[];
  const pass=name=>{checks.push(name);artifacts.log('check',name)};
    await page.goto(baseURL,{waitUntil:'commit'});
    await page.waitForFunction(()=>!document.body.classList.contains('preloading')&&window.GermanyHUD);
    if(language==='en'){
      await tabTo(page,'#language-options [data-lang="en"]');await page.keyboard.press('Enter');
    }
    await tabTo(page,'#start');await page.keyboard.press('Enter');
    await page.locator('#humor-modal').waitFor({state:'visible'});
    await page.waitForFunction(()=>document.getElementById('humor-form').contains(document.activeElement),null,{timeout:5000});
    pass(language+' normal Start transfers focus into the questionnaire');
    await page.locator('#humor-name').focus();await page.keyboard.down('e');
    assert.notEqual(await page.evaluate(()=>Germany3DBridge.getInput().KeyE),true,'editing a form cannot latch the gameplay interaction key');
    await page.keyboard.up('e');await page.keyboard.press('Backspace');
    await tabTo(page,'[data-signature-action="sign"]');await page.keyboard.press('Enter');
    assert.equal(await page.locator('.humor-signature-canvas').getAttribute('data-signed'),'true');
    await tabTo(page,'[data-signature-action="clear"]');await page.keyboard.press('Enter');
    assert.equal(await page.locator('.humor-signature-canvas').getAttribute('data-signed'),'false');
    await tabTo(page,'[data-signature-action="sign"]');await page.keyboard.press('Space');
    assert.equal(await page.locator('.humor-signature-canvas').getAttribute('data-signed'),'true');
    pass(language+' Enter and Space sign; Clear invalidates the same signature state');
    for(const [width,height,zoom,textSize] of [[320,568,1,16],[1280,800,2,16],[390,844,1,32],[844,390,1,16]]){
      await resizeViewport(page,{width,height});
      await page.evaluate(({zoom,textSize})=>{document.documentElement.style.zoom=zoom;document.documentElement.style.fontSize=textSize+'px'}, {zoom,textSize});
      await page.waitForFunction(()=>[...document.querySelectorAll('.humor-signature-controls button')].every(el=>el.dataset.measurement==='pretext-0.0.9'));
      const layout=await page.evaluate(()=>({
        pageOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
        buttons:[...document.querySelectorAll('.humor-signature-controls button')].map(el=>({
          width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
          fit:el.dataset.pretextFit,overflow:el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1,
          fontSize:parseFloat(getComputedStyle(el).fontSize)
        }))
      }));
      assert.equal(layout.pageOverflow,false);assert.ok(layout.buttons.every(b=>b.width>0&&b.height>=44&&!b.overflow&&b.fit!=='reflow'));
      if(textSize===32)assert.ok(layout.buttons.every(b=>b.fontSize>=28),'text enlargement must not shrink back');
      pass(language+' measured signature controls '+JSON.stringify({width,height,zoom,textSize}));
    }
    await page.evaluate(()=>{document.documentElement.style.zoom='';document.documentElement.style.fontSize=''});
    await resizeViewport(page,profile.viewport);
    await page.locator('.humor-actions button:not([disabled])').last().focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.getElementById('humor-form').contains(document.activeElement)),true,'Tab cannot reach background controls');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(()=>document.getElementById('humor-form').contains(document.activeElement)),true,'Shift+Tab cannot reach background controls');
    await page.evaluate(()=>document.getElementById('start').focus());
    assert.equal(await page.evaluate(()=>document.getElementById('humor-form').contains(document.activeElement)),true,'background focus is excluded');
    await artifacts.screenshot(page,'signature-'+language+'.png');
    const formState=()=>page.evaluate(()=>({sheet:document.getElementById('humor-page-label').textContent,hidden:document.getElementById('humor-modal').hidden,
      active:document.activeElement?.outerHTML.slice(0,160),signed:document.querySelector('.humor-signature-canvas')?.dataset.signed,
      fields:[...document.querySelectorAll('#humor-requirements input')].map(el=>({type:el.type,valid:el.validity.valid,checked:el.checked})),
      actions:[...document.querySelectorAll('.humor-actions button')].map(el=>({disabled:el.disabled,type:el.type,stamped:el.classList.contains('stamped')})),nextDisabled:document.getElementById('humor-next').disabled}));
    for(let sheet=0;sheet<2;sheet++){
      await tabTo(page,'[data-signature-action="sign"]');await page.keyboard.press('Enter');
      const required=page.locator('#humor-requirements input[required]');
      for(let i=0;i<await required.count();i++){
        const control=required.nth(i),type=await control.getAttribute('type');await control.focus();
        if(type==='checkbox')await page.keyboard.press('Space');
        else if(type==='date')await control.fill('2026-10-20');
        else await page.keyboard.type('Berlin');
      }
      for(let i=0;i<await page.locator('.humor-actions button').count();i++){
        await page.locator('.humor-actions button').nth(i).focus();await page.keyboard.press('Enter');
        artifacts.log('form',JSON.stringify({action:i,...await formState()}));
      }
      assert.equal(await page.locator('#humor-next').isEnabled(),true,JSON.stringify(await formState()));
      await page.locator('#humor-next').focus();await page.keyboard.press('Enter');
      if(!sheet)await page.waitForFunction(()=>/^(?:BLATT|SHEET) 2\b/.test(document.getElementById('humor-page-label').textContent));
      else await page.locator('#humor-modal').waitFor({state:'hidden'});
    }
    await page.locator('#dialogue').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>Germany3DBridge.getHUDState().started),true);
    pass(language+' both questionnaire sheets complete through semantic controls, without the skip shortcut');
    await page.waitForFunction(()=>document.getElementById('dialogue').contains(document.activeElement));
    for(let i=0;i<2;i++){
      await tabTo(page,'#dialogue-next');await page.keyboard.press('Enter');
    }
    await page.locator('#dialogue').waitFor({state:'hidden'});
    await page.waitForFunction(()=>document.activeElement===document.getElementById('file-toggle'));
    assert.equal(await page.locator('#city-status').evaluate(el=>el.inert),false,'closing the modal releases background controls');
    pass(language+' welcome retains modal focus and closing restores focus to a visible game control');
  return {checks,limits:['Date input uses the native input value interface; no pointer drawing or questionnaire-skip shortcut', 'Chromium keyboard/DOM evidence; not a screen-reader conformance or physical-device claim']};
}

// Each case covers a complete two-sheet questionnaire and the full layout matrix.
// Keep languages separate so a failure identifies the affected entry/copy path.
export const keyboardScenarios=['de','en'].map(language=>({id:'keyboard-'+language,modes:['quick','stress'],timeoutMs:240000,run:context=>runKeyboardAccess(context,language)}));
