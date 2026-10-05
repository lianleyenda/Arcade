import { useState } from "react";
import { FondoArcade, estilos } from "./EstilosArcade";

// Mientras probás en tu compu, el backend corre en localhost.
// Cuando lo suban al servidor del colegio, esto va a tener que
// cambiar por la IP real del servidor.
const API_URL = "http://localhost:5000/api";

function Registro() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState(""); // "error" o "exito"
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setMensaje("");

    if (password !== confirmarPassword) {
      setMensaje("Las contraseñas no coinciden");
      setTipoMensaje("error");
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await fetch(`${API_URL}/registrar-estudiante`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellido, email, password }),
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        setMensaje("¡Cuenta creada! Ya podés iniciar sesión en el arcade.");
        setTipoMensaje("exito");
        setNombre("");
        setApellido("");
        setEmail("");
        setPassword("");
        setConfirmarPassword("");
      } else {
        setMensaje(datos.error || "No se pudo crear la cuenta");
        setTipoMensaje("error");
      }
    } catch (error) {
      setMensaje("No se pudo conectar con el servidor");
      setTipoMensaje("error");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <FondoArcade>
      <div style={estilos.contenedor}>
        <h1 style={estilos.titulo}>CREAR CUENTA</h1>

        <div style={estilos.tarjeta}>
          <form onSubmit={manejarEnvio}>
            <label style={estilos.label}>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              style={estilos.input}
            />

            <label style={estilos.label}>Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
              style={estilos.input}
            />

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
              minLength={8}
              required
              style={estilos.input}
            />

            <label style={estilos.label}>Confirmar contraseña</label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              minLength={8}
              required
              style={estilos.input}
            />

            <button type="submit" disabled={enviando} style={estilos.boton}>
              {enviando ? "CREANDO CUENTA..." : "CREAR CUENTA"}
            </button>
          </form>
        </div>

        {mensaje && (
          <p style={tipoMensaje === "error" ? estilos.mensajeError : estilos.mensajeExito}>
            {mensaje}
          </p>
        )}
      </div>
    </FondoArcade>
  );
}

export default Registro;