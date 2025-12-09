# PowerShell script to start both frontend and backend
# Usage: .\start_all.ps1

Write-Host "🚀 Starting GEM Platform..." -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "📦 Starting Backend Server..." -ForegroundColor Blue
Set-Location backend
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    python3 start_server.py
}
Set-Location ..

# Wait a moment
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "📦 Starting Frontend Server..." -ForegroundColor Blue
Set-Location frontend
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}
Set-Location ..

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Wait for jobs
try {
    Wait-Job $backendJob, $frontendJob
} finally {
    Write-Host "🛑 Shutting down servers..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
}

