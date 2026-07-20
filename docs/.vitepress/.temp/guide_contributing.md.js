import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Support and release policy","description":"","frontmatter":{},"headers":[],"relativePath":"guide/contributing.md","filePath":"guide/contributing.md"}');
const _sfc_main = { name: "guide/contributing.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="support-and-release-policy" tabindex="-1">Support and release policy <a class="header-anchor" href="#support-and-release-policy" aria-label="Permalink to &quot;Support and release policy&quot;">​</a></h1><p>TypeYAML is maintained exclusively by Magnexis. External code contributions and pull requests are not accepted.</p><h2 id="report-an-issue" tabindex="-1">Report an issue <a class="header-anchor" href="#report-an-issue" aria-label="Permalink to &quot;Report an issue&quot;">​</a></h2><p>Use the <a href="https://github.com/magnexis/typeyaml-lang/issues" target="_blank" rel="noreferrer">GitHub issue tracker</a> for bugs, security concerns, documentation corrections, and feature requests. Include the TypeYAML version, operating system, command, minimal <code>.taml</code> input, expected behavior, and actual output.</p><p>Do not include credentials, tokens, private registry URLs, or production configuration secrets in an issue.</p><h2 id="release-policy" tabindex="-1">Release policy <a class="header-anchor" href="#release-policy" aria-label="Permalink to &quot;Release policy&quot;">​</a></h2><p>Magnexis maintains releases internally. Before a release, maintainers run <code>npm test</code>, <code>cargo check --workspace</code>, <code>cargo test -p taml-core</code>, <code>cargo test -p taml-lsp</code>, and <code>taml fmt --check</code>. Tagged releases package the SDK, native binaries, N-API bindings, Wasm bundle, VS Code extension, and documentation artifacts.</p><p>See the <a href="https://github.com/magnexis/typeyaml-lang/blob/main/RELEASE.md" target="_blank" rel="noreferrer">release guide</a> for the artifact inventory and verification procedure.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/contributing.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const contributing = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  contributing as default
};
