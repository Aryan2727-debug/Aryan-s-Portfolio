# Setup script to install Git hooks (Windows PowerShell version)
# Run this once after cloning the repository

$HooksDir = ".git\hooks"
$SourceDir = "hooks"

Write-Host "Installing Git hooks..." -ForegroundColor Cyan

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not a git repository. Run this from the project root." -ForegroundColor Red
    exit 1
}

# Copy pre-commit hook
$SourceHook = Join-Path $SourceDir "pre-commit"
$DestHook = Join-Path $HooksDir "pre-commit"

if (Test-Path $SourceHook) {
    Copy-Item $SourceHook $DestHook -Force
    Write-Host "Installed pre-commit hook" -ForegroundColor Green
} else {
    Write-Host "pre-commit hook not found in $SourceDir" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Git hooks installed successfully!" -ForegroundColor Green
Write-Host "The pre-commit hook will now check for CACHE_NAME updates."
