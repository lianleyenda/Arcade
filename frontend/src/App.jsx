import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Inicio from "./pages/Inicio";
import Registro from "./pages/Registro";
import RegistroProfesor from "./pages/RegistroProfesor";
import Profesores from "./pages/Profesores";
import Login from "./pages/Login";
import Alumnos from "./pages/Alumnos";
import ZonaRestringida from "./pages/ZonaRestringida";

// Contraseña que pide la zona de profesores (cambiala por la que prefieras)
const CONTRASENA_SECRETA = "arcade123";

// Protege una pantalla: pide la contraseña una sola vez por pestaña
function RutaProtegida({ children }) {
  const [autorizado, setAutorizado] = useState(
    () => sessionStorage.getItem("arcade_profesores_auth") === "true"
  );

  function ingresar(contrasena) {
    if (contrasena !== CONTRASENA_SECRETA) return false;
    sessionStorage.setItem("arcade_profesores_auth", "true");
    setAutorizado(true);
    return true;
  }

  if (!autorizado) return <ZonaRestringida alIngresar={ingresar} />;
  return children;
}

export function Rutas() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Inicio />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/alumnos" element={<Alumnos />} />

      {/* Rutas de profesores (piden la contraseña de la zona restringida) */}
      <Route path="/profesores" element={<RutaProtegida><Profesores /></RutaProtegida>} />
      <Route path="/login" element={<RutaProtegida><Login /></RutaProtegida>} />
      <Route path="/registro-profesor" element={<RutaProtegida><RegistroProfesor /></RutaProtegida>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Rutas />
    </BrowserRouter>
  );
}

export default App;
