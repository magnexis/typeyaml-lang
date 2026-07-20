# Repository structure

- `src/` — TypeScript compatibility compiler, SDK, CLI, registry, and editor-facing APIs.
- `crates/taml-core/` — canonical Rust compiler engine.
- `crates/taml-fmt/` — formatter and linter.
- `crates/taml-lsp/` — Language Server Protocol binary.
- `crates/typeyaml-napi/` and `crates/typeyaml-wasm/` — Node and browser bindings.
- `cli-rust/` — standalone native `taml` executable.
- `packages/node-core/` — NPM platform-package manifests for N-API binaries.
- `editors/`, `action/`, `.github/` — editor integration and automation.
- `docs/`, `examples/`, `fixtures/` — published documentation and test inputs.
- `scripts/` — repeatable build, cleanup, copy, and benchmark utilities.

Generated directories such as `dist/`, `target/`, and `generated*/` are ignored and never source-controlled.
