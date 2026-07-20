import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"typeYAML implementation plan","description":"","frontmatter":{},"headers":[],"relativePath":"implementation-plan.md","filePath":"implementation-plan.md"}');
const _sfc_main = { name: "implementation-plan.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="typeyaml-implementation-plan" tabindex="-1">typeYAML implementation plan <a class="header-anchor" href="#typeyaml-implementation-plan" aria-label="Permalink to &quot;typeYAML implementation plan&quot;">​</a></h1><blockquote><p><strong>Typed. Structured. Human.</strong></p></blockquote><ol><li>Tokenize indentation-sensitive declarations and scalar field values.</li><li>Parse the source into an AST with line locations.</li><li>Resolve component/interface references and merge service schemas.</li><li>Validate required fields, primitive/literal-union types, and bounds.</li><li>Emit deterministic YAML/JSON and expose <code>check</code>/<code>build</code> commands.</li><li>Add executable examples and regression tests; follow with nested values, imports, LSP, and Kubernetes/GitHub Actions schema packages.</li></ol></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("implementation-plan.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const implementationPlan = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  implementationPlan as default
};
