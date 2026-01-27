@echo off
echo Generating PDF files...
echo.

cd /d "%~dp0"
call npm run slides:html:all >nul 2>&1

echo Please wait, generating PDFs using browser...
echo.

powershell -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; $zhHtml='slides\dist\INTERVIEW_DECK.zh-cn.html'; $zhPdf='slides\dist\INTERVIEW_DECK.zh-cn.pdf'; $enHtml='slides\dist\INTERVIEW_DECK.en.html'; $enPdf='slides\dist\INTERVIEW_DECK.en.pdf'; if (Test-Path $zhHtml) { $uri='file:///' + (Resolve-Path $zhHtml).Path.Replace('\','/'); Start-Process msedge.exe -ArgumentList '--headless','--disable-gpu','--print-to-pdf=$zhPdf','--print-to-pdf-no-header',$uri -Wait -WindowStyle Hidden }; Start-Sleep -Seconds 3; if (Test-Path $enHtml) { $uri='file:///' + (Resolve-Path $enHtml).Path.Replace('\','/'); Start-Process msedge.exe -ArgumentList '--headless','--disable-gpu','--print-to-pdf=$enPdf','--print-to-pdf-no-header',$uri -Wait -WindowStyle Hidden }; Start-Sleep -Seconds 3; if (Test-Path $zhPdf) { Write-Host 'Chinese PDF generated' -ForegroundColor Green } else { Write-Host 'Chinese PDF failed' -ForegroundColor Yellow }; if (Test-Path $enPdf) { Write-Host 'English PDF generated' -ForegroundColor Green } else { Write-Host 'English PDF failed' -ForegroundColor Yellow }"

echo.
echo Done!
timeout /t 3 >nul
