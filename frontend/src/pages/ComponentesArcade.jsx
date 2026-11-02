import { useId } from "react";
import { useNavigate } from "react-router-dom";
import "./Arcade.css";

// Fondo y marco que usan todas las pantallas de acceso
export function FondoArcade({ children }) {
  return <main className="arcade-shell">{children}</main>;
}

// Etiqueta chica arriba del título. tono: "cyan" (alumno) o "pink" (profesor)
export function Etiqueta({ children, tono = "cyan" }) {
  return <span className={`eyebrow ${tono}`}>{children}</span>;
}

export function Tarjeta({ children, tono = "cyan", className = "" }) {
  return <section className={`arcade-card ${tono} ${className}`}>{children}</section>;
}

// Enlace chico para volver. "a" es la ruta a la que vuelve.
export function EnlaceVolver({ a = "/", texto = "← Volver al inicio" }) {
  const navegar = useNavigate();
  return (
    <button type="button" className="back-link" onClick={() => navegar(a)}>
      {texto}
    </button>
  );
}

export function Campo({ label, type = "text", value, onChange, minLength, autoComplete }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        minLength={minLength}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
