# Getting started

Install typeYAML and create a starter project.

```sh
npm install -g @magnexis/typeyaml
```

With the native binary, the quickest setup is:

```sh
taml init my-service
cd my-service
```

```taml
interface WebService:
  host: String
  port: Int(min: 1024, max: 65535) = 8080

component "api" implements WebService:
  host: "api.internal"
```

Validate it locally, then emit YAML and its matching source map.

```sh
taml check service.taml
taml build service.taml --output generated
taml doctor
```

`generated/api.yaml.map` identifies the `.taml` line and column that produced every generated top-level YAML key.
