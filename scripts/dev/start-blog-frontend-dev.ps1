param(
    [string]$NpmExecutable = "npm.cmd"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\..\.."
$frontendRoot = Join-Path $root "blog-frontend"

if (-not (Test-Path (Join-Path $frontendRoot "package.json"))) {
    throw "blog-frontend/package.json not found."
}

Set-Location $frontendRoot

Write-Host "Starting blog-frontend dev server on http://127.0.0.1:5174"
Write-Host "Proxy target: http://127.0.0.1:8000"
& $NpmExecutable run dev
