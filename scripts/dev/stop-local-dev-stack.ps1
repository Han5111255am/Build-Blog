param(
    [switch]$SkipBackend,
    [switch]$SkipTestBackend,
    [switch]$SkipCelery,
    [switch]$SkipBlogFrontend,
    [switch]$SkipAdminFrontend,
    [switch]$StopDocker,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\..\.."
$powerShellPid = $PID

function Invoke-StopStep {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    if ($DryRun) {
        Write-Host "[DRY-RUN] $Name"
        return
    }

    Write-Host "[STOP] $Name"
    & $Action
}

function Get-PidsByListeningPort {
    param([int]$Port)

    $connections = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    if (-not $connections) {
        return @()
    }

    return @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
}

function Stop-Pids {
    param(
        [int[]]$Pids,
        [string]$Reason
    )

    foreach ($processId in ($Pids | Where-Object { $_ -and $_ -ne $powerShellPid } | Select-Object -Unique)) {
        try {
            $process = Get-Process -Id $processId -ErrorAction Stop
            Write-Host ("  - Stopping PID {0} ({1}) for {2}" -f $processId, $process.ProcessName, $Reason)
            Stop-Process -Id $processId -Force -ErrorAction Stop
        }
        catch {
            Write-Warning ("  - Failed to stop PID {0} for {1}: {2}" -f $processId, $Reason, $_.Exception.Message)
        }
    }
}

function Stop-ProcessesByCommandPattern {
    param(
        [string]$Pattern,
        [string]$Reason
    )

    $processes = Get-CimInstance Win32_Process | Where-Object {
        $_.Name -eq "python.exe" -and $_.CommandLine -match $Pattern
    }

    if (-not $processes) {
        Write-Host ("  - No matching processes for {0}" -f $Reason)
        return
    }

    Stop-Pids -Pids @($processes | Select-Object -ExpandProperty ProcessId) -Reason $Reason
}

Write-Host "Local development stack stopper"
Write-Host "Workspace: $($root.Path)"
Write-Host ""

if (-not $SkipBackend) {
    Invoke-StopStep "Backend dev server on 8000" {
        Stop-Pids -Pids (Get-PidsByListeningPort -Port 8000) -Reason "backend dev server"
    }
}

if (-not $SkipTestBackend) {
    Invoke-StopStep "Backend test server on 8010" {
        Stop-Pids -Pids (Get-PidsByListeningPort -Port 8010) -Reason "backend test server"
    }
}

if (-not $SkipBlogFrontend) {
    Invoke-StopStep "Blog frontend dev server on 5174" {
        Stop-Pids -Pids (Get-PidsByListeningPort -Port 5174) -Reason "blog frontend dev server"
    }
}

if (-not $SkipAdminFrontend) {
    Invoke-StopStep "Admin frontend dev server on 5173" {
        Stop-Pids -Pids (Get-PidsByListeningPort -Port 5173) -Reason "admin frontend dev server"
    }
}

if (-not $SkipCelery) {
    Invoke-StopStep "Celery worker" {
        Stop-ProcessesByCommandPattern -Pattern "python(\.exe)?\s+-m celery\s+-A config worker" -Reason "celery worker"
    }
}

if ($StopDocker) {
    Invoke-StopStep "docker compose down" {
        Set-Location $root
        docker compose down
    }
}

Write-Host ""
Write-Host "Done."
