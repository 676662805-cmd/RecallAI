# RecallAI Build Script
# This script automatically packages the backend and frontend into a complete exe installer

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "RecallAI Build Process Started" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 1. Package Python Backend
Write-Host "`n[1/4] Packaging Python Backend..." -ForegroundColor Yellow
Set-Location backend

# Check and clean dist directory
if (Test-Path "dist") {
    Write-Host "Cleaning old build files..." -ForegroundColor Gray
    Remove-Item -Recurse -Force dist
}

# Package with PyInstaller
Write-Host "Running PyInstaller..." -ForegroundColor Gray
python -m PyInstaller main.spec --clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nPython backend packaging failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "Python backend packaging completed" -ForegroundColor Green
Set-Location ..

# 2. Build Frontend
Write-Host "`n[2/4] Building Frontend..." -ForegroundColor Yellow
Set-Location frontend

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Gray
    npm install
}

# Build frontend
Write-Host "Building Vite project..." -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nFrontend build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "Frontend build completed" -ForegroundColor Green

# 3. Package Electron App
Write-Host "`n[3/4] Packaging Electron App..." -ForegroundColor Yellow
Write-Host "Running electron-builder..." -ForegroundColor Gray
npm run dist

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nElectron packaging failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "Electron app packaging completed" -ForegroundColor Green
Set-Location ..

# 4. Complete
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "`nInstaller location: frontend\release\" -ForegroundColor Cyan
Write-Host "You can find the generated installer in that directory" -ForegroundColor Cyan
