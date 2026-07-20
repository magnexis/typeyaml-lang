# typeYAML implementation plan

> **Typed. Structured. Human.**

1. Tokenize indentation-sensitive declarations and scalar field values.
2. Parse the source into an AST with line locations.
3. Resolve component/interface references and merge service schemas.
4. Validate required fields, primitive/literal-union types, and bounds.
5. Emit deterministic YAML/JSON and expose `check`/`build` commands.
6. Add executable examples and regression tests; follow with nested values, imports, LSP, and Kubernetes/GitHub Actions schema packages.
