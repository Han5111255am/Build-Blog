$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\..\.."
$backendRoot = Join-Path $root "backend"
Set-Location $backendRoot

python -m celery -A config worker -l info -P solo -Q default,cache_ops --hostname "worker-ops@$env:COMPUTERNAME"
