#![no_main]
use libfuzzer_sys::fuzz_target;
use taml_core::{compile, CompileRequest, OutputFormat};

fuzz_target!(|input: String| {
    let response = compile(CompileRequest { source: input, format: OutputFormat::Yaml, header: false });
    // The invariant: malformed input always returns a diagnostic or a finite compiler response.
    assert!(response.valid || !response.diagnostics.is_empty());
});
