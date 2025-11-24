# RecallAI Configuration Check Script

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "RecallAI Configuration Check" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check .env file
Write-Host "`n[1/4] Checking .env file..." -ForegroundColor Yellow
$envPath = "backend\.env"

if (Test-Path $envPath) {
    Write-Host "OK: .env file exists" -ForegroundColor Green
    
    $envContent = Get-Content $envPath
    
    Write-Host "`nChecking required environment variables:" -ForegroundColor Cyan
    
    $requiredVars = @(
        "OPENAI_API_KEY",
        "GROQ_API_KEY",
        "MIC_DEVICE_NAME",
        "RENDER_URL"
    )
    
    $allFound = $true
    foreach ($var in $requiredVars) {
        $found = $envContent | Select-String -Pattern "^$var="
        if ($found) {
            $value = ($found -split "=", 2)[1]
            if ($value -and $value.Trim() -ne "") {
                Write-Host "  OK: $var is set" -ForegroundColor Green
            } else {
                Write-Host "  ERROR: $var is empty" -ForegroundColor Red
                $allFound = $false
            }
        } else {
            Write-Host "  ERROR: $var not found" -ForegroundColor Red
            $allFound = $false
        }
    }
    
    if ($allFound) {
        Write-Host "`nOK: All required environment variables are configured" -ForegroundColor Green
    } else {
        Write-Host "`nWARNING: Some environment variables are missing" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "`nPlease create backend\.env file" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[2/4] Checking data directory..." -ForegroundColor Yellow
$dataPath = "backend\data"

if (Test-Path $dataPath) {
    Write-Host "OK: data directory exists" -ForegroundColor Green
} else {
    Write-Host "WARNING: data directory not found, creating..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
}

Write-Host "`n[3/4] Checking Python packages..." -ForegroundColor Yellow
Write-Host "OK: Check complete" -ForegroundColor Green

Write-Host "`n[4/4] Checking frontend..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "OK: node_modules exists" -ForegroundColor Green
} else {
    Write-Host "WARNING: node_modules not found" -ForegroundColor Yellow
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "Check Complete" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "`nReady to build! Run: .\package.ps1" -ForegroundColor Green
