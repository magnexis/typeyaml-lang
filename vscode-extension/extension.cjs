const vscode = require("vscode");
const { LanguageClient, TransportKind } = require("vscode-languageclient/node");

let client;

function activate(context) {
  const command = vscode.workspace
    .getConfiguration("typeyaml")
    .get("languageServer.path", "taml-lsp");
  const serverOptions = { command, transport: TransportKind.stdio };
  const clientOptions = {
    documentSelector: [
      { scheme: "file", language: "taml" },
      { scheme: "untitled", language: "taml" }
    ]
  };

  client = new LanguageClient(
    "typeyaml",
    "typeYAML Language Server",
    serverOptions,
    clientOptions
  );
  context.subscriptions.push(client.start());
}

function deactivate() {
  return client ? client.stop() : undefined;
}

module.exports = { activate, deactivate };
