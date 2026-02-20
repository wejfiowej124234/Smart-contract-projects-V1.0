# Local chain + frontend: kill 8545/5173 -> start node -> deploy -> start frontend
# Run from repo root: npm run local:restart  OR  powershell -ExecutionPolicy Bypass -File scripts/local-restart.ps1
#
# Addresses/ABI: deploy:localhost writes deployments/31337.json and exportArtifacts() syncs to
# frontend/src/contracts/deployments.json + frontend/src/abis/*.json. deploy:p9 adds P9 addresses
# and GovToken/GovernorP9 ABI. Frontend reads getDeployments(chainId) and ABIS.* (see 09, verify:consistency).

$ErrorActionPreference = "Stop"
# Project root = parent of scripts folder (where this script lives)
$RootDir = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $RootDir "package.json"))) {
    $RootDir = (Get-Location).Path
}
if (-not (Test-Path (Join-Path $RootDir "package.json"))) {
    Write-Host "ERROR: package.json not found. Run from repo root or ensure scripts/local-restart.ps1 is in repo." -ForegroundColor Red
    exit 1
}
Set-Location $RootDir

function Stop-ProcessOnPort {
    param([int]$Port)
    $pids = @()
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($conn) { $pids = $conn.OwningProcess | Sort-Object -Unique }
    } catch {}
    if ($pids.Count -eq 0) {
        $line = netstat -ano | Select-String ":$Port\s+.*LISTENING"
        if ($line) {
            $last = ($line -split '\s+')[-1]
            if ($last -match '^\d+$') { $pids = @([int]$last) }
        }
    }
    foreach ($procId in $pids) {
        Write-Host "Killing process on port $Port PID $procId"
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
    if ($pids.Count -gt 0) { Start-Sleep -Seconds 2 }
}

function Wait-ForPort {
    param([int]$Port, [int]$TimeoutSec = 30)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $conn = New-Object System.Net.Sockets.TcpClient("127.0.0.1", $Port)
            $conn.Close()
            return $true
        } catch {}
        Start-Sleep -Milliseconds 500
    }
    return $false
}

Write-Host "=== Step 1: Kill processes on 8545 and 5173 ===" -ForegroundColor Cyan
Stop-ProcessOnPort -Port 8545
Stop-ProcessOnPort -Port 5173
Start-Sleep -Seconds 1

Write-Host "`n=== Step 2: Start Hardhat node (new window) ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx hardhat node" -WorkingDirectory $RootDir
Write-Host "Waiting for node on 8545..."
if (-not (Wait-ForPort -Port 8545 -TimeoutSec 35)) {
    Write-Host "ERROR: Node did not become ready in 35s. Check the new window." -ForegroundColor Red
    exit 1
}
Write-Host "Node ready."
Start-Sleep -Seconds 2

Write-Host "`n=== Step 3: Deploy (deploy:localhost + deploy:p9) ===" -ForegroundColor Cyan
& npm run deploy:localhost
if ($LASTEXITCODE -ne 0) { Write-Host "deploy:localhost failed" -ForegroundColor Red; exit 1 }
& npm run deploy:p9
if ($LASTEXITCODE -ne 0) { Write-Host "deploy:p9 failed" -ForegroundColor Red; exit 1 }
Write-Host "Deploy done."

Write-Host "`n=== Step 4: Verify consistency (local address = frontend address = chain code) ===" -ForegroundColor Cyan
& npm run verify:consistency
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARN: verify:consistency reported INCONSISTENT. Check node chainId 31337 and deployments. Frontend may still work if you hard-refresh." -ForegroundColor Yellow
} else {
    Write-Host "Consistency OK: deployments/31337.json and frontend deployments.json match; chain has code."
}

Write-Host "`n=== Step 5: Start frontend (new window) ===" -ForegroundColor Cyan
$frontendDir = Join-Path $RootDir "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory $frontendDir
Write-Host "Waiting for frontend on 5173..."
Start-Sleep -Seconds 5
if (Wait-ForPort -Port 5173 -TimeoutSec 15) {
    Write-Host "Frontend ready."
} else {
    Write-Host "Frontend may still be starting; check the new window."
}

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "Keep node and frontend windows open. MetaMask: RPC http://127.0.0.1:8545, Chain ID 31337. Open http://127.0.0.1:5173/diagnostics (three Yes) then hard refresh (Ctrl+Shift+R)."
Write-Host ""
