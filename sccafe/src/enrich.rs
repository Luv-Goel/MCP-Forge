//! Enrichment module

pub fn enrich_context(ctx: &mut crate::context::RequestContext) {
    // Attach geo/device hints derived from headers
    let _ = ctx; // stub
}
