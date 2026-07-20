use std::{
    io::{BufRead, BufReader, Write},
    process::{Command, Stdio},
};

fn send(writer: &mut impl Write, message: &str) {
    write!(
        writer,
        "Content-Length: {}\r\n\r\n{}",
        message.len(),
        message
    )
    .unwrap();
    writer.flush().unwrap();
}
fn receive(reader: &mut impl BufRead) -> String {
    let mut length = 0usize;
    loop {
        let mut line = String::new();
        reader.read_line(&mut line).unwrap();
        if line == "\r\n" {
            break;
        }
        if let Some(value) = line.strip_prefix("Content-Length: ") {
            length = value.trim().parse().unwrap();
        }
    }
    let mut body = vec![0u8; length];
    reader.read_exact(&mut body).unwrap();
    String::from_utf8(body).unwrap()
}

#[test]
fn initializes_over_json_rpc_stdio() {
    let binary = env!("CARGO_BIN_EXE_taml-lsp");
    let mut process = Command::new(binary)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    let mut input = process.stdin.take().unwrap();
    let output = process.stdout.take().unwrap();
    let mut reader = BufReader::new(output);
    send(
        &mut input,
        r#"{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"capabilities":{}}}"#,
    );
    let response: serde_json::Value = serde_json::from_str(&receive(&mut reader)).unwrap();
    assert_eq!(response["id"], 1);
    assert_eq!(response["result"]["serverInfo"]["name"], "taml-lsp");
    assert!(response["result"]["capabilities"]["semanticTokensProvider"].is_object());
    send(
        &mut input,
        r#"{"jsonrpc":"2.0","id":2,"method":"shutdown","params":null}"#,
    );
    let _: serde_json::Value = serde_json::from_str(&receive(&mut reader)).unwrap();
    let _ = process.kill();
}
