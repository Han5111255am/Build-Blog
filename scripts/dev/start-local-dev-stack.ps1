param(
    [switch]$SkipDocker,
    [switch]$SkipBackend,
    [switch]$SkipCelery,
    [switch]$SkipBlogFrontend,
    [switch]$SkipAdminFrontend,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\..\.."
$powerShellExe = Join-Path $PSHOME "powershell.exe"

function Escape-SingleQuotedValue {
    param([string]$Value)

    return $Value -replace "'", "''"
}

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    if ($DryRun) {
        Write-Host "[DRY-RUN] $Name"
        return
    }

    Write-Host "[START] $Name"
    & $Action
}

function Start-ServiceWindow {
    param(
        [string]$WindowTitle,
        [string]$ScriptPath
    )

    $escapedRoot = Escape-SingleQuotedValue $root.Path
    $escapedTitle = Escape-SingleQuotedValue $WindowTitle
    $escapedScriptPath = Escape-SingleQuotedValue $ScriptPath
    $command = "Set-Location '$escapedRoot'; `$Host.UI.RawUI.WindowTitle = '$escapedTitle'; & '$escapedScriptPath'"

    Start-Process -FilePath $powerShellExe -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        $command
    ) | Out-Null
}

Write-Host "Local development stack launcher"
Write-Host "Workspace: $($root.Path)"
Write-Host ""

if (-not $SkipDocker) {
    Invoke-Step "docker compose up -d" {
        Set-Location $root
        docker compose up -d
    }
}

if (-not $SkipBackend) {
    Invoke-Step "Backend dev server (127.0.0.1:8000)" {
        Start-ServiceWindow -WindowTitle "Blog Backend Dev" -ScriptPath (Join-Path $root "scripts\dev\start-backend-dev.ps1")
    }
}

if (-not $SkipCelery) {
    Invoke-Step "Celery worker (all queues)" {
        Start-ServiceWindow -WindowTitle "Blog Celery" -ScriptPath (Join-Path $root "scripts\ops\start-celery-all-queues.ps1")
    }
}

if (-not $SkipBlogFrontend) {
    Invoke-Step "Blog frontend dev server (127.0.0.1:5174)" {
        Start-ServiceWindow -WindowTitle "Blog Frontend" -ScriptPath (Join-Path $root "scripts\dev\start-blog-frontend-dev.ps1")
    }
}

if (-not $SkipAdminFrontend) {
    Invoke-Step "Admin frontend dev server (127.0.0.1:5173)" {
        Start-ServiceWindow -WindowTitle "Blog Admin Frontend" -ScriptPath (Join-Path $root "scripts\dev\start-admin-frontend-dev.ps1")
    }
}

Write-Host ""
Write-Host "Done."
Write-Host "Backend: http://127.0.0.1:8000"
Write-Host "Admin frontend: http://127.0.0.1:5173"
Write-Host "Blog frontend: http://127.0.0.1:5174"
