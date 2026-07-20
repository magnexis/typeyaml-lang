/** JSON/YAML scalar values supported by the first stable TypeYAML grammar. */
export type Scalar = string | number | boolean | null;

export type ASTNode = ProgramNode | ImportNode | InterfaceNode | ComponentNode | PropertyNode;

export interface SourceLocation { line: number; column: number; }
export interface ProgramNode { type: "Program"; body: Array<ImportNode | InterfaceNode | ComponentNode>; }
export interface ImportNode { type: "Import"; names: string[]; module: string; location: SourceLocation; }
export interface TypeConstraint { min?: number; max?: number; pattern?: string; enumValues?: string[]; }
export type ValueType = "String" | "Int" | "Float" | "Boolean" | "Enum";
export interface PropertyNode {
  type: "Property";
  key: string;
  valueType: ValueType;
  optional: boolean;
  defaultValue?: Scalar;
  constraints?: TypeConstraint;
  location: SourceLocation;
}
export interface InterfaceNode { type: "Interface"; name: string; properties: Record<string, PropertyNode>; location: SourceLocation; }
export interface ComponentNode {
  type: "Component";
  name: string;
  extendsComponent?: string;
  implementsInterface?: string;
  values: Record<string, Scalar>;
  valueLocations: Record<string, SourceLocation>;
  line: number;
  location: SourceLocation;
}
