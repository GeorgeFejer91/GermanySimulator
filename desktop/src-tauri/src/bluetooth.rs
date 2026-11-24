use serde_json::{json, Value};
use std::{
    future::pending,
    sync::{Arc, Mutex},
    time::Duration,
};
use subtle::ConstantTimeEq;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::{DialogExt, MessageDialogBuilder, MessageDialogButtons};
use tokio::{
    sync::{mpsc, watch},
    time::{interval, timeout, Instant},
};
use windows::Devices::Bluetooth::GenericAttributeProfile::GattSubscribedClient;

use crate::{
    gatt::{Peripheral, WriteChunk},
    pairing::Visit,
    server::GameServer,
};

const CODE_LIFETIME: Duration = Duration::from_secs(90);
const FRAME_LIMIT: usize = 1024;

#[derive(Clone, Default)]
pub struct BluetoothPairing {
    active: Arc<Mutex<Option<watch::Sender<bool>>>>,
}

struct PairingLease(BluetoothPairing);

impl Drop for PairingLease {
    fn drop(&mut self) {
        self.0.active.lock().unwrap().take();
    }
}

pub fn prompt(app: AppHandle) {
    message(
        &app,
        "Möchten Sie Ihr Bürgeramt-Telefon jetzt per Bluetooth verbinden?",
    )
    .buttons(MessageDialogButtons::OkCancelCustom(
        "Jetzt koppeln".into(),
        "Später".into(),
    ))
    .show(move |accepted| {
        if accepted {
            pair(app);
        }
    });
}

pub fn disconnect(app: &AppHandle) {
    if let Some(cancel) = app
        .state::<BluetoothPairing>()
        .active
        .lock()
        .unwrap()
        .as_ref()
    {
        cancel.send_replace(true);
    }
}

pub fn pair(app: AppHandle) {
    let pairing = app.state::<BluetoothPairing>().inner().clone();
    let (stop, mut cancel) = watch::channel(false);
    {
        let mut active = pairing.active.lock().unwrap();
        if active.is_some() {
            show(&app, "Bluetooth ist bereits aktiv. Zum Neuverbinden wählen Sie zuerst „Bluetooth-Telefon trennen“.");
            return;
        }
        *active = Some(stop);
    }
    let lease = PairingLease(pairing);
    let server = app.state::<GameServer>().inner().clone();
    tauri::async_runtime::spawn(async move {
        let _lease = lease;
        let mut random = [0; 4];
        if getrandom::fill(&mut random).is_err() {
            show(&app, "Der Kopplungscode konnte nicht erstellt werden.");
            return;
        }
        let code = format!("{:08}", u32::from_le_bytes(random) % 100_000_000);
        let (writes, mut inbox) = mpsc::channel(32);
        let radio = tokio::select! {
            _ = cancel.changed() => return,
            result = timeout(Duration::from_secs(10), Peripheral::start(writes)) => match result {
                Ok(Ok(radio)) => radio,
                Ok(Err(error)) => { show(&app, error.message()); return }
                Err(_) => { show(&app, "Der Bluetooth-Adapter antwortet nicht."); return }
            }
        };
        message(&app, format!("Kopplungscode: {code}\n\nÖffnen Sie germanysimulator.de/phone/ in Android Chrome. Geben Sie den Code ein und wählen Sie diesen PC. Der Code gilt 90 Sekunden.\n\nSobald das Telefon verbunden ist, können Sie weiterspielen."))
            .buttons(MessageDialogButtons::OkCustom("Zum Spiel".into()))
            .show(|_| {});
        serve(&radio, &server, &code, &mut inbox, &mut cancel).await;
    });
}

fn message(app: &AppHandle, text: impl Into<String>) -> MessageDialogBuilder<tauri::Wry> {
    let dialog = app.dialog().message(text).title("Bürgeramt · Bluetooth");
    match app.get_webview_window("game") {
        Some(window) => dialog.parent(&window),
        None => dialog,
    }
}

fn show(app: &AppHandle, text: impl Into<String>) {
    message(app, text).show(|_| {});
}

#[derive(Default)]
struct Frame {
    device: String,
    bytes: Vec<u8>,
}

impl Frame {
    fn read(&mut self, chunk: WriteChunk) -> Option<Value> {
        if self.device != chunk.device {
            self.device = chunk.device;
            self.bytes.clear();
        }
        self.bytes.extend(chunk.bytes);
        if self.bytes.len() > FRAME_LIMIT + 1 {
            self.bytes.clear();
            return None;
        }
        if self.bytes.last() != Some(&b'\n') {
            return None;
        }
        serde_json::from_slice(&std::mem::take(&mut self.bytes)).ok()
    }
}

