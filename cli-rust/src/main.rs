use clap::{Parser, Subcommand, ValueEnum};
use std::{
    fs,
    path::{Path, PathBuf},
    thread,
    time::{Duration, SystemTime},
};
use taml_core::{CompileRequest, OutputFormat, compile};

#[derive(Parser)]
#[command(name = "taml", version, about = "typeYAML native compiler")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}
#[derive(Subcommand)]
enum Command {
    Build {
        file: PathBuf,
        #[arg(short, long)]
        output: Option<PathBuf>,
        #[arg(short, long, value_enum, default_value_t = Format::Yaml)]
        format: Format,
        #[arg(long)]
        stdout: bool,
    },
    Check {
        file: PathBuf,
    },
    Watch {
        file: PathBuf,
        #[arg(short, long)]
        output: Option<PathBuf>,
        #[arg(short, long, value_enum, default_value_t = Format::Yaml)]
        format: Format,
    },
    Import {
        file: PathBuf,
        #[arg(long)]
        out: PathBuf,
    },
    Fmt {
        file: PathBuf,
        #[arg(long)]
        check: bool,
    },
    Lint {
        file: PathBuf,
    },
    Lock {
        #[arg(long)]
        verify: bool,
    },
    Init {
        #[arg(default_value = ".")]
        directory: PathBuf,
    },
    Doctor,
}
#[derive(Clone, ValueEnum)]
enum Format {
    Yaml,
    Json,
}
impl From<Format> for OutputFormat {
    fn from(value: Format) -> Self {
        match value {
            Format::Yaml => Self::Yaml,
            Format::Json => Self::Json,
        }
    }
}
fn compile_file(file: &Path, format: Format) -> Result<Vec<taml_core::ComponentOutput>, String> {
    let source = fs::read_to_string(file).map_err(|error| error.to_string())?;
    let source = taml_core::registry::resolve_imports(
        &source,
        file.parent().unwrap_or_else(|| Path::new(".")),
        false,
    )?;
    let response = compile(CompileRequest {
        source,
        format: format.into(),
        header: true,
    });
    if !response.valid {
        return Err(response
            .diagnostics
            .into_iter()
            .map(|item| {
                format!(
                    "[TAML Error] {}:{}: {}",
                    item.line, item.column, item.message
                )
            })
            .collect::<Vec<_>>()
            .join("\n"));
    }
    Ok(response.components)
}
fn build(file: &Path, output: Option<&Path>, format: Format, stdout: bool) -> Result<(), String> {
    let extension = match format {
        Format::Yaml => "yaml",
        Format::Json => "json",
    };
    let components = compile_file(file, format)?;
    if stdout {
        if components.len() != 1 {
            return Err("--stdout requires exactly one component".into());
        }
        print!("{}", components[0].output);
        return Ok(());
    }
    let output = output.unwrap_or_else(|| file.parent().unwrap_or_else(|| Path::new(".")));
    if output.extension().is_some() {
        if components.len() != 1 {
            return Err("an output file requires exactly one component".into());
        }
        fs::write(output, &components[0].output).map_err(|error| error.to_string())?;
        println!("Built {}", output.display());
        return Ok(());
    }
    fs::create_dir_all(output).map_err(|error| error.to_string())?;
    for component in components {
        let target = output.join(format!("{}.{}", component.name, extension));
        fs::write(&target, component.output).map_err(|error| error.to_string())?;
        fs::write(
            target.with_extension(format!("{extension}.map")),
            serde_json::to_string_pretty(&component.source_map).unwrap_or_default(),
        )
        .map_err(|error| error.to_string())?;
        println!("Built {}", target.display());
    }
    Ok(())
}
fn init(directory: &Path) -> Result<(), String> {
    fs::create_dir_all(directory).map_err(|error| error.to_string())?;
    let source = directory.join("service.taml");
    if source.exists() {
        return Err(format!(
            "{} already exists; refusing to overwrite it",
            source.display()
        ));
    }
    fs::write(&source, "# Welcome to typeYAML\ninterface WebService:\n  host: String(pattern: \"^[a-z0-9.-]+$\")\n  port: Int(min: 1024, max: 65535) = 8080\n\ncomponent \"api\" implements WebService:\n  host: \"api.internal\"\n").map_err(|error| error.to_string())?;
    let config = directory.join(".tamlrc.json");
    if !config.exists() {
        fs::write(
            &config,
            "{\n  \"registry\": {\n    \"requireHttps\": true\n  }\n}\n",
        )
        .map_err(|error| error.to_string())?;
    }
    println!(
        "Created {}\n\nNext steps:\n  taml check {}\n  taml build {} --output generated",
        source.display(),
        source.display(),
        source.display()
    );
    Ok(())
}
fn doctor() -> Result<(), String> {
    let cache = std::env::var("TAML_CACHE_DIR").unwrap_or_else(|_| "~/.taml/cache".into());
    println!(
        "typeYAML native CLI v{}\nRust core: available\nRegistry cache: {}\nLanguage server: run `taml-lsp`\n\nTip: run `taml init` to create a starter project.",
        env!("CARGO_PKG_VERSION"),
        cache
    );
    Ok(())
}
fn scalar(value: &serde_yaml::Value) -> String {
    match value {
        serde_yaml::Value::String(value) => serde_json::to_string(value).unwrap_or_default(),
        serde_yaml::Value::Number(value) => value.to_string(),
        serde_yaml::Value::Bool(value) => value.to_string(),
        serde_yaml::Value::Null => "\"null\"".into(),
        _ => serde_json::to_string(value).unwrap_or_else(|_| "\"{}\"".into()),
    }
}
fn import(file: &Path, out: &Path) -> Result<(), String> {
    let source = fs::read_to_string(file).map_err(|error| error.to_string())?;
    let value: serde_yaml::Value =
        serde_yaml::from_str(&source).map_err(|error| error.to_string())?;
    let serde_yaml::Value::Mapping(mapping) = value else {
        return Err("legacy document root must be a mapping".into());
    };
    let name = file
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("imported");
    let schema = format!(
        "{}Schema",
        name.split(|character: char| !character.is_alphanumeric())
            .filter(|part| !part.is_empty())
            .map(|part| {
                let mut chars = part.chars();
                chars
                    .next()
                    .map(|first| first.to_uppercase().to_string() + chars.as_str())
                    .unwrap_or_default()
            })
            .collect::<String>()
    );
    let mut result = format!(
        "# Generated by taml import — review nested JSON-string fields.\ninterface {schema}:\n"
    );
    let mut fields = Vec::new();
    for (index, (key, value)) in mapping.iter().enumerate() {
        let raw = key.as_str().unwrap_or("field");
        let identifier: String = raw
            .chars()
            .map(|character| {
                if character.is_ascii_alphanumeric() || character == '_' {
                    character
                } else {
                    '_'
                }
            })
            .collect();
        let identifier = if identifier.is_empty() {
            format!("field_{index}")
        } else {
            identifier
        };
        let kind = match value {
            serde_yaml::Value::Number(number) if number.as_i64().is_some() => "Int",
            serde_yaml::Value::Number(_) => "Float",
            serde_yaml::Value::Bool(_) => "Boolean",
            _ => "String",
        };
        result.push_str(&format!("  {identifier}: {kind}\n"));
        fields.push((identifier, scalar(value)));
    }
    result.push_str(&format!("\ncomponent \"{name}\" implements {schema}:\n"));
    for (key, value) in fields {
        result.push_str(&format!("  {key}: {value}\n"));
    }
    fs::write(out, result).map_err(|error| error.to_string())?;
    println!("Imported {} -> {}", file.display(), out.display());
    Ok(())
}
fn run(cli: Cli) -> Result<(), String> {
    match cli.command {
        Command::Build {
            file,
            output,
            format,
            stdout,
        } => build(&file, output.as_deref(), format, stdout),
        Command::Check { file } => {
            let count = compile_file(&file, Format::Yaml)?.len();
            println!("OK: {count} component(s) validated");
            Ok(())
        }
        Command::Watch {
            file,
            output,
            format,
        } => {
            let mut changed = SystemTime::UNIX_EPOCH;
            loop {
                let modified = fs::metadata(&file)
                    .and_then(|metadata| metadata.modified())
                    .map_err(|error| error.to_string())?;
                if modified > changed {
                    changed = modified;
                    if let Err(error) = build(&file, output.as_deref(), format.clone(), false) {
                        eprintln!("{error}");
                    }
                }
                thread::sleep(Duration::from_millis(200));
            }
        }
        Command::Import { file, out } => import(&file, &out),
        Command::Fmt { file, check } => {
            let source = fs::read_to_string(&file).map_err(|error| error.to_string())?;
            let formatted = taml_fmt::format(&source);
            if check {
                if source != formatted {
                    return Err(format!(
                        "{} is not formatted; run taml fmt {}",
                        file.display(),
                        file.display()
                    ));
                }
            } else {
                fs::write(&file, formatted).map_err(|error| error.to_string())?;
            }
            Ok(())
        }
        Command::Lint { file } => {
            let source = fs::read_to_string(&file).map_err(|error| error.to_string())?;
            let diagnostics = taml_fmt::lint(&source);
            for diagnostic in &diagnostics {
                println!(
                    "[{}] {}:{} {}",
                    diagnostic.rule, diagnostic.line, diagnostic.column, diagnostic.message
                );
            }
            if diagnostics
                .iter()
                .any(|diagnostic| diagnostic.severity == "error")
            {
                return Err("lint errors found".into());
            }
            Ok(())
        }
        Command::Lock { verify } => {
            if !verify {
                return Err("use taml lock --verify".into());
            }
            let count = taml_core::registry::verify_lock(Path::new("."))?;
            println!("OK: verified {count} locked schema(s)");
            Ok(())
        }
        Command::Init { directory } => init(&directory),
        Command::Doctor => doctor(),
    }
}
fn main() {
    if let Err(error) = run(Cli::parse()) {
        eprintln!("{error}");
        std::process::exit(1);
    }
}
