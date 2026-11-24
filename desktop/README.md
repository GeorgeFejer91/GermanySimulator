# Germany Simulator for Windows

Run the x64 setup executable and launch **Germany Simulator** from the Start
menu. Setup includes Microsoft’s standalone WebView2 installer. Play uses only
bundled models, textures, dialogue, music, browser modules, and the locally
licensed UnifrakturCook font. Dynamic speech uses the shipped voice models or an
installed local system voice where available.

## Bürgeramt phone

### Bluetooth with Chrome on Android

1. Open [germanysimulator.de/phone/](https://germanysimulator.de/phone/) in
   Android Chrome while online. When it shows **Offline bereit**, tap
   **Download App**. The app caches its interface, recordings and voice model.
   To update an older installed copy, open it online, then close all copies
   and reopen it before going offline.
2. In Windows 0.3.0 or later, select **Jetzt koppeln** when the game starts.
   On the phone, enter the eight-digit code, tap **Über Bluetooth verbinden**
   and choose the PC. Confirm the operating system's pairing prompt if shown.
   The code expires after 90 seconds and admits one phone.
3. Leave the companion open while you play. When you enter the Bürgeramt,
   tap **Termin scannen** in the companion. It finds the current visit over
   Bluetooth and opens the ticket screen, where you enter your name.
   Tickets, ringing, call controls and playback receipts use that connection.
   The phone plays its cached speech and sound locally.
4. On leaving the office, the phone returns to its scanner. Pairing lasts until
   the game or phone app closes, the connection drops, or you choose
   **Bürgeramt → Bluetooth-Telefon trennen**. If you skipped startup pairing,
   choose **Bürgeramt → Bluetooth-Telefon koppeln** at any point.

Windows 0.2.0 supports Bluetooth pairing started from inside the Bürgeramt.

The PC needs a Bluetooth Low Energy adapter with peripheral support. You can
turn off Wi-Fi and mobile data after the initial app download. Bluetooth stays
enabled on both devices. Chrome for Android is the phone target. Safari and
Chrome for iOS cannot connect through this Web Bluetooth flow.
[Chrome Web Bluetooth documentation](https://developer.chrome.com/docs/capabilities/bluetooth).

### Wi-Fi and play on one PC

1. Join the same private Wi-Fi network on the PC and phone, or connect the PC
   to the phone’s Wi-Fi hotspot. Do this before entering the Bürgeramt so the
   game can select the network address for the QR code.
2. Scan the in-game QR code with the phone camera. Open the local HTTP address
   in the phone browser, enter a name, and keep the ticket page visible with
   the screen awake.
3. For play on one PC, leave full screen if necessary and select **Bürgeramt →
   Telefon an diesem PC öffnen**. Keep the phone window visible while playing.
   Use this option if the network blocks connections between devices.

The game serves the phone page and relays the existing ticket and simulated
call events directly from Windows. The visit QR contains a random invitation
with a lifetime tied to the visit. The phone never needs camera or microphone
permission inside the page. The network listener uses a private IPv4 address
and stops on office exit. On networks that isolate clients or block inbound
traffic, the QR can still appear even though the phone cannot reach it. When
changing networks, leave and re-enter the office for a fresh QR. The local
connection uses plain HTTP/WebSocket. Use a trusted private network and a
fictional player name.

If Windows Firewall blocks the phone on a trusted network, allow
`germany-simulator.exe` for that Private network profile in Windows Security.
[Microsoft’s app exception instructions](https://support.microsoft.com/en-us/windows/security/windows-security/firewall-and-network-protection-in-the-windows-security-app).

## Connection options

- **Wi-Fi without internet** is the first choice. A router with no internet
  uplink can still connect the devices. Android has a
  [local-only hotspot API](https://developer.android.com/develop/connectivity/wifi/localonlyhotspot)
  for native apps. If your phone's built-in hotspot remains available with data
  off, the game can use it provided the phone can reach the PC on that network.
  iPhone Personal Hotspot is a
  [carrier-dependent cellular sharing feature](https://support.apple.com/guide/iphone/iph45447ca6/ios).
  For an iPhone without cellular service, use a shared Wi-Fi network.
- **Bluetooth tethering** can carry the same IP connection on a phone/PC pair
  that supports Bluetooth PAN and permits the phone to reach the PC.
  [Microsoft’s Bluetooth PAN setup](https://support.microsoft.com/en-au/windows/hardware/bluetooth/connect-to-a-bluetooth-network-in-windows).
- **Direct Bluetooth pairing** would need a native companion for broad iPhone
  and Android coverage. Safari's WebKit does not support Web Bluetooth.
  [WebKit’s platform position](https://webkit.org/tracking-prevention/).

## Building

From `desktop`, run `pnpm install --frozen-lockfile` and `pnpm exec tauri build -- --locked`
on Windows with Rust and the Microsoft C++ build tools. The setup executable
is under `desktop/src-tauri/target/release/bundle/nsis/`. Building needs internet
for toolchain dependencies and the
[WebView2 redistributable](https://v2.tauri.app/distribute/windows-installer/#webview2-installation-options).
The resulting installer carries the runtime and game assets for offline use.

The Windows build stages the same game that powers the website. The native
shell serves it on Windows loopback and exposes only the phone page and its
dependencies on the selected local interface during a visit. Hosted play uses
the existing VDO.Ninja path. The bundled font is distributed under the
[SIL Open Font License](../assets/vendor/unifrakturcook/25/OFL.txt).
