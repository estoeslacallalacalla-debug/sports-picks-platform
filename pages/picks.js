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

          const leagueId =
            match.league.id;

          const season =
            match.league.season;

          const res =
            await fetch(
              `/api/teamStats?teamId=${teamId}&leagueId=${leagueId}&season=${season}`
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
      <h1
        style={{
          color: "#2563eb"
        }}
      >
        🔥 Picks IA REAL
      </h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap"
        }}
      >
        <button
          onClick={() =>
            setFilter("all")
          }
        >
          🌐 Todas
        </button>

        <button
          onClick={() =>
            setFilter("male")
          }
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
          if (
            filter === "female" &&
            !match.isFemale
          ) {
            return false;
          }

          if (
            filter === "male" &&
            match.isFemale
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
        .slice(0, 15)
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
                borderRadius:
                  "12px",
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
                  🔥 PICK TOP
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
                    background:
                      "#f3f4f6",
                    padding:
                      "10px",
                    borderRadius:
                      "10px",
                    marginTop:
                      "10px"
                  }}
                >
                  <p>
                    ⚽ Promedio
                    goles:{" "}
                    {
                      teamStats.promedioGoles
                    }
                  </p>

                  <p>
                    🛡️ Goles
                    encajados:{" "}
                    {
                      teamStats.golesEncajados
                    }
                  </p>

                  <p>
                    🔥 Over 2.5:{" "}
                    {
                      teamStats.over25
                    }
                  </p>

                  <p>
                    🎯 BTTS:{" "}
                    {
                      teamStats.btts
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
