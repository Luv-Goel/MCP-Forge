use tokio::signal;

/// Signal handler: graceful shutdown with drain timeout.
pub async fn run_signal_handler(drain: Duration) -> bool {
    use signal::unix::{signal, SignalKind};
    let mut stream = match signal(SignalKind::terminate()) {
        Ok(s) => s,
        Err(_) => return false,
    };
    let _ = tokio::time::timeout(drain, stream.recv()).await;
    true
}
