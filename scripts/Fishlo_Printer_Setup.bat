@echo off
setlocal EnableDelayedExpansion

echo ========================================
echo   Fishlo Printer Setup (v10 - STABLE)
echo ========================================
echo.

:: 1. Check for Admin Privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [System] Requesting Administrator permission...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: 2. Prepare Temporary Files
set "CERT_FILE=%TEMP%\fishlo_cert.pem"
set "PS_SCRIPT=%TEMP%\fishlo_engine.ps1"

:: Write the certificate to a file first (Safest way to avoid escaping issues)
echo -----BEGIN CERTIFICATE----- > "%CERT_FILE%"
echo MIIECDCCAvCgAwIBAgIUVrjOBeHYvCwq9MiZoECdx4Q11VUwDQYJKoZIhvcNAQEL >> "%CERT_FILE%"
echo BQAwVjELMAkGA1UEBhMCSU4xEDAOBgNVBAgMB0hhcnlhbmExEDAOBgNVBAcMB0d1 >> "%CERT_FILE%"
echo cmdhb24xDzANBgNVBAoMBkZpc2hsbzESMBAGA1UEAwwJZmlzaGxvLmluMB4XDTI2 >> "%CERT_FILE%"
echo MDMxMDA2MjkyMVoXDTM2MDMwODA2MjkyMVowVjELMAkGA1UEBhMCSU4xEDAOBgNV >> "%CERT_FILE%"
echo BAgMB0hhcnlhbmExEDAOBgNVBAcMB0d1cmdhb24xDzANBgNVBAoMBkZpc2hsbzES >> "%CERT_FILE%"
echo MBAGA1UEAwwJZmlzaGxvLmluMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC >> "%CERT_FILE%"
echo AQEAwG38CN6Rar0xicXa7QWyMWRAlyDXKGg2eWwng/Cyf8ZmNrHoYNlNq4BjGAJe >> "%CERT_FILE%"
echo ThdFCM5Rjav/3W1vpA0KXJjMObEiKvKE4guimFfdOnFHYtZjpiUIGX6pJsMfhE+D >> "%CERT_FILE%"
echo 6/1nzoAVgtesDvVRYELrxa612WLj2315cqD+v9+XhrGJuoRyQXjg4I7xJovpbSaH >> "%CERT_FILE%"
echo mOrk/lxu7Z6yfts0fGBjljiDjkmjHniiZ4j9dkXKMNdBDMhWFcJJ+zVxrT4snGPM >> "%CERT_FILE%"
echo t0c2zEBP8bIuRJ044WO1jJLtYQnyv0Zx0Io5nQBZVJy0oBObdpNVApAnP3POYEc3 >> "%CERT_FILE%"
echo wHeMRxaa5IC5/VGvMmX9RXVsyQIDAQABo4HNMIHKMB0GA1UdDgQWBBR1AmaX+lFo >> "%CERT_FILE%"
echo 1blmY3QGpnyyJMzJTzAfBgNVHSMEGDAWgBR1AmaX+lFo1blmY3QGpnyyJMzJTzAP >> "%CERT_FILE%"
echo BgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIB5jAxBgNVHSUEKjAoBggrBgEF >> "%CERT_FILE%"
echo BQcDAQYIKwYBBQUHAwIGCCsGAQUFBwMDBggrBgEFBQcDBDA0BgNVHREELTArggls >> "%CERT_FILE%"
echo b2NhbGhvc3SHBH8AAAGCCWZpc2hsby5pboINd3d3LmZpc2hsby5pbjANBgkqhkiG >> "%CERT_FILE%"
echo 9w0BAQsFAAOCAQEAimIVDUCzB4sybljXu1tXk5qP809MVAfMfO+XTlAkuI3O77Ky >> "%CERT_FILE%"
echo M7m2uWyqL3zY1VNsETzeta2eicgiiWZe78FJLd1ZzUtzvGFPncwrtC3MtjglrWBp >> "%CERT_FILE%"
echo N/Ly8RtP9bD+DNMSe7RGglBnPHDqTjYz3RtgeI9AhWkd6ECQrCvzC08SONpHH6eV >> "%CERT_FILE%"
echo tZ1O/eZhzyZQhMCUxc55+sbHWLYQGRR9v1QE6ZT/GAQOPX20QO+JabXqBO8audKY >> "%CERT_FILE%"
echo e9YREqkrsIM14T32rDP58NAnvaeXICsCyjusxecTRmq/FcWwjPuWnCdBy0KNa4Kj >> "%CERT_FILE%"
echo MjQHRGfDifGdgU7bnwSC90whvVj1N0CABy1xRA== >> "%CERT_FILE%"
echo -----END CERTIFICATE----- >> "%CERT_FILE%"

