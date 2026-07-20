import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Language specification","description":"","frontmatter":{},"headers":[],"relativePath":"guide/spec.md","filePath":"guide/spec.md"}');
const _sfc_main = { name: "guide/spec.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="language-specification" tabindex="-1">Language specification <a class="header-anchor" href="#language-specification" aria-label="Permalink to &quot;Language specification&quot;">​</a></h1><div class="language-text vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>import { InterfaceName } from &quot;std/library&quot;</span></span>
<span class="line"><span>interface Name:</span></span>
<span class="line"><span>  property?: String(pattern: &quot;regex&quot;) = &quot;default&quot;</span></span>
<span class="line"><span>component Name [extends Parent] [implements Interface]:</span></span>
<span class="line"><span>  property: value</span></span></code></pre></div><p>Interfaces declare a structural contract. <code>String</code>, <code>Int</code>, <code>Float</code>, and <code>Boolean</code> are primitive types. Quoted values joined by <code>|</code> form an enum. <code>min</code>, <code>max</code>, and <code>pattern</code> are supported constraints. Components inherit parent values, inject declared defaults, and validate against an implemented interface.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/spec.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const spec = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  spec as default
};
