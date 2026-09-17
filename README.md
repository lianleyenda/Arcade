# Arcade

Description:
Aquí alojaremos el backend y el frontend de nuestro proyecto de arcade, 
el cual contará con una base de datos. Esta será validada por el backend para 
verificar los usuarios existentes y realizar la validación de acceso al arcade,
mientras que el frontend se usará para registrar a los nuevos usuarios.


# Arcade System - Backend API

Servidor backend en Python con Flask y PocketBase para la gestión de usuarios, saldos de tiempo y control de acceso para la Raspberry Pi del Arcade.

---

## Tecnologías

- Python 3.x
- Flask / Flask-CORS
- PocketBase

---

##  Pasos para arrancar el proyecto

Abre **dos terminales en PowerShell** dentro de la carpeta `backend`:



 Terminal 1: Iniciar Base de Datos (PocketBase)

```powershell
.\pocketbase.exe serve


 Terminal 2: Iniciar Backend
   
   ```powershell
   1. Clonar el repositorio y entrar a la carpeta
Bash
cd backend
2. Activar el Entorno Virtual
En Windows (PowerShell):

PowerShell
.\venv\Scripts\Activate.ps1
(En Linux/macOS usar: source venv/bin/activate)

3. Instalar las dependencias
Bash
pip install -r requirements.txt
🏁 Ejecución del Sistema
Para un correcto funcionamiento, debes mantener corriendo dos terminales simultáneas:

Terminal 1: Servidor de Base de Datos (PocketBase)
PowerShell
.\pocketbase.exe serve
Se ejecutará en: http://127.0.0.1:8090

Terminal 2: Servidor API Backend (Flask)
PowerShell
python app.py

 
 # Configuración Previa (.env)

En la carpeta de `backend` deberás crear un archivo `.env` que contenga:

```env
mail_admin="tu-mail-de-super-user"
passwor_admin="contraseña"  
 



 