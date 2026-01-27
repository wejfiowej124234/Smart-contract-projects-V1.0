@echo off
chcp 65001 >nul
echo 正在自动生成PDF文件...
echo.

cd /d "%~dp0"
call npm run slides:html:all >nul 2>&1

echo 请稍候，正在使用浏览器生成PDF...
echo.

powershell -ExecutionPolicy Bypass -Command "& { $ErrorActionPreference='SilentlyContinue'; $zhHtml='slides\dist\INTERVIEW_DECK.zh-cn.html'; $zhPdf='slides\dist\INTERVIEW_DECK.zh-cn.pdf'; $enHtml='slides\dist\INTERVIEW_DECK.en.html'; $enPdf='slides\dist\INTERVIEW_DECK.en.pdf'; if (Test-Path $zhHtml) { Start-Process msedge.exe -ArgumentList '--headless','--disable-gpu','--print-to-pdf=$zhPdf','--print-to-pdf-no-header',\"file:///$((Resolve-Path $zhHtml).Path.Replace('\','/'))\" -Wait -WindowStyle Hidden }; Start-Sleep -Seconds 3; if (Test-Path $enHtml) { Start-Process msedge.exe -ArgumentList '--headless','--disable-gpu','--print-to-pdf=$enPdf','--print-to-pdf-no-header',\"file:///$((Resolve-Path $enHtml).Path.Replace('\','/'))\" -Wait -WindowStyle Hidden }; Start-Sleep -Seconds 3; if (Test-Path $zhPdf) { Write-Host '✓ 中文PDF已生成' -ForegroundColor Green } else { Write-Host '✗ 中文PDF生成失败，请使用VS Code Marp插件' -ForegroundColor Yellow }; if (Test-Path $enPdf) { Write-Host '✓ 英文PDF已生成' -ForegroundColor Green } else { Write-Host '✗ 英文PDF生成失败，请使用VS Code Marp插件' -ForegroundColor Yellow } }"

echo.
echo 完成！
pause
