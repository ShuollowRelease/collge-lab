@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title photo-cut Electron 一键打包

cd /d "%~dp0"

echo ========================================
echo   photo-cut Electron 一键打包
echo ========================================
echo.

REM ---------- 检查 Node / npm ----------
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 node，请先安装 Node.js
    pause
    exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 npm，请先安装 Node.js
    pause
    exit /b 1
)

REM ---------- 读取 package.json 版本号 ----------
set "APP_VERSION="
for /f "usebackq delims=" %%v in (`node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).version"`) do set "APP_VERSION=%%v"

if not defined APP_VERSION (
    echo [错误] 无法从 package.json 读取版本号
    pause
    exit /b 1
)

echo [信息] 版本号: %APP_VERSION%
echo.

REM ---------- 依赖检查 ----------
if not exist "node_modules" (
    echo [信息] 未检测到 node_modules，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo.
)

REM ---------- 清理旧的打包输出 ----------
if exist "release" (
    echo [信息] 清理旧的 release 目录...
    rmdir /s /q "release"
)

REM ---------- 执行打包 ----------
echo [信息] 正在构建并打包（vite build + electron-builder）...
echo.
call npm run electron:build
if errorlevel 1 (
    echo.
    echo [错误] 打包失败
    pause
    exit /b 1
)

REM ---------- 整理产物（带版本号命名） ----------
set "OUT_DIR=release"
if not exist "%OUT_DIR%" (
    echo [错误] 未找到输出目录 %OUT_DIR%
    pause
    exit /b 1
)

REM 查找 NSIS 安装包
set "SETUP_FILE="
for %%f in ("%OUT_DIR%\*.exe") do set "SETUP_FILE=%%f"

if defined SETUP_FILE (
    for %%i in ("%SETUP_FILE%") do set "SETUP_NAME=%%~nxi"
    set "VERSIONED=photo-cut-v%APP_VERSION%-Setup.exe"
    if /I not "!SETUP_NAME!"=="!VERSIONED!" (
        move /Y "%SETUP_FILE%" "%OUT_DIR%\!VERSIONED!" >nul
        set "SETUP_FILE=%OUT_DIR%\!VERSIONED!"
    )
)

echo.
echo ========================================
echo   打包完成
echo ========================================
echo [信息] 版本号: %APP_VERSION%
if defined SETUP_FILE (
    echo [信息] 安装包: %SETUP_FILE%
) else (
    echo [信息] 输出目录: %OUT_DIR%
    dir /b "%OUT_DIR%"
)
echo.
pause
exit /b 0
