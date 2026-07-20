# Standard library

Import built-in infrastructure contracts without duplicating their definitions.

```taml
import { Deployment } from "std/k8s"

component "payments" implements Deployment:
  name: "payments"
  image: "registry.example/payments:1.0"
```

Available modules are `std/k8s` (`Deployment`, `Service`, `Ingress`), `std/github-actions` (`Workflow`, `Job`, `Step`), and `std/docker-compose` (`ComposeService`).
