import { useEffect, useState } from "react";

export default function Picks() {
  const [matches, setMatches] = useState([]);
  const [soloAltaConfianza, setSoloAltaConfianza] =
    useState(false);

  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/prematch")
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
        🔥 Picks Recomendados
      </h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px"
        }}
      >
        <button
          onClick={() => setFilter("all")}
        >
          🌐 Todas
        </button>

        <button
          onClick={() => setFilter("male")}
        >
          ⚽ Masculino
        </button>

        <button
          onClick={() =>
            setFilter("female")
          }
        >
          👩 Femenino
        </button>

        <button
          onClick={() =>
            setSoloAltaConfianza(
              !soloAltaConfianza
            )
          }
        >
          ⭐ Alta confianza
        </button>
      </div>

      {matches
        .filter((match) => {
          const confianza =
            70 + (match.fixture.id % 21);

          const leagueName =
            match.league.name.toLowerCase();

          const isFemale =
            leagueName.includes("women") ||
            leagueName.includes(
              "woman"
            ) ||
            leagueName.includes("fem") ||
            leagueName.includes(
              "liga f"
            );

          if (
            filter === "female" &&
            !isFemale
          ) {
            return false;
          }

          if (
            filter === "male" &&
            isFemale
          ) {
            return false;
          }

          if (soloAltaConfianza) {
            return confianza >= 85;
          }

          return true;
        })
        .sort(
          (a, b) =>
            (70 + (b.fixture.id % 21)) -
            (70 + (a.fixture.id % 21))
        )
        .slice(0, 10)
        .map((match) => {
          const confianza =
            70 + (match.fixture.id % 21);

          return (
            <div
              key={match.fixture.id}
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "12px",
                marginTop: "15px",
                border:
                  confianza >= 88
                    ? "3px solid gold"
                    : "none"
              }}
            >
              {confianza >= 88 && (
                <p
                  style={{
                    color: "gold",
                    fontWeight: "bold",
                    fontSize: "18px"
                  }}
                >
                  🔥 PARTIDO TOP
                </p>
              )}

              <h3
                style={{
                  color: "#2563eb"
                }}
              >
                🏆 {match.league.name}
              </h3>

              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "bold"
                }}
              >
                ⚽ {match.teams.home.name} vs{" "}
                {match.teams.away.name}
              </p>

              <p>
                🕒{" "}
                {new Date(
                  match.fixture.date
                ).toLocaleTimeString(
                  "es-ES",
                  {
                    hour: "2-digit",
                    minute: "2-digit"
                  }
                )}
              </p>

              <p>
                🎯 Mercado sugerido:{" "}
                {confianza >= 88
                  ? "Más de 2.5 goles"
                  : confianza >= 82
                  ? "Ambos equipos marcan"
                  : confianza >= 76
                  ? "Más de 1.5 goles"
                  : "Menos de 3.5 goles"}
              </p>

              <p
                style={{
                  color:
                    confianza >= 90
                      ? "green"
                      : confianza >= 80
                      ? "orange"
                      : "red",
                  fontWeight: "bold"
                }}
              >
                {confianza >= 90
                  ? "🟢"
                  : confianza >= 80
                  ? "🟡"
                  : "🔴"}{" "}
                Confianza estimada:{" "}
                {confianza}%
              </p>
            </div>
          );
        })}
    </div>
  );
}
