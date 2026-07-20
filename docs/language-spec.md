# typeYAML language specification (MVP)

> **typeYAML — Typed. Structured. Human.**

## Goal

TypeYAML supplies static guarantees for configuration while producing YAML or JSON that downstream tools already understand. It has no runtime and does not change target-platform behavior. Phase 2 uses the `.taml` extension and the `taml` executable.

## Declarations

An `interface` declares required or defaulted typed fields. A `component` declares reusable values. Every component creates one output document; a component can also provide inherited values to another component.

```text
interface Name:
  field?: Type(min: number, max: number) = value
component Name:
  field: value
component "output-name" [extends Component] [implements Interface]:
  field: value
```

Indentation must be two or more spaces and fields must be indented more than their declaration. Comments begin with `#` outside quoted strings. Values accepted by this MVP are quoted strings, unquoted strings, integers, floats, booleans, and `null`.

## Semantics

Components inherit parent values, then receive interface defaults, then their own values; later values override earlier values. Every non-optional interface field with no default is required. Fields are checked against their declared type and numeric constraints. Interfaces are structural, so a component may contain additional target-specific properties.

Duplicate interface/component names, unknown parents/interfaces, and cyclic component inheritance are errors. Interface fields must be typed. Component inheritance is supported.

## Output

The compiler emits a comment-headed standard YAML document or pretty JSON document. YAML scalar quoting is applied where required to preserve value types. JSON intentionally has no header because JSON comments would make it invalid. Generated files should not be manually edited; edit `.taml` sources and rebuild.

## Deliberate MVP boundary

Nested objects/lists, YAML anchors/tags, imports, target-specific schema adapters, and language-server integration are reserved for future versions. This keeps the initial compiler deterministic and easy to embed in pre-commit or CI workflows.
