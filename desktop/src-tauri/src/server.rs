use axum::{
    extract::{ConnectInfo, Request, State},
    http::{header, HeaderValue, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
use if_addrs::{get_if_addrs, IfAddr, Ifv4Addr};
use std::{
    future::IntoFuture,
    net::{Ipv4Addr, SocketAddr, UdpSocket},
    path::PathBuf,
    sync::Arc,
};
use tokio::{net::TcpListener, sync::watch};
use tower_http::services::ServeDir;

use crate::pairing::{host_socket, phone_socket, Visit};

pub const PORT: u16 = 37582;

#[derive(Clone)]
pub struct GameServer {
    pub assets: PathBuf,
    pub visit: watch::Sender<Option<Arc<Visit>>>,
}

#[derive(Clone)]
struct WebAccess {
    address: SocketAddr,
    subnet: Option<Ifv4Addr>,
}

impl GameServer {
    pub fn new(assets: PathBuf) -> Self {
        Self {
            assets,
            visit: watch::channel(None).0,
        }
    }

    pub async fn listen(self) -> std::io::Result<()> {
        let address = SocketAddr::from((Ipv4Addr::LOCALHOST, PORT));
        let listener = TcpListener::bind(address).await?;
        let routes = self.routes(WebAccess {
            address,
            subnet: None,
        });
        tauri::async_runtime::spawn(
            axum::serve(
                listener,
                routes.into_make_service_with_connect_info::<SocketAddr>(),
            )
            .into_future(),
        );
        Ok(())
    }

    pub async fn start_lan(&self) -> Option<(SocketAddr, tokio::task::JoinHandle<()>)> {
        let subnet = local_network()?;
        let address = SocketAddr::from((subnet.ip, PORT));
        let listener = TcpListener::bind(address).await.ok()?;
        let routes = self.routes(WebAccess {
            address,
            subnet: Some(subnet),
        });
        let task = tokio::spawn(async move {
            let _ = axum::serve(
                listener,
                routes.into_make_service_with_connect_info::<SocketAddr>(),
            )
            .await;
        });
        Some((address, task))
    }

    fn routes(&self, access: WebAccess) -> Router {
        let mut router = Router::new().route("/__amt/phone", get(phone_socket));
        if access.subnet.is_none() {
            router = router.route("/__amt/host", get(host_socket));
        }
        router
            .fallback_service(ServeDir::new(&self.assets))
            .with_state(self.clone())
            .layer(middleware::from_fn_with_state(access, limit_access))
    }
}

async fn limit_access(
    State(access): State<WebAccess>,
    ConnectInfo(peer): ConnectInfo<SocketAddr>,
    request: Request,
    next: Next,
) -> Response {
    let authority = access.address.to_string();
    let headers = request.headers();
    if headers
        .get(header::HOST)
        .and_then(|value| value.to_str().ok())
        != Some(&authority)
    {
        return StatusCode::MISDIRECTED_REQUEST.into_response();
    }
    if request.uri().path().starts_with("/__amt/")
        && headers
            .get(header::ORIGIN)
            .and_then(|value| value.to_str().ok())
            != Some(&format!("http://{authority}"))
    {
        return StatusCode::FORBIDDEN.into_response();
    }
    if let Some(subnet) = access.subnet {
        let mask = u32::from(subnet.netmask);
        let same_subnet = match peer.ip() {
            std::net::IpAddr::V4(ip) => u32::from(ip) & mask == u32::from(subnet.ip) & mask,
            _ => false,
        };
        let path = request.uri().path();
        let phone_asset = matches!(
            path,
            "/buergeramt-phone.html"
                | "/buergeramt-phone.js"
                | "/buergeramt-local-link.js"
                | "/buergeramt-link.js"
                | "/buergeramt-time.js"
                | "/buergeramt.css"
                | "/buergeramt-fit.js"
                | "/fullscreen.js"
                | "/knick-speech.js"
                | "/knick-speech-worker.js"
                | "/For-AI/AUDIO-TEXT-LIBRARY.js"
                | "/__amt/phone"
        ) || [
            "/assets/vendor/",
            "/assets/voices/",
            "/assets/audio/",
            "/assets/buergeramt/",
        ]
        .iter()
        .any(|prefix| path.starts_with(prefix));
        if !same_subnet || !phone_asset {
            return StatusCode::NOT_FOUND.into_response();
        }
    }
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    let policy = format!("default-src 'self'; connect-src 'self' ws://{authority}; \
        script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; \
        img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self'; worker-src 'self' blob:; \
        frame-src 'none'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; base-uri 'self'");
    headers.insert(
        header::CONTENT_SECURITY_POLICY,
        HeaderValue::from_str(&policy).unwrap(),
    );
    headers.insert(
        header::REFERRER_POLICY,
        HeaderValue::from_static("no-referrer"),
    );
    headers.insert(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    );
    response
}

fn local_network() -> Option<Ifv4Addr> {
    let routed = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0))
        .ok()
        .and_then(|socket| {
            socket.connect((Ipv4Addr::new(192, 0, 2, 1), 9)).ok()?;
            socket.local_addr().ok()
        });
    get_if_addrs()
        .ok()?
        .into_iter()
        .filter(|interface| interface.is_oper_up())
        .filter_map(|interface| match interface.addr {
            IfAddr::V4(address) if address.ip.is_private() || address.ip.is_link_local() => {
                Some(address)
            }
            _ => None,
        })
        .min_by_key(|address| {
            (
                routed.is_none_or(|route| route.ip() != address.ip),
                address.ip.is_link_local(),
            )
        })
}
