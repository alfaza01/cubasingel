@echo off
title Build APK Kasir Cuba
echo ========================================================
echo MEMULAI PROSES BUILD APK KASIR CUBA SINGEL
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
echo [3/3] Membangun file APK menggunakan Gradle...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% neq 0 (
  echo.
  echo ERROR: Gagal build APK. Pastikan Java dan SDK Android sudah benar.
  cd ..
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo BUILD BERHASIL! File APK telah dibuat.
echo Membuka folder lokasi file APK...
echo ========================================================
explorer.exe "app\build\outputs\apk\debug"
cd ..
pause
