@echo off
setlocal

REM ===========================================
REM AutoCare Pro Dashboard - Quick Start Script (Windows)
REM ===========================================

echo 🚀 AutoCare Pro Dashboard - Démarrage rapide
echo =============================================

REM Vérification de Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé. Veuillez installer Node.js 16+ avant de continuer.
    echo 🔗 Téléchargez Node.js sur: https://nodejs.org/
    pause
    exit /b 1
)

REM Vérification de npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas disponible. Veuillez réinstaller Node.js.
    pause
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_MAJOR=%%a
set NODE_MAJOR=%NODE_MAJOR:~1%
if %NODE_MAJOR% lss 16 (
    echo ❌ Version Node.js trop ancienne. Version 16+ requise.
    pause
    exit /b 1
)

echo ✅ Node.js détecté

REM Nettoyage des installations précédentes
echo 🧹 Nettoyage des fichiers existants...

if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo    - node_modules supprimé
)

if exist "package-lock.json" (
    del /q "package-lock.json"
    echo    - package-lock.json supprimé
)

if exist "yarn.lock" (
    del /q "yarn.lock"
    echo    - yarn.lock supprimé
)

REM Vérification du package.json
if not exist "package.json" (
    echo ❌ package.json non trouvé. Assurez-vous d'être dans le bon répertoire.
    pause
    exit /b 1
)

REM Installation des dépendances
echo 📦 Installation des dépendances...
npm install

if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dépendances.
    echo 💡 Essayez de supprimer le cache npm:
    echo    npm cache clean --force
    echo    puis relancez ce script.
    pause
    exit /b 1
)

echo ✅ Dépendances installées avec succès

REM Vérification de la structure du projet
echo 🔍 Vérification de la structure du projet...

set "files=src\App.jsx src\index.jsx src\index.css public\index.html tailwind.config.js"
for %%f in (%files%) do (
    if not exist "%%f" (
        echo ❌ Fichier manquant: %%f
        pause
        exit /b 1
    )
)

echo ✅ Structure du projet validée

REM Configuration des variables d'environnement
if not exist ".env" (
    if exist ".env.example" (
        echo 📝 Création du fichier .env...
        copy ".env.example" ".env" >nul
        echo ✅ Fichier .env créé depuis .env.example
        echo 📝 Pensez à configurer vos clés API Google Sheets dans le fichier .env
    ) else (
        echo 📝 Création d'un fichier .env minimal...
        (
            echo # AutoCare Pro Dashboard - Configuration
            echo REACT_APP_NAME=AutoCare Pro Dashboard
            echo REACT_APP_VERSION=2.1.0
            echo REACT_APP_ENVIRONMENT=development
            echo.
            echo # Google Sheets ^(optionnel - remplacez par vos vraies valeurs^)
            echo REACT_APP_GOOGLE_SHEET_ID=your-sheet-id-here
            echo REACT_APP_GOOGLE_API_KEY=your-api-key-here
            echo.
            echo # Features
            echo REACT_APP_ENABLE_GOOGLE_SHEETS=false
            echo REACT_APP_ENABLE_DEBUG_MODE=true
        ) > .env
        echo ✅ Fichier .env minimal créé
    )
)

REM Vérification de la compilation
echo 🔨 Vérification de la compilation...
npm run build >nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ Compilation réussie
    if exist "build" rmdir /s /q "build"
) else (
    echo ⚠️  Erreur de compilation détectée, mais on continue...
)

REM Affichage des informations utiles
echo.
echo 🎉 Installation terminée avec succès !
echo =========================================
echo.
echo 📋 Commandes disponibles:
echo    npm start           - Démarrer en mode développement
echo    npm run build       - Créer une version de production
echo    npm test            - Lancer les tests
echo    npm run lint        - Vérifier le code
echo.
echo 🔧 Configuration:
echo    - Port par défaut: http://localhost:3000
echo    - Fichier de config: .env
echo    - Documentation: README.md
echo.
echo 🚀 Pour démarrer l'application:
echo    npm start
echo.

REM Proposition de démarrage automatique
set /p choice="🤔 Voulez-vous démarrer l'application maintenant ? (y/N): "
if /i "%choice%"=="y" (
    echo 🚀 Démarrage de l'application...
    npm start
) else (
    echo 👋 Parfait ! Lancez 'npm start' quand vous serez prêt.
)

pause