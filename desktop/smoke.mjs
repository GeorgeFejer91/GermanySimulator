import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../tools/browser-ci/package.json', import.meta.url));
const { chromium, devices } = require('playwright');
const loopback = 'http://127.0.0.1:37582';
const evidence = new URL('../output/windows-smoke/', import.meta.url);
await mkdir(evidence, { recursive: true });

const cdp = process.env.GERMANY_SIMULATOR_CDP || 'http://127.0.0.1:37583';
for (let attempt = 0; attempt < 50; attempt++) {
  if (await fetch(cdp + '/json/version').then(result => result.ok).catch(() => false)) break;
  await wait(200);
}

const desktop = await chromium.connectOverCDP(cdp);
const chrome = await chromium.launch({
  channel: 'chrome',
  args: ['--mute-audio', '--disable-background-networking', '--no-proxy-server']
});
const host = desktop.contexts()[0].pages()[0];
const errors = [];
const outside = [];

async function limitRequests(page, origin) {
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    if (route.request().url().startsWith(origin + '/')) return route.continue();
    outside.push(new URL(route.request().url()).origin);
    return route.abort();
  });
}

async function register(phone, name) {
  await phone.locator('#phone-name').fill(name);
  await phone.locator('#phone-submit:not([disabled])').click();
  await phone.locator('#phone-ticket:not([hidden])').waitFor();
  return phone.locator('#phone-number').innerText();
}

async function checkNativeMenu() {
  const pid = process.env.GERMANY_SIMULATOR_QA_PID;
  if (!pid) return;
  const phoneWindow = host.context().waitForEvent('page');
  execFileSync('py', ['-c', `
import sys
import win32con, win32gui, win32process
windows = []
def find_game(hwnd, _):
    if win32process.GetWindowThreadProcessId(hwnd)[1] == int(sys.argv[1]) and win32gui.GetMenu(hwnd):
        windows.append(hwnd)
win32gui.EnumWindows(find_game, None)
assert len(windows) == 1, windows
menu = win32gui.GetSubMenu(win32gui.GetMenu(windows[0]), 0)
item = win32gui.GetMenuItemID(menu, 0)
assert item > 0
win32gui.PostMessage(windows[0], win32con.WM_COMMAND, item, 0)
`, pid]);
  const phone = await phoneWindow;
  await phone.waitForURL(url => url.origin === loopback && url.pathname === '/buergeramt-phone.html' && !!url.hash);
  await phone.locator('#phone-name').waitFor();
  await phone.close();
  console.log('The native Bürgeramt menu opened the current invitation in a second WebView2 window.');
}

try {
  await limitRequests(host, loopback);
  await host.goto(loopback + '/');
  await host.waitForFunction(() => window.Germany3D?.startupReady, null, { timeout: 90000 });
  assert.equal(await host.evaluate(() => document.fonts.load('700 24px UnifrakturCook').then(faces => faces.length)), 1);
  console.log('WebView2 reached the local game and loaded the bundled font.');

  await host.goto(loopback + '/?geheim=buergeramt');
  await host.waitForFunction(() => window.BuergeramtLevel?.active && BuergeramtLevel.phoneUrl, null, { timeout: 120000 });
  const qr = new URL(await host.evaluate(() => BuergeramtLevel.phoneUrl));
  assert.notEqual(qr.hostname, '127.0.0.1');
  assert.equal(await host.evaluate(() => BuergeramtLevel.qrSvg.includes('<svg')), true);
  const context = await chrome.newContext(devices['Pixel 7']);
  const phone = await context.newPage();
  await limitRequests(phone, qr.origin);
  const invalid = new URL(qr);
  const badFragment = new URLSearchParams(invalid.hash.slice(1));
  badFragment.set('secret', '0'.repeat(32));
  invalid.hash = badFragment;
  await phone.goto(invalid.href);
  await phone.locator('#phone-admission-status').filter({ hasText: /erneut/i }).waitFor({ timeout: 8000 });
  await phone.goto(qr.href);
  const number = await register(phone, 'Erika Offline');
  await host.waitForFunction(ticket => BuergeramtLevel.registrationTicket === ticket && BuergeramtLevel.activated, number);
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  await phone.screenshot({path: fileURLToPath(new URL('phone-ticket.png', evidence))});
  assert.equal((await fetch(qr.origin + '/game.js')).status, 404);
  assert.equal((await fetch(qr.origin + '/__amt/host', { headers: { Origin: qr.origin } })).status, 404);
  await phone.evaluate(() => dispatchEvent(new Event('offline')));
  assert.equal(await phone.locator('#phone-ticket').isVisible(), true);
  await host.evaluate(() => document.getElementById('amt-direct-reset').click());
  await host.waitForFunction(oldHash => BuergeramtLevel.phoneUrl
    && new URL(BuergeramtLevel.phoneUrl).hash !== oldHash, qr.hash);
  await phone.locator('#phone-expired:not([hidden])').waitFor();
  await checkNativeMenu();
  await host.goto(loopback + '/');
  await context.close();
  console.log('The QR endpoint accepted a real office ticket and retired it when the visit ended.');

  const invite = await host.evaluate(async () => {
    const invitation = BuergeramtLink.invitation();
    const link = new BuergeramtLink('host', invitation);
    window.testLink = link;
    window.testReceipts = [];
    link.addEventListener('message', ({ detail }) => {
      window.testReceipts.push(detail.type);
      if (detail.type === 'scan') link.send('scan-ready', {}, detail.peer);
      if (detail.type === 'register') link.send('ticket', {number: 'A-38', counter: 3}, detail.peer);
      if (detail.type === 'ticket-received') {
        link.send('counter-start', {}, detail.peer);
        link.send('call-arm', {id: 'grass', round: 1}, detail.peer);
      }
      if (detail.type === 'call-ready') {
        link.send('call', {
          id: 'grass', round: 1, line: 'Ein lokaler Anruf.', ringAtPhoneMs: null,
          ringAtUtcMs: null, leadMs: 650
        }, detail.peer);
      }
    });
    await link.start();
    return BuergeramtLink.phoneUrl(invitation, false, location.origin);
  });
  const local = await chrome.newPage({ viewport: { width: 320, height: 700 } });
  await limitRequests(local, loopback);
  await local.goto(invite);
  assert.equal(await register(local, 'Erika Offline'), 'A-38');
  await local.locator('#phone-call:not([hidden])').waitFor();
  assert.equal(await local.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  await local.locator('#phone-answer').click();
  await host.waitForFunction(() => testReceipts.includes('answer'));
  await local.screenshot({path: fileURLToPath(new URL('phone-call.png', evidence))});
  await host.evaluate(() => testLink.close());
  assert.deepEqual(errors, []);
  assert.deepEqual(outside, []);
  console.log('A same-PC browser received and answered a simulated call over the real local transport.');
} finally {
  await chrome.close();
  await desktop.close();
}
