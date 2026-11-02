import { useNavigate } from "react-router-dom";
import { FondoArcade, Etiqueta } from "./ComponentesArcade";

function Inicio() {
  const navegar = useNavigate();

  return (
    <FondoArcade>
      <div className="home-wrap">
        <div className="brand-mark" aria-hidden="true"><span>✦</span></div>
        <Etiqueta>ARCADE ESCOLAR</Etiqueta>
        <h1>ARCADE<br /><em>ESCOLAR</em></h1>
        <p className="intro">Elegí tu acceso para entrar al juego.</p>

        <div className="choice-grid">
          <button type="button" className="choice-card cyan" onClick={() => navegar("/registro")}>
            <span className="choice-icon">◈</span>
            <strong>SOY ALUMNO</strong>
            <small>Creá tu cuenta para jugar</small>
            <span className="arrow">→</span>
          </button>
          <button type="button" className="choice-card pink" onClick={() => navegar("/profesores")}>
            <span className="choice-icon">▣</span>
            <strong>SOY PROFESOR</strong>
            <small>Panel docente</small>
            <span className="arrow">→</span>
          </button>
        </div>

        <p className="version">SISTEMA ONLINE <span /></p>
      </div>
    </FondoArcade>
  );
}

export default Inicio;
