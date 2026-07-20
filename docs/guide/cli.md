# CLI guide

| Command | Purpose |
| --- | --- |
| `taml check <file.taml>` | Parse imports and validate contracts without emitting files. |
| `taml check <generated.yaml>` | Validate generated YAML syntax and trace its failing output line through `<generated.yaml>.map`. |
| `taml build <file.taml> -o <dir>` | Emit YAML and `.yaml.map` source-map sidecars. |
| `taml build <file.taml> --stdout` | Emit one compiled document to stdout for shell pipelines. |
| `taml build <file.taml> -f json` | Emit valid formatted JSON plus `.json.map` sidecars. |
| `taml watch <file.taml>` | Rebuild whenever the source file changes. |
| `taml init [directory]` | Create a starter service and registry policy file. |
| `taml doctor` | Display local CLI and cache setup details. |
