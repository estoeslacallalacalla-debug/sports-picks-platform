import { useEffect, useState } from "react";

export default function Picks() {
  const [matches, setMatches] =
    useState([]);

  const [stats, setStats] =
    useState({});

  const [
    soloAltaConfianza,
    setSoloAltaConfianza
  ] = useState(false);

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

      analyzedData.forEach(
        async (match) => {
          const teamId =
            match.teams.home.id;

          const res =
            await fetch(
              `/api/teamStats?teamId=${teamId}`
            );

          const data =
            await res.json();

          setStats((prev) => ({
            ...prev,
            [teamId]: data
          }));
        }
      );
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
        .map((match) => {
          const teamId =
            match.teams.home.id;

          const teamStats =
            stats[teamId];

          return (
            <div
              key={match.fixture.id}
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "12px",
                marginTop: "15px",
                border:
                  match.confianza >=
                  90
                    ? "3px solid gold"
                    : "none"
              }}
            >
              {match.confianza >=
                90 && (
                <p
                  style={{
                    color: "gold",
                    fontWeight:
                      "bold"
                  }}
                >
                  🔥 PARTIDO TOP
                </p>
              )}

              <h3>
                🏆{" "}
                {
                  match.league.name
                }
              </h3>

              <p>
                ⚽{" "}
                {
                  match.teams.home
                    .name
                }{" "}
                vs{" "}
                {
                  match.teams.away
                    .name
                }
              </p>

              <p>
                🎯 Mercado:{" "}
                {match.mercado}
              </p>

              <p>
                📊 Confianza:{" "}
                {
                  match.confianza
                }
                %
              </p>

              {teamStats && (
                <div
                  style={{
                    marginTop:
                      "10px",
                    background:
                      "#f3f4f6",
                    padding:
                      "10px",
                    borderRadius:
                      "10px"
                  }}
                >
                  <p>
                    📈 Últimos
                    partidos:
                  </p>

                  <p>
                    {teamStats.resultados.join(
                      " "
                    )}
                  </p>

                  <p>
                    ⚽ Promedio
                    goles:{" "}
                    {
                      teamStats.promedioGoles
                    }
                  </p>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
