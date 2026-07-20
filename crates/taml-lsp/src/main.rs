use dashmap::DashMap;
use std::{collections::HashMap, sync::Arc};
use taml_core::{
    CompileRequest, OutputFormat, compile,
    lexer::{TokenKind, lex},
    parser::parse,
};
use tokio::sync::Mutex;
use tokio::time::{Duration, sleep};
use tower_lsp::{Client, LanguageServer, LspService, Server, jsonrpc::Result, lsp_types::*};

struct Backend {
    client: Client,
    documents: Arc<DashMap<Url, String>>,
    _debounce: Arc<Mutex<()>>,
}
impl Backend {
    fn new(client: Client) -> Self {
        Self {
            client,
            documents: Arc::new(DashMap::new()),
            _debounce: Arc::new(Mutex::new(())),
        }
    }
    async fn diagnose(&self, uri: Url, source: String) {
        sleep(Duration::from_millis(75)).await;
        if self
            .documents
            .get(&uri)
            .is_none_or(|current| current.as_str() != source)
        {
            return;
        }
        let _guard = self._debounce.lock().await;
        let result = compile(CompileRequest {
            source,
            format: OutputFormat::Yaml,
            header: false,
        });
        let diagnostics = result
            .diagnostics
            .into_iter()
            .map(|item| Diagnostic {
                range: Range::new(
                    Position::new(
                        item.line.saturating_sub(1) as u32,
                        item.column.saturating_sub(1) as u32,
                    ),
                    Position::new(item.line.saturating_sub(1) as u32, item.column as u32),
                ),
                severity: Some(DiagnosticSeverity::ERROR),
                code: Some(NumberOrString::String(item.code)),
                code_description: None,
                source: Some("taml".into()),
                message: item.message,
                related_information: None,
                tags: None,
                data: None,
            })
            .collect();
        self.client
            .publish_diagnostics(uri, diagnostics, None)
            .await;
    }
    fn word_at(source: &str, position: Position) -> String {
        let line = source.lines().nth(position.line as usize).unwrap_or("");
        let bytes = line.as_bytes();
        let mut start = position.character as usize;
        while start > 0
            && (bytes[start.saturating_sub(1)].is_ascii_alphanumeric()
                || bytes[start.saturating_sub(1)] == b'_')
        {
            start -= 1;
        }
        let mut end = position.character as usize;
        while end < bytes.len() && (bytes[end].is_ascii_alphanumeric() || bytes[end] == b'_') {
            end += 1;
        }
        line.get(start..end).unwrap_or("").into()
    }
}
#[tower_lsp::async_trait]
impl LanguageServer for Backend {
    async fn initialize(&self, _: InitializeParams) -> Result<InitializeResult> {
        Ok(InitializeResult {
            capabilities: ServerCapabilities {
                text_document_sync: Some(TextDocumentSyncCapability::Kind(
                    TextDocumentSyncKind::FULL,
                )),
                completion_provider: Some(CompletionOptions {
                    trigger_characters: Some(vec![":".into(), "\"".into()]),
                    ..Default::default()
                }),
                hover_provider: Some(HoverProviderCapability::Simple(true)),
                definition_provider: Some(OneOf::Left(true)),
                rename_provider: Some(OneOf::Left(true)),
                semantic_tokens_provider: Some(
                    SemanticTokensServerCapabilities::SemanticTokensOptions(
                        SemanticTokensOptions {
                            legend: SemanticTokensLegend {
                                token_types: vec![
                                    SemanticTokenType::KEYWORD,
                                    SemanticTokenType::TYPE,
                                    SemanticTokenType::PROPERTY,
                                    SemanticTokenType::STRING,
                                    SemanticTokenType::NUMBER,
                                ],
                                token_modifiers: vec![],
                            },
                            range: None,
                            full: Some(SemanticTokensFullOptions::Bool(true)),
                            work_done_progress_options: Default::default(),
                        },
                    ),
                ),
                ..Default::default()
            },
            server_info: Some(ServerInfo {
                name: "taml-lsp".into(),
                version: Some(env!("CARGO_PKG_VERSION").into()),
            }),
        })
    }
    async fn initialized(&self, _: InitializedParams) {
        self.client
            .log_message(MessageType::INFO, "typeYAML language server ready")
            .await;
    }
    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }
    async fn did_open(&self, params: DidOpenTextDocumentParams) {
        let item = params.text_document;
        self.documents.insert(item.uri.clone(), item.text.clone());
        self.diagnose(item.uri, item.text).await;
    }
    async fn did_change(&self, params: DidChangeTextDocumentParams) {
        if let Some(change) = params.content_changes.into_iter().last() {
            self.documents
                .insert(params.text_document.uri.clone(), change.text.clone());
            self.diagnose(params.text_document.uri, change.text).await;
        }
    }
    async fn completion(&self, params: CompletionParams) -> Result<Option<CompletionResponse>> {
        let uri = params.text_document_position.text_document.uri;
        let source = self
            .documents
            .get(&uri)
            .map(|entry| entry.clone())
            .unwrap_or_default();
        let position = params.text_document_position.position;
        let before = source.lines().nth(position.line as usize).unwrap_or("");
        let mut items = vec![
            CompletionItem::new_simple("min:".into(), "Minimum numeric constraint".into()),
            CompletionItem::new_simple("max:".into(), "Maximum numeric constraint".into()),
            CompletionItem::new_simple("pattern:".into(), "Regular-expression constraint".into()),
        ];
        if let Ok(program) = parse(&source) {
            let preceding: Vec<&str> = source.lines().take(position.line as usize + 1).collect();
            if let Some(interface_name) = preceding.iter().rev().find_map(|line| {
                line.split_once("implements ")
                    .and_then(|(_, name)| name.trim().strip_suffix(':').or(Some(name.trim())))
            }) {
                if let Some(interface) = program.interfaces.get(interface_name) {
                    for (key, field) in &interface.fields {
                        let mut item = CompletionItem::new_simple(
                            format!("{key}: "),
                            format!("{} property", field.value_type),
                        );
                        item.detail = Some(if field.enum_values.is_empty() {
                            field.value_type.clone()
                        } else {
                            field.enum_values.join(" | ")
                        });
                        items.push(item);
                        if before.contains('"') {
                            for value in &field.enum_values {
                                items.push(CompletionItem::new_simple(
                                    format!("\"{value}\""),
                                    "Enum member".into(),
                                ));
                            }
                        }
                    }
                }
            }
        }
        Ok(Some(CompletionResponse::Array(items)))
    }
    async fn hover(&self, params: HoverParams) -> Result<Option<Hover>> {
        let uri = params.text_document_position_params.text_document.uri;
        let source = self
            .documents
            .get(&uri)
            .map(|entry| entry.clone())
            .unwrap_or_default();
        let word = Self::word_at(&source, params.text_document_position_params.position);
        let program = parse(&source).ok();
        let field = program.as_ref().and_then(|program| {
            program
                .interfaces
                .values()
                .find_map(|interface| interface.fields.get(&word))
        });
        Ok(field.map(|field| Hover {
            contents: HoverContents::Markup(MarkupContent {
                kind: MarkupKind::Markdown,
                value: format!(
                    "`{word}: {}`\n\nmin: `{:?}`, max: `{:?}`\n\ndefault: `{:?}`",
                    field.value_type, field.constraint.min, field.constraint.max, field.default
                ),
            }),
            range: None,
        }))
    }
    async fn goto_definition(
        &self,
        params: GotoDefinitionParams,
    ) -> Result<Option<GotoDefinitionResponse>> {
        let uri = params.text_document_position_params.text_document.uri;
        let source = self
            .documents
            .get(&uri)
            .map(|entry| entry.clone())
            .unwrap_or_default();
        let word = Self::word_at(&source, params.text_document_position_params.position);
        for (index, line) in source.lines().enumerate() {
            if line.trim_start().starts_with(&format!("interface {word}:"))
                || line.trim_start().starts_with(&format!("component {word}:"))
            {
                return Ok(Some(GotoDefinitionResponse::Scalar(Location::new(
                    uri,
                    Range::new(
                        Position::new(index as u32, 0),
                        Position::new(index as u32, line.len() as u32),
                    ),
                ))));
            }
        }
        Ok(None)
    }
    async fn semantic_tokens_full(
        &self,
        params: SemanticTokensParams,
    ) -> Result<Option<SemanticTokensResult>> {
        let source = self
            .documents
            .get(&params.text_document.uri)
            .map(|entry| entry.clone())
            .unwrap_or_default();
        let Ok(tokens) = lex(&source) else {
            return Ok(None);
        };
        let mut data = Vec::new();
        let mut previous_line = 0u32;
        let mut previous_start = 0u32;
        for token in tokens {
            let token_type = match token.kind {
                TokenKind::Interface
                | TokenKind::Component
                | TokenKind::Extends
                | TokenKind::Implements => Some(0),
                TokenKind::String => Some(3),
                TokenKind::Number => Some(4),
                TokenKind::Identifier => Some(2),
                _ => None,
            };
            let Some(token_type) = token_type else {
                continue;
            };
            let line = token.line.saturating_sub(1) as u32;
            let start = token.column.saturating_sub(1) as u32;
            let delta_start = if line == previous_line {
                start.saturating_sub(previous_start)
            } else {
                start
            };
            data.push(SemanticToken {
                delta_line: line.saturating_sub(previous_line),
                delta_start,
                length: token.text.chars().count() as u32,
                token_type,
                token_modifiers_bitset: 0,
            });
            previous_line = line;
            previous_start = start;
        }
        Ok(Some(SemanticTokensResult::Tokens(SemanticTokens {
            result_id: None,
            data,
        })))
    }
    async fn rename(&self, params: RenameParams) -> Result<Option<WorkspaceEdit>> {
        let uri = params.text_document_position.text_document.uri;
        let source = self
            .documents
            .get(&uri)
            .map(|entry| entry.clone())
            .unwrap_or_default();
        let previous = Self::word_at(&source, params.text_document_position.position);
        if previous.is_empty()
            || !params
                .new_name
                .chars()
                .enumerate()
                .all(|(index, character)| {
                    character == '_'
                        || character.is_ascii_alphanumeric()
                            && (index > 0 || character.is_ascii_alphabetic() || character == '_')
                })
        {
            return Ok(None);
        }
        let defined = source.lines().any(|line| {
            line.trim_start()
                .starts_with(&format!("interface {previous}:"))
                || line
                    .trim_start()
                    .starts_with(&format!("component {previous}:"))
        });
        if !defined {
            return Ok(None);
        }
        let Ok(tokens) = lex(&source) else {
            return Ok(None);
        };
        let edits = tokens
            .into_iter()
            .filter(|token| token.kind == TokenKind::Identifier && token.text == previous)
            .map(|token| TextEdit {
                range: Range::new(
                    Position::new(
                        token.line.saturating_sub(1) as u32,
                        token.column.saturating_sub(1) as u32,
                    ),
                    Position::new(
                        token.line.saturating_sub(1) as u32,
                        token.column.saturating_sub(1) as u32 + token.text.chars().count() as u32,
                    ),
                ),
                new_text: params.new_name.clone(),
            })
            .collect::<Vec<_>>();
        let mut changes = HashMap::new();
        changes.insert(uri, edits);
        Ok(Some(WorkspaceEdit {
            changes: Some(changes),
            document_changes: None,
            change_annotations: None,
        }))
    }
}
#[tokio::main]
async fn main() {
    let stdin = tokio::io::stdin();
    let stdout = tokio::io::stdout();
    let (service, socket) = LspService::new(Backend::new);
    Server::new(stdin, stdout, socket).serve(service).await;
}
