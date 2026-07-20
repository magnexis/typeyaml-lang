# typeYAML for Visual Studio Code

The official VS Code extension for `.taml` files. It provides language recognition, TextMate syntax highlighting, and an LSP client for diagnostics, completion, hover details, go-to-definition, rename, and semantic tokens.

## Develop or package

```sh
cd vscode-extension
npm install
npm run package
```

Install the generated `typeyaml.vsix` through **Extensions: Install from VSIX...**.

The extension starts `taml-lsp` from `PATH`. Configure `typeyaml.languageServer.path` in VS Code settings when the binary is installed somewhere else.

The legacy `editors/vscode` directory is retained for compatibility; this top-level folder is the canonical package location for future extension work and release packaging.
