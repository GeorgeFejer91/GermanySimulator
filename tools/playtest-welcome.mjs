import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, sep, extname} from 'node:path';

const {chromium} = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve('.'), out = resolve('output/playwright/welcome');
mkdirSync(out, {recursive: true});
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ttf': 'font/ttf'};
const files = ['game.js', 'game-hud.js', 'game-hud.css', 'styles.css', 'index.html'];
const report = {complete: false, hashes: Object.fromEntries(files.map(file => [file,
  createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex')])), cases: [],
  limits: ['S uses the production welcome path while skipping the humor form',
    'German-side and voice-off variants use the production briefing with controlled state',
    'Silent speech lifecycle stub; no listening or physical Android evidence']};
const server = createServer((req, res) => {
  try {
    const path = new URL(req.url, 'http://local').pathname;
    const file = resolve(root, '.' + decodeURIComponent(path === '/' ? '/index.html' : path));
    assert(file.startsWith(root + sep));
    let body = readFileSync(file);
    if (file === resolve(root, 'game.js')) body = body.toString().replace('window.Germany3DBridge={',
      'window.__welcomeTest={state,openHumorWelcome,openDialogue};window.Germany3DBridge={');
    res.writeHead(200, {'content-type': mime[extname(file)] || 'application/octet-stream'});
    res.end(body);
  } catch {res.writeHead(404).end()}
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_PATH,
  args: ['--mute-audio']});
const cases = [
  ['desktop', 1280, 800], ['wide', 1920, 1080], ['android-portrait', 390, 844],
  ['android-landscape', 844, 390], ['reflow-320', 320, 640],
  ['zoom-200', 640, 1280, 'zoom'], ['text-200', 320, 900, 'text'],
  ['reduced-motion', 390, 844, 'reduced'], ['text-spacing', 390, 844, 'spacing'], ['muted', 390, 844, 'muted'],
  ['germany-en', 320, 700, 'germany'], ['landscape-text-200', 844, 390, 'text'],
];
try {
  for (const [name, width, height, mode] of cases) {
    if (process.env.WELCOME_CASE && name !== process.env.WELCOME_CASE) continue;
    const mobile = name.startsWith('android') || width < 500;
    const context = await browser.newContext({viewport: {width, height}, isMobile: mobile, hasTouch: mobile, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference'});
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.addInitScript(() => {
      window.__spoken = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args) {this.muted = true; return play.apply(this, args)};
      const connect = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function (target, ...args) {
        if (target === this.context.destination) {
          const gain = this.context.createGain(); gain.gain.value = 0;
          connect.call(gain, target); return connect.call(this, gain, ...args);
        }
        return connect.call(this, target, ...args);
      };
      window.SpeechSynthesisUtterance = class {constructor(text) {this.text = text}};
      Object.defineProperty(window, 'speechSynthesis', {configurable: true, value: {
        speaking: false, pending: false, getVoices: () => [{name:"Microsoft Katja - German (Germany)",lang:"de-DE",localService:true}], cancel() {this.speaking = false},
        speak(utterance) {this.speaking = true; __spoken.push(utterance)},
      }});
    });
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil: 'domcontentloaded'});
      await page.waitForFunction(() => window.Germany3D?.startupReady && window.__welcomeTest &&
        !document.body.classList.contains('preloading'), null, {timeout: 120000});
      if (mode === 'zoom') await page.addStyleTag({content: 'html{zoom:2}'});
      if (mode === 'text') await page.addStyleTag({content: 'html{font-size:32px!important}'});
      if (mode === 'spacing') await page.addStyleTag({content:
        '.dialogue.welcome small,.dialogue.welcome p,.dialogue.welcome button{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}.dialogue.welcome p{margin-bottom:2em}'});
      await page.keyboard.press('s');
      await page.waitForFunction(() => __welcomeTest.state.dialogueData?.portrait === 'DE');
      if (mode === 'germany' || mode === 'muted') await page.evaluate(mode => {
        if (mode === 'germany') {__welcomeTest.state.region = 'germany'; __welcomeTest.state.lang = 'en'}
        else __welcomeTest.state.voiceOn = false;
        __welcomeTest.openHumorWelcome();
      }, mode);
      const motion = await page.evaluate(() => {
        const sheet = document.getElementById('dialogue'), machine = document.querySelector('.welcome-fax-machine');
        const animation = sheet.getAnimations().find(a => a.animationName === 'welcome-fax-feed');
        const result = {visible: getComputedStyle(machine).display !== 'none', animated: !!animation};
        if (animation) {
          animation.pause(); animation.currentTime = 100;
          result.earlyTop = sheet.getBoundingClientRect().top;
          animation.currentTime = 600; result.middleTop = sheet.getBoundingClientRect().top;
          const outlet = machine.getBoundingClientRect(), pointY = Math.min(innerHeight - 1, outlet.bottom + 8);
          result.paperBelowOutlet = !!document.elementFromPoint(outlet.left + outlet.width / 2, pointY)?.closest('#dialogue');
          animation.finish(); result.finalTop = sheet.getBoundingClientRect().top;
          result.machineTop = machine.getBoundingClientRect().top;
        }
        return result;
      });
      assert.equal(motion.visible, true, name + ': fixed fax outlet');
      assert.equal(motion.animated, mode !== 'reduced', name + ': reduced motion keeps paper immediately readable');
      if (motion.animated) {
        assert(motion.earlyTop > motion.middleTop && motion.middleTop > motion.finalTop, name + ': paper feeds upward');
        assert(motion.earlyTop > motion.machineTop, name + ': sheet starts behind the stationary outlet');
        assert.equal(motion.paperBelowOutlet, false, name + ': no paper may escape below the outlet');
      }
      if (name === 'desktop') {
        for (const [frame, time] of [['early', 100], ['middle', 600]]) {
          await page.evaluate(time => {const animation = document.getElementById('dialogue').getAnimations()[0]; animation.pause(); animation.currentTime = time}, time);
          await page.screenshot({path: resolve(out, 'fax-feed-' + frame + '.png')});
        }
        await page.evaluate(() => document.getElementById('dialogue').getAnimations()[0].finish());
      }
      const pages = [];
      for (let index = 0; index < 2; index++) {
        await page.waitForFunction(() => document.getElementById('dialogue-text').dataset.measurement === 'pretext-0.0.9');
        const result = await page.evaluate(() => {
          const popup = document.getElementById('dialogue'), copy = popup.querySelector('.dialogue-copy');
          const next = document.getElementById('dialogue-next'), text = document.getElementById('dialogue-text');
          const box = el => {const r = el.getBoundingClientRect(); return {left: r.left, top: r.top, right: r.right,
            bottom: r.bottom, width: r.width, height: r.height}};
          const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
          return {index: __welcomeTest.state.dialogueData.i, text: text.textContent,
            popup: box(popup), copy: box(copy), next: box(next),
            viewport: {width: innerWidth, height: innerHeight}, buttons: [...popup.querySelectorAll('button')]
              .filter(el => el.getClientRects().length).map(el => el.textContent),
            measured: [document.getElementById('speaker'), text, next].map(el => el.dataset.measurement),
            copyOverflowX: copy.scrollWidth > copy.clientWidth + 1,
            scrollReading: copy.scrollHeight > copy.clientHeight + 1,
            popupOverflow: popup.scrollHeight > popup.clientHeight + 1,
            nextOverflow: next.scrollHeight > next.clientHeight + 1 || next.scrollWidth > next.clientWidth + 1,
            enlargedFont: parseFloat(getComputedStyle(text).fontSize), zoom,
            pageCount: __welcomeTest.state.dialogueData.lines.length,
            requestedSpeech: __spoken.map(u => u.text), voiceOn: __welcomeTest.state.voiceOn};
        });
        assert.equal(result.index, index, name);
        assert.equal(result.pageCount, 2, name);
        assert.deepEqual(result.buttons, [mode === 'germany' ? 'NEXT' : 'WEITER'], name);
        assert(result.text.length > 100, name);
        assert(result.popup.width > 0 && result.copy.height > 24 && result.next.height >= 44 * result.zoom - 1, name);
        assert(result.popup.left >= -1 && result.popup.right <= result.viewport.width + 1, name);
        assert(result.popup.top >= -1 && result.next.bottom <= result.viewport.height + 1,
          `${name}: ${JSON.stringify(result)}`);
        assert(result.copy.bottom <= result.next.top + 1, name);
        assert.equal(result.copyOverflowX, false, name);
        assert.equal(result.popupOverflow, false, name);
        assert.equal(result.nextOverflow, false, name);
        assert(result.measured.every(value => value === 'pretext-0.0.9'), name);
        if (mode === 'text') assert(result.enlargedFont >= 34, name);
        if (result.voiceOn) assert(result.requestedSpeech.includes(result.text), `${name}: automatic exact narration`);
        if (result.voiceOn) await page.evaluate(() => __spoken.at(-1).onstart?.());
        if (result.scrollReading) {
          await page.locator('.dialogue-copy').focus();
          await page.locator('.dialogue-copy').evaluate(el => {el.scrollTop = el.scrollHeight});
          assert(await page.locator('.dialogue-copy').evaluate(el => {
            const text = el.querySelector('p').firstChild, range = document.createRange();
            range.setStart(text, text.length - 1); range.setEnd(text, text.length);
            const tail = range.getBoundingClientRect(), box = el.getBoundingClientRect();
            return el.scrollTop > 0 && tail.top >= box.top - 1 && tail.bottom <= box.bottom + 1;
          }), `${name}: the complete copy must remain readable by scrolling`);
        }
        if (name === 'desktop' && index === 0) {
          await page.evaluate(() => __spoken.at(-1).onend?.());
          assert.equal(await page.evaluate(() => __welcomeTest.state.dialogueVoiceBusy), false);
          assert.equal(await page.locator('#dialogue-text').isVisible(), true);
        }
        await page.screenshot({path: resolve(out, `${name}-${index + 1}.png`)});
        pages.push(result);
        if (mobile) await nextTap(page); else await page.locator('#dialogue-next').click();
      }
      assert.equal(await page.locator('#dialogue').isVisible(), false, name);
      assert.equal(await page.locator('.welcome-fax-machine').isVisible(), false, name + ': outlet clears with briefing');
      assert.equal(await page.evaluate(() => __welcomeTest.state.modal), false, name);
      if (mobile) assert.equal(await page.locator('.control-dock').isVisible(), true, `${name}: controls return`);
      if (name === 'desktop') {
        await page.evaluate(() => __welcomeTest.openHumorWelcome());
        await page.keyboard.press('e'); await page.keyboard.press('e');
        assert.equal(await page.locator('#dialogue').isVisible(), false, 'E can finish during the feed');
        assert.equal(await page.locator('.welcome-fax-machine').isVisible(), false, 'early finish clears the outlet');
      }
      assert.deepEqual(errors, [], name);
      report.cases.push({name, motion, pages, errors});
      console.log(`${name}: fax feed, two readable sheets, one action, exact automatic narration`);
    } catch (error) {
      await page.screenshot({path: resolve(out, `${name}-failure.png`)});
      throw error;
    } finally {await context.close()}
  }
  report.complete = true;
} finally {
  writeFileSync(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close(); server.close();
}
async function nextTap(page) {await page.locator('#dialogue-next').tap()}
