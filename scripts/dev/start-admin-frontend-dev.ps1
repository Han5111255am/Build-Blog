param(
    [string]$NpmExecutable = "npm.cmd",
    [string]$ProxyTarget = "http://127.0.0.1:8000"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\..\.."
$frontendRoot = Join-Path $root "admin-frontend"

if (-not (Test-Path (Join-Path $frontendRoot "package.json"))) {
    throw "admin-frontend/package.json not found."
}

Set-Location $frontendRoot

$env:VITE_DEV_PROXY_TARGET = $ProxyTarget

Write-Host "Starting admin-frontend dev server on http://127.0.0.1:5173"
Write-Host "Proxy target: $ProxyTarget"
& $NpmExecutable run dev
