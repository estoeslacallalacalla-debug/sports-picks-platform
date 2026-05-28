import { useEffect, useState } from "react";

export default function Picks() {
  const [matches, setMatches] = useState([]);

  const [soloAltaConfianza, setSoloAltaConfianza] =
    useState(false);

  const [filter, setFilter] =
    useState("all");

  useEffect(() => {
    async function cargarPicks() {
      const prematch =
        await fetch("/api/prematch");

      const prematchData =
        await prematch.json();

      const analyzed =
        await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(
            prematchData.response || []
          )
        });

      const analyzedData =
        await analyzed.json();

      setMatches(analyzedData);
    }

    cargarPicks();
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
          const league =
            match.league.name.toLowerCase();

          const isFemale =
            league.includes("women") ||
            league.includes("fem") ||
            league.includes(
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

          if (
            soloAltaConfianza &&
            match.confianza < 85
          ) {
            return false;
          }

          return true;
        })
        .sort(
          (a, b) =>
            b.confianza - a.confianza
        )
        .slice(0, 10)
        .map((match) => (
          <div
            key={match.fixture.id}
            style={{
              background: "white",
              padding: "15px",
              borderRadius: "12px",
              marginTop: "15px",
              border:
                match.confianza >= 90
                  ? "3px solid gold"
                  : "none"
            }}
          >
            {match.confianza >= 90 && (
              <p
                style={{
                  color: "gold",
                  fontWeight: "bold"
                }}
              >
                🔥 PARTIDO TOP
              </p>
            )}

            <h3>
              🏆 {match.league.name}
            </h3>

            <p>
              ⚽{" "}
              {
                match.teams.home.name
              } vs{" "}
              {
                match.teams.away.name
              }
            </p>

            <p>
              🎯 Mercado:{" "}
              {match.mercado}
            </p>

            <p>
              📊 Confianza:{" "}
              {match.confianza}%
            </p>
          </div>
        ))}
    </div>
  );
}      style={{
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

          return true;
        })
        .map((match) => {
          const confianza =
            calcularConfianza(
              match
            );

          if (
            soloAltaConfianza &&
            confianza < 85
          ) {
            return null;
          }

          const mercado =
            obtenerMercado(
              confianza,
              match.fixture.id
            );

          if (confianza >= 90) {
            fetch(
              `/api/telegram?liga=${encodeURIComponent(
                match.league.name
              )}&partido=${encodeURIComponent(
                match.teams.home.name +
                  " vs " +
                  match.teams.away.name
              )}&mercado=${encodeURIComponent(
                mercado
              )}&confianza=${confianza}%`
            );
          }

          return {
            ...match,
            confianza,
            mercado
          };
        })
        .filter(Boolean)
        .sort(
          (a, b) =>
            b.confianza - a.confianza
        )
        .slice(0, 10)
        .map((match) => (
          <div
            key={match.fixture.id}
            style={{
              background: "white",
              padding: "15px",
              borderRadius: "12px",
              marginTop: "15px",
              border:
                match.confianza >= 90
                  ? "3px solid gold"
                  : "none",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.1)"
            }}
          >
            {match.confianza >= 90 && (
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
              {match.mercado}
            </p>

            <p
              style={{
                color:
                  match.confianza >= 90
                    ? "green"
                    : match.confianza >= 80
                    ? "orange"
                    : "red",
                fontWeight: "bold"
              }}
            >
              {match.confianza >= 90
                ? "🟢"
                : match.confianza >= 80
                ? "🟡"
                : "🔴"}{" "}
              Confianza estimada:{" "}
              {match.confianza}%
            </p>
          </div>
        ))}
    </div>
  );
}
