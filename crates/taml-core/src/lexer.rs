use crate::TamlDiagnostic;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TokenKind {
    Interface,
    Component,
    Extends,
    Implements,
    Identifier,
    String,
    Number,
    Boolean,
    Colon,
    Question,
    Equals,
    LParen,
    RParen,
    Pipe,
    Comma,
    Newline,
    Indent,
    Dedent,
    Eof,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Token<'a> {
    pub kind: TokenKind,
    pub text: &'a str,
    pub offset: usize,
    pub line: usize,
    pub column: usize,
}

/// Zero-copy scanner: every token borrows directly from the source buffer.
pub fn lex(source: &str) -> Result<Vec<Token<'_>>, TamlDiagnostic> {
    let mut output = Vec::new();
    let mut indents = vec![0usize];
    let mut offset = 0usize;
    for (line_index, line) in source.lines().enumerate() {
        let line_number = line_index + 1;
        let content = line.split('#').next().unwrap_or("");
        let spaces = content.len() - content.trim_start_matches(' ').len();
        if content.trim().is_empty() {
            offset += line.len() + 1;
            continue;
        }
        if content.as_bytes().get(spaces) == Some(&b'\t') {
            return Err(TamlDiagnostic::at(
                "LEX_ERROR",
                "tabs are not allowed",
                offset + spaces,
                line_number,
                spaces + 1,
            ));
        }
        if spaces > *indents.last().unwrap_or(&0) {
            indents.push(spaces);
            output.push(Token {
                kind: TokenKind::Indent,
                text: "",
                offset,
                line: line_number,
                column: 1,
            });
        }
        while spaces < *indents.last().unwrap_or(&0) {
            indents.pop();
            output.push(Token {
                kind: TokenKind::Dedent,
                text: "",
                offset,
                line: line_number,
                column: 1,
            });
        }
        if spaces != *indents.last().unwrap_or(&0) {
            return Err(TamlDiagnostic::at(
                "LEX_ERROR",
                "inconsistent indentation",
                offset,
                line_number,
                1,
            ));
        }
        let bytes = content.as_bytes();
        let mut cursor = spaces;
        while cursor < bytes.len() {
            if bytes[cursor].is_ascii_whitespace() {
                cursor += 1;
                continue;
            }
            let start = cursor;
            let kind = match bytes[cursor] {
                b':' => {
                    cursor += 1;
                    TokenKind::Colon
                }
                b'?' => {
                    cursor += 1;
                    TokenKind::Question
                }
                b'=' => {
                    cursor += 1;
                    TokenKind::Equals
                }
                b'(' => {
                    cursor += 1;
                    TokenKind::LParen
                }
                b')' => {
                    cursor += 1;
                    TokenKind::RParen
                }
                b'|' => {
                    cursor += 1;
                    TokenKind::Pipe
                }
                b',' => {
                    cursor += 1;
                    TokenKind::Comma
                }
                b'"' | b'\'' => {
                    let quote = bytes[cursor];
                    cursor += 1;
                    while cursor < bytes.len() && bytes[cursor] != quote {
                        if bytes[cursor] == b'\\' && quote == b'"' {
                            cursor += 1;
                        }
                        cursor += 1;
                    }
                    if cursor == bytes.len() {
                        return Err(TamlDiagnostic::at(
                            "LEX_ERROR",
                            "unterminated string",
                            offset + start,
                            line_number,
                            start + 1,
                        ));
                    }
                    cursor += 1;
                    TokenKind::String
                }
                b'-' | b'0'..=b'9' => {
                    cursor += 1;
                    while cursor < bytes.len()
                        && (bytes[cursor].is_ascii_digit() || bytes[cursor] == b'.')
                    {
                        cursor += 1;
                    }
                    TokenKind::Number
                }
                b'A'..=b'Z' | b'a'..=b'z' | b'_' => {
                    cursor += 1;
                    while cursor < bytes.len()
                        && (bytes[cursor].is_ascii_alphanumeric()
                            || matches!(bytes[cursor], b'_' | b'-'))
                    {
                        cursor += 1;
                    }
                    match &content[start..cursor] {
                        "interface" => TokenKind::Interface,
                        "component" => TokenKind::Component,
                        "extends" => TokenKind::Extends,
                        "implements" => TokenKind::Implements,
                        "true" | "false" => TokenKind::Boolean,
                        _ => TokenKind::Identifier,
                    }
                }
                _ => {
                    return Err(TamlDiagnostic::at(
                        "LEX_ERROR",
                        "invalid character",
                        offset + cursor,
                        line_number,
                        cursor + 1,
                    ));
                }
            };
            output.push(Token {
                kind,
                text: &content[start..cursor],
                offset: offset + start,
                line: line_number,
                column: start + 1,
            });
        }
        output.push(Token {
            kind: TokenKind::Newline,
            text: "",
            offset: offset + line.len(),
            line: line_number,
            column: line.len() + 1,
        });
        offset += line.len() + 1;
    }
    while indents.len() > 1 {
        indents.pop();
        output.push(Token {
            kind: TokenKind::Dedent,
            text: "",
            offset,
            line: source.lines().count() + 1,
            column: 1,
        });
    }
    output.push(Token {
        kind: TokenKind::Eof,
        text: "",
        offset: source.len(),
        line: source.lines().count() + 1,
        column: 1,
    });
    Ok(output)
}
