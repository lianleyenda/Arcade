import datetime
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

POCKETBASE_URL = "http://127.0.0.1:8090/api/collections"


# -------------------------------------------------------------------
# 1. REGISTROS (FRONTEND WEB)
# -------------------------------------------------------------------

@app.route("/api/registrar-estudiante", methods=["POST"])
def registrar_estudiante():
    datos = request.get_json()
    nombre = datos.get("nombre")
    apellido = datos.get("apellido")
    email = datos.get("email")
    password = datos.get("password")    
    saldo_inicial = datos.get("saldo", 0)

    if not password or not email:
        return jsonify({"error": "Email y contraseña son requeridos"}), 400

    password_encriptada = generate_password_hash(password)

    # Paso 1: Crear Persona
    res_persona = requests.post(
        f"{POCKETBASE_URL}/Personas/records",
        json={"nombre": nombre, "apellido": apellido}
    )
    if res_persona.status_code != 200:
        return jsonify({"error": "No se pudo registrar la persona"}), 400

    persona_id = res_persona.json()["id"]

    # Paso 2: Crear Estudiante
    res_estudiante = requests.post(
        f"{POCKETBASE_URL}/Estudiantes/records",
        json={
            "email": email,
            "password": password_encriptada,
            "saldo": saldo_inicial,
            "id_personas": persona_id 
        }
    )
    if res_estudiante.status_code != 200:
        return jsonify({"error": "No se pudo registrar el estudiante"}), 400

    return jsonify({"status": "éxito", "estudiante": res_estudiante.json()}), 201


@app.route("/api/registrar-profesor", methods=["POST"])
def registrar_profesor():
    datos = request.get_json()
    nombre = datos.get("nombre")
    apellido = datos.get("apellido")
    email = datos.get("email")
    password = datos.get("password")    

    if not password or not email:
        return jsonify({"error": "Email y contraseña son requeridos"}), 400

    password_encriptada = generate_password_hash(password)

    res_personas = requests.post(
        f"{POCKETBASE_URL}/Personas/records",
        json={"nombre": nombre, "apellido": apellido}
    )
    if res_personas.status_code != 200:
        return jsonify({"error": "No se pudo registrar la persona"}), 400

    persona_id = res_personas.json()["id"]

    res_profesor = requests.post(
        f"{POCKETBASE_URL}/Profesores/records",
        json={
            "email": email,
            "password": password_encriptada,
            "id_personas": persona_id 
        }
    )
    if res_profesor.status_code != 200:
        return jsonify({"error": "No se pudo registrar el profesor"}), 400

    return jsonify({"status": "éxito", "profesor": res_profesor.json()}), 201


# -------------------------------------------------------------------
# 2. AUTENTICACIÓN Y FLUJO RASPBERRY PI
# -------------------------------------------------------------------

@app.route("/api/iniciar-sesion/profesores", methods=["POST"])
def iniciar_sesion_profesor():
    datos = request.get_json()
    email = datos.get("email")
    password = datos.get("password")

    res_busqueda = requests.get(
        f"{POCKETBASE_URL}/Profesores/records",
        params={"filter": f"email='{email}'", "expand": "id_personas"}
    )
    items = res_busqueda.json().get("items", []) if res_busqueda.status_code == 200 else []
    
    if not items:
        return jsonify({"error": "Usuario no encontrado"}), 404

    usuario = items[0]
    if not check_password_hash(usuario["password"], password):
        return jsonify({"error": "Contraseña incorrecta"}), 401

    persona = usuario.get("expand", {}).get("id_personas", {})
    return jsonify({
        "status": "éxito",
        "usuario": {
            "id": usuario["id"],
            "email": usuario["email"],
            "nombre": persona.get("nombre"),
            "apellido": persona.get("apellido")
        }
    }), 200


