use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::Duration,
};
use subtle::ConstantTimeEq;
use tokio::sync::{mpsc, watch, Semaphore};

use crate::server::GameServer;

const AUTH_TIMEOUT: Duration = Duration::from_secs(5);
const FRAME_LIMIT: usize = 2048;
const QUEUE_DEPTH: usize = 32;
const PHONE_LIMIT: usize = 8;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Invitation {
    room: String,
    stream: String,
    secret: String,
    #[serde(default)]
    english_phone: bool,
}

impl Invitation {
    fn valid(&self) -> bool {
        fn token(value: &str, prefix: &str, size: usize) -> bool {
            value.strip_prefix(prefix).is_some_and(|id| {
                id.len() == size
                    && id
                        .bytes()
                        .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit())
            })
        }
        token(&self.room, "amt-", 16)
            && token(&self.stream, "amt-ticket-", 16)
            && token(&self.secret, "", 32)
    }

    fn matches(&self, request: &Self) -> bool {
        self.room == request.room
            && self.stream == request.stream
            && bool::from(self.secret.as_bytes().ct_eq(request.secret.as_bytes()))
    }
}

pub struct Visit {
    invitation: Invitation,
    host: mpsc::Sender<HostEvent>,
    phones: Mutex<HashMap<u32, mpsc::Sender<Value>>>,
    next_phone: std::sync::atomic::AtomicU32,
    stop: watch::Sender<bool>,
    slots: Semaphore,
}

impl Visit {
    fn new(invitation: Invitation) -> (Arc<Self>, mpsc::Receiver<HostEvent>) {
        let (host, inbox) = mpsc::channel(QUEUE_DEPTH);
        let visit = Arc::new(Self {
            invitation,
            host,
            phones: Mutex::default(),
            next_phone: 1.into(),
            stop: watch::channel(false).0,
            slots: Semaphore::new(PHONE_LIMIT),
        });
        (visit, inbox)
    }

    pub fn stream(&self) -> &str {
        &self.invitation.stream
    }

    pub fn english_phone(&self) -> bool {
        self.invitation.english_phone
    }

    pub fn accepts(&self, packet: &Value) -> bool {
        packet.get("v").and_then(Value::as_u64) == Some(3)
            && packet.get("session").and_then(Value::as_str) == Some(self.stream())
            && serde_json::to_vec(packet).is_ok_and(|bytes| bytes.len() <= 1024)
    }

    pub fn join_phone(&self) -> Option<(u32, mpsc::Receiver<Value>)> {
        let peer = self
            .next_phone
            .fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let (sender, inbox) = mpsc::channel(QUEUE_DEPTH);
        self.phones.lock().unwrap().insert(peer, sender);
        if self.host.try_send(HostEvent::Joined { peer }).is_err() {
            self.phones.lock().unwrap().remove(&peer);
            return None;
        }
        Some((peer, inbox))
    }

    pub fn forward_phone(&self, peer: u32, packet: Value) -> bool {
        !self.accepts(&packet)
            || self
                .host
                .try_send(HostEvent::Packet { peer, packet })
                .is_ok()
    }

    pub fn leave_phone(&self, peer: u32) {
        self.phones.lock().unwrap().remove(&peer);
        let _ = self.host.try_send(HostEvent::Left { peer });
    }

    pub fn phone_link(&self, origin: &str) -> String {
        let Invitation {
            room,
            stream,
            secret,
            english_phone,
        } = &self.invitation;
        let captions = if *english_phone { "&captions=en" } else { "" };
        format!(
            "{origin}/buergeramt-phone.html#room={room}&stream={stream}&secret={secret}{captions}"
        )
    }
}

