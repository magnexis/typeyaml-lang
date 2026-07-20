import { TamlLexer, type Token, type TokenType } from "../lexer/lexer.js";
import type { ComponentNode, ImportNode, InterfaceNode, ProgramNode, PropertyNode, Scalar, TypeConstraint, ValueType } from "./ast.js";

export class TamlParseError extends Error { constructor(token: Token, message: string) { super(`[TAML Parse Error] ${token.line}:${token.column}: ${message}`); } }
export class TamlParser {
  private cursor = 0;
  constructor(private readonly tokens: Token[]) {}
  static fromSource(source: string): TamlParser { return new TamlParser(new TamlLexer(source).tokenize()); }
  parse(): ProgramNode { const body: ProgramNode["body"] = []; this.skipNewlines(); while (!this.at("EOF")) { if (this.at("IMPORT")) body.push(this.importDeclaration()); else if (this.at("INTERFACE")) body.push(this.interfaceDeclaration()); else if (this.at("COMPONENT")) body.push(this.componentDeclaration()); else throw this.error("expected 'import', 'interface', or 'component'"); this.skipNewlines(); } return { type: "Program", body }; }
  private importDeclaration(): ImportNode { const start = this.take("IMPORT"); this.take("LBRACE"); const names = [this.take("IDENTIFIER").value]; while (this.maybe("COMMA")) names.push(this.take("IDENTIFIER").value); this.take("RBRACE"); this.take("FROM"); const module = this.take("STRING").value; this.lineEnd(); return { type: "Import", names, module, location: { line: start.line, column: start.column } }; }
  private interfaceDeclaration(): InterfaceNode {
    const start = this.take("INTERFACE"); const name = this.take("IDENTIFIER").value; this.take("COLON"); this.lineEnd(); this.take("INDENT"); const properties: Record<string, PropertyNode> = {};
    this.skipNewlines(); while (!this.at("DEDENT")) { const property = this.property(); if (properties[property.key]) throw this.error(`duplicate property '${property.key}'`); properties[property.key] = property; this.lineEnd(); this.skipNewlines(); } this.take("DEDENT"); return { type: "Interface", name, properties, location: { line: start.line, column: start.column } };
  }
  private property(): PropertyNode {
    const keyToken = this.take("IDENTIFIER"); const optional = this.maybe("QUESTION"); this.take("COLON"); const first = this.current(); let valueType: ValueType; let constraints: TypeConstraint | undefined;
    if (first.type === "TYPE") { this.cursor++; valueType = first.value as Exclude<ValueType, "Enum">; constraints = this.constraints(); }
    else if (first.type === "STRING") { valueType = "Enum"; const values: string[] = [this.take("STRING").value]; while (this.maybe("PIPE")) values.push(this.take("STRING").value); constraints = { enumValues: values }; }
    else throw this.error("expected a type or quoted enum literal");
    let defaultValue: Scalar | undefined; if (this.maybe("EQUALS")) defaultValue = this.scalar();
    return { type: "Property", key: keyToken.value, valueType, optional, ...(defaultValue !== undefined ? { defaultValue } : {}), ...(constraints && Object.keys(constraints).length ? { constraints } : {}), location: { line: keyToken.line, column: keyToken.column } };
  }
  private constraints(): TypeConstraint | undefined {
    if (!this.maybe("LPAREN")) return undefined; const result: TypeConstraint = {};
    do { const key = this.take("IDENTIFIER"); this.take("COLON"); if (key.value === "min" || key.value === "max") { const number = this.take("NUMBER"); result[key.value] = Number(number.value); } else if (key.value === "pattern") result.pattern = this.take("STRING").value; else throw this.error(`unknown constraint '${key.value}'`); } while (this.maybe("COMMA")); this.take("RPAREN"); if (result.min !== undefined && result.max !== undefined && result.min > result.max) throw this.error("min cannot exceed max"); return result;
  }
  private componentDeclaration(): ComponentNode {
    const start = this.take("COMPONENT"); const nameToken = this.at("STRING") ? this.take("STRING") : this.take("IDENTIFIER"); let extendsComponent: string | undefined; let implementsInterface: string | undefined;
    if (this.maybe("EXTENDS")) extendsComponent = this.take("IDENTIFIER").value;
    if (this.maybe("IMPLEMENTS")) implementsInterface = this.take("IDENTIFIER").value;
    this.take("COLON"); this.lineEnd(); this.take("INDENT"); const values: Record<string, Scalar> = {}; const valueLocations: Record<string, { line: number; column: number }> = {}; this.skipNewlines();
    while (!this.at("DEDENT")) { const key = this.take("IDENTIFIER"); this.take("COLON");
      // A typed component field (for reusable defaults) is accepted as `key: Int = 3`.
      if (this.at("TYPE")) { this.cursor++; this.constraints(); if (!this.maybe("EQUALS")) throw this.error("component typed fields require a default value"); values[key.value] = this.scalar(); }
      else values[key.value] = this.scalar(); valueLocations[key.value] = { line: key.line, column: key.column };
      this.lineEnd(); this.skipNewlines();
    } this.take("DEDENT"); return { type: "Component", name: nameToken.value, ...(extendsComponent ? { extendsComponent } : {}), ...(implementsInterface ? { implementsInterface } : {}), values, valueLocations, line: start.line, location: { line: start.line, column: start.column } };
  }
  private scalar(): Scalar { const token = this.current(); if (token.type === "STRING") { this.cursor++; return token.value; } if (token.type === "NUMBER") { this.cursor++; return Number(token.value); } if (token.type === "BOOLEAN") { this.cursor++; return token.value === "true"; } if (token.type === "NULL") { this.cursor++; return null; } if (token.type === "IDENTIFIER") { this.cursor++; return token.value; } throw this.error("expected scalar value"); }
  private lineEnd(): void { if (!this.at("NEWLINE")) throw this.error("expected end of line"); this.cursor++; }
  private skipNewlines(): void { while (this.maybe("NEWLINE")) { /* consume */ } }
  private maybe(type: TokenType): boolean { if (!this.at(type)) return false; this.cursor++; return true; }
  private take(type: TokenType): Token { if (!this.at(type)) throw this.error(`expected ${type}, found ${this.current().type}`); return this.tokens[this.cursor++]; }
  private at(type: TokenType): boolean { return this.current().type === type; }
  private current(): Token { return this.tokens[this.cursor]; }
  private error(message: string): TamlParseError { return new TamlParseError(this.current(), message); }
}
