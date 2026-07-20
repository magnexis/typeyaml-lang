# Local TypeYAML release artifacts

This directory contains distributable artifacts built from the current checkout. The initial bundle is for the local Windows x64 environment; platform-specific Linux and macOS archives are produced by the canonical GitHub release workflow.

Each release directory contains a Node package, native CLI and LSP archive, N-API binding, browser/editor WebAssembly bundle, VS Code VSIX, static documentation archive, SHA-256 checksums, and a machine-readable `artifacts.json` manifest.

Rebuild into a new directory without overwriting existing artifacts:

```powershell
./scripts/create-release.ps1 -OutputDirectory release-1.0.0
```

Verify the files with:

```powershell
Get-Content SHA256SUMS.txt | ForEach-Object {
  $hash, $name = $_ -split '\s+', 2
  if ((Get-FileHash $name -Algorithm SHA256).Hash.ToLower() -ne $hash) { throw "Checksum mismatch: $name" }
}
```
