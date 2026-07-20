# Language specification

```text
import { InterfaceName } from "std/library"
interface Name:
  property?: String(pattern: "regex") = "default"
component Name [extends Parent] [implements Interface]:
  property: value
```

Interfaces declare a structural contract. `String`, `Int`, `Float`, and `Boolean` are primitive types. Quoted values joined by `|` form an enum. `min`, `max`, and `pattern` are supported constraints. Components inherit parent values, inject declared defaults, and validate against an implemented interface.
