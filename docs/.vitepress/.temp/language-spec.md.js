import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"typeYAML language specification (MVP)","description":"","frontmatter":{},"headers":[],"relativePath":"language-spec.md","filePath":"language-spec.md"}');
const _sfc_main = { name: "language-spec.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="typeyaml-language-specification-mvp" tabindex="-1">typeYAML language specification (MVP) <a class="header-anchor" href="#typeyaml-language-specification-mvp" aria-label="Permalink to &quot;typeYAML language specification (MVP)&quot;">​</a></h1><blockquote><p><strong>typeYAML — Typed. Structured. Human.</strong></p></blockquote><h2 id="goal" tabindex="-1">Goal <a class="header-anchor" href="#goal" aria-label="Permalink to &quot;Goal&quot;">​</a></h2><p>TypeYAML supplies static guarantees for configuration while producing YAML or JSON that downstream tools already understand. It has no runtime and does not change target-platform behavior. Phase 2 uses the <code>.taml</code> extension and the <code>taml</code> executable.</p><h2 id="declarations" tabindex="-1">Declarations <a class="header-anchor" href="#declarations" aria-label="Permalink to &quot;Declarations&quot;">​</a></h2><p>An <code>interface</code> declares required or defaulted typed fields. A <code>component</code> declares reusable values. Every component creates one output document; a component can also provide inherited values to another component.</p><div class="language-text vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>interface Name:</span></span>
<span class="line"><span>  field?: Type(min: number, max: number) = value</span></span>
<span class="line"><span>component Name:</span></span>
<span class="line"><span>  field: value</span></span>
<span class="line"><span>component &quot;output-name&quot; [extends Component] [implements Interface]:</span></span>
<span class="line"><span>  field: value</span></span></code></pre></div><p>Indentation must be two or more spaces and fields must be indented more than their declaration. Comments begin with <code>#</code> outside quoted strings. Values accepted by this MVP are quoted strings, unquoted strings, integers, floats, booleans, and <code>null</code>.</p><h2 id="semantics" tabindex="-1">Semantics <a class="header-anchor" href="#semantics" aria-label="Permalink to &quot;Semantics&quot;">​</a></h2><p>Components inherit parent values, then receive interface defaults, then their own values; later values override earlier values. Every non-optional interface field with no default is required. Fields are checked against their declared type and numeric constraints. Interfaces are structural, so a component may contain additional target-specific properties.</p><p>Duplicate interface/component names, unknown parents/interfaces, and cyclic component inheritance are errors. Interface fields must be typed. Component inheritance is supported.</p><h2 id="output" tabindex="-1">Output <a class="header-anchor" href="#output" aria-label="Permalink to &quot;Output&quot;">​</a></h2><p>The compiler emits a comment-headed standard YAML document or pretty JSON document. YAML scalar quoting is applied where required to preserve value types. JSON intentionally has no header because JSON comments would make it invalid. Generated files should not be manually edited; edit <code>.taml</code> sources and rebuild.</p><h2 id="deliberate-mvp-boundary" tabindex="-1">Deliberate MVP boundary <a class="header-anchor" href="#deliberate-mvp-boundary" aria-label="Permalink to &quot;Deliberate MVP boundary&quot;">​</a></h2><p>Nested objects/lists, YAML anchors/tags, imports, target-specific schema adapters, and language-server integration are reserved for future versions. This keeps the initial compiler deterministic and easy to embed in pre-commit or CI workflows.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("language-spec.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const languageSpec = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  languageSpec as default
};
