import { useEffect, useRef, useState } from "react";
import { FondoArcade, Etiqueta, Tarjeta, EnlaceVolver } from "./ComponentesArcade";

// "alIngresar(contraseña)" devuelve true si la contraseña es correcta.
function ZonaRestringida({ alIngresar }) {
  const campo = useRef(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    campo.current?.focus();
  }, []);

  function enviar(evento) {
    evento.preventDefault();
    if (!alIngresar(password)) {
      setPassword("");
      setError("Contraseña incorrecta");
      campo.current?.focus();
    }
  }

  return (
    <FondoArcade>
      <Tarjeta tono="pink">
        <Etiqueta tono="pink">ZONA DE PROFESORES</Etiqueta>
        <h2>ZONA<br /><em>RESTRINGIDA</em></h2>
        <p className="card-copy">Ingresá la contraseña para acceder</p>

        <form onSubmit={enviar}>
          <label htmlFor="zona-password">Contraseña</label>
          <input
            ref={campo}
            id="zona-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={error ? "has-error" : ""}
            required
          />
          {error && <p className="message error">{error}</p>}
          <button className="primary-button pink">ACCEDER <span>→</span></button>
        </form>

        <EnlaceVolver a="/" />
      </Tarjeta>
    </FondoArcade>
  );
}

export default ZonaRestringida;