#[derive(Serialize)]
#[serde(tag = "event", rename_all = "kebab-case")]
pub(super) enum HostEvent {
    Listening { phone_origin: Option<String> },
    Joined { peer: u32 },
    Left { peer: u32 },
    Packet { peer: u32, packet: Value },
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct HostPacket {
    peer: u32,
    packet: Value,
}

pub async fn host_socket(State(server): State<GameServer>, upgrade: WebSocketUpgrade) -> Response {
    bounded(upgrade).on_upgrade(move |socket| serve_host(server, socket))
}

pub async fn phone_socket(State(server): State<GameServer>, upgrade: WebSocketUpgrade) -> Response {
    bounded(upgrade).on_upgrade(move |socket| serve_phone(server, socket))
}

fn bounded(upgrade: WebSocketUpgrade) -> WebSocketUpgrade {
    upgrade
        .read_buffer_size(4096)
        .write_buffer_size(0)
        .max_write_buffer_size(8192)
        .max_frame_size(FRAME_LIMIT)
        .max_message_size(FRAME_LIMIT)
}

async fn authenticate(socket: &mut WebSocket) -> Option<Invitation> {
    let frame = tokio::time::timeout(AUTH_TIMEOUT, socket.recv())
        .await
        .ok()??
        .ok()?;
    let Message::Text(text) = frame else {
        return None;
    };
    let invitation: Invitation = serde_json::from_str(text.as_str()).ok()?;
    invitation.valid().then_some(invitation)
}

async fn send_json(socket: &mut WebSocket, event: &impl Serialize) -> bool {
    let Ok(text) = serde_json::to_string(event) else {
        return false;
    };
    matches!(
        tokio::time::timeout(AUTH_TIMEOUT, socket.send(Message::Text(text.into()))).await,
        Ok(Ok(()))
    )
}

async fn serve_host(server: GameServer, mut socket: WebSocket) {
    let Some(invitation) = authenticate(&mut socket).await else {
        return;
    };
    let (visit, mut inbox) = Visit::new(invitation);
    if !server.visit.send_if_modified(|active| {
        if active.is_some() {
            return false;
        }
        *active = Some(visit.clone());
        true
    }) {
        return;
    }
    let lan = server.start_lan().await;
    let phone_origin = lan.as_ref().map(|(address, _)| format!("http://{address}"));
    if send_json(&mut socket, &HostEvent::Listening { phone_origin }).await {
        relay_host(&visit, &mut socket, &mut inbox).await;
    }
    visit.stop.send_replace(true);
    if let Some((_, task)) = lan {
        task.abort();
    }
    server.visit.send_replace(None);
}

async fn relay_host(visit: &Visit, socket: &mut WebSocket, inbox: &mut mpsc::Receiver<HostEvent>) {
    loop {
        tokio::select! {
            Some(event) = inbox.recv() => if !send_json(socket, &event).await { break },
            message = socket.recv() => match message {
                Some(Ok(Message::Text(text))) => {
                    let Ok(HostPacket { peer, packet }) = serde_json::from_str(text.as_str()) else { continue };
                    if !visit.accepts(&packet) { continue }
                    let mut phones = visit.phones.lock().unwrap();
                    if phones.get(&peer).is_some_and(|inbox| inbox.try_send(packet).is_err()) {
                        phones.remove(&peer);
                    }
                }
                Some(Ok(Message::Pong(_) | Message::Ping(_))) => {}
                _ => break,
            }
        }
    }
}

async fn serve_phone(server: GameServer, mut socket: WebSocket) {
    let Some(visit) = server.visit.borrow().clone() else {
        return;
    };
    let mut stop = visit.stop.subscribe();
    if *stop.borrow() {
        return;
    }
    let Ok(_slot) = visit.slots.try_acquire() else {
        return;
    };
    let request = tokio::select! {
        request = authenticate(&mut socket) => request,
        _ = stop.changed() => return,
    };
    if !request.is_some_and(|request| visit.invitation.matches(&request)) {
        return;
    }
    let Some((peer, mut inbox)) = visit.join_phone() else {
        return;
    };
    if send_json(&mut socket, &serde_json::json!({"event": "ready"})).await {
        relay_phone(&visit, peer, &mut socket, &mut inbox, &mut stop).await;
    }
    visit.leave_phone(peer);
}

async fn relay_phone(
    visit: &Visit,
    peer: u32,
    socket: &mut WebSocket,
    inbox: &mut mpsc::Receiver<Value>,
    stop: &mut watch::Receiver<bool>,
) {
    loop {
        tokio::select! {
            _ = stop.changed() => break,
            packet = inbox.recv() => {
                let Some(packet) = packet else { break };
                if !send_json(socket, &packet).await { break }
            }
            message = socket.recv() => match message {
                Some(Ok(Message::Text(text))) => {
                    let Ok(packet) = serde_json::from_str(text.as_str()) else { continue };
                    if !visit.forward_phone(peer, packet) { break }
                }
                Some(Ok(Message::Pong(_) | Message::Ping(_))) => {}
                _ => break,
            }
        }
    }
}

#[cfg(test)]
pub(super) fn test_visit(stream: &str) -> (Arc<Visit>, mpsc::Receiver<HostEvent>) {
    Visit::new(Invitation {
        room: "amt-q5l09xzv07ra02ej".into(),
        secret: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".into(),
        stream: stream.into(),
        english_phone: false,
    })
}
