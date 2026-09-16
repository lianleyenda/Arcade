#!/bin/bash

# 1. Crear el entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "Creando entorno virtual..."
    python3 -m venv venv
else
    echo "El entorno virtual ya existe."
fi

# 2. Activar el entorno e instalar dependencias
echo "Activando entorno virtual e instalando paquetes..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "¡Proceso finalizado con éxito!"
echo "Para activar el entorno manualmente ejecuta: source venv/bin/activate"
