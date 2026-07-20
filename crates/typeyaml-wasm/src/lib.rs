use wasm_bindgen::prelude::*;

/// Browser/editor bridge; callers pass the same JSON request used by N-API.
#[wasm_bindgen]
pub fn compile_json(request: &str) -> Result<String, JsValue> {
    taml_core::compile_json(request).map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen]
pub fn engine_version() -> String {
    env!("CARGO_PKG_VERSION").to_owned()
}
