export interface NativeCompilerBinding { compileJson(request: string): string; compileFileJson?(request: string, projectDir: string, offline?: boolean): string; engineVersion(): string; }
export interface NativeEngineStatus { kind: "native" | "typescript"; version?: string; }

/** Loads an installed optional N-API binary without making native support mandatory. */
export async function loadNativeEngine(): Promise<NativeCompilerBinding | undefined> {
  try { return (await import("@typeyaml/core")) as NativeCompilerBinding; } catch { return undefined; }
}
export async function nativeEngineStatus(): Promise<NativeEngineStatus> { const native = await loadNativeEngine(); return native ? { kind: "native", version: native.engineVersion() } : { kind: "typescript" }; }

export interface NativeCompileOptions { format?: "yaml" | "json"; component?: string; header?: boolean; }
export interface NativeDiagnostic { code: string; message: string; line: number; column: number; }
export interface NativeResponse { valid: boolean; diagnostics: NativeDiagnostic[]; components: Array<{ name: string; output: string }>; }
export function nativeSupports(source: string): boolean {
  // The first native release intentionally excludes filesystem imports and pattern constraints;
  // the wrapper routes those mature TypeScript-only features to the fallback engine.
  return !/^\s*import\b/m.test(source) && !/\bpattern\s*:/.test(source);
}
export async function compileNativeResponse(source: string, options: Omit<NativeCompileOptions, "component"> = {}): Promise<NativeResponse> {
  const engine = await loadNativeEngine(); if (!engine) throw new Error("The optional @typeyaml/core native binary is not installed for this platform.");
  return JSON.parse(engine.compileJson(JSON.stringify({ source, format: options.format ?? "yaml", header: options.header ?? true }))) as NativeResponse;
}
/** Executes the Rust engine when its optional N-API package is installed. */
export async function compileWithNative(source: string, options: NativeCompileOptions = {}): Promise<string> {
  const response = await compileNativeResponse(source, options);
  if (!response.valid) throw new Error(response.diagnostics.map(diagnostic => `[TAML Native Error] ${diagnostic.line}:${diagnostic.column}: ${diagnostic.message}`).join("\n"));
  const selected = options.component ? response.components.find(component => component.name === options.component) : response.components.length === 1 ? response.components[0] : undefined;
  if (!selected) throw new Error("Native compile requires exactly one component or an explicit 'component' option"); return selected.output;
}
/** Native file compiler with lockfile/cache-backed import resolution. */
export async function compileFileWithNative(source: string, projectDir: string, options: NativeCompileOptions & { offline?: boolean } = {}): Promise<string> {
  const engine = await loadNativeEngine(); if (!engine?.compileFileJson) throw new Error("Installed native core does not support file-aware registry imports.");
  const response = JSON.parse(engine.compileFileJson(JSON.stringify({ source, format: options.format ?? "yaml", header: options.header ?? true }), projectDir, options.offline)) as NativeResponse;
  if (!response.valid) throw new Error(response.diagnostics.map(diagnostic => `[TAML Native Error] ${diagnostic.line}:${diagnostic.column}: ${diagnostic.message}`).join("\n"));
  const selected = options.component ? response.components.find(component => component.name === options.component) : response.components.length === 1 ? response.components[0] : undefined;
  if (!selected) throw new Error("Native compile requires exactly one component or an explicit 'component' option"); return selected.output;
}
