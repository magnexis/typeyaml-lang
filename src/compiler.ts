import { TamlParser } from "./parser/parser.js";
import { TamlTypeChecker, type CheckerResult } from "./checker/checker.js";
import { YamlEmitter } from "./emitter/yamlEmitter.js";
import { JsonEmitter } from "./emitter/jsonEmitter.js";
import { readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import type { ProgramNode } from "./parser/ast.js";
import { createSourceMap, type TypeYamlSourceMap } from "./sourcemap/sourcemap.js";
import { standardLibraries } from "./stdlib/library.js";
import { resolveRemoteSchema } from "./registry/index.js";
import { compileNativeResponse, nativeSupports } from "./native.js";
export function analyze(source: string): CheckerResult { return new TamlTypeChecker().check(TamlParser.fromSource(source).parse()); }
export interface CompileOptions { format?: "yaml" | "json"; strictConstraints?: boolean; component?: string; header?: boolean; engine?: "auto" | "native" | "typescript"; }
export interface CheckResult extends CheckerResult { errors: CheckerResult["diagnostics"]; }
export function parseAST(source: string): ProgramNode { return TamlParser.fromSource(source).parse(); }
export function check(source: string): CheckResult { const result = analyze(source); return { ...result, errors: result.diagnostics }; }
export function compile(source: string, format?: "yaml" | "json"): Array<{ name: string; output: string }>;
export function compile(source: string, options: CompileOptions): Promise<string>;
export function compile(source: string, selection: "yaml" | "json" | CompileOptions = "yaml"): Array<{ name: string; output: string }> | Promise<string> {
  const sdk = typeof selection === "object"; const options = typeof selection === "object" ? selection : { format: selection };
  const typescriptCompile = (): string => { const checked = analyze(source); if (!checked.valid) throw new Error(checked.diagnostics.map(d => d.formatted).join("\n")); const emitter = options.format === "json" ? new JsonEmitter() : new YamlEmitter(); const outputs = checked.components.map(component => ({ name: component.name, output: emitter.emit(component, { header: options.header }) })); const selected = options.component ? outputs.find(item => item.name === options.component) : outputs.length === 1 ? outputs[0] : undefined; if (!selected) throw new Error("SDK compile requires exactly one component or an explicit 'component' option"); return selected.output; };
  if (!sdk) { const checked = analyze(source); if (!checked.valid) throw new Error(checked.diagnostics.map(d => d.formatted).join("\n")); const emitter = options.format === "json" ? new JsonEmitter() : new YamlEmitter(); return checked.components.map(component => ({ name: component.name, output: emitter.emit(component, { header: options.header }) })); }
  const engine = options.engine ?? "auto";
  if (engine === "typescript") return Promise.resolve().then(typescriptCompile);
  if (!nativeSupports(source)) { if (engine === "native") return Promise.reject(new Error("This source uses imports, inheritance, or pattern constraints that are not yet supported by the native engine.")); return Promise.resolve().then(typescriptCompile); }
  return compileNativeResponse(source, options).then(response => { if (!response.valid) throw new Error(response.diagnostics.map(diagnostic => `[TAML Native Error] ${diagnostic.line}:${diagnostic.column}: ${diagnostic.message}`).join("\n")); const selected = options.component ? response.components.find(component => component.name === options.component) : response.components.length === 1 ? response.components[0] : undefined; if (!selected) throw new Error("SDK compile requires exactly one component or an explicit 'component' option"); return selected.output; }).catch(error => { if (engine === "native") throw error; return typescriptCompile(); });
}
export async function analyzeFile(file: string): Promise<CheckerResult> {
  const sourceFile = resolve(file); const root = TamlParser.fromSource(await readFile(sourceFile, "utf8")).parse(); const imported = [] as ProgramNode["body"];
  for (const node of root.body) if (node.type === "Import") { const library = node.module.startsWith("std/") ? standardLibraries[node.module.slice(4)] : await resolveRemoteSchema(node.module, { cwd: dirname(sourceFile) }); if (!library) throw new Error(`[TAML Import Error] ${node.location.line}:${node.location.column}: cannot resolve '${node.module}'`); const program = TamlParser.fromSource(library).parse(); for (const declaration of program.body) if (declaration.type === "Interface" && node.names.includes(declaration.name)) imported.push(declaration); const available = new Set(program.body.filter(item => item.type === "Interface").map(item => item.type === "Interface" ? item.name : "")); for (const name of node.names) if (!available.has(name)) throw new Error(`[TAML Import Error] '${name}' is not exported by '${node.module}'`); }
  return new TamlTypeChecker().check({ type: "Program", body: [...imported, ...root.body.filter(node => node.type !== "Import")] });
}
export async function compileFile(file: string, format: "yaml" | "json" = "yaml"): Promise<Array<{ name: string; output: string; sourceMap: TypeYamlSourceMap }>> { const checked = await analyzeFile(file); if (!checked.valid) throw new Error(checked.diagnostics.map(d => d.formatted).join("\n")); const emitter = format === "yaml" ? new YamlEmitter() : new JsonEmitter(); const extension = format === "yaml" ? "yaml" : "json"; return checked.components.map(component => ({ name: component.name, output: emitter.emit(component), sourceMap: createSourceMap(component, `${component.name}.${extension}`, basename(file), format === "yaml" ? 1 : 0) })); }
