# Script to remove D:\ and D:\Git\cmd from Windows System PATH
# Run this as Administrator

$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($machinePath) {
    $paths = $machinePath -split ";"
    $filtered = $paths | Where-Object { $_ -ne "D:\" -and $_ -ne "D:\Git\cmd" -and $_ -ne "" }
    $newPath = $filtered -join ";"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    Write-Host "Successfully removed D:\ and D:\Git\cmd from System PATH"
    Write-Host "Please restart your terminal/WSL for changes to take effect"
} else {
    Write-Host "No System PATH found"
}

