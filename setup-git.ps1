# AFKBot Repository Setup Script
Write-Host "AFKBot Repository Setup" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host ""

# Check if Git is installed
Write-Host "Checking if Git is installed..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git is not installed. Please install Git first:" -ForegroundColor Red
    Write-Host "https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installing Git, run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Initializing Git repository..." -ForegroundColor Yellow
git init

Write-Host "Adding all files..." -ForegroundColor Yellow
git add .

Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: AFKBot with enhanced features

- Fixed !request command teleporting issues
- Added environment configuration system  
- Redesigned Discord webhook notifications
- Added connection status monitoring
- Improved error handling and code structure"

Write-Host ""
Write-Host "Repository initialized successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To push to GitHub:" -ForegroundColor Cyan
Write-Host "1. Create a new repository on GitHub" -ForegroundColor White
Write-Host "2. Run: git remote add origin YOUR_REPO_URL" -ForegroundColor White
Write-Host "3. Run: git push -u origin main" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
