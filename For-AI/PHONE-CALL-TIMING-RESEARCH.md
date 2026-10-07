# Bürgeramt call timing and interference evidence

Checked 2026-10-07. The desktop remains the call authority. The linked phone
may be on another operating system, network path, and physical audio device.

## Time source comparison

| Candidate | Verified behavior | Role in this game |
| --- | --- | --- |
| Direct phone ↔ desktop `sync-ping`/`sync-pong` | Four `performance.now()` stamps give peer offset and round-trip delay on the actual ordered call channel. The [NTP four-timestamp method](https://www.rfc-editor.org/rfc/rfc5905.html) is the model. | Primary. Repeated every 1.5 s; use a fresh low-delay offset for the future ring target. A readiness reply confirms that the phone page received the arm. |
| [TimeAPI.io](https://timeapi.io/) | Live `GET /api/Time/current/zone?timeZone=UTC` returned HTTP 200, UTC milliseconds and `Access-Control-Allow-Origin: *` without a key on 2026-10-07. The provider [documents CORS](https://timeapi.io/home/changelog) and a free service in its [FAQ](https://timeapi.io/home/faqs). | Selected optional UTC anchor, sampled three times with a 1.8 s timeout; the lowest-trip sample is used only if recent and reasonably quick. It also checks the phone clock display. Failure does not prevent a call. |
| [Time.Now developer API](https://time.now/developer) | Live `GET /developer/api/timezone/Etc/UTC` returned HTTP 200 with `utc_datetime` and an origin-specific CORS header without a key on 2026-10-07. Its developer page requests [site attribution](https://time.now/developer). The author also [describes the keyless API](https://dev.to/time-now-api/i-built-a-free-open-world-time-api-no-api-keys-cors-enabled-5en). | Viable alternative, not loaded by the game. It does not remove HTTP path asymmetry or browser audio latency. |

Neither public service offers an API key for these free endpoints. External
UTC gives a shared wall-clock estimate, but its response timestamp cannot
measure delay on the game’s phone↔desktop route. The game therefore uses the
direct peer estimate first, TimeAPI UTC only when that estimate is unavailable,
and receipt-relative timing when both are unavailable. The UTC sampling
uncertainty is a screening estimate of half the observed fetch duration plus
50 ms, not a hard error bound. It is rejected after five minutes or when the
estimate exceeds 300 ms. The direct offset is rejected after six seconds or
when its estimated uncertainty exceeds 250 ms.

## Exact scripted order

1. The player submits their name on the phone. That trusted tap creates or
   resumes its Web Audio context; it also supplies sticky user activation for
   vibration where the browser supports it. The host will not start the call
   without this registration.
2. Frau Knick begins the existing visible German sentence. The desktop sends
   `call-arm`; the phone responds `call-ready` after attempting to resume its
   audio context. A missing reply gives way to a one-second fallback.
3. The desktop chooses a ring target **2,200 ms after commitment**. It sends
   that target in the phone's measured monotonic domain when the peer estimate
   is fresh, plus an optional UTC target from TimeAPI. The phone acknowledges
   its chosen mode and actual scheduled target.
4. **900 ms before the target**, the desktop starts a short, low-level GSM
   style buzz and ducks its office Web Audio bus. It pauses the current
   browser-synthesized sentence where supported, then resumes it at ring time.
5. At the target, the phone reveals the incoming-call surface, starts the
   first ringtone burst and requests vibration. Subsequent bursts use a
   2,800 ms cadence. The first burst is placed on the Web Audio timeline as
   soon as the `call` message arrives; later bursts are scheduled ahead of
   their target. Answer, decline, forfeiture and page exit cancel scheduled
   audio and vibration.

The phone reports whether it used `peer`, `utc`, or `receipt` timing and how
late a target already was on arrival. `BuergeramtLevel.timing.call` exposes
this alongside the existing speech timing diagnostics. The arm, call and
receipt payloads use wire envelope v3 and bounded fields. [Monotonic browser
time](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/High_precision_timing)
avoids wall-clock adjustment; [scheduled Web Audio starts](https://www.w3.org/TR/webaudio-1.0/)
reduce main-thread timer jitter for the audible burst. [Page timers can still
run late](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout),
and neither Web Speech callbacks nor `navigator.vibrate()` report physical
speaker or motor onset. A hidden phone forfeits its queue slot rather than
promising background timing.

## What the interference actually is

[Texas Instruments' GSM audio report](https://www.ti.com/lit/an/snaa033d/snaa033d.pdf)
documents a 217 Hz TDMA pulse rate, roughly 0.5 ms transmitter pulses and
harmonics that couple into poorly isolated audio circuits. [Shure](https://www.shure.com/en-US/insights/whats-that-noise-and-how-to-fix-it)
describes the recognizable repeated “blap” sound and notes the old GSM-TDMA
cause is largely obsolete. [Hackaday's capture write-up](https://hackaday.com/2017/06/22/detecting-mobile-phone-transmissions-with-a-sound-card/)
describes a rhythmic “dit-da-dit-dit” from 2G near cheap speakers. The game
synthesizes six short groups of a 217 Hz sawtooth filtered near 1.7 kHz, with
gaps and a restrained peak gain. This is an intentional period sound cue, not
an assertion that a current iPhone or Android phone naturally emits it.

The office bus can be ducked precisely because its hum and effects are Web
Audio nodes. Browser Web Speech is outside that bus; `pause()`/`resume()` is a
best-effort interruption and cannot impose a live distortion filter on the
native voice. [Autoplay rules](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
still apply to audio. [Vibration API support is limited](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
and a web page cannot override silent mode or guarantee haptics on iOS.

## Validation boundary

The local protocol tests cover readiness, stale/failed time samples, future
targets, cancellation and ordered decisions. The silent, headless phone matrix
checks four call families at 390 × 844, 320 × 700, 200% zoom, and landscape
across several ring frames. These tests confirm browser event order and layout;
they cannot establish perceived loudness, native ringtone identity, hardware
vibration or end-to-end acoustic millisecond accuracy. Those require physical
phone and speaker measurements.
