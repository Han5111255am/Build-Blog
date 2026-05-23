param(
    [string]$BindAddress = "127.0.0.1",
    [int]$Port = 8000,
    [string]$PythonExecutable = "python"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\..\.."
$backendRoot = Join-Path $root "backend"
Set-Location $backendRoot

$settingsModule = "config.settings"
Write-Host "Starting Django dev server on ${BindAddress}:${Port} using ${settingsModule}"
& $PythonExecutable manage.py runserver "${BindAddress}:${Port}" --settings=$settingsModule
