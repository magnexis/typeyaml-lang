# Support and release policy

TypeYAML is maintained exclusively by Magnexis. External code contributions and pull requests are not accepted.

## Report an issue

Use the [GitHub issue tracker](https://github.com/magnexis/typeyaml-lang/issues) for bugs, security concerns, documentation corrections, and feature requests. Include the TypeYAML version, operating system, command, minimal `.taml` input, expected behavior, and actual output.

Do not include credentials, tokens, private registry URLs, or production configuration secrets in an issue.

## Release policy

Magnexis maintains releases internally. Before a release, maintainers run `npm test`, `cargo check --workspace`, `cargo test -p taml-core`, `cargo test -p taml-lsp`, and `taml fmt --check`. Tagged releases package the SDK, native binaries, N-API bindings, Wasm bundle, VS Code extension, and documentation artifacts.

See the [release guide](https://github.com/magnexis/typeyaml-lang/blob/main/RELEASE.md) for the artifact inventory and verification procedure.
