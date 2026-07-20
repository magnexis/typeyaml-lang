use serde::Serialize;
use std::collections::HashSet;
use taml_core::parser::parse;

#[derive(Debug, Clone, Serialize)]
pub struct LintDiagnostic {
    pub rule: &'static str,
    pub message: String,
    pub line: usize,
    pub column: usize,
    pub severity: &'static str,
}
/// Canonical two-space formatter. Imports remain first, interfaces sort alphabetically, then components.
pub fn format(source: &str) -> String {
    let mut output = Vec::new();
    for raw in source.lines() {
        let trimmed = raw.trim();
        if trimmed.is_empty() {
            if output.last().is_some_and(|line: &String| !line.is_empty()) {
                output.push(String::new());
            }
            continue;
        }
        let indent = if raw.starts_with(' ') { "  " } else { "" };
        let normalized = if let Some((left, right)) = trimmed.split_once(':') {
            if right.trim().is_empty() {
                format!("{}:", left.trim())
            } else {
                let value = right.trim_start().replace(",", ", ").replace(",  ", ", ");
                format!("{}: {}", left.trim(), value)
            }
        } else {
            trimmed.to_owned()
        };
        output.push(format!("{indent}{normalized}"));
    }
    while output.last().is_some_and(String::is_empty) {
        output.pop();
    }
    let mut imports = Vec::new();
    let mut interfaces: Vec<(String, Vec<String>)> = Vec::new();
    let mut remaining = Vec::new();
    let mut index = 0;
    while index < output.len() {
        let line = &output[index];
        if line.starts_with("interface ") {
            let name = line
                .trim_start_matches("interface ")
                .trim_end_matches(':')
                .to_owned();
            let mut block = vec![line.clone()];
            index += 1;
            while index < output.len()
                && (output[index].starts_with("  ") || output[index].is_empty())
            {
                block.push(output[index].clone());
                index += 1;
            }
            interfaces.push((name, block));
            continue;
        }
        if line.starts_with("import ") {
            imports.push(line.clone());
        } else {
            remaining.push(line.clone());
        }
        index += 1;
    }
    interfaces.sort_by(|left, right| left.0.cmp(&right.0));
    let mut ordered = imports;
    for (_, block) in interfaces {
        if !ordered.is_empty() && ordered.last().is_some_and(|line| !line.is_empty()) {
            ordered.push(String::new());
        }
        ordered.extend(block);
    }
    if !remaining.is_empty()
        && !ordered.is_empty()
        && ordered.last().is_some_and(|line| !line.is_empty())
    {
        ordered.push(String::new());
    }
    ordered.extend(remaining);
    while ordered.last().is_some_and(String::is_empty) {
        ordered.pop();
    }
    ordered.join("\n") + "\n"
}
pub fn lint(source: &str) -> Vec<LintDiagnostic> {
    let Ok(program) = parse(source) else {
        return Vec::new();
    };
    let mut diagnostics = Vec::new();
    let used: HashSet<&str> = program
        .components
        .iter()
        .filter_map(|component| component.interface.as_deref())
        .collect();
    for (name, interface) in &program.interfaces {
        if !used.contains(name.as_str()) {
            diagnostics.push(LintDiagnostic {
                rule: "no-unused-interfaces",
                message: format!("interface '{name}' is never implemented"),
                line: interface
                    .fields
                    .values()
                    .next()
                    .map(|field| field.line.saturating_sub(1))
                    .unwrap_or(1),
                column: 1,
                severity: "warning",
            });
        }
        for (key, field) in &interface.fields {
            if field.value_type == "String"
                && field.constraint.min.is_none()
                && field.constraint.max.is_none()
                && field.constraint.pattern.is_none()
            {
                diagnostics.push(LintDiagnostic {
                    rule: "require-string-constraints",
                    message: format!("string field '{key}' has no length constraint"),
                    line: field.line,
                    column: field.column,
                    severity: "warning",
                });
            }
        }
    }
    for component in &program.components {
        if let Some(interface_name) = &component.interface {
            if let Some(interface) = program.interfaces.get(interface_name) {
                for (key, (value, line, column)) in &component.values {
                    if interface
                        .fields
                        .get(key)
                        .and_then(|field| field.default.as_ref())
                        .is_some_and(|default| default == value)
                    {
                        diagnostics.push(LintDiagnostic {
                            rule: "no-redundant-defaults",
                            message: format!("'{key}' repeats its interface default"),
                            line: *line,
                            column: *column,
                            severity: "warning",
                        });
                    }
                }
            }
        }
    }
    diagnostics
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn normalizes_spacing() {
        assert_eq!(
            format("interface A:\n x :String\n"),
            "interface A:\n  x: String\n"
        );
    }
    #[test]
    fn sorts_interfaces_and_constraint_commas() {
        assert_eq!(
            format("interface Z:\n  port: Int(min: 1,max: 2)\n\ninterface A:\n  id: Int\n"),
            "interface A:\n  id: Int\n\ninterface Z:\n  port: Int(min: 1, max: 2)\n"
        );
    }
}
