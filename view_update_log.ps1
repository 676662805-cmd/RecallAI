# 查看自动更新日志

$logPath = "$env:APPDATA\recallai\update.log"

if (Test-Path $logPath) {
    Write-Host "📝 Update Log:" -ForegroundColor Green
    Write-Host "📁 Location: $logPath" -ForegroundColor Cyan
    Write-Host ("-" * 80) -ForegroundColor Gray
    Get-Content $logPath
    Write-Host ("-" * 80) -ForegroundColor Gray
    Write-Host "`n💡 Tip: Log is updated in real-time" -ForegroundColor Yellow
} else {
    Write-Host "❌ Log file not found at: $logPath" -ForegroundColor Red
    Write-Host "💡 The log will be created when the app runs" -ForegroundColor Yellow
}

# 可选：实时监控日志
$watch = Read-Host "`nDo you want to watch the log in real-time? (y/n)"
if ($watch -eq 'y') {
    Write-Host "`n🔄 Watching log file (Ctrl+C to stop)..." -ForegroundColor Green
    Get-Content $logPath -Wait
}
