$ErrorActionPreference = "Stop"

$serverDir = Split-Path -Parent $PSScriptRoot
$nodeExe = (Get-Command node).Source
$stdoutLog = Join-Path $serverDir "backend.stdout.log"
$stderrLog = Join-Path $serverDir "backend.stderr.log"

Set-Location $serverDir

if (Test-Path Env:\ELECTRON_RUN_AS_NODE) {
  Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
}

Write-Host "Starting backend from $serverDir"

Remove-Item $stdoutLog -ErrorAction SilentlyContinue
Remove-Item $stderrLog -ErrorAction SilentlyContinue

$proc = Start-Process -FilePath $nodeExe -ArgumentList "index.js" -WorkingDirectory $serverDir -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -PassThru

Start-Sleep -Seconds 2

if ($proc.HasExited) {
  if (Test-Path $stderrLog) {
    Get-Content $stderrLog
  }
  throw "Backend exited immediately with code $($proc.ExitCode). Check backend.stderr.log for details."
}

Write-Host "Backend started. PID: $($proc.Id)"
Write-Host "Health check: http://localhost:5000/api/health"
