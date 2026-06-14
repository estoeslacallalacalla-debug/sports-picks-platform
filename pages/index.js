import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [picks, setPicks]       = useState([]);
  const [surebets, setSurebets] = useState([]);
  const [stats, setStats]       = useState({ aciertos: 0, fallos: 0, pendientes: 0, winrate: "—" });
  const [cargando, setCargando] = useState(true);
  const [analizando, setAnalizando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    const hoy = new Date().toISOString().split("T")[0];

    // Picks de hoy
    const { data: picksHoy } = await supabase
      .from("picks")
      .select("*")
      .gte("fecha", hoy)
      .order("confianza", { ascending: false })
      .limit(10);

    // Surebets activas
    const { data: surebetsActivas } = await supabase
      .from("apuestas_seguras")
      .select("*")
      .eq("estado", "activa")
      .order("beneficio", { ascending: false })
      .limit(5);

    // Stats totales
    const { data: todos } = await supabase.from("picks").select("resultado");
    const aciertos  = todos?.filter(p => p.resultado === "acierto").length  || 0;
    const fallos    = todos?.filter(p => p.resultado === "fallo").length    || 0;
    const pendientes= todos?.filter(p => p.resultado === "pendiente").length|| 0;
    const total     = aciertos + fallos;
    const winrate   = total > 0 ? ((aciertos / total) * 100).toFixed(1) : "—";

    setPicks(picksHoy || []);
    setSurebets(surebetsActivas || []);
    setStats({ aciertos, fallos, pendientes, winrate });
    setCargando(false);
  }

  async function lanzarAnalisis() {
    setAnalizando(true);
    try {
      await fetch("/api/analisis-ia");
      await fetch("/api/apuestas-seguras");
      await cargarDatos();
      alert("✅ Análisis completado. Revisa Telegram.");
    } catch (e) {
      alert("❌ Error: " + e.message);
    }
    setAnalizando(false);
  }

  async function actualizarResultados() {
    await fetch("/api/actualizar-resultados");
    await cargarDatos();
    alert("✅ Resultados actualizados");
  }

  async function enviarResumen() {
    await fetch("/api/resumen-diario");
    alert("✅ Resumen enviado a Telegram");
  }

  const colorConfianza = (c) => {
    if (c >= 85) return "#16a34a";
    if (c >= 70) return "#d97706";
    return "#dc2626";
  };

  const iconoResultado = (r) => {
    if (r === "acierto") return "✅";
    if (r === "fallo")   return "❌";
    return "⏳";
  };

  return (
    <div style={{ background: "#0a1628", minHeight: "100vh", padding: "16px", fontFamily: "Arial", color: "#e2e8f0" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h1 style={{ color: "#22c55e", fontSize: "22px", margin: 0 }}>⚽ Sports Picks IA</h1>
        <span style={{ fontSize: "11px", color: "#64748b" }}>
          {new Date().toLocaleDateString("es-ES")}
        </span>
      </div>

      {/* NAV */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {[["⚽", "Inicio", "/"], ["🔴", "En Vivo", "/live"], ["📅", "Prematch", "/prematch"],
          ["🔥", "Picks", "/selecciones"], ["💎", "Surebets", "/apuesta-segura"], ["🤖", "Telegram", "/telegram"]
        ].map(([ico, label, href]) => (
          <a key={href} href={href} style={{ textDecoration: "none" }}>
            <button style={{
              background: href === "/" ? "#22c55e" : "#1e3a5f",
              color: href === "/" ? "#000" : "#e2e8f0",
              border: "none", borderRadius: "8px", padding: "8px 14px",
              fontSize: "13px", fontWeight: "600", cursor: "pointer"
            }}>{ico} {label}</button>
          </a>
        ))}
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "20px" }}>
        {[
          ["✅", stats.aciertos, "Aciertos",   "#16a34a"],
          ["❌", stats.fallos,   "Fallos",      "#dc2626"],
          ["⏳", stats.pendientes,"Pendientes", "#d97706"],
          ["📈", `${stats.winrate}%`, "Winrate","#3b82f6"],
        ].map(([ico, val, label, color]) => (
          <div key={label} style={{ background: "#1e293b", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "700", color }}>{val}</div>
            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* BOTONES ACCIÓN */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        <button onClick={lanzarAnalisis} disabled={analizando} style={{
          background: analizando ? "#374151" : "#22c55e", color: "#000",
          border: "none", borderRadius: "8px", padding: "10px 16px",
          fontWeight: "700", cursor: "pointer", fontSize: "13px"
        }}>
          {analizando ? "⏳ Analizando..." : "🤖 Analizar ahora"}
        </button>
        <button onClick={actualizarResultados} style={{
          background: "#1e3a5f", color: "#e2e8f0", border: "1px solid #22c55e",
          borderRadius: "8px", padding: "10px 16px", fontWeight: "600", cursor: "pointer", fontSize: "13px"
        }}>🔄 Actualizar resultados</button>
        <button onClick={enviarResumen} style={{
          background: "#229ed9", color: "#fff",
          border: "none", borderRadius: "8px", padding: "10px 16px",
          fontWeight: "600", cursor: "pointer", fontSize: "13px"
        }}>📤 Resumen a Telegram</button>
      </div>

      {/* PICKS DE HOY */}
      <div style={{ background: "#1e293b", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", color: "#22c55e", marginBottom: "12px", marginTop: 0 }}>
          🔥 Picks de hoy
        </h2>
        {cargando ? (
          <p style={{ color: "#64748b", fontSize: "13px" }}>Cargando...</p>
        ) : picks.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "13px" }}>
            Sin picks hoy. Pulsa "Analizar ahora" para generarlos.
          </p>
        ) : (
          picks.map((p, i) => (
            <div key={i} style={{
              background: "#0f172a", borderRadius: "8px", padding: "12px",
              marginBottom: "8px", borderLeft: `3px solid ${colorConfianza(p.confianza)}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "600" }}>
                  {iconoResultado(p.resultado)} {p.partido}
                </span>
                <span style={{
                  background: colorConfianza(p.confianza), color: "#000",
                  borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: "700"
                }}>{p.confianza}%</span>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                {p.liga} · {p.mercado}
              </div>
            </div>
          ))
        )}
      </div>

      {/* SUREBETS */}
      <div style={{ background: "#1e293b", borderRadius: "12px", padding: "16px" }}>
        <h2 style={{ fontSize: "16px", color: "#3b82f6", marginBottom: "12px", marginTop: 0 }}>
          💎 Surebets activas
        </h2>
        {surebets.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "13px" }}>
            Sin surebets activas. Se buscan automáticamente al analizar.
          </p>
        ) : (
          surebets.map((s, i) => (
            <div key={i} style={{
              background: "#0f172a", borderRadius: "8px", padding: "12px",
              marginBottom: "8px", borderLeft: "3px solid #3b82f6"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: "600" }}>⚡ {s.partido}</span>
                <span style={{ color: "#22c55e", fontWeight: "700", fontSize: "14px" }}>
                  +{s.beneficio}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>
                🏠 {s.casa_local} ({s.cuota_local}) → {s.apuesta_local} &nbsp;|&nbsp;
                🤝 {s.casa_empate} ({s.cuota_empate}) → {s.apuesta_empate} &nbsp;|&nbsp;
                ✈️ {s.casa_visitante} ({s.cuota_visitante}) → {s.apuesta_visitante}
              </div>
              <div style={{ fontSize: "11px", color: "#22c55e", marginTop: "4px" }}>
                💵 Ganancia sobre 100€: {s.ganancia}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
