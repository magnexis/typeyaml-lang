/** Bundled sources keep `std/*` imports portable in ESM, CommonJS, and packaged CLIs. */
export const standardLibraries: Readonly<Record<string, string>> = {
  k8s: `interface Deployment:
  apiVersion: "apps/v1" = "apps/v1"
  kind: "Deployment" = "Deployment"
  name: String
  replicas?: Int(min: 0) = 1
  image: String

interface Service:
  apiVersion: "v1" = "v1"
  kind: "Service" = "Service"
  name: String
  port: Int(min: 1, max: 65535)
  targetPort?: Int(min: 1, max: 65535)

interface Ingress:
  apiVersion: "networking.k8s.io/v1" = "networking.k8s.io/v1"
  kind: "Ingress" = "Ingress"
  name: String
  host: String(pattern: "^[A-Za-z0-9.-]+$")
`,
  "github-actions": `interface Workflow:
  name: String
  on: String
  runsOn: String = "ubuntu-latest"

interface Job:
  name: String
  runsOn: String = "ubuntu-latest"
  command: String

interface Step:
  name: String
  run: String
`,
  "docker-compose": `interface ComposeService:
  image: String
  containerName?: String
  port: Int(min: 1, max: 65535)
  restart?: "no" | "always" | "unless-stopped" = "unless-stopped"
`
};
