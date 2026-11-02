$backendPath = "C:\Users\alfian.saputra\Documents\[CJDIY] Application\Inventory Apps\backend"
$frontendPath = "C:\Users\alfian.saputra\Documents\[CJDIY] Application\Inventory Apps\frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$backendPath'; Write-Host 'Backend starting...' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$frontendPath'; Write-Host 'Frontend starting...' -ForegroundColor Blue; npm run dev"

Write-Host "Servers starting..." -ForegroundColor Cyan
Write-Host "Backend  -> http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend -> http://localhost:5173" -ForegroundColor Blue