@app.route("/api/iniciar-sesion/estudiantes", methods=["POST"])
def iniciar_sesion_estudiante():
    """Usado por el script de la Raspberry Pi para validar al alumno"""
    datos = request.get_json()
    email = datos.get("email")
    password = datos.get("password")

    res_busqueda = requests.get(
        f"{POCKETBASE_URL}/Estudiantes/records",
        params={"filter": f"email='{email}'", "expand": "id_personas"}
    )
    items = res_busqueda.json().get("items", []) if res_busqueda.status_code == 200 else []

    if not items:
        return jsonify({"error": "Usuario no encontrado"}), 404

    estudiante = items[0]

    if not check_password_hash(estudiante["password"], password):
        return jsonify({"error": "Contraseña incorrecta"}), 401

    saldo_actual = estudiante.get("saldo", 0)
    if saldo_actual <= 0:
        return jsonify({"error": "No tienes saldo disponible para jugar"}), 403

    # Actualizar la fecha del último uso en PocketBase
    fecha_actual = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    requests.patch(
        f"{POCKETBASE_URL}/Estudiantes/records/{estudiante['id']}",
        json={"ultima_fecha_uso": fecha_actual}
    )

    persona = estudiante.get("expand", {}).get("id_personas", {})
    return jsonify({
        "status": "éxito",
        "estudiante": {
            "id": estudiante["id"],
            "nombre": persona.get("nombre"),
            "apellido": persona.get("apellido"),
            "saldo_minutos": saldo_actual
        }
    }), 200


@app.route("/api/raspberry/descontar-tiempo", methods=["POST"])
def descontar_tiempo():
    """Usado por la Raspberry Pi al finalizar o cerrar sesión"""
    datos = request.get_json()
    estudiante_id = datos.get("estudiante_id")
    minutos_jugados = datos.get("minutos_jugados")

    if not estudiante_id or minutos_jugados is None:
        return jsonify({"error": "ID de estudiante y minutos jugados son requeridos"}), 400

    # Consultar saldo actual del estudiante
    res_estudiante = requests.get(f"{POCKETBASE_URL}/Estudiantes/records/{estudiante_id}")
    if res_estudiante.status_code != 200:
        return jsonify({"error": "Estudiante no encontrado"}), 404

    saldo_actual = res_estudiante.json().get("saldo", 0)
    nuevo_saldo = max(0, saldo_actual - int(minutos_jugados))

    # Actualizar nuevo saldo en PocketBase
    res_patch = requests.patch(
        f"{POCKETBASE_URL}/Estudiantes/records/{estudiante_id}",
        json={"saldo": nuevo_saldo}
    )

    if res_patch.status_code != 200:
        return jsonify({"error": "No se pudo actualizar el saldo en la base de datos"}), 500

    return jsonify({
        "status": "éxito",
        "saldo_restante": nuevo_saldo
    }), 200


# -------------------------------------------------------------------
# 3. GESTIÓN DE SALDO (FRONTEND WEB PROFESOR)
# -------------------------------------------------------------------

@app.route("/api/obtener-estudiantes/saldo", methods=["GET"])
def obtener_estudiantes_saldo():
    res_estudiantes = requests.get(
        f"{POCKETBASE_URL}/Estudiantes/records",
        params={"expand": "id_personas"}
    )
    if res_estudiantes.status_code != 200:
        return jsonify({"error": "Error al conectar con la base de datos"}), 500

    estudiantes = res_estudiantes.json().get("items", [])

    estudiantes_con_saldo = [
        {
            "id": est.get("id"),
            "nombre": est.get("expand", {}).get("id_personas", {}).get("nombre", ""),
            "apellido": est.get("expand", {}).get("id_personas", {}).get("apellido", ""),
            "saldo": est.get("saldo", 0),
            "ultima_fecha_uso": est.get("ultima_fecha_uso", "Nunca")
        }
        for est in estudiantes
    ]

    return jsonify(estudiantes_con_saldo), 200


@app.route("/api/profesor/recargar-saldo", methods=["POST"])
def recargar_saldo():
    """Permite al profesor sumar minutos al saldo actual del alumno"""
    datos = request.get_json()
    estudiante_id = datos.get("estudiante_id")
    minutos_a_sumar = datos.get("minutos_a_sumar")

    if not estudiante_id or minutos_a_sumar is None:
        return jsonify({"error": "ID del estudiante y minutos a sumar son requeridos"}), 400

    res_estudiante = requests.get(f"{POCKETBASE_URL}/Estudiantes/records/{estudiante_id}")
    if res_estudiante.status_code != 200:
        return jsonify({"error": "Estudiante no encontrado"}), 404

    saldo_actual = res_estudiante.json().get("saldo", 0)
    nuevo_saldo = saldo_actual + int(minutos_a_sumar)

    res_patch = requests.patch(
        f"{POCKETBASE_URL}/Estudiantes/records/{estudiante_id}",
        json={"saldo": nuevo_saldo}
    )

    if res_patch.status_code != 200:
        return jsonify({"error": "No se pudo actualizar el saldo"}), 500

    return jsonify({
        "status": "éxito",
        "nuevo_saldo": nuevo_saldo
    }), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)