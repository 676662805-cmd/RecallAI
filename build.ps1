# RecallAI 打包脚本
# 此脚本会自动打包后端和前端成一个完整的 exe 安装包

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "RecallAI 打包流程开始" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 1. 打包 Python 后端
Write-Host "`n[1/4] 打包 Python 后端..." -ForegroundColor Yellow
Set-Location backend

# 检查是否存在 dist 目录并清理
if (Test-Path "dist") {
    Write-Host "清理旧的打包文件..." -ForegroundColor Gray
    Remove-Item -Recurse -Force dist
}

# 使用 PyInstaller 打包
Write-Host "运行 PyInstaller..." -ForegroundColor Gray
python -m PyInstaller main.spec --clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Python 后端打包失败！" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✓ Python 后端打包完成" -ForegroundColor Green
Set-Location ..

# 2. 构建前端
Write-Host "`n[2/4] 构建前端..." -ForegroundColor Yellow
Set-Location frontend

# 安装依赖（如果需要）
if (-not (Test-Path "node_modules")) {
    Write-Host "安装 npm 依赖..." -ForegroundColor Gray
    npm install
}

# 构建前端
Write-Host "构建 Vite 项目..." -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ 前端构建失败！" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✓ 前端构建完成" -ForegroundColor Green

# 3. 打包 Electron 应用
Write-Host "`n[3/4] 打包 Electron 应用..." -ForegroundColor Yellow
Write-Host "运行 electron-builder..." -ForegroundColor Gray
npm run dist

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Electron 打包失败！" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✓ Electron 应用打包完成" -ForegroundColor Green
Set-Location ..

# 4. 完成
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "✓ 打包完成！" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "`n安装包位置: frontend\release\" -ForegroundColor Cyan
Write-Host "你可以在该目录找到生成的安装程序" -ForegroundColor Cyan
