@echo off
echo ==========================================
echo       UMBRELLA SYSTEM - AUTO SYNC
echo ==========================================
echo.

echo [1/3] Preparing files...
git add .

echo [2/3] Commitment to System...
set /p input_msg="Enter change description (or press Enter for 'System update'): "

if "%input_msg%"=="" (
    git commit -m "System update"
) else (
    git commit -m "%input_msg%"
)

echo [3/3] Synchronizing with GitHub...
git branch -M main
git push -u origin main

echo.
echo ==========================================
echo  SYNC COMPLETE: Render will now update.
echo ==========================================
pause
