$ErrorActionPreference = "Stop"

$port = 5000
$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
$serverDir = Split-Path -Parent $PSScriptRoot

if ($listener) {
  Write-Host "Stopping process $($listener.OwningProcess) on port $port..."
  Stop-Process -Id $listener.OwningProcess -Force
  Start-Sleep -Seconds 1
}

Write-Host "Starting backend on port $port..."
Set-Location $serverDir
npm run dev
