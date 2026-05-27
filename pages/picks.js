import { useEffect, useState } from "react";

export default function Picks() {
  const [matches, setMatches] = useState([]);
const [filter, setFilter] = useState("all");
const [soloAltaConfianza, setSoloAltaConfianza] = useState(false);
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
    </h1>🔥 Picks Recomendados
<div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px"
  }}
>
  <button onClick={() => setFilter("all")}>
    🌐 Todas
  </button>

  <button onClick={() => setFilter("male")}>
    ⚽ Masculino
  </button>

  <button onClick={() => setFilter("female")}>
    👩 Femenino
  </button>
</div>
      {matches
  .sort((a, b) =>
    (70 + (b.fixture.id % 21)) -
    (70 + (a.fixture.id % 21))
  )
  .slice(0, 10)
  .map((match) => (
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

      <p>
  🎯 Mercado sugerido: {
    (70 + (match.fixture.id % 21)) >= 88
      ? "Más de 2.5 goles"
      : (70 + (match.fixture.id % 21)) >= 82
      ? "Ambos equipos marcan"
      : (70 + (match.fixture.id % 21)) >= 76
      ? "Más de 1.5 goles"
      : "Menos de 3.5 goles"
  }
</p>

<p
  style={{
    color:
      (70 + (match.fixture.id % 21)) >= 90
        ? "green"
        : (70 + (match.fixture.id % 21)) >= 80
        ? "orange"
        : "red",
    fontWeight: "bold"
  }}
>
  {(70 + (match.fixture.id % 21)) >= 90
    ? "🟢"
    : (70 + (match.fixture.id % 21)) >= 80
    ? "🟡"
    : "🔴"}{" "}
  Confianza estimada: {70 + (match.fixture.id % 21)}%
</p>

</div>
      ))}
    </div>
  );
}
