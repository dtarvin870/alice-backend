@echo off
echo ==========================================================
echo       DEPLOYMENT PACKAGE AUTOMATICALLY PREPARED
echo ==========================================================
echo.
echo Your ready-to-upload files are located in:
echo    .\READY_TO_DEPLOY
echo.
echo INSIDE THAT FOLDER YOU WILL FIIND:
echo.
echo 1. [alice] Folder
echo    - This contains your WEBSITE (HTML, CSS, JS).
echo    - ACTION: Upload the CONTENTS of this folder to 'public_html/alice' on your hosting.
echo.
echo 2. [alice-api] Folder
echo    - This contains your BACKEND SERVER.
echo    - ACTION: Upload the CONTENTS of this folder to your Node.js App folder (e.g., 'alice-api').
echo    - IMPORTANT: After uploading, go to cPanel -> Node.js App -> Click 'Run NPM Install'.
echo.
echo ==========================================================
echo Opening folder now...
explorer .\READY_TO_DEPLOY
pause
