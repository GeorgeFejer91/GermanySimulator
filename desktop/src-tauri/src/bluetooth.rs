use serde_json::{json, Value};
use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::Duration,
};
use subtle::ConstantTimeEq;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;
use tokio::{
    sync::mpsc,
    time::{interval, timeout, Instant},
};

use crate::{
    gatt::{Peripheral, WriteChunk},
    pairing::Visit,
    server::GameServer,
};

const CODE_LIFETIME: Duration = Duration::from_secs(90);
const FRAME_LIMIT: usize = 1024;

#[derive(Default)]
pub struct BluetoothPairing(Arc<AtomicBool>);

struct PairingLease(Arc<AtomicBool>);

impl Drop for PairingLease {
    fn drop(&mut self) {
        self.0.store(false, Ordering::Release);
    }
}

pub fn pair(app: AppHandle) {
    let visit = app.state::<GameServer>().visit.lock().unwrap().clone();
    let Some(visit) = visit else {
        show(&app, "Betreten Sie zuerst das Bürgeramt.");
        return;
    };
    let busy = app.state::<BluetoothPairing>().0.clone();
    if busy.swap(true, Ordering::AcqRel) {
        show(&app, "Bluetooth ist für diesen Besuch bereits aktiv.");
        return;
    }
    let lease = PairingLease(busy);
    tauri::async_runtime::spawn(async move {
        let _lease = lease;
        let mut random = [0; 4];
        if getrandom::fill(&mut random).is_err() {
            show(&app, "Der Kopplungscode konnte nicht erstellt werden.");
            return;
        }
        let code = format!("{:08}", u32::from_le_bytes(random) % 100_000_000);
        let (writes, mut inbox) = mpsc::channel(32);
        let radio = match timeout(Duration::from_secs(10), Peripheral::start(writes)).await {
            Ok(Ok(radio)) => radio,
            Ok(Err(error)) => {
                show(&app, error.message());
                return;
            }
            Err(_) => {
                show(&app, "Der Bluetooth-Adapter antwortet nicht.");
                return;
            }
        };
        if *visit.stop_signal().borrow() {
            return;
        }
        show(&app, format!("Kopplungscode: {code}\n\nGeben Sie den Code in der Bürgeramt-App ein. Er gilt 90 Sekunden und für ein Telefon.\n\ngermanysimulator.de/phone/"));
        serve(&radio, &visit, &code, &mut inbox).await;
    });
}

fn show(app: &AppHandle, text: impl Into<String>) {
    app.dialog()
        .message(text)
        .title("Bürgeramt · Bluetooth")
        .show(|_| {});
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

async fn serve(
    radio: &Peripheral,
    visit: &Visit,
    code: &str,
    inbox: &mut mpsc::Receiver<WriteChunk>,
) {
    let mut stop = visit.stop_signal();
    if *stop.borrow() {
        return;
    }
    let deadline = Instant::now() + CODE_LIFETIME;
    let mut frame = Frame::default();
    let mut tries = 0;
    let (device, client) = loop {
        let chunk = tokio::select! {
            _ = stop.changed() => return,
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
            break (frame.device.clone(), client);
        }
        tries += 1;
        let _ = send(radio, &client, &json!({"event": "wrong-code"})).await;
        if tries >= 5 {
            return;
        }
    };
    let Some((peer, mut outgoing)) = visit.join_phone() else {
        return;
    };
    if send(
        radio,
        &client,
        &json!({"event":"ready", "stream":visit.stream()}),
    )
    .await
    {
        let mut heartbeat = interval(Duration::from_secs(2));
        loop {
            tokio::select! {
                _ = stop.changed() => break,
                _ = heartbeat.tick() => {
                    if radio.client(&device).is_none() { break }
                },
                packet = outgoing.recv() => {
                    let Some(packet) = packet else { break };
                    if !send(radio, &client, &packet).await { break }
                },
                chunk = inbox.recv() => {
                    let Some(chunk) = chunk else { break };
                    if chunk.device != device { continue }
                    if let Some(packet) = frame.read(chunk) {
                        if packet.get("event").and_then(Value::as_str) == Some("close")
                            || !visit.forward_phone(peer, packet) { break }
                    }
                },
            }
        }
    }
    visit.leave_phone(peer);
    let _ = send(radio, &client, &json!({"event":"closed"})).await;
}

async fn send(
    radio: &Peripheral,
    client: &windows::Devices::Bluetooth::GenericAttributeProfile::GattSubscribedClient,
    message: &Value,
) -> bool {
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
