import { useEffect, useState } from "react";

export default function Picks() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetch("/api/prematch")
      .then((res) => res.json())
      .then((data) => {
        setMatches((data.response || []).slice(0, 20));
      });
  }, []);

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
        🔥 Picks Recomendados
      <h1>🔥 Selecciones funcionando</h1>

      {matches.map((match) => (
        <div
          key={match.fixture.id}
          style={{
            background: "white",
            padding: "15px",
            borderRadius: "12px",
            marginTop: "15px"
          }}
        >
          <h3>{match.league.name}</h3>

          <p>
            {match.teams.home.name} vs {match.teams.away.name}
          </p>

          <p>🎯 Mercado sugerido: Más de 1.5 goles</p>

          <p>📊 Confianza estimada: 75%</p>
        </div>
      ))}
    </div>
  );
}
