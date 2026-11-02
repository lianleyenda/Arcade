import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FondoArcade, Etiqueta, Tarjeta, EnlaceVolver, Campo } from "./ComponentesArcade";

const API_URL = "http://10.56.31.32:5000/api";

// Devuelve true si entró bien, o un texto con el error.
async function iniciarSesionProfesor(email, password) {
  try {
    const respuesta = await fetch(`${API_URL}/iniciar-sesion/profesores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const datos = await respuesta.json();

    if (respuesta.ok) {
      localStorage.setItem("profesor", JSON.stringify(datos.usuario));
      localStorage.setItem("token_profesor", datos.token);
      return true;
    }
    return datos.error || "No se pudo iniciar sesión";
  } catch (e) {
    return "No se pudo conectar con el servidor";
  }
}

function Login() {
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    setEnviando(true);
    const resultado = await iniciarSesionProfesor(email.trim(), password);
    setEnviando(false);

    if (resultado === true) navegar("/alumnos");
    else setError(resultado);
  }

  return (
    <FondoArcade>
      <Tarjeta tono="pink">
        <Etiqueta tono="pink">ACCESO DOCENTE</Etiqueta>
        <h2>LOGIN<br /><em>PROFESOR</em></h2>

        <form onSubmit={enviar}>
          <Campo label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Campo label="Contraseña" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
          {error && <p className="message error">{error}</p>}
          <button className="primary-button pink" disabled={enviando}>
            {enviando ? "INGRESANDO..." : "INGRESAR"} <span>→</span>
          </button>
        </form>

        <EnlaceVolver a="/profesores" texto="← Volver" />
      </Tarjeta>
    </FondoArcade>
  );
}

export default Login;
