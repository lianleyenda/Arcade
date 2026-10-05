import { useEffect, useState } from "react";
import { FondoArcade, estilos } from "./EstilosArcade";

const API_URL = "http://localhost:5000/api";

// Modo de prueba: usa esta lista en vez de pedirle los datos al backend.
// Poner en false cuando el backend esté corriendo de verdad.
const MODO_PRUEBA = false;

// En la base de datos el saldo se guarda en SEGUNDOS.
const ALUMNOS_DE_PRUEBA = [
  { id: "1", nombre: "Juan", apellido: "Pérez", saldo: 1200, ultima_fecha_uso: "2026-09-10" },
  { id: "2", nombre: "María", apellido: "Gómez", saldo: 0, ultima_fecha_uso: "2026-08-01" },
  { id: "3", nombre: "Lucas", apellido: "Fernández", saldo: 9900, ultima_fecha_uso: "Nunca" },
];

// Cuántos segundos vale cada unidad
const SEGUNDOS_POR_UNIDAD = {
  segundos: 1,
  minutos: 60,
  horas: 3600,
};

// Convierte segundos a un texto fácil de leer.
// Ejemplos: 45 -> "45 s" | 600 -> "10 min" | 3725 -> "1 h 2 min 5 s"
function formatearTiempo(totalSegundos) {
  const total = Math.max(0, Math.floor(Number(totalSegundos) || 0));

  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;

  const partes = [];
  if (horas > 0) partes.push(`${horas} h`);
  if (minutos > 0) partes.push(`${minutos} min`);
  if (segundos > 0 || partes.length === 0) partes.push(`${segundos} s`);

  return partes.join(" ");
}

const estiloCantidad = {
  ...estilos.input,
  marginBottom: 0,
  width: "auto",
  flex: "1 1 70px",
  minWidth: 0,
};

const estiloUnidad = {
  ...estilos.input,
  marginBottom: 0,
  width: 110,
  flex: "0 0 auto",
  padding: "10px 6px",
  fontSize: 14,
  colorScheme: "dark",
  cursor: "pointer",
};

const estiloOpcion = {
  background: "#120a29",
  color: "#eef1ff",
};

