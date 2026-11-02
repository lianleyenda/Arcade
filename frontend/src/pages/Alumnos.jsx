import { useEffect, useMemo, useState } from "react";
import "./Alumnos.css";

// Dirección del servidor Flask
const API_URL = "http://10.56.31.32:5000/api";

// Modo de prueba: usa alumnos de ejemplo en vez del servidor.
// Tiene que estar en false en producción.
const MODO_PRUEBA = false;

const ALUMNOS_DE_PRUEBA = [
  { id: "1", nombre: "Martina", apellido: "Gómez", email: "martina.gomez@escuela.edu.ar", saldo: 3725, ultima_fecha_uso: "2026-10-20" },
  { id: "2", nombre: "Tomás", apellido: "Ruiz", email: "tomas.ruiz@escuela.edu.ar", saldo: 2700, ultima_fecha_uso: "2026-10-18" },
  { id: "3", nombre: "Valentina", apellido: "Sosa", email: "valentina.sosa@escuela.edu.ar", saldo: 0, ultima_fecha_uso: "2026-10-17" },
  { id: "4", nombre: "Benjamín", apellido: "López", email: "", saldo: 540, ultima_fecha_uso: "Nunca" },
];

// ============================================================
// Funciones que hablan con el servidor
// ============================================================
function obtenerToken() {
  return localStorage.getItem("token_profesor");
}

