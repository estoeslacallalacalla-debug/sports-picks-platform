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

  const obtenerMercado = (
    confianza,
    fixtureId
  ) => {
    const mercados = [
      "Más de 2.5 goles",
      "Ambos equipos marcan",
      "Más de 8.5 córners",
      "Menos de 3.5 goles",
      "Más de 3.5 tarjetas",
      "Doble oportunidad local",
      "Gol en la primera parte"
    ];

    return mercados[
      fixtureId % mercados.length
    ];
  };

  const calcularConfianza = (
    match
  ) => {
    const league =
      match.league.name.toLowerCase();

    let confianza = 70;

    if (
      league.includes(
        "libertadores"
      )
    ) {
      confianza += 12;
    }

    if (
      league.includes(
        "champions"
      )
    ) {
      confianza += 12;
    }

    if (
      league.includes(
        "premier"
      )
    ) {
      confianza += 10;
    }

    if (
      league.includes("liga")
    ) {
      confianza += 8;
    }

    if (
      league.includes("women") ||
      league.includes("fem") ||
      league.includes(
        "liga f"
      )
    ) {
      confianza += 7;
    }

    if (
      league.includes(
        "world cup"
      ) ||
      league.includes(
        "mundial"
      )
    ) {
      confianza += 15;
    }

    confianza +=
      match.fixture.id % 10;

    if (confianza > 95) {
      confianza = 95;
    }

    return confianza;
  };

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
}          marginBottom: "20px"
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
}            return false;
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
          const leagueName =
            match.league.name.toLowerCase();

          let confianza =
            70 + (match.fixture.id % 21);

          const isFemale =
            leagueName.includes("women") ||
            leagueName.includes(
              "woman"
            ) ||
            leagueName.includes("fem") ||
            leagueName.includes(
              "liga f"
            );

          const isTopLeague =
            leagueName.includes(
              "champions"
            ) ||
            leagueName.includes(
              "premier"
            ) ||
            leagueName.includes("liga") ||
            leagueName.includes(
              "libertadores"
            ) ||
            leagueName.includes(
              "world cup"
            ) ||
            leagueName.includes(
              "mundial"
            );

          if (isFemale) {
            confianza += 3;
          }

          if (isTopLeague) {
            confianza += 5;
          }

          if (confianza > 95) {
            confianza = 95;
          }

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
