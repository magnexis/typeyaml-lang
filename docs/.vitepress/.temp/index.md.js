import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{"layout":"home","hero":{"name":"typeYAML","text":"Statically typed YAML","tagline":"Stop debugging broken YAML in production.","image":{"src":"/typeyaml-logo.png","alt":"typeYAML logo"},"actions":[{"theme":"brand","text":"Get started","link":"/guide/getting-started"},{"theme":"alt","text":"Language specification","link":"/guide/spec"}]}},"headers":[],"relativePath":"index.md","filePath":"index.md"}');
const _sfc_main = { name: "index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h2 id="compile-safety-into-your-configuration" tabindex="-1">Compile safety into your configuration <a class="header-anchor" href="#compile-safety-into-your-configuration" aria-label="Permalink to &quot;Compile safety into your configuration&quot;">​</a></h2><div class="language-sh vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npm</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> install</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> -g</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> typeyaml</span></span></code></pre></div><table tabindex="0"><thead><tr><th>typeYAML source</th><th>Compiled YAML</th></tr></thead><tbody><tr><td><code>taml&lt;br&gt;interface Service:&lt;br&gt; port: Int(min: 1024)&lt;br&gt;&lt;br&gt;component api implements Service:&lt;br&gt; port: 8080&lt;br&gt;</code></td><td><code>yaml&lt;br&gt;port: 8080&lt;br&gt;</code></td></tr></tbody></table><p>The same source with <code>port: 80</code> fails before it ever reaches a deployment pipeline.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
