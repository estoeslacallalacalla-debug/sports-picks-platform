import { useEffect, useState } from "react";

export default function Live() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetch("/api/live")
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.response || []);
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
        🔴 Partidos En Vivo
      </h1>

      {matches.length === 0 ? (
        <p>Cargando partidos...</p>
      ) : (
        matches.map((match) => (
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
              Resultado: {match.goals.home} - {match.goals.away}
            </p>

            <p>
              Minuto: {match.fixture.status.elapsed || "-"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
