# 1. Crear el entorno virtual si no existe
If (-Not (Test-Path -Path "venv")) {
    Write-Host "Creando entorno virtual..." -ForegroundColor Green
    python -m venv venv
} Else {
    Write-Host "El entorno virtual ya existe." -ForegroundColor Yellow
}

# 2. Activar el entorno e instalar dependencias
Write-Host "Activando entorno virtual e instalando paquetes..." -ForegroundColor Green
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

Write-Host "¡Proceso finalizado con éxito!" -ForegroundColor Green
Write-Host "Para activar el entorno manualmente ejecuta: .\venv\Scripts\Activate.ps1" -ForegroundColor Cyan
