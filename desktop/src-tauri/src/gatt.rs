use std::time::Duration;
use tokio::sync::mpsc;
use windows::{
    core::{Error, Result, GUID},
    Devices::Bluetooth::{BluetoothAdapter, BluetoothError, GenericAttributeProfile::*},
    Foundation::TypedEventHandler,
    Storage::Streams::{DataReader, DataWriter},
};

const SERVICE: GUID = GUID::from_u128(0x419bb104_0dda_460b_84f2_7a5a68dcdbb0);
const WRITE: GUID = GUID::from_u128(0x419bb105_0dda_460b_84f2_7a5a68dcdbb0);
const INDICATE: GUID = GUID::from_u128(0x419bb106_0dda_460b_84f2_7a5a68dcdbb0);
const CHUNK: usize = 20;

pub struct WriteChunk {
    pub device: String,
    pub bytes: Vec<u8>,
}

pub struct Peripheral {
    provider: GattServiceProvider,
    input: GattLocalCharacteristic,
    output: GattLocalCharacteristic,
    subscription: i64,
}

impl Peripheral {
    pub async fn start(writes: mpsc::Sender<WriteChunk>) -> Result<Self> {
        let adapter = BluetoothAdapter::GetDefaultAsync()?.await?;
        if !adapter.IsPeripheralRoleSupported()? {
            return Err(unavailable(
                "Dieser Bluetooth-Adapter unterstützt den BLE-Peripheriemodus nicht.",
            ));
        }
        let service = GattServiceProvider::CreateAsync(SERVICE)?.await?;
        check(service.Error()?)?;
        let provider = service.ServiceProvider()?;
        let input = characteristic(&provider, WRITE, GattCharacteristicProperties::Write).await?;
        let output =
            characteristic(&provider, INDICATE, GattCharacteristicProperties::Indicate).await?;
        let subscription = input.WriteRequested(&TypedEventHandler::new(
            move |_, event: windows::core::Ref<GattWriteRequestedEventArgs>| {
                let Some(event) = event.cloned() else {
                    return Ok(());
                };
                let deferral = event.GetDeferral()?;
                let writes = writes.clone();
                tauri::async_runtime::spawn(async move {
                    let _ = accept_chunk(event, &writes).await;
                    let _ = deferral.Complete();
                });
                Ok(())
            },
        ))?;
        let peripheral = Self {
            provider,
            input,
            output,
            subscription,
        };
        let parameters = GattServiceProviderAdvertisingParameters::new()?;
        parameters.SetIsConnectable(true)?;
        parameters.SetIsDiscoverable(true)?;
        let (update, mut changes) = tokio::sync::watch::channel(BluetoothError::Success);
        let status_handler =
            peripheral
                .provider
                .AdvertisementStatusChanged(&TypedEventHandler::new(
                    move |_,
                          event: windows::core::Ref<
                        GattServiceProviderAdvertisementStatusChangedEventArgs,
                    >| {
                        if let Some(event) = event.cloned() {
                            update.send_replace(event.Error()?);
                        }
                        Ok(())
                    },
                ))?;
        peripheral
            .provider
            .StartAdvertisingWithParameters(&parameters)?;
        let mut observed = peripheral.provider.AdvertisementStatus()?;
        for _ in 0..25 {
            observed = peripheral.provider.AdvertisementStatus()?;
            match observed {
                GattServiceProviderAdvertisementStatus::Started => {
                    peripheral
                        .provider
                        .RemoveAdvertisementStatusChanged(status_handler)?;
                    return Ok(peripheral);
                }
                _ => tokio::time::sleep(Duration::from_millis(100)).await,
            }
        }
        let _ = tokio::time::timeout(Duration::from_millis(400), changes.changed()).await;
        let error = *changes.borrow();
        peripheral
            .provider
            .RemoveAdvertisementStatusChanged(status_handler)?;
        Err(unavailable(&format!(
            "Der Bluetooth-Dienst konnte nicht sichtbar gemacht werden (Status {}, Fehler {}).",
            observed.0, error.0
        )))
    }

