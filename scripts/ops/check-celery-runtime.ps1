$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\..\.."
$backendRoot = Join-Path $root "backend"
Set-Location $backendRoot

python -m celery -A config inspect ping
python -m celery -A config status
python -m celery -A config inspect active_queues
