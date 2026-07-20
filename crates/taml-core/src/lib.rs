//! Native, zero-runtime typeYAML compiler. The lexer borrows source text; AST values own only
//! data that must survive parsing, enabling a small and deterministic standalone binary.
pub mod checker;
pub mod emitter;
pub mod lexer;
pub mod parser;
#[cfg(not(target_arch = "wasm32"))]
pub mod registry;
#[cfg(feature = "wasm")]
pub mod wasm;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TamlValue {
    String(String),
    Int(i64),
    Float(f64),
    Boolean(bool),
    Enum(String),
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum OutputFormat {
    #[default]
    Yaml,
    Json,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TamlDiagnostic {
    pub code: String,
    pub message: String,
    pub byte_offset: usize,
    pub line: usize,
    pub column: usize,
}
impl TamlDiagnostic {
    pub fn at(
        code: impl Into<String>,
        message: impl Into<String>,
        byte_offset: usize,
        line: usize,
        column: usize,
    ) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
            byte_offset,
            line,
            column,
        }
    }
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SourceMapEntry {
    pub generated_line: usize,
    pub generated_column: usize,
    pub source_line: usize,
    pub source_column: usize,
    pub key: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileRequest {
    pub source: String,
    #[serde(default)]
    pub format: OutputFormat,
    #[serde(default)]
    pub header: bool,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComponentOutput {
    pub name: String,
    pub output: String,
    pub source_map: Vec<SourceMapEntry>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileResponse {
    pub valid: bool,
    pub diagnostics: Vec<TamlDiagnostic>,
    pub components: Vec<ComponentOutput>,
}
#[derive(Debug, Error)]
pub enum CoreError {
    #[error("invalid request JSON: {0}")]
    Request(#[from] serde_json::Error),
}
pub fn compile(request: CompileRequest) -> CompileResponse {
    match parser::parse(&request.source) {
        Err(error) => CompileResponse {
            valid: false,
            diagnostics: vec![error],
            components: vec![],
        },
        Ok(program) => {
            let (components, diagnostics) = checker::check(&program);
            let output = components
                .into_iter()
                .map(|component| {
                    let (output, source_map) =
                        emitter::emit(&component, request.format.clone(), request.header);
                    ComponentOutput {
                        name: component.name,
                        output,
                        source_map,
                    }
                })
                .collect();
            CompileResponse {
                valid: diagnostics.is_empty(),
                diagnostics,
                components: output,
            }
        }
    }
}
pub fn compile_json(request: &str) -> Result<String, CoreError> {
    let request: CompileRequest = serde_json::from_str(request)?;
    Ok(serde_json::to_string(&compile(request))?)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_and_emits() {
        let result = compile(CompileRequest {
            source: include_str!("../../../fixtures/native-parity/basic.taml").into(),
            format: OutputFormat::Yaml,
            header: false,
        });
        assert!(result.valid, "{:?}", result.diagnostics);
        let expected = include_str!("../../../fixtures/native-parity/basic.yaml")
            .replace("\r\n", "\n");
        assert_eq!(
            result.components[0].output,
            expected
        );
    }
    #[test]
    fn checks_bounds() {
        let result = compile(CompileRequest {
            source: "interface X:\n  port: Int(min: 100)\ncomponent api implements X:\n  port: 1\n"
                .into(),
            format: OutputFormat::Yaml,
            header: false,
        });
        assert!(!result.valid);
        assert_eq!(result.diagnostics[0].code, "MIN_CONSTRAINT");
    }

    #[test]
    fn inherits_parent_values() {
        let result = compile(CompileRequest { source: "interface Service:\n  port: Int\n  replicas: Int\ncomponent base:\n  replicas: 3\ncomponent api extends base implements Service:\n  port: 8080\n".into(), format: OutputFormat::Yaml, header: false });
        assert!(result.valid, "{:?}", result.diagnostics);
        assert!(
            result
                .components
                .iter()
                .find(|component| component.name == "api")
                .is_some_and(|component| component.output.contains("replicas: 3"))
        );
    }
    #[test]
    fn checks_string_patterns() {
        let result = compile(CompileRequest { source: "interface Host:\n  host: String(pattern: \"^[a-z]+$\")\ncomponent api implements Host:\n  host: \"UPPER\"\n".into(), format: OutputFormat::Yaml, header: false });
        assert!(!result.valid);
        assert_eq!(result.diagnostics[0].code, "PATTERN_CONSTRAINT");
    }
}
