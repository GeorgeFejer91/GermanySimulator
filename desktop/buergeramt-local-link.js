(function () {
  "use strict";

  class LocalChannel extends EventTarget {
    constructor(transport, peer) {
      super();
      this.transport = transport;
      this.peer = peer;
      this.readyState = "open";
    }

    get bufferedAmount() { return this.transport.socket.bufferedAmount; }

    send(text) {
      const packet = JSON.parse(text);
      this.transport.socket.send(
        this.peer === "host" ? text : JSON.stringify({ peer: this.peer, packet })
      );
    }

    receive(packet) {
      this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(packet) }));
    }

    close() {
      if (this.readyState === "closed") return;
      this.readyState = "closed";
      this.dispatchEvent(new Event("close"));
    }
  }

  class LocalTransport {
    constructor(link) {
      this.link = link;
      this.channels = new Map();
    }

    async start() {
      const attempts = this.link.role === "host" ? 3 : 1;
      for (let attempt = 0; attempt < attempts && !this.link.closed; attempt++) {
        try {
          return await this.connect();
        } catch (error) {
          if (attempt + 1 === attempts) throw error;
          // The previous office visit can still be delivering its final ticket events.
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }

    connect() {
      const { role, invitation } = this.link;
      const url = new URL("/__amt/" + role, location.href);
      url.protocol = "ws:";
      const socket = this.socket = new WebSocket(url);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => socket.close(), 6000);
        socket.addEventListener("open", () => socket.send(JSON.stringify(invitation)));
        socket.addEventListener("message", ({ data }) => {
          const message = JSON.parse(data);
          if (message.event === "listening") {
            clearTimeout(timer);
            this.link.phoneOrigin = message.phone_origin;
            resolve();
          } else if (message.event === "ready") {
            clearTimeout(timer);
            this.join("host");
            resolve();
          } else if (message.event === "joined") {
            this.join(message.peer);
          } else if (message.event === "left") {
            this.leave(message.peer);
          } else if (message.event === "packet") {
            this.channels.get(message.peer)?.receive(message.packet);
          } else if (role === "phone") {
            this.channels.get("host")?.receive(message);
          }
        });
        socket.addEventListener("close", () => {
          clearTimeout(timer);
          for (const peer of this.channels.keys()) this.leave(peer);
          reject(new Error("Lokale Telefonverbindung getrennt"));
        });
      });
    }

    join(peer) {
      if (this.link.closed || this.channels.has(peer)) return;
      const channel = new LocalChannel(this, peer);
      this.channels.set(peer, channel);
      this.link.attach(String(peer), channel);
    }

    leave(peer) {
      this.channels.get(peer)?.close();
      this.channels.delete(peer);
    }

    close() {
      this.socket?.close();
    }
  }

  window.BuergeramtLocalTransport = LocalTransport;

  const synthesis = globalThis.speechSynthesis;
  if (synthesis) {
    const speak = synthesis.speak.bind(synthesis);
    synthesis.speak = utterance => {
      const language = (utterance.lang || document.documentElement.lang).split(/[-_]/)[0];
      const voice = utterance.voice?.localService ? utterance.voice
        : synthesis.getVoices().find(candidate => candidate.localService && candidate.lang.split(/[-_]/)[0] === language);
      if (voice) {
        utterance.voice = voice;
        speak(utterance);
      } else {
        queueMicrotask(() => utterance.dispatchEvent(Object.assign(
          new Event("error"), { error: "voice-unavailable" }
        )));
      }
    };
  }
})();
