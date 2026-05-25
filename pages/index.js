
export default function Home() {
  return (
    <div
      style={{
        backgroundColor: "#eaf2ff",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "Arial"
      }}
    >
      <h1 style={{ color: "#2563eb" }}>
        ⚽ Sports Picks Platform
      </h1>
<div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "20px",
    marginBottom: "20px"
  }}
>
  <a href="/">
  <button>⚽ Inicio</button>
</a>

<a href="/live">
  <button>🔴 En Vivo</button>
</a>

<a href="/prematch">
  <button>📅 Prematch</button>
</a>

<a href="/picks">
  <button>🔥 Picks</button>
</a>

<a href="/surebets">
  <button>💎 Surebets</button>
</a>

<a href="/telegram">
  <button>🤖 Telegram</button>
</a>
</div>
      <p>
        Análisis deportivo en vivo y prematch.
      </p>

      <div
        style={{
          background: "white",
          padding: "15px",
          borderRadius: "12px",
          marginTop: "20px"
        }}
      >
        <h2>🔥 Picks recomendados</h2>

        <p><strong>Liga:</strong> Tanzania Premier League</p>
        <p><strong>Partido:</strong> Simba vs Azam</p>
        <p><strong>Mercado:</strong> Más de 1.5 goles</p>
        <p><strong>Cuota:</strong> 1.42</p>
        <p><strong>Confianza:</strong> 84%</p>
      </div>

      <div
        style={{
          background: "white",
          padding: "15px",
          borderRadius: "12px",
          marginTop: "20px"
        }}
      >
        <h2>💎 Surebets</h2>
        <p>Módulo en preparación.</p>
      </div>

      <div
        style={{
          background: "white",
          padding: "15px",
          borderRadius: "12px",
          marginTop: "20px"
        }}
      >
        <h2>🤖 Telegram</h2>
        <p>Alertas automáticas próximamente.</p>
      </div>
    </div>
  );
}
