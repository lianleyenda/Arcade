import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FondoArcade, Etiqueta, Tarjeta, EnlaceVolver, Campo } from "./ComponentesArcade";

const API_URL = "http://10.56.31.32:5000/api";

// Devuelve true si se creó la cuenta, o un texto con el error.
async function registrarCuenta(tipo, datos) {
  const ruta = tipo === "alumno" ? "registrar-estudiante" : "registrar-profesor";
  try {
    const respuesta = await fetch(`${API_URL}/${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const resultado = await respuesta.json();
    if (respuesta.ok) return true;
    return resultado.error || "No se pudo crear la cuenta";
  } catch (e) {
    return "No se pudo conectar con el servidor";
  }
}

const VACIO = { nombre: "", apellido: "", email: "", password: "" };

// tipo: "alumno" (cian) o "profesor" (magenta)
function FormularioRegistro({ tipo }) {
  const esProfesor = tipo === "profesor";
  const tono = esProfesor ? "pink" : "cyan";
  const navegar = useNavigate();
  const temporizador = useRef(null);

  const [datos, setDatos] = useState(VACIO);
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Si se sale de la pantalla antes de tiempo, se cancela el paso automático al login
  useEffect(() => () => clearTimeout(temporizador.current), []);

  const cambiar = (campo) => (valor) => setDatos((anterior) => ({ ...anterior, [campo]: valor }));

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    setExito("");

    if (datos.password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setEnviando(true);
    const resultado = await registrarCuenta(tipo, {
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email: datos.email.trim(),
      password: datos.password,
    });
    setEnviando(false);

    if (resultado !== true) {
      setError(resultado);
      return;
    }

    setDatos(VACIO);
    setConfirmar("");
    if (esProfesor) {
      setExito("¡Cuenta de profesor creada! Te llevamos al login...");
      temporizador.current = setTimeout(() => navegar("/login"), 1500);
    } else {
      setExito("¡Cuenta creada! Ya podés iniciar sesión en el arcade.");
    }
  }

  return (
    <FondoArcade>
      <Tarjeta tono={tono} className="form-card">
        <Etiqueta tono={tono}>{esProfesor ? "REGISTRO DE PROFESOR" : "REGISTRO DE ALUMNO"}</Etiqueta>
        <h2>
          {esProfesor ? <>CREAR CUENTA<br /><em>DE PROFESOR</em></> : <>CREAR<br /><em>CUENTA</em></>}
        </h2>

        <form onSubmit={enviar}>
          <div className="name-row">
            <Campo label="Nombre" value={datos.nombre} onChange={cambiar("nombre")} autoComplete="given-name" />
            <Campo label="Apellido" value={datos.apellido} onChange={cambiar("apellido")} autoComplete="family-name" />
          </div>
          <Campo label="Email" type="email" value={datos.email} onChange={cambiar("email")} autoComplete="email" />
          <Campo label="Contraseña" type="password" minLength={8} value={datos.password} onChange={cambiar("password")} autoComplete="new-password" />
          <Campo label="Confirmar contraseña" type="password" minLength={8} value={confirmar} onChange={setConfirmar} autoComplete="new-password" />

          {error && <p className="message error">{error}</p>}
          {exito && <p className="message success">{exito}</p>}

          <button className={`primary-button ${tono}`} disabled={enviando}>
            {enviando ? "CREANDO CUENTA..." : "CREAR CUENTA"} <span>→</span>
          </button>
        </form>

        <EnlaceVolver a={esProfesor ? "/profesores" : "/"} texto={esProfesor ? "← Volver" : "← Volver al inicio"} />
      </Tarjeta>
    </FondoArcade>
  );
}

export default FormularioRegistro;
