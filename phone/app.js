import { BluetoothChannel } from './bluetooth.js';

const pairing = document.getElementById('ble-pairing');
const form = document.getElementById('pair-phone');
const code = document.getElementById('pair-code');
const connect = document.getElementById('connect-phone');
const install = document.getElementById('install-app');
const status = document.getElementById('ble-status');
const phone = document.getElementById('amt-phone');
let channel, installer;

function announce(text) {
  status.textContent = text;
  window.BuergeramtFit?.();
}

window.asBuergeramtPhoneChannel = requester => phone.contentWindow === requester ? channel : null;
const markInstalled = () => { install.hidden = true; window.BuergeramtFit?.(); };
if (matchMedia('(display-mode: standalone)').matches) markInstalled();
window.addEventListener('appinstalled', markInstalled);
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installer = event;
});

install.addEventListener('click', async () => {
  if (!installer) {
    announce('In Chrome können Sie die App über ⋮ → App installieren zum Startbildschirm hinzufügen.');
    return;
  }
  const prompt = installer;
  installer = null;
  try {
    if ((await prompt.prompt()).outcome === 'accepted') markInstalled();
  } catch {
    announce('Öffnen Sie in Chrome das Menü ⋮ und wählen Sie App installieren.');
  }
});

async function prepareOffline() {
  if (!('serviceWorker' in navigator)) {
    install.disabled = true;
    announce('Öffnen Sie diese Seite in Android Chrome, um die Offline-App zu laden.');
    return;
  }
  try {
    await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    let timer;
    try {
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => { timer = setTimeout(reject, 180000); })
      ]);
    } finally {
      clearTimeout(timer);
    }
    install.disabled = false;
    connect.disabled = !navigator.bluetooth;
    announce(connect.disabled
      ? 'Offline-Dateien sind bereit. Dieser Browser unterstützt Web Bluetooth nicht.'
      : 'Offline bereit. Geben Sie den Code aus dem Windows-Spiel ein.');
  } catch {
    announce('Offline-Dateien fehlen. Öffnen Sie diese Seite einmal mit Internet und laden Sie sie neu.');
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  connect.disabled = true;
  announce('Bluetooth-Gerät auswählen …');
  try {
    channel = await BluetoothChannel.connect(code.value);
    channel.addEventListener('close', () => {
      phone.hidden = true;
      phone.removeAttribute('src');
      pairing.hidden = false;
      connect.disabled = false;
      code.value = '';
      announce('Bluetooth getrennt. Für eine neue Verbindung starten Sie die Kopplung im Windows-Spiel.');
      code.focus();
    }, { once: true });
    phone.src = './companion.html';
    phone.hidden = false;
    pairing.hidden = true;
    phone.focus();
  } catch (error) {
    announce(error.name === 'NotFoundError'
      ? 'Kein Gerät ausgewählt. Prüfen Sie Bluetooth und starten Sie bei Bedarf die Kopplung am PC erneut.'
      : error.message);
    connect.disabled = false;
  }
});

prepareOffline();
