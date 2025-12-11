# Push changes to GitHub
# Run this script from the repository root

Write-Host "Checking git status..." -ForegroundColor Cyan
wsl bash -c "cd /home/eaton/code/GEP && git status"

Write-Host "`nAdding all changes..." -ForegroundColor Cyan
wsl bash -c "cd /home/eaton/code/GEP && git add -A"

Write-Host "`nChecking what will be committed..." -ForegroundColor Cyan
wsl bash -c "cd /home/eaton/code/GEP && git status --short"

Write-Host "`nCommitting changes..." -ForegroundColor Cyan
wsl bash -c "cd /home/eaton/code/GEP && git commit -m 'Fix onboarding profile creation error handling and add GEP confirmation email template'"

Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
wsl bash -c "cd /home/eaton/code/GEP && git push origin main"

Write-Host "`nDone! Changes pushed to GitHub." -ForegroundColor Green
