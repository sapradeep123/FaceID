@echo off
REM ===========================================
REM FaceID Deployment Script for Windows
REM ===========================================

setlocal enabledelayedexpansion

REM Default values
set ENVIRONMENT=production
set DOMAIN=
set SSL_EMAIL=
set BACKUP_ENABLED=true

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :start_deployment
if "%~1"=="-e" (
    set ENVIRONMENT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--environment" (
    set ENVIRONMENT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-d" (
    set DOMAIN=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--domain" (
    set DOMAIN=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-s" (
    set SSL_EMAIL=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--ssl-email" (
    set SSL_EMAIL=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-n" (
    set BACKUP_ENABLED=false
    shift
    goto :parse_args
)
if "%~1"=="--no-backup" (
    set BACKUP_ENABLED=false
    shift
    goto :parse_args
)
if "%~1"=="-h" goto :show_help
if "%~1"=="--help" goto :show_help
echo Unknown option: %~1
goto :show_help

:show_help
echo Usage: %0 [OPTIONS]
echo.
echo Options:
echo   -e, --environment ENV    Environment to deploy to (production, staging, development)
echo   -d, --domain DOMAIN      Domain name for the application
echo   -s, --ssl-email EMAIL    Email for SSL certificate registration
echo   -n, --no-backup          Skip database backup
echo   -h, --help               Show this help message
echo.
echo Examples:
echo   %0 --environment production --domain faceid.example.com --ssl-email admin@example.com
echo   %0 -e staging -d staging.faceid.example.com
echo   %0 --environment development
exit /b 0

:start_deployment
echo [INFO] Starting deployment for environment: %ENVIRONMENT%

REM Check if .env file exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo [INFO] Please copy env.example to .env and configure it:
    echo [INFO] copy env.example .env
    echo [INFO] notepad .env
    exit /b 1
)

REM Load environment variables from .env
for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
    if not "%%a"=="" if not "%%a:~0,1%"=="#" (
        set "%%a=%%b"
    )
)

REM Validate required environment variables
if "%POSTGRES_USER%"=="" (
    echo [ERROR] Required environment variable POSTGRES_USER is not set
    exit /b 1
)
if "%POSTGRES_PASSWORD%"=="" (
    echo [ERROR] Required environment variable POSTGRES_PASSWORD is not set
    exit /b 1
)
if "%POSTGRES_DB%"=="" (
    echo [ERROR] Required environment variable POSTGRES_DB is not set
    exit /b 1
)
if "%JWT_SECRET%"=="" (
    echo [ERROR] Required environment variable JWT_SECRET is not set
    exit /b 1
)
if "%INTERNAL_API_KEY%"=="" (
    echo [ERROR] Required environment variable INTERNAL_API_KEY is not set
    exit /b 1
)

REM Create backup if enabled
if "%BACKUP_ENABLED%"=="true" (
    echo [INFO] Creating database backup...
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "timestamp=%dt:~0,8%_%dt:~8,6%"
    set "backup_file=backups\faceid_backup_%ENVIRONMENT%_%timestamp%.sql"
    
    if not exist "backups" mkdir backups
    
    REM Check if pg_dump is available
    where pg_dump >nul 2>nul
    if %errorlevel%==0 (
        set "PGPASSWORD=%POSTGRES_PASSWORD%"
        pg_dump -h "%DB_HOST%" -p "%DB_PORT%" -U "%POSTGRES_USER%" -d "%POSTGRES_DB%" > "%backup_file%"
        echo [SUCCESS] Database backup created: %backup_file%
    ) else (
        echo [WARNING] pg_dump not found, skipping database backup
    )
)

REM Set environment-specific variables
set ENV=%ENVIRONMENT%
if not "%DOMAIN%"=="" (
    set CORS_ORIGINS=https://%DOMAIN%,http://%DOMAIN%
)

REM Build and deploy with Docker Compose
echo [INFO] Building and deploying application...

docker-compose down
docker-compose build --no-cache
docker-compose up -d

REM Wait for services to be healthy
echo [INFO] Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if %errorlevel%==0 (
    echo [SUCCESS] Application deployed successfully!
    
    echo [INFO] Service status:
    docker-compose ps
    
    echo [INFO] Recent logs:
    docker-compose logs --tail=20
    
    echo [INFO] Access information:
    echo   API: http://localhost:%API_PORT%
    echo   Frontend: http://localhost:%FRONTEND_PORT%
    echo   API Docs: http://localhost:%API_PORT%/docs
    
    if not "%DOMAIN%"=="" (
        echo   Production URL: https://%DOMAIN%
    )
    
) else (
    echo [ERROR] Deployment failed! Check logs:
    docker-compose logs
    exit /b 1
)

echo [SUCCESS] Deployment completed successfully!
echo [INFO] Next steps:
echo [INFO] 1. Test the application at the URLs above
echo [INFO] 2. Configure monitoring and logging
echo [INFO] 3. Set up automated backups
echo [INFO] 4. Configure firewall rules if needed

endlocal