    pub fn client(&self, device: &str) -> Option<GattSubscribedClient> {
        self.output
            .SubscribedClients()
            .ok()?
            .into_iter()
            .find(|client| {
                client.Session().is_ok_and(|session| {
                    session
                        .DeviceId()
                        .and_then(|id| id.Id())
                        .is_ok_and(|id| id == device)
                        && session
                            .SessionStatus()
                            .is_ok_and(|status| status == GattSessionStatus::Active)
                })
            })
    }

    pub async fn indicate(&self, client: &GattSubscribedClient, bytes: &[u8]) -> Result<()> {
        for chunk in bytes.chunks(CHUNK) {
            let writer = DataWriter::new()?;
            writer.WriteBytes(chunk)?;
            let outgoing = self
                .output
                .NotifyValueForSubscribedClientAsync(&writer.DetachBuffer()?, client)?;
            let result = tokio::time::timeout(Duration::from_secs(3), outgoing)
                .await
                .map_err(|_| unavailable("Bluetooth antwortet nicht."))??;
            if result.Status()? != GattCommunicationStatus::Success {
                return Err(unavailable("Die Bluetooth-Verbindung wurde unterbrochen."));
            }
        }
        Ok(())
    }
}

impl Drop for Peripheral {
    fn drop(&mut self) {
        let _ = self.input.RemoveWriteRequested(self.subscription);
        let _ = self.provider.StopAdvertising();
    }
}

async fn characteristic(
    provider: &GattServiceProvider,
    uuid: GUID,
    properties: GattCharacteristicProperties,
) -> Result<GattLocalCharacteristic> {
    let parameters = GattLocalCharacteristicParameters::new()?;
    parameters.SetCharacteristicProperties(properties)?;
    parameters.SetWriteProtectionLevel(GattProtectionLevel::EncryptionRequired)?;
    parameters.SetReadProtectionLevel(GattProtectionLevel::EncryptionRequired)?;
    let result = provider
        .Service()?
        .CreateCharacteristicAsync(uuid, &parameters)?
        .await?;
    check(result.Error()?)?;
    result.Characteristic()
}

async fn accept_chunk(
    event: GattWriteRequestedEventArgs,
    writes: &mpsc::Sender<WriteChunk>,
) -> Result<()> {
    let request = event.GetRequestAsync()?.await?;
    let value = request.Value()?;
    let length = value.Length()? as usize;
    if request.Offset()? != 0 || !(1..=CHUNK).contains(&length) {
        return request.RespondWithProtocolError(0x0d);
    }
    let device = event.Session()?.DeviceId()?.Id()?.to_string();
    let mut bytes = vec![0; length];
    DataReader::FromBuffer(&value)?.ReadBytes(&mut bytes)?;
    if writes.try_send(WriteChunk { device, bytes }).is_err() {
        return request.RespondWithProtocolError(0x0e);
    }
    request.Respond()
}

fn unavailable(message: &str) -> Error {
    Error::new(windows::core::HRESULT(0x80004005u32 as i32), message)
}

fn check(error: BluetoothError) -> Result<()> {
    match error {
        BluetoothError::Success => Ok(()),
        BluetoothError::RadioNotAvailable
        | BluetoothError::DisabledByPolicy
        | BluetoothError::DisabledByUser => Err(unavailable(
            "Bluetooth ist ausgeschaltet oder unter Windows nicht verfügbar.",
        )),
        _ => Err(unavailable(
            "Windows konnte den Bluetooth-Dienst nicht starten.",
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore = "requires a local Windows Bluetooth LE peripheral adapter"]
    fn native_ble_advertises() {
        tauri::async_runtime::block_on(async {
            let (writes, _inbox) = mpsc::channel(1);
            let peripheral = Peripheral::start(writes)
                .await
                .expect("WinRT GATT advertisement");
            assert_eq!(
                peripheral.provider.AdvertisementStatus().unwrap(),
                GattServiceProviderAdvertisementStatus::Started
            );
        });
    }
}
