$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\..\.."

function Get-PortStatus {
    param(
        [int]$Port,
        [string]$Name
    )

    $connections = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    if (-not $connections) {
        return [pscustomobject]@{
            Name = $Name
            Port = $Port
            Status = "stopped"
            Pid = ""
            ProcessName = ""
            CommandLine = ""
        }
    }

    $listeningPid = ($connections | Select-Object -ExpandProperty OwningProcess -Unique | Select-Object -First 1)
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $listeningPid" -ErrorAction SilentlyContinue
    $processName = ""
    $commandLine = ""

    if ($process) {
        $processName = $process.Name
        $commandLine = $process.CommandLine
    }

    return [pscustomobject]@{
        Name = $Name
        Port = $Port
        Status = "running"
        Pid = $listeningPid
        ProcessName = $processName
        CommandLine = $commandLine
    }
}

function Get-CeleryStatus {
    $processes = Get-CimInstance Win32_Process | Where-Object {
        $_.Name -eq "python.exe" -and $_.CommandLine -match "python(\.exe)?\s+-m celery\s+-A config worker"
    }

    if (-not $processes) {
        return [pscustomobject]@{
            Name = "celery"
            Port = ""
            Status = "stopped"
            Pid = ""
            ProcessName = ""
            CommandLine = ""
        }
    }

    $first = $processes | Select-Object -First 1
    return [pscustomobject]@{
        Name = "celery"
        Port = ""
        Status = "running"
        Pid = $first.ProcessId
        ProcessName = $first.Name
        CommandLine = $first.CommandLine
    }
}

Write-Host "Local development stack status"
Write-Host "Workspace: $($root.Path)"
Write-Host ""

$statuses = @(
    Get-PortStatus -Name "backend-dev" -Port 8000
    Get-PortStatus -Name "backend-test" -Port 8010
    Get-PortStatus -Name "admin-frontend" -Port 5173
    Get-PortStatus -Name "blog-frontend" -Port 5174
    Get-CeleryStatus
)

$statuses | Format-Table -AutoSize Name, Port, Status, Pid, ProcessName

Write-Host ""
foreach ($item in $statuses | Where-Object { $_.Status -eq "running" -and $_.CommandLine }) {
    Write-Host ("[{0}] {1}" -f $item.Name, $item.CommandLine)
}

Write-Host ""
Write-Host "Docker containers"
try {
    Set-Location $root
    docker ps --filter "name=blog-mysql" --filter "name=blog-redis" --filter "name=blog-rabbitmq" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}
catch {
    Write-Warning ("Unable to query docker status: {0}" -f $_.Exception.Message)
}
