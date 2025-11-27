# RecallAI 开发环境启动脚本
# 同时启动后端和前端开发服务器

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "RecallAI 开发环境启动" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 启动后端
Write-Host "`n启动 Python 后端..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python main.py"

# 等待 2 秒
Start-Sleep -Seconds 2

# 启动前端
Write-Host "启动前端开发服务器..." -ForegroundColor Yellow
Set-Location frontend
npm run electron:dev
