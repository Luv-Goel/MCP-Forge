use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

/// Global state: shared counters for active-request tracker.
#[derive(Debug, Default, Clone)]
pub struct Global {
    pub started_services: Arc<AtomicUsize>,
    pub received_request: Arc<AtomicUsize>,
}

impl Global {
    pub const fn new() -> Self {
        Self {
            started_services: Arc::new(AtomicUsize::new(0)),
            received_request: Arc::new(AtomicUsize::new(0)),
        }
    }
}
