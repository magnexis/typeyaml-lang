# Releasing TypeYAML

The canonical release workflow is [Release TypeYAML](.github/workflows/release.yml). Push a protected, annotated `vX.Y.Z` tag whose version matches `package.json`, `vscode-extension/package.json`, and `crates/typeyaml-napi/package.json`.

The workflow validates the version, tests and packs the SDK, builds standalone native CLIs, archives N-API bindings and the Wasm build, packages the VS Code extension, builds the documentation archive, creates SHA-256 checksums and `artifacts.json`, attests the release files, creates the GitHub Release, and publishes to npm with provenance.

Every GitHub Release includes:

- `typeyaml-vX.Y.Z.tgz` -- Node SDK and CLI wrapper.
- `typeyaml-vX.Y.Z-<target>.tar.gz` / `.zip` -- native CLI for Linux x64/ARM64, macOS Intel/Apple Silicon, and Windows x64.
- `typeyaml-napi-vX.Y.Z-<target>.tar.gz` -- native Node bindings.
- `typeyaml-wasm-vX.Y.Z.tar.gz` -- browser/editor Wasm package.
- `typeyaml-vX.Y.Z.vsix` -- VS Code extension.
- `typeyaml-docs-vX.Y.Z.tar.gz` -- static documentation output.
- `SHA256SUMS.txt` and `artifacts.json` -- verification and inventory data.

Verify a download with `sha256sum -c SHA256SUMS.txt` after downloading the asset set. GitHub's provenance attestation is attached to the release workflow artifacts.
