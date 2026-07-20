import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"CLI guide","description":"","frontmatter":{},"headers":[],"relativePath":"guide/cli.md","filePath":"guide/cli.md"}');
const _sfc_main = { name: "guide/cli.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="cli-guide" tabindex="-1">CLI guide <a class="header-anchor" href="#cli-guide" aria-label="Permalink to &quot;CLI guide&quot;">​</a></h1><table tabindex="0"><thead><tr><th>Command</th><th>Purpose</th></tr></thead><tbody><tr><td><code>taml check &lt;file.taml&gt;</code></td><td>Parse imports and validate contracts without emitting files.</td></tr><tr><td><code>taml check &lt;generated.yaml&gt;</code></td><td>Validate generated YAML syntax and trace its failing output line through <code>&lt;generated.yaml&gt;.map</code>.</td></tr><tr><td><code>taml build &lt;file.taml&gt; -o &lt;dir&gt;</code></td><td>Emit YAML and <code>.yaml.map</code> source-map sidecars.</td></tr><tr><td><code>taml build &lt;file.taml&gt; --stdout</code></td><td>Emit one compiled document to stdout for shell pipelines.</td></tr><tr><td><code>taml build &lt;file.taml&gt; -f json</code></td><td>Emit valid formatted JSON plus <code>.json.map</code> sidecars.</td></tr><tr><td><code>taml watch &lt;file.taml&gt;</code></td><td>Rebuild whenever the source file changes.</td></tr><tr><td><code>taml init [directory]</code></td><td>Create a starter service and registry policy file.</td></tr><tr><td><code>taml doctor</code></td><td>Display local CLI and cache setup details.</td></tr></tbody></table></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/cli.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const cli = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  cli as default
};
