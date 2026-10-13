# ==============================================================================
# BugGraph Workstation CLI — Official Web Installer (Windows PowerShell)
# ==============================================================================
# Installs the actual clean BugGraph tool into $HOME\.buggraph without any dump files.
# Usage: irm http://<host>/install.ps1 | iex
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        BUGGRAPH AI WORKSTATION CLI — OFFICIAL WINDOWS INSTALLER        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "✖ Error: Node.js (v18+) is required but was not found in PATH." -ForegroundColor Red
    Write-Host "Please download and install Node.js from https://nodejs.org/ and re-run." -ForegroundColor Yellow
    exit 1
}

$nodeVersion = (node -v).TrimStart('v').Split('.')[0]
if ([int]$nodeVersion -lt 18) {
    Write-Host "✖ Error: Node.js version 18 or higher is required. (Detected: $(node -v))" -ForegroundColor Red
    exit 1
}

Write-Host "✔ Node.js runtime detected: $(node -v)" -ForegroundColor Green

# 2. Determine host URL & paths
$serverUrl = if ($env:BUGGRAPH_HOST) { $env:BUGGRAPH_HOST } else { "http://127.0.0.1:4568" }
$targetDir = Join-Path $HOME ".buggraph"
$binDir = Join-Path $targetDir "bin"
$tempArchive = Join-Path $env:TEMP "buggraph-clean-$((Get-Random)).tar.gz"

Write-Host "Installing BugGraph tool to: $targetDir" -ForegroundColor Gray

# 3. Create target directory
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

# 4. Download clean package from server
Write-Host "Downloading official BugGraph tool package..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "$serverUrl/api/install/package.tar.gz" -OutFile $tempArchive -UseBasicParsing

# 5. Extract actual tool clean files
Write-Host "Extracting clean tool distribution..." -ForegroundColor Cyan
tar -xzf $tempArchive -C $targetDir

# 6. Delete temporary archive immediately (no dump files left!)
if (Test-Path $tempArchive) {
    Remove-Item -Path $tempArchive -Force
}

# 7. Configure production dependencies
Write-Host "Configuring production runtime dependencies..." -ForegroundColor Cyan
Set-Location $targetDir
npm install --omit=dev --no-audit --no-fund --loglevel=error

# 8. Create buggraph.cmd executable in $binDir
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

$cmdWrapper = "@echo off`r`nnode `"%~dp0\buggraph.js`" %*"
Set-Content -Path (Join-Path $binDir "buggraph.cmd") -Value $cmdWrapper -Encoding ASCII

# 9. Add to User PATH if not already present
$userPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
if ($userPath -notlike "*$binDir*") {
    Write-Host "Adding $binDir to User PATH..." -ForegroundColor Cyan
    $newPath = "$userPath;$binDir"
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
    $env:Path = "$env:Path;$binDir"
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✔ BugGraph Workstation CLI installed successfully on Windows!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Try running in a new Command Prompt or PowerShell:" -ForegroundColor White
Write-Host "  buggraph --help      # Display all commands" -ForegroundColor Cyan
Write-Host "  buggraph status      # Check workstation engine status" -ForegroundColor Cyan
Write-Host "  buggraph pop         # Launch the visual HUD Workstation" -ForegroundColor Cyan
Write-Host ""