:: Build the PowerShell engine script
echo $certPath = "%CERT_FILE%" > "%PS_SCRIPT%"
echo $certContent = Get-Content -Path $certPath -Raw >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo Write-Host "[1/5] Force-stopping QZ Tray..." -ForegroundColor Yellow >> "%PS_SCRIPT%"
echo Stop-Process -Name "qz-tray" -Force -ErrorAction SilentlyContinue >> "%PS_SCRIPT%"
echo Stop-Process -Name "javaw" -Force -ErrorAction SilentlyContinue >> "%PS_SCRIPT%"
echo Start-Sleep -Seconds 1 >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo $qzDir = "C:\Program Files\QZ Tray" >> "%PS_SCRIPT%"
echo if (-not (Test-Path $qzDir)) { $qzDir = "C:\Program Files (x86)\QZ Tray" } >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo if (Test-Path $qzDir) { >> "%PS_SCRIPT%"
echo     Write-Host "[2/5] Installing System Trust..." -ForegroundColor Green >> "%PS_SCRIPT%"
echo     $overridePath = Join-Path $qzDir "override.crt" >> "%PS_SCRIPT%"
echo     Copy-Item -Path $certPath -Destination $overridePath -Force >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo     # Install to Windows Trusted Roots (Absolute fix for the Red Shield) >> "%PS_SCRIPT%"
echo     certutil -addstore -f "Root" $certPath ^| Out-Null >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo     Write-Host "[3/5] Updating Global Settings..." -ForegroundColor Green >> "%PS_SCRIPT%"
echo     $propFile = "$env:APPDATA\qz\qz-tray.properties" >> "%PS_SCRIPT%"
echo     $escapedPath = $overridePath.Replace("\", "\\") >> "%PS_SCRIPT%"
echo     if (Test-Path $propFile) { >> "%PS_SCRIPT%"
echo         $content = Get-Content $propFile ^| Where-Object { $_ -notmatch "authcert.override" } >> "%PS_SCRIPT%"
echo         $content += "authcert.override=$escapedPath" >> "%PS_SCRIPT%"
echo         Set-Content $propFile $content -Force >> "%PS_SCRIPT%"
echo     } else { >> "%PS_SCRIPT%"
echo         if (-not (Test-Path "$env:APPDATA\qz")) { New-Item -Path "$env:APPDATA\qz" -ItemType Directory -Force ^| Out-Null } >> "%PS_SCRIPT%"
echo         Set-Content $propFile "authcert.override=$escapedPath" -Force >> "%PS_SCRIPT%"
echo     } >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo     Write-Host "[4/5] Whitelisting with QZ Engine..." -ForegroundColor Green >> "%PS_SCRIPT%"
echo     $console = Join-Path $qzDir "qz-tray-console.exe" >> "%PS_SCRIPT%"
echo     if (Test-Path $console) { >> "%PS_SCRIPT%"
echo         Start-Process $console -ArgumentList "--whitelist `"$certPath`"" -Wait >> "%PS_SCRIPT%"
echo     } >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo     Write-Host "[5/5] Launching Fishlo Printer Mode..." -ForegroundColor Green >> "%PS_SCRIPT%"
echo     Start-Process (Join-Path $qzDir "qz-tray.exe") >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo     Add-Type -AssemblyName System.Windows.Forms >> "%PS_SCRIPT%"
echo     [System.Windows.Forms.MessageBox]::Show("Fishlo Setup Complete! Refresh your browser now.", "Fishlo Success") >> "%PS_SCRIPT%"
echo } >> "%PS_SCRIPT%"

echo [System] Executing Setup Engine...
powershell -ExecutionPolicy Bypass -File "%PS_SCRIPT%"

if %errorLevel% neq 0 (
    echo.
    echo [Error] Setup failed with exit code %errorLevel%
    pause
) else (
    echo [Success] Setup finished.
    del "%PS_SCRIPT%"
    del "%CERT_FILE%"
    timeout /t 5
)
exit /b