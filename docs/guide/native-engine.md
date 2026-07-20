# Native engine

typeYAML’s public CLI and SDK remain JavaScript-compatible, while the performance-critical compiler core is implemented in Rust. The workspace contains:

- `crates/taml-core` — portable lexer, parser, checker, emitter, diagnostics, and source-map protocol.
- `crates/typeyaml-napi` — Node N-API binding for platform-specific optional packages.
- `crates/typeyaml-wasm` — WebAssembly binding for browsers, editor integrations, and documentation playgrounds.

The `@typeyaml/core` loader selects a package for the current OS and CPU. If no binary exists, applications continue using the TypeScript engine. The Rust core accepts and returns a versioned JSON contract, making parity testing between bindings deterministic.

The SDK’s `compile(source, { engine: "auto" })` mode prefers native execution for the portable core grammar. The native engine supports interfaces, range constraints, enums, defaults, and component inheritance. `engine: "native"` requires a binary and returns an error for source features not yet ported (standard-library imports and `pattern` constraints); `engine: "typescript"` always uses the compatibility engine.

`fixtures/native-parity` holds shared programs and expected output used by both compiler test suites. The native-release workflow builds Windows, Linux, macOS Intel, macOS Apple Silicon, and Wasm artifacts from tagged releases.

## Performance measurement

Build the release binary, then run `npm run native:benchmark`. On the local Windows x64 fixture benchmark (30 fresh process launches), `taml check fixtures/native-parity/basic.taml` measured a 4.064 ms median, 4.473 ms mean, and 4.818 ms p95. Treat these as a local baseline—not a cross-platform guarantee—and rerun the benchmark on each release target.