function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [cantidadPorAlumno, setCantidadPorAlumno] = useState({});
  const [unidadPorAlumno, setUnidadPorAlumno] = useState({});
  const [mensajePorAlumno, setMensajePorAlumno] = useState({});

  useEffect(() => {
    cargarAlumnos();
  }, []);

  function obtenerToken() {
    return localStorage.getItem("token_profesor");
  }

  async function cargarAlumnos() {
    setCargando(true);
    setError("");

    if (MODO_PRUEBA) {
      setAlumnos(ALUMNOS_DE_PRUEBA);
      setCargando(false);
      return;
    }

    try {
      const respuesta = await fetch(`${API_URL}/obtener-estudiantes/saldo`, {
        headers: { Authorization: `Bearer ${obtenerToken()}` },
      });
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setAlumnos(datos);
      } else {
        setError("No se pudo cargar el listado de alumnos");
      }
    } catch (e) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

  async function modificarTiempo(alumnoId, accion) {
    const quitar = accion === "quitar";
    const cantidad = Number(cantidadPorAlumno[alumnoId]);
    const unidad = unidadPorAlumno[alumnoId] || "minutos";

    // La cuenta se hace acá: todo se convierte a segundos antes de mandarlo
    const segundos = Math.round(cantidad * SEGUNDOS_POR_UNIDAD[unidad]);

    if (!cantidad || cantidad <= 0 || segundos < 1) {
      setMensajePorAlumno((prev) => ({ ...prev, [alumnoId]: "Ingresá un número válido" }));
      return;
    }

    if (MODO_PRUEBA) {
      setAlumnos((prev) =>
        prev.map((a) => (a.id === alumnoId ? { ...a, saldo: quitar ? Math.max(0, a.saldo - segundos) : a.saldo + segundos } : a))
      );
      setMensajePorAlumno((prev) => ({
        ...prev,
        [alumnoId]: `${quitar ? "-" : "+"}${formatearTiempo(segundos)} ${quitar ? "quitados" : "asignados"} (prueba)`,
      }));
      setCantidadPorAlumno((prev) => ({ ...prev, [alumnoId]: "" }));
      return;
    }

    try {
      const respuesta = await fetch(`${API_URL}/profesor/${quitar ? "quitar-saldo" : "recargar-saldo"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obtenerToken()}`,
        },
        body: JSON.stringify({
          estudiante_id: alumnoId,
          segundos: segundos,
        }),
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setAlumnos((prev) =>
          prev.map((a) => (a.id === alumnoId ? { ...a, saldo: datos.saldo_nuevo } : a))
        );
        setMensajePorAlumno((prev) => ({
          ...prev,
          [alumnoId]: `${quitar ? "-" : "+"}${formatearTiempo(segundos)} ${quitar ? "quitados" : "asignados"}`,
        }));
        setCantidadPorAlumno((prev) => ({ ...prev, [alumnoId]: "" }));
      } else {
        setMensajePorAlumno((prev) => ({ ...prev, [alumnoId]: datos.error || "Error al modificar el tiempo" }));
      }
    } catch (e) {
      setMensajePorAlumno((prev) => ({ ...prev, [alumnoId]: "No se pudo conectar con el servidor" }));
    }
  }

  const alumnosFiltrados = alumnos.filter((a) =>
    `${a.nombre} ${a.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <FondoArcade>
      <div style={estilos.contenedor}>
        <h1 style={estilos.titulo}>ALUMNOS</h1>

        {MODO_PRUEBA && (
          <p style={estilos.aviso}>
            Modo prueba activo: mostrando datos de ejemplo, no el backend real.
          </p>
        )}

        <input
          type="text"
          placeholder="Buscar por nombre o apellido..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={estilos.busqueda}
        />

        {cargando && <p style={estilos.mensajeExito}>Cargando...</p>}
        {error && <p style={estilos.mensajeError}>{error}</p>}

        {!cargando &&
          alumnosFiltrados.map((alumno) => (
            <div key={alumno.id} style={estilos.tarjeta}>
              <p style={{ margin: 0, fontWeight: "bold", color: "#fff" }}>
                {alumno.nombre} {alumno.apellido}
              </p>
              <p style={{ margin: "4px 0 12px", color: "#9aa0c8", fontSize: 14 }}>
                Saldo: {formatearTiempo(alumno.saldo)} · Último uso: {alumno.ultima_fecha_uso}
              </p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Tiempo"
                  value={cantidadPorAlumno[alumno.id] || ""}
                  onChange={(e) =>
                    setCantidadPorAlumno((prev) => ({ ...prev, [alumno.id]: e.target.value }))
                  }
                  style={estiloCantidad}
                />
                <select
                  value={unidadPorAlumno[alumno.id] || "minutos"}
                  onChange={(e) =>
                    setUnidadPorAlumno((prev) => ({ ...prev, [alumno.id]: e.target.value }))
                  }
                  style={estiloUnidad}
                >
                  <option value="segundos" style={estiloOpcion}>segundos</option>
                  <option value="minutos" style={estiloOpcion}>minutos</option>
                  <option value="horas" style={estiloOpcion}>horas</option>
                </select>
                <button onClick={() => modificarTiempo(alumno.id, "asignar")} style={estilos.botonChico}>
                  Asignar
                </button>
                <button
                  onClick={() => modificarTiempo(alumno.id, "quitar")}
                  style={{ ...estilos.botonChico, borderColor: "#ff4d6d", color: "#ff4d6d" }}
                >
                  Quitar
                </button>
              </div>

              {mensajePorAlumno[alumno.id] && (
                <p style={estilos.mensajeChico}>{mensajePorAlumno[alumno.id]}</p>
              )}
            </div>
          ))}

        {!cargando && alumnosFiltrados.length === 0 && (
          <p style={estilos.mensajeExito}>No se encontraron alumnos.</p>
        )}
      </div>
    </FondoArcade>
  );
}

export default Alumnos;