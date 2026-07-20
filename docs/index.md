---
layout: home
hero:
  name: typeYAML
  text: Statically typed YAML
  tagline: Stop debugging broken YAML in production.
  image:
    src: /typeyaml-logo.png
    alt: typeYAML logo
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Language specification
      link: /guide/spec
---

## Compile safety into your configuration

```sh
npm install -g typeyaml
```

| typeYAML source | Compiled YAML |
| --- | --- |
| ```taml<br>interface Service:<br>  port: Int(min: 1024)<br><br>component api implements Service:<br>  port: 8080<br>``` | ```yaml<br>port: 8080<br>``` |

The same source with `port: 80` fails before it ever reaches a deployment pipeline.
