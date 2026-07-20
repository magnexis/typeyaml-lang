use napi_derive::napi;

/// Stable N-API bridge. Both parameters and result use the shared JSON protocol.
#[napi]
pub fn compile_json(request: String) -> napi::Result<String> {
    taml_core::compile_json(&request).map_err(|error| napi::Error::from_reason(error.to_string()))
}

/// File-aware bridge used by Node integrations that need Rust registry resolution.
#[napi]
pub fn compile_file_json(
    request: String,
    project_dir: String,
    offline: Option<bool>,
) -> napi::Result<String> {
    let mut request: taml_core::CompileRequest = serde_json::from_str(&request)
        .map_err(|error| napi::Error::from_reason(error.to_string()))?;
    request.source = taml_core::registry::resolve_imports(
        &request.source,
        std::path::Path::new(&project_dir),
        offline.unwrap_or(false),
    )
    .map_err(napi::Error::from_reason)?;
    serde_json::to_string(&taml_core::compile(request))
        .map_err(|error| napi::Error::from_reason(error.to_string()))
}

#[napi]
pub fn engine_version() -> String {
    env!("CARGO_PKG_VERSION").to_owned()
}
