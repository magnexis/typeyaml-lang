import { defineConfig } from "vitepress";
import tamlGrammar from "../../editors/vscode/syntaxes/taml.tmLanguage.json" with { type: "json" };

export default defineConfig({
  title: "typeYAML (🦣) - Statically Typed YAML",
  description: "Typed. Structured. Human.",
  markdown: { languages: [tamlGrammar] },
  themeConfig: {
    logo: "/typeyaml-logo.png",
    nav: [{ text: "Guide", link: "/guide/getting-started" }, { text: "Language spec", link: "/guide/spec" }, { text: "Standard library", link: "/guide/standard-library" }, { text: "CLI", link: "/guide/cli" }],
    sidebar: { "/guide/": [{ text: "Getting Started", items: [{ text: "Getting started", link: "/guide/getting-started" }, { text: "Language specification", link: "/guide/spec" }, { text: "Standard library", link: "/guide/standard-library" }, { text: "CLI guide", link: "/guide/cli" }, { text: "Native engine", link: "/guide/native-engine" }, { text: "IDE and registry", link: "/guide/ide" }, { text: "Contributing", link: "/guide/contributing" }] }] },
    socialLinks: [{ icon: "github", link: "https://github.com/typeyaml/typeyaml" }]
  }
});
