const channel = window.parent !== window && window.parent.asBuergeramtPhoneChannel?.(window);
if (channel) {
  window.BuergeramtBluetoothInvitation = Object.freeze({ stream: channel.stream });
  window.BuergeramtLocalTransport = class {
    constructor(link) { this.link = link; }
    async start() {
      if (channel.readyState !== 'open') throw new Error('Bluetooth ist getrennt.');
      this.link.attach('host', channel);
    }
    close() { channel.close(); }
  };
}
