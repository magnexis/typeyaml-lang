use crate::{
    TamlDiagnostic, TamlValue,
    parser::{Component, Field, Program},
};
use regex::Regex;
use std::collections::{BTreeMap, HashMap, HashSet};
fn valid(field: &Field, value: &TamlValue) -> bool {
    match field.value_type.as_str() {
        "String" => matches!(value, TamlValue::String(_)),
        "Int" => matches!(value, TamlValue::Int(_)),
        "Float" => matches!(value, TamlValue::Int(_) | TamlValue::Float(_)),
        "Boolean" => matches!(value, TamlValue::Boolean(_)),
        "Enum" => matches!(value, TamlValue::String(value) if field.enum_values.contains(value)),
        _ => false,
    }
}
fn number(value: &TamlValue) -> Option<f64> {
    match value {
        TamlValue::Int(value) => Some(*value as f64),
        TamlValue::Float(value) => Some(*value),
        _ => None,
    }
}
pub fn check(program: &Program) -> (Vec<Component>, Vec<TamlDiagnostic>) {
    let mut diagnostics = Vec::new();
    let named: HashMap<&str, &Component> = program
        .components
        .iter()
        .map(|component| (component.name.as_str(), component))
        .collect();
    let mut expanded = Vec::new();
    for component in &program.components {
        let mut values = BTreeMap::new();
        let mut visited = HashSet::new();
        let mut cursor = component.parent.as_deref();
        while let Some(parent_name) = cursor {
            if !visited.insert(parent_name) {
                diagnostics.push(TamlDiagnostic::at(
                    "CYCLIC_INHERITANCE",
                    "cyclic component inheritance",
                    0,
                    1,
                    1,
                ));
                break;
            }
            let Some(parent) = named.get(parent_name) else {
                diagnostics.push(TamlDiagnostic::at(
                    "UNKNOWN_PARENT",
                    format!("unknown parent '{parent_name}'"),
                    0,
                    1,
                    1,
                ));
                break;
            };
            for (key, value) in &parent.values {
                values.entry(key.clone()).or_insert_with(|| value.clone());
            }
            cursor = parent.parent.as_deref();
        }
        values.extend(component.values.clone());
        let mut checked = component.clone();
        checked.values = values;
        if let Some(interface_name) = &checked.interface {
            let Some(interface) = program.interfaces.get(interface_name) else {
                diagnostics.push(TamlDiagnostic::at(
                    "UNKNOWN_INTERFACE",
                    format!("unknown interface '{interface_name}'"),
                    0,
                    1,
                    1,
                ));
                expanded.push(checked);
                continue;
            };
            for (key, field) in &interface.fields {
                if !checked.values.contains_key(key) {
                    if let Some(default) = &field.default {
                        checked
                            .values
                            .insert(key.clone(), (default.clone(), field.line, field.column));
                    } else if !field.optional {
                        diagnostics.push(TamlDiagnostic::at(
                            "MISSING_PROPERTY",
                            format!(
                                "component '{}' is missing required property '{key}'",
                                checked.name
                            ),
                            0,
                            field.line,
                            field.column,
                        ));
                    }
                }
            }
            for (key, (value, line, column)) in &checked.values {
                if let Some(field) = interface.fields.get(key) {
                    if !valid(field, value) {
                        diagnostics.push(TamlDiagnostic::at(
                            "TYPE_ERROR",
                            format!("property '{key}' does not satisfy {}", field.value_type),
                            0,
                            *line,
                            *column,
                        ));
                    }
                    if let Some(number) = number(value) {
                        if field.constraint.min.is_some_and(|min| number < min) {
                            diagnostics.push(TamlDiagnostic::at(
                                "MIN_CONSTRAINT",
                                format!("property '{key}' is below min"),
                                0,
                                *line,
                                *column,
                            ));
                        }
                        if field.constraint.max.is_some_and(|max| number > max) {
                            diagnostics.push(TamlDiagnostic::at(
                                "MAX_CONSTRAINT",
                                format!("property '{key}' exceeds max"),
                                0,
                                *line,
                                *column,
                            ));
                        }
                    }
                    if let (Some(pattern), TamlValue::String(text)) =
                        (&field.constraint.pattern, value)
                    {
                        match Regex::new(pattern) {
                            Ok(expression) if !expression.is_match(text) => {
                                diagnostics.push(TamlDiagnostic::at(
                                    "PATTERN_CONSTRAINT",
                                    format!("property '{key}' does not match pattern '{pattern}'"),
                                    0,
                                    *line,
                                    *column,
                                ))
                            }
                            Err(_) => diagnostics.push(TamlDiagnostic::at(
                                "INVALID_PATTERN",
                                format!("property '{key}' declares an invalid pattern '{pattern}'"),
                                0,
                                field.line,
                                field.column,
                            )),
                            _ => {}
                        }
                    }
                }
            }
        }
        expanded.push(checked);
    }
    (expanded, diagnostics)
}
