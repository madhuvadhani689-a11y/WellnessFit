$ErrorActionPreference = "Stop"

$port = 5000
$listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if (-not $listeners) {
  Write-Host "Port $port is already free."
  exit 0
}

$pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $pids) {
  try {
    Write-Host "Stopping process $pid on port $port..."
    Stop-Process -Id $pid -Force
  } catch {
    Write-Warning "Unable to stop process $pid. Try running this script as Administrator."
  }
}

Start-Sleep -Seconds 1
$stillListening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($stillListening) {
  Write-Warning "Port $port is still in use."
  exit 1
}

Write-Host "Port $port has been freed."

