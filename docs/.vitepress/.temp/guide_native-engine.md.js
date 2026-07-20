import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Native engine","description":"","frontmatter":{},"headers":[],"relativePath":"guide/native-engine.md","filePath":"guide/native-engine.md"}');
const _sfc_main = { name: "guide/native-engine.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="native-engine" tabindex="-1">Native engine <a class="header-anchor" href="#native-engine" aria-label="Permalink to &quot;Native engine&quot;">​</a></h1><p>typeYAML’s public CLI and SDK remain JavaScript-compatible, while the performance-critical compiler core is implemented in Rust. The workspace contains:</p><ul><li><code>crates/taml-core</code> — portable lexer, parser, checker, emitter, diagnostics, and source-map protocol.</li><li><code>crates/typeyaml-napi</code> — Node N-API binding for platform-specific optional packages.</li><li><code>crates/typeyaml-wasm</code> — WebAssembly binding for browsers, editor integrations, and documentation playgrounds.</li></ul><p>The <code>@typeyaml/core</code> loader selects a package for the current OS and CPU. If no binary exists, applications continue using the TypeScript engine. The Rust core accepts and returns a versioned JSON contract, making parity testing between bindings deterministic.</p><p>The SDK’s <code>compile(source, { engine: &quot;auto&quot; })</code> mode prefers native execution for the portable core grammar. The native engine supports interfaces, range constraints, enums, defaults, and component inheritance. <code>engine: &quot;native&quot;</code> requires a binary and returns an error for source features not yet ported (standard-library imports and <code>pattern</code> constraints); <code>engine: &quot;typescript&quot;</code> always uses the compatibility engine.</p><p><code>fixtures/native-parity</code> holds shared programs and expected output used by both compiler test suites. The native-release workflow builds Windows, Linux, macOS Intel, macOS Apple Silicon, and Wasm artifacts from tagged releases.</p><h2 id="performance-measurement" tabindex="-1">Performance measurement <a class="header-anchor" href="#performance-measurement" aria-label="Permalink to &quot;Performance measurement&quot;">​</a></h2><p>Build the release binary, then run <code>npm run native:benchmark</code>. On the local Windows x64 fixture benchmark (30 fresh process launches), <code>taml check fixtures/native-parity/basic.taml</code> measured a 4.064 ms median, 4.473 ms mean, and 4.818 ms p95. Treat these as a local baseline—not a cross-platform guarantee—and rerun the benchmark on each release target.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/native-engine.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const nativeEngine = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  nativeEngine as default
};
