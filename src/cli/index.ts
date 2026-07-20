#!/usr/bin/env node
import { Command } from "commander";
import { readFile, mkdir, writeFile, watch } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { parseDocument } from "yaml";
import { analyzeFile, compileFile } from "../compiler.js";
import { importFile } from "./import.js";

type Format = "yaml" | "json";
interface BuildOptions { output?: string; format: Format; stdout?: boolean; }
function printDiagnostics(diagnostics: Awaited<ReturnType<typeof analyzeFile>>["diagnostics"]): void { for (const diagnostic of diagnostics) console.error(diagnostic.formatted); }
interface MapEntry { generatedLine: number; source: string; sourceLine: number; sourceColumn: number; key: string; }
interface SidecarMap { mappings: MapEntry[]; }
async function checkGeneratedFile(file: string): Promise<void> {
  const content = await readFile(file, "utf8"); const extension = extname(file).toLowerCase(); let invalidLine: number | undefined;
  if (extension === ".json") { try { JSON.parse(content); } catch (error) { const position = /position (\d+)/.exec(error instanceof Error ? error.message : "")?.[1]; if (position) invalidLine = content.slice(0, Number(position)).split("\n").length; } }
  else { const document = parseDocument(content); invalidLine = document.errors[0]?.linePos?.[0]?.line; }
  if (invalidLine === undefined) { console.log(`OK: ${file} is valid ${extension.slice(1).toUpperCase()}`); return; }
  let trace = ""; try { const map = JSON.parse(await readFile(`${file}.map`, "utf8")) as SidecarMap; const entry = map.mappings.find(item => item.generatedLine === invalidLine) ?? map.mappings.find(item => item.generatedLine <= invalidLine); if (entry) trace = `\n[TAML Source Map] ${file}:${invalidLine} maps to ${entry.source}:${entry.sourceLine}:${entry.sourceColumn} (key '${entry.key}')`; } catch { /* Source-map sidecar is optional. */ }
  throw new Error(`[TAML Generated File Error] ${file}:${invalidLine}: invalid ${extension.slice(1).toUpperCase()}${trace}`);
}
async function build(file: string, options: BuildOptions): Promise<void> {
  const results = await compileFile(file, options.format);
  if (options.stdout) { if (results.length !== 1) throw new Error("--stdout requires exactly one component"); process.stdout.write(results[0].output); return; }
  const requested = options.output ? resolve(options.output) : dirname(resolve(file)); const extension = options.format === "yaml" ? ".yaml" : ".json";
  const singleFile = extname(requested) === extension;
  if (singleFile && results.length !== 1) throw new Error("an output file can only be used with one component");
  if (singleFile) { await mkdir(dirname(requested), { recursive: true }); await writeFile(requested, results[0].output); await writeFile(`${requested}.map`, JSON.stringify({ ...results[0].sourceMap, file: basename(requested) }, null, 2) + "\n"); console.log(`Built ${requested}`); return; }
  await mkdir(requested, { recursive: true }); for (const result of results) { const output = join(requested, `${result.name}${extension}`); await writeFile(output, result.output); await writeFile(`${output}.map`, JSON.stringify({ ...result.sourceMap, file: basename(output) }, null, 2) + "\n"); console.log(`Built ${output}`); }
}
const program = new Command().name("taml").description("TypeYAML compiler").version("1.0.0");
program.command("check <file>").description("validate a .taml file, or trace generated YAML/JSON syntax through its source map").action(async (file: string) => { try { if ([".yaml", ".yml", ".json"].includes(extname(file).toLowerCase())) await checkGeneratedFile(file); else { const result = await analyzeFile(file); if (!result.valid) { printDiagnostics(result.diagnostics); process.exitCode = 1; } else console.log(`OK: ${result.components.length} component${result.components.length === 1 ? "" : "s"} validated`); } } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; } });
program.command("build <file>").description("compile a .taml file").option("-o, --output <path>", "output directory or file").option("-f, --format <yaml|json>", "emission format", "yaml").option("--stdout", "write one compiled component to stdout").action(async (file: string, options: BuildOptions) => { if (options.format !== "yaml" && options.format !== "json") { console.error("--format must be yaml or json"); process.exitCode = 2; return; } try { await build(file, options); } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; } });
program.command("import <file>").description("infer a TypeYAML schema and component from legacy YAML or JSON").requiredOption("--out <file>", "destination .taml file").action(async (file: string, options: { out: string }) => { try { await importFile(file, options.out); console.log(`Imported ${file} -> ${options.out}`); } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; } });
program.command("watch <file>").description("rebuild when the source file changes").option("-o, --output <path>", "output directory or file").option("-f, --format <yaml|json>", "emission format", "yaml").action(async (file: string, options: BuildOptions) => { if (options.format !== "yaml" && options.format !== "json") throw new Error("--format must be yaml or json"); const rebuild = async (): Promise<void> => { try { await build(file, options); } catch (error) { console.error(error instanceof Error ? error.message : String(error)); } }; await rebuild(); console.log(`Watching ${resolve(file)}`); for await (const event of watch(resolve(file))) if (event.eventType === "change") await rebuild(); });
await program.parseAsync();
