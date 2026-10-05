import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import Alumnos from "./pages/Alumnos";
import RegistroProfesor from "./pages/RegistroProfesor";
import { FondoArcade, estilos, colores } from "./pages/EstilosArcade";

// Estilos de los dos botones de la pantalla de profesores
const estiloBotonLink = {
  ...estilos.boton,
  display: "block",
  boxSizing: "border-box",
  textAlign: "center",
  textDecoration: "none",
  marginBottom: 16,
};

const estiloBotonLinkSecundario = {
  ...estiloBotonLink,
  background: "transparent",
  color: colores.acento,
  border: `2px solid ${colores.acento}`,
  marginBottom: 0,
};

function Inicio() {
  return (
    <div>
      <h1>Arcade - Panel</h1>
      <p>
        <Link to="/registro">Ir a registro</Link>
      </p>
      <p>
        <Link to="/profesores">Ir a profesores</Link>
      </p>
    </div>
  );
}

function Profesores() {
  return (
    <FondoArcade>
      <div style={estilos.contenedor}>
        <h1 style={estilos.titulo}>PROFESORES</h1>

        <div style={estilos.tarjeta}>
          <Link to="/login" style={estiloBotonLink}>
            INICIAR SESIÓN
          </Link>
          <Link to="/registro-profesor" style={estiloBotonLinkSecundario}>
            REGISTRARME
          </Link>
        </div>
      </div>
    </FondoArcade>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/profesores" element={<Profesores />} />
        <Route path="/login" element={<Login />} />
        <Route path="/alumnos" element={<Alumnos />} />
        <Route path="/registro-profesor" element={<RegistroProfesor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;