use std::time::Duration;

use actix_web::{App, Error, HttpResponse, HttpServer, middleware, route, web};
use actix_web::web::{scope, ServiceConfig};

// Import route modules
use sccafe::routes::{health, metrics, misc};

pub struct ServerConfig {
    pub bind: String,
    pub port: u16,
    pub thread_pool_size: Option<usize>,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            bind: "0.0.0.0".to_string(),
            port: 8080,
            thread_pool_size: None,
        }
    }
}

/// Initialize the Actix HTTP server with all modules
pub fn init(cfg: &mut ServiceConfig) {
    cfg.service(
        scope("/api/v1")
            .configure(health::init)
            .configure(metrics::init)
            .configure(misc::init),
    );
}
