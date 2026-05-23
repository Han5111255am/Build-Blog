$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\..\.."
$backendRoot = Join-Path $root "backend"
Set-Location $backendRoot

python -m celery -A config worker -l info -P solo -Q default,content_render,cache_ops --hostname "worker-all@$env:COMPUTERNAME"