struct BluetoothVisit {
    visit: Arc<Visit>,
    phone: Option<(u32, mpsc::Receiver<Value>)>,
}

impl BluetoothVisit {
    fn leave(&mut self) {
        if let Some((peer, _)) = self.phone.take() {
            self.visit.leave_phone(peer);
        }
    }

    fn receive(&mut self, packet: Value) -> bool {
        if packet.get("event").and_then(Value::as_str) == Some("leave-visit")
            && packet.get("stream").and_then(Value::as_str) == Some(self.visit.stream())
        {
            self.leave();
        }
        if !self.visit.accepts(&packet) {
            return true;
        }
        // A scan comes from the loaded phone page. Joining here avoids sending
        // timing and tempo messages while the handset is still opening it.
        if self.phone.is_none() && packet.get("type").and_then(Value::as_str) == Some("scan") {
            self.phone = self.visit.join_phone();
        }
        self.phone
            .as_ref()
            .is_none_or(|(peer, _)| self.visit.forward_phone(*peer, packet))
    }
}

impl Drop for BluetoothVisit {
    fn drop(&mut self) {
        self.leave();
    }
}

async fn outgoing(active: &mut Option<BluetoothVisit>) -> Option<Value> {
    match active.as_mut().and_then(|visit| visit.phone.as_mut()) {
        Some((_, packets)) => packets.recv().await,
        None => pending().await,
    }
}

async fn serve(
    radio: &Peripheral,
    server: &GameServer,
    code: &str,
    inbox: &mut mpsc::Receiver<WriteChunk>,
    cancel: &mut watch::Receiver<bool>,
) {
    let deadline = Instant::now() + CODE_LIFETIME;
    let mut frame = Frame::default();
    let mut tries = 0;
    let (device, client, persistent) = loop {
        let chunk = tokio::select! {
            _ = cancel.changed() => return,
            _ = tokio::time::sleep_until(deadline) => return,
            chunk = inbox.recv() => match chunk { Some(chunk) => chunk, None => return },
        };
        let Some(auth) = frame.read(chunk) else {
            continue;
        };
        let Some(client) = radio.client(&frame.device) else {
            continue;
        };
        if auth
            .get("code")
            .and_then(Value::as_str)
            .is_some_and(|attempt| bool::from(attempt.as_bytes().ct_eq(code.as_bytes())))
        {
            let persistent = auth.get("standby").and_then(Value::as_bool) == Some(true);
            break (frame.device.clone(), client, persistent);
        }
        tries += 1;
        let _ = send(radio, &client, &json!({"event": "wrong-code"})).await;
        if tries >= 5 {
            return;
        }
    };

    if persistent && !send(radio, &client, &json!({"event": "paired"})).await {
        return;
    }
    let mut visits = server.visit.subscribe();
    visits.mark_changed();
    let mut active: Option<BluetoothVisit> = None;
    let mut heartbeat = interval(Duration::from_secs(2));
    loop {
        tokio::select! {
            biased;
            _ = cancel.changed() => break,
            _ = visits.changed() => {
                let current = visits.borrow_and_update().clone();
                if active.as_ref().is_some_and(|attached| {
                    current.as_ref().is_none_or(|visit| !Arc::ptr_eq(visit, &attached.visit))
                }) {
                    active = None;
                    if !persistent || !send(radio, &client, &json!({"event":"visit-ended"})).await {
                        break;
                    }
                }
                if !persistent && active.is_none() {
                    let Some(visit) = current else { break };
                    if !send(radio, &client, &visit_notice(&visit)).await { break }
                    active = Some(BluetoothVisit { visit, phone: None });
                }
            }
            _ = heartbeat.tick() => {
                if radio.client(&device).is_none() { break }
            }
            packet = outgoing(&mut active) => {
                let Some(packet) = packet else { break };
                if !send(radio, &client, &packet).await { break }
            }
            chunk = inbox.recv() => {
                let Some(chunk) = chunk else { break };
                if chunk.device != device { continue }
                let Some(packet) = frame.read(chunk) else { continue };
                match packet.get("event").and_then(Value::as_str) {
                    Some("close") => break,
                    Some("find-visit") if persistent => {
                        let current = visits.borrow().clone();
                        if let Some(visit) = current {
                            if !send(radio, &client, &visit_notice(&visit)).await { break }
                            if active.as_ref().is_none_or(|attached| !Arc::ptr_eq(&visit, &attached.visit)) {
                                active = Some(BluetoothVisit { visit, phone: None });
                            }
                        } else if !send(radio, &client, &json!({"event":"no-visit"})).await {
                            break;
                        }
                    }
                    _ => {
                        if active.as_mut().is_some_and(|visit| !visit.receive(packet)) { break }
                    }
                }
            }
        }
    }
    drop(active);
    let _ = send(radio, &client, &json!({"event":"closed"})).await;
}

