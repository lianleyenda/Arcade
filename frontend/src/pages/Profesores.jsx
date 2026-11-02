import { useNavigate } from "react-router-dom";
import { FondoArcade, Etiqueta, Tarjeta, EnlaceVolver } from "./ComponentesArcade";

function Profesores() {
  const navegar = useNavigate();

  return (
    <FondoArcade>
      <Tarjeta tono="pink">
        <Etiqueta tono="pink">ZONA DE PROFESORES</Etiqueta>
        <h2>PROFESORES</h2>
        <p className="card-copy">¿Qué querés hacer?</p>

        <div className="stack-buttons">
          <button type="button" className="primary-button pink" onClick={() => navegar("/login")}>
            INICIAR SESIÓN <span>→</span>
          </button>
          <button type="button" className="outline-button pink" onClick={() => navegar("/registro-profesor")}>
            REGISTRARME <span>+</span>
          </button>
        </div>

        <EnlaceVolver a="/" />
      </Tarjeta>
    </FondoArcade>
  );
}

export default Profesores;
