export const colores = {
  fondo: "#05020f",
  fondoDegradado: "linear-gradient(135deg, #05020f 0%, #120a29 50%, #05020f 100%)",
  tarjeta: "rgba(18, 10, 36, 0.75)",
  borde: "#00fff2",
  acento: "#00fff2",
  acentoSecundario: "#ff2ec4",
  texto: "#eef1ff",
  textoSuave: "#9aa0c8",
  error: "#ff4d6d",
  exito: "#00ff9d",
};

// Envolvé el contenido de cada pantalla con este componente.
// Trae la fuente futurista y el fondo degradado con efecto neón.
export function FondoArcade({ children }) {
  return (
    <div style={estilos.fondo}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Press+Start+2P&display=swap');
        body { margin: 0; background: ${colores.fondo}; }
        @keyframes brilloTitulo {
          0%, 100% { text-shadow: 0 0 8px #00fff2, 0 0 16px #00fff2; }
          50% { text-shadow: 0 0 16px #ff2ec4, 0 0 28px #ff2ec4; }
        }
        input:focus {
          outline: none;
          border-color: #ff2ec4 !important;
          box-shadow: 0 0 10px #ff2ec4;
        }
      `}</style>
      {children}
    </div>
  );
}

export const estilos = {
  fondo: {
    minHeight: "100vh",
    width: "100%",
    background: colores.fondoDegradado,
    display: "flex",
    justifyContent: "center",
    boxSizing: "border-box",
    fontFamily: "'Orbitron', sans-serif",
  },
  contenedor: {
    maxWidth: 420,
    width: "100%",
    margin: "0 auto",
    padding: "40px 20px",
    boxSizing: "border-box",
    color: colores.texto,
  },
  titulo: {
    textAlign: "center",
    fontFamily: "'Press Start 2P', cursive",
    fontSize: 20,
    color: colores.acento,
    animation: "brilloTitulo 2.5s ease-in-out infinite",
    marginBottom: 32,
    lineHeight: 1.6,
  },
  tarjeta: {
    background: colores.tarjeta,
    border: `1px solid ${colores.borde}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: "0 0 20px rgba(0, 255, 242, 0.15)",
    backdropFilter: "blur(6px)",
  },
  label: {
    display: "block",
    color: colores.textoSuave,
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    display: "block",
    width: "100%",
    padding: "12px 10px",
    marginBottom: 16,
    boxSizing: "border-box",
    fontSize: 16,
    borderRadius: 8,
    border: `1px solid ${colores.textoSuave}`,
    background: "rgba(255,255,255,0.05)",
    color: colores.texto,
    fontFamily: "'Orbitron', sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  busqueda: {
    display: "block",
    width: "100%",
    padding: "12px 10px",
    marginBottom: 20,
    boxSizing: "border-box",
    fontSize: 16,
    borderRadius: 8,
    border: `1px solid ${colores.textoSuave}`,
    background: "rgba(255,255,255,0.05)",
    color: colores.texto,
    fontFamily: "'Orbitron', sans-serif",
  },
  boton: {
    width: "100%",
    padding: 14,
    fontSize: 15,
    borderRadius: 8,
    border: "none",
    background: `linear-gradient(90deg, ${colores.acento}, ${colores.acentoSecundario})`,
    color: "#05020f",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "'Orbitron', sans-serif",
    letterSpacing: 1,
  },
  botonChico: {
    padding: "10px 14px",
    fontSize: 13,
    borderRadius: 8,
    border: "none",
    background: `linear-gradient(90deg, ${colores.acento}, ${colores.acentoSecundario})`,
    color: "#05020f",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "'Orbitron', sans-serif",
  },
  mensajeError: {
    textAlign: "center",
    color: colores.error,
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 14,
  },
  mensajeExito: {
    textAlign: "center",
    color: colores.exito,
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 14,
  },
  mensajeChico: {
    margin: "6px 0 0",
    fontSize: 13,
    color: colores.exito,
    fontFamily: "'Orbitron', sans-serif",
  },
  aviso: {
    background: "rgba(255, 46, 196, 0.15)",
    color: colores.acentoSecundario,
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 13,
    textAlign: "center",
    border: `1px solid ${colores.acentoSecundario}`,
    marginBottom: 16,
  },
};