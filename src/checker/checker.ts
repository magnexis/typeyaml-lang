import type { ComponentNode, InterfaceNode, ProgramNode, PropertyNode, Scalar } from "../parser/ast.js";
export interface TamlDiagnostic { code: string; component: string; line: number; message: string; formatted: string; }
export interface CheckerResult { valid: boolean; diagnostics: TamlDiagnostic[]; components: ComponentNode[]; }
export class TamlTypeChecker {
  check(program: ProgramNode): CheckerResult {
    const interfaces = new Map<string, InterfaceNode>(); const declared = new Map<string, ComponentNode>(); const diagnostics: TamlDiagnostic[] = [];
    for (const node of program.body) { if (node.type === "Interface") { if (interfaces.has(node.name)) diagnostics.push(this.diag(node.name, node.location.line, "DUPLICATE_INTERFACE", `duplicate interface '${node.name}'`)); interfaces.set(node.name, node); } else if (node.type === "Component") { if (declared.has(node.name)) diagnostics.push(this.diag(node.name, node.line, "DUPLICATE_COMPONENT", `duplicate component '${node.name}'`)); declared.set(node.name, node); } }
    const resolved = new Map<string, ComponentNode>(); const resolving = new Set<string>();
    const resolve = (node: ComponentNode): ComponentNode => {
      const cached = resolved.get(node.name); if (cached) return cached;
      if (resolving.has(node.name)) { diagnostics.push(this.diag(node.name, node.line, "CYCLIC_INHERITANCE", "cyclic component inheritance")); return node; }
      resolving.add(node.name); let inherited: Record<string, Scalar> = {};
      let inheritedLocations: ComponentNode["valueLocations"] = {};
      if (node.extendsComponent) { const parent = declared.get(node.extendsComponent); if (!parent) diagnostics.push(this.diag(node.name, node.line, "UNKNOWN_PARENT", `extends unknown component '${node.extendsComponent}'`)); else { const resolvedParent = resolve(parent); inherited = { ...resolvedParent.values }; inheritedLocations = { ...resolvedParent.valueLocations }; } }
      const component: ComponentNode = { ...node, values: { ...inherited, ...node.values }, valueLocations: { ...inheritedLocations, ...node.valueLocations } };
      if (component.implementsInterface) { const iface = interfaces.get(component.implementsInterface); if (!iface) diagnostics.push(this.diag(node.name, node.line, "UNKNOWN_INTERFACE", `implements unknown interface '${component.implementsInterface}'`)); else this.validate(component, iface, diagnostics); }
      resolving.delete(node.name); resolved.set(node.name, component); return component;
    };
    const components = [...declared.values()].map(resolve); return { valid: diagnostics.length === 0, diagnostics, components };
  }
  private validate(component: ComponentNode, iface: InterfaceNode, diagnostics: TamlDiagnostic[]): void {
    for (const property of Object.values(iface.properties)) {
      if (!(property.key in component.values)) { if (property.defaultValue !== undefined) { component.values[property.key] = property.defaultValue; component.valueLocations[property.key] = property.location; } else if (!property.optional) diagnostics.push(this.diag(component.name, component.line, "MISSING_PROPERTY", `Property '${property.key}' is required by interface '${iface.name}'.`)); continue; }
      const value = component.values[property.key]; const issue = this.valueError(property, value); if (issue) diagnostics.push(this.diag(component.name, component.line, "TYPE_ERROR", `Property '${property.key}' value (${JSON.stringify(value)}) ${issue}.`));
    }
  }
  private valueError(property: PropertyNode, value: Scalar): string | undefined {
    const numeric = typeof value === "number" && Number.isFinite(value);
    if (property.valueType === "String" && typeof value !== "string") return "must be a string";
    if (property.valueType === "Boolean" && typeof value !== "boolean") return "must be a boolean";
    if (property.valueType === "Int" && (!numeric || !Number.isInteger(value))) return "must be an integer";
    if (property.valueType === "Float" && !numeric) return "must be a number";
    if (property.valueType === "Enum" && (typeof value !== "string" || !property.constraints?.enumValues?.includes(value))) return `must be one of ${JSON.stringify(property.constraints?.enumValues ?? [])}`;
    if (numeric) { if (property.constraints?.min !== undefined && value < property.constraints.min) return `is below constraint min (${property.constraints.min})`; if (property.constraints?.max !== undefined && value > property.constraints.max) return `exceeds constraint max (${property.constraints.max})`; }
    if (typeof value === "string") { if (property.constraints?.min !== undefined && value.length < property.constraints.min) return `is shorter than min length (${property.constraints.min})`; if (property.constraints?.max !== undefined && value.length > property.constraints.max) return `exceeds max length (${property.constraints.max})`; if (property.constraints?.pattern !== undefined && !new RegExp(property.constraints.pattern).test(value)) return `does not match pattern '${property.constraints.pattern}'`; }
    return undefined;
  }
  private diag(component: string, line: number, code: string, message: string): TamlDiagnostic { return { code, component, line, message, formatted: `[TAML Type Error] Component '${component}' (line ${line}): ${message}` }; }
}
