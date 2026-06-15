export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

export default function Picks() {
  const [picks, setPicks]     = useState([]);
  const [cargando, setCargando] = useState(true);
  const [fecha, setFecha]     = useState("");

  useEffect(() => {
    const hoy = new Date().toISOString().split("T")[0];
    setFecha(hoy);
    fetch("/api/historial")
      .then(r => r.json())
      .then(data => { setPicks(data.picks || []); setCargando(false); })
      .catch(() => setCargando(false));
  }, []);

  const colorBorde = (c) => c >= 85 ? "#22c55e" : c >= 75 ? "#f59e0b" : "#3b82f6";
  const iconoResultado = (r) => r === "acierto" ? "✅" : r === "fallo" ? "❌" : "⏳";

  return (
    <div style={{ background: "#0a1628", minHeight: "100vh", padding: "16px", fontFamily: "Arial", color: "#e2e8f0" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        {[["⚽","Inicio","/"],["🔴","En Vivo","/live"],["📅","Prematch","/prematch"],
         ["🔥","Picks","/picks"],["💎","Surebets","/apuestas-seguras"],["🤖","Telegram","/telegram"]
        ].map(([ico, label, href]) => (
          <a key={href} href={href} style={{ textDecoration: "none" }}>
            <button style={{
              background: href === "/selecciones" ? "#22c55e" : "#1e3a5f",
              color: href === "/selecciones" ? "#000" : "#e2e8f0",
              border: "none", borderRadius: "8px", padding: "7px 12px",
              fontSize: "12px", fontWeight: "600", cursor: "pointer"
            }}>{ico} {label}</button>
          </a>
        ))}
      </div>

      <h1 style={{ color: "#22c55e", fontSize: "20px", marginBottom: "4px" }}>🔥 Picks del día</h1>
      <p style={{ color: "#64748b", fontSize: "12px", marginBottom: "16px" }}>📅 {fecha} · Top 10 por confianza IA</p>

      {cargando ? (
        <div style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>⏳ Cargando picks...</div>
      ) : picks.length === 0 ? (
        <div style={{ background: "#1e293b", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: "14px" }}>Sin picks hoy todavía.</p>
          <p style={{ color: "#64748b", fontSize: "12px" }}>El análisis automático se ejecuta a las 10:00h (hora España).</p>
        </div>
      ) : (
        picks.map((pick, i) => (
          <div key={i} style={{
            background: "#1e293b", borderRadius: "12px", padding: "14px",
            marginBottom: "10px", borderLeft: `4px solid ${colorBorde(pick.confianza)}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontWeight: "700", fontSize: "14px" }}>
                {iconoResultado(pick.resultado)} {pick.partido}
              </span>
              <span style={{
                background: colorBorde(pick.confianza), color: "#000",
                borderRadius: "6px", padding: "2px 8px", fontSize: "12px", fontWeight: "700"
              }}>{pick.confianza}%</span>
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>🏆 {pick.liga}</div>
            <div style={{ fontSize: "13px", color: "#e2e8f0", marginTop: "4px", fontWeight: "500" }}>🎯 {pick.mercado}</div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Resultado: {pick.resultado}</div>
          </div>
        ))
      )}
    </div>
  );
}
