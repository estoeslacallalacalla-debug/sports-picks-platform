// pages/index.js

export default function Home() {
  return (
    <div style={{
      background: "#0a1628",
      minHeight: "100vh",
      padding: "16px",
      fontFamily: "Arial, sans-serif",
      color: "#e2e8f0"
    }}>

      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ color: "#22c55e", fontSize: "22px", margin: "0 0 4px 0" }}>
          ⚽ Sports Picks IA
        </h1>
        <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>
          Análisis automático con IA
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {[
          ["⚽", "Inicio", "/"],
          ["🔴", "En Vivo", "/live"],
          ["📅", "Prematch", "/prematch"],
          ["🔥", "Picks", "/picks"],
          ["💎", "Surebets", "/apuestas-seguras"],
          ["🤖", "Telegram", "/telegram"],
        ].map(([ico, label, href]) => (
          <a key={href} href={href} style={{ textDecoration: "none" }}>
            <button style={{
              background: href === "/" ? "#22c55e" : "#1e3a5f",
              color: href === "/" ? "#000" : "#e2e8f0",
              border: "none", borderRadius: "8px",
              padding: "8px 14px", fontSize: "13px",
              fontWeight: "600", cursor: "pointer"
            }}>
              {ico} {label}
            </button>
          </a>
        ))}
      </div>

      <div style={{ background: "#1e293b", borderRadius: "12px", padding: "16px", marginBottom: "16px", borderLeft: "3px solid #22c55e" }}>
        <h2 style={{ color: "#22c55e", fontSize: "15px", margin: "0 0 12px 0" }}>✅ Sistema activo</h2>
        <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "2" }}>
          <div>🤖 IA: Groq (activa)</div>
          <div>📡 Datos: football-data.org (real)</div>
          <div>💎 Surebets: Betfair, William Hill, Unibet, Pinnacle, Betsson</div>
          <div>📱 Telegram: Alertas automáticas</div>
        </div>
      </div>

      <div style={{ background: "#1e293b", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
        <h2 style={{ color: "#3b82f6", fontSize: "15px", margin: "0 0 12px 0" }}>🕐 Horario automático (hora España)</h2>
        <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "2.2" }}>
          <div>🔍 <strong style={{color:"#e2e8f0"}}>10:00</strong> — Análisis de partidos + surebets mañana</div>
          <div>💎 <strong style={{color:"#e2e8f0"}}>17:00</strong> — Surebets tarde + actualizar resultados</div>
          <div>📊 <strong style={{color:"#e2e8f0"}}>23:30</strong> — Resumen del día a Telegram</div>
        </div>
      </div>

      <div style={{ background: "#1e293b", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
        <h2 style={{ color: "#f59e0b", fontSize: "15px", margin: "0 0 12px 0" }}>⚡ Ejecutar manualmente</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            ["🤖 Analizar partidos ahora", "/api/analisis-ia", "#22c55e"],
            ["💎 Buscar surebets ahora", "/api/apuestas-seguras", "#3b82f6"],
            ["🔄 Actualizar resultados", "/api/actualizar-resultados", "#f59e0b"],
            ["📊 Enviar resumen a Telegram", "/api/resumen-diario", "#229ed9"],
          ].map(([label, href, color]) => (
            <a key={href} href={href} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <button style={{
                width: "100%", background: "transparent", color: color,
                border: "1px solid " + color, borderRadius: "8px",
                padding: "11px 16px", fontSize: "13px",
                fontWeight: "600", cursor: "pointer", textAlign: "left"
              }}>
                {label}
              </button>
            </a>
          ))}
        </div>
        <p style={{ fontSize: "11px", color: "#64748b", margin: "10px 0 0 0" }}>
          Al pulsar un botón se ejecuta al momento.
        </p>
      </div>

      <div style={{ background: "#1e293b", borderRadius: "12px", padding: "16px" }}>
        <h2 style={{ color: "#e2e8f0", fontSize: "15px", margin: "0 0 12px 0" }}>🏆 Ligas monitorizadas</h2>
        <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "2", columns: "2" }}>
          <div>🇪🇸 La Liga</div>
          <div>🇪🇸 Segunda División</div>
          <div>🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</div>
          <div>🇩🇪 Bundesliga</div>
          <div>🇮🇹 Serie A</div>
          <div>🇫🇷 Ligue 1</div>
          <div>🇳🇱 Eredivisie</div>
          <div>🇵🇹 Primeira Liga</div>
          <div>🇧🇷 Brasileirao</div>
          <div>🇦🇷 Liga Profesional</div>
          <div>🏆 Champions League</div>
          <div>🌐 Amistosos Internacionales</div>
        </div>
      </div>

    </div>
  );
}
