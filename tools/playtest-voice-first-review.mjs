import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const url = process.argv[2];
const modulePath = process.env.PLAYWRIGHT_MODULE;
if (!url || !modulePath) throw new Error('Pass the local review URL and PLAYWRIGHT_MODULE');
const {chromium} = await import(pathToFileURL(resolve(modulePath, 'index.mjs')).href);
const browser = await chromium.launch({headless: true,
  executablePath: process.env.CHROMIUM_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try {
  for (const [name, width, height, scale] of [
    ['wide', 1920, 1080, 1], ['desktop', 1280, 800, 1],
    ['phone', 390, 844, 1], ['landscape', 640, 360, 1],
    ['narrow', 320, 700, 1], ['narrow-text-200', 320, 700, 2],
  ]) {
    const page = await browser.newPage({viewport: {width, height}});
    await page.goto(url);
    if (scale > 1) await page.addStyleTag({content: `html{font-size:${scale * 100}%}`});
    await page.waitForFunction(() => document.querySelector('#position')?.textContent?.startsWith('1 of 53'));
    const result = await page.evaluate(() => {
      const select = document.querySelector('#filter');
      const rect = select.getBoundingClientRect();
      return {
        filter: select.value, firstOption: select.selectedOptions[0].textContent,
        selected: document.querySelector('#position').textContent,
        pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        filterOverflow: select.scrollWidth > select.clientWidth + 1,
        filterWidth: rect.width, measured: document.documentElement.dataset.textMeasurement,
      };
    });
    assert.equal(result.filter, 'first', name);
    assert.equal(result.firstOption, 'One per speaker', name);
    assert.equal(result.pageOverflow, false, name);
    assert.equal(result.filterOverflow, false, name);
    assert.equal(result.measured, 'pretext-0.0.9', name);
    await page.selectOption('#filter', 'all');
    await page.waitForFunction(() => document.querySelector('#position')?.textContent?.includes('of 236'));
    await page.selectOption('#filter', 'first');
    await page.fill('#search', 'polizei-heinrich-wachtmeister-02');
    await page.waitForFunction(() => document.querySelector('#position')?.textContent?.startsWith('1 of 1'));
    assert.match(await page.locator('#script').textContent(), /NICHT ÜBER DEN RASEN!/);
    console.log(JSON.stringify({name, ...result, allClips: 236, grassWarning: 'found'}));
    await page.close();
  }
} finally {
  await browser.close();
}