fn visit_notice(visit: &Visit) -> Value {
    let mut notice = json!({"event":"ready","stream":visit.stream()});
    if visit.english_phone() {
        notice["captions"] = json!("en");
    }
    notice
}

async fn send(radio: &Peripheral, client: &GattSubscribedClient, message: &Value) -> bool {
    let Ok(mut bytes) = serde_json::to_vec(message) else {
        return false;
    };
    bytes.push(b'\n');
    matches!(
        timeout(Duration::from_secs(5), radio.indicate(client, &bytes)).await,
        Ok(Ok(()))
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn each_visit_requires_a_current_scan_and_releases_its_peer() {
        use crate::pairing::{test_visit, HostEvent};
        let (first, mut old_host) = test_visit("amt-ticket-q5l09xzv07ra02ej");
        let (second, mut new_host) = test_visit("amt-ticket-v5l09xzv07ra02ej");
        let scan = |visit: &Visit| json!({"v":3, "session":visit.stream(), "type":"scan"});
        let mut link = BluetoothVisit {
            visit: first.clone(),
            phone: None,
        };
        assert!(link.receive(json!({"v":3, "session":first.stream(), "type":"answer"})));
        assert!(old_host.try_recv().is_err());
        assert!(link.receive(scan(&first)));
        let HostEvent::Joined { peer } = old_host.try_recv().unwrap() else {
            panic!("scan did not join the visit")
        };
        assert!(matches!(
            old_host.try_recv().unwrap(),
            HostEvent::Packet { .. }
        ));
        assert!(link.receive(json!({"event":"leave-visit","stream":second.stream()})));
        assert!(old_host.try_recv().is_err());
        drop(link);
        assert!(
            matches!(old_host.try_recv().unwrap(), HostEvent::Left { peer: left } if left == peer)
        );

        let mut link = BluetoothVisit {
            visit: second.clone(),
            phone: None,
        };
        assert!(link.receive(scan(&first)));
        assert!(new_host.try_recv().is_err());
        assert!(link.receive(scan(&second)));
        let HostEvent::Joined { peer } = new_host.try_recv().unwrap() else {
            panic!("scan did not join the new visit")
        };
        assert!(matches!(
            new_host.try_recv().unwrap(),
            HostEvent::Packet { .. }
        ));
        assert!(link.receive(json!({"event":"leave-visit","stream":second.stream()})));
        assert!(
            matches!(new_host.try_recv().unwrap(), HostEvent::Left { peer: left } if left == peer)
        );
        assert!(link.receive(scan(&second)));
        assert!(
            matches!(new_host.try_recv().unwrap(), HostEvent::Joined { peer: next } if next != peer)
        );
    }

    #[test]
    fn frames_preserve_utf8_and_separate_devices() {
        let mut frame = Frame::default();
        let chunk = |device: &str, bytes: &[u8]| WriteChunk {
            device: device.into(),
            bytes: bytes.into(),
        };
        assert!(frame
            .read(chunk("different-phone", b"{\"code\":"))
            .is_none());
        assert!(frame.read(chunk("phone", b"1234}\n")).is_none());
        let bytes = "{\"name\":\"Prüfmann\"}\n".as_bytes();
        let split = bytes.iter().position(|byte| *byte == 0xc3).unwrap() + 1;
        assert!(frame.read(chunk("phone", &bytes[..split])).is_none());
        assert_eq!(
            frame.read(chunk("phone", &bytes[split..])),
            Some(json!({"name":"Prüfmann"}))
        );
        assert!(frame
            .read(chunk("phone", &vec![b'x'; FRAME_LIMIT + 2]))
            .is_none());
        assert_eq!(frame.read(chunk("phone", b"{}\n")), Some(json!({})));
    }
}
