use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::BTreeMap,
    env, fs,
    path::{Path, PathBuf},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockEntry {
    pub resolved: String,
    pub integrity: String,
}
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Lockfile {
    pub version: u8,
    #[serde(default)]
    pub schemas: BTreeMap<String, LockEntry>,
}
fn digest(content: &str) -> String {
    format!("sha256-{:x}", Sha256::digest(content.as_bytes()))
}
fn cache_root() -> PathBuf {
    env::var_os("TAML_CACHE_DIR")
        .map(PathBuf::from)
        .or_else(|| {
            env::var_os("USERPROFILE").map(|home| PathBuf::from(home).join(".taml").join("cache"))
        })
        .or_else(|| env::var_os("HOME").map(|home| PathBuf::from(home).join(".taml").join("cache")))
        .unwrap_or_else(|| PathBuf::from(".taml/cache"))
}
fn endpoint(specifier: &str) -> Result<String, String> {
    if specifier.starts_with("https://") {
        return Ok(specifier.into());
    }
    if let Some(path) = specifier.strip_prefix("github:") {
        let values: Vec<&str> = path.split('/').collect();
        if values.len() < 3 {
            return Err(format!("invalid GitHub schema '{specifier}'"));
        }
        let Some((repository, revision)) = values[1].split_once('@') else {
            return Err(format!(
                "GitHub schema '{specifier}' must pin a tag or commit with owner/repo@revision/path"
            ));
        };
        if revision.is_empty() || revision.eq_ignore_ascii_case("head") {
            return Err(format!(
                "GitHub schema '{specifier}' uses a mutable revision"
            ));
        }
        let schema = values[2..].join("/");
        return Ok(format!(
            "https://raw.githubusercontent.com/{}/{}/{}/{}",
            values[0],
            repository,
            revision,
            if schema.ends_with(".taml") {
                schema
            } else {
                format!("{schema}.taml")
            }
        ));
    }
    Err(format!("unsupported registry specifier '{specifier}'"))
}
fn enforce_host_policy(endpoint: &str) -> Result<(), String> {
    if let Some(allowed) = env::var_os("TAML_ALLOWED_HOSTS") {
        let host = endpoint
            .strip_prefix("https://")
            .and_then(|value| value.split('/').next())
            .unwrap_or("");
        if !allowed
            .to_string_lossy()
            .split(',')
            .map(str::trim)
            .any(|entry| entry == host)
        {
            return Err(format!(
                "schema host '{host}' is not allowed by TAML_ALLOWED_HOSTS"
            ));
        }
    }
    Ok(())
}
fn standard_library(name: &str) -> Option<&'static str> {
    match name {
        "std/k8s" => Some(include_str!("../../../src/stdlib/k8s.taml")),
        "std/github-actions" => Some(include_str!("../../../src/stdlib/github-actions.taml")),
        "std/docker-compose" => Some(include_str!("../../../src/stdlib/docker-compose.taml")),
        _ => None,
    }
}
fn fetch(specifier: &str, project: &Path, offline: bool) -> Result<String, String> {
    if let Some(source) = standard_library(specifier) {
        return Ok(source.into());
    }
    let lock_path = project.join("taml.lock");
    let mut lock: Lockfile = fs::read_to_string(&lock_path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or(Lockfile {
            version: 1,
            schemas: BTreeMap::new(),
        });
    let cache = cache_root();
    if let Some(entry) = lock.schemas.get(specifier) {
        let target = cache.join(entry.integrity.replace([':', '-'], ""));
        if let Ok(content) = fs::read_to_string(target) {
            if digest(&content) == entry.integrity {
                return Ok(content);
            }
        }
    }
    if offline {
        return Err(format!("schema '{specifier}' is unavailable offline"));
    }
    let resolved = endpoint(specifier)?;
    enforce_host_policy(&resolved)?;
    let mut response = ureq::get(&resolved)
        .call()
        .map_err(|error| format!("fetch '{specifier}': {error}"))?;
    let content = response
        .body_mut()
        .read_to_string()
        .map_err(|error| format!("read '{specifier}': {error}"))?;
    let integrity = digest(&content);
    fs::create_dir_all(&cache).map_err(|error| error.to_string())?;
    fs::write(cache.join(integrity.replace([':', '-'], "")), &content)
        .map_err(|error| error.to_string())?;
    lock.schemas.insert(
        specifier.into(),
        LockEntry {
            resolved,
            integrity,
        },
    );
    fs::write(
        lock_path,
        serde_json::to_string_pretty(&lock).unwrap_or_default() + "\n",
    )
    .map_err(|error| error.to_string())?;
    Ok(content)
}
/// Replaces top-level import statements with lockfile-pinned schema source before parsing.
pub fn resolve_imports(source: &str, project: &Path, offline: bool) -> Result<String, String> {
    let mut output = String::new();
    for line in source.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("import ") {
            let Some((_, quoted)) = trimmed.split_once(" from ") else {
                return Err("invalid import syntax".into());
            };
            let specifier = quoted.trim().trim_matches('"');
            output.push_str(&fetch(specifier, project, offline)?);
            if !output.ends_with('\n') {
                output.push('\n');
            }
        } else {
            output.push_str(line);
            output.push('\n');
        }
    }
    Ok(output)
}

/// Validates that every `taml.lock` entry is present in the cache and matches its pinned digest.
pub fn verify_lock(project: &Path) -> Result<usize, String> {
    let lock_path = project.join("taml.lock");
    let lock: Lockfile = serde_json::from_str(
        &fs::read_to_string(&lock_path)
            .map_err(|_| format!("no taml.lock found at {}", lock_path.display()))?,
    )
    .map_err(|error| format!("invalid taml.lock: {error}"))?;
    let cache = cache_root();
    let mut verified = 0;
    for (specifier, entry) in lock.schemas {
        let target = cache.join(entry.integrity.replace([':', '-'], ""));
        let content = fs::read_to_string(&target)
            .map_err(|_| format!("locked schema '{specifier}' is absent from cache"))?;
        if digest(&content) != entry.integrity {
            return Err(format!(
                "locked schema '{specifier}' failed SHA-256 verification"
            ));
        }
        verified += 1;
    }
    Ok(verified)
}
