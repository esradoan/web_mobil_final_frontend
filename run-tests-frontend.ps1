# Frontend Test Coverage Script
# Usage: .\run-tests-frontend.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Frontend Test Coverage Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "[1/4] Installing dependencies..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Step 1: Clean old coverage results
Write-Host "[1/4] Cleaning old coverage results..." -ForegroundColor Yellow
if (Test-Path "coverage") {
    Remove-Item "coverage" -Recurse -Force
    Write-Host "✅ Old coverage cleaned" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No old coverage to clean" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Run tests with coverage (LCOV format)
Write-Host "[2/4] Running tests with code coverage..." -ForegroundColor Yellow
Write-Host ""

npm run test:coverage

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tests completed successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Check if ReportGenerator is installed
Write-Host "[3/4] Checking ReportGenerator..." -ForegroundColor Yellow
$reportGenPath = "reportgenerator"
if (-not (Get-Command $reportGenPath -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing ReportGenerator tool..." -ForegroundColor Yellow
    dotnet tool install -g dotnet-reportgenerator-globaltool
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install ReportGenerator!" -ForegroundColor Red
        Write-Host "💡 Try running manually: dotnet tool install -g dotnet-reportgenerator-globaltool" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "⚠️  Falling back to default LCOV report" -ForegroundColor Yellow
        Write-Host "📁 Report Location: coverage/lcov-report/index.html" -ForegroundColor Cyan
        exit 0
    }
}
Write-Host "✅ ReportGenerator ready" -ForegroundColor Green
Write-Host ""

# Step 4: Generate HTML report with ReportGenerator
Write-Host "[4/4] Generating HTML report with ReportGenerator..." -ForegroundColor Yellow

# Find LCOV file
$lcovFile = Get-ChildItem -Path "coverage" -Recurse -Filter "lcov.info" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

if ($null -eq $lcovFile) {
    Write-Host "⚠️  LCOV file not found, using default coverage report" -ForegroundColor Yellow
    Write-Host "📁 Report Location: coverage/lcov-report/index.html" -ForegroundColor Cyan
    exit 0
}

Write-Host "📄 Found LCOV file: $($lcovFile.Name)" -ForegroundColor Gray

# Generate HTML report using ReportGenerator
Write-Host "📊 Generating HTML report..." -ForegroundColor Gray
reportgenerator `
    -reports:"$($lcovFile.FullName)" `
    -targetdir:"coverage/ReportGenerator" `
    -reporttypes:"Html" `
    -classfilters:"-*test*;-*__tests__*;-*mocks*"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ Coverage Report Generated!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Report Location:" -ForegroundColor Cyan
    Write-Host "   coverage/ReportGenerator/index.html" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 To open the report:" -ForegroundColor Yellow
    Write-Host "   Start-Process coverage/ReportGenerator/index.html" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "⚠️  ReportGenerator had issues, using default LCOV report" -ForegroundColor Yellow
    Write-Host "📁 Report Location: coverage/lcov-report/index.html" -ForegroundColor Cyan
}

Write-Host ""