function encabezados() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${obtenerToken()}`,
  };
}

async function cargarAlumnos() {
  if (MODO_PRUEBA) return ALUMNOS_DE_PRUEBA;

  const respuesta = await fetch(`${API_URL}/obtener-estudiantes/saldo`, {
    headers: { Authorization: `Bearer ${obtenerToken()}` },
  });
  if (respuesta.status === 401) throw new Error("Tu sesión venció. Volvé a iniciar sesión.");
  if (!respuesta.ok) throw new Error("No se pudo cargar el listado de alumnos");
  return await respuesta.json();
}

// accion: "asignar" o "quitar". Devuelve el saldo nuevo en segundos.
async function modificarTiempo(alumnoId, accion, segundos) {
  if (MODO_PRUEBA) return { saldo_nuevo: segundos };

  const ruta = accion === "asignar" ? "recargar-saldo" : "quitar-saldo";
  const respuesta = await fetch(`${API_URL}/profesor/${ruta}`, {
    method: "POST",
    headers: encabezados(),
    body: JSON.stringify({ estudiante_id: alumnoId, segundos }),
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || "No se pudo modificar el tiempo");
  return datos;
}

// Devuelve true si salió bien, o un texto con el error.
async function editarEstudiante(alumnoId, datos) {
  if (MODO_PRUEBA) return true;

  try {
    const respuesta = await fetch(`${API_URL}/profesor/editar-estudiante`, {
      method: "PATCH",
      headers: encabezados(),
      body: JSON.stringify({ estudiante_id: alumnoId, ...datos }),
    });
    const resultado = await respuesta.json().catch(() => ({}));
    if (respuesta.ok) return true;
    return resultado.error || "No se pudo guardar";
  } catch (e) {
    return "No se pudo conectar con el servidor";
  }
}

// 3725 -> "1 h 2 min 5 s"
function formatearTiempo(segundos) {
  segundos = Math.max(0, Math.round(Number(segundos) || 0));
  if (segundos === 0) return "0 s";
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  return [horas ? `${horas} h` : "", minutos ? `${minutos} min` : "", segs ? `${segs} s` : ""]
    .filter(Boolean)
    .join(" ");
}

// ============================================================
// Iconos (dibujados acá, sin librerías)
// ============================================================
function Icono({ children, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const IconoBuscar = ({ size }) => <Icono size={size}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icono>;
const IconoCheck = ({ size }) => <Icono size={size}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icono>;
const IconoLapiz = ({ size }) => <Icono size={size}><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></Icono>;
const IconoFlecha = ({ size }) => <Icono size={size}><path d="m6 9 6 6 6-6" /></Icono>;
const IconoCerrar = ({ size = 20 }) => <Icono size={size}><path d="M6 6l12 12M18 6 6 18" /></Icono>;
const IconoPersona = ({ size = 28 }) => <Icono size={size}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Icono>;

function Campo({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

// ============================================================
// Pantalla
// ============================================================
function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [accion, setAccion] = useState("asignar");
  const [cantidad, setCantidad] = useState("10");
  const [unidad, setUnidad] = useState("minutos");
  const [mensaje, setMensaje] = useState("");
  const [aplicando, setAplicando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", password: "" });
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);

  // La pantalla ocupa todo el ancho: mientras está abierta, sacamos el margen del
  // navegador y el ancho fijo que trae la plantilla de Vite (#root).
  useEffect(() => {
    const raiz = document.getElementById("root");
    const anteriorBody = { margin: document.body.style.margin, background: document.body.style.background };
    const anteriorRaiz = raiz
      ? { width: raiz.style.width, maxWidth: raiz.style.maxWidth, borderInline: raiz.style.borderInline, textAlign: raiz.style.textAlign }
      : null;

    document.body.style.margin = "0";
    document.body.style.background = "#04020e";
    if (raiz) {
      raiz.style.width = "100%";
      raiz.style.maxWidth = "none";
      raiz.style.borderInline = "none";
      raiz.style.textAlign = "left";
    }

    return () => {
      document.body.style.margin = anteriorBody.margin;
      document.body.style.background = anteriorBody.background;
      if (raiz && anteriorRaiz) {
        raiz.style.width = anteriorRaiz.width;
        raiz.style.maxWidth = anteriorRaiz.maxWidth;
        raiz.style.borderInline = anteriorRaiz.borderInline;
        raiz.style.textAlign = anteriorRaiz.textAlign;
      }
    };
  }, []);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    cargarAlumnos()
      .then((lista) => vivo && setAlumnos(lista))
      .catch((e) => vivo && setErrorCarga(e.message === "Failed to fetch" ? "No se pudo conectar con el servidor" : e.message))
      .finally(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, []);

  const visibles = useMemo(
    () => alumnos.filter((a) =>
      `${a.nombre} ${a.apellido} ${a.email || ""}`.toLowerCase().includes(busqueda.toLowerCase())),
    [alumnos, busqueda]
  );

  const todosVisibles = visibles.length > 0 && visibles.every((a) => seleccionados.includes(a.id));
  const primero = alumnos.find((a) => a.id === seleccionados[0]);
  const resumen =
    seleccionados.length === 0 ? "Elegí uno o más alumnos"
    : seleccionados.length === 1 ? `${primero?.nombre} ${primero?.apellido}`
    : `${seleccionados.length} alumnos seleccionados`;

  const valorCantidad = Number(cantidad);
  const cantidadValida = cantidad !== "" && Number.isFinite(valorCantidad) && valorCantidad > 0;
  const puedeConfirmar = seleccionados.length > 0 && cantidadValida && !aplicando;
  const verbo = accion === "asignar" ? "Asignar" : "Quitar";
  const textoConfirmacion =
    seleccionados.length > 0
      ? `${verbo} a ${seleccionados.length} ${seleccionados.length === 1 ? "alumno" : "alumnos"}`
      : `${verbo} tiempo`;
  const motivoBloqueo = seleccionados.length === 0 ? "Elegí al menos un alumno" : "Ingresá una cantidad mayor a cero";

  function alternarAlumno(id) {
    setSeleccionados((actual) => actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]);
  }

  function alternarTodos() {
    setSeleccionados(
      todosVisibles
        ? seleccionados.filter((id) => !visibles.some((a) => a.id === id))
        : Array.from(new Set([...seleccionados, ...visibles.map((a) => a.id)]))
    );
  }

  async function aplicarTiempo() {
    if (!puedeConfirmar) {
      setMensaje(seleccionados.length === 0 ? "Elegí al menos un alumno." : "Ingresá una cantidad mayor a cero.");
      return;
    }
    const multiplicador = unidad === "horas" ? 3600 : unidad === "minutos" ? 60 : 1;
    const segundos = Math.round(valorCantidad * multiplicador);
    if (segundos <= 0) { setMensaje("La cantidad es demasiado chica."); return; }

    setAplicando(true);
    setMensaje("Aplicando cambio...");

    const ids = [...seleccionados];
    const resultados = await Promise.allSettled(ids.map((id) => modificarTiempo(id, accion, segundos)));

    const nuevosSaldos = {};
    const fallas = [];
    resultados.forEach((r, i) => {
      if (r.status === "fulfilled") {
        nuevosSaldos[ids[i]] = r.value.saldo_nuevo;
      } else {
        const alumno = alumnos.find((a) => a.id === ids[i]);
        const motivo = r.reason?.message === "Failed to fetch" ? "No se pudo conectar con el servidor" : r.reason?.message;
        fallas.push(`${alumno ? alumno.nombre : "Alumno"}: ${motivo}`);
      }
    });

    setAlumnos((actuales) => actuales.map((a) =>
      nuevosSaldos[a.id] === undefined ? a : { ...a, saldo: nuevosSaldos[a.id] }));

    const okCount = Object.keys(nuevosSaldos).length;
    const unidadTexto = valorCantidad === 1 ? unidad.replace(/s$/, "") : unidad;
    const textoCant = `${cantidad} ${unidadTexto}`;
    let texto = "";
    if (okCount > 0) {
      texto = `${accion === "asignar" ? "Se asignaron" : "Se quitaron"} ${textoCant} a ${okCount} ${okCount === 1 ? "alumno" : "alumnos"}.`;
    }
    if (fallas.length > 0) texto += ` No se pudo en: ${fallas.join(" · ")}`;
    setMensaje(texto.trim());
    setAplicando(false);
  }

  function abrirEdicion(alumno) {
    setEditando(alumno);
    setForm({ nombre: alumno.nombre || "", apellido: alumno.apellido || "", email: alumno.email || "", password: "" });
    setErrorForm("");
  }

  async function guardarEdicion() {
    if (!editando) return;
    const datos = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      password: form.password,
    };
    if (!datos.nombre || !datos.apellido || !datos.email) {
      setErrorForm("Nombre, apellido y email son obligatorios");
      return;
    }
    setGuardando(true);
    const resultado = await editarEstudiante(editando.id, datos);
    setGuardando(false);
    if (resultado !== true) { setErrorForm(resultado); return; }

    setAlumnos((actuales) => actuales.map((a) =>
      a.id === editando.id ? { ...a, nombre: datos.nombre, apellido: datos.apellido, email: datos.email } : a));
    setMensaje(datos.password ? "Datos y contraseña actualizados." : "Datos actualizados.");
    setEditando(null);
  }

  return (
    <main className="alumnos-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ARCADE ESCOLAR <span>// PANEL DOCENTE</span></p>
          <h1>ALUMNOS</h1>
        </div>
        <div className="status"><i /> SISTEMA ONLINE</div>
      </header>

      <div className="workspace">
        <section className="students-area">
          <div className="section-heading">
            <div>
              <p className="kicker">GESTIÓN DE CUENTAS</p>
              <h2>Lista de alumnos</h2>
            </div>
            <span className="count-badge">{visibles.length} registrados</span>
          </div>

          <label className="search-box">
            <IconoBuscar size={18} />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, apellido o email..." />
          </label>

          <div className="select-all">
            <label className="check-wrap">
              <input type="checkbox" checked={todosVisibles} onChange={alternarTodos} />
              <span className="checkmark"><IconoCheck size={13} /></span>
            </label>
            <span>Seleccionar todos los visibles</span>
            <span className="selected-count">{seleccionados.length} seleccionados</span>
          </div>

          <div className="table-wrap">
            {cargando && <div className="empty-state"><span>Cargando alumnos...</span></div>}
            {!cargando && errorCarga && (
              <div className="empty-state"><strong>{errorCarga}</strong></div>
            )}
            {!cargando && !errorCarga && (
              <table>
                <thead>
                  <tr>
                    <th aria-label="Seleccionar" />
                    <th>ALUMNO</th>
                    <th>EMAIL</th>
                    <th>SALDO</th>
                    <th>ÚLTIMO USO</th>
                    <th aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((alumno) => (
                    <tr key={alumno.id}
                      className={seleccionados.includes(alumno.id) ? "is-selected" : ""}
                      onClick={() => alternarAlumno(alumno.id)}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <label className="check-wrap">
                          <input type="checkbox" checked={seleccionados.includes(alumno.id)}
                            onChange={() => alternarAlumno(alumno.id)} />
                          <span className="checkmark"><IconoCheck size={13} /></span>
                        </label>
                      </td>
                      <td>
                        <div className="student-name">
                          <span className="avatar">{(alumno.nombre || "?")[0]}{(alumno.apellido || "")[0]}</span>
                          <strong>{alumno.nombre} {alumno.apellido}</strong>
                        </div>
                      </td>
                      <td className="muted">{alumno.email || "Sin email"}</td>
                      <td><span className={`balance ${Number(alumno.saldo) === 0 ? "empty" : ""}`}>{formatearTiempo(alumno.saldo)}</span></td>
                      <td className="muted">{alumno.ultima_fecha_uso || "Nunca"}</td>
                      <td>
                        <button className="edit-button" onClick={(e) => { e.stopPropagation(); abrirEdicion(alumno); }}>
                          <IconoLapiz size={13} /> Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!cargando && !errorCarga && visibles.length === 0 && (
              <div className="empty-state">
                <IconoPersona />
                <strong>No hay alumnos con ese nombre</strong>
                <span>Probá con otro nombre o email.</span>
              </div>
            )}
          </div>
        </section>

        <aside className={`time-panel ${seleccionados.length === 0 ? "no-selection" : ""}`}>
          <div className="panel-head">
            <div>
              <p className="kicker">CONTROL DE TIEMPO</p>
              <h2>{accion === "asignar" ? "Asignar saldo" : "Quitar saldo"}</h2>
            </div>
            <span className="bolt">✦</span>
          </div>

          <div className={`selection-summary ${seleccionados.length ? "has-selection" : ""}`}>
            <span className="selection-dot" />
            <div>
              <small>SELECCIÓN ACTUAL</small>
              <strong>{resumen}</strong>
            </div>
          </div>

          <div className="mode-toggle">
            <button className={accion === "asignar" ? "active assign" : ""} onClick={() => setAccion("asignar")}>＋ ASIGNAR</button>
            <button className={accion === "quitar" ? "active remove" : ""} onClick={() => setAccion("quitar")}>− QUITAR</button>
          </div>

          <div className="time-inputs">
            <label className="field">
              <span>CANTIDAD</span>
              <input type="number" min="1" value={cantidad} disabled={!seleccionados.length}
                onChange={(e) => setCantidad(e.target.value)} />
            </label>
            <label className="field">
              <span>UNIDAD</span>
              <div className="select-field">
                <select value={unidad} disabled={!seleccionados.length} onChange={(e) => setUnidad(e.target.value)}>
                  <option>segundos</option>
                  <option>minutos</option>
                  <option>horas</option>
                </select>
                <IconoFlecha size={15} />
              </div>
            </label>
          </div>

          <button className={`confirm-button ${accion}`} disabled={!puedeConfirmar} onClick={aplicarTiempo}>
            <span>{aplicando ? "Aplicando..." : textoConfirmacion}</span>
            <span>→</span>
          </button>
          <p className="helper">
            {puedeConfirmar
              ? accion === "quitar" ? "El saldo nunca puede bajar de 0 segundos." : "El tiempo se suma al saldo disponible."
              : motivoBloqueo}
          </p>
          {mensaje && <div className="result-message">{mensaje}</div>}
        </aside>
      </div>

      {editando && (
        <div className="modal-backdrop" onClick={() => setEditando(null)}>
          <section className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setEditando(null)} aria-label="Cerrar"><IconoCerrar /></button>
            <p className="kicker">CUENTA DE ALUMNO</p>
            <h2>Editar datos</h2>
            <p className="modal-subtitle">Actualizá la información de {editando.nombre}.</p>
            <div className="form-grid">
              <Campo label="NOMBRE" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
              <Campo label="APELLIDO" value={form.apellido} onChange={(v) => setForm({ ...form, apellido: v })} />
              <Campo label="EMAIL" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Campo label="CONTRASEÑA NUEVA" type="password" placeholder="Vacío = no cambiar"
                value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
            </div>
            {errorForm && <div className="form-error">{errorForm}</div>}
            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="save-button" onClick={guardarEdicion} disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default Alumnos;
