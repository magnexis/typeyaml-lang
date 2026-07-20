#![cfg(feature = "wasm")]
use crate::{CompileRequest, OutputFormat, compile};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn compile_taml(source: &str, format: &str) -> Result<String, JsValue> {
    let format = match format {
        "yaml" => OutputFormat::Yaml,
        "json" => OutputFormat::Json,
        _ => return Err(JsValue::from_str("format must be yaml or json")),
    };
    let result = compile(CompileRequest {
        source: source.into(),
        format,
        header: true,
    });
    if !result.valid {
        return Err(JsValue::from_str(
            &result
                .diagnostics
                .iter()
                .map(|item| item.message.as_str())
                .collect::<Vec<_>>()
                .join("\n"),
        ));
    }
    if result.components.len() != 1 {
        return Err(JsValue::from_str(
            "Wasm compile requires exactly one component",
        ));
    }
    Ok(result.components[0].output.clone())
}
