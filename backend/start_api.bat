@echo off
echo ============================================================
echo  Malaria Detection API Server
echo ============================================================
echo.
echo Checking if model file exists...
if not exist "malaria_finetune_stage2.h5" (
    echo.
    echo ERROR: Model file not found!
    echo Please place 'malaria_finetune_stage2.h5' in the backend folder
    echo.
    pause
    exit /b 1
)
echo Model file found!
echo.
echo Starting Flask server...
echo.
python malaria_api.py
pause
