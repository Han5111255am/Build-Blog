$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\..\.."
$backendRoot = Join-Path $root "backend"
Set-Location $backendRoot

python -m celery -A config worker -l info -P solo -Q content_render --hostname "worker-content@$env:COMPUTERNAME"
