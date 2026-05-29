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
      <h1>
        🔥 Picks IA REAL
      </h1>

      <button
        onClick={() =>
          setSoloAltaConfianza(
            !soloAltaConfianza
          )
        }
      >
        ⭐ Alta confianza
      </button>

      {matches
        .filter((match) => {
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
                marginTop: "15px",
                borderRadius:
                  "12px"
              }}
            >
              <h3>
                {
                  match.teams.home
                    .name
                }{" "}
                vs{" "}
                {
                  match.teams.away
                    .name
                }
              </h3>

              <p>
                🎯{" "}
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
                <div>
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
