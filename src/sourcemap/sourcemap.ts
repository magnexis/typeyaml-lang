import type { ComponentNode, SourceLocation } from "../parser/ast.js";
export interface SourceMapEntry { generatedLine: number; generatedColumn: number; source: string; sourceLine: number; sourceColumn: number; key: string; }
export interface TypeYamlSourceMap { version: 1; file: string; source: string; mappings: SourceMapEntry[]; }
/** Maps the top-level YAML key emitted on each line to its `.taml` source location. */
export function createSourceMap(component: ComponentNode, outputFile: string, sourceFile: string, headerLines = 1): TypeYamlSourceMap {
  const mappings = Object.keys(component.values).map((key, index) => { const loc: SourceLocation = component.valueLocations[key] ?? component.location; return { generatedLine: headerLines + index + 1, generatedColumn: 1, source: sourceFile, sourceLine: loc.line, sourceColumn: loc.column, key }; });
  return { version: 1, file: outputFile, source: sourceFile, mappings };
}
