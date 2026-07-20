import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"IDE, formatting, and registry","description":"","frontmatter":{},"headers":[],"relativePath":"guide/ide.md","filePath":"guide/ide.md"}');
const _sfc_main = { name: "guide/ide.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="ide-formatting-and-registry" tabindex="-1">IDE, formatting, and registry <a class="header-anchor" href="#ide-formatting-and-registry" aria-label="Permalink to &quot;IDE, formatting, and registry&quot;">​</a></h1><p>Run <code>taml-lsp</code> over standard input/output to provide diagnostics, property completion, enum suggestions, hover details, and go-to-definition to any LSP-compatible editor. The VS Code extension now launches this client automatically; set <code>typeyaml.languageServer.path</code> if <code>taml-lsp</code> is not on <code>PATH</code>.</p><p>Use <code>taml fmt file.taml</code> for canonical formatting and <code>taml fmt file.taml --check</code> in CI. <code>taml lint file.taml</code> includes <code>no-unused-interfaces</code>, <code>no-redundant-defaults</code>, and <code>require-string-constraints</code>.</p><p>Remote schema imports are locked by SHA-256 in <code>taml.lock</code> and cached in <code>~/.taml/cache</code>; cached lock entries are used before any network request. GitHub imports must pin a tag or commit: <code>github:owner/repo@v1.2.3/path</code>.</p><p>Use <code>taml lock --verify</code> to validate all lockfile cache entries before an offline or release build.</p><p>Use <code>.tamlrc.json</code> to constrain remote schema hosts; see <a href="../../.tamlrc.example.json"><code>.tamlrc.example.json</code></a>. The LSP supports local interface/component rename, semantic tokens, diagnostics, completion, hover, and go-to-definition.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/ide.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ide = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  ide as default
};
