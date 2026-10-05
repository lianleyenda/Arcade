import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FondoArcade, estilos } from "./EstilosArcade";

const API_URL = "http://localhost:5000/api";

// Modo de prueba: no se conecta al backend, cualquier email/contraseña
// entra. Poner en false cuando el backend esté corriendo de verdad.
const MODO_PRUEBA = false;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setMensaje("");
    setEnviando(true);

    if (MODO_PRUEBA) {
      // Simula un login exitoso, sin backend
      localStorage.setItem(
        "profesor",
        JSON.stringify({ email, nombre: "Profesor", apellido: "de prueba" })
      );
      setEnviando(false);
      navegar("/alumnos");
      return;
    }

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
        navegar("/alumnos");
      } else {
        setMensaje(datos.error || "No se pudo iniciar sesión");
      }
    } catch (error) {
      setMensaje("No se pudo conectar con el servidor");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <FondoArcade>
      <div style={estilos.contenedor}>
        <h1 style={estilos.titulo}>LOGIN PROFESOR</h1>

        {MODO_PRUEBA && (
          <p style={estilos.aviso}>
            Modo prueba activo: cualquier email/contraseña te deja entrar.
          </p>
        )}

        <div style={estilos.tarjeta}>
          <form onSubmit={manejarEnvio}>
            <label style={estilos.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={estilos.input}
            />

            <label style={estilos.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={estilos.input}
            />

            <button type="submit" disabled={enviando} style={estilos.boton}>
              {enviando ? "INGRESANDO..." : "INGRESAR"}
            </button>
          </form>
        </div>

        {mensaje && <p style={estilos.mensajeError}>{mensaje}</p>}
      </div>
    </FondoArcade>
  );
}

export default Login;