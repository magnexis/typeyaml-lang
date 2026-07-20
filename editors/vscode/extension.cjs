const vscode = require("vscode");
const { LanguageClient, TransportKind } = require("vscode-languageclient/node");

let client;
function activate(context) {
  const command = vscode.workspace.getConfiguration("typeyaml").get("languageServer.path", "taml-lsp");
  const options = { command, transport: TransportKind.stdio };
  client = new LanguageClient("typeyaml", "typeYAML Language Server", options, { documentSelector: [{ scheme: "file", language: "taml"], { scheme: "untitled", language: "taml"], });
  context.subscriptions.push(client.start());
}
function deactivate() { return client ? client.stop() : undefined; }
module.exports = { activate, deactivate };
