import datetime
import os
import requests

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
from itsdangerous import (
    URLSafeTimedSerializer,
    BadSignature,
    SignatureExpired
)
from werkzeug.security import check_password_hash, generate_password_hash


# ============================================================
# CONFIGURACIÓN
# ============================================================

load_dotenv()

app = Flask(__name__)
CORS(app)

# URL de PocketBase
POCKETBASE_URL = "http://10.56.31.32:8090/api"

# Credenciales del administrador de PocketBase
ADMIN_EMAIL = os.getenv("mail_admin")
ADMIN_PASSWORD = os.getenv("passwor_admin")

# Clave secreta para generar los tokens de los usuarios
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "clave-secreta-arcade"
)

serializer = URLSafeTimedSerializer(SECRET_KEY)

# Token del administrador de PocketBase
token_actual = None


# ============================================================
# TOKEN ADMINISTRADOR DE POCKETBASE
# ============================================================

def obtener_token():
    """
    Obtiene el token del administrador de PocketBase.

    Este token NO es el token del usuario.
    Lo utiliza Flask para comunicarse con PocketBase.
    """

    global token_actual

    # Si ya tenemos un token, reutilizarlo
    if token_actual:
        return token_actual

    url = (
        f"{POCKETBASE_URL}"
        "/collections/_superusers/auth-with-password"
    )

    res = requests.post(
        url,
        json={
            "identity": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
    )

    if res.status_code == 200:

        token_actual = res.json().get("token")

        return token_actual

    raise Exception(
        f"No se pudo autenticar. "
        f"Respuesta: {res.status_code} - {res.text}"
    )


# ============================================================
# AUTENTICACIÓN DE USUARIOS
# ============================================================

def crear_token_usuario(usuario_id, email, rol):
    """
    Crea un token para el usuario que inició sesión.
    """

    datos = {
        "id": usuario_id,
        "email": email,
        "rol": rol
    }

    token = serializer.dumps(datos)

    return token


def obtener_usuario_token():
    """
    Lee y valida el token enviado por el cliente.

    Formato esperado:

    Authorization: Bearer TOKEN
    """

    auth_header = request.headers.get("Authorization")

    # No se envió Authorization
    if not auth_header:
        return None, "Token no proporcionado"

    # El formato debe ser Bearer TOKEN
    if not auth_header.startswith("Bearer "):
        return None, "Formato de token inválido"

    token = auth_header.split(" ", 1)[1]

    try:

        datos = serializer.loads(
            token,
            max_age=60 * 60 * 8
        )

        return datos, None

    except SignatureExpired:

        return None, "El token ha expirado"

    except BadSignature:

        return None, "El token no es válido"


def requiere_autenticacion(f):
    """
    Decorador que exige que exista
    un token válido.
    """

    @wraps(f)
    def funcion_protegida(*args, **kwargs):

        usuario, error = obtener_usuario_token()

        if error:

            return jsonify({
                "error": error
            }), 401

        # Guardar información del usuario
        request.usuario = usuario

        return f(*args, **kwargs)

    return funcion_protegida


def requiere_rol(rol_requerido):
    """
    Decorador que exige:
    1. Token válido.
    2. Rol específico.
    """

    def decorador(f):

        @wraps(f)
        def funcion_protegida(*args, **kwargs):

            usuario, error = obtener_usuario_token()

            if error:

                return jsonify({
                    "error": error
                }), 401

            # Verificar rol
            if usuario.get("rol") != rol_requerido:

                return jsonify({
                    "error": (
                        "No tienes permisos para "
                        "realizar esta operación"
                    )
                }), 403

            # Guardar usuario
            request.usuario = usuario

            return f(*args, **kwargs)

        return funcion_protegida

    return decorador


# ============================================================
# REGISTRO DE ESTUDIANTE
# ============================================================

@app.route("/api/registrar-estudiante", methods=["POST"])
def registrar_estudiante():

    global token_actual

    datos = request.get_json()

    nombre = datos.get("nombre")
    apellido = datos.get("apellido")
    email = datos.get("email")
    password = datos.get("password")

    # Validar datos
    if not nombre or not apellido or not email or not password:

        return jsonify({
            "error": (
                "Nombre, apellido, email y contraseña "
                "son requeridos"
            )
        }), 400

    # ========================================================
    # 1. Obtener token admin
    # ========================================================

    try:

        token = obtener_token()

    except Exception as e:

        return jsonify({
            "error": "Error de autenticación admin",
            "detalle": str(e)
        }), 500

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # ========================================================
    # 2. Verificar email
    # ========================================================

    res_email = requests.get(
        f"{POCKETBASE_URL}/collections/Estudiantes/records",
        params={
            "filter": f'email="{email}"'
        },
        headers=headers
    )

    if res_email.status_code == 200:

        estudiantes = res_email.json()

        if estudiantes.get("totalItems", 0) > 0:

            return jsonify({
                "error": (
                    "Ya existe un estudiante "
                    "con ese email"
                )
            }), 400

    # ========================================================
    # 3. Verificar nombre y apellido
    # ========================================================

    res_persona_existente = requests.get(
        f"{POCKETBASE_URL}/collections/Personas/records",
        params={
            "filter": (
                f'nombre="{nombre}" '
                f'&& apellido="{apellido}"'
            )
        },
        headers=headers
    )

    if res_persona_existente.status_code == 200:

        personas = res_persona_existente.json()

        if personas.get("totalItems", 0) > 0:

            return jsonify({
                "error": (
                    "Ya existe una persona "
                    "con ese nombre y apellido"
                )
            }), 400

    # ========================================================
    # 4. Crear Persona
    # ========================================================

    res_persona = requests.post(
        f"{POCKETBASE_URL}/collections/Personas/records",
        json={
            "nombre": nombre,
            "apellido": apellido
        },
        headers=headers
    )

    # Si el token expiró
    if res_persona.status_code in [401, 403]:

        token_actual = None

        try:

            token = obtener_token()

            headers = {
                "Authorization": f"Bearer {token}"
            }

            res_persona = requests.post(
                f"{POCKETBASE_URL}/collections/Personas/records",
                json={
                    "nombre": nombre,
                    "apellido": apellido
                },
                headers=headers
            )

        except Exception as e:

            return jsonify({
                "error": "Error al renovar token",
                "detalle": str(e)
            }), 500

    # Verificar creación
    if res_persona.status_code not in [200, 201]:

        return jsonify({
            "error": "No se pudo registrar la persona",
            "status_pocketbase": res_persona.status_code,
            "detalles": res_persona.json()
        }), 400

    persona_id = res_persona.json()["id"]

    # ========================================================
    # 5. Crear estudiante
    # ========================================================

    password_encriptada = generate_password_hash(password)

    res_estudiante = requests.post(
        f"{POCKETBASE_URL}/collections/Estudiantes/records",
        json={
            "email": email,
            "password": password_encriptada,
            "id_personas": persona_id
        },
        headers=headers
    )

    print(
        "STATUS ESTUDIANTE:",
        res_estudiante.status_code
    )

    print(
        "RESPUESTA ESTUDIANTE:",
        res_estudiante.text
    )

    if res_estudiante.status_code in [200, 201]:

        return jsonify({
            "status": "éxito",
            "estudiante": res_estudiante.json()
        }), 201

    return jsonify({
        "error": "No se pudo registrar el estudiante",
        "status_pocketbase": res_estudiante.status_code,
        "detalles": res_estudiante.json()
    }), 400


# ============================================================
# REGISTRO DE PROFESOR
# ============================================================

@app.route("/api/registrar-profesor", methods=["POST"])
def registrar_profesor():

    global token_actual

    datos = request.get_json()

    nombre = datos.get("nombre")
    apellido = datos.get("apellido")
    email = datos.get("email")
    password = datos.get("password")

    # Validar datos
    if not nombre or not apellido or not email or not password:

        return jsonify({
            "error": (
                "Nombre, apellido, email y contraseña "
                "son requeridos"
            )
        }), 400

    # ========================================================
    # 1. Obtener token admin
    # ========================================================

    try:

        token = obtener_token()

    except Exception as e:

        return jsonify({
            "error": "Error de autenticación admin",
            "detalle": str(e)
        }), 500

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # ========================================================
    # 2. Verificar email
    # ========================================================

    res_email = requests.get(
        f"{POCKETBASE_URL}/collections/Profesores/records",
        params={
            "filter": f'email="{email}"'
        },
        headers=headers
    )

    if res_email.status_code == 200:

        profesores = res_email.json()

        if profesores.get("totalItems", 0) > 0:

            return jsonify({
                "error": (
                    "Ya existe un profesor "
                    "con ese email"
                )
            }), 400

    # ========================================================
    # 3. Verificar nombre y apellido
    # ========================================================

    res_persona_existente = requests.get(
        f"{POCKETBASE_URL}/collections/Personas/records",
        params={
            "filter": (
                f'nombre="{nombre}" '
                f'&& apellido="{apellido}"'
            )
        },
        headers=headers
    )

    if res_persona_existente.status_code == 200:

        personas = res_persona_existente.json()

        if personas.get("totalItems", 0) > 0:

            return jsonify({
                "error": (
                    "Ya existe una persona "
                    "con ese nombre y apellido"
                )
            }), 400

    # ========================================================
    # 4. Crear Persona
    # ========================================================

    res_persona = requests.post(
        f"{POCKETBASE_URL}/collections/Personas/records",
        json={
            "nombre": nombre,
            "apellido": apellido
        },
        headers=headers
    )

    # Renovar token si expiró
    if res_persona.status_code in [401, 403]:

        token_actual = None

        try:

            token = obtener_token()

            headers = {
                "Authorization": f"Bearer {token}"
            }

            res_persona = requests.post(
                f"{POCKETBASE_URL}/collections/Personas/records",
                json={
                    "nombre": nombre,
                    "apellido": apellido
                },
                headers=headers
            )

        except Exception as e:

            return jsonify({
                "error": "Error al renovar token",
                "detalle": str(e)
            }), 500

    # Verificar Persona
    if res_persona.status_code not in [200, 201]:

        return jsonify({
            "error": "No se pudo registrar la persona",
            "status_pocketbase": res_persona.status_code,
            "detalles": res_persona.json()
        }), 400

    persona_id = res_persona.json()["id"]

    # ========================================================
    # 5. Crear Profesor
    # ========================================================

    password_encriptada = generate_password_hash(password)

    res_profesor = requests.post(
        f"{POCKETBASE_URL}/collections/Profesores/records",
        json={
            "email": email,
            "password": password_encriptada,
            "id_personas": persona_id
        },
        headers=headers
    )

    print(
        "STATUS PROFESOR:",
        res_profesor.status_code
    )

    print(
        "RESPUESTA PROFESOR:",
        res_profesor.text
    )

    if res_profesor.status_code in [200, 201]:

        return jsonify({
            "status": "éxito",
            "profesor": res_profesor.json()
        }), 201

    return jsonify({
        "error": "No se pudo registrar el profesor",
        "status_pocketbase": res_profesor.status_code,
        "detalles": res_profesor.json()
    }), 400


# ============================================================
# LOGIN PROFESOR
# ============================================================

# ============================================================
# LOGIN PROFESOR
# ============================================================

@app.route("/api/iniciar-sesion/profesores", methods=["POST"])
def iniciar_sesion_profesor():

    datos = request.get_json()

    email = datos.get("email")
    password = datos.get("password")

    if not email or not password:

        return jsonify({
            "error": "Email y contraseña son requeridos"
        }), 400

    # ========================================================
    # 1. Obtener token del superusuario
    # ========================================================

    try:

        token = obtener_token()

    except Exception as e:

        return jsonify({
            "error": "Error de autenticación admin",
            "detalle": str(e)
        }), 500

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # ========================================================
    # 2. Buscar profesor en PocketBase
    # ========================================================

    res_busqueda = requests.get(
        f"{POCKETBASE_URL}/collections/Profesores/records",
        params={
            "filter": f'email="{email}"',
            "expand": "id_personas"
        },
        headers=headers
    )

    # Mostrar información para comprobar qué devuelve PocketBase
    print("STATUS BUSQUEDA PROFESOR:", res_busqueda.status_code)
    print("RESPUESTA POCKETBASE:", res_busqueda.text)

    if res_busqueda.status_code != 200:

        return jsonify({
            "error": "Error al buscar profesor",
            "status_pocketbase": res_busqueda.status_code,
            "detalles": res_busqueda.text
        }), 500

    items = res_busqueda.json().get("items", [])

    if not items:

        return jsonify({
            "error": "Usuario no encontrado"
        }), 404

    usuario = items[0]

    # ========================================================
    # 3. Verificar contraseña
    # ========================================================

    if not check_password_hash(
        usuario["password"],
        password
    ):

        return jsonify({
            "error": "Contraseña incorrecta"
        }), 401

    # ========================================================
    # 4. Obtener Persona
    # ========================================================

    persona = (
        usuario
        .get("expand", {})
        .get("id_personas", {})
    )

    # ========================================================
    # 5. Crear token de nuestra aplicación
    # ========================================================

    token_usuario = crear_token_usuario(
        usuario["id"],
        usuario["email"],
        "profesor"
    )

    # ========================================================
    # 6. Respuesta
    # ========================================================

    return jsonify({
        "status": "éxito",
        "token": token_usuario,
        "usuario": {
            "id": usuario["id"],
            "email": usuario["email"],
            "nombre": persona.get("nombre"),
            "apellido": persona.get("apellido"),
            "rol": "profesor"
        }
    }), 200

# ============================================================
# LOGIN ESTUDIANTE
# ============================================================

@app.route("/api/iniciar-sesion/estudiantes", methods=["POST"])
def iniciar_sesion_estudiante():

    datos = request.get_json()

    email = datos.get("email")
    password = datos.get("password")

    if not email or not password:

        return jsonify({
            "error": "Email y contraseña son requeridos"
        }), 400

    # ========================================================
    # 1. Obtener token del superusuario
    # ========================================================

    try:

        token = obtener_token()

    except Exception as e:

        return jsonify({
            "error": "Error de autenticación admin",
            "detalle": str(e)
        }), 500

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # ========================================================
    # 2. Buscar estudiante en PocketBase
    # ========================================================

    res_busqueda = requests.get(
        f"{POCKETBASE_URL}/collections/Estudiantes/records",
        params={
            "filter": f'email="{email}"',
            "expand": "id_personas"
        },
        headers=headers
    )

    print(
        "STATUS BUSQUEDA ESTUDIANTE:",
        res_busqueda.status_code
    )

    print(
        "RESPUESTA POCKETBASE:",
        res_busqueda.text
    )

    if res_busqueda.status_code != 200:

        return jsonify({
            "error": "Error al buscar estudiante",
            "status_pocketbase": res_busqueda.status_code,
            "detalles": res_busqueda.text
        }), 500

    items = res_busqueda.json().get("items", [])

    if not items:

        return jsonify({
            "error": "Usuario no encontrado"
        }), 404

    estudiante = items[0]

    # ========================================================
    # 3. Verificar contraseña
    # ========================================================

    if not check_password_hash(
        estudiante["password"],
        password
    ):

        return jsonify({
            "error": "Contraseña incorrecta"
        }), 401

    # ========================================================
    # 4. Verificar saldo
    # ========================================================

    #saldo_actual = int(estudiante.get("saldo") or 0)

    #if saldo_actual <= 0:

     #return jsonify({
      #  "error": (
       #     "No tienes saldo disponible "
        #    "para jugar"
        #)
   # }), 403
    # ========================================================
    # 5. Actualizar última fecha de uso
    # ========================================================

    fecha_actual = datetime.datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    res_patch = requests.patch(
        f"{POCKETBASE_URL}/collections/Estudiantes/records/"
        f"{estudiante['id']}",
        json={
            "ultima_fecha_uso": fecha_actual
        },
        headers=headers
    )

    # ========================================================
    # 6. Obtener datos de Persona
    # ========================================================

    persona = (
        estudiante
        .get("expand", {})
        .get("id_personas", {})
    )

    # ========================================================
    # 7. Crear token de nuestra aplicación
    # ========================================================

    token_usuario = crear_token_usuario(
        estudiante["id"],
        estudiante["email"],
        "estudiante"
    )

    # ========================================================
    # 8. Respuesta
    # ========================================================

    return jsonify({
        "status": "éxito",
        "token": token_usuario,
        "estudiante": {
            "id": estudiante["id"],
            "email": estudiante["email"],
            "nombre": persona.get("nombre"),
            "apellido": persona.get("apellido"),
           # "saldo_minutos": saldo_actual,
            "rol": "estudiante"
        }
    }), 200


# ============================================================
# RASPBERRY - DESCONTAR TIEMPO
# ============================================================

# ============================================================
# DESCONTAR TIEMPO DEL ESTUDIANTE
# SOLO ESTUDIANTES
# ============================================================

@app.route("/api/raspberry/descontar-tiempo", methods=["POST"])
@requiere_rol("estudiante")
def descontar_tiempo():

    # ========================================================
    # 1. Obtener datos enviados
    # ========================================================

    datos = request.get_json()

    minutos_jugados = datos.get(
        "minutos_jugados"
    )

    if minutos_jugados is None:

        return jsonify({
            "error": "Los minutos jugados son requeridos"
        }), 400

    # ========================================================
    # 2. Obtener ID desde el token del estudiante
    # ========================================================

    estudiante_id = request.usuario["id"]

    # ========================================================
    # 3. Obtener token del superusuario de PocketBase
    # ========================================================

    try:

        token = obtener_token()

    except Exception as e:

        print(
            "ERROR AL OBTENER TOKEN POCKETBASE:",
            str(e)
        )

        return jsonify({
            "error": "Error de autenticación admin",
            "detalle": str(e)
        }), 500

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # ========================================================
    # 4. Consultar estudiante en PocketBase
    # ========================================================

    try:

        res_estudiante = requests.get(
            f"{POCKETBASE_URL}/collections/Estudiantes/records/"
            f"{estudiante_id}",
            headers=headers
        )

    except requests.RequestException as e:

        print(
            "ERROR DE CONEXIÓN CON POCKETBASE:",
            str(e)
        )

        return jsonify({
            "error": "No se pudo conectar con PocketBase",
            "detalle": str(e)
        }), 500

    print(
        "STATUS CONSULTA ESTUDIANTE:",
        res_estudiante.status_code
    )

    print(
        "RESPUESTA POCKETBASE:",
        res_estudiante.text
    )

    if res_estudiante.status_code != 200:

        return jsonify({
            "error": "Estudiante no encontrado",
            "status_pocketbase": res_estudiante.status_code,
            "detalle": res_estudiante.text
        }), 404

    # ========================================================
    # 5. Obtener saldo actual
    # ========================================================

    saldo_actual = int(
        res_estudiante.json().get("saldo") or 0
    )

    # ========================================================
    # 6. Convertir minutos jugados
    # ========================================================

    try:

        minutos_jugados = int(
            minutos_jugados
        )

    except (ValueError, TypeError):

        return jsonify({
            "error": (
                "Los minutos jugados "
                "deben ser un número"
            )
        }), 400

    if minutos_jugados < 0:

        return jsonify({
            "error": (
                "Los minutos jugados "
                "no pueden ser negativos"
            )
        }), 400

    # ========================================================
    # 7. Calcular nuevo saldo
    # ========================================================

    nuevo_saldo = max(
        0,
        saldo_actual - minutos_jugados
    )

    # ========================================================
    # 8. Actualizar saldo en PocketBase
    # ========================================================

    try:

        res_patch = requests.patch(
            f"{POCKETBASE_URL}/collections/Estudiantes/records/"
            f"{estudiante_id}",
            json={
                "saldo": nuevo_saldo
            },
            headers=headers
        )

    except requests.RequestException as e:

        print(
            "ERROR AL ACTUALIZAR SALDO:",
            str(e)
        )

        return jsonify({
            "error": "No se pudo actualizar el saldo",
            "detalle": str(e)
        }), 500

    print(
        "STATUS ACTUALIZAR SALDO:",
        res_patch.status_code
    )

    print(
        "RESPUESTA PATCH POCKETBASE:",
        res_patch.text
    )

    if res_patch.status_code != 200:

        return jsonify({
            "error": (
                "No se pudo actualizar el saldo "
                "en la base de datos"
            ),
            "status_pocketbase": res_patch.status_code,
            "detalle": res_patch.text
        }), 500

    # ========================================================
    # 9. Respuesta final
    # ========================================================

    return jsonify({
        "status": "éxito",
        "saldo_anterior": saldo_actual,
        "minutos_jugados": minutos_jugados,
        "saldo_restante": nuevo_saldo
    }), 200


# ============================================================
# OBTENER ESTUDIANTES Y SALDO
# SOLO PROFESORES
# ============================================================

@app.route("/api/obtener-estudiantes/saldo", methods=["GET"])
@requiere_rol("profesor")
def obtener_estudiantes_saldo():

    # ========================================================
    # 1. Obtener token del superusuario de PocketBase
    # ========================================================

    try:

        token = obtener_token()

    except Exception as e:

        print(
            "ERROR AL OBTENER TOKEN POCKETBASE:",
            str(e)
        )

        return jsonify({
            "error": "Error de autenticación admin",
            "detalle": str(e)
        }), 500

    # Header que Flask utiliza para autenticarse
    # contra PocketBase
    headers = {
        "Authorization": f"Bearer {token}"
    }

    # ========================================================
    # 2. Obtener estudiantes desde PocketBase
    # ========================================================

    try:

        res_estudiantes = requests.get(
            f"{POCKETBASE_URL}/collections/Estudiantes/records",
            params={
                "expand": "id_personas"
            },
            headers=headers
        )

    except requests.RequestException as e:

        print(
            "ERROR DE CONEXIÓN CON POCKETBASE:",
            str(e)
        )

        return jsonify({
            "error": "No se pudo conectar con PocketBase",
            "detalle": str(e)
        }), 500

    # ========================================================
    # 3. Mostrar respuesta de PocketBase para depuración
    # ========================================================

    print(
        "STATUS OBTENER ESTUDIANTES:",
        res_estudiantes.status_code
    )

    print(
        "RESPUESTA POCKETBASE:",
        res_estudiantes.text
    )

    # ========================================================
    # 4. Verificar respuesta de PocketBase
    # ========================================================

    if res_estudiantes.status_code != 200:

        return jsonify({
            "error": "Error al obtener estudiantes desde PocketBase",
            "status_pocketbase": res_estudiantes.status_code,
            "detalle": res_estudiantes.text
        }), 500

    # ========================================================
    # 5. Obtener lista de estudiantes
    # ========================================================

    estudiantes = (
        res_estudiantes
        .json()
        .get("items", [])
    )

    # ========================================================
    # 6. Preparar respuesta
    # ========================================================

    estudiantes_con_saldo = []

    for est in estudiantes:

        persona = (
            est
            .get("expand", {})
            .get("id_personas", {})
        )

        # PocketBase puede devolver saldo como:
        # "15", 15, "", None, etc.
        saldo = int(
            est.get("saldo") or 0
        )

        estudiante = {

            "id": est.get("id"),

            "nombre": persona.get(
                "nombre",
                ""
            ),

            "apellido": persona.get(
                "apellido",
                ""
            ),

            "saldo": saldo,

            "ultima_fecha_uso": est.get(
                "ultima_fecha_uso"
            ) or "Nunca"
        }

        estudiantes_con_saldo.append(
            estudiante
        )

    # ========================================================
    # 7. Devolver estudiantes
    # ========================================================

    return jsonify(
        estudiantes_con_saldo
    ), 200



# ============================================================
# RECARGAR SALDO DE UN ESTUDIANTE
# SOLO PROFESORES
# ============================================================

@app.route("/api/profesor/recargar-saldo", methods=["POST"])
@requiere_rol("profesor")
def recargar_saldo():

    # ========================================================
    # 1. Obtener datos enviados
    # ========================================================

    datos = request.get_json()

    estudiante_id = datos.get("estudiante_id")
    cantidad = datos.get("cantidad")
    unidad = datos.get("unidad")

    if estudiante_id is None:
        return jsonify({
            "error": "El ID del estudiante es requerido"
        }), 400

    if cantidad is None:
        return jsonify({
            "error": "La cantidad de tiempo es requerida"
        }), 400

    if unidad is None:
        return jsonify({
            "error": (
                "La unidad de tiempo es requerida "
                "(segundos, minutos u horas)"
            )
        }), 400

    # ========================================================
    # 2. Validar cantidad
    # ========================================================

    try:
        cantidad = float(cantidad)

    except (ValueError, TypeError):

        return jsonify({
            "error": "La cantidad debe ser un número"
        }), 400

    if cantidad <= 0:

        return jsonify({
            "error": "La cantidad debe ser mayor a 0"
        }), 400

    # ========================================================
    # 3. Convertir a minutos
    # ========================================================

    unidad = unidad.lower().strip()

    if unidad in ["segundo", "segundos", "s"]:

        minutos_agregados = cantidad / 60

    elif unidad in ["minuto", "minutos", "m"]:

        minutos_agregados = cantidad

    elif unidad in ["hora", "horas", "h"]:

        minutos_agregados = cantidad * 60

    else:

        return jsonify({
            "error": (
                "Unidad inválida. "
                "Usa segundos, minutos u horas"
            )
        }), 400

    # ========================================================
    # 4. Obtener token de superusuario de PocketBase
    # ========================================================

    try:

        token = obtener_token()

    except Exception as e:

        return jsonify({
            "error": "Error de autenticación admin",
            "detalle": str(e)
        }), 500

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # ========================================================
    # 5. Buscar estudiante
    # ========================================================

    res_estudiante = requests.get(
        f"{POCKETBASE_URL}/collections/Estudiantes/records/"
        f"{estudiante_id}",
        headers=headers
    )

    print(
        "STATUS BUSCAR ESTUDIANTE:",
        res_estudiante.status_code
    )

    print(
        "RESPUESTA POCKETBASE:",
        res_estudiante.text
    )

    if res_estudiante.status_code != 200:

        return jsonify({
            "error": "Estudiante no encontrado",
            "status_pocketbase": res_estudiante.status_code,
            "detalle": res_estudiante.text
        }), 404

    estudiante = res_estudiante.json()

    # ========================================================
    # 6. Obtener saldo actual
    # ========================================================

    saldo_actual = float(
        estudiante.get("saldo") or 0
    )

    # ========================================================
    # 7. Calcular nuevo saldo
    # ========================================================

    nuevo_saldo = (
        saldo_actual + minutos_agregados
    )

    # ========================================================
    # 8. Actualizar saldo y unidad
    # ========================================================

    res_patch = requests.patch(
        f"{POCKETBASE_URL}/collections/Estudiantes/records/"
        f"{estudiante_id}",
        json={
            "saldo": nuevo_saldo,
            "unidad": "minutos"
        },
        headers=headers
    )

    print(
        "STATUS RECARGAR SALDO:",
        res_patch.status_code
    )

    print(
        "RESPUESTA PATCH:",
        res_patch.text
    )

    if res_patch.status_code != 200:

        return jsonify({
            "error": (
                "No se pudo actualizar "
                "el saldo"
            ),
            "status_pocketbase": res_patch.status_code,
            "detalle": res_patch.text
        }), 500

    # ========================================================
    # 9. Respuesta
    # ========================================================

    return jsonify({
        "status": "éxito",
        "estudiante_id": estudiante_id,
        "saldo_anterior": saldo_actual,
        "tiempo_agregado": cantidad,
        "unidad_ingresada": unidad,
        "minutos_agregados": minutos_agregados,
        "saldo_nuevo": nuevo_saldo,
        "unidad_saldo": "minutos"
    }), 200

# ============================================================
# EJECUTAR SERVIDOR
# ============================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5000
    )
