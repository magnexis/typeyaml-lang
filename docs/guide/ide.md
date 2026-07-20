# IDE, formatting, and registry

Run `taml-lsp` over standard input/output to provide diagnostics, property completion, enum suggestions, hover details, and go-to-definition to any LSP-compatible editor. The VS Code extension now launches this client automatically; set `typeyaml.languageServer.path` if `taml-lsp` is not on `PATH`.

Use `taml fmt file.taml` for canonical formatting and `taml fmt file.taml --check` in CI. `taml lint file.taml` includes `no-unused-interfaces`, `no-redundant-defaults`, and `require-string-constraints`.

Remote schema imports are locked by SHA-256 in `taml.lock` and cached in `~/.taml/cache`; cached lock entries are used before any network request. GitHub imports must pin a tag or commit: `github:owner/repo@v1.2.3/path`.

Use `taml lock --verify` to validate all lockfile cache entries before an offline or release build.

Use `.tamlrc.json` to constrain remote schema hosts; see [`.tamlrc.example.json`](../../.tamlrc.example.json). The LSP supports local interface/component rename, semantic tokens, diagnostics, completion, hover, and go-to-definition.
