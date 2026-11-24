const SERVICE = '419bb104-0dda-460b-84f2-7a5a68dcdbb0';
const WRITE = '419bb105-0dda-460b-84f2-7a5a68dcdbb0';
const INDICATE = '419bb106-0dda-460b-84f2-7a5a68dcdbb0';
const CHUNK = 20;
const FRAME_LIMIT = 1024;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

class VisitChannel extends EventTarget {
  constructor(connection, stream) {
    super();
    this.connection = connection;
    this.stream = stream;
    this.readyState = 'open';
  }

  get bufferedAmount() { return this.connection.bufferedAmount; }

  send(text) {
    if (this.readyState !== 'open') throw new Error('Dieser Besuch ist beendet.');
    this.connection.send(text);
  }

  end() {
    if (this.readyState === 'closed') return;
    this.readyState = 'closed';
    this.dispatchEvent(new Event('close'));
  }

  close() {
    if (this.readyState === 'closed') return;
    this.end();
    if (!this.connection.persistent) this.connection.close();
    else if (this.connection.stream === this.stream && this.connection.readyState === 'open') {
      try {
        this.connection.send(JSON.stringify({ event: 'leave-visit', stream: this.stream }));
      } catch {
        this.connection.close();
      }
    }
  }
}

export class BluetoothChannel extends EventTarget {
  static async connect(code) {
    const device = await navigator.bluetooth.requestDevice({ filters: [{ services: [SERVICE] }] });
    const channel = new BluetoothChannel(device);
    try {
      await channel.connect(code);
      return channel;
    } catch (error) {
      channel.close();
      throw error;
    }
  }

  constructor(device) {
    super();
    this.device = device;
    this.readyState = 'connecting';
    this.bufferedAmount = 0;
    this.partial = [];
    this.outbox = Promise.resolve();
    device.addEventListener('gattserverdisconnected', () => this.close(), { once: true });
  }

  async connect(code) {
    const gatt = await this.device.gatt.connect();
    const service = await gatt.getPrimaryService(SERVICE);
    this.tx = await service.getCharacteristic(WRITE);
    this.rx = await service.getCharacteristic(INDICATE);
    this.rx.addEventListener('characteristicvaluechanged', ({ target }) => this.receive(target.value));
    await this.rx.startNotifications();
    const deadline = AbortSignal.timeout(10000);
    const waiting = new Promise((resolve, reject) => {
      this.addEventListener('authenticated', resolve, { once: true, signal: deadline });
      this.addEventListener('wrong-code', () => reject(new Error('Der Kopplungscode stimmt nicht.')), { once: true, signal: deadline });
      this.addEventListener('close', () => reject(new Error('Die Bluetooth-Verbindung wurde unterbrochen.')), { once: true, signal: deadline });
      deadline.addEventListener('abort', () => reject(new Error('Keine Antwort. Starten Sie die Kopplung im Windows-Spiel erneut.')), { once: true });
    });
    await Promise.all([waiting, this.write(JSON.stringify({ code, standby: true }))]);
    if (this.readyState === 'closed') throw new Error('Die Bluetooth-Verbindung wurde unterbrochen.');
    this.readyState = 'open';
  }

  receive(value) {
    for (let index = 0; index < value.byteLength; index++) {
      const byte = value.getUint8(index);
      if (byte === 10) {
        this.complete();
      } else {
        this.partial.push(byte);
        if (this.partial.length > FRAME_LIMIT) {
          this.close();
          break;
        }
      }
    }
  }

  complete() {
    const bytes = Uint8Array.from(this.partial);
    this.partial = [];
    try {
      const text = decoder.decode(bytes);
      const packet = JSON.parse(text);
      if (packet.event === 'paired' && this.readyState === 'connecting') {
        this.persistent = true;
        this.dispatchEvent(new Event('authenticated'));
      } else if (packet.event === 'ready' && /^amt-ticket-[a-z0-9]{16}$/.test(packet.stream)) {
        if (this.stream === packet.stream) return;
        this.visit?.end();
        this.visit = null;
        this.stream = packet.stream;
        this.captions = packet.captions === 'en' ? 'en' : '';
        if (!this.persistent && this.readyState === 'connecting') this.dispatchEvent(new Event('authenticated'));
        this.dispatchEvent(new Event('visit'));
      } else if (packet.event === 'visit-ended' && this.persistent && this.stream) {
        this.stream = '';
        this.visit?.end();
        this.visit = null;
        this.dispatchEvent(new Event('visit'));
      } else if (packet.event === 'no-visit' && this.persistent) {
        this.dispatchEvent(new Event('no-visit'));
      } else if (packet.event === 'wrong-code') {
        this.dispatchEvent(new Event('wrong-code'));
      } else if (packet.event === 'closed') {
        this.close();
      } else if (this.readyState === 'open' && packet.session === this.stream) {
        this.visit?.dispatchEvent(new MessageEvent('message', { data: text }));
      }
    } catch {
      this.close();
    }
  }

  scanAppointment() {
    this.send(JSON.stringify({ event: 'find-visit' }));
  }

  visitChannel() {
    if (!this.stream || this.readyState !== 'open') return null;
    if (this.visit?.readyState !== 'open') this.visit = new VisitChannel(this, this.stream);
    return this.visit;
  }

  send(text) {
    const size = encoder.encode(text).length;
    if (this.readyState !== 'open' || size > FRAME_LIMIT || this.bufferedAmount + size > 4096) {
      throw new Error('Bluetooth ist nicht verfügbar.');
    }
    this.bufferedAmount += size;
    this.outbox = this.outbox.then(() => this.write(text)).catch(() => this.close())
      .finally(() => { this.bufferedAmount -= size; });
  }

  async write(text) {
    const bytes = encoder.encode(text + '\n');
    for (let index = 0; index < bytes.length; index += CHUNK) {
      await this.tx.writeValueWithResponse(bytes.subarray(index, index + CHUNK));
    }
  }

  close() {
    if (this.readyState === 'closed') return;
    this.readyState = 'closed';
    this.visit?.end();
    this.device.gatt.disconnect();
    this.dispatchEvent(new Event('close'));
  }
}
