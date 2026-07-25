@echo off
chcp 65001 >nul
title Voice-Studio - 标签页启动器

cd /d "%~dp0"

:: 启动后端
wt -w 0 new-tab -d "%~dp0." -- cmd /k "venv\Scripts\python.exe" ".\backend\run.py"

:: 启动前端（%~dp0frontend 没有尾反斜杠问题）
wt -w 0 new-tab -d "%~dp0frontend" -- cmd /k npm run dev

echo 已在新标签页启动前后端
pause