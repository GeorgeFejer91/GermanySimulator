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
    let stream = '', activeVisit;
    window.testPackets = [];
    window.bluetoothConnections = 0;
    window.appointmentScans = 0;
    Object.defineProperty(navigator, 'bluetooth', {value: {
      async requestDevice({ filters }) {
        if (filters[0].services[0] !== serviceId) throw Error('Wrong BLE service filter');
        window.bluetoothConnections++;
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
              if (packet.code === '61234567' && packet.standby === true) deliver({ event: 'paired' });
              else if (packet.code === '71234567') {
                stream = 'amt-ticket-q5l09xzv07ra02ej';
                deliver({ event: 'ready', stream });
              } else deliver({ event: 'wrong-code' });
              return;
            }
            if (packet.event === 'find-visit') {
              window.appointmentScans++;
              if (!activeVisit) deliver({ event:'no-visit' });
              else {
                stream = activeVisit.stream;
                sequence = 0;
                deliver({ event:'ready', ...activeVisit });
              }
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
              id:'grass', round:packet.round, line:'Ein Anruf ohne Internet.', ringAtPhoneMs:null, ringAtUtcMs:null, leadMs:650
            });
            if (packet.type === 'decline') host('call-arm', { id:'grass', round:2 });
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
        window.beginBluetoothVisit = (nextStream, captions) => {
          activeVisit = { stream:nextStream, captions };
        };
        window.endBluetoothVisit = () => {
          activeVisit = null;
          deliver({ event:'visit-ended' });
        };
        window.oldBluetoothForfeit = session => deliver({ v:3, session, seq:999, type:'forfeit' });
        window.releaseBluetooth = () => deliver({ event:'closed' });
        return fakeDevice;
      }
    }});
  });
  const page = await context.newPage();
  const errors = [];
  const origin = 'http://127.0.0.1:' + server.address().port;
  const outside = [];
  page.on('request', request => {
    if (request.url().startsWith('http') && new URL(request.url()).origin !== origin) outside.push(request.url());
  });
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
  await page.locator('#ble-status').filter({ hasText:'Bluetooth verbunden' }).waitFor();
  assert.equal(await page.locator('#amt-phone').isVisible(), false);
  assert.deepEqual(await page.evaluate(() => testPackets), []);
  const scan = page.locator('#scan-appointment');
  await scan.waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'scan-appointment');
  for (const [width, height, zoom] of [[320, 680, 2], [700, 320, 1]]) {
    await page.setViewportSize({width, height});
    await page.evaluate(value => { document.documentElement.style.zoom = value; }, zoom);
    await page.locator('#scan-appointment[data-pretext-fit]:visible').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  }
  await page.setViewportSize({width:390, height:844});
  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
  await scan.click();
  await page.locator('#ble-status').filter({ hasText:'Kein Termin gefunden' }).waitFor();
  assert.equal(await page.locator('#amt-phone').isVisible(), false);
  const firstVisit = 'amt-ticket-q5l09xzv07ra02ej';
  const secondVisit = 'amt-ticket-v5l09xzv07ra02ej';
  await page.evaluate(stream => beginBluetoothVisit(stream, 'en'), firstVisit);
  assert.equal(await page.locator('#amt-phone').isVisible(), false);
  await scan.click();
  const phone = page.frameLocator('#amt-phone');
  await phone.locator('#phone-name').fill('Erika Prüfnamen');
  await phone.locator('#phone-submit:not([disabled])').click();
  await phone.locator('#phone-number').filter({ hasText:'A-38' }).waitFor();
  await phone.locator('#phone-call:not([hidden])').waitFor();
  assert.equal(await phone.locator('#phone-swipe-label').textContent(), 'ANSWER');
  await phone.locator('#phone-decline-label').click();
  await page.waitForFunction(() => testPackets.some(packet => packet.type === 'decline' && packet.round === 1));
  await phone.locator('#phone-call:not([hidden])').waitFor();
  await phone.locator('#phone-swipe-label').click();
  await page.waitForFunction(() => testPackets.some(packet => packet.type === 'answer' && packet.round === 2));
  await page.waitForFunction(() => testPackets.some(packet => packet.type === 'police-start'
    && packet.index === -1 && ['voice', 'recording'].includes(packet.mode)));
  assert.ok(await page.evaluate(() => testPackets.some(packet => packet.type === 'call-ringing' && packet.round === 2)));
  await phone.locator('#phone-hangup').click();
  await page.waitForFunction(() => testPackets.some(packet => packet.type === 'hangup' && packet.round === 2));
  await page.waitForFunction(() => testPackets.some(packet => packet.type === 'call-ended' && packet.round === 2));
  assert.ok(await page.evaluate(() => testPackets.some(packet => packet.name === 'Erika Prüfnamen')));
  await page.evaluate(() => endBluetoothVisit());
  await page.locator('#ble-status').filter({ hasText:'Bluetooth verbunden' }).waitFor();
  assert.equal(await page.locator('#amt-phone').isVisible(), false);
  await page.evaluate(stream => beginBluetoothVisit(stream), secondVisit);
  await scan.click();
  await phone.locator('#phone-name').fill('Erika Zweiter Besuch');
  await phone.locator('#phone-submit:not([disabled])').click();
  await phone.locator('#phone-number').filter({ hasText:'A-38' }).waitFor();
  await page.evaluate(stream => oldBluetoothForfeit(stream), firstVisit);
  await phone.locator('#phone-ticket:not([hidden])').waitFor();
  assert.equal(await page.evaluate(() => bluetoothConnections), 2);
  assert.equal(await page.evaluate(() => appointmentScans), 3);
  const registrations = await page.evaluate(() => testPackets.filter(packet => packet.type === 'register')
    .map(({ session, name, id }) => JSON.stringify([session, name, id])));
  assert.deepEqual([...new Set(registrations)].map(value => JSON.parse(value).slice(0, 2)),
    [[firstVisit, 'Erika Prüfnamen'], [secondVisit, 'Erika Zweiter Besuch']]);
  await page.evaluate(() => releaseBluetooth());
  await page.locator('#pair-code').waitFor();

  await page.locator('#pair-code').fill('71234567');
  await page.locator('#connect-phone').click();
  await phone.locator('#phone-name').waitFor();
  await page.evaluate(() => releaseBluetooth());
  await page.locator('#pair-code').waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(outside, []);
  console.log('The offline phone scanned two visits over one emulated GATT connection, played cached speech, and sent decline, answer, hang-up, and call-ended receipts. Legacy pairing also opened the phone UI.');
} finally {
  await context.close();
  await new Promise(done => server.close(done));
}
