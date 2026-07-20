import type { ComponentNode } from "../parser/ast.js";
import type { EmitOptions } from "./yamlEmitter.js";
/** JSON has no comment syntax, so it always remains valid JSON. */
export class JsonEmitter { emit(component: ComponentNode, _options: EmitOptions = {}): string { return JSON.stringify(component.values, null, 2) + "\n"; } }
