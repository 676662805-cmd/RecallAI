# RecallAI One-Click Build Script
# This script will automatically install dependencies and build the complete package

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "RecallAI One-Click Build Started" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 0. Check and install dependencies
Write-Host "`n[0/4] Checking and installing dependencies..." -ForegroundColor Yellow

# Install frontend dependencies
Write-Host "`nChecking frontend dependencies..." -ForegroundColor Gray
Set-Location frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nERROR: npm install failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "OK: Frontend dependencies already installed" -ForegroundColor Green
}
Set-Location ..

# Install Python dependencies
Write-Host "`nChecking Python dependencies..." -ForegroundColor Gray
Set-Location backend
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Python dependencies install failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "OK: Python dependencies installed" -ForegroundColor Green
Set-Location ..

# 1. Build Python backend
Write-Host "`n[1/4] Building Python backend..." -ForegroundColor Yellow
Set-Location backend

# Clean old build files
if (Test-Path "dist") {
    Write-Host "Cleaning old build files..." -ForegroundColor Gray
    Remove-Item -Recurse -Force dist
}
if (Test-Path "build") {
    Remove-Item -Recurse -Force build
}

# Run PyInstaller
Write-Host "Running PyInstaller..." -ForegroundColor Gray
python -m PyInstaller main.spec --clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Python backend build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Verify exe was generated
if (-not (Test-Path "dist/main.exe")) {
    Write-Host "`nERROR: main.exe was not generated!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "OK: Python backend built successfully (dist/main.exe)" -ForegroundColor Green
Set-Location ..

# 2. Build frontend
Write-Host "`n[2/4] Building frontend..." -ForegroundColor Yellow
Set-Location frontend

# Build frontend
Write-Host "Building Vite project..." -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Frontend build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "OK: Frontend built successfully (dist/)" -ForegroundColor Green

# 3. Package Electron app
Write-Host "`n[3/4] Packaging Electron app..." -ForegroundColor Yellow
Write-Host "Running electron-builder (this may take several minutes)..." -ForegroundColor Gray
npm run dist

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Electron packaging failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "OK: Electron app packaged successfully" -ForegroundColor Green
Set-Location ..

# 4. Complete
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "Build complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "`nInstaller location: frontend\release\" -ForegroundColor Cyan

# List generated files
if (Test-Path "frontend\release") {
    Write-Host "`nGenerated files:" -ForegroundColor Yellow
    Get-ChildItem "frontend\release" -Filter "*.exe" | ForEach-Object {
        $sizeMB = [math]::Round($_.Length/1MB, 2)
        Write-Host "  OK: $($_.Name) ($sizeMB MB)" -ForegroundColor Green
    }
}

Write-Host "`nYou can now run the installer to test!" -ForegroundColor Cyan
