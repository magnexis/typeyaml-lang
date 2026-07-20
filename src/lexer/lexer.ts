export type TokenType = "IMPORT" | "FROM" | "INTERFACE" | "COMPONENT" | "EXTENDS" | "IMPLEMENTS" | "TYPE" | "IDENTIFIER" | "STRING" | "NUMBER" | "BOOLEAN" | "NULL" | "COLON" | "QUESTION" | "EQUALS" | "LPAREN" | "RPAREN" | "LBRACE" | "RBRACE" | "PIPE" | "COMMA" | "INDENT" | "DEDENT" | "NEWLINE" | "EOF";
export interface Token { type: TokenType; value: string; line: number; column: number; }
export class TamlLexError extends Error { constructor(public readonly line: number, public readonly column: number, message: string) { super(`[TAML Lex Error] ${line}:${column}: ${message}`); } }

const keywords: Record<string, TokenType> = { import: "IMPORT", from: "FROM", interface: "INTERFACE", component: "COMPONENT", extends: "EXTENDS", implements: "IMPLEMENTS" };
const types = new Set(["String", "Int", "Float", "Boolean"]);
export class TamlLexer {
  constructor(private readonly source: string) {}
  tokenize(): Token[] {
    const tokens: Token[] = []; const indents = [0];
    const lines = this.source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
    for (let index = 0; index < lines.length; index++) {
      const line = index + 1; const raw = lines[index]; let position = 0;
      while (raw[position] === " ") position++;
      if (raw[position] === "\t") throw new TamlLexError(line, position + 1, "tabs are not allowed; use spaces");
      const content = raw.slice(position);
      if (content === "" || content.startsWith("#")) continue;
      if (position > indents[indents.length - 1]) { indents.push(position); tokens.push({ type: "INDENT", value: "", line, column: 1 }); }
      else { while (position < indents[indents.length - 1]) { indents.pop(); tokens.push({ type: "DEDENT", value: "", line, column: 1 }); } if (position !== indents[indents.length - 1]) throw new TamlLexError(line, 1, "inconsistent indentation"); }
      while (position < raw.length) {
        const char = raw[position]; const col = position + 1;
        if (char === " " || char === "\t") { position++; continue; }
        if (char === "#") break;
        const punctuator: Record<string, TokenType> = { ":": "COLON", "?": "QUESTION", "=": "EQUALS", "(": "LPAREN", ")": "RPAREN", "{": "LBRACE", "}": "RBRACE", "|": "PIPE", ",": "COMMA" };
        if (punctuator[char]) { tokens.push({ type: punctuator[char], value: char, line, column: col }); position++; continue; }
        if (char === '"' || char === "'") { const quote = char; let value = ""; position++; let closed = false; while (position < raw.length) { const c = raw[position++]; if (c === quote) { closed = true; break; } if (c === "\\" && quote === '"') { const escaped = raw[position++]; const map: Record<string, string> = { n: "\n", r: "\r", t: "\t", '"': '"', "\\": "\\" }; if (escaped === undefined || map[escaped] === undefined) throw new TamlLexError(line, position, "invalid string escape"); value += map[escaped]; } else value += c; } if (!closed) throw new TamlLexError(line, col, "unterminated string literal"); tokens.push({ type: "STRING", value, line, column: col }); continue; }
        const number = /^-?(?:0|[1-9]\d*)(?:\.\d+)?/.exec(raw.slice(position));
        if (number) { tokens.push({ type: "NUMBER", value: number[0], line, column: col }); position += number[0].length; continue; }
        const word = /^[A-Za-z_][A-Za-z0-9_-]*/.exec(raw.slice(position));
        if (word) { const value = word[0]; const type: TokenType = keywords[value] ?? (types.has(value) ? "TYPE" : value === "true" || value === "false" ? "BOOLEAN" : value === "null" ? "NULL" : "IDENTIFIER"); tokens.push({ type, value, line, column: col }); position += value.length; continue; }
        throw new TamlLexError(line, col, `invalid character '${char}'`);
      }
      tokens.push({ type: "NEWLINE", value: "", line, column: raw.length + 1 });
    }
    while (indents.length > 1) { indents.pop(); tokens.push({ type: "DEDENT", value: "", line: lines.length, column: 1 }); }
    tokens.push({ type: "EOF", value: "", line: lines.length, column: 1 }); return tokens;
  }
}
