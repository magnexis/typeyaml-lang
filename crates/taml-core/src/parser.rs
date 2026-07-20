use crate::{TamlDiagnostic, TamlValue, lexer::lex};
use std::collections::BTreeMap;

#[derive(Debug, Clone)]
pub struct Constraint {
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub pattern: Option<String>,
}
#[derive(Debug, Clone)]
pub struct Field {
    pub value_type: String,
    pub optional: bool,
    pub default: Option<TamlValue>,
    pub enum_values: Vec<String>,
    pub constraint: Constraint,
    pub line: usize,
    pub column: usize,
}
#[derive(Debug, Clone)]
pub struct Interface {
    pub fields: BTreeMap<String, Field>,
}
#[derive(Debug, Clone)]
pub struct Component {
    pub name: String,
    pub parent: Option<String>,
    pub interface: Option<String>,
    pub values: BTreeMap<String, (TamlValue, usize, usize)>,
}
#[derive(Debug, Clone, Default)]
pub struct Program {
    pub interfaces: BTreeMap<String, Interface>,
    pub components: Vec<Component>,
}
fn scalar(raw: &str) -> TamlValue {
    let text = raw.trim();
    if text == "true" {
        TamlValue::Boolean(true)
    } else if text == "false" {
        TamlValue::Boolean(false)
    } else if let Ok(value) = text.parse::<i64>() {
        TamlValue::Int(value)
    } else if let Ok(value) = text.parse::<f64>() {
        TamlValue::Float(value)
    } else {
        TamlValue::String(text.trim_matches(['"', '\'']).replace("\\\"", "\""))
    }
}
fn split_field(raw: &str, line: usize, column: usize) -> Result<(String, Field), TamlDiagnostic> {
    let (left, right) = raw
        .trim()
        .split_once(':')
        .ok_or_else(|| TamlDiagnostic::at("PARSE_ERROR", "expected ':'", 0, line, column))?;
    let optional = left.trim_end().ends_with('?');
    let key = left.trim().trim_end_matches('?').to_owned();
    let (spec, default) = right
        .split_once('=')
        .map_or((right.trim(), None), |(type_text, value)| {
            (type_text.trim(), Some(scalar(value)))
        });
    let enum_values: Vec<String> = spec
        .split('|')
        .filter_map(|entry| {
            let entry = entry.trim();
            (entry.starts_with('"') && entry.ends_with('"'))
                .then(|| entry.trim_matches('"').to_owned())
        })
        .collect();
    let value_type = if enum_values.is_empty() {
        spec.split(['(', ' ']).next().unwrap_or("String").to_owned()
    } else {
        "Enum".into()
    };
    let inside = spec
        .split_once('(')
        .and_then(|(_, rest)| rest.strip_suffix(')'))
        .unwrap_or("");
    let constraint = Constraint {
        min: inside.split(',').find_map(|item| {
            item.trim()
                .strip_prefix("min:")
                .and_then(|number| number.trim().parse().ok())
        }),
        max: inside.split(',').find_map(|item| {
            item.trim()
                .strip_prefix("max:")
                .and_then(|number| number.trim().parse().ok())
        }),
        pattern: inside.split(',').find_map(|item| {
            item.trim()
                .strip_prefix("pattern:")
                .map(|value| value.trim().trim_matches(['"', '\'']).to_owned())
        }),
    };
    Ok((
        key,
        Field {
            value_type,
            optional,
            default,
            enum_values,
            constraint,
            line,
            column,
        },
    ))
}
pub fn parse(source: &str) -> Result<Program, TamlDiagnostic> {
    let _ = lex(source)?;
    let lines: Vec<&str> = source.lines().collect();
    let mut index = 0;
    let mut program = Program::default();
    while index < lines.len() {
        let raw = lines[index].split('#').next().unwrap_or("");
        let text = raw.trim();
        if text.is_empty() {
            index += 1;
            continue;
        }
        if let Some(name) = text
            .strip_prefix("interface ")
            .and_then(|value| value.strip_suffix(':'))
        {
            let mut fields = BTreeMap::new();
            index += 1;
            while index < lines.len()
                && (lines[index].trim().is_empty() || lines[index].starts_with(' '))
            {
                if !lines[index].trim().is_empty() {
                    let column = lines[index].len() - lines[index].trim_start().len() + 1;
                    let (key, field) = split_field(lines[index], index + 1, column)?;
                    fields.insert(key, field);
                }
                index += 1;
            }
            program
                .interfaces
                .insert(name.trim().into(), Interface { fields });
            continue;
        }
        if let Some(rest) = text.strip_prefix("component ") {
            let (name, tail) = if let Some(value) = rest
                .strip_prefix('"')
                .and_then(|value| value.split_once('"'))
            {
                (value.0.to_owned(), value.1.trim())
            } else {
                let mut values = rest.splitn(2, char::is_whitespace);
                (
                    values.next().unwrap_or_default().into(),
                    values.next().unwrap_or_default().trim(),
                )
            };
            let parent = tail
                .split_once("extends ")
                .and_then(|(_, value)| value.split_whitespace().next())
                .map(str::to_owned);
            let interface = tail
                .split_once("implements ")
                .and_then(|(_, value)| value.strip_suffix(':'))
                .map(|value| value.trim().to_owned());
            let mut values = BTreeMap::new();
            index += 1;
            while index < lines.len()
                && (lines[index].trim().is_empty() || lines[index].starts_with(' '))
            {
                if let Some((key, value)) = lines[index].trim().split_once(':') {
                    values.insert(
                        key.trim().into(),
                        (
                            scalar(value),
                            index + 1,
                            lines[index].len() - lines[index].trim_start().len() + 1,
                        ),
                    );
                }
                index += 1;
            }
            program.components.push(Component {
                name: name.trim_end_matches(':').to_owned(),
                parent,
                interface,
                values,
            });
            continue;
        }
        return Err(TamlDiagnostic::at(
            "PARSE_ERROR",
            "expected interface or component",
            0,
            index + 1,
            1,
        ));
    }
    Ok(program)
}
