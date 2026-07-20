import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export interface RegistryLockEntry { specifier: string; resolved: string; integrity: string; cachedAt: string; }
export interface RegistryLockfile { version: 1; schemas: Record<string, RegistryLockEntry>; }
export interface RegistryPolicy { allowedHosts?: string[]; requireHttps?: boolean; }
export interface ResolveSchemaOptions { cwd?: string; cacheDirectory?: string; offline?: boolean; policy?: RegistryPolicy; }
function sha256(value: string): string { return `sha256-${createHash("sha256").update(value).digest("base64")}`; }
function endpoint(specifier: string): string {
  if (specifier.startsWith("https://")) return specifier;
  if (specifier.startsWith("github:")) { const path = specifier.slice("github:".length); const [owner, repositoryRef, ...segments] = path.split("/"); const [repository, revision] = repositoryRef?.split("@") ?? []; if (!owner || !repository || !revision || revision.toLowerCase() === "head" || !segments.length) throw new Error(`GitHub schema '${specifier}' must use github:owner/repo@tag-or-commit/path`); const schemaPath = segments.join("/"); return `https://raw.githubusercontent.com/${owner}/${repository}/${revision}/${schemaPath.endsWith(".taml") ? schemaPath : `${schemaPath}.taml`}`; }
  throw new Error(`Unsupported registry specifier '${specifier}'`);
}
async function loadLockfile(path: string): Promise<RegistryLockfile> { try { return JSON.parse(await readFile(path, "utf8")) as RegistryLockfile; } catch { return { version: 1, schemas: {} }; } }
async function loadPolicy(cwd: string, policy?: RegistryPolicy): Promise<RegistryPolicy> { if (policy) return policy; try { const config = JSON.parse(await readFile(join(cwd, ".tamlrc.json"), "utf8")) as { registry?: RegistryPolicy }; return config.registry ?? {}; } catch { return {}; } }
/** Resolves a remote schema into a content-addressed cache and records its pinned digest in taml.lock. */
export async function resolveRemoteSchema(specifier: string, options: ResolveSchemaOptions = {}): Promise<string> {
  const cwd = resolve(options.cwd ?? process.cwd()); const policy = await loadPolicy(cwd, options.policy); const cache = options.cacheDirectory ?? join(homedir(), ".taml", "cache"); const lockPath = join(cwd, "taml.lock"); const lock = await loadLockfile(lockPath); const existing = lock.schemas[specifier];
  if (existing) { const cached = join(cache, existing.integrity.replace(/[^A-Za-z0-9]/g, "")); try { const content = await readFile(cached, "utf8"); if (sha256(content) === existing.integrity) return content; } catch { if (options.offline) throw new Error(`Schema '${specifier}' is not present in the local cache`); } }
  if (options.offline) throw new Error(`Schema '${specifier}' has no lockfile cache entry`);
  const resolved = endpoint(specifier); const url = new URL(resolved); if (policy.requireHttps !== false && url.protocol !== "https:") throw new Error(`Schema '${specifier}' is not HTTPS`); if (policy.allowedHosts?.length && !policy.allowedHosts.includes(url.hostname)) throw new Error(`Schema host '${url.hostname}' is not permitted by .tamlrc.json`); const response = await fetch(resolved, { redirect: "error" }); if (!response.ok) throw new Error(`Schema fetch failed for '${specifier}': HTTP ${response.status}`); const content = await response.text(); const integrity = sha256(content); await mkdir(cache, { recursive: true }); await writeFile(join(cache, integrity.replace(/[^A-Za-z0-9]/g, "")), content, "utf8"); lock.schemas[specifier] = { specifier, resolved, integrity, cachedAt: new Date().toISOString() }; await writeFile(lockPath, JSON.stringify(lock, null, 2) + "\n", "utf8"); return content;
}
