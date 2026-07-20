import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Contributing and release policy","description":"","frontmatter":{},"headers":[],"relativePath":"guide/contributing.md","filePath":"guide/contributing.md"}');
const _sfc_main = { name: "guide/contributing.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="contributing-and-release-policy" tabindex="-1">Contributing and release policy <a class="header-anchor" href="#contributing-and-release-policy" aria-label="Permalink to &quot;Contributing and release policy&quot;">​</a></h1><p>Run <code>npm test</code>, <code>cargo check --workspace</code>, <code>cargo test -p taml-core</code>, and <code>taml fmt --check</code> before opening a pull request. The native cross-platform workflow validates Linux, macOS, and Windows builds; tagged releases package standalone binaries and the VS Code extension.</p><p>Registry schemas must be HTTPS, content-locked, and GitHub-pinned to a tag or commit. Use <code>.tamlrc.json</code> host allowlists for organization-controlled builds. Parser fuzzing uses <code>cargo fuzz run compile</code> from <code>crates/taml-core/fuzz</code>.</p></div>`);
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
