@echo off
title Build AAB Release Kasir Cuba
echo ========================================================
echo MEMULAI PROSES BUILD AAB (RELEASE) UNTUK PLAYSTORE
echo ========================================================
echo.
echo [1/3] Meng-compile aplikasi web (npm run build)...
call npm run build
if %ERRORLEVEL% neq 0 (
  echo.
  echo ERROR: Gagal mem-build aplikasi web.
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Menyinkronkan aset ke folder Android (npx cap sync)...
call npx cap sync android
if %ERRORLEVEL% neq 0 (
  echo.
  echo ERROR: Gagal sinkronisasi Capacitor.
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Membangun file AAB (App Bundle) menggunakan Gradle...
cd android
call gradlew.bat bundleRelease
if %ERRORLEVEL% neq 0 (
  echo.
  echo ERROR: Gagal build AAB. Pastikan konfigurasi release.keystore sudah benar.
  cd ..
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo BUILD BERHASIL! File AAB (Release) telah dibuat.
echo Membuka folder lokasi file AAB...
echo File ini yang akan di-upload ke Google Play Console.
echo ========================================================
explorer.exe "app\build\outputs\bundle\release"
cd ..
pause
