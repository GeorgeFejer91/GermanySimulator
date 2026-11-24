import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import { mkdtemp, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, resolve, sep } from 'node:path';

const { chromium, devices } = createRequire(new URL('../tools/browser-ci/package.json', import.meta.url))('playwright');
const root = resolve(process.argv[2] || 'output/site');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json', '.css': 'text/css', '.mp3': 'audio/mpeg' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    let file = join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root + sep)) throw Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    response.writeHead(200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      'Content-Length': (await stat(file)).size
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));

const profile = await mkdtemp(resolve(root, '..', 'pwa-test-profile-'));
const context = await chromium.launchPersistentContext(profile, {
  ...devices['Pixel 7'],
  channel: 'chrome',
  args: ['--mute-audio', '--disable-background-networking']
});
try {
  await context.addInitScript(() => {
    if (parent !== window) return;
    const serviceId = '419bb104-0dda-460b-84f2-7a5a68dcdbb0';
    const txId = '419bb105-0dda-460b-84f2-7a5a68dcdbb0';
    const rxId = '419bb106-0dda-460b-84f2-7a5a68dcdbb0';
    const stream = 'amt-ticket-q5l09xzv07ra02ej';
    window.testPackets = [];
    Object.defineProperty(navigator, 'bluetooth', {value: {
      async requestDevice({ filters }) {
        if (filters[0].services[0] !== serviceId) throw Error('Wrong BLE service filter');
        const rx = new EventTarget();
        const fakeDevice = new EventTarget();
        const decoder = new TextDecoder();
        let sequence = 0;
        let pending = '';
        rx.startNotifications = async () => rx;
        function deliver(packet) {
          const data = new TextEncoder().encode(JSON.stringify(packet) + '\n');
          for (let start = 0; start < data.length; start += 20) {
            const chunk = data.slice(start, start + 20);
            rx.value = new DataView(chunk.buffer);
            rx.dispatchEvent(new Event('characteristicvaluechanged'));
          }
        }
        function host(type, fields = {}) {
          setTimeout(() => deliver({v:3, session:stream, seq:++sequence, type, ...fields}), 0);
        }
        const tx = {
          async writeValueWithResponse(bytes) {
            if (bytes.length > 20) throw Error('Oversize GATT write');
            pending += decoder.decode(bytes, {stream: true});
            if (!pending.endsWith('\n')) return;
            const packet = JSON.parse(pending);
            pending = '';
            if (packet.code) {
              deliver(packet.code === '61234567' ? { event: 'ready', stream } : { event: 'wrong-code' });
              return;
            }
            window.testPackets.push(packet);
            if (packet.type === 'scan') host('scan-ready');
            if (packet.type === 'register') host('ticket', { number:'A-38', counter:3 });
            if (packet.type === 'ticket-received') {
              host('counter-start');
              host('call-arm', { id:'grass', round:1 });
            }
            if (packet.type === 'call-ready') host('call', {
              id:'grass', round:1, line:'Ein Anruf ohne Internet.', ringAtPhoneMs:null, ringAtUtcMs:null, leadMs:650
            });
          }
        };
        const service = { getCharacteristic: async id => {
          if (id === rxId) return rx;
          if (id === txId) return tx;
          throw Error('Wrong GATT characteristic');
        }};
        fakeDevice.gatt = { connect: async () => ({ getPrimaryService: async uuid => {
          if (uuid !== serviceId) throw Error('Wrong service');
          return service;
        }}), disconnect() {} };
        window.releaseBluetooth = () => deliver({ event:'closed' });
        return fakeDevice;
      }
    }});
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/phone/`);
  await page.locator('#install-app:enabled').waitFor({timeout: 90000});
  const cdp = await context.newCDPSession(page);
  const installability = await cdp.send('Page.getInstallabilityErrors');
  assert.deepEqual(installability.installabilityErrors, []);
  await context.setOffline(true);
  await page.reload();
  await page.locator('#ble-status').filter({ hasText:'Offline bereit' }).waitFor();
  const audioRange = await page.evaluate(async () => {
    const response = await fetch('../assets/voices/kriminalpolizei/kriminalpolizei-phone-01.mp3', {
      headers: { Range: 'bytes=0-255' }
    });
    return { status: response.status, count: (await response.arrayBuffer()).byteLength };
  });
  assert.deepEqual(audioRange, { status:206, count:256 });
  await page.setViewportSize({width:320, height:680});
  await page.evaluate(() => { document.documentElement.style.zoom = 2; });
  await page.locator('#connect-phone[data-pretext-fit]').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
  console.log('Chrome accepted the PWA manifest and reloaded the cached app with the network disabled.');

  await page.locator('#pair-code').fill('00000000');
  await page.locator('#connect-phone').click();
  await page.locator('#ble-status').filter({ hasText:'stimmt nicht' }).waitFor();
  await page.locator('#pair-code').fill('61234567');
  await page.locator('#connect-phone').click();
  const phone = page.frameLocator('#amt-phone');
  await phone.locator('#phone-name').fill('Erika Prüfnamen');
  await phone.locator('#phone-submit:not([disabled])').click();
  await phone.locator('#phone-number').filter({ hasText:'A-38' }).waitFor();
  await phone.locator('#phone-call:not([hidden])').waitFor();
  await phone.locator('#phone-swipe-label').click();
  await page.waitForFunction(() => testPackets.some(packet => packet.type === 'answer'));
  assert.ok(await page.evaluate(() => testPackets.some(packet => packet.name === 'Erika Prüfnamen')));
  await page.evaluate(() => releaseBluetooth());
  await page.locator('#pair-code').waitFor();
  assert.deepEqual(errors, []);
  console.log('The offline phone UI rejected a wrong code, received a ticket and answered a call through the GATT fixture.');
} finally {
  await context.close();
  await new Promise(done => server.close(done));
}
