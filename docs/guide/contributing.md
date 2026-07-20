# Contributing and release policy

Run `npm test`, `cargo check --workspace`, `cargo test -p taml-core`, and `taml fmt --check` before opening a pull request. The native cross-platform workflow validates Linux, macOS, and Windows builds; tagged releases package standalone binaries and the VS Code extension.

Registry schemas must be HTTPS, content-locked, and GitHub-pinned to a tag or commit. Use `.tamlrc.json` host allowlists for organization-controlled builds. Parser fuzzing uses `cargo fuzz run compile` from `crates/taml-core/fuzz`.
