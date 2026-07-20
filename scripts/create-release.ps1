param(
  [string]$OutputDirectory = "release",
  [switch]$SkipWasm
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$package = Get-Content package.json -Raw | ConvertFrom-Json
$version = $package.version
$releasePath = Join-Path $projectRoot $OutputDirectory

if (Test-Path $releasePath) {
  throw "Release directory already exists: $releasePath. Choose a new -OutputDirectory so existing artifacts are never overwritten."
}

New-Item -ItemType Directory -Path $releasePath | Out-Null

function Invoke-ReleaseCommand([string]$Command) {
  Write-Host "> $Command" -ForegroundColor Cyan
  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) { throw "Release command failed: $Command" }
}

Invoke-ReleaseCommand "npm run build"
Invoke-ReleaseCommand "cargo build --release -p taml"
Invoke-ReleaseCommand "cargo build --release -p taml-lsp"
Invoke-ReleaseCommand "npm pack --pack-destination '$releasePath'"

$npmArchive = Get-ChildItem $releasePath -Filter "*.tgz" | Select-Object -First 1
Move-Item -LiteralPath $npmArchive.FullName -Destination (Join-Path $releasePath "typeyaml-v$version.tgz")

Compress-Archive -LiteralPath "target/release/taml.exe", "target/release/taml-lsp.exe" -DestinationPath (Join-Path $releasePath "typeyaml-v$version-windows-x64.zip")

Push-Location crates/typeyaml-napi
try {
  Invoke-ReleaseCommand "npm install"
  Invoke-ReleaseCommand "npx napi build --release --target x86_64-pc-windows-msvc --platform"
  $binding = Get-ChildItem -Filter "*.node" | Select-Object -First 1
  if ($null -eq $binding) { throw "N-API build completed without a .node binding." }
  Compress-Archive -LiteralPath $binding.FullName -DestinationPath (Join-Path $releasePath "typeyaml-napi-v$version-windows-x64.zip")
} finally {
  Pop-Location
}

Push-Location vscode-extension
try {
  Invoke-ReleaseCommand "npm run package"
  Move-Item -LiteralPath typeyaml.vsix -Destination (Join-Path $releasePath "typeyaml-v$version.vsix")
} finally {
  Pop-Location
}

Invoke-ReleaseCommand "npm run docs:build"
Compress-Archive -Path "docs/.vitepress/dist/*" -DestinationPath (Join-Path $releasePath "typeyaml-docs-v$version-windows-x64.zip")

if (-not $SkipWasm -and (Get-Command wasm-pack -ErrorAction SilentlyContinue)) {
  Invoke-ReleaseCommand "wasm-pack build crates/typeyaml-wasm --target web --out-dir pkg"
  Compress-Archive -Path "crates/typeyaml-wasm/pkg/*" -DestinationPath (Join-Path $releasePath "typeyaml-wasm-v$version.zip")
} elseif (-not $SkipWasm) {
  Write-Warning "wasm-pack is unavailable; no Wasm artifact was generated. Install it with: cargo install wasm-pack --locked"
}

$artifacts = Get-ChildItem -Path $releasePath -File | Where-Object { $_.Name -notin @("SHA256SUMS.txt", "artifacts.json") } | ForEach-Object {
  $hash = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256
  [PSCustomObject]@{
    path = $_.Name
    bytes = $_.Length
    sha256 = $hash.Hash.ToLowerInvariant()
  }
}

$artifacts | ForEach-Object { "$($_.sha256)  $($_.path)" } | Set-Content -Path (Join-Path $releasePath "SHA256SUMS.txt")
[PSCustomObject]@{
  version = $version
  platform = "windows-x64"
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  artifacts = @($artifacts)
} | ConvertTo-Json -Depth 5 | Set-Content -Path (Join-Path $releasePath "artifacts.json")

Write-Host "Release artifacts are ready in $releasePath" -ForegroundColor Green
