# Auto-generate PDF from HTML using Chrome headless
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$distDir = Join-Path $projectRoot "slides\dist"

# Find browser (Edge or Chrome)
$browserPath = $null
$paths = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
)

foreach ($p in $paths) {
    if (Test-Path $p) {
        $browserPath = $p
        break
    }
}

if (-not $browserPath) {
    Write-Host "Browser not found. Please install Chrome/Edge or use VS Code Marp plugin." -ForegroundColor Red
    exit 1
}

Write-Host "Found browser: $browserPath" -ForegroundColor Green

# Generate Chinese PDF
$zhHtml = Join-Path $distDir "INTERVIEW_DECK.zh-cn.html"
$zhPdf = Join-Path $distDir "INTERVIEW_DECK.zh-cn.pdf"

if (Test-Path $zhHtml) {
    Write-Host "Generating Chinese PDF..." -ForegroundColor Cyan
    $zhUri = "file:///$($zhHtml.Replace('\', '/'))"
    $process = Start-Process -FilePath $browserPath -ArgumentList @("--headless", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--disable-crash-reporter", "--print-to-pdf=$zhPdf", "--print-to-pdf-no-header", $zhUri) -PassThru -WindowStyle Hidden -Wait
    Start-Sleep -Seconds 2
    if (Test-Path $zhPdf) {
        Write-Host "Chinese PDF generated: $zhPdf" -ForegroundColor Green
    }
}

# Generate English PDF
$enHtml = Join-Path $distDir "INTERVIEW_DECK.en.html"
$enPdf = Join-Path $distDir "INTERVIEW_DECK.en.pdf"

if (Test-Path $enHtml) {
    Write-Host "Generating English PDF..." -ForegroundColor Cyan
    $enUri = "file:///$($enHtml.Replace('\', '/'))"
    $process = Start-Process -FilePath $browserPath -ArgumentList @("--headless", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--disable-crash-reporter", "--print-to-pdf=$enPdf", "--print-to-pdf-no-header", $enUri) -PassThru -WindowStyle Hidden -Wait
    Start-Sleep -Seconds 2
    if (Test-Path $enPdf) {
        Write-Host "English PDF generated: $enPdf" -ForegroundColor Green
    }
}

Write-Host "Done!" -ForegroundColor Green
