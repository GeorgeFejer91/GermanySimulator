#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod bluetooth;
mod gatt;
mod pairing;
mod server;

use server::{GameServer, PORT};
use std::net::Ipv4Addr;
use tauri::{
    menu::{MenuBuilder, SubmenuBuilder},
    path::BaseDirectory,
    webview::NewWindowResponse,
    AppHandle, Manager, WebviewUrl, WebviewWindowBuilder,
};

fn origin() -> String {
    format!("http://{}:{PORT}", Ipv4Addr::LOCALHOST)
}

fn game_window<'a>(
    app: &'a AppHandle,
    label: &str,
    url: &str,
) -> WebviewWindowBuilder<'a, tauri::Wry, AppHandle> {
    let permitted = origin();
    let smoke_test = std::env::var_os("GERMANY_SIMULATOR_SMOKE").is_some();
    WebviewWindowBuilder::new(app, label, WebviewUrl::External(url.parse().unwrap()))
        .visible(!smoke_test)
        .focused(!smoke_test)
        .on_navigation(move |url| url.origin().ascii_serialization() == permitted)
        .on_new_window(|_, _| NewWindowResponse::Deny)
}

fn open_local_phone(app: &AppHandle) -> tauri::Result<()> {
    let server = app.state::<GameServer>();
    let url = server
        .visit
        .borrow()
        .as_ref()
        .map(|visit| visit.phone_link(&origin()))
        .unwrap_or_else(|| format!("{}/buergeramt-phone.html", origin()));
    if let Some(phone) = app.get_webview_window("phone") {
        let url: tauri::Url = url.parse().unwrap();
        if phone.url()?.fragment() != url.fragment() {
            phone.navigate(url)?;
        }
        return phone.set_focus();
    }
    game_window(app, "phone", &url)
        .title("Bürgeramt · Telefon")
        .inner_size(410.0, 740.0)
        .min_inner_size(320.0, 420.0)
        .build()?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(bluetooth::BluetoothPairing::default())
        .setup(|app| {
            let assets = app.path().resolve("game", BaseDirectory::Resource)?;
            let server = GameServer::new(assets);
            tauri::async_runtime::block_on(server.clone().listen())?;
            app.manage(server);
            let phone = SubmenuBuilder::new(app, "Bürgeramt")
                .text("phone", "Telefon an diesem PC öffnen")
                .text("bluetooth", "Bluetooth-Telefon koppeln")
                .text("bluetooth-stop", "Bluetooth-Telefon trennen")
                .build()?;
            let menu = MenuBuilder::new(app).item(&phone).build()?;
            game_window(app.handle(), "game", &format!("{}/", origin()))
                .title("Germany Simulator · Grand Theft Amt")
                .inner_size(1280.0, 800.0)
                .min_inner_size(640.0, 480.0)
                .menu(menu)
                .on_menu_event(|window, event| {
                    if event.id() == "bluetooth" {
                        bluetooth::pair(window.app_handle().clone());
                    }
                    if event.id() == "bluetooth-stop" {
                        bluetooth::disconnect(window.app_handle());
                    }
                    if event.id() == "phone" {
                        if let Err(error) = open_local_phone(window.app_handle()) {
                            eprintln!("Could not open the Bürgeramt phone window: {error}");
                        }
                    }
                })
                .build()?
                .on_window_event({
                    let handle = app.handle().clone();
                    move |event| {
                        if matches!(event, tauri::WindowEvent::Destroyed) {
                            handle.exit(0);
                        }
                    }
                });
            if std::env::var_os("GERMANY_SIMULATOR_SMOKE").is_none() {
                bluetooth::prompt(app.handle().clone());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Germany Simulator could not start");
}
